// ============================================================
// CASA DE SIMÓN I. PATIÑO — UNCÍA
// ESCENA 3D EXTERIOR
// ============================================================

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import {
  loadGLB,
  scaleToFit,
  centerOnGround,
  enableShadows,
  disposeObject
} from './glb-loader.js';

const MODEL_URL    = new URL('../models/casa-exterior.glb', import.meta.url).href;
const CARRIAGE_URL = new URL('../models/carruaje.glb', import.meta.url).href;

const HOUSE_TARGET_SIZE = 14;
const CARRIAGE_RATIO = 0.2;

const wrap = document.getElementById('scene-exterior');
if (!wrap) throw new Error('No se encontró el contenedor #scene-exterior');

const loadingEl = wrap.querySelector('.scene-loading');
const noteEl = wrap.querySelector('.model-note');

// ---------- Escena y Cámara ----------
const scene = new THREE.Scene();
scene.background = makeSkyTexture('#3B4A5A', '#C9A876');
scene.fog = new THREE.Fog(0x8a7458, 18, 90);

const width = wrap.clientWidth || 800;
const height = wrap.clientHeight || 500;

const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 500);
camera.position.set(9, 5, 11);

// ---------- Renderizador ----------
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(width, height);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
wrap.appendChild(renderer.domElement);

// ---------- Controles ----------
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.07;
controls.maxPolarAngle = Math.PI * 0.495;
controls.minDistance = 2;
controls.maxDistance = 60;
controls.target.set(0, 1.5, 0);
controls.update();

// ---------- Iluminación ----------
const hemi = new THREE.HemisphereLight(0xdfe6ee, 0x6b5638, 0.8);
scene.add(hemi);

const sun = new THREE.DirectionalLight(0xffe9c7, 2.1);
sun.position.set(12, 16, 6);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = -25;
sun.shadow.camera.right = 25;
sun.shadow.camera.top = 25;
sun.shadow.camera.bottom = -25;
sun.shadow.bias = -0.0004;
scene.add(sun);

// ---------- Suelo y Cerros ----------
const ground = new THREE.Mesh(
  new THREE.CircleGeometry(60, 48),
  new THREE.MeshStandardMaterial({ color: 0x8a7048, roughness: 1 })
);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

const yard = new THREE.Mesh(
  new THREE.CircleGeometry(7.5, 40),
  new THREE.MeshStandardMaterial({ color: 0x9c8f78, roughness: 1 })
);
yard.rotation.x = -Math.PI / 2;
yard.position.y = 0.02;
yard.receiveShadow = true;
scene.add(yard);

const hillMat = new THREE.MeshStandardMaterial({ color: 0x6e5a3f, roughness: 1 });
for (let i = 0; i < 10; i++) {
  const angle = (i / 10) * Math.PI * 2;
  const distance = 34 + Math.random() * 18;
  const hill = new THREE.Mesh(
    new THREE.ConeGeometry(9 + Math.random() * 7, 7 + Math.random() * 10, 6),
    hillMat
  );
  hill.position.set(Math.cos(angle) * distance, -1, Math.sin(angle) * distance);
  hill.rotation.y = Math.random() * Math.PI;
  scene.add(hill);
}

// ---------- Casa de Reemplazo (Fallback) ----------
function buildPlaceholderHouse() {
  const group = new THREE.Group();
  const wallMat = new THREE.MeshStandardMaterial({ color: 0xe5d3b4, roughness: 0.9 });
  const roofMat = new THREE.MeshStandardMaterial({ color: 0x713e32, roughness: 0.85 });
  const doorMat = new THREE.MeshStandardMaterial({ color: 0x50301c });
  const windowMat = new THREE.MeshStandardMaterial({ color: 0x354b5a, metalness: 0.2, roughness: 0.3 });

  const base = new THREE.Mesh(
    new THREE.BoxGeometry(9, 0.3, 7),
    new THREE.MeshStandardMaterial({ color: 0x777064 })
  );
  base.position.y = 0.15;
  group.add(base);

  const walls = new THREE.Mesh(new THREE.BoxGeometry(8, 3.5, 6), wallMat);
  walls.position.y = 2;
  group.add(walls);

  const roof = new THREE.Mesh(new THREE.ConeGeometry(6.2, 2.8, 4), roofMat);
  roof.position.y = 5.15;
  roof.rotation.y = Math.PI / 4;
  group.add(roof);

  const door = new THREE.Mesh(new THREE.BoxGeometry(1.2, 2.3, 0.15), doorMat);
  door.position.set(0, 1.45, 3.08);
  group.add(door);

  for (const x of [-2.5, 2.5]) {
    const windowMesh = new THREE.Mesh(new THREE.BoxGeometry(1.3, 1.2, 0.12), windowMat);
    windowMesh.position.set(x, 2.4, 3.08);
    group.add(windowMesh);

    const frame = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.4, 0.08), doorMat);
    frame.position.set(x, 2.4, 3.01);
    group.add(frame);
  }

  for (let i = 0; i < 3; i++) {
    const step = new THREE.Mesh(
      new THREE.BoxGeometry(2, 0.2, 0.55),
      new THREE.MeshStandardMaterial({ color: 0x77716a })
    );
    step.position.set(0, 0.2 + i * 0.2, 3.5 + i * 0.5);
    group.add(step);
  }

  enableShadows(group);
  return group;
}

// ---------- Posicionamiento y Cámara ----------
function frameCamera(size) {
  const maxDimension = Math.max(size.x, size.y, size.z);
  const distance = maxDimension * 1.5;

  controls.target.set(0, size.y * 0.4, 0);
  camera.position.set(distance, Math.max(size.y * 0.55, 3), distance);

  controls.minDistance = Math.max(maxDimension * 0.15, 1);
  controls.maxDistance = maxDimension * 5;
  controls.update();
}

function placeHouse(obj, { normalize }) {
  if (normalize && HOUSE_TARGET_SIZE) {
    scaleToFit(obj, { horizontal: HOUSE_TARGET_SIZE });
  }
  if (!centerOnGround(obj)) {
    throw new Error('El modelo no tiene geometría visible.');
  }
  const box = new THREE.Box3().setFromObject(obj);
  frameCamera(box.getSize(new THREE.Vector3()));
  return box;
}

// ---------- Carga de Modelos ----------
let activeModel = null;
let realModelLoaded = false;
let fallbackShown = false;

function finishLoading() {
  if (loadingEl) loadingEl.classList.add('hidden');
}

function setLoadingText(message) {
  const p = loadingEl ? loadingEl.querySelector('p') : null;
  if (p) p.textContent = message;
}

function showFallback() {
  if (realModelLoaded || fallbackShown) return;
  fallbackShown = true;
  activeModel = buildPlaceholderHouse();
  scene.add(activeModel);
  placeHouse(activeModel, { normalize: false });
  finishLoading();
  if (noteEl) noteEl.hidden = false;
}

function onProgress(label) {
  return (xhr) => {
    if (xhr.lengthComputable) {
      const percent = Math.round((xhr.loaded / xhr.total) * 100);
      setLoadingText(`${label} (${percent}%)`);
    } else {
      setLoadingText(`${label} ${(xhr.loaded / 1048576).toFixed(1)} MB`);
    }
  };
}

const fallbackTimer = setTimeout(() => {
  if (!realModelLoaded) showFallback();
}, 90000);

async function loadHouse() {
  try {
    const gltf = await loadGLB(MODEL_URL, onProgress('Cargando modelo 3D'));
    clearTimeout(fallbackTimer);

    const model = gltf.scene;
    enableShadows(model);
    const box = placeHouse(model, { normalize: true });

    if (activeModel) {
      scene.remove(activeModel);
      disposeObject(activeModel);
    }

    activeModel = model;
    realModelLoaded = true;
    scene.add(model);
    finishLoading();
    if (noteEl) noteEl.hidden = true;
    return box;
  } catch (error) {
    clearTimeout(fallbackTimer);
    console.error('ERROR AL CARGAR GLB:', MODEL_URL, error.message);
    showFallback();
    return activeModel ? new THREE.Box3().setFromObject(activeModel) : null;
  }
}

async function loadCarriage(houseBox) {
  if (!houseBox) return;
  try {
    const gltf = await loadGLB(CARRIAGE_URL);
    const carriage = gltf.scene;

    const houseSize = houseBox.getSize(new THREE.Vector3());
    scaleToFit(carriage, { largest: Math.max(houseSize.x, houseSize.z) * CARRIAGE_RATIO });
    carriage.rotation.y = -Math.PI / 3;
    centerOnGround(carriage);

    carriage.position.x += houseBox.max.x + 3.5;
    carriage.position.z += houseBox.max.z * 0.5;

    enableShadows(carriage);
    scene.add(carriage);
  } catch (error) {
    console.warn('No se pudo cargar el carruaje:', error.message);
  }
}

loadHouse().then(loadCarriage);

if (noteEl) {
  const closeBtn = noteEl.querySelector('button');
  if (closeBtn) closeBtn.addEventListener('click', () => { noteEl.hidden = true; });
}

function makeSkyTexture(topColor, bottomColor) {
  const canvas = document.createElement('canvas');
  canvas.width = 8;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createLinearGradient(0, 0, 0, 256);
  gradient.addColorStop(0, topColor);
  gradient.addColorStop(1, bottomColor);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 8, 256);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}
animate();

function onResize() {
  const w = wrap.clientWidth;
  const h = wrap.clientHeight;
  if (!w || !h) return;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
}

window.addEventListener('resize', onResize);
if ('ResizeObserver' in window) {
  new ResizeObserver(onResize).observe(wrap);
}