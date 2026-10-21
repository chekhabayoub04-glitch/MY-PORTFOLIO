/* ============================================================
   THE EMBLEM — real-time 3D (Three.js r170, ES module), centre of the showreel
   The site's bat path extruded into an obsidian bat on a gold oval,
   lit by a studio environment map plus a "torch" that follows the
   pointer (the shadow-and-light motif in 3D). Scroll turns it.
   Lazy: three.js is only downloaded when the section is near.
============================================================ */
const section = document.getElementById('reel');
const holder = document.querySelector('.reel-emblem');
const canvas = document.getElementById('emblemCanvas');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

// Same geometry as the <symbol id="bat"> in index.html (right half, 200×100 box)
const START = [100, 26];
const RIGHT = [
  ['L', 105, 8], ['L', 111, 28],
  ['Q', 127, 32, 131, 10], ['Q', 146, 34, 198, 24], ['Q', 184, 42, 189, 58],
  ['Q', 171, 51, 160, 75], ['Q', 149, 62, 136, 68], ['Q', 121, 72, 115, 93], ['Q', 107, 79, 100, 99]
];

function batShape(THREE) {
  const X = x => (x - 100) / 50, Y = y => -(y - 50) / 50;
  const shape = new THREE.Shape();
  shape.moveTo(X(START[0]), Y(START[1]));
  for (const [t, ...p] of RIGHT) {
    if (t === 'L') shape.lineTo(X(p[0]), Y(p[1]));
    else shape.quadraticCurveTo(X(p[0]), Y(p[1]), X(p[2]), Y(p[3]));
  }
  // Left half: walk the right half backwards, mirrored on x = 100
  const ends = [START, ...RIGHT.map(s => s.slice(-2))];
  for (let i = RIGHT.length - 1; i >= 0; i--) {
    const [t, ...p] = RIGHT[i];
    const [ex, ey] = ends[i];
    if (t === 'L') shape.lineTo(X(200 - ex), Y(ey));
    else shape.quadraticCurveTo(X(200 - p[0]), Y(p[1]), X(200 - ex), Y(ey));
  }
  return shape;
}

function ellipse(THREE, rx, ry, holeRx, holeRy) {
  const s = new THREE.Shape();
  s.absellipse(0, 0, rx, ry, 0, Math.PI * 2, false, 0);
  if (holeRx) {
    const h = new THREE.Path();
    h.absellipse(0, 0, holeRx, holeRy, 0, Math.PI * 2, true, 0);
    s.holes.push(h);
  }
  return s;
}

async function start() {
  const THREE = await import('three');
  const { RoomEnvironment } = await import('three/addons/environments/RoomEnvironment.js');

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.75));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), .04).texture;
  pmrem.dispose();

  const camera = new THREE.PerspectiveCamera(35, 1, .1, 100);

  // ── Materials ──
  const gold = new THREE.MeshPhysicalMaterial({ color: 0xffc71a, metalness: 1, roughness: .24, clearcoat: .5, clearcoatRoughness: .2 });
  const brushed = new THREE.MeshPhysicalMaterial({ color: 0xd99a00, metalness: 1, roughness: .42 });
  const obsidian = new THREE.MeshPhysicalMaterial({ color: 0x060606, metalness: .55, roughness: .16, clearcoat: 1, clearcoatRoughness: .06 });

  // ── Geometry ──
  const emblem = new THREE.Group();
  const bevel = { bevelEnabled: true, curveSegments: 48 };

  const disc = new THREE.Mesh(new THREE.ExtrudeGeometry(ellipse(THREE, 2.18, 1.22),
    { ...bevel, depth: .12, bevelThickness: .05, bevelSize: .04, bevelSegments: 5 }), gold);
  disc.geometry.center();

  const ring = new THREE.Mesh(new THREE.ExtrudeGeometry(ellipse(THREE, 2.42, 1.42, 2.22, 1.24),
    { ...bevel, depth: .2, bevelThickness: .06, bevelSize: .05, bevelSegments: 6 }), brushed);
  ring.geometry.center();

  const bat = new THREE.Mesh(new THREE.ExtrudeGeometry(batShape(THREE),
    { ...bevel, depth: .16, bevelThickness: .07, bevelSize: .035, bevelSegments: 6 }), obsidian);
  bat.geometry.center();
  bat.scale.setScalar(.98);
  bat.position.z = .16;

  // Mirror the bat onto the back so every angle reads as the emblem
  const batBack = bat.clone();
  batBack.position.z = -.16;
  batBack.rotation.y = Math.PI;

  emblem.add(disc, ring, bat, batBack);
  scene.add(emblem);

  // ── Lights: soft key + the pointer "torch" ──
  scene.add(new THREE.AmbientLight(0xffffff, .15));
  const key = new THREE.DirectionalLight(0xfff1c4, 1.6);
  key.position.set(-3, 4, 5);
  scene.add(key);
  const torch = new THREE.PointLight(0xffe08a, 40, 14, 1.6);
  torch.position.set(0, 0, 3.2);
  scene.add(torch);

  // ── Sizing ──
  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // Fit: emblem ≈ 45% of the width on desktop, ≈ 85% on portrait phones
    const wanted = camera.aspect > 1 ? 12 : 6.4;
    const fov = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    camera.position.set(0, 0, Math.max(wanted / (fov * camera.aspect), 6.5));
    camera.updateProjectionMatrix();
  }
  resize();
  addEventListener('resize', resize, { passive: true });

  // ── Pointer ──
  const pointer = { x: 0, y: 0 };
  section.addEventListener('pointermove', e => {
    const r = canvas.getBoundingClientRect();
    pointer.x = ((e.clientX - r.left) / r.width) * 2 - 1;
    pointer.y = -(((e.clientY - r.top) / r.height) * 2 - 1);
  }, { passive: true });

  let visible = true;
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(section);

  const clock = new THREE.Clock();
  let rotX = 0, rotY = 0;
  renderer.setAnimationLoop(() => {
    if (!visible || document.hidden) return;
    const dt = Math.min(clock.getDelta(), .05);
    const t = clock.elapsedTime;
    const p = +(holder.dataset.progress || .5);

    const spin = reducedMotion ? 0 : Math.sin((p - .5) * Math.PI) * Math.PI * .34;
    rotY += (spin + pointer.x * .45 - rotY) * .06;
    rotX += (-pointer.y * .3 - rotX) * .06;
    emblem.rotation.set(rotX + Math.sin(t * .6) * .04, rotY, Math.sin(t * .4) * .03);
    emblem.position.y = reducedMotion ? 0 : Math.sin(t * .9) * .08;
    const s = .82 + Math.min(p * 3, 1) * .18;
    emblem.scale.setScalar(s);

    torch.position.x += (pointer.x * 4 - torch.position.x) * .1;
    torch.position.y += (pointer.y * 2.4 - torch.position.y) * .1;

    renderer.render(scene, camera);
  });

  holder.classList.add('is-live');
}

if (section && canvas) {
  const io = new IntersectionObserver(([entry]) => {
    if (!entry.isIntersecting) return;
    io.disconnect();
    start().catch(err => console.warn('Emblem 3D unavailable, showing fallback.', err));
  }, { rootMargin: '800px 0px' });
  io.observe(section);
}
