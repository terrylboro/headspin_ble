import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { PLYLoader } from 'three/examples/jsm/loaders/PLYLoader.js';
import {
  Box,
  Button,
  Card,
  Group,
  Slider,
  Stack,
  Switch,
  Text,
} from '@mantine/core';
import { BACKGR_COLOUR, BLUE_COLOUR, ORANGE_COLOUR } from '../utils/config';

const CANAL_MESH_FILENAMES = {
  left: ["/rh_meshes/posterior_0.ply", "/rh_meshes/posterior_1.ply", "/rh_meshes/posterior_2.ply", "/rh_meshes/posterior_3.ply", "/rh_meshes/posterior_4.ply" 
  ],
  right: [(process.env.PUBLIC_URL + "/new_right_meshes/capsule.ply")]
};
const CAPSULE_MESH_FILENAMES = {
  left: (process.env.PUBLIC_URL + "/rh_meshes/capsule_3x.ply"),
  right: (process.env.PUBLIC_URL + "/new_right_meshes/capsule.ply")
};
const CAMERA_POSITION = new THREE.Vector3(-45, 0, 0);
const CAMERA_ROTATION = new THREE.Euler(0, -Math.PI / 2, 0, 'XYZ');
const CAMERA_NEAR = 0.1;
const CAMERA_FAR = 1000;

type EarSide = 'left' | 'right';

type MeshViewerProps = {
  title: string;
  filenames: string[];
  color: number;
  side: EarSide;
  rotationDeg: {
    x: number;
    y: number;
    z: number;
  };
};

function getPublicMeshPath(filename: string) {
  if (!filename) {
    return '';
  }

  if (filename.startsWith('/') || filename.startsWith('http')) {
    return filename;
  }

  return `${process.env.PUBLIC_URL}/${filename}`;
}

function disposeObject(object: THREE.Object3D) {
  object.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) {
      return;
    }

    child.geometry.dispose();

    const materials = Array.isArray(child.material) ? child.material : [child.material];
    materials.forEach((material) => material.dispose());
  });
}

function applyFixedCameraPose(camera: THREE.PerspectiveCamera) {
  camera.position.copy(CAMERA_POSITION);
  camera.rotation.copy(CAMERA_ROTATION);
  camera.near = CAMERA_NEAR;
  camera.far = CAMERA_FAR;
  camera.updateProjectionMatrix();
}

function MeshViewer({
  title,
  filenames,
  color,
  side,
  rotationDeg,
}: MeshViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const meshGroupRef = useRef(new THREE.Group());
  const [loadError, setLoadError] = useState<string | null>(null);
  const filenamesKey = filenames.join('|');
  const meshPaths = useMemo(
    () => filenames.map(getPublicMeshPath).filter(Boolean),
    [filenamesKey]
  );


  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) {
      return;
    }

    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
    });
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(12, 1)
    const meshGroup = meshGroupRef.current;
    const container = containerRef.current;

    rendererRef.current = renderer;
    sceneRef.current = scene;
    cameraRef.current = camera;

    scene.background = new THREE.Color(BACKGR_COLOUR);
    applyFixedCameraPose(camera);

    scene.add(new THREE.AmbientLight(0xffffff, 0.7));

    const keyLight = new THREE.PointLight(0xffffff, 900);
    keyLight.position.set(20, 20, 20);
    scene.add(keyLight);

    const fillLight = new THREE.PointLight(0xffffff, 500);
    fillLight.position.set(-20, -10, 15);
    scene.add(fillLight);

    scene.add(meshGroup);

    function resizeRenderer() {
      const size = Math.max(1, Math.min(container.clientWidth, container.clientHeight));
      renderer.setSize(size, size, false);
      camera.aspect = 1;
      camera.updateProjectionMatrix();
    }

    resizeRenderer();
    const resizeObserver = new ResizeObserver(resizeRenderer);
    resizeObserver.observe(container);

    disposeObject(meshGroup);
    meshGroup.clear();

    if (meshPaths.length > 0) {
      setLoadError(null);

      const loader = new PLYLoader();
      meshPaths.forEach((meshPath) => {
        loader.load(meshPath, (geometry) => {
          const material = new THREE.MeshStandardMaterial({
            color,
            side: THREE.DoubleSide,
            flatShading: true,
          });
          const mesh = new THREE.Mesh(geometry, material);

          meshGroup.add(mesh);
        }, undefined, () => {
          setLoadError(`Could not load ${meshPath}`);
        });
      });
    }

    let loop = requestAnimationFrame(animate);
    function animate() {
      renderer.render(scene, camera);
      loop = requestAnimationFrame(animate);
    }

    return () => {
      cancelAnimationFrame(loop);
      resizeObserver.disconnect();
      disposeObject(meshGroup);
      meshGroup.clear();
      scene.clear();
      renderer.dispose();
    };
  }, [color, filenamesKey, meshPaths]);

  useEffect(() => {
    const meshGroup = meshGroupRef.current;

    meshGroup.rotation.set(
      THREE.MathUtils.degToRad(rotationDeg.x),
      THREE.MathUtils.degToRad(rotationDeg.y),
      THREE.MathUtils.degToRad(rotationDeg.z),
      'XYZ'
    );
  }, [rotationDeg, side]);

  return (
    <Card withBorder shadow="sm" radius="md" h="100%">
      <Stack h="100%">
        <Text fw={600}>{title}</Text>
        <Box
          ref={containerRef}
          style={{
            flex: 1,
            minHeight: 360,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#000',
            borderRadius: 8,
            position: 'relative',
          }}
        >
          {(meshPaths.length === 0 || loadError) && (
            <Text c="dimmed" size="sm" style={{ position: 'absolute' }}>
              {loadError ?? 'Add mesh filename'}
            </Text>
          )}
          <canvas
            ref={canvasRef}
            style={{ width: '100%', height: '100%', display: 'block' }}
          />
        </Box>
      </Stack>
    </Card>
  );
}

export default function HeadCanalAlignmentTestPanel() {
  const [side, setSide] = useState<EarSide>('left');
  const [x, setX] = useState(0);
  const [y, setY] = useState(0);
  const [z, setZ] = useState(0);
  const rotationDeg = { x, y, z };

  function resetRotation() {
    setX(0);
    setY(0);
    setZ(0);
  }

  return (
    <Stack h="100%" p="md" gap="md">
      <Group justify="space-between" align="center">
        <Text fw={700}>Head/canal alignment test</Text>
        <Switch
          checked={side === 'right'}
          label={side === 'right' ? 'Right ear' : 'Left ear'}
          onChange={(event) => setSide(event.currentTarget.checked ? 'right' : 'left')}
        />
      </Group>

      <Group grow align="stretch" style={{ flex: 1, minHeight: 0 }}>
        <MeshViewer
          title="Canal"
          filenames={CANAL_MESH_FILENAMES[side]}
          color={ORANGE_COLOUR}
          side={side}
          rotationDeg={rotationDeg}
        />
        <MeshViewer
          title="Capsule"
          filenames={[CAPSULE_MESH_FILENAMES[side]]}
          color={BLUE_COLOUR}
          side={side}
          rotationDeg={rotationDeg}
        />
      </Group>

      <Card withBorder shadow="sm" radius="md">
        <Stack gap="sm">
          <Group justify="space-between">
            <Text fw={600}>Euler angles</Text>
            <Button size="xs" variant="light" onClick={resetRotation}>
              Reset
            </Button>
          </Group>
          <Text size="sm" fw={600}>X Euler angle</Text>
          <Slider label={(value) => `${value} deg`} value={x} onChange={setX} min={-180} max={180} step={1} />
          <Text size="sm" fw={600}>Y Euler angle</Text>
          <Slider label={(value) => `${value} deg`} value={y} onChange={setY} min={-180} max={180} step={1} />
          <Text size="sm" fw={600}>Z Euler angle</Text>
          <Slider label={(value) => `${value} deg`} value={z} onChange={setZ} min={-180} max={180} step={1} />
        </Stack>
      </Card>
    </Stack>
  );
}
