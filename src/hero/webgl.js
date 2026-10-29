// The capable-desktop path: the walking video on a full-panel plane with
// one fragment shader that does a 2.5D depth parallax (the street moves more
// than Ayoub), the light, the sodium edge, film grain and a vignette.
// Depth comes from a 4x4 atlas of maps (walk frames 0, 8, ..., 112, 119);
// the shader blends the two nearest maps for where the video is in the walk,
// so the parallax never jumps.
import {
  Mesh, NoColorSpace, OrthographicCamera, PlaneGeometry, Scene, ShaderMaterial,
  Texture, Vector2, Vector3, VideoTexture, WebGLRenderer,
} from 'three';

const KEYS = [0, 8, 16, 24, 32, 40, 48, 56, 64, 72, 80, 88, 96, 104, 112, 119];
const MAX_SHIFT = 16;   // px at the far edge

const vertexShader = /* glsl */`
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }
`;

const fragmentShader = /* glsl */`
  precision highp float;
  uniform sampler2D uFrame, uDepth;
  uniform float uTileA, uTileB, uMix, uFloor, uOpen, uOn, uTime, uZoom, uMax;
  uniform vec2 uRes, uMouse;
  uniform vec3 uLight;   // x, y (px, origin bottom-left), radius px
  varying vec2 vUv;

  vec2 tile(vec2 uv, float i) {
    float col = mod(i, 4.0), row = floor(i / 4.0);
    return vec2((col + uv.x) / 4.0, 1.0 - (row + 1.0 - uv.y) / 4.0);
  }
  float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }

  void main() {
    float d = mix(texture2D(uDepth, tile(vUv, uTileA)).r, texture2D(uDepth, tile(vUv, uTileB)).r, uMix);
    // near (white) moves 35% as much as far (black)
    vec2 shift = uMouse * uMax * (0.35 + 0.65 * (1.0 - d)) / uRes;
    vec2 uv = (vUv - 0.5) / uZoom + 0.5 + shift;
    vec3 col = texture2D(uFrame, uv).rgb;

    vec2 p = vUv * uRes;
    float dist = distance(p, uLight.xy);
    float spot = 1.0 - smoothstep(uLight.z * 0.32, uLight.z, dist);
    float vis = mix(mix(uFloor, 1.0, spot), 1.0, uOpen);
    float edge = smoothstep(uLight.z * 0.5, uLight.z * 0.84, dist) * (1.0 - smoothstep(uLight.z * 0.84, uLight.z, dist));
    col = col * vis * uOn + vec3(0.949, 0.639, 0.227) * edge * 0.07 * (1.0 - uOpen) * uOn;

    vec2 q = vUv - 0.5;
    col *= 1.0 - dot(q, q) * 0.55;
    col += (hash(floor(p) + fract(uTime) * 91.0) - 0.5) * 0.045;
    gl_FragColor = vec4(col, 1.0);
  }
`;

export function webglCapable() {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
  if (innerWidth < 1024) return false;
  if ((navigator.hardwareConcurrency || 0) < 4) return false;
  if (navigator.deviceMemory && navigator.deviceMemory < 4) return false;
  try {
    const gl = document.createElement('canvas').getContext('webgl2');
    if (!gl) return false;
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return true;
  } catch { return false; }
}

const loadImage = url => new Promise((res, rej) => {
  const img = new Image();
  img.onload = () => img.decode().then(() => res(img), () => res(img));
  img.onerror = () => rej(new Error(`Could not load ${url}`));
  img.src = url;
});

/** Resolves to the GL renderer, or rejects (missing depth atlas, no WebGL) so the 2D path stays. */
export async function createGL(mount, video) {
  const atlasImg = await loadImage('/hero/depth-atlas.webp');

  const renderer = new WebGLRenderer({ antialias: false, alpha: false, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  renderer.domElement.className = 'stage-gl';
  renderer.domElement.setAttribute('aria-hidden', 'true');

  const frame = new VideoTexture(video);
  frame.colorSpace = NoColorSpace;
  const depth = new Texture(atlasImg);
  depth.colorSpace = NoColorSpace;
  depth.needsUpdate = true;

  const uniforms = {
    uFrame: { value: frame }, uDepth: { value: depth },
    uTileA: { value: 0 }, uTileB: { value: 1 }, uMix: { value: 0 },
    uFloor: { value: .07 }, uOpen: { value: 0 }, uOn: { value: 0 }, uTime: { value: 0 },
    uZoom: { value: 1.045 }, uMax: { value: MAX_SHIFT },
    uRes: { value: new Vector2(1, 1) }, uMouse: { value: new Vector2() },
    uLight: { value: new Vector3() },
  };
  const scene = new Scene();
  scene.add(new Mesh(new PlaneGeometry(2, 2), new ShaderMaterial({ uniforms, vertexShader, fragmentShader })));
  const camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);

  // Compile now so a shader error falls back to 2D instead of failing later
  renderer.compile(scene, camera);
  const gl = renderer.getContext();
  if (gl.isContextLost()) throw new Error('WebGL context lost');
  mount.append(renderer.domElement);

  let w = 1, h = 1;
  return {
    resize(width, height) {
      w = width; h = height;
      renderer.setSize(width, height, false);
      renderer.domElement.style.width = renderer.domElement.style.height = '100%';
      uniforms.uRes.value.set(width, height);
    },
    /**
     * @param f     where the video is in the walk, as a frame 0..119 (for the depth blend)
     * @param light spotlight state (stage-normalised x/y, mouse -1..1, on)
     * @param open  0..1 light fully open
     */
    render(f, light, open, time) {
      if (video.readyState < 2) return;
      let a = 0;
      while (a < KEYS.length - 2 && KEYS[a + 1] <= f) a++;
      uniforms.uTileA.value = a;
      uniforms.uTileB.value = a + 1;
      uniforms.uMix.value = Math.min(1, Math.max(0, (f - KEYS[a]) / (KEYS[a + 1] - KEYS[a])));
      const base = w * .62;
      const r = base + open * (Math.hypot(w, h) * 1.1 - base);
      uniforms.uLight.value.set(light.x * w, (1 - light.y) * h, r * (.25 + .75 * light.on));
      uniforms.uFloor.value = .07 + open * .93;
      uniforms.uOpen.value = open;
      uniforms.uOn.value = .35 + .65 * light.on;
      uniforms.uMouse.value.set(-light.mx, light.my);
      uniforms.uTime.value = time;
      renderer.render(scene, camera);
    },
    dispose() { renderer.dispose(); renderer.domElement.remove(); },
  };
}
