// Renderer + post stack for the "smol" look (george's reference, 26 Nov): clean warm lighting, depth of field on
// close-ups, motion-blurred whip pans between quick cuts, soft bloom on practical lights, gentle film grade.
// Glitch-safe by construction (see make-set-video "No glitching in motion"): log depth, MSAA composer, no grain.
//
//   import { makeLook } from '../smol-look/look.js';
//   const L = makeLook(THREE, { canvas, W, H, scene, cam, addons: { EffectComposer, RenderPass, ShaderPass, UnrealBloomPass } });
//   per frame: L.dof(focusDistance, strength);  L.whip(dx, dy);  L.render();
//   strength: 0 = everything sharp, 1 = reference close-up (background well blurred). dx, dy: blur vector in UV units.
//   Objects with userData.noDepth (sprites, points, glows) are hidden from the depth pass.

export function makeLook(THREE, { canvas, W, H, scene, cam, addons, exposure = 1.0, sat = 1.06, warm = 0.0, bloom = 0.22 }) {
  const { EffectComposer, RenderPass, ShaderPass, UnrealBloomPass } = addons;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true, logarithmicDepthBuffer: true });
  renderer.setSize(W, H, false); renderer.toneMapping = THREE.NeutralToneMapping; renderer.toneMappingExposure = exposure;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  // linear view distance for depth of field (works with the log depth buffer, unlike BokehPass)
  const depthRT = new THREE.WebGLRenderTarget(W / 2, H / 2, { type: THREE.HalfFloatType, samples: 0 });
  const depthMat = new THREE.ShaderMaterial({
    vertexShader: `#include <common>
      #include <logdepthbuf_pars_vertex>
      varying float vDist; void main(){ vec4 mv = modelViewMatrix * vec4(position, 1.0); vDist = -mv.z; gl_Position = projectionMatrix * mv;
      #include <logdepthbuf_vertex>
      }`,
    fragmentShader: `#include <logdepthbuf_pars_fragment>
      varying float vDist; void main(){
      #include <logdepthbuf_fragment>
      gl_FragColor = vec4(vDist, 0.0, 0.0, 1.0); }`, side: THREE.DoubleSide });
  const composer = new EffectComposer(renderer, new THREE.WebGLRenderTarget(W, H, { samples: 4, type: THREE.HalfFloatType }));
  composer.addPass(new RenderPass(scene, cam));
  const dofPass = new ShaderPass({
    uniforms: { tDiffuse: { value: null }, tDepth: { value: depthRT.texture }, focus: { value: 3 }, amount: { value: 0 }, res: { value: new THREE.Vector2(W, H) } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: `uniform sampler2D tDiffuse, tDepth; uniform float focus, amount; uniform vec2 res; varying vec2 vUv;
      float coc(float d){ return clamp(abs(d - focus) / max(d, 0.05) * 1.6, 0.0, 1.0); }
      void main(){
        vec4 base = texture2D(tDiffuse, vUv); if (amount < 0.001) { gl_FragColor = base; return; }
        float dc = texture2D(tDepth, vUv).r; float c0 = coc(dc); float maxR = amount * 26.0;
        vec3 acc = base.rgb; float wsum = 1.0;
        for (int i = 1; i < 40; i++) { float fi = float(i); float r = sqrt(fi / 40.0) * maxR; float a = fi * 2.39996;
          vec2 off = vec2(cos(a), sin(a)) * r / res; float ds = texture2D(tDepth, vUv + off).r; float cs = coc(ds);
          // a sample counts if it is blurry enough to reach us; nearer sharp things don't bleed onto blurred background
          float reach = cs * maxR; float w = smoothstep(r - 2.0, r, max(reach, c0 * maxR * step(ds, dc + 0.5)));
          acc += texture2D(tDiffuse, vUv + off).rgb * w; wsum += w; }
        gl_FragColor = vec4(acc / wsum, base.a); }` });
  composer.addPass(dofPass);
  const bloomPass = new UnrealBloomPass(new THREE.Vector2(W / 2, H / 2), bloom, 0.5, 0.88); composer.addPass(bloomPass);
  const grade = new ShaderPass({ uniforms: { tDiffuse: { value: null }, sat: { value: sat }, warm: { value: warm }, blur: { value: new THREE.Vector2() } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: `uniform sampler2D tDiffuse; uniform float sat, warm; uniform vec2 blur; varying vec2 vUv;
      void main(){ vec3 c = vec3(0.0);
        if (length(blur) > 0.0005) { for (int i = -8; i <= 8; i++) c += texture2D(tDiffuse, vUv + blur * float(i) / 8.0).rgb; c /= 17.0; } else c = texture2D(tDiffuse, vUv).rgb;
        float l = dot(c, vec3(0.2126,0.7152,0.0722)); c = mix(vec3(l), c, sat);
        c += vec3(warm, warm * 0.4, -warm * 0.6) * (1.0 - l);          // warm the shadows a touch (filmic, like the reference)
        c = (c - 0.5) * 1.04 + 0.5; vec2 d = vUv - 0.5; c *= 1.0 - dot(d, d) * 0.42;
        gl_FragColor = vec4(clamp(c, 0.0, 1.0), 1.0); }` });
  composer.addPass(grade);
  const hidden = [];
  return {
    renderer, composer, grade, bloomPass, dofPass,
    dof(focus, amount) { dofPass.uniforms.focus.value = focus; dofPass.uniforms.amount.value = amount; },
    whip(dx, dy) { grade.uniforms.blur.value.set(dx, dy); },
    render() {
      if (dofPass.uniforms.amount.value > 0.001) {
        hidden.length = 0; scene.traverse((o) => { if (o.visible && (o.isSprite || o.isPoints || o.userData.noDepth)) { hidden.push(o); o.visible = false; } });
        const bg = scene.background, fog = scene.fog; scene.background = new THREE.Color(1000, 0, 0); scene.fog = null; scene.overrideMaterial = depthMat;
        renderer.setRenderTarget(depthRT); renderer.clear(); renderer.render(scene, cam); renderer.setRenderTarget(null);
        scene.overrideMaterial = null; scene.background = bg; scene.fog = fog; hidden.forEach((o) => (o.visible = true));
      }
      composer.render();
    },
  };
}

// One word at a time, white with a dark outline, centred low-middle (the reference's caption style).
export function captionCSS() { return `#cap{position:absolute;left:0;right:0;top:63%;text-align:center;font:900 92px/1 'Poppins','Arial Black',sans-serif;color:#fff;
  -webkit-text-stroke:14px #15101a;paint-order:stroke fill;letter-spacing:1px;text-shadow:0 6px 0 rgba(0,0,0,.35);transform-origin:50% 60%}`; }
