// =====================================================================================================
// post: crease lines + noir grade + grain + vignette
// =====================================================================================================
scene.traverse(o => { if (!o.isMesh || o.userData.isHull || o.userData.casterOnly) return; const mm = Array.isArray(o.material) ? o.material[0] : o.material; if (mm.isMeshBasicMaterial || mm.transparent) { o.castShadow = false; return; } o.castShadow = true; o.receiveShadow = true; });
const rtColor = new THREE.WebGLRenderTarget(W, H, { samples: 4, type: THREE.HalfFloatType });
const rtNormal = new THREE.WebGLRenderTarget(W, H); rtNormal.depthTexture = new THREE.DepthTexture(W, H);
const normalMat = new THREE.MeshNormalMaterial();
const post = new THREE.ShaderMaterial({
  uniforms: { tColor: { value: rtColor.texture }, tNormal: { value: rtNormal.texture }, tDepth: { value: rtNormal.depthTexture }, near: { value: camera.near }, far: { value: camera.far }, px: { value: new THREE.Vector2(1 / W, 1 / H) }, inkColor: { value: INK }, time: { value: 0 }, warm: { value: 0 } },
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }',
  fragmentShader: `
    uniform sampler2D tColor, tNormal, tDepth; uniform float near, far, time, warm; uniform vec2 px; uniform vec3 inkColor; varying vec2 vUv;
    float lin(vec2 uv){ float d = texture2D(tDepth, uv).x; float z = d * 2.0 - 1.0; return (2.0 * near * far) / (far + near - z * (far - near)); }
    vec3 nrm(vec2 uv){ return texture2D(tNormal, uv).xyz * 2.0 - 1.0; }
    float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
    void main(){
      vec4 col = texture2D(tColor, vUv);
      float mx = max(max(col.r, col.g), col.b); if (mx > 1.0) col.rgb = mix(col.rgb / mx, vec3(1.0), clamp((mx - 1.0) * 0.04, 0.0, 0.08));
      float dc = lin(vUv); vec3 nc = nrm(vUv); float e = 0.0;
      vec2 o[8]; o[0]=vec2(1.8,0.); o[1]=vec2(-1.8,0.); o[2]=vec2(0.,1.8); o[3]=vec2(0.,-1.8); o[4]=vec2(1.3,1.3); o[5]=vec2(-1.3,1.3); o[6]=vec2(1.3,-1.3); o[7]=vec2(-1.3,-1.3);
      for (int i = 0; i < 8; i++) { vec2 uv = vUv + o[i] * px; float dn = lin(uv); e = max(e, smoothstep(0.04, 0.08, (dn - dc) / dc));
        e = max(e, smoothstep(0.45, 0.75, 1.0 - dot(nc, nrm(uv)))); }
      col.rgb = mix(col.rgb, inkColor, e * 0.9);
      float l = dot(col.rgb, vec3(0.299, 0.587, 0.114));
      col.rgb = mix(vec3(l), col.rgb, 1.12);
      col.rgb = (col.rgb - 0.5) * 1.1 + 0.5;
      col.rgb += vec3(0.03, 0.005, -0.02) * smoothstep(0.5, 1.0, l) * (1.0 + warm) + vec3(-0.015, 0.0, 0.045) * (1.0 - smoothstep(0.0, 0.5, l));
      vec2 q = vUv - 0.5; col.rgb *= 1.0 - 0.42 * smoothstep(0.3, 0.85, length(q * vec2(1.0, 0.72)));
      col.rgb += (hash(vUv * 1000.0 + time) - 0.5) * 0.045;
      gl_FragColor = vec4(clamp(col.rgb, 0.0, 1.0), 1.0);
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

