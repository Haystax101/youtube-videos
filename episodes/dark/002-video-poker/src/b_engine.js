import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
import { drawChar, KINDS } from './chars2d.js';
const SCRIPT = await (await fetch('./script.json')).json();

const W = 1080, H = 1920;
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const sstep = (a, b, x) => { const k = clamp((x - a) / (b - a)); return k * k * k * (k * (k * 6 - 15) + 10); };
const lerp = (a, b, k) => a + (b - a) * k;
const V = (x, y, z) => new THREE.Vector3(x, y, z);
function rng(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('gl'), antialias: true, preserveDrawingBuffer: true });
renderer.setSize(W, H, false); renderer.toneMapping = THREE.NoToneMapping;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(50, W / H, 0.05, 160);

// ---------- materials ----------
const RAMP = (() => { const c = document.createElement('canvas'); c.width = 256; c.height = 1; const x = c.getContext('2d');
  for (let i = 0; i < 256; i++) { const u = i / 255; // soft-edged bands: deep shadow / shadow / mid / lit
    let v = 0.50; v = lerp(v, 0.66, sstep(0.36, 0.42, u)); v = lerp(v, 0.86, sstep(0.52, 0.58, u)); v = lerp(v, 1.0, sstep(0.70, 0.76, u));
    const g = Math.round(v * 255); x.fillStyle = `rgb(${g},${g},${g})`; x.fillRect(i, 0, 1, 1); }
  const t = new THREE.CanvasTexture(c); t.minFilter = t.magFilter = THREE.LinearFilter; t.generateMipmaps = false; return t; })();
const RAMP_C = (() => { const c = document.createElement('canvas'); c.width = 256; c.height = 1; const x = c.getContext('2d');
  for (let i = 0; i < 256; i++) { const u = i / 255; let v = 0.6; v = lerp(v, 1.0, sstep(0.46, 0.52, u)); const g = Math.round(v * 255); x.fillStyle = `rgb(${g},${g},${g})`; x.fillRect(i, 0, 1, 1); }
  const t = new THREE.CanvasTexture(c); t.minFilter = t.magFilter = THREE.LinearFilter; t.generateMipmaps = false; return t; })();
const matCache = {};
const toon = (color, o = {}) => new THREE.MeshToonMaterial({ color, gradientMap: RAMP, ...o });
const M = (color) => matCache[color] || (matCache[color] = toon(color));
function canvasTex(w, h, draw, rep) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; if (rep) t.wrapS = t.wrapT = THREE.RepeatWrapping; return t; }
const hsl = (h, s, l, a = 1) => `hsla(${h},${s}%,${l}%,${a})`;

// ---------- ink: inverted hull pushed out in clip space, so lines are a constant pixel width ----------
const INK = new THREE.Color('#0e0b16');
const hullMats = {};
const hullMat = px => hullMats[px] || (hullMats[px] = new THREE.ShaderMaterial({
  uniforms: { thick: { value: px }, res: { value: new THREE.Vector2(W, H) }, col: { value: INK } },
  vertexShader: `uniform float thick; uniform vec2 res;
    void main(){ vec4 c = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      vec3 n = normalize(normalMatrix * normal); vec4 cn = projectionMatrix * vec4(n, 0.0);
      vec2 d = cn.xy; float L = length(d); d = L > 1e-5 ? d / L : vec2(0.0);
      c.xy += d * thick * 1.7 * 2.0 / res * c.w; c.z += 0.0004 * c.w; gl_Position = c; }`,
  fragmentShader: `uniform vec3 col; void main(){ gl_FragColor = vec4(col, 1.0); }`,
  side: THREE.BackSide }));
function hullGeo(geo) { if (geo.userData.hull) return geo.userData.hull; let g = geo.clone(); for (const k of Object.keys(g.attributes)) if (k !== 'position') g.deleteAttribute(k); g = mergeVertices(g, 1e-4); g.computeVertexNormals(); geo.userData.hull = g; return g; }
function ink(mesh, px = 4.5, smooth = true) { const h = new THREE.Mesh(smooth ? hullGeo(mesh.geometry) : mesh.geometry, hullMat(px)); h.userData.noOutline = true; h.userData.isHull = true; mesh.add(h); mesh.userData.hull = h; return mesh; }

// helpers
const ROOT = new THREE.Group(); scene.add(ROOT);
function mesh(geo, mat, x = 0, y = 0, z = 0, parent = ROOT, px = 4.5) { const m = new THREE.Mesh(geo, typeof mat === 'string' ? M(mat) : mat); m.position.set(x, y, z); parent.add(m); if (px) ink(m, px); return m; }
const rbox = (w, h, d, r = 0.015) => new RoundedBoxGeometry(w, h, d, 3, Math.min(r, w / 2.01, h / 2.01, d / 2.01));
const cyl = (rt, rb, h, s = 24) => new THREE.CylinderGeometry(rt, rb, h, s);
const sph = (r, s = 24) => new THREE.SphereGeometry(r, s, Math.round(s * 0.66));

