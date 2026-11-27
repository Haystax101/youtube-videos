// =====================================================================================================
// post: crease lines + noir grade + grain + vignette
// =====================================================================================================
scene.traverse(o => { if (!o.isMesh || o.userData.isHull || o.userData.casterOnly) return; const mm = Array.isArray(o.material) ? o.material[0] : o.material; if (mm.isMeshBasicMaterial || mm.transparent) { o.castShadow = false; return; } o.castShadow = true; o.receiveShadow = true; });
const rtColor = new THREE.WebGLRenderTarget(W, H, { samples: 4, type: THREE.HalfFloatType });
const rtNormal = new THREE.WebGLRenderTarget(W, H); rtNormal.depthTexture = new THREE.DepthTexture(W, H);
const normalMat = new THREE.MeshNormalMaterial();
const post = new THREE.ShaderMaterial({
  uniforms: { tColor: { value: rtColor.texture }, tNormal: { value: rtNormal.texture }, tDepth: { value: rtNormal.depthTexture }, near: { value: camera.near }, far: { value: camera.far }, px: { value: new THREE.Vector2(1 / W, 1 / H) }, inkColor: { value: INK }, time: { value: 0 }, warm: { value: 0 }, expo: { value: 1 } },
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }',
  fragmentShader: `
    uniform sampler2D tColor, tNormal, tDepth; uniform float near, far, time, warm, expo; uniform vec2 px; uniform vec3 inkColor; varying vec2 vUv;
    float lin(vec2 uv){ float d = texture2D(tDepth, uv).x; float z = d * 2.0 - 1.0; return (2.0 * near * far) / (far + near - z * (far - near)); }
    vec3 nrm(vec2 uv){ return texture2D(tNormal, uv).xyz * 2.0 - 1.0; }
    float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
    void main(){
      vec4 col = texture2D(tColor, vUv); col.rgb *= expo;
      float dc = lin(vUv); vec3 nc = nrm(vUv); float e = 0.0;
      vec2 o[8]; o[0]=vec2(1.8,0.); o[1]=vec2(-1.8,0.); o[2]=vec2(0.,1.8); o[3]=vec2(0.,-1.8); o[4]=vec2(1.3,1.3); o[5]=vec2(-1.3,1.3); o[6]=vec2(1.3,-1.3); o[7]=vec2(-1.3,-1.3);
      for (int i = 0; i < 8; i++) { vec2 uv = vUv + o[i] * px; float dn = lin(uv); e = max(e, smoothstep(0.04, 0.08, (dn - dc) / dc));
        e = max(e, smoothstep(0.45, 0.75, 1.0 - dot(nc, nrm(uv)))); }
      float l = dot(col.rgb, vec3(0.299, 0.587, 0.114));
      col.rgb = mix(vec3(l), col.rgb, 1.18);
      col.rgb = (col.rgb - 0.5) * 1.06 + 0.5;
      col.rgb += vec3(0.02, 0.005, -0.015) * smoothstep(0.5, 1.0, l) * warm;
      vec2 q = vUv - 0.5; col.rgb *= 1.0 - 0.18 * smoothstep(0.4, 0.95, length(q * vec2(1.0, 0.72)));
      gl_FragColor = vec4(max(col.rgb, 0.0), 1.0);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }`,
  depthTest: false, depthWrite: false });
const postScene = new THREE.Scene(), postCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
postScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), post));
function draw() {
  const hidden = []; scene.traverse(o => { if ((o.isSprite || o.userData.noOutline || o.userData.noHull) && o.visible) { hidden.push(o); o.visible = false; } });
  for (const G of Object.values(SETS)) if (G.visible) G.traverse(o => { if (o.userData.noHull && o.isMesh && hidden.includes(o)) o.visible = true; });
  scene.overrideMaterial = normalMat; renderer.setClearColor(0x8080ff, 1);
  renderer.setRenderTarget(rtNormal); renderer.clear(); renderer.render(scene, camera);
  scene.overrideMaterial = null; hidden.forEach(o => o.visible = true);
  const cvis = cards.filter(c => c.m.visible); if (cvis.length) { const keep = []; scene.traverse(o => { if (o.visible && o.isMesh) { keep.push(o); o.visible = false; } }); cvis.forEach(c => { c.m.visible = true; c.m.material = c.nmat; });
    renderer.autoClear = false; renderer.render(scene, camera); renderer.autoClear = true; cvis.forEach(c => c.m.material = c.cmat); keep.forEach(o => o.visible = true); }
  renderer.setClearColor(0x000000, 1); renderer.setRenderTarget(rtColor); renderer.clear(); renderer.render(scene, camera);
  renderer.setRenderTarget(null); renderer.render(postScene, postCam);
}
// =====================================================================================================
// captions + labels
// =====================================================================================================
const labelEl = document.getElementById('label'), capEl = document.querySelector('#cap span'), rwEl = document.getElementById('rw');
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
const KEYW = /^(ransomware|hackers|fbi|f|b|i|allegedly|paying|lock|locked|key|criminals|treasury|sanctions|florida|technology|ninety-nine|catch|nothing|paid|quietly|propublica|iran|trap|both|undercover|victim|gang|haggle|bitcoin|six|bill|sixteen|same|arrested|vegas|fraud|twenty|innocent|anyway|markup|backups|police|crime)$/i;
function overlays(t) {
  const inRW = t >= HOOK_END && t < HOOK_END + RW; rwEl.style.opacity = inRW ? 1 : 0;
  let bi = 0; for (let i = 0; i < B.length; i++) if (t >= VB(i) - 0.05) bi = i; const lab = inRW ? '' : SCRIPT.beats[bi] && SCRIPT.beats[bi].label || '';
  labelEl.innerHTML = esc(lab).replace(/\*(.+?)\*/g, '<span class="hot">$1</span>'); labelEl.style.opacity = lab ? 1 : 0;
  if (inRW) { capEl.textContent = ''; return; }
  let wi = -1; for (let i = 0; i < WORDS.length; i++) if (WORDS[i].s <= t + 0.14) wi = i; const wd = WORDS[wi];
  if (!wd || t > wd.e + 0.5) { capEl.textContent = ''; return; }
  const w = wd.w.replace(/[.,!?;:]+$/, ''); capEl.textContent = w.length > 13 ? w.replace(/_/g, '_​') : w; capEl.style.fontSize = w.length > 11 ? '72px' : '';
  capEl.className = KEYW.test(w.replace(/['"]/g, '')) ? 'k' : '';
  const a = clamp((t + 0.14 - wd.s) / 0.06); capEl.style.transform = `scale(${0.8 + 0.2 * a + 0.06 * Math.sin(a * Math.PI)})`;
}

// =====================================================================================================
// frame
// =====================================================================================================
const FOG = { office: null, firm: null, fbi: null, vegas: new THREE.Fog('#1a1030', 45, 140) };
// soft interior fill so smooth-shaded sets stay bright and crisp (reference look)
for (const [G, k, c] of [[OFFICE, 0.55, '#e6e8ff'], [FIRM, 0.8, '#fff4e6'], [FBI, 0.7, '#e6e0ff'], [VEGAS, 0.6, '#e0d0ff']]) G.add(new THREE.AmbientLight(c, k));
const STATES = { office: [officeState, OCARD], firm: [firmState, FCARD], fbi: [fbiState, BCARD], vegas: [vegasState, VCARD] };
function renderFrame(t) {
  let ct = t; if (t >= HOOK_END && t < HOOK_END + RW) ct = HOOK_END * (1 - sstep(HOOK_END, HOOK_END + RW, t)) - 0.0001;
  let si = 0; for (let i = 0; i < SHOTS.length; i++) if (ct >= SHOTS[i].t) si = i;
  const s = SHOTS[si], tEnd = SHOTS[si + 1] ? SHOTS[si + 1].t : DUR, k = clamp((ct - s.t) / Math.max(0.01, tEnd - s.t));
  for (const [n, G] of Object.entries(SETS)) G.visible = n === s.set; const G = SETS[s.set]; scene.fog = FOG[s.set];
  const c = s.f(k, ct);
  let shake = 0; if (s.shake !== undefined && ct >= s.shake) shake = Math.exp(-(ct - s.shake) * 5) * 0.09;
  camera.position.copy(c.p).add(G.position); camera.position.x += Math.sin(t * 1.1) * 0.012 + Math.sin(t * 37) * shake; camera.position.y += Math.sin(t * 1.7 + 1) * 0.008 + Math.cos(t * 41) * shake;
  camera.lookAt(c.l.clone().add(G.position)); camera.fov = c.fov; camera.far = 200; post.uniforms.far.value = camera.far; camera.updateProjectionMatrix();
  const wt = ct; // world time (the hook plays its own moment; the rewind runs it backwards)
  for (const [n, [fn, cs]] of Object.entries(STATES)) { if (n === s.set) fn(wt); else for (const cd of Object.values(cs)) hideCard(cd); }
  for (const cd of cards) updateCard(cd, t);
  post.uniforms.time.value = (Math.floor(t * 30) % 97) * 0.37; post.uniforms.warm.value = s.set === 'firm' ? 1 : 0; post.uniforms.expo.value = { office: 1.0, firm: 1.0, fbi: 1.06, vegas: 1.05 }[s.set] || 1.0; window.__shot = si; window.__set = s.set;
  overlays(t); overlays2d(t);
  draw();
}
buildShots(); SHOTS.sort((a, b) => a.t - b.t); await document.fonts.ready;
window.renderFrame = renderFrame; window.DURATION = DUR; renderFrame(0.5); window.READY = true;
window.DBG = { V, camera, SETS, SHOTS, VB, WT, B, cards };
window.SETCHECK = makeSetCheck({ sets: SETS, cards, camera, render: renderFrame, shotSet: () => window.__set });
