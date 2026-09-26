/**
 * The tungsten cube, in three.js. This module (and three.js with it) is only ever loaded by a
 * dynamic import from /cube/ or the wishlist hero, never in a page's static bundle (scan-dist
 * checks). Physically based metal lit by a procedural room (no external HDR), orbit controls,
 * a heft with camera shake and dust, and instanced cube rain that settles into a pile.
 */
import {
  ACESFilmicToneMapping,
  AdditiveBlending,
  BoxGeometry,
  BufferGeometry,
  CanvasTexture,
  DirectionalLight,
  DynamicDrawUsage,
  Float32BufferAttribute,
  InstancedMesh,
  Mesh,
  MeshPhysicalMaterial,
  Object3D,
  PCFShadowMap,
  PMREMGenerator,
  PerspectiveCamera,
  PlaneGeometry,
  Points,
  PointsMaterial,
  Scene,
  ShadowMaterial,
  SRGBColorSpace,
  WebGLRenderer,
} from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import * as L from './logic';

export const RAIN_CAPACITY = 10_000;
const EDGE = 1.6;

export interface CubeHandle {
  heft(): void;
  /** Summon up to `n` more cubes; returns how many are on (or falling to) the floor now. */
  summon(n: number, rng: () => number): number;
  clear(): void;
  dispose(): void;
}

export interface CubeOptions {
  mode: 'hero' | 'full';
  /** prefers-reduced-motion: no auto-rotation, no shake, cubes land at once. */
  calm: boolean;
  /** Called once the first frame is on screen (swap the fallback for the canvas then). */
  onReady?: () => void;
}

/** A soft round dust sprite, drawn on a canvas rather than loaded from a file. */
function dustTexture(): CanvasTexture {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d');
  if (g) {
    const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, 'rgba(200,196,188,0.9)');
    grad.addColorStop(1, 'rgba(200,196,188,0)');
    g.fillStyle = grad;
    g.fillRect(0, 0, 64, 64);
  }
  return new CanvasTexture(c);
}

export function mountCube(canvas: HTMLCanvasElement, o: CubeOptions): CubeHandle | null {
  let renderer: WebGLRenderer;
  try {
    renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true });
  } catch {
    return null; // no WebGL: the SVG fallback stays
  }
  const full = o.mode === 'full';
  renderer.setPixelRatio(Math.min(2, devicePixelRatio || 1));
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.shadowMap.enabled = full;
  renderer.shadowMap.type = PCFShadowMap;

  const scene = new Scene();
  const pmrem = new PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  const env = pmrem.fromScene(room, 0.04).texture;
  room.dispose();
  scene.environment = env;

  const camera = new PerspectiveCamera(full ? 40 : 32, 1, 0.1, 100);
  const home = full ? { x: 5.2, y: 3.8, z: 6.6 } : { x: 3.7, y: 2.8, z: 4.7 };
  camera.position.set(home.x, home.y, home.z);

  const metal = new MeshPhysicalMaterial({
    color: 0x8e959b,
    metalness: 1,
    roughness: 0.22,
    clearcoat: 0.25,
    clearcoatRoughness: 0.3,
  });
  const cubeGeo = new RoundedBoxGeometry(EDGE, EDGE, EDGE, 4, 0.06);
  const cube = new Mesh(cubeGeo, metal);
  cube.position.y = EDGE / 2;
  cube.castShadow = true;
  scene.add(cube);

  const floorGeo = new PlaneGeometry(40, 40);
  const floorMat = new ShadowMaterial({ opacity: 0.28 });
  const floor = new Mesh(floorGeo, floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  const sun = new DirectionalLight(0xffffff, 2.2);
  sun.position.set(4, 9, 3);
  sun.castShadow = full;
  sun.shadow.mapSize.set(1024, 1024);
  Object.assign(sun.shadow.camera, { left: -7, right: 7, top: 7, bottom: -7, near: 1, far: 30 });
  sun.shadow.camera.updateProjectionMatrix();
  scene.add(sun);

  /* ----- cube rain (full mode) ----- */
  const rain = L.createRain(full ? RAIN_CAPACITY : 0);
  L.platform(rain, EDGE / 2, EDGE);
  const smallGeo = new BoxGeometry(rain.size, rain.size, rain.size);
  const rainMesh = new InstancedMesh(smallGeo, metal, Math.max(1, rain.vy.length));
  rainMesh.instanceMatrix.setUsage(DynamicDrawUsage);
  rainMesh.count = 0;
  rainMesh.castShadow = true;
  rainMesh.receiveShadow = true;
  scene.add(rainMesh);
  const spin = new Float32Array(rain.vy.length);
  const placed = new Uint8Array(rain.vy.length);
  const dummy = new Object3D();

  const syncRain = () => {
    let dirty = false;
    for (let i = 0; i < rain.count; i++) {
      if (rain.resting[i] && placed[i]) continue;
      dummy.position.set(rain.pos[i * 3] ?? 0, rain.pos[i * 3 + 1] ?? 0, rain.pos[i * 3 + 2] ?? 0);
      dummy.rotation.set(0, spin[i] ?? 0, 0);
      dummy.updateMatrix();
      rainMesh.setMatrixAt(i, dummy.matrix);
      if (rain.resting[i]) placed[i] = 1;
      dirty = true;
    }
    rainMesh.count = rain.count;
    if (dirty) rainMesh.instanceMatrix.needsUpdate = true;
  };

  /* ----- dust (heft) ----- */
  const DUST = 70;
  const dustGeo = new BufferGeometry();
  const dustPos = new Float32Array(DUST * 3);
  const dustVel = new Float32Array(DUST * 3);
  dustGeo.setAttribute('position', new Float32BufferAttribute(dustPos, 3));
  const dustTex = dustTexture();
  const dustMat = new PointsMaterial({
    size: 0.35,
    map: dustTex,
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
    opacity: 0,
  });
  const dust = new Points(dustGeo, dustMat);
  scene.add(dust);

  /* ----- controls ----- */
  const controls = full ? new OrbitControls(camera, canvas) : null;
  if (controls) {
    // Under reduced motion the loop only runs on input, so there's no damping to finish.
    controls.enableDamping = !o.calm;
    controls.enablePan = false;
    controls.minDistance = 3;
    controls.maxDistance = 22;
    controls.maxPolarAngle = Math.PI / 2 - 0.05;
    controls.target.set(0, 0.8, 0);
    controls.autoRotate = !o.calm;
    controls.autoRotateSpeed = 0.6;
    controls.update();
  } else camera.lookAt(0, EDGE / 2, 0);

  /* ----- sizing ----- */
  const resize = () => {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    wake();
  };
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);

  /* ----- loop: runs while something moves; otherwise renders on demand ----- */
  let heftAt = -1;
  let running = false;
  let visible = true;
  let last = performance.now();
  let first = true;
  const busy = () =>
    !o.calm || heftAt >= 0 || (rain.count > 0 && rain.resting.subarray(0, rain.count).includes(0));

  const frame = (now: number) => {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (!o.calm && !full) cube.rotation.y += dt * 0.5;
    if (rain.count) {
      L.step(rain, dt);
      syncRain();
    }
    if (heftAt >= 0) {
      const t = (now - heftAt) / 1000;
      const s = L.shake(t);
      camera.position.x += s.x;
      camera.position.y += s.y;
      cube.position.y = EDGE / 2 + Math.max(0, 0.35 - t * 3) * (t < 0.12 ? 1 : 0);
      for (let i = 0; i < DUST; i++)
        for (let k = 0; k < 3; k++)
          dustPos[i * 3 + k] = (dustPos[i * 3 + k] ?? 0) + (dustVel[i * 3 + k] ?? 0) * dt;
      dustGeo.attributes.position!.needsUpdate = true;
      dustMat.opacity = Math.max(0, 0.9 - t * 1.2);
      if (t > 0.9) {
        heftAt = -1;
        dustMat.opacity = 0;
        cube.position.y = EDGE / 2;
      }
      renderer.render(scene, camera);
      camera.position.x -= s.x;
      camera.position.y -= s.y;
    } else {
      controls?.update();
      renderer.render(scene, camera);
    }
    if (first) {
      first = false;
      o.onReady?.();
    }
    if (!busy() || !visible) {
      running = false;
      renderer.setAnimationLoop(null);
    }
  };
  function wake() {
    if (running || !visible) return;
    running = true;
    last = performance.now();
    renderer.setAnimationLoop(frame);
  }
  controls?.addEventListener('change', wake);
  controls?.addEventListener('start', wake);

  const io = new IntersectionObserver((es) => {
    visible = es.some((e) => e.isIntersecting) && !document.hidden;
    if (visible) wake();
  });
  io.observe(canvas);
  const onVis = () => {
    visible = !document.hidden;
    if (visible) wake();
  };
  document.addEventListener('visibilitychange', onVis);
  resize();
  wake();

  return {
    heft() {
      if (o.calm) return;
      heftAt = performance.now();
      for (let i = 0; i < DUST; i++) {
        const a = (i / DUST) * Math.PI * 2;
        dustPos.set([Math.cos(a) * EDGE * 0.6, 0.05, Math.sin(a) * EDGE * 0.6], i * 3);
        dustVel.set([Math.cos(a) * 1.6, 0.4 + (i % 5) * 0.12, Math.sin(a) * 1.6], i * 3);
      }
      wake();
    },
    summon(n, rng) {
      const from = rain.count;
      L.summon(rain, n, rng, L.pileHeight(rain) + 5);
      for (let i = from; i < rain.count; i++) spin[i] = rng() * Math.PI;
      if (o.calm) L.settle(rain);
      syncRain();
      wake();
      return rain.count;
    },
    clear() {
      const fresh = L.createRain(rain.vy.length);
      rain.count = 0;
      rain.heights.set(fresh.heights);
      L.platform(rain, EDGE / 2, EDGE);
      placed.fill(0);
      rainMesh.count = 0;
      wake();
    },
    dispose() {
      renderer.setAnimationLoop(null);
      ro.disconnect();
      io.disconnect();
      document.removeEventListener('visibilitychange', onVis);
      controls?.dispose();
      for (const x of [
        cubeGeo,
        floorGeo,
        smallGeo,
        dustGeo,
        metal,
        floorMat,
        dustMat,
        dustTex,
        env,
      ])
        x.dispose();
      pmrem.dispose();
      rainMesh.dispose();
      renderer.dispose();
    },
  };
}
