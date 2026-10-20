/* ============================================================
   SHADOW REVEAL — WebGL hero
   Two layers of the same portrait: a near-black silhouette and the
   full-colour photo. A chain of "light blobs" trails the cursor; the
   GLSL shader merges them into one liquid metaball field, warps its
   edge with noise and uses it to mix shadow → light, with a gold rim.
   Falls back to a CSS radial mask if WebGL or the textures fail.
============================================================ */
(() => {
  const figure = document.getElementById('heroPortrait');
  const canvas = document.getElementById('heroCanvas');
  const stage = document.getElementById('heroStage');
  if (!figure || !canvas || !stage) return;

  const BLOBS = 12;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const touchOnly = matchMedia('(hover: none)').matches;

  const VERT = `
    attribute vec2 aPos;
    varying vec2 vUv;
    void main() {
      vUv = vec2(aPos.x * .5 + .5, .5 - aPos.y * .5);
      gl_Position = vec4(aPos, 0., 1.);
    }`;

  const FRAG = `
    precision highp float;
    uniform sampler2D uLight;
    uniform sampler2D uShadow;
    uniform vec2 uRes;
    uniform vec3 uBlobs[${BLOBS}];
    uniform float uTime;
    varying vec2 vUv;

    float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
    float noise(vec2 p) {
      vec2 i = floor(p), f = fract(p);
      vec2 u = f * f * (3. - 2. * f);
      return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x),
                 mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
    }

    void main() {
      vec2 px = vUv * uRes;
      float field = 0.;
      for (int i = 0; i < ${BLOBS}; i++) {
        vec3 b = uBlobs[i];
        vec2 d = px - b.xy;
        field += (b.z * b.z) / (dot(d, d) + 1.);
      }
      // Organic, slowly boiling edge
      float n = noise(px * .012 + uTime * .35) * .6 + noise(px * .03 - uTime * .2) * .4;
      field *= .78 + n * .44;

      float light = smoothstep(.85, 1.65, field);
      float rim = smoothstep(.45, .9, field) * (1. - light);

      vec4 lit = texture2D(uLight, vUv);
      vec4 dark = texture2D(uShadow, vUv);
      vec3 col = mix(dark.rgb, lit.rgb * (1. + light * .06), light);
      col += vec3(1., .78, .12) * rim * .42;
      float a = lit.a;
      gl_FragColor = vec4(col * a, a);
    }`;

  // ── Light chain physics ────────────────────────────────────
  const pointer = { x: 0, y: 0, active: false, last: 0 };
  const blobs = Array.from({ length: BLOBS }, (_, i) => ({ x: 0, y: 0, r: 0, base: 1 - i / (BLOBS + 2) }));
  let width = 0, height = 0, dpr = 1, scale = 1;

  function measure() {
    const rect = figure.getBoundingClientRect();
    dpr = Math.min(devicePixelRatio || 1, 2);
    width = Math.round(rect.width * dpr);
    height = Math.round(rect.height * dpr);
    scale = rect.width / 900;
    canvas.width = width;
    canvas.height = height;
  }

  function onMove(event) {
    const rect = figure.getBoundingClientRect();
    pointer.x = (event.clientX - rect.left) * dpr;
    pointer.y = (event.clientY - rect.top) * dpr;
    pointer.active = event.clientX >= rect.left && event.clientX <= rect.right &&
                     event.clientY >= stage.getBoundingClientRect().top && event.clientY <= rect.bottom;
    pointer.last = performance.now();
    const sr = stage.getBoundingClientRect();
    stage.style.setProperty('--hx', `${((event.clientX - sr.left) / sr.width) * 100}%`);
    stage.style.setProperty('--hy', `${((event.clientY - sr.top) / sr.height) * 100}%`);
  }

  // Autopilot: a slow searchlight over the face when nobody is steering
  function autopilot(t) {
    return {
      x: width * (.47 + Math.sin(t * .00042) * .16),
      y: height * (.26 + Math.sin(t * .00071 + 1.3) * .1)
    };
  }

  function step(t) {
    const idle = touchOnly || t - pointer.last > 3200;
    const target = idle ? autopilot(t) : pointer;
    const on = idle || pointer.active;
    const radius = 54 * scale * dpr;

    blobs.forEach((b, i) => {
      const lead = i === 0 ? target : blobs[i - 1];
      const k = i === 0 ? .2 : .32;
      b.x += (lead.x - b.x) * k;
      b.y += (lead.y - b.y) * k;
      const goal = on ? radius * (i === 0 ? 1 : b.base * .7) : 0;
      b.r += (goal - b.r) * .08;
    });
  }

  // ── CSS fallback ───────────────────────────────────────────
  function startFallback() {
    const light = figure.querySelector('.hero-light');
    const loop = t => {
      step(t);
      const h = blobs[0];
      light.style.setProperty('--rx', `${(h.x / width) * 100}%`);
      light.style.setProperty('--ry', `${(h.y / height) * 100}%`);
      light.style.setProperty('--rr', `${(h.r * 1.5) / dpr}px`);
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  // ── WebGL ──────────────────────────────────────────────────
  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.decoding = 'async';
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  }

  function compile(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader));
    return shader;
  }

  function texture(gl, unit, img) {
    const tex = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
  }

  async function startGL() {
    const gl = canvas.getContext('webgl', { premultipliedAlpha: true, antialias: false, alpha: true });
    if (!gl) throw new Error('no webgl');

    const program = gl.createProgram();
    gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, VERT));
    gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
    gl.useProgram(program);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(program, 'aPos');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const [lightImg, shadowImg] = await Promise.all([
      loadImage(figure.querySelector('.hero-light').currentSrc || figure.querySelector('.hero-light').src),
      loadImage(figure.querySelector('.hero-shadow').currentSrc || figure.querySelector('.hero-shadow').src)
    ]);
    texture(gl, 0, lightImg);   // throws SecurityError on file:// → fallback
    texture(gl, 1, shadowImg);

    const u = name => gl.getUniformLocation(program, name);
    gl.uniform1i(u('uLight'), 0);
    gl.uniform1i(u('uShadow'), 1);
    const uRes = u('uRes'), uBlobs = u('uBlobs'), uTime = u('uTime');
    const packed = new Float32Array(BLOBS * 3);

    let visible = true;
    new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; }).observe(figure);

    const loop = t => {
      requestAnimationFrame(loop);
      if (!visible || document.hidden || stage.dataset.covered) return;
      step(t);
      blobs.forEach((b, i) => { packed[i * 3] = b.x; packed[i * 3 + 1] = b.y; packed[i * 3 + 2] = b.r; });
      gl.viewport(0, 0, width, height);
      gl.uniform2f(uRes, width, height);
      gl.uniform3fv(uBlobs, packed);
      gl.uniform1f(uTime, reducedMotion ? 0 : t / 1000);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    };
    requestAnimationFrame(loop);
    figure.classList.add('gl-ready');
  }

  measure();
  addEventListener('resize', measure, { passive: true });
  addEventListener('pointermove', onMove, { passive: true });
  document.addEventListener('pointerleave', () => { pointer.active = false; });

  startGL().catch(() => {
    figure.classList.remove('gl-ready');
    startFallback();
  });
})();
