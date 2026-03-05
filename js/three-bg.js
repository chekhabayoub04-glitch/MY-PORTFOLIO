// ============================================================
// three-bg.js — Batman-themed 3D background
// Flying bat logos + floating geometric shapes + particles
// ============================================================
import * as THREE from 'three';

const canvas   = document.getElementById('three-canvas');
const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);

const scene  = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 1000);
camera.position.z = 22;

// ── Lights ───────────────────────────────────────────────────
scene.add(new THREE.AmbientLight(0x111111, 0.8));
const pl1 = new THREE.PointLight(0xFFD700, 2,   30); pl1.position.set( 5,  5,  5); scene.add(pl1);
const pl2 = new THREE.PointLight(0xFFA500, 1.5, 25); pl2.position.set(-8, -3,  8); scene.add(pl2);

// ── Particles ────────────────────────────────────────────────
const PARTICLE_COUNT = 2000;
const pPos = new Float32Array(PARTICLE_COUNT * 3);
const pCol = new Float32Array(PARTICLE_COUNT * 3);

for (let i = 0; i < PARTICLE_COUNT; i++) {
  pPos[i * 3]     = (Math.random() - .5) * 80;
  pPos[i * 3 + 1] = (Math.random() - .5) * 60;
  pPos[i * 3 + 2] = (Math.random() - .5) * 40;
  // Gold or white-gold particles
  if (Math.random() > .75) { pCol[i*3]=1; pCol[i*3+1]=1;    pCol[i*3+2]=.85; }
  else                      { pCol[i*3]=1; pCol[i*3+1]=.84; pCol[i*3+2]=0;   }
}

const pGeo = new THREE.BufferGeometry();
pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
pGeo.setAttribute('color',    new THREE.BufferAttribute(pCol, 3));

const pMat = new THREE.PointsMaterial({
  size: .1, vertexColors: true, transparent: true, opacity: .6,
  sizeAttenuation: true, blending: THREE.AdditiveBlending, depthWrite: false,
});
scene.add(new THREE.Points(pGeo, pMat));

// ── Floating Shapes ──────────────────────────────────────────
const matSolid = new THREE.MeshStandardMaterial({ color: 0xFFD700, emissive: 0xFDB813, emissiveIntensity: .3, transparent: true, opacity: .6, metalness: .8, roughness: .2 });
const matWire  = new THREE.MeshBasicMaterial({ color: 0xFFD700, wireframe: true, transparent: true, opacity: .18 });

const shapeDefs = [
  [new THREE.TorusGeometry(2, .4, 16, 60),   -12,  4, -8, matWire ],
  [new THREE.OctahedronGeometry(1.8),          10, -2, -6, matSolid],
  [new THREE.IcosahedronGeometry(1.5, 0),      -8, -5, -4, matWire ],
  [new THREE.BoxGeometry(2, 2, 2),             12,  5,-10, matSolid],
  [new THREE.SphereGeometry(1.2, 32, 32),       0,  8,-12, matWire ],
  [new THREE.ConeGeometry(1, 3, 6),           -14,  2, -6, matSolid],
];

const floatingShapes = shapeDefs.map(([geo, x, y, z, mat]) => {
  const mesh = new THREE.Mesh(geo, mat.clone());
  mesh.position.set(x, y, z);
  scene.add(mesh);
  return mesh;
});

// ── Flying Bat Shapes (use provided batman-logo.png texture) ──
const loader = new THREE.TextureLoader();
const batImgTexture = loader.load('images/batman-logo.png');
batImgTexture.encoding = THREE.sRGBEncoding;

const BAT_COUNT = 160;
const batMeshes = [];

for (let i = 0; i < BAT_COUNT; i++) {
  const isAccent = i < 8;
  const size     = isAccent ? (3 + Math.random() * 3) : (.5 + Math.random() * .9);
  const mat = new THREE.MeshBasicMaterial({ map: batImgTexture, transparent: true, side: THREE.DoubleSide, depthWrite: false });
  const geo = new THREE.PlaneGeometry(size, size * .6);
  const bat = new THREE.Mesh(geo, mat);

  // spread across scene
  bat.position.set((Math.random() - .5) * 60, (Math.random() - .5) * 36, (Math.random() - .5) * 30);

  // gentler flapping / slower drift for natural look
  bat.userData = {
    speed:    .001 + Math.random() * .006,
    flapFreq: 1 + Math.random() * 2.2,
    flapAmp:  .04 + Math.random() * .09,
    offset:   Math.random() * Math.PI * 2,
    drift: new THREE.Vector3(
      (Math.random() - .5) * .0012,
      (Math.random() - .5) * .0009,
      (Math.random() - .5) * .0006,
    ),
  };

  scene.add(bat);
  batMeshes.push(bat);
}

// ── Mouse Parallax ───────────────────────────────────────────
let mouseX = 0, mouseY = 0;
document.addEventListener('mousemove', e => {
  mouseX = (e.clientX / innerWidth  - .5) * 2;
  mouseY = (e.clientY / innerHeight - .5) * 2;
});

// ── Animation Loop ───────────────────────────────────────────
const clock = new THREE.Clock();

(function animate() {
  requestAnimationFrame(animate);
  const t = clock.getElapsedTime();

  // Rotate particle cloud slowly
  scene.children[0] && (scene.children[0].rotation && (scene.children[0].rotation.y = t * .02));

  // Animate floating shapes
  floatingShapes.forEach((mesh, i) => {
    const s = .3 + i * .08;
    mesh.rotation.x = t * s * .4;
    mesh.rotation.y = t * s * .6;
    mesh.rotation.z = t * s * .2;
    mesh.position.y += Math.sin(t * .5 + i * 1.2) * .002;
  });

  // Animate bats (gentle flap + drift)
  batMeshes.forEach(bat => {
    const d = bat.userData;
    // Flapping: subtle scaleY oscillation
    bat.scale.y = 1 - d.flapAmp * Math.abs(Math.sin(t * d.flapFreq + d.offset));
    // Slow drift
    bat.position.add(d.drift);
    bat.rotation.y = Math.sin(t * 0.2 + d.offset) * 0.12;
    // Wrap-around if they drift too far
    if (bat.position.x >  40) bat.position.x = -40;
    if (bat.position.x < -40) bat.position.x =  40;
    if (bat.position.y >  26) bat.position.y = -26;
    if (bat.position.y < -26) bat.position.y =  26;
  });

  // Camera parallax with mouse
  camera.position.x += (mouseX * 1.4 - camera.position.x) * .04;
  camera.position.y += (-mouseY * .8  - camera.position.y) * .04;
  camera.lookAt(0, 0, 0);

  renderer.render(scene, camera);
})();

// ── Resize ───────────────────────────────────────────────────
window.addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});
