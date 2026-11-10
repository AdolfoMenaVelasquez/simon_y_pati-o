// ============================================================
// glb-loader.js — Carga centralizada de modelos GLB
// Casa Museo Simón I. Patiño — Uncía
// ============================================================

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';

const THREE_VERSION = '0.160.0';
const DRACO_DECODER_PATH =
  `https://cdn.jsdelivr.net/npm/three@${THREE_VERSION}/examples/jsm/libs/draco/`;

let sharedLoader = null;

export function getGLTFLoader() {
  if (sharedLoader) return sharedLoader;

  const draco = new DRACOLoader();
  draco.setDecoderPath(DRACO_DECODER_PATH);

  sharedLoader = new GLTFLoader();
  sharedLoader.setDRACOLoader(draco);
  sharedLoader.setMeshoptDecoder(MeshoptDecoder);
  return sharedLoader;
}

export async function inspectGLB(url) {
  const res = await fetch(url);

  if (!res.ok) {
    return {
      ok: false,
      kind: 'http',
      message: `El servidor respondió ${res.status} para ${url}. Revisa que el archivo exista en models/ y que el nombre coincida en mayúsculas y guiones.`
    };
  }

  let bytes;
  if (res.body) {
    const reader = res.body.getReader();
    const { value } = await reader.read();
    reader.cancel();
    bytes = value || new Uint8Array(0);
  } else {
    bytes = new Uint8Array(await res.arrayBuffer()).slice(0, 64);
  }

  const head = new TextDecoder().decode(bytes.slice(0, 64));

  if (head.startsWith('glTF')) {
    return { ok: true, kind: 'glb', message: 'GLB binario válido.' };
  }
  if (head.startsWith('version https://git-lfs')) {
    return {
      ok: false,
      kind: 'lfs-pointer',
      message: `${url} es un puntero de Git LFS. GitHub Pages no sirve archivos LFS; sube los .glb como archivos normales.`
    };
  }
  if (head.trimStart().startsWith('<')) {
    return {
      ok: false,
      kind: 'html',
      message: `${url} devolvió una página HTML (404 ruta incorrecta).`
    };
  }
  if (head.trimStart().startsWith('{')) {
    return { ok: true, kind: 'gltf-json', message: 'Es un glTF en JSON.' };
  }
  return {
    ok: false,
    kind: 'unknown',
    message: `${url} no empieza con la marca "glTF"; el archivo está dañado.`
  };
}

export function loadGLB(url, onProgress) {
  return new Promise((resolve, reject) => {
    getGLTFLoader().load(
      url,
      resolve,
      onProgress,
      async (err) => {
        let diagnosis = null;
        try { diagnosis = await inspectGLB(url); } catch (_) { /* sin red */ }

        const message = diagnosis && !diagnosis.ok
          ? diagnosis.message
          : (err && err.message) || 'Error desconocido al cargar el modelo.';

        const error = new Error(message);
        error.url = url;
        error.cause = err;
        error.diagnosis = diagnosis;
        reject(error);
      }
    );
  });
}

const _box = new THREE.Box3();
const _size = new THREE.Vector3();
const _center = new THREE.Vector3();

export function scaleToFit(obj, opts) {
  _box.setFromObject(obj).getSize(_size);

  let current = 0;
  let target = 0;
  if (opts.height)          { current = _size.y;                            target = opts.height; }
  else if (opts.horizontal) { current = Math.max(_size.x, _size.z);         target = opts.horizontal; }
  else if (opts.largest)    { current = Math.max(_size.x, _size.y, _size.z); target = opts.largest; }

  if (!isFinite(current) || current <= 0 || !target) return 1;

  const k = target / current;
  obj.scale.multiplyScalar(k);
  obj.updateMatrixWorld(true);
  return k;
}

export function centerOnGround(obj) {
  obj.updateMatrixWorld(true);
  _box.setFromObject(obj);
  if (_box.isEmpty()) return false;
  _box.getCenter(_center);
  obj.position.x -= _center.x;
  obj.position.z -= _center.z;
  obj.position.y -= _box.min.y;
  obj.updateMatrixWorld(true);
  return true;
}

export function enableShadows(obj) {
  obj.traverse((n) => {
    if (n.isMesh) {
      n.castShadow = true;
      n.receiveShadow = true;
    }
  });
}

export function disposeObject(root) {
  root.traverse((o) => {
    if (o.geometry) o.geometry.dispose();
    if (o.material) {
      const mats = Array.isArray(o.material) ? o.material : [o.material];
      mats.forEach((m) => {
        for (const key in m) {
          const v = m[key];
          if (v && v.isTexture) v.dispose();
        }
        m.dispose();
      });
    }
  });
}