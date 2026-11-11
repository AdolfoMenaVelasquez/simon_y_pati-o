// ============================================================
// CASA DE SIMÓN I. PATIÑO — UNCÍA
// ESCENA 3D EXTERIOR: Sin Carruaje Inicial + Estaciones Dinámicas con Control de Ángulos
// ============================================================

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import {
  loadGLB,
  scaleToFit,
  centerOnGround,
  enableShadows
} from './glb-loader.js';

const MODEL_URL = new URL('../models/casa-exterior.glb', import.meta.url).href;
const HOUSE_TARGET_SIZE = 14;

// ============================================================
// 1. VISTA INICIAL FIJA (ENCUADRE DE TU CAPTURA)
// ============================================================
let INITIAL_CAMERA = {
  position: { x: -2.40, y: 2.35, z: 9.80 },
  target:   { x: -2.10, y: 2.30, z: 0.20 },
  fov: 45,
  rollDeg: 0
};

// ============================================================
// 2. PUNTOS DE ESTACIÓN DINÁMICOS CON ÁNGULOS CONFIGURABLES
// ============================================================
// yawDeg:   Ángulo horizontal (-180° a 180°) alrededor del punto (target)
// pitchDeg: Ángulo vertical (-10° a 85°) de altura de cámara
// distance: Distancia en metros desde el punto de estación
// fov:      Ángulo de lente (menor = más zoom cinematográfico)
// rollDeg:  Inclinación lateral de cámara (-25° a 25°) para dar dinamismo
let STATIONS = [
  {
    id: 'estacion-1',
    number: '1',
    title: 'Estación I · Portada y Letrero Patrimonial',
    desc: 'Ingreso frontal al recinto amurallado de Miraflores, donde Simón I. Patiño edificó la residencia prometida a su esposa Albina Rodríguez Ocampo.',
    target: { x: 1.80, y: 1.90, z: 4.20 },
    yawDeg: 18,
    pitchDeg: 12,
    distance: 6.2,
    fov: 40,
    rollDeg: -2
  },
  {
    id: 'estacion-2',
    number: '2',
    title: 'Estación II · Torreón de Estilo Escocés',
    desc: 'Vista en contrapicado de la emblemática torre de inspiración escocesa y fachada mostaza que dominaba todo el campamento minero de Uncía.',
    target: { x: 0.90, y: 4.50, z: 1.10 },
    yawDeg: -28,
    pitchDeg: -4,
    distance: 7.5,
    fov: 36,
    rollDeg: 4
  },
  {
    id: 'estacion-3',
    number: '3',
    title: 'Estación III · Arcos y Galería de los 73 Ambientes',
    desc: 'Detalle de los ventanales de doble arco que iluminaban los salones decorados con cristales de Venecia y tapices franceses de Bolonia.',
    target: { x: 3.60, y: 2.10, z: 2.60 },
    yawDeg: 42,
    pitchDeg: 16,
    distance: 5.4,
    fov: 38,
    rollDeg: -3
  },
  {
    id: 'estacion-4',
    number: '4',
    title: 'Estación IV · Perspectiva General de Miraflores',
    desc: 'Vista panorámica del palacio y del sector norte de Uncía, junto a los antiguos galpones de los motores diésel alemanes de 1901.',
    target: { x: 0.00, y: 2.20, z: 0.00 },
    yawDeg: -135,
    pitchDeg: 24,
    distance: 14.5,
    fov: 48,
    rollDeg: 0
  }
];

// ============================================================
// 3. MODELOS ADICIONALES (CARRUAJE DESACTIVADO EN EL INICIO)
// ============================================================
let EXTERIOR_MODELS = [
  {
    id: 'carruaje',
    name: 'Carruaje Inglés (1870)',
    file: 'carruaje.glb',
    enabled: false, // <-- Quitado del inicio como pediste
    position: { x: 5.80, y: 0.00, z: 3.20 },
    rotationDeg: -60,
    scale: 2.6,
    snapToGround: true
  },
  {
    id: 'planta_miraflores',
    name: 'Planta Diésel Miraflores',
    file: 'planta_miraflores.glb',
    enabled: false,
    position: { x: -8.50, y: 0.00, z: -6.00 },
    rotationDeg: 45,
    scale: 3.5,
    snapToGround: true
  },
  {
    id: 'el_tio',
    name: 'El Tío de la Mina',
    file: 'el_tio.glb',
    enabled: false,
    position: { x: 2.50, y: 0.00, z: 5.50 },
    rotationDeg: 0,
    scale: 1.5,
    snapToGround: true
  },
  {
    id: 'traje_patino',
    name: 'Traje de Simón I. Patiño',
    file: 'traje_patino.glb',
    enabled: false,
    position: { x: 1.20, y: 0.00, z: 4.80 },
    rotationDeg: 0,
    scale: 1.7,
    snapToGround: true
  },
  {
    id: 'camara_cine',
    name: 'Cámara de Cine',
    file: 'camara_cine.glb',
    enabled: false,
    position: { x: 3.80, y: 0.00, z: 4.50 },
    rotationDeg: -30,
    scale: 1.3,
    snapToGround: true
  },
  {
    id: 'piano_antiguo',
    name: 'Piano Antiguo',
    file: 'piano_antiguo.glb',
    enabled: false,
    position: { x: -4.20, y: 0.00, z: 4.00 },
    rotationDeg: 20,
    scale: 1.6,
    snapToGround: true
  }
];

// Cargar ajustes guardados en el navegador si existen
try {
  const savedCam = JSON.parse(localStorage.getItem('patino_ext_cam_v2'));
  if (savedCam) INITIAL_CAMERA = savedCam;

  const savedStations = JSON.parse(localStorage.getItem('patino_ext_stations_v2'));
  if (Array.isArray(savedStations) && savedStations.length === STATIONS.length) {
    STATIONS = savedStations;
  }
} catch (_) {}

const wrap = document.getElementById('scene-exterior');
if (!wrap) throw new Error('No se encontró el contenedor #scene-exterior');

const loadingEl = wrap.querySelector('.scene-loading');
const noteEl = wrap.querySelector('.model-note');
const heroOverlay = wrap.querySelector('.hero-overlay');

// Permitir arrastrar la escena incluso sobre el área vacía del texto izquierdo
if (heroOverlay) {
  heroOverlay.style.pointerEvents = 'none';
  heroOverlay.querySelectorAll('a, button').forEach((el) => {
    el.style.pointerEvents = 'auto';
  });
}

// ============================================================
// ESCENA, CÁMARA Y RENDERIZADOR
// ============================================================
const scene = new THREE.Scene();
scene.background = makeSkyTexture('#3B4A5A', '#C9A876');
scene.fog = new THREE.Fog(0x8a7458, 22, 110);

const width = wrap.clientWidth || window.innerWidth;
const height = wrap.clientHeight || window.innerHeight;

const camera = new THREE.PerspectiveCamera(INITIAL_CAMERA.fov || 45, width / height, 0.1, 500);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(width, height);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
wrap.appendChild(renderer.domElement);

// ============================================================
// CONTROLES LIBRES (ORBIT + PAN + TECLADO WASD/QE)
// ============================================================
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.07;
controls.enablePan = true;
controls.screenSpacePanning = true;
controls.maxPolarAngle = Math.PI * 0.495;
controls.minDistance = 0.4;
controls.maxDistance = 120;

let currentRollDeg = 0;

function applyInitialCameraInstant() {
  camera.position.set(
    INITIAL_CAMERA.position.x,
    INITIAL_CAMERA.position.y,
    INITIAL_CAMERA.position.z
  );
  controls.target.set(
    INITIAL_CAMERA.target.x,
    INITIAL_CAMERA.target.y,
    INITIAL_CAMERA.target.z
  );
  camera.fov = INITIAL_CAMERA.fov || 45;
  camera.updateProjectionMatrix();
  currentRollDeg = INITIAL_CAMERA.rollDeg || 0;
  controls.update();
}
applyInitialCameraInstant();

// ============================================================
// UTILIDADES DE ÁNGULOS ESFÉRICOS (YAW, PITCH, DISTANCIA <-> POSICIÓN)
// ============================================================
function computeCameraPosFromAngles(target, yawDeg, pitchDeg, distance) {
  const yaw = THREE.MathUtils.degToRad(yawDeg);
  const pitch = THREE.MathUtils.degToRad(pitchDeg);
  const cosPitch = Math.cos(pitch);

  return new THREE.Vector3(
    target.x + distance * Math.sin(yaw) * cosPitch,
    target.y + distance * Math.sin(pitch),
    target.z + distance * Math.cos(yaw) * cosPitch
  );
}

function extractAnglesFromCamera(camPos, targetPos) {
  const offset = new THREE.Vector3().subVectors(camPos, targetPos);
  const distance = Math.max(0.5, offset.length());
  const pitchRad = Math.asin(THREE.MathUtils.clamp(offset.y / distance, -0.99, 0.99));
  const yawRad = Math.atan2(offset.x, offset.z);

  return {
    yawDeg: Math.round(THREE.MathUtils.radToDeg(yawRad)),
    pitchDeg: Math.round(THREE.MathUtils.radToDeg(pitchRad)),
    distance: Number(distance.toFixed(2))
  };
}

// ============================================================
// ILUMINACIÓN, SUELO Y CERROS DE UNCÍA
// ============================================================
const hemi = new THREE.HemisphereLight(0xdfe6ee, 0x6b5638, 0.9);
scene.add(hemi);

const sun = new THREE.DirectionalLight(0xffe9c7, 2.1);
sun.position.set(12, 16, 6);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = -28;
sun.shadow.camera.right = 28;
sun.shadow.camera.top = 28;
sun.shadow.camera.bottom = -28;
sun.shadow.bias = -0.0004;
scene.add(sun);

const ground = new THREE.Mesh(
  new THREE.CircleGeometry(75, 48),
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
  const distance = 36 + (i % 3) * 6;
  const hill = new THREE.Mesh(
    new THREE.ConeGeometry(10 + (i % 4) * 2, 8 + (i % 3) * 3, 6),
    hillMat
  );
  hill.position.set(Math.cos(angle) * distance, -1, Math.sin(angle) * distance);
  hill.rotation.y = i * 0.7;
  scene.add(hill);
}

// ============================================================
// CARGA DE LA CASA EXTERIOR Y MODELOS OPCIONALES
// ============================================================
let activeHouseModel = null;
const surfaceMeshes = [ground, yard];
const loadedProps = new Map();

function finishLoading() {
  if (loadingEl) loadingEl.classList.add('hidden');
}

function setLoadingText(message) {
  const p = loadingEl ? loadingEl.querySelector('p') : null;
  if (p) p.textContent = message;
}

function placeHouseOnGround(obj) {
  if (HOUSE_TARGET_SIZE) {
    scaleToFit(obj, { horizontal: HOUSE_TARGET_SIZE });
  }
  if (!centerOnGround(obj)) {
    throw new Error('El modelo no tiene geometría visible.');
  }
  obj.traverse((n) => {
    if (n.isMesh) {
      if (n.material) {
        const mats = Array.isArray(n.material) ? n.material : [n.material];
        mats.forEach((m) => { m.side = THREE.DoubleSide; });
      }
      surfaceMeshes.push(n);
    }
  });
}

const downRay = new THREE.Raycaster();
const DOWN_VEC = new THREE.Vector3(0, -1, 0);

function getSurfaceHeightAt(x, z) {
  downRay.set(new THREE.Vector3(x, 30, z), DOWN_VEC);
  const hits = downRay.intersectObjects([ground, yard], false);
  return hits.length ? hits[0].point.y : 0;
}

async function spawnOrUpdateProp(def) {
  let entry = loadedProps.get(def.id);

  if (!def.enabled) {
    if (entry) entry.holder.visible = false;
    return null;
  }

  if (!entry) {
    try {
      const url = new URL(`../models/${def.file}`, import.meta.url).href;
      const gltf = await loadGLB(url);
      const rawScene = gltf.scene;
      enableShadows(rawScene);

      const holder = new THREE.Group();
      holder.name = `prop-${def.id}`;
      holder.add(rawScene);
      scene.add(holder);

      entry = { def, holder, rawScene };
      loadedProps.set(def.id, entry);
    } catch (err) {
      console.warn(`No se pudo cargar ${def.file}:`, err.message);
      return null;
    }
  }

  entry.holder.visible = true;
  entry.rawScene.scale.set(1, 1, 1);
  entry.rawScene.position.set(0, 0, 0);
  entry.rawScene.rotation.set(0, 0, 0);

  scaleToFit(entry.rawScene, { largest: def.scale });
  centerOnGround(entry.rawScene);

  const groundY = def.snapToGround ? getSurfaceHeightAt(def.position.x, def.position.z) : 0;
  entry.holder.position.set(
    def.position.x,
    groundY + (def.position.y || 0),
    def.position.z
  );
  entry.holder.rotation.y = THREE.MathUtils.degToRad(def.rotationDeg || 0);

  return entry;
}

async function initExteriorScene() {
  try {
    const gltf = await loadGLB(MODEL_URL, (xhr) => {
      if (xhr.lengthComputable) {
        const pct = Math.round((xhr.loaded / xhr.total) * 100);
        setLoadingText(`Cargando el modelo 3D (${pct}%)…`);
      }
    });

    activeHouseModel = gltf.scene;
    enableShadows(activeHouseModel);
    placeHouseOnGround(activeHouseModel);
    scene.add(activeHouseModel);

    applyInitialCameraInstant();
    finishLoading();

    for (const def of EXTERIOR_MODELS) {
      if (def.enabled) await spawnOrUpdateProp(def);
    }
  } catch (error) {
    console.error('Error al cargar casa-exterior.glb:', error.message);
    finishLoading();
    if (noteEl) noteEl.hidden = false;
  }
}

initExteriorScene();

// ============================================================
// MARCADORES 3D Y TRANSICIÓN DINÁMICA ENTRE PUNTOS DE ESTACIÓN
// ============================================================
const stationsLayer = document.createElement('div');
stationsLayer.style.cssText = 'position:absolute; inset:0; pointer-events:none; z-index:12; overflow:hidden;';
wrap.appendChild(stationsLayer);

// Tarjeta flotante de información cuando visitas una estación
const stationCard = document.createElement('div');
stationCard.style.cssText = `
  position: absolute; bottom: 82px; right: 24px; z-index: 20;
  width: min(370px, 90vw); background: rgba(28, 19, 12, 0.94);
  border: 1px solid #C9803F; border-left: 4px solid #DFC07A;
  border-radius: 6px; padding: 16px 18px; color: #F0E6D2;
  box-shadow: 0 14px 40px rgba(0,0,0,0.75);
  display: none; pointer-events: auto; backdrop-filter: blur(8px);
`;
stationCard.innerHTML = `
  <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
    <span id="st-card-badge" style="font-size:0.7rem; letter-spacing:0.12em; text-transform:uppercase; color:#DFC07A; font-weight:700;">ESTACIÓN</span>
    <button type="button" id="st-card-close" style="background:none; border:none; color:#ACA79B; cursor:pointer; font-size:0.95rem;">✕</button>
  </div>
  <h3 id="st-card-title" style="font-family:var(--font-display, Georgia, serif); font-size:1.25rem; margin:0 0 6px; color:#fff;"></h3>
  <p id="st-card-desc" style="font-size:0.86rem; line-height:1.55; color:#E4D5B6; margin:0 0 12px;"></p>
  <div style="display:flex; justify-content:space-between; gap:8px;">
    <button type="button" id="st-card-prev" style="background:#2E1D10; color:#F0E6D2; border:1px solid #756F62; padding:6px 12px; border-radius:4px; cursor:pointer; font-size:0.75rem;">← Anterior</button>
    <button type="button" id="st-card-home" style="background:#2E1D10; color:#DFC07A; border:1px solid #C9803F; padding:6px 12px; border-radius:4px; cursor:pointer; font-size:0.75rem;">Vista Inicio</button>
    <button type="button" id="st-card-next" style="background:#A15A2A; color:#fff; border:none; padding:6px 12px; border-radius:4px; cursor:pointer; font-size:0.75rem; font-weight:600;">Siguiente →</button>
  </div>
`;
wrap.appendChild(stationCard);

// Barra inferior de selección rápida de estaciones
const stationBar = document.createElement('div');
stationBar.style.cssText = `
  position: absolute; bottom: 20px; right: 24px; z-index: 20;
  display: flex; gap: 6px; flex-wrap: wrap; align-items: center;
  background: rgba(24, 16, 10, 0.9); border: 1px solid rgba(201,128,63,0.45);
  padding: 7px 12px; border-radius: 6px; pointer-events: auto;
  box-shadow: 0 8px 25px rgba(0,0,0,0.65);
`;
wrap.appendChild(stationBar);

let activeStationIndex = -1; // -1 = Vista Inicio
let autoTourTimer = null;
let camTransition = null;

// Crear botones de marcadores 3D en pantalla
const markerButtons = [];
function rebuildStationMarkersAndBar() {
  stationsLayer.innerHTML = '';
  stationBar.innerHTML = '';
  markerButtons.length = 0;

  // Botón de Vista Inicio en la barra
  const homeBtn = document.createElement('button');
  homeBtn.type = 'button';
  homeBtn.textContent = '🏠 Inicio';
  homeBtn.style.cssText = getStationBtnStyle(activeStationIndex === -1);
  homeBtn.addEventListener('click', () => goToInitialView());
  stationBar.appendChild(homeBtn);

  STATIONS.forEach((st, idx) => {
    // Marcador 3D flotante sobre el modelo
    const pin = document.createElement('button');
    pin.type = 'button';
    pin.innerHTML = `<span>${st.number}</span>`;
    pin.title = st.title;
    pin.style.cssText = `
      position: absolute; width: 32px; height: 32px; border-radius: 50%;
      background: ${activeStationIndex === idx ? '#DFC07A' : 'rgba(161, 90, 42, 0.92)'};
      color: ${activeStationIndex === idx ? '#140e09' : '#fff'};
      border: 2px solid #F0E6D2; font-weight: 700; font-size: 0.8rem;
      display: flex; align-items: center; justify-content: center;
      transform: translate(-50%, -50%); cursor: pointer; pointer-events: auto;
      box-shadow: 0 0 0 5px rgba(201,128,63,0.25), 0 4px 12px rgba(0,0,0,0.8);
      transition: transform 0.2s ease, background 0.2s ease;
    `;
    pin.addEventListener('mouseenter', () => { pin.style.transform = 'translate(-50%, -50%) scale(1.22)'; });
    pin.addEventListener('mouseleave', () => { pin.style.transform = 'translate(-50%, -50%) scale(1)'; });
    pin.addEventListener('click', (e) => {
      e.stopPropagation();
      stopAutoTour();
      flyToStation(idx);
    });
    stationsLayer.appendChild(pin);
    markerButtons.push({ pin, st });

    // Botón en la barra inferior
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = `Estación ${st.number}`;
    b.style.cssText = getStationBtnStyle(activeStationIndex === idx);
    b.addEventListener('click', () => {
      stopAutoTour();
      flyToStation(idx);
    });
    stationBar.appendChild(b);
  });

  // Botón de Recorrido Automático Dinámico
  const tourBtn = document.createElement('button');
  tourBtn.type = 'button';
  tourBtn.id = 'btn-auto-tour';
  tourBtn.textContent = autoTourTimer ? '⏸ Pausar' : '▶ Recorrido';
  tourBtn.style.cssText = `
    background: ${autoTourTimer ? '#C9803F' : '#402710'};
    color: #F0E6D2; border: 1px solid #C9803F; padding: 6px 11px;
    border-radius: 4px; font-size: 0.75rem; font-weight: 600; cursor: pointer;
  `;
  tourBtn.addEventListener('click', toggleAutoTour);
  stationBar.appendChild(tourBtn);
}

function getStationBtnStyle(isActive) {
  return `
    background: ${isActive ? '#A15A2A' : 'rgba(46, 29, 16, 0.85)'};
    color: #F0E6D2; border: 1px solid ${isActive ? '#DFC07A' : '#756F62'};
    padding: 6px 11px; border-radius: 4px; font-size: 0.75rem;
    font-weight: ${isActive ? '700' : '500'}; cursor: pointer;
  `;
}

// Vuelo cinematográfico con interpolación de Posición, Target, FOV y Roll
function startDynamicCameraFlight(destPos, destTarget, destFov, destRollDeg, duration = 1.45) {
  camTransition = {
    startPos: camera.position.clone(),
    startTarget: controls.target.clone(),
    startFov: camera.fov,
    startRoll: currentRollDeg,
    endPos: destPos.clone(),
    endTarget: destTarget.clone(),
    endFov: destFov,
    endRoll: destRollDeg,
    elapsed: 0,
    duration
  };
}

function flyToStation(index, duration = 1.45) {
  if (index < 0 || index >= STATIONS.length) {
    goToInitialView();
    return;
  }

  activeStationIndex = index;
  const st = STATIONS[index];

  // Si estamos en una estación, atenuar el texto gigante de la izquierda para apreciar la arquitectura
  if (heroOverlay) {
    heroOverlay.style.transition = 'opacity 0.4s ease';
    heroOverlay.style.opacity = '0.18';
  }

  const targetVec = new THREE.Vector3(st.target.x, st.target.y, st.target.z);
  const camPos = computeCameraPosFromAngles(targetVec, st.yawDeg, st.pitchDeg, st.distance);

  startDynamicCameraFlight(camPos, targetVec, st.fov || 42, st.rollDeg || 0, duration);

  // Mostrar tarjeta de la estación
  document.getElementById('st-card-badge').textContent = `PUNTO DE ESTACIÓN ${st.number} · ÁNGULO ${st.yawDeg}°`;
  document.getElementById('st-card-title').textContent = st.title;
  document.getElementById('st-card-desc').textContent = st.desc;
  stationCard.style.display = 'block';

  // Sincronizar el selector del editor si está abierto
  if (selectStationEl) {
    selectStationEl.value = String(index);
    syncStationEditorFields();
  }

  rebuildStationMarkersAndBar();
}

function goToInitialView() {
  stopAutoTour();
  activeStationIndex = -1;
  stationCard.style.display = 'none';

  if (heroOverlay) {
    heroOverlay.style.opacity = '1';
  }

  startDynamicCameraFlight(
    new THREE.Vector3(INITIAL_CAMERA.position.x, INITIAL_CAMERA.position.y, INITIAL_CAMERA.position.z),
    new THREE.Vector3(INITIAL_CAMERA.target.x, INITIAL_CAMERA.target.y, INITIAL_CAMERA.target.z),
    INITIAL_CAMERA.fov || 45,
    INITIAL_CAMERA.rollDeg || 0,
    1.35
  );

  rebuildStationMarkersAndBar();
}

function toggleAutoTour() {
  if (autoTourTimer) {
    stopAutoTour();
  } else {
    const nextIdx = (activeStationIndex + 1) % STATIONS.length;
    flyToStation(nextIdx);
    autoTourTimer = setInterval(() => {
      const n = (activeStationIndex + 1) % STATIONS.length;
      flyToStation(n);
    }, 5200);
    rebuildStationMarkersAndBar();
  }
}

function stopAutoTour() {
  if (autoTourTimer) {
    clearInterval(autoTourTimer);
    autoTourTimer = null;
    rebuildStationMarkersAndBar();
  }
}

document.getElementById('st-card-close').addEventListener('click', () => {
  stationCard.style.display = 'none';
  if (heroOverlay) heroOverlay.style.opacity = '1';
});
document.getElementById('st-card-home').addEventListener('click', goToInitialView);
document.getElementById('st-card-prev').addEventListener('click', () => {
  stopAutoTour();
  const prev = (activeStationIndex - 1 + STATIONS.length) % STATIONS.length;
  flyToStation(prev);
});
document.getElementById('st-card-next').addEventListener('click', () => {
  stopAutoTour();
  const next = (activeStationIndex + 1) % STATIONS.length;
  flyToStation(next);
});

// ============================================================
// MOVIMIENTO LIBRE CON TECLADO (WASD / FLECHAS / Q / E / SHIFT)
// ============================================================
const moveKeys = { forward: false, back: false, left: false, right: false, up: false, down: false, fast: false };

window.addEventListener('keydown', (e) => {
  if (['INPUT', 'SELECT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;

  if (e.code === 'KeyP') {
    toggleEditorPanel();
    return;
  }

  switch (e.code) {
    case 'KeyW': case 'ArrowUp':    moveKeys.forward = true; break;
    case 'KeyS': case 'ArrowDown':  moveKeys.back = true; break;
    case 'KeyA': case 'ArrowLeft':  moveKeys.left = true; break;
    case 'KeyD': case 'ArrowRight': moveKeys.right = true; break;
    case 'KeyE': case 'Space':      moveKeys.up = true; break;
    case 'KeyQ':                    moveKeys.down = true; break;
    case 'ShiftLeft': case 'ShiftRight': moveKeys.fast = true; break;
  }
});

window.addEventListener('keyup', (e) => {
  switch (e.code) {
    case 'KeyW': case 'ArrowUp':    moveKeys.forward = false; break;
    case 'KeyS': case 'ArrowDown':  moveKeys.back = false; break;
    case 'KeyA': case 'ArrowLeft':  moveKeys.left = false; break;
    case 'KeyD': case 'ArrowRight': moveKeys.right = false; break;
    case 'KeyE': case 'Space':      moveKeys.up = false; break;
    case 'KeyQ':                    moveKeys.down = false; break;
    case 'ShiftLeft': case 'ShiftRight': moveKeys.fast = false; break;
  }
});

const tmpForward = new THREE.Vector3();
const tmpRight = new THREE.Vector3();
const tmpDelta = new THREE.Vector3();

function updateFreeKeyboardMovement(dt) {
  if (!moveKeys.forward && !moveKeys.back && !moveKeys.left && !moveKeys.right && !moveKeys.up && !moveKeys.down) {
    return;
  }
  // Si el usuario mueve las teclas manualmente, cancelar el vuelo automático
  camTransition = null;

  const speed = (moveKeys.fast ? 14.0 : 5.5) * dt;
  camera.getWorldDirection(tmpForward);
  tmpForward.y = 0;
  if (tmpForward.lengthSq() > 0) tmpForward.normalize();
  tmpRight.crossVectors(tmpForward, camera.up).normalize();

  tmpDelta.set(0, 0, 0);
  if (moveKeys.forward) tmpDelta.addScaledVector(tmpForward, speed);
  if (moveKeys.back)    tmpDelta.addScaledVector(tmpForward, -speed);
  if (moveKeys.right)   tmpDelta.addScaledVector(tmpRight, speed);
  if (moveKeys.left)    tmpDelta.addScaledVector(tmpRight, -speed);
  if (moveKeys.up)      tmpDelta.y += speed;
  if (moveKeys.down)    tmpDelta.y -= speed;

  camera.position.add(tmpDelta);
  controls.target.add(tmpDelta);
}

// ============================================================
// PANEL EDITOR DE ÁNGULOS DE ESTACIÓN, VISTA INICIAL Y MODELOS (TECLA P)
// ============================================================
let clickPlacementMode = null; // null | 'STATION' | 'PROP'
let selectedPropId = EXTERIOR_MODELS[0].id;
const clickRaycaster = new THREE.Raycaster();
const mouseNDC = new THREE.Vector2();

const editorUI = document.createElement('div');
editorUI.id = 'exterior-editor-ui';
editorUI.innerHTML = `
  <button type="button" id="btn-toggle-editor" style="
    position: absolute; top: 82px; right: 20px; z-index: 30;
    background: rgba(32, 24, 17, 0.94); color: #DFC07A;
    border: 1px solid #C9803F; border-radius: 4px;
    padding: 8px 14px; font-family: inherit; font-size: 0.8rem; font-weight: 600;
    cursor: pointer; box-shadow: 0 4px 14px rgba(0,0,0,0.6);">
    🛠️ Ángulos de Estaciones y Escena (P)
  </button>

  <div id="editor-drawer" hidden style="
    position: absolute; top: 124px; right: 20px; z-index: 30;
    width: min(355px, 92vw); max-height: calc(100vh - 145px); overflow-y: auto;
    background: rgba(22, 15, 10, 0.96); color: #F0E6D2;
    border: 1px solid #C9803F; border-radius: 6px;
    padding: 16px; font-size: 0.78rem; line-height: 1.45;
    box-shadow: 0 14px 40px rgba(0,0,0,0.85);">

    <!-- SECCIÓN 1: EDITOR DE PUNTOS DE ESTACIÓN Y ÁNGULOS -->
    <div style="font-weight:700; color:#DFC07A; margin-bottom:8px; border-bottom:1px solid rgba(201,128,63,0.35); padding-bottom:5px;">
      🎯 1. Modificar Puntos de Estación y Ángulos
    </div>

    <label style="display:block; margin-bottom:8px;">
      <span>Elegir Estación a editar:</span>
      <select id="select-station" style="width:100%; margin-top:4px; padding:6px; background:#120d08; color:#DFC07A; border:1px solid #C9803F; border-radius:3px; font-weight:600;"></select>
    </label>

    <label style="display:block; margin-bottom:8px;">
      <span>Título de la Estación:</span>
      <input type="text" id="inp-st-title" style="width:100%; margin-top:3px; padding:5px; background:#120d08; color:#fff; border:1px solid #756F62; border-radius:3px;">
    </label>

    <div style="display:flex; gap:6px; margin-bottom:10px;">
      <button type="button" id="btn-place-station-click" style="
        flex:1; padding:7px; background:#2E1D10; color:#DFC07A;
        border:1px dashed #C9803F; border-radius:4px; cursor:pointer; font-weight:600;">
        📍 Ubicar Punto con Clic en la Casa
      </button>
      <button type="button" id="btn-capture-station-cam" title="Guarda tu posición y ángulo actual de cámara en esta estación" style="
        flex:1; padding:7px; background:#A15A2A; color:#fff;
        border:none; border-radius:4px; cursor:pointer; font-weight:600;">
        📸 Capturar mi Ángulo Actual
      </button>
    </div>

    <div style="display:grid; grid-template-columns: 1fr 1fr 1fr; gap:6px; margin-bottom:8px;">
      <label>Punto X: <input type="number" id="inp-st-x" step="0.2" style="width:100%; background:#120d08; color:#fff; border:1px solid #756F62; padding:4px;"></label>
      <label>Punto Y: <input type="number" id="inp-st-y" step="0.2" style="width:100%; background:#120d08; color:#fff; border:1px solid #756F62; padding:4px;"></label>
      <label>Punto Z: <input type="number" id="inp-st-z" step="0.2" style="width:100%; background:#120d08; color:#fff; border:1px solid #756F62; padding:4px;"></label>
    </div>

    <label style="display:block; margin-bottom:6px;">
      <span>Ángulo Horizontal / Giro (<strong id="lbl-st-yaw">0°</strong>):</span>
      <input type="range" id="rng-st-yaw" min="-180" max="180" step="1" value="0" style="width:100%; accent-color:#C9803F;">
    </label>

    <label style="display:block; margin-bottom:6px;">
      <span>Ángulo Vertical / Picado (<strong id="lbl-st-pitch">15°</strong>):</span>
      <input type="range" id="rng-st-pitch" min="-15" max="82" step="1" value="15" style="width:100%; accent-color:#C9803F;">
    </label>

    <label style="display:block; margin-bottom:6px;">
      <span>Distancia al Punto (<strong id="lbl-st-dist">6.0m</strong>):</span>
      <input type="range" id="rng-st-dist" min="1.2" max="26" step="0.2" value="6.0" style="width:100%; accent-color:#C9803F;">
    </label>

    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:8px; margin-bottom:14px;">
      <label>
        <span>Lente Zoom FOV (<strong id="lbl-st-fov">40°</strong>):</span>
        <input type="range" id="rng-st-fov" min="22" max="75" step="1" value="40" style="width:100%; accent-color:#C9803F;">
      </label>
      <label>
        <span>Inclinación Roll (<strong id="lbl-st-roll">0°</strong>):</span>
        <input type="range" id="rng-st-roll" min="-25" max="25" step="1" value="0" style="width:100%; accent-color:#C9803F;">
      </label>
    </div>

    <!-- SECCIÓN 2: VISTA DE INICIO FIJA -->
    <div style="font-weight:700; color:#DFC07A; margin-bottom:6px; border-bottom:1px solid rgba(201,128,63,0.35); padding-bottom:4px;">
      🏠 2. Vista Fija de Inicio
    </div>
    <div id="cam-live-coords" style="font-family:monospace; font-size:0.7rem; color:#ACA79B; margin-bottom:6px;"></div>
    <div style="display:flex; gap:6px; margin-bottom:14px;">
      <button type="button" id="btn-save-cam" style="flex:1; background:#402710; color:#DFC07A; border:1px solid #C9803F; padding:6px 8px; border-radius:3px; cursor:pointer; font-weight:600;">
        📌 Fijar Vista Actual como Inicio
      </button>
      <button type="button" id="btn-reset-all" style="background:#261C14; color:#ACA79B; border:1px solid #756F62; padding:6px 8px; border-radius:3px; cursor:pointer;">
        Restaurar Todo
      </button>
    </div>

    <!-- SECCIÓN 3: COLOCAR MODELOS ADICIONALES OPCIONALES -->
    <div style="font-weight:700; color:#DFC07A; margin-bottom:6px; border-bottom:1px solid rgba(201,128,63,0.35); padding-bottom:4px;">
      📦 3. Modelos .GLB Opcionales en el Exterior
    </div>

    <label style="display:block; margin-bottom:6px;">
      <select id="select-prop" style="width:100%; padding:5px; background:#120d08; color:#F0E6D2; border:1px solid #756F62; border-radius:3px;"></select>
    </label>

    <label style="display:flex; align-items:center; gap:8px; margin-bottom:8px; cursor:pointer;">
      <input type="checkbox" id="chk-prop-enabled" style="accent-color:#C9803F; width:15px; height:15px;">
      <span>Mostrar este modelo en la escena exterior</span>
    </label>

    <button type="button" id="btn-click-place-prop" style="
      width:100%; margin-bottom:8px; padding:6px;
      background:#2E1D10; color:#F0E6D2; border:1px dashed #756F62;
      border-radius:4px; cursor:pointer;">
      📍 Ubicar modelo haciendo clic en el suelo
    </button>

    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:8px; margin-bottom:12px;">
      <label>
        <span>Giro (<strong id="lbl-rot">0°</strong>):</span>
        <input type="range" id="rng-prop-rot" min="-180" max="180" step="5" value="0" style="width:100%; accent-color:#C9803F;">
      </label>
      <label>
        <span>Escala (<strong id="lbl-scale">2.0m</strong>):</span>
        <input type="range" id="rng-prop-scale" min="0.4" max="10" step="0.1" value="2.0" style="width:100%; accent-color:#C9803F;">
      </label>
    </div>

    <button type="button" id="btn-copy-config" style="
      width:100%; background:linear-gradient(180deg, #DFC07A, #A15A2A); color:#120d08; border:none;
      padding:9px; border-radius:4px; cursor:pointer; font-weight:700;">
      📋 Copiar Código de Estaciones y Ángulos
    </button>
    <p id="editor-msg" style="margin:6px 0 0; font-size:0.74rem; color:#DFC07A; text-align:center;"></p>
  </div>
`;
wrap.appendChild(editorUI);
editorUI.addEventListener('click', (e) => e.stopPropagation());

// Referencias del Editor
const editorDrawer = document.getElementById('editor-drawer');
const btnToggleEditor = document.getElementById('btn-toggle-editor');
const camLiveCoords = document.getElementById('cam-live-coords');
const selectStationEl = document.getElementById('select-station');
const inpStTitle = document.getElementById('inp-st-title');
const inpStX = document.getElementById('inp-st-x');
const inpStY = document.getElementById('inp-st-y');
const inpStZ = document.getElementById('inp-st-z');
const rngStYaw = document.getElementById('rng-st-yaw');
const rngStPitch = document.getElementById('rng-st-pitch');
const rngStDist = document.getElementById('rng-st-dist');
const rngStFov = document.getElementById('rng-st-fov');
const rngStRoll = document.getElementById('rng-st-roll');
const lblStYaw = document.getElementById('lbl-st-yaw');
const lblStPitch = document.getElementById('lbl-st-pitch');
const lblStDist = document.getElementById('lbl-st-dist');
const lblStFov = document.getElementById('lbl-st-fov');
const lblStRoll = document.getElementById('lbl-st-roll');
const btnPlaceStationClick = document.getElementById('btn-place-station-click');
const btnCaptureStationCam = document.getElementById('btn-capture-station-cam');

const selectProp = document.getElementById('select-prop');
const chkPropEnabled = document.getElementById('chk-prop-enabled');
const btnClickPlaceProp = document.getElementById('btn-click-place-prop');
const rngPropRot = document.getElementById('rng-prop-rot');
const rngPropScale = document.getElementById('rng-prop-scale');
const lblRot = document.getElementById('lbl-rot');
const lblScale = document.getElementById('lbl-scale');
const editorMsg = document.getElementById('editor-msg');

function showEditorMessage(txt) {
  editorMsg.textContent = txt;
  setTimeout(() => { if (editorMsg.textContent === txt) editorMsg.textContent = ''; }, 3800);
}

function saveStationsToStorage() {
  try {
    localStorage.setItem('patino_ext_stations_v2', JSON.stringify(STATIONS));
  } catch (_) {}
}

function toggleEditorPanel() {
  editorDrawer.hidden = !editorDrawer.hidden;
  if (editorDrawer.hidden) setClickMode(null);
}
btnToggleEditor.addEventListener('click', toggleEditorPanel);

// Poblar selector de Estaciones
STATIONS.forEach((st, idx) => {
  const opt = document.createElement('option');
  opt.value = String(idx);
  opt.textContent = `Estación ${st.number}: ${st.title}`;
  selectStationEl.appendChild(opt);
});

function getEditedStationIndex() {
  return parseInt(selectStationEl.value, 10) || 0;
}

function syncStationEditorFields() {
  const st = STATIONS[getEditedStationIndex()];
  if (!st) return;
  inpStTitle.value = st.title;
  inpStX.value = st.target.x.toFixed(2);
  inpStY.value = st.target.y.toFixed(2);
  inpStZ.value = st.target.z.toFixed(2);
  rngStYaw.value = st.yawDeg;
  rngStPitch.value = st.pitchDeg;
  rngStDist.value = st.distance;
  rngStFov.value = st.fov || 40;
  rngStRoll.value = st.rollDeg || 0;

  lblStYaw.textContent = `${st.yawDeg}°`;
  lblStPitch.textContent = `${st.pitchDeg}°`;
  lblStDist.textContent = `${st.distance}m`;
  lblStFov.textContent = `${st.fov || 40}°`;
  lblStRoll.textContent = `${st.rollDeg || 0}°`;
}
syncStationEditorFields();
rebuildStationMarkersAndBar();

selectStationEl.addEventListener('change', () => {
  const idx = getEditedStationIndex();
  syncStationEditorFields();
  flyToStation(idx, 0.9);
});

// Cuando el usuario mueve cualquier deslizador de ángulo de la estación, previsualizar en tiempo real
function applyLiveStationAngleChange() {
  const idx = getEditedStationIndex();
  const st = STATIONS[idx];
  if (!st) return;

  st.title = inpStTitle.value;
  st.target.x = parseFloat(inpStX.value) || 0;
  st.target.y = parseFloat(inpStY.value) || 0;
  st.target.z = parseFloat(inpStZ.value) || 0;
  st.yawDeg = parseFloat(rngStYaw.value) || 0;
  st.pitchDeg = parseFloat(rngStPitch.value) || 0;
  st.distance = parseFloat(rngStDist.value) || 5;
  st.fov = parseFloat(rngStFov.value) || 40;
  st.rollDeg = parseFloat(rngStRoll.value) || 0;

  lblStYaw.textContent = `${st.yawDeg}°`;
  lblStPitch.textContent = `${st.pitchDeg}°`;
  lblStDist.textContent = `${st.distance}m`;
  lblStFov.textContent = `${st.fov}°`;
  lblStRoll.textContent = `${st.rollDeg}°`;

  // Mover cámara inmediatamente al nuevo ángulo para ver el cambio en vivo
  camTransition = null;
  activeStationIndex = idx;
  const targetVec = new THREE.Vector3(st.target.x, st.target.y, st.target.z);
  const camPos = computeCameraPosFromAngles(targetVec, st.yawDeg, st.pitchDeg, st.distance);
  camera.position.copy(camPos);
  controls.target.copy(targetVec);
  camera.fov = st.fov;
  camera.updateProjectionMatrix();
  currentRollDeg = st.rollDeg;
  controls.update();

  document.getElementById('st-card-badge').textContent = `PUNTO DE ESTACIÓN ${st.number} · ÁNGULO ${st.yawDeg}°`;
  document.getElementById('st-card-title').textContent = st.title;
  stationCard.style.display = 'block';

  saveStationsToStorage();
}

[inpStTitle, inpStX, inpStY, inpStZ, rngStYaw, rngStPitch, rngStDist, rngStFov, rngStRoll].forEach((el) => {
  el.addEventListener('input', applyLiveStationAngleChange);
});

// Botón: Capturar el ángulo y posición actual de cámara para la estación seleccionada
btnCaptureStationCam.addEventListener('click', () => {
  const idx = getEditedStationIndex();
  const st = STATIONS[idx];
  if (!st) return;

  st.target.x = Number(controls.target.x.toFixed(2));
  st.target.y = Number(controls.target.y.toFixed(2));
  st.target.z = Number(controls.target.z.toFixed(2));

  const angles = extractAnglesFromCamera(camera.position, controls.target);
  st.yawDeg = angles.yawDeg;
  st.pitchDeg = angles.pitchDeg;
  st.distance = angles.distance;

  syncStationEditorFields();
  saveStationsToStorage();
  rebuildStationMarkersAndBar();
  showEditorMessage(`¡Ángulo (${st.yawDeg}°, ${st.pitchDeg}°) guardado en Estación ${st.number}!`);
});

// Poblar selector de modelos .glb opcionales
EXTERIOR_MODELS.forEach((m) => {
  const opt = document.createElement('option');
  opt.value = m.id;
  opt.textContent = `${m.name} (${m.file})`;
  selectProp.appendChild(opt);
});

function getSelectedPropDef() {
  return EXTERIOR_MODELS.find((m) => m.id === selectedPropId);
}

function syncPropEditorFields() {
  const def = getSelectedPropDef();
  if (!def) return;
  chkPropEnabled.checked = def.enabled;
  rngPropRot.value = def.rotationDeg;
  lblRot.textContent = `${def.rotationDeg}°`;
  rngPropScale.value = def.scale;
  lblScale.textContent = `${def.scale}m`;
}
syncPropEditorFields();

selectProp.addEventListener('change', (e) => {
  selectedPropId = e.target.value;
  syncPropEditorFields();
});

async function applyPropChanges() {
  const def = getSelectedPropDef();
  if (!def) return;
  def.enabled = chkPropEnabled.checked;
  def.rotationDeg = parseFloat(rngPropRot.value) || 0;
  def.scale = parseFloat(rngPropScale.value) || 1;
  lblRot.textContent = `${def.rotationDeg}°`;
  lblScale.textContent = `${def.scale}m`;
  await spawnOrUpdateProp(def);
}

chkPropEnabled.addEventListener('change', applyPropChanges);
rngPropRot.addEventListener('input', applyPropChanges);
rngPropScale.addEventListener('input', applyPropChanges);

// Modo de ubicación con clic sobre el modelo 3D (para Estación o para Modelo .GLB)
function setClickMode(mode) {
  clickPlacementMode = mode;
  btnPlaceStationClick.style.background = mode === 'STATION' ? '#A15A2A' : '#2E1D10';
  btnPlaceStationClick.textContent = mode === 'STATION'
    ? '🎯 Haz clic sobre la casa para fijar la Estación…'
    : '📍 Ubicar Punto con Clic en la Casa';

  btnClickPlaceProp.style.background = mode === 'PROP' ? '#A15A2A' : '#2E1D10';
  btnClickPlaceProp.textContent = mode === 'PROP'
    ? '🎯 Haz clic en el suelo para poner el modelo…'
    : '📍 Ubicar modelo haciendo clic en el suelo';

  renderer.domElement.style.cursor = mode ? 'crosshair' : 'grab';
}

btnPlaceStationClick.addEventListener('click', () => {
  setClickMode(clickPlacementMode === 'STATION' ? null : 'STATION');
});
btnClickPlaceProp.addEventListener('click', () => {
  setClickMode(clickPlacementMode === 'PROP' ? null : 'PROP');
});

renderer.domElement.addEventListener('pointerdown', async (e) => {
  if (!clickPlacementMode || e.button !== 0) return;

  const rect = renderer.domElement.getBoundingClientRect();
  mouseNDC.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
  mouseNDC.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

  clickRaycaster.setFromCamera(mouseNDC, camera);
  const hits = clickRaycaster.intersectObjects(surfaceMeshes, true);

  if (hits.length > 0) {
    const pt = hits[0].point;

    if (clickPlacementMode === 'STATION') {
      const idx = getEditedStationIndex();
      const st = STATIONS[idx];
      if (st) {
        st.target.x = Number(pt.x.toFixed(2));
        st.target.y = Number(pt.y.toFixed(2));
        st.target.z = Number(pt.z.toFixed(2));
        // Conservar el ángulo desde donde estás mirando ese punto
        const angles = extractAnglesFromCamera(camera.position, pt);
        st.yawDeg = angles.yawDeg;
        st.pitchDeg = angles.pitchDeg;
        st.distance = angles.distance;

        syncStationEditorFields();
        saveStationsToStorage();
        flyToStation(idx, 0.8);
        showEditorMessage(`Estación ${st.number} ubicada en (${st.target.x}, ${st.target.y}, ${st.target.z})`);
      }
    } else if (clickPlacementMode === 'PROP') {
      const def = getSelectedPropDef();
      if (def) {
        def.enabled = true;
        def.snapToGround = false;
        def.position.x = Number(pt.x.toFixed(2));
        def.position.y = Number(pt.y.toFixed(2));
        def.position.z = Number(pt.z.toFixed(2));
        syncPropEditorFields();
        await spawnOrUpdateProp(def);
        showEditorMessage(`${def.name} colocado en (${def.position.x}, ${def.position.y}, ${def.position.z})`);
      }
    }

    setClickMode(null);
  }
});

// Guardar vista actual como Vista de Inicio
document.getElementById('btn-save-cam').addEventListener('click', () => {
  INITIAL_CAMERA = {
    position: {
      x: Number(camera.position.x.toFixed(2)),
      y: Number(camera.position.y.toFixed(2)),
      z: Number(camera.position.z.toFixed(2))
    },
    target: {
      x: Number(controls.target.x.toFixed(2)),
      y: Number(controls.target.y.toFixed(2)),
      z: Number(controls.target.z.toFixed(2))
    },
    fov: Math.round(camera.fov),
    rollDeg: Math.round(currentRollDeg)
  };
  localStorage.setItem('patino_ext_cam_v2', JSON.stringify(INITIAL_CAMERA));
  showEditorMessage('¡Vista de inicio guardada!');
});

document.getElementById('btn-reset-all').addEventListener('click', () => {
  localStorage.removeItem('patino_ext_cam_v2');
  localStorage.removeItem('patino_ext_stations_v2');
  location.reload();
});

// Copiar configuración completa de cámara y estaciones al portapapeles
document.getElementById('btn-copy-config').addEventListener('click', () => {
  const codeBlock =
`let INITIAL_CAMERA = ${JSON.stringify(INITIAL_CAMERA, null, 2)};\n\n` +
`let STATIONS = ${JSON.stringify(STATIONS, null, 2)};\n\n` +
`let EXTERIOR_MODELS = ${JSON.stringify(EXTERIOR_MODELS, null, 2)};`;

  navigator.clipboard.writeText(codeBlock);
  showEditorMessage('¡Código de Estaciones y Ángulos copiado al portapapeles!');
});

// ============================================================
// CIELO, BUCLE PRINCIPAL E INTERPOLACIÓN DINÁMICA
// ============================================================
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

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

const clock = new THREE.Clock();
const projVec = new THREE.Vector3();

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.1);

  if (camTransition) {
    camTransition.elapsed += dt;
    const t = Math.min(1, camTransition.elapsed / camTransition.duration);
    const k = easeInOutCubic(t);

    camera.position.lerpVectors(camTransition.startPos, camTransition.endPos, k);
    controls.target.lerpVectors(camTransition.startTarget, camTransition.endTarget, k);

    // Arco suave de elevación a mitad del vuelo para que sea más dinámico
    camera.position.y += Math.sin(t * Math.PI) * 0.65;

    camera.fov = THREE.MathUtils.lerp(camTransition.startFov, camTransition.endFov, k);
    camera.updateProjectionMatrix();

    currentRollDeg = THREE.MathUtils.lerp(camTransition.startRoll, camTransition.endRoll, k);
    controls.update();

    if (t >= 1) camTransition = null;
  } else {
    updateFreeKeyboardMovement(dt);
    controls.update();
  }

  // Aplicar inclinación dinámica (Roll) si la estación tiene ángulo lateral configurado
  if (Math.abs(currentRollDeg) > 0.05) {
    camera.rotation.z += THREE.MathUtils.degToRad(currentRollDeg);
  }

  // Actualizar coordenadas en vivo en el panel editor
  if (!editorDrawer.hidden) {
    const p = camera.position;
    const angles = extractAnglesFromCamera(camera.position, controls.target);
    camLiveCoords.textContent =
      `Pos: (${p.x.toFixed(1)}, ${p.y.toFixed(1)}, ${p.z.toFixed(1)}) | Giro: ${angles.yawDeg}° | Picado: ${angles.pitchDeg}°`;
  }

  // Proyectar coordenadas 3D de los Puntos de Estación a la pantalla 2D
  const w = wrap.clientWidth;
  const h = wrap.clientHeight;
  markerButtons.forEach(({ pin, st }) => {
    projVec.set(st.target.x, st.target.y, st.target.z).project(camera);
    if (projVec.z > 1) {
      pin.style.display = 'none';
    } else {
      const x = (projVec.x * 0.5 + 0.5) * w;
      const y = (-(projVec.y * 0.5) + 0.5) * h;
      pin.style.display = 'flex';
      pin.style.left = `${x}px`;
      pin.style.top = `${y}px`;
    }
  });

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