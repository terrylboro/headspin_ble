import { BufferGeometry } from 'three';
import { PLYLoader } from 'three/examples/jsm/loaders/PLYLoader.js';

const PUBLIC_URL = (process.env.PUBLIC_URL || '').replace(/\/$/, '');
const FETCH_ATTEMPTS = 3;
const FETCH_TIMEOUT_MS = 20_000;
const MAX_CONCURRENT_LOADS = 4;

const sourceGeometryCache = new Map<string, Promise<BufferGeometry>>();
const imageCache = new Map<string, Promise<void>>();

export type AssetProgress = {
  loaded: number;
  total: number;
  path: string;
};

export function publicAssetUrl(path: string): string {
  return `${PUBLIC_URL}/${path.replace(/^\/+/, '')}`;
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

async function fetchWithRetry(url: string): Promise<ArrayBuffer> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= FETCH_ATTEMPTS; attempt += 1) {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    try {
      const response = await fetch(url, {
        cache: 'force-cache',
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`${response.status} ${response.statusText}`);
      }

      return await response.arrayBuffer();
    } catch (error) {
      lastError = error;
      if (attempt < FETCH_ATTEMPTS) {
        await wait(500 * attempt);
      }
    } finally {
      window.clearTimeout(timeout);
    }
  }

  throw new Error(`Unable to load ${url}: ${String(lastError)}`);
}

function getSourceGeometry(url: string): Promise<BufferGeometry> {
  const existing = sourceGeometryCache.get(url);
  if (existing) return existing;

  const request = fetchWithRetry(url)
    .then((data) => new PLYLoader().parse(data))
    .catch((error) => {
      sourceGeometryCache.delete(url);
      throw error;
    });

  sourceGeometryCache.set(url, request);
  return request;
}

export async function preloadPlyGeometry(url: string): Promise<void> {
  await getSourceGeometry(url);
}

/** Returns a disposable clone; the cached source geometry remains intact. */
export async function loadPlyGeometry(url: string): Promise<BufferGeometry> {
  const source = await getSourceGeometry(url);
  return source.clone();
}

export function preloadImage(url: string): Promise<void> {
  const existing = imageCache.get(url);
  if (existing) return existing;

  const request = fetchWithRetry(url)
    .then((data) => new Blob([data]))
    .then((blob) => new Promise<void>((resolve, reject) => {
      const objectUrl = URL.createObjectURL(blob);
      const image = new Image();

      const finish = () => URL.revokeObjectURL(objectUrl);
      image.onload = () => {
        finish();
        resolve();
      };
      image.onerror = () => {
        finish();
        reject(new Error(`Unable to decode image ${url}`));
      };
      image.src = objectUrl;
    }))
    .catch((error) => {
      imageCache.delete(url);
      throw error;
    });

  imageCache.set(url, request);
  return request;
}

const numberedMeshes = (folder: string, canal: string, count: number) =>
  Array.from({ length: count }, (_, index) => `${folder}/${canal}_${index}.ply`);

export const CRITICAL_PLY_ASSETS = [
  'rh_meshes/head.ply',
  'rh_meshes/capsule_3x.ply',
  'new_right_meshes/capsule.ply',
  ...numberedMeshes('rh_meshes', 'posterior', 5),
  ...numberedMeshes('new_right_meshes', 'posterior', 5),
  ...numberedMeshes('rh_meshes', 'all', 5),
  ...numberedMeshes('new_right_meshes', 'all', 5),
  ...numberedMeshes('rh_meshes', 'anterior', 5),
  ...numberedMeshes('rh_meshes', 'lateral', 3),
];

export const CRITICAL_IMAGE_ASSETS = [
  'diagrams/HeadSpin Logo White.png',
  'diagrams/HeadSpin Device With Band.png',
  'Posterior Canal Selected.png',
  'Anterior Canal Selected.png',
  'Lateral Canal Selected.png',
];

export const CRITICAL_AUDIO_ASSETS = [
  'sounds/aligned.mp3',
  'sounds/545373__stwime__up3.mp3',
];

export const DEFERRED_IMAGE_ASSETS = [
  'diagrams/Gyroscope Calibration Flat Surface.png',
  'diagrams/HeadSpin Device Placement Left.png',
  'diagrams/HeadSpin Device Placement Right.png',
  'diagrams/Calibration Get Ready Side Profile Left.png',
  'diagrams/Calibration Get Ready Side Profile Right.png',
  'diagrams/Button Explanation.png',
  ...[0, 1, 2, 3, 4].flatMap((position) => [
    `diagrams/Position ${position} Left.png`,
    `diagrams/Position ${position} Right.png`,
  ]),
  ...[1, 2, 3].flatMap((position) => [
    `diagrams/Position ${position} Full Bed Left.png`,
    `diagrams/Position ${position} Full Bed Right.png`,
    `diagrams/Position ${position} Left Side Profile.png`,
    `diagrams/Position ${position} Right Side Profile.png`,
  ]),
];

async function runWithConcurrency(
  tasks: Array<{ path: string; load: () => Promise<void> }>,
  onProgress?: (progress: AssetProgress) => void,
): Promise<void> {
  let nextIndex = 0;
  let loaded = 0;

  const worker = async () => {
    while (nextIndex < tasks.length) {
      const task = tasks[nextIndex];
      nextIndex += 1;
      await task.load();
      loaded += 1;
      onProgress?.({ loaded, total: tasks.length, path: task.path });
    }
  };

  await Promise.all(
    Array.from(
      { length: Math.min(MAX_CONCURRENT_LOADS, tasks.length) },
      () => worker(),
    ),
  );
}

export function preloadCriticalAssets(
  onProgress?: (progress: AssetProgress) => void,
): Promise<void> {
  const plyTasks = CRITICAL_PLY_ASSETS.map((path) => ({
    path,
    load: () => preloadPlyGeometry(publicAssetUrl(path)),
  }));
  const imageTasks = CRITICAL_IMAGE_ASSETS.map((path) => ({
    path,
    load: () => preloadImage(publicAssetUrl(path)),
  }));
  const audioTasks = CRITICAL_AUDIO_ASSETS.map((path) => ({
    path,
    load: async () => {
      await fetchWithRetry(publicAssetUrl(path));
    },
  }));

  return runWithConcurrency([...plyTasks, ...imageTasks, ...audioTasks], onProgress);
}

export function preloadDeferredAssets(): Promise<void> {
  return runWithConcurrency(
    DEFERRED_IMAGE_ASSETS.map((path) => ({
      path,
      load: () => preloadImage(publicAssetUrl(path)),
    })),
  );
}
