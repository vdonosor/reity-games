import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { useMemo, useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { ROPE_L, PIVOT_H } from '../engine/stack.js';

const BLOCK_HEIGHT = 0.85;
const COLORS = ['#42c855', '#4ab8d0', '#f0b030', '#e84888', '#9050e0'];

function adj(hex, f) {
  const r = Math.min(255, Math.round(parseInt(hex.slice(1, 3), 16) * f));
  const g = Math.min(255, Math.round(parseInt(hex.slice(3, 5), 16) * f));
  const b = Math.min(255, Math.round(parseInt(hex.slice(5, 7), 16) * f));
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

// ---- TEXTURES ----

function buildSideTex(color, widthUnits, floorLevel = 0) {
  const W = Math.max(100, Math.round(widthUnits * 120));
  const H = 130;
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const g = c.getContext('2d');

  g.fillStyle = color;
  g.fillRect(0, 0, W, H);
  g.fillStyle = adj(color, 1.22);
  g.fillRect(0, 0, W, 18);
  g.fillStyle = adj(color, 0.72);
  g.fillRect(0, 18, W, 3);
  g.fillStyle = adj(color, 0.60);
  g.fillRect(0, H - 12, W, 12);
  g.fillStyle = adj(color, 0.80);
  g.fillRect(0, 18, 11, H - 30);
  g.fillRect(W - 11, 18, 11, H - 30);

  const FW = 26, FH = 64, FRAME = 4, GAP = 10, TOP = 24;
  const num = Math.max(1, Math.floor((W - 22 + GAP) / (FW + GAP)));
  const totalW = num * FW + (num - 1) * GAP;
  const sx = Math.round((W - totalW) / 2);

  for (let i = 0; i < num; i++) {
    const wx = sx + i * (FW + GAP);
    g.fillStyle = adj(color, 0.60);
    g.fillRect(wx + 3, TOP + 3, FW, FH);
    g.fillStyle = '#f5f0e8';
    g.fillRect(wx, TOP, FW, FH);
    const pw = Math.floor((FW - FRAME * 2 - 2) / 2);
    const ph = Math.floor((FH - FRAME * 2 - 2) / 2);
    for (let row = 0; row < 2; row++) {
      for (let col = 0; col < 2; col++) {
        g.fillStyle = '#c8eaf8';
        g.fillRect(wx + FRAME + col * (pw + 2), TOP + FRAME + row * (ph + 2), pw, ph);
        g.fillStyle = 'rgba(255,255,255,0.40)';
        g.fillRect(wx + FRAME + col * (pw + 2) + 1, TOP + FRAME + row * (ph + 2) + 1,
          Math.floor(pw * 0.45), Math.floor(ph * 0.42));
      }
    }
    g.fillStyle = '#f5f0e8';
    g.fillRect(wx + FRAME, TOP + FRAME + ph, FW - FRAME * 2, 2);
  }

  const BALC = TOP + FH + 3;
  const detail = floorLevel % 3;

  if (detail === 0) {
    g.fillStyle = adj(color, 0.55);
    g.fillRect(sx - 6, BALC, totalW + 12, 4);
    g.fillStyle = adj(color, 0.72);
    for (let bx = sx - 6; bx < sx + totalW + 7; bx += 5)
      g.fillRect(bx, BALC + 4, 2, 12);
    g.fillStyle = adj(color, 0.68);
    g.fillRect(sx - 6, BALC + 15, totalW + 12, 3);
  } else if (detail === 1) {
    g.fillStyle = adj(color, 0.55);
    g.fillRect(sx - 6, BALC, totalW + 12, 3);
    g.strokeStyle = '#b0a080'; g.lineWidth = 1;
    g.beginPath(); g.moveTo(sx - 4, BALC + 7); g.lineTo(sx + totalW + 3, BALC + 7); g.stroke();
    const CLOTH = ['#e84848', '#4090e8', '#f0e030', '#50c870', '#e050a8', '#f0a030'];
    const nItems = Math.max(1, Math.floor((totalW + 6) / 13));
    for (let i = 0; i < nItems; i++) {
      const ix = sx - 3 + Math.round(i * (totalW + 6) / nItems);
      g.fillStyle = CLOTH[(floorLevel * 2 + i) % CLOTH.length];
      g.fillRect(ix, BALC + 8, 8, 11);
      g.fillStyle = '#d8c8a8'; g.fillRect(ix + 3, BALC + 6, 2, 4);
    }
  } else {
    g.fillStyle = adj(color, 0.55);
    g.fillRect(sx - 6, BALC, totalW + 12, 4);
    const FLORALS = ['#e84050', '#f0a020', '#f0e820', '#50d050', '#e050e0', '#50c8e8'];
    for (let i = 0; i < num; i++) {
      const wx = sx + i * (FW + GAP);
      g.fillStyle = '#7a4818'; g.fillRect(wx + 2, BALC + 5, FW - 4, 7);
      g.fillStyle = '#5a3010'; g.fillRect(wx + 4, BALC + 4, FW - 8, 4);
      const nF = Math.floor((FW - 4) / 7);
      for (let j = 0; j < nF; j++) {
        g.fillStyle = FLORALS[(floorLevel + i + j) % FLORALS.length];
        g.beginPath(); g.arc(wx + 3 + j * 7 + 2, BALC + 3, 4, 0, Math.PI * 2); g.fill();
        g.fillStyle = '#38a038'; g.fillRect(wx + 3 + j * 7 + 1, BALC + 5, 2, 4);
      }
    }
  }
  return new THREE.CanvasTexture(c);
}

function buildRoofTex(color) {
  const c = document.createElement('canvas');
  c.width = 128; c.height = 128;
  const g = c.getContext('2d');
  g.fillStyle = adj(color, 1.15);
  g.fillRect(0, 0, 128, 128);
  g.strokeStyle = adj(color, 0.72); g.lineWidth = 5;
  g.strokeRect(2.5, 2.5, 123, 123);
  g.strokeStyle = adj(color, 0.88); g.lineWidth = 1;
  for (let i = 20; i < 128; i += 20) {
    g.beginPath(); g.moveTo(i, 0); g.lineTo(i, 128); g.stroke();
    g.beginPath(); g.moveTo(0, i); g.lineTo(128, i); g.stroke();
  }
  return new THREE.CanvasTexture(c);
}

// Tiling window texture for background buildings
function buildBldgTex(color, seed = 0) {
  const W = 128, H = 128;
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const g = c.getContext('2d');
  g.fillStyle = color;
  g.fillRect(0, 0, W, H);
  const wW = 14, wH = 18, gx = 26, gy = 28;
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 4; col++) {
      const wx = 10 + col * gx;
      const wy = 6 + row * gy;
      const lit = ((row * 4 + col + seed) * 3 + 7) % 5 !== 0;
      if (lit) {
        g.fillStyle = 'rgba(255,225,140,0.80)';
        g.fillRect(wx, wy, wW, wH);
        g.fillStyle = 'rgba(255,255,200,0.25)';
        g.fillRect(wx + 1, wy + 1, Math.ceil(wW * 0.45), Math.ceil(wH * 0.42));
      } else {
        g.fillStyle = 'rgba(15,25,45,0.85)';
        g.fillRect(wx, wy, wW, wH);
      }
    }
  }
  return new THREE.CanvasTexture(c);
}

function buildGroundTex() {
  const S = 512;
  const c = document.createElement('canvas');
  c.width = S; c.height = S;
  const g = c.getContext('2d');
  // Base concrete
  g.fillStyle = '#524438';
  g.fillRect(0, 0, S, S);
  // Worn patches
  g.fillStyle = '#423530';
  for (let i = 0; i < 12; i++) {
    const x = (i * 97 + 30) % (S - 80);
    const y = (i * 173 + 20) % (S - 80);
    g.beginPath();
    g.ellipse(x + 40, y + 40, 35 + (i * 11) % 30, 22 + (i * 7) % 20, (i * 0.4), 0, Math.PI * 2);
    g.fill();
  }
  // Dirt/mud
  g.fillStyle = '#6a5030';
  for (let i = 0; i < 6; i++) {
    const x = (i * 137) % (S - 60);
    const y = (i * 211) % (S - 60);
    g.beginPath();
    g.ellipse(x + 30, y + 30, 28 + (i * 13) % 20, 18 + (i * 9) % 15, (i * 0.7), 0, Math.PI * 2);
    g.fill();
  }
  // Concrete cracks
  g.strokeStyle = '#382822'; g.lineWidth = 1.5;
  for (let i = 0; i < 8; i++) {
    const x = (i * 79) % S; const y = (i * 113) % S;
    g.beginPath(); g.moveTo(x, y); g.lineTo(x + 40 + (i * 23) % 60, y + 20 + (i * 17) % 40); g.stroke();
  }
  // Yellow painted markings
  g.strokeStyle = '#c0a020'; g.lineWidth = 5; g.setLineDash([28, 12]);
  g.beginPath(); g.moveTo(S / 2, 0); g.lineTo(S / 2, S); g.stroke();
  g.setLineDash([]);
  // Construction barriers along bottom edge
  for (let i = 0; i < 8; i++) {
    const bx = 20 + i * 62;
    g.fillStyle = '#e0b820'; g.fillRect(bx, S - 24, 40, 10);
    g.fillStyle = '#1a1a1a'; g.fillRect(bx, S - 14, 40, 8);
  }
  return new THREE.CanvasTexture(c);
}

function buildSkyTex() {
  const W = 2, H = 512;
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const g = c.getContext('2d');
  const sky = g.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0.00, '#000008');
  sky.addColorStop(0.12, '#010418');
  sky.addColorStop(0.28, '#040e38');
  sky.addColorStop(0.45, '#0a2880');
  sky.addColorStop(0.60, '#1848c0');
  sky.addColorStop(0.72, '#3070d8');
  sky.addColorStop(0.82, '#5898e8');
  sky.addColorStop(0.90, '#80b8f0');
  sky.addColorStop(0.96, '#a8cef5');
  sky.addColorStop(1.00, '#c0b890');
  g.fillStyle = sky;
  g.fillRect(0, 0, W, H);
  return new THREE.CanvasTexture(c);
}

// ---- COMPONENTS ----

function FloorBlock({ x, z, y, width, depth, colorIndex, active = false }) {
  const mats = useMemo(() => {
    const color = COLORS[colorIndex % COLORS.length];
    const sX = buildSideTex(color, depth, colorIndex);
    const sZ = buildSideTex(color, width, colorIndex);
    const roofTex = buildRoofTex(color);
    const emissive = active ? new THREE.Color(0.06, 0.22, 0.08) : new THREE.Color(0, 0, 0);
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

// ---- 3D BACKGROUND BUILDINGS ----

function Building3D({ x, z, w, h, depth = 2.8, color, seed = 0 }) {
  const mats = useMemo(() => {
    const tex = buildBldgTex(color, seed);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(Math.max(1, Math.round(w / 2.5)), Math.max(4, Math.round(h / 8)));
    const front = new THREE.MeshLambertMaterial({ map: tex });
    const side = new THREE.MeshLambertMaterial({ color: adj(color, 0.65) });
    const roof = new THREE.MeshLambertMaterial({ color: adj(color, 0.90) });
    return [side, side, roof, side, front, side];
  }, [color, seed, w, h]);

  return (
    <mesh position={[x, h / 2, z]} castShadow>
      <boxGeometry args={[w, h, depth]} />
      {mats.map((m, i) => <primitive key={i} object={m} attach={`material-${i}`} />)}
    </mesh>
  );
}

// Far layer buildings (z≈-17): tall skyscrapers
const FAR_BLDGS = [
  { x: -15, w: 5.5, h: 230, c: '#0c1422', s: 1 },
  { x:  -8, w: 4.5, h: 260, c: '#091020', s: 2 },
  { x:  -1, w: 7.0, h: 200, c: '#0d162e', s: 3 },
  { x:   8, w: 5.0, h: 245, c: '#0a1220', s: 4 },
  { x:  15, w: 4.5, h: 215, c: '#0e1828', s: 5 },
];

// Mid layer (z≈-10): medium height buildings
const MID_BLDGS = [
  { x: -11, w: 4.0, h: 140, c: '#152030', s: 6  },
  { x:  -5, w: 5.0, h: 120, c: '#122030', s: 7  },
  { x:   2, w: 4.5, h: 160, c: '#182540', s: 8  },
  { x:   9, w: 3.5, h: 105, c: '#102028', s: 9  },
  { x:  14, w: 5.0, h: 145, c: '#14202e', s: 10 },
];

// Near layer (z≈-5): closer shorter buildings
const NEAR_BLDGS = [
  { x: -9, w: 3.0, h: 50, c: '#202840', s: 11 },
  { x: -4, w: 3.5, h: 65, c: '#1c2838', s: 12 },
  { x:  4, w: 3.0, h: 40, c: '#182438', s: 13 },
  { x:  9, w: 3.5, h: 58, c: '#162030', s: 14 },
];

function Buildings() {
  return (
    <>
      {FAR_BLDGS.map((b, i) => (
        <Building3D key={`f${i}`} x={b.x} z={-17} w={b.w} h={b.h} depth={3.0} color={b.c} seed={b.s} />
      ))}
      {MID_BLDGS.map((b, i) => (
        <Building3D key={`m${i}`} x={b.x} z={-10} w={b.w} h={b.h} depth={2.5} color={b.c} seed={b.s} />
      ))}
      {NEAR_BLDGS.map((b, i) => (
        <Building3D key={`n${i}`} x={b.x} z={-5.5} w={b.w} h={b.h} depth={2.0} color={b.c} seed={b.s} />
      ))}
    </>
  );
}

// Distant sky gradient backdrop
function SkyBackdrop() {
  const tex = useMemo(() => buildSkyTex(), []);
  return (
    <mesh position={[0, 150, -22]}>
      <planeGeometry args={[80, 350]} />
      <meshBasicMaterial map={tex} />
    </mesh>
  );
}

// Horizontal construction ground
function Ground() {
  const tex = useMemo(() => {
    const t = buildGroundTex();
    t.wrapS = THREE.RepeatWrapping;
    t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(6, 5);
    return t;
  }, []);
  return (
    <mesh position={[0, -0.01, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[50, 30]} />
      <meshLambertMaterial map={tex} />
    </mesh>
  );
}

// Camera — follows tower's x AND y position
function CameraRig({ stackTopY, topBlockX }) {
  const { camera } = useThree();
  const tyRef = useRef(stackTopY);
  const txRef = useRef(topBlockX);
  tyRef.current = stackTopY;
  txRef.current = topBlockX;

  useEffect(() => {
    camera.fov = 72;
    camera.near = 0.1;
    camera.far = 400;
    camera.updateProjectionMatrix();
    camera.position.set(topBlockX, stackTopY + 2.0, 8.5);
    camera.lookAt(topBlockX, stackTopY - 2.0, 0);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useFrame(() => {
    const ty = tyRef.current;
    const tx = txRef.current;
    camera.position.x += (tx - camera.position.x) * 0.06;
    camera.position.y += (ty + 2.0 - camera.position.y) * 0.06;
    camera.lookAt(tx, ty - 2.0, 0);
    camera.updateProjectionMatrix();
  });

  return null;
}

// Placed blocks — group rotates for tower sway
function TowerGroup({ blocks, imbalance }) {
  const groupRef = useRef();
  const imbalanceRef = useRef(imbalance);
  imbalanceRef.current = imbalance;
  const timeRef = useRef(0);

  useFrame((_, delta) => {
    timeRef.current += delta;
    if (groupRef.current) {
      // Gradual amplitude: max imbalance=5 → max amp = 5*0.020 = 0.10 rad
      const amp = imbalanceRef.current * 0.020;
      groupRef.current.rotation.z = amp * Math.sin(timeRef.current * 2.5);
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

// Cable from crane pivot to block — fixed length = ROPE_L, non-elastic
function CraneCable({ pivotX, pivotY, blockX, blockY }) {
  const dx = blockX - pivotX;
  const dy = blockY - pivotY;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len < 0.05) return null;
  const rotZ = Math.atan2(dx, -dy);
  return (
    <mesh position={[(pivotX + blockX) / 2, (pivotY + blockY) / 2, 0]} rotation={[0, 0, rotZ]}>
      <cylinderGeometry args={[0.022, 0.022, len, 4]} />
      <meshBasicMaterial color="#907020" />
    </mesh>
  );
}

// Falling block animation when a block is placed
function FallingBlockAnim({ x, z, width, depth, colorIndex, fromY, toY, startTime }) {
  const meshRef = useRef();
  const mats = useMemo(() => {
    const color = COLORS[colorIndex % COLORS.length];
    const sX = buildSideTex(color, depth, colorIndex);
    const sZ = buildSideTex(color, width, colorIndex);
    const roofTex = buildRoofTex(color);
    return [
      new THREE.MeshLambertMaterial({ map: sX }),
      new THREE.MeshLambertMaterial({ map: sX }),
      new THREE.MeshLambertMaterial({ map: roofTex }),
      new THREE.MeshLambertMaterial({ color: adj(color, 0.55) }),
      new THREE.MeshLambertMaterial({ map: sZ }),
      new THREE.MeshLambertMaterial({ map: sZ }),
    ];
  }, [colorIndex, width, depth]);

  useFrame(() => {
    if (!meshRef.current) return;
    const elapsed = (performance.now() - startTime) / 1000;
    const duration = 0.30;
    const t = Math.min(1, elapsed / duration);
    // Ease-in (gravity feel): faster at end
    const eased = t * t;
    const cy = fromY + BLOCK_HEIGHT / 2 + (toY + BLOCK_HEIGHT / 2 - (fromY + BLOCK_HEIGHT / 2)) * eased;
    meshRef.current.position.y = cy;
  });

  return (
    <mesh ref={meshRef} position={[x, fromY + BLOCK_HEIGHT / 2, z]}>
      <boxGeometry args={[width, BLOCK_HEIGHT, depth]} />
      {mats.map((m, i) => <primitive key={i} object={m} attach={`material-${i}`} />)}
    </mesh>
  );
}

function Crane({ currentBlock }) {
  const pivotX = currentBlock.pivotX ?? 0;
  const pivotY = currentBlock.pivotY ?? 10;
  const blockCenterY = currentBlock.y + BLOCK_HEIGHT / 2;

  return (
    <>
      {/* Crane tower (vertical post) */}
      <mesh position={[pivotX, pivotY / 2, -0.3]}>
        <boxGeometry args={[0.18, pivotY, 0.18]} />
        <meshLambertMaterial color="#e09820" />
      </mesh>
      {/* Crane arm (horizontal) */}
      <mesh position={[pivotX, pivotY, -0.3]}>
        <boxGeometry args={[6.5, 0.12, 0.12]} />
        <meshLambertMaterial color="#f0a820" />
      </mesh>
      {/* Counter-weight arm */}
      <mesh position={[pivotX - 2.2, pivotY + 0.14, -0.3]}>
        <boxGeometry args={[1.8, 0.25, 0.25]} />
        <meshLambertMaterial color="#d08010" />
      </mesh>
      {/* Pivot sphere */}
      <mesh position={[pivotX, pivotY - 0.1, 0]}>
        <sphereGeometry args={[0.12, 6, 4]} />
        <meshLambertMaterial color="#c07010" />
      </mesh>
      {/* Cable */}
      <CraneCable pivotX={pivotX} pivotY={pivotY - 0.1} blockX={currentBlock.x} blockY={blockCenterY} />
    </>
  );
}

function Scene({ blocks, currentBlock, imbalance, gameOver }) {
  const topBlock = blocks[blocks.length - 1];
  const stackTopY = topBlock ? topBlock.y + BLOCK_HEIGHT / 2 : 0;
  const topBlockX = topBlock ? topBlock.x : 0;

  // Falling block animation state
  const [falling, setFalling] = useState(null);
  const prevLenRef = useRef(blocks.length);

  useEffect(() => {
    if (blocks.length > prevLenRef.current) {
      const newBlock = blocks[blocks.length - 1];
      const prevTop = blocks[blocks.length - 2] || { y: -BLOCK_HEIGHT };
      // Block was hanging at pendulum center height above prev stack
      const pendulumCenterY = prevTop.y + BLOCK_HEIGHT + PIVOT_H - ROPE_L;
      const fromY = pendulumCenterY - BLOCK_HEIGHT / 2;
      setFalling({
        x: newBlock.x, z: newBlock.z,
        width: newBlock.width, depth: newBlock.depth,
        colorIndex: blocks.length - 1,
        fromY,
        toY: newBlock.y,
        startTime: performance.now(),
        id: blocks.length,
      });
      prevLenRef.current = blocks.length;
    }
  }, [blocks]);

  // Clear falling anim after it completes
  useEffect(() => {
    if (!falling) return;
    const t = setTimeout(() => setFalling(null), 350);
    return () => clearTimeout(t);
  }, [falling?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      <CameraRig stackTopY={stackTopY} topBlockX={topBlockX} />

      <SkyBackdrop />
      <Buildings />
      <Ground />

      <ambientLight intensity={0.65} />
      <directionalLight position={[4, 12, 6]} intensity={1.2} castShadow shadow-mapSize={[512, 512]} />
      <directionalLight position={[-3, 5, 4]} intensity={0.30} />

      <TowerGroup blocks={blocks} imbalance={imbalance} />

      {falling && (
        <FallingBlockAnim key={falling.id} {...falling} />
      )}

      {!gameOver && (
        <>
          <FloorBlock
            x={currentBlock.x} z={currentBlock.z} y={currentBlock.y}
            width={currentBlock.width} depth={currentBlock.depth}
            colorIndex={blocks.length}
            active
          />
          <Crane currentBlock={currentBlock} />
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
      gl={{ antialias: true }}
      scene={{ background: new THREE.Color('#08101c') }}
    >
      <Scene blocks={blocks} currentBlock={currentBlock} imbalance={imbalance} gameOver={gameOver} />
    </Canvas>
  );
}
