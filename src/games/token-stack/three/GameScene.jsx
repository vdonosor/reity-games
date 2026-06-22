import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { useMemo, useRef, useEffect } from 'react';
import * as THREE from 'three';

const BLOCK_HEIGHT = 0.5;
const CRANE_HEIGHT = 2.8;  // crane pivot height above stack top
const COLORS = ['#42c855', '#4ab8d0', '#f0b030', '#e84888', '#9050e0'];

function adj(hex, f) {
  const r = Math.min(255, Math.round(parseInt(hex.slice(1, 3), 16) * f));
  const g = Math.min(255, Math.round(parseInt(hex.slice(3, 5), 16) * f));
  const b = Math.min(255, Math.round(parseInt(hex.slice(5, 7), 16) * f));
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

function buildSideTex(color, widthUnits) {
  const W = Math.max(80, Math.round(widthUnits * 100));
  const H = 80;
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const g = c.getContext('2d');

  g.fillStyle = color;
  g.fillRect(0, 0, W, H);
  g.fillStyle = adj(color, 1.22);
  g.fillRect(0, 0, W, 11);
  g.fillStyle = adj(color, 0.72);
  g.fillRect(0, H - 9, W, 9);
  g.fillStyle = adj(color, 0.82);
  g.fillRect(0, 11, 7, H - 20);
  g.fillRect(W - 7, 11, 7, H - 20);

  const FW = 28, FH = 44, FRAME = 4, GAP = 10, TOP = 14;
  const inner = W - 14;
  const num = Math.max(1, Math.floor((inner + GAP) / (FW + GAP)));
  const totalW = num * FW + (num - 1) * GAP;
  const sx = Math.round((W - totalW) / 2);

  for (let i = 0; i < num; i++) {
    const wx = sx + i * (FW + GAP);
    g.fillStyle = adj(color, 0.62);
    g.fillRect(wx + 3, TOP + 3, FW, FH);
    g.fillStyle = '#f5f0e8';
    g.fillRect(wx, TOP, FW, FH);
    const pw = Math.floor((FW - FRAME * 2 - 2) / 2);
    const ph = Math.floor((FH - FRAME * 2 - 2) / 2);
    for (let row = 0; row < 2; row++) {
      for (let col = 0; col < 2; col++) {
        const px = wx + FRAME + col * (pw + 2);
        const py = TOP + FRAME + row * (ph + 2);
        g.fillStyle = '#c8eaf8';
        g.fillRect(px, py, pw, ph);
        g.fillStyle = 'rgba(255,255,255,0.38)';
        g.fillRect(px + 1, py + 1, Math.floor(pw * 0.45), Math.floor(ph * 0.42));
      }
    }
    g.fillStyle = '#f5f0e8';
    g.fillRect(wx + FRAME, TOP + FRAME + ph, FW - FRAME * 2, 2);
  }

  return new THREE.CanvasTexture(c);
}

function buildRoofTex(color) {
  const c = document.createElement('canvas');
  c.width = 128; c.height = 128;
  const g = c.getContext('2d');
  g.fillStyle = adj(color, 1.15);
  g.fillRect(0, 0, 128, 128);
  g.strokeStyle = adj(color, 0.72);
  g.lineWidth = 5;
  g.strokeRect(2.5, 2.5, 123, 123);
  g.strokeStyle = adj(color, 0.88);
  g.lineWidth = 1;
  for (let i = 20; i < 128; i += 20) {
    g.beginPath(); g.moveTo(i, 0); g.lineTo(i, 128); g.stroke();
    g.beginPath(); g.moveTo(0, i); g.lineTo(128, i); g.stroke();
  }
  return new THREE.CanvasTexture(c);
}

function FloorBlock({ x, z, y, width, depth, colorIndex, active = false }) {
  const mats = useMemo(() => {
    const color = COLORS[colorIndex % COLORS.length];
    const sX = buildSideTex(color, depth);
    const sZ = buildSideTex(color, width);
    const roofTex = buildRoofTex(color);
    const emissive = active ? new THREE.Color(0.08, 0.28, 0.10) : new THREE.Color(0, 0, 0);
    const mX = new THREE.MeshLambertMaterial({ map: sX, emissive });
    const mZ = new THREE.MeshLambertMaterial({ map: sZ, emissive });
    const mR = new THREE.MeshLambertMaterial({ map: roofTex });
    const mB = new THREE.MeshLambertMaterial({ color: adj(color, 0.55) });
    return [mX, mX, mR, mB, mZ, mZ];
  }, [colorIndex, width, depth, active]);

  return (
    <mesh position={[x, y + BLOCK_HEIGHT / 2, z]} castShadow receiveShadow>
      <boxGeometry args={[width, BLOCK_HEIGHT, depth]} />
      {mats.map((m, i) => <primitive key={i} object={m} attach={`material-${i}`} />)}
    </mesh>
  );
}

// Perspective camera that follows the tower top from the front
function CameraRig({ stackTopY }) {
  const { camera } = useThree();
  const stackTopYRef = useRef(stackTopY);
  stackTopYRef.current = stackTopY;

  useEffect(() => {
    camera.fov = 62;
    camera.near = 0.1;
    camera.far = 300;
    camera.updateProjectionMatrix();
    camera.position.set(0, stackTopY + 1.8, 6.2);
    camera.lookAt(0, stackTopY - 0.5, 0);
    camera.updateProjectionMatrix();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useFrame(() => {
    const ty = stackTopYRef.current;
    camera.position.y += (ty + 1.8 - camera.position.y) * 0.06;
    camera.position.x += (0 - camera.position.x) * 0.06;
    camera.lookAt(0, ty - 0.5, 0);
    camera.updateProjectionMatrix();
  });

  return null;
}

// All placed blocks in one group — rotates to simulate tower sway
function TowerGroup({ blocks, imbalance }) {
  const groupRef = useRef();
  const imbalanceRef = useRef(imbalance);
  imbalanceRef.current = imbalance;
  const timeRef = useRef(0);

  useFrame((_, delta) => {
    timeRef.current += delta;
    if (groupRef.current) {
      const amp = imbalanceRef.current * 0.042;
      groupRef.current.rotation.z = amp * Math.sin(timeRef.current * 2.8);
    }
  });

  return (
    <group ref={groupRef}>
      {blocks.map((block, i) => (
        <FloorBlock
          key={i}
          x={block.x} z={block.z} y={block.y}
          width={block.width} depth={block.depth}
          colorIndex={i}
        />
      ))}
    </group>
  );
}

// Cable from crane pivot down to the current block
function CraneCable({ pivotX, pivotY, blockX, blockY }) {
  const dx = blockX - pivotX;
  const dy = blockY - pivotY;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len < 0.05) return null;

  const midX = (pivotX + blockX) / 2;
  const midY = (pivotY + blockY) / 2;
  // Rotate cylinder (default along +Y) to point from pivot to block
  const rotZ = Math.atan2(dx, -dy);

  return (
    <mesh position={[midX, midY, 0]} rotation={[0, 0, rotZ]}>
      <cylinderGeometry args={[0.022, 0.022, len, 4]} />
      <meshBasicMaterial color="#a87820" />
    </mesh>
  );
}

function Crane({ currentBlock, stackTopY }) {
  const pivotY = stackTopY + CRANE_HEIGHT;
  const blockTopY = currentBlock.y + BLOCK_HEIGHT / 2;

  return (
    <>
      {/* Horizontal arm */}
      <mesh position={[0, pivotY, 0]}>
        <boxGeometry args={[4.0, 0.09, 0.09]} />
        <meshLambertMaterial color="#f0a020" />
      </mesh>
      {/* Pivot sphere */}
      <mesh position={[0, pivotY - 0.07, 0]}>
        <sphereGeometry args={[0.09, 6, 4]} />
        <meshLambertMaterial color="#c07010" />
      </mesh>
      {/* Cable */}
      <CraneCable
        pivotX={0}
        pivotY={pivotY - 0.07}
        blockX={currentBlock.x}
        blockY={blockTopY}
      />
    </>
  );
}

function Scene({ blocks, currentBlock, imbalance, gameOver }) {
  const stackTopY = useMemo(() => {
    const top = blocks[blocks.length - 1];
    return top ? top.y + BLOCK_HEIGHT / 2 : 0;
  }, [blocks]);

  return (
    <>
      <CameraRig stackTopY={stackTopY} />

      <ambientLight intensity={0.68} />
      <directionalLight position={[3, 10, 5]} intensity={1.1} castShadow shadow-mapSize={[512, 512]} />
      <directionalLight position={[-2, 4, 4]} intensity={0.35} />

      <TowerGroup blocks={blocks} imbalance={imbalance} />

      {!gameOver && (
        <>
          <FloorBlock
            x={currentBlock.x} z={currentBlock.z} y={currentBlock.y}
            width={currentBlock.width} depth={currentBlock.depth}
            colorIndex={blocks.length}
            active
          />
          <Crane currentBlock={currentBlock} stackTopY={stackTopY} />
        </>
      )}
    </>
  );
}

export function GameScene({ blocks, currentBlock, imbalance = 0, gameOver = false }) {
  return (
    <Canvas
      data-testid="game-scene-ready"
      shadows
      style={{ width: '100%', height: '100%' }}
      gl={{ antialias: true, preserveDrawingBuffer: true }}
    >
      <Scene blocks={blocks} currentBlock={currentBlock} imbalance={imbalance} gameOver={gameOver} />
    </Canvas>
  );
}
