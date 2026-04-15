import * as THREE from "https://unpkg.com/three@0.165.0/build/three.module.js";

const canvas = document.getElementById("universeCanvas");
const statusLabel = document.getElementById("sceneStatus");
const toggleButton = document.getElementById("toggleAnimation");
const speedUpButton = document.getElementById("speedUp");
const slowDownButton = document.getElementById("slowDown");

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x05070f);

const camera = new THREE.PerspectiveCamera(65, 1, 0.1, 1000);
camera.position.set(0, 16, 42);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

const ambientLight = new THREE.AmbientLight(0x5f7fb7, 0.8);
scene.add(ambientLight);

const pointLight = new THREE.PointLight(0xfff2cc, 2.2, 350);
scene.add(pointLight);

const sun = new THREE.Mesh(
  new THREE.SphereGeometry(3.2, 48, 48),
  new THREE.MeshStandardMaterial({
    color: 0xffcf73,
    emissive: 0xff8f1f,
    emissiveIntensity: 1.1
  })
);
scene.add(sun);

const starGeometry = new THREE.BufferGeometry();
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const cpuCores = navigator.hardwareConcurrency || 4;
const starCount = reducedMotion ? 650 : Math.max(900, Math.min(1700, cpuCores * 220));
const starPositions = new Float32Array(starCount * 3);
for (let i = 0; i < starCount * 3; i += 3) {
  const radius = 140 + Math.random() * 260;
  const theta = Math.random() * Math.PI * 2;
  const phi = Math.acos(2 * Math.random() - 1);
  starPositions[i] = radius * Math.sin(phi) * Math.cos(theta);
  starPositions[i + 1] = radius * Math.cos(phi);
  starPositions[i + 2] = radius * Math.sin(phi) * Math.sin(theta);
}
starGeometry.setAttribute("position", new THREE.BufferAttribute(starPositions, 3));
const stars = new THREE.Points(
  starGeometry,
  new THREE.PointsMaterial({ color: 0xffffff, size: 0.8, sizeAttenuation: true })
);
scene.add(stars);

function orbitLine(radius) {
  const points = [];
  for (let i = 0; i <= 128; i++) {
    const angle = (i / 128) * Math.PI * 2;
    points.push(new THREE.Vector3(Math.cos(angle) * radius, 0, Math.sin(angle) * radius));
  }
  return new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(points),
    new THREE.LineBasicMaterial({ color: 0x33456f, transparent: true, opacity: 0.65 })
  );
}

const planets = [
  { name: "Mercury", radius: 5.8, size: 0.55, color: 0xb8a48e, speed: 0.018 },
  { name: "Venus", radius: 8.3, size: 0.82, color: 0xe4b56c, speed: 0.013 },
  { name: "Earth", radius: 11.1, size: 0.92, color: 0x5ba3ff, speed: 0.011 },
  { name: "Mars", radius: 14.3, size: 0.72, color: 0xc66a45, speed: 0.009 },
  { name: "Jupiter", radius: 19, size: 1.75, color: 0xd5b28c, speed: 0.0067 },
  { name: "Saturn", radius: 24.7, size: 1.52, color: 0xd8c080, speed: 0.0052 },
  { name: "Uranus", radius: 30.1, size: 1.18, color: 0x91d6e3, speed: 0.0039 },
  { name: "Neptune", radius: 35.8, size: 1.16, color: 0x5f7fff, speed: 0.0032 }
];

const planetMeshes = planets.map((planet, index) => {
  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(planet.size, 32, 32),
    new THREE.MeshStandardMaterial({ color: planet.color, roughness: 0.95, metalness: 0.06 })
  );
  mesh.userData = { angle: index * 0.7, ...planet };
  scene.add(mesh);
  scene.add(orbitLine(planet.radius));
  return mesh;
});

const saturn = planetMeshes.find((p) => p.userData.name === "Saturn");
const saturnRing = new THREE.Mesh(
  new THREE.RingGeometry(1.8, 2.8, 64),
  new THREE.MeshStandardMaterial({
    color: 0xceb485,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.7
  })
);
saturnRing.rotation.x = Math.PI / 2.45;
saturn.add(saturnRing);

let animationEnabled = true;
let speedMultiplier = 1;

function resize() {
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}

window.addEventListener("resize", resize);
resize();

function updateStatus() {
  statusLabel.textContent = `Orbit speed: ${speedMultiplier.toFixed(1)}x`;
}

toggleButton.addEventListener("click", () => {
  animationEnabled = !animationEnabled;
  toggleButton.textContent = animationEnabled ? "Pause Orbit" : "Resume Orbit";
});

speedUpButton.addEventListener("click", () => {
  speedMultiplier = Math.min(4, speedMultiplier + 0.2);
  updateStatus();
});

slowDownButton.addEventListener("click", () => {
  speedMultiplier = Math.max(0.2, speedMultiplier - 0.2);
  updateStatus();
});

const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();

  sun.rotation.y += delta * 0.22;
  stars.rotation.y += delta * 0.01;

  if (animationEnabled) {
    planetMeshes.forEach((planet) => {
      const { radius, speed } = planet.userData;
      planet.userData.angle += delta * speed * 55 * speedMultiplier;
      const angle = planet.userData.angle;
      planet.position.set(Math.cos(angle) * radius, 0, Math.sin(angle) * radius);
      planet.rotation.y += delta * 0.8;
    });
  }

  renderer.render(scene, camera);
}

animate();
updateStatus();
