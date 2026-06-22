import { Canvas, useThree } from '@react-three/fiber';
import { OrthographicCamera } from '@react-three/drei';
import { useMemo, useEffect } from 'react';
import * as THREE from 'three';

const BLOCK_HEIGHT = 0.2;

// Paleta de fachadas arquitectónicas — cicla por piso
const PALETTES = [
  { wall: '#f0ece4', roof: '#dedad2', glassLit: '#ffd060', glassDark: '#1a2b45' },
  { wall: '#e8ecf2', roof: '#d4dae6', glassLit: '#90c8f0', glassDark: '#0f1e30' },
  { wall: '#eef0e8', roof: '#dde2d6', glassLit: '#b0ecc8', glassDark: '#0a2018' },
  { wall: '#f2ede4', roof: '#e4ddd0', glassLit: '#ffc850', glassDark: '#281400' },
  { wall: '#e8eef2', roof: '#d8e2ec', glassLit: '#60ccff', glassDark: '#081828' },
];

function buildSideTex(pal, widthUnits, seed, allLit = false) {
  const W = Math.max(64, Math.round(widthUnits * 96));
  const H = 48;
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const g = c.getContext('2d');

  g.fillStyle = pal.wall;
  g.fillRect(0, 0, W, H);

  // Líneas de borde de losa
  g.fillStyle = 'rgba(0,0,0,0.16)';
  g.fillRect(0, 0, W, 3);
  g.fillRect(0, H - 3, W, 3);

  // Ventanas
  const WW = 9, WH = 22, GAP = 8, TOP = (H - WH) / 2;
  let s = ((seed * 2654435761) >>> 0);
  function rng() { s ^= s << 13; s ^= s >> 17; s ^= s << 5; return (s >>> 0) / 4294967296; }

  for (let x = GAP; x + WW <= W - GAP / 2; x += WW + GAP) {
    const lit = allLit || rng() > 0.28;
    // Sombra bajo ventana
    g.fillStyle = 'rgba(0,0,0,0.10)';
    g.fillRect(x - 1, TOP + 2, WW + 2, WH);
    // Vidrio
    g.fillStyle = lit ? pal.glassLit : pal.glassDark;
    g.fillRect(x, TOP, WW, WH);
    // Parteluz vertical
    g.fillStyle = 'rgba(255,255,255,0.22)';
    g.fillRect(x + Math.floor(WW / 2), TOP, 1, WH);
    // Marco
    g.strokeStyle = 'rgba(150,138,120,0.9)';
    g.lineWidth = 1;
    g.strokeRect(x + 0.5, TOP + 0.5, WW - 1, WH - 1);
  }

  const t = new THREE.CanvasTexture(c);
  return t;
}

function buildRoofTex(pal) {
  const c = document.createElement('canvas');
  c.width = 128; c.height = 128;
  const g = c.getContext('2d');
  g.fillStyle = pal.roof;
  g.fillRect(0, 0, 128, 128);
  // Cuadrícula sutil
  g.strokeStyle = 'rgba(0,0,0,0.07)';
  g.lineWidth = 1;
  for (let i = 16; i < 128; i += 16) {
    g.beginPath(); g.moveTo(i, 0); g.lineTo(i, 128); g.stroke();
    g.beginPath(); g.moveTo(0, i); g.lineTo(128, i); g.stroke();
  }
  // Antepecho perimetral
  g.strokeStyle = 'rgba(0,0,0,0.20)';
  g.lineWidth = 3;
  g.strokeRect(1.5, 1.5, 125, 125);
  return new THREE.CanvasTexture(c);
}

// BoxGeometry face order: px(0) nx(1) py(2) ny(3) pz(4) nz(5)
// Visible desde cámara (6,6,6): +x, +y, +z
function FloorBlock({ x, z, y, width, depth, colorIndex, active = false }) {
  const mats = useMemo(() => {
    const pal = PALETTES[colorIndex % PALETTES.length];
    const seed = colorIndex * 31;
    // px/nx: la cara perpendicular al eje X abarca depth en ancho
    const sX = buildSideTex(pal, depth, seed, active);
    // pz/nz: la cara perpendicular al eje Z abarca width en ancho
    const sZ = buildSideTex(pal, width, seed + 7, active);
    const roofTex = buildRoofTex(pal);

    const emissive = active ? new THREE.Color(0.04, 0.18, 0.08) : new THREE.Color(0, 0, 0);
    const mSX = new THREE.MeshLambertMaterial({ map: sX, emissive });
    const mSZ = new THREE.MeshLambertMaterial({ map: sZ, emissive });
    const mRoof = new THREE.MeshLambertMaterial({ map: roofTex, emissive });
    const mBot = new THREE.MeshLambertMaterial({ color: '#666' });

    return [mSX, mSX, mRoof, mBot, mSZ, mSZ];
  }, [colorIndex, width, depth, active]);

  return (
    <mesh position={[x, y + BLOCK_HEIGHT / 2, z]} castShadow receiveShadow>
      <boxGeometry args={[width, BLOCK_HEIGHT, depth]} />
      {mats.map((m, i) => <primitive key={i} object={m} attach={`material-${i}`} />)}
    </mesh>
  );
}

function CameraRig({ stackTopY }) {
  const { camera } = useThree();
  useEffect(() => {
    const target = new THREE.Vector3(0, stackTopY, 0);
    const offset = new THREE.Vector3(6, 6, 6);
    camera.position.copy(target).add(offset);
    camera.lookAt(target);
    camera.updateProjectionMatrix();
  }, [camera, stackTopY]);
  return null;
}

function Scene({ blocks, currentBlock }) {
  const stackTopY = useMemo(() => {
    const top = blocks[blocks.length - 1];
    return top ? top.y + BLOCK_HEIGHT / 2 : 0;
  }, [blocks]);

  return (
    <>
      <OrthographicCamera makeDefault position={[6, 6, 6]} zoom={100} near={0.1} far={200} />
      <CameraRig stackTopY={stackTopY} />

      <ambientLight intensity={0.7} />
      <directionalLight position={[5, 12, 4]} intensity={1.1} castShadow shadow-mapSize={[512, 512]} />
      <directionalLight position={[-3, 4, -2]} intensity={0.25} />

      {blocks.map((block, i) => (
        <FloorBlock
          key={i}
          x={block.x}
          z={block.z}
          y={block.y}
          width={block.width}
          depth={block.depth}
          colorIndex={i}
        />
      ))}

      {!currentBlock.gameOver && (
        <FloorBlock
          x={currentBlock.x}
          z={currentBlock.z}
          y={currentBlock.y}
          width={currentBlock.width}
          depth={currentBlock.depth}
          colorIndex={blocks.length}
          active
        />
      )}
    </>
  );
}

export function GameScene({ blocks, currentBlock }) {
  return (
    <Canvas shadows style={{ width: '100%', height: '100%' }} gl={{ antialias: true, preserveDrawingBuffer: true }}>
      <Scene blocks={blocks} currentBlock={currentBlock} />
    </Canvas>
  );
}
