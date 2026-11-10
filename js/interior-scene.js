// ============================================================
// Casa de Simón I. Patiño — Uncía
// Escena 3D del INTERIOR — recorrido en primera persona
// ============================================================

import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import {
  loadGLB,
  scaleToFit,
  centerOnGround,
  enableShadows,
  disposeObject
} from './glb-loader.js';

// ---------- Puntos de Interés (Hotspots) ----------
// Puedes añadir la propiedad opcional image: './img/foto.jpg' en cualquiera de ellos
const HOTSPOTS = [
  {
    id: 'spot-1',
    label: '1',
    title: 'Vestíbulo Principal',
    description: 'Punto de ingreso interior que conecta los corredores y galerías del palacio patrimonial.',
    position: { x: -7.85, y: 16.00, z: -10.26 }
  },
  {
    id: 'spot-2',
    label: '2',
    title: 'Despacho Administrativo',
    description: 'Espacio de trabajo utilizado durante el apogeo de la explotación minera en Uncía.',
    position: { x: -6.07, y: 16.00, z: -3.49 }
  },
  {
    id: 'spot-3',
    label: '3',
    title: 'Salón de Recepciones',
    description: 'Ambiente diseñado para acoger a diplomáticos y empresarios que visitaban la residencia.',
    position: { x: -4.78, y: 16.00, z: 7.80 }
  },
  {
    id: 'spot-4',
    label: '4',
    title: 'Comedor Principal',
    description: 'Sala de banquetes con acabados en madera de la época e iluminación señorial.',
    position: { x: -9.70, y: 16.00, z: 13.16 }
  },
  {
    id: 'spot-5',
    label: '5',
    title: 'Archivo y Documentación',
    description: 'Sección destinada al resguardo de planos, correspondencia y registros de la empresa.',
    position: { x: -4.85, y: 16.00, z: 23.16 }
  },
  {
    id: 'spot-6',
    label: '6',
    title: 'Dormitorio Principal',
    description: 'Habitación privada de descanso con amueblado de conservación histórica.',
    position: { x: 3.85, y: 16.00, z: 6.89 }
  },
  {
    id: 'spot-7',
    label: '7',
    title: 'Galería de Distribución',
    description: 'Pasillo intermedio que conecta el sector público de la vivienda con las dependencias privadas.',
    position: { x: 3.77, y: 16.00, z: -9.46 }
  },
  {
    id: 'spot-8',
    label: '8',
    title: 'Oratorio Privado',
    description: 'Espacio dedicado al recogimiento espiritual con altar y reliquias religiosas.',
    position: { x: 0.19, y: 16.00, z: -23.99 }
  },
  {
    id: 'spot-9',
    label: '9',
    title: 'Área de Servicios',
    description: 'Zona reservada para la logística de cocina, almacén e insumos de la residencia.',
    position: { x: -7.61, y: 16.00, z: -24.82 }
  }
];

const MODEL_URL = new URL('../models/casa-interior.glb', import.meta.url).href;
const EYE_HEIGHT = 1.65;
const INTERACTION_DISTANCE = 2.8;
const START_POS = { x: -10.63, y: 16.58, z: -13.48 };
const BASE_SPEED = 3.5;
const SPRINT_SPEED = 9.0;

// ---------- Objetos del museo ----------
const PROPS = [
  {
    id: 'piano',
    url: new URL('../models/piano_antiguo.glb', import.meta.url).href,
    position: { x: -6.3, z: 7.8 },
    size: { height: 1.25 },
    rotationY: Math.PI / 2
  },
  {
    id: 'camara-cine',
    url: new URL('../models/camara_cine.glb', import.meta.url).href,
    position: { x: 4.8, z: -9.46 },
    size: { height: 1.4 },
    rotationY: -Math.PI / 2
  },
  {
    id: 'traje',
    url: new URL('../models/traje_patino.glb', import.meta.url).href,
    position: { x: 5.0, z: 6.89 },
    size: { height: 1.75 },
    rotationY: -Math.PI / 2
  },
  {
    id: 'planta-miraflores',
    url: new URL('../models/planta_miraflores.glb', import.meta.url).href,
    position: { x: -3.6, z: 23.16 },
    size: { largest: 1.2 },
    rotationY: 0
  }
];

// ---------- Referencias del DOM ----------
const wrap = document.getElementById('scene-interior');
const loadingEl = wrap.querySelector('.scene-loading');
const noteEl = wrap.querySelector('.model-note');
const enterPrompt = document.getElementById('enter-prompt');
const crosshair = wrap.querySelector('.crosshair');
const touchControls = wrap.querySelector('.touch-controls');
const interactHUD = document.getElementById('interact-hud');
const lightControlPanel = document.getElementById('light-control-panel');

// Selectores corregidos por ID exacto
const panel = document.getElementById('detail-panel');
const panelTitle = document.getElementById('panel-title');
const panelImg = document.getElementById('panel-img');
const panelDesc = document.getElementById('panel-desc');
const panelClose = panel.querySelector('.close-btn');

const isTouch = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;

if (lightControlPanel) {
  lightControlPanel.addEventListener('click', (e) => e.stopPropagation());
}

// ---------- Escena base ----------
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1c140d);
scene.fog = new THREE.Fog(0x1c140d, 8, 35);

const camera = new THREE.PerspectiveCamera(
  60, wrap.clientWidth / wrap.clientHeight, 0.05, 200
);
camera.position.set(START_POS.x, START_POS.y, START_POS.z);
const player = camera;

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(wrap.clientWidth, wrap.clientHeight);
renderer.shadowMap.enabled = true;
renderer.outputColorSpace = THREE.SRGBColorSpace;
wrap.appendChild(renderer.domElement);

const labelRenderer = new CSS2DRenderer();
labelRenderer.setSize(wrap.clientWidth, wrap.clientHeight);
labelRenderer.domElement.style.position = 'absolute';
labelRenderer.domElement.style.top = '0';
labelRenderer.domElement.style.left = '0';
labelRenderer.domElement.style.pointerEvents = 'none';
wrap.appendChild(labelRenderer.domElement);

// ---------- Luces y Panel de Control ----------
const ambientLight = new THREE.AmbientLight(0xffeedd, 0.35);
scene.add(ambientLight);

const pointLights = [];
const posicionesLuces = [
  { x: -7.26, y: 18.50, z: 4.25 },
  { x: -7.04, y: 18.50, z: 13.02 },
  { x: -3.56, y: 18.50, z: 19.38 },
  { x:  2.26, y: 18.50, z: 7.27 },
  { x:  1.80, y: 18.50, z: -23.98 },
  { x: -7.26, y: 18.50, z: -3.38 },
  { x: -6.26, y: 18.50, z: -24.09 },
  { x: -6.68, y: 18.50, z: -14.66 }
];

posicionesLuces.forEach((pos) => {
  const luz = new THREE.PointLight(0xffa843, 12, 12, 2);
  luz.position.set(pos.x, pos.y, pos.z);
  scene.add(luz);
  pointLights.push(luz);
});

const rangePoint = document.getElementById('range-point');
const valPoint = document.getElementById('val-point');
const rangeAmbient = document.getElementById('range-ambient');
const valAmbient = document.getElementById('val-ambient');
const toggleLightPanelBtn = document.getElementById('toggle-light-panel');
const lightPanelContent = document.getElementById('light-panel-content');

let panelExpanded = true;
if (toggleLightPanelBtn && lightPanelContent) {
  toggleLightPanelBtn.addEventListener('click', () => {
    panelExpanded = !panelExpanded;
    lightPanelContent.style.display = panelExpanded ? 'flex' : 'none';
    toggleLightPanelBtn.textContent = panelExpanded ? '−' : '+';
  });
}

if (rangePoint && valPoint) {
  rangePoint.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    valPoint.textContent = val;
    pointLights.forEach((l) => { l.intensity = val; });
  });
}

if (rangeAmbient && valAmbient) {
  rangeAmbient.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    valAmbient.textContent = val;
    ambientLight.intensity = val;
  });
}

// ---------- Habitación de reemplazo (Fallback) ----------
let floorMesh = null;
const collidables = [];

function buildPlaceholderRoom() {
  const group = new THREE.Group();
  const wallMat = new THREE.MeshStandardMaterial({ color: 0x6b5233, roughness: 0.95 });
  const floorMat = new THREE.MeshStandardMaterial({ color: 0x4a3520, roughness: 0.9 });
  const woodMat = new THREE.MeshStandardMaterial({ color: 0x3c2814, roughness: 0.7 });
  const clothMat = new THREE.MeshStandardMaterial({ color: 0x5a2028, roughness: 0.85 });

  const ROOM = 8;
  floorMesh = new THREE.Mesh(new THREE.PlaneGeometry(ROOM, ROOM), floorMat);
  floorMesh.rotation.x = -Math.PI / 2;
  floorMesh.receiveShadow = true;
  group.add(floorMesh);

  const wallH = 3;
  const wallGeoLong = new THREE.BoxGeometry(ROOM, wallH, 0.2);
  const wallGeoShort = new THREE.BoxGeometry(0.2, wallH, ROOM);

  const back = new THREE.Mesh(wallGeoLong, wallMat);
  back.position.set(0, wallH / 2, -ROOM / 2);
  group.add(back); collidables.push(back);

  const front1 = new THREE.Mesh(new THREE.BoxGeometry(ROOM / 2 - 0.6, wallH, 0.2), wallMat);
  front1.position.set(-(ROOM / 4 + 0.3), wallH / 2, ROOM / 2);
  group.add(front1); collidables.push(front1);

  const front2 = front1.clone();
  front2.position.x = ROOM / 4 + 0.3;
  group.add(front2); collidables.push(front2);

  const left = new THREE.Mesh(wallGeoShort, wallMat);
  left.position.set(-ROOM / 2, wallH / 2, 0);
  group.add(left); collidables.push(left);

  const right = new THREE.Mesh(wallGeoShort, wallMat);
  right.position.set(ROOM / 2, wallH / 2, 0);
  group.add(right); collidables.push(right);

  const bench = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.5, 0.7), clothMat);
  bench.position.set(-1.4, 0.25, -2.4);
  group.add(bench); collidables.push(bench);

  const table = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.75, 0.9), woodMat);
  table.position.set(1.6, 0.375, 0.4);
  group.add(table); collidables.push(table);

  enableShadows(group);
  return group;
}

// ---------- Carga de Modelo ----------
let realModelLoaded = false;
let placeholderGroup = null;
let hotspotsPlaced = false;
let settleFrames = 0;

function finishLoading() {
  loadingEl.classList.add('hidden');
}

function setLoadingText(msg) {
  const p = loadingEl.querySelector('p');
  if (p) p.textContent = msg;
}

function showFallback() {
  if (realModelLoaded || placeholderGroup) return;
  placeholderGroup = buildPlaceholderRoom();
  scene.add(placeholderGroup);

  player.position.set(0, EYE_HEIGHT, 3);
  settleFrames = 90;

  finishLoading();
  if (noteEl) noteEl.hidden = false;
  placeHotspots();
}

function onModelProgress(xhr) {
  if (xhr.lengthComputable) {
    const pct = Math.round((xhr.loaded / xhr.total) * 100);
    setLoadingText(`Cargando el interior… ${pct}%`);
  } else {
    setLoadingText(`Cargando el interior… ${(xhr.loaded / 1048576).toFixed(1)} MB`);
  }
}

const fallbackTimer = setTimeout(() => {
  if (!realModelLoaded) showFallback();
}, 90000);

async function loadInterior() {
  try {
    const gltf = await loadGLB(MODEL_URL, onModelProgress);
    clearTimeout(fallbackTimer);
    realModelLoaded = true;

    if (placeholderGroup) {
      scene.remove(placeholderGroup);
      disposeObject(placeholderGroup);
      placeholderGroup = null;
    }
    collidables.length = 0;
    floorMesh = null;

    const model = gltf.scene;
    const houseMeshes = [];
    model.traverse((n) => {
      if (n.isMesh) {
        n.castShadow = true;
        n.receiveShadow = true;
        collidables.push(n);
        houseMeshes.push(n);
        if (!floorMesh && /floor|piso|suelo/i.test(n.name)) floorMesh = n;
      }
    });

    scene.add(model);
    player.position.set(START_POS.x, START_POS.y, START_POS.z);
    settleFrames = 90;

    finishLoading();
    if (noteEl) noteEl.hidden = true;
    placeHotspots();

    loadProps(houseMeshes);
  } catch (error) {
    clearTimeout(fallbackTimer);
    console.error('ERROR AL CARGAR GLB:', MODEL_URL, error.message);
    showFallback();
  }
}

const probeRay = new THREE.Raycaster();
const DOWN = new THREE.Vector3(0, -1, 0);

function findFloorY(x, z, meshes) {
  probeRay.set(new THREE.Vector3(x, START_POS.y + 1, z), DOWN);
  probeRay.far = 12;
  const hits = probeRay.intersectObjects(meshes, false);
  return hits.length ? hits[0].point.y : START_POS.y - EYE_HEIGHT;
}

async function loadProps(houseMeshes) {
  for (const def of PROPS) {
    try {
      const gltf = await loadGLB(def.url);
      const obj = gltf.scene;

      scaleToFit(obj, def.size);
      obj.rotation.y = def.rotationY || 0;
      centerOnGround(obj);

      const holder = new THREE.Group();
      holder.add(obj);
      holder.position.set(
        def.position.x,
        findFloorY(def.position.x, def.position.z, houseMeshes),
        def.position.z
      );

      enableShadows(holder);
      holder.traverse((n) => { if (n.isMesh) collidables.push(n); });
      scene.add(holder);
    } catch (error) {
      console.warn(`No se pudo cargar "${def.id}":`, error.message);
    }
  }
}

loadInterior();

if (noteEl) {
  const closeBtn = noteEl.querySelector('button');
  if (closeBtn) closeBtn.addEventListener('click', () => { noteEl.hidden = true; });
}

// ---------- Hotspots y Panel de Detalle ----------
function placeHotspots() {
  if (hotspotsPlaced) return;
  hotspotsPlaced = true;

  HOTSPOTS.forEach((spot) => {
    const el = document.createElement('div');
    el.className = 'hotspot';
    el.innerHTML = `<span class="hotspot-label">${spot.label}</span>`;
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      openPanel(spot);
    });
    const obj = new CSS2DObject(el);
    obj.position.set(spot.position.x, spot.position.y, spot.position.z);
    scene.add(obj);
  });
}

function openPanel(spot) {
  panelTitle.textContent = spot.title;
  panelDesc.textContent = spot.description;

  if (panelImg) {
    if (spot.image) {
      panelImg.src = spot.image;
      panelImg.hidden = false;
    } else {
      panelImg.removeAttribute('src');
      panelImg.hidden = true;
    }
  }

  panel.classList.add('open');
  clearMoveState();
  if (controlsLocked) controls.unlock();
  if (interactHUD) interactHUD.style.display = 'none';
}

function closePanel() {
  panel.classList.remove('open');
  if (!isTouch) controls.lock();
}
panelClose.addEventListener('click', closePanel);

// ---------- Proximidad y Tecla "E" ----------
let activeHotspot = null;
const spotVec = new THREE.Vector3();

function checkProximityInteraction() {
  if (panel.classList.contains('open')) {
    activeHotspot = null;
    if (interactHUD) interactHUD.style.display = 'none';
    return;
  }

  const playerPos = player.position;
  let nearestSpot = null;
  let minDistance = INTERACTION_DISTANCE;

  HOTSPOTS.forEach((spot) => {
    spotVec.set(spot.position.x, spot.position.y, spot.position.z);
    const dist = playerPos.distanceTo(spotVec);
    if (dist < minDistance) {
      minDistance = dist;
      nearestSpot = spot;
    }
  });

  activeHotspot = nearestSpot;

  if (activeHotspot && interactHUD) {
    if (isTouch) {
      interactHUD.innerHTML = `Toca para examinar: <strong>${activeHotspot.title}</strong>`;
      interactHUD.style.pointerEvents = 'auto';
      interactHUD.onclick = () => openPanel(activeHotspot);
    } else {
      interactHUD.innerHTML = `Presiona <kbd>E</kbd> para examinar: <strong>${activeHotspot.title}</strong>`;
      interactHUD.style.pointerEvents = 'none';
    }
    interactHUD.style.display = 'block';
  } else if (interactHUD) {
    interactHUD.style.display = 'none';
  }
}

// ---------- Controles ----------
const controls = new PointerLockControls(camera, renderer.domElement);
scene.add(camera);
let controlsLocked = false;

const move = { forward: false, back: false, left: false, right: false, sprint: false };

function clearMoveState() {
  move.forward = move.back = move.left = move.right = move.sprint = false;
}

if (!isTouch) {
  enterPrompt.addEventListener('click', () => {
    if (!panel.classList.contains('open')) controls.lock();
  });

  controls.addEventListener('lock', () => {
    controlsLocked = true;
    enterPrompt.style.display = 'none';
    crosshair.style.display = 'block';
  });

  controls.addEventListener('unlock', () => {
    controlsLocked = false;
    crosshair.style.display = 'none';
    if (!panel.classList.contains('open')) enterPrompt.style.display = 'flex';
    clearMoveState();
  });

  document.addEventListener('keydown', (e) => {
    if (e.code === 'KeyE') {
      if (panel.classList.contains('open')) {
        closePanel();
        return;
      } else if (activeHotspot) {
        openPanel(activeHotspot);
        return;
      }
    }

    if (e.code === 'Escape') closePanel();

    switch (e.code) {
      case 'KeyW': case 'ArrowUp': move.forward = true; break;
      case 'KeyS': case 'ArrowDown': move.back = true; break;
      case 'KeyA': case 'ArrowLeft': move.left = true; break;
      case 'KeyD': case 'ArrowRight': move.right = true; break;
      case 'ShiftLeft': case 'ShiftRight': move.sprint = true; break;
    }
  });

  document.addEventListener('keyup', (e) => {
    switch (e.code) {
      case 'KeyW': case 'ArrowUp': move.forward = false; break;
      case 'KeyS': case 'ArrowDown': move.back = false; break;
      case 'KeyA': case 'ArrowLeft': move.left = false; break;
      case 'KeyD': case 'ArrowRight': move.right = false; break;
      case 'ShiftLeft': case 'ShiftRight': move.sprint = false; break;
    }
  });
} else {
  enterPrompt.style.display = 'none';
  touchControls.classList.add('active');

  let lastX = null, lastY = null;
  let yaw = 0, pitch = 0;

  renderer.domElement.addEventListener('touchstart', (e) => {
    lastX = e.touches[0].clientX;
    lastY = e.touches[0].clientY;
  }, { passive: true });

  renderer.domElement.addEventListener('touchmove', (e) => {
    if (lastX === null) return;
    const dx = e.touches[0].clientX - lastX;
    const dy = e.touches[0].clientY - lastY;
    lastX = e.touches[0].clientX;
    lastY = e.touches[0].clientY;
    yaw -= dx * 0.0035;
    pitch -= dy * 0.0035;
    pitch = Math.max(-1.3, Math.min(1.3, pitch));
    camera.rotation.order = 'YXZ';
    camera.rotation.y = yaw;
    camera.rotation.x = pitch;
  }, { passive: true });

  renderer.domElement.addEventListener('touchend', () => { lastX = null; lastY = null; });

  function bindHold(id, key) {
    const btn = document.getElementById(id);
    if (!btn) return;
    const start = (e) => { e.preventDefault(); move[key] = true; };
    const end = () => { move[key] = false; };
    btn.addEventListener('touchstart', start, { passive: false });
    btn.addEventListener('touchend', end);
    btn.addEventListener('touchcancel', end);
  }
  bindHold('btn-forward', 'forward');
  bindHold('btn-back', 'back');
  bindHold('btn-left', 'left');
  bindHold('btn-right', 'right');
}

// ---------- Movimiento y Colisiones ----------
const raycaster = new THREE.Raycaster();
const downRay = new THREE.Raycaster();
const tmpForward = new THREE.Vector3();
const tmpRight = new THREE.Vector3();
const tmpMove = new THREE.Vector3();
const tmpOrigin = new THREE.Vector3();

function tryMove(dt) {
  const currentSpeed = (move.sprint ? SPRINT_SPEED : BASE_SPEED) * dt;

  camera.getWorldDirection(tmpForward);
  tmpForward.y = 0;
  tmpForward.normalize();
  tmpRight.crossVectors(tmpForward, camera.up).normalize();

  tmpMove.set(0, 0, 0);
  if (move.forward) tmpMove.add(tmpForward);
  if (move.back) tmpMove.addScaledVector(tmpForward, -1);
  if (move.right) tmpMove.add(tmpRight);
  if (move.left) tmpMove.addScaledVector(tmpRight, -1);

  if (tmpMove.lengthSq() === 0) return false;

  tmpMove.normalize().multiplyScalar(currentSpeed);

  tmpOrigin.copy(player.position);
  tmpOrigin.y -= EYE_HEIGHT * 0.45;

  if (collidables.length) {
    raycaster.set(tmpOrigin, tmpMove.clone().normalize());
    raycaster.far = tmpMove.length() + 0.4;
    const hits = raycaster.intersectObjects(collidables, false);
    if (hits.length && hits[0].distance < tmpMove.length() + 0.4) return false;
  }

  player.position.add(tmpMove);
  return true;
}

function snapToFloor(dt) {
  downRay.set(
    new THREE.Vector3(player.position.x, player.position.y + 3, player.position.z),
    DOWN
  );
  const targets = floorMesh ? [floorMesh, ...collidables] : collidables;
  if (!targets.length) return;
  const hits = downRay.intersectObjects(targets, false);
  if (hits.length) {
    const targetY = hits[0].point.y + EYE_HEIGHT;
    if (Math.abs(player.position.y - targetY) < 2.0) {
      player.position.y += (targetY - player.position.y) * Math.min(1, dt * 10);
    }
  }
}

// ---------- Bucle Principal ----------
const coordDebugEl = document.getElementById('coord-debug');
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.1);

  if ((controlsLocked || isTouch) && !panel.classList.contains('open')) {
    const moved = tryMove(dt);
    if (moved || settleFrames > 0) {
      snapToFloor(dt);
      if (settleFrames > 0) settleFrames--;
    }
  }

  checkProximityInteraction();

  if (coordDebugEl) {
    const p = camera.position;
    coordDebugEl.textContent = `x: ${p.x.toFixed(2)} · y: ${p.y.toFixed(2)} · z: ${p.z.toFixed(2)}`;
  }

  renderer.render(scene, camera);
  labelRenderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
  camera.aspect = wrap.clientWidth / wrap.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(wrap.clientWidth, wrap.clientHeight);
  labelRenderer.setSize(wrap.clientWidth, wrap.clientHeight);
});