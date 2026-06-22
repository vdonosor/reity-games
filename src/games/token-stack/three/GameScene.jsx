import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { useMemo, useRef, useEffect } from 'react';
import * as THREE from 'three';

const BLOCK_HEIGHT = 0.85;
const CRANE_HEIGHT = 3.2;
const COLORS = ['#42c855', '#4ab8d0', '#f0b030', '#e84888', '#9050e0'];

// City background world Y range
const BG_BOTTOM = -5;
const BG_TOP = 300;
const BG_H = BG_TOP - BG_BOTTOM;

function adj(hex, f) {
  const r = Math.min(255, Math.round(parseInt(hex.slice(1, 3), 16) * f));
  const g = Math.min(255, Math.round(parseInt(hex.slice(3, 5), 16) * f));
  const b = Math.min(255, Math.round(parseInt(hex.slice(5, 7), 16) * f));
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

// Canvas texture for side faces — includes balcony / laundry / flower details
function buildSideTex(color, widthUnits, floorLevel = 0) {
  const W = Math.max(100, Math.round(widthUnits * 120));
  const H = 130;
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const g = c.getContext('2d');

  g.fillStyle = color;
  g.fillRect(0, 0, W, H);

  // Cornice (top)
  g.fillStyle = adj(color, 1.22);
  g.fillRect(0, 0, W, 18);
  g.fillStyle = adj(color, 0.72);
  g.fillRect(0, 18, W, 3);

  // Bottom slab
  g.fillStyle = adj(color, 0.60);
  g.fillRect(0, H - 12, W, 12);

  // Side pilasters
  g.fillStyle = adj(color, 0.80);
  g.fillRect(0, 18, 11, H - 30);
  g.fillRect(W - 11, 18, 11, H - 30);

  // Windows: 2×2 panes
  const FW = 26, FH = 64, FRAME = 4, GAP = 10, TOP = 24;
  const inner = W - 22;
  const num = Math.max(1, Math.floor((inner + GAP) / (FW + GAP)));
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
        const px = wx + FRAME + col * (pw + 2);
        const py = TOP + FRAME + row * (ph + 2);
        g.fillStyle = '#c8eaf8';
        g.fillRect(px, py, pw, ph);
        g.fillStyle = 'rgba(255,255,255,0.40)';
        g.fillRect(px + 1, py + 1, Math.floor(pw * 0.45), Math.floor(ph * 0.42));
      }
    }
    // Horizontal window bar
    g.fillStyle = '#f5f0e8';
    g.fillRect(wx + FRAME, TOP + FRAME + ph, FW - FRAME * 2, 2);
  }

  // BALCONY AREA below windows (varies by floor)
  const BALC = TOP + FH + 3;  // y=91

  const detail = floorLevel % 3;

  if (detail === 0) {
    // Balcony slab + vertical railing bars
    g.fillStyle = adj(color, 0.55);
    g.fillRect(sx - 6, BALC, totalW + 12, 4);
    g.fillStyle = adj(color, 0.72);
    for (let bx = sx - 6; bx < sx + totalW + 7; bx += 5) {
      g.fillRect(bx, BALC + 4, 2, 12);
    }
    g.fillStyle = adj(color, 0.68);
    g.fillRect(sx - 6, BALC + 15, totalW + 12, 3);

  } else if (detail === 1) {
    // Ropa colgada (laundry)
    g.fillStyle = adj(color, 0.55);
    g.fillRect(sx - 6, BALC, totalW + 12, 3);
    // Clothesline
    g.strokeStyle = '#b0a080';
    g.lineWidth = 1;
    g.beginPath();
    g.moveTo(sx - 4, BALC + 7);
    g.lineTo(sx + totalW + 3, BALC + 7);
    g.stroke();
    const CLOTH = ['#e84848', '#4090e8', '#f0e030', '#50c870', '#e050a8', '#f0a030'];
    const nItems = Math.max(1, Math.floor((totalW + 6) / 13));
    for (let i = 0; i < nItems; i++) {
      const ix = sx - 3 + Math.round(i * (totalW + 6) / nItems);
      g.fillStyle = CLOTH[(floorLevel * 2 + i) % CLOTH.length];
      g.fillRect(ix, BALC + 8, 8, 11);
      g.fillStyle = 'rgba(0,0,0,0.18)';
      g.fillRect(ix + 1, BALC + 9, 6, 10);
      // peg
      g.fillStyle = '#d8c8a8';
      g.fillRect(ix + 3, BALC + 6, 2, 4);
    }

  } else {
    // Macetas / floreros
    g.fillStyle = adj(color, 0.55);
    g.fillRect(sx - 6, BALC, totalW + 12, 4);
    const FLORALS = ['#e84050', '#f0a020', '#f0e820', '#50d050', '#e050e0', '#50c8e8'];
    for (let i = 0; i < num; i++) {
      const wx = sx + i * (FW + GAP);
      // Maceta
      g.fillStyle = '#7a4818';
      g.fillRect(wx + 2, BALC + 5, FW - 4, 7);
      g.fillStyle = '#5a3010';
      g.fillRect(wx + 4, BALC + 4, FW - 8, 4);
      // Flores
      const nF = Math.floor((FW - 4) / 7);
      for (let j = 0; j < nF; j++) {
        const fx = wx + 3 + j * 7;
        g.fillStyle = FLORALS[(floorLevel + i + j) % FLORALS.length];
        g.beginPath();
        g.arc(fx + 2, BALC + 3, 4, 0, Math.PI * 2);
        g.fill();
        g.fillStyle = '#38a038';
        g.fillRect(fx + 1, BALC + 5, 2, 4);
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

// ---- CITY BACKGROUND TEXTURE ----
function buildCityBgTex() {
  const W = 1024, H = 4096;
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const g = c.getContext('2d');

  // World Y → canvas Y (top of canvas = highest world Y)
  const wp = (wy) => Math.round(H * (1 - (wy - BG_BOTTOM) / BG_H));

  // Sky gradient
  const sky = g.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0.00, '#010112');
  sky.addColorStop(0.06, '#020920');
  sky.addColorStop(0.14, '#061840');
  sky.addColorStop(0.26, '#0a2878');
  sky.addColorStop(0.38, '#1448c0');
  sky.addColorStop(0.50, '#2468d8');
  sky.addColorStop(0.60, '#4892e8');
  sky.addColorStop(0.70, '#7ab8f0');
  sky.addColorStop(0.80, '#b8d8f8');
  sky.addColorStop(0.88, '#dce8f5');
  sky.addColorStop(0.94, '#d8d0b8');
  sky.addColorStop(1.00, '#7a6040');
  g.fillStyle = sky;
  g.fillRect(0, 0, W, H);

  // Ground dirt
  const groundY = wp(0);
  g.fillStyle = '#6a5030';
  g.fillRect(0, groundY, W, H - groundY);
  g.fillStyle = '#5a4025';
  for (let i = 0; i < 7; i++) {
    g.fillRect((i * 149) % (W - 100), groundY, 80 + (i * 73) % 90, 20);
  }
  // Construction barriers (yellow/black)
  for (let i = 0; i < 14; i++) {
    const bx = (i * 73) % (W - 16);
    g.fillStyle = '#f0c020';
    g.fillRect(bx, groundY - 10, 14, 6);
    g.fillStyle = '#101010';
    g.fillRect(bx, groundY - 4, 14, 4);
  }

  // Building silhouettes
  // { x(px), width(px), worldH(units) }
  const bldgs = [
    { x: 0,   w: 100, wh: 30 },
    { x: 95,  w: 65,  wh: 48 },
    { x: 155, w: 55,  wh: 34 },
    { x: 205, w: 85,  wh: 58 },
    { x: 285, w: 60,  wh: 40 },
    { x: 340, w: 95,  wh: 24 },
    { x: 430, w: 50,  wh: 16 },
    { x: 475, w: 40,  wh: 20 },
    { x: 545, w: 35,  wh: 14 },
    { x: 590, w: 50,  wh: 18 },
    { x: 635, w: 45,  wh: 22 },
    { x: 675, w: 85,  wh: 32 },
    { x: 755, w: 60,  wh: 50 },
    { x: 810, w: 88,  wh: 64 },
    { x: 895, w: 55,  wh: 42 },
    { x: 945, w: 79,  wh: 28 },
  ];
  const bldgPalette = ['#182030', '#141828', '#1c2840', '#121a28', '#14202e'];

  bldgs.forEach((b, idx) => {
    const topPx = wp(b.wh);
    const botPx = groundY;
    g.fillStyle = bldgPalette[idx % bldgPalette.length];
    g.fillRect(b.x, topPx, b.w, botPx - topPx);

    // Windows (lit and unlit)
    const wW = 5, wH = 7, wGx = 9, wGy = 12;
    const cols = Math.max(1, Math.floor((b.w - 10) / wGx));
    const rows = Math.max(1, Math.floor((botPx - topPx - 12) / wGy));
    for (let row = 0; row < Math.min(rows, 40); row++) {
      for (let col = 0; col < cols; col++) {
        const wx = b.x + 5 + col * wGx;
        const wy = topPx + 6 + row * wGy;
        const lit = ((idx * 7 + row * 3 + col * 5 + 1) % 4) !== 0;
        if (lit) {
          g.fillStyle = 'rgba(255,225,150,0.65)';
          g.fillRect(wx, wy, wW, wH);
        }
      }
    }
  });

  // Clouds (world y = 40–110)
  const clouds = [
    { wx: 0.18, wy: 55,  rw: 130, rh: 16 },
    { wx: 0.42, wy: 62,  rw: 160, rh: 20 },
    { wx: 0.70, wy: 52,  rw: 110, rh: 14 },
    { wx: 0.08, wy: 72,  rw: 90,  rh: 12 },
    { wx: 0.55, wy: 78,  rw: 180, rh: 22 },
    { wx: 0.85, wy: 68,  rw: 120, rh: 16 },
    { wx: 0.30, wy: 90,  rw: 140, rh: 18 },
    { wx: 0.65, wy: 100, rw: 100, rh: 13 },
    { wx: 0.22, wy: 108, rw: 150, rh: 17 },
  ];
  clouds.forEach(cl => {
    const cx = Math.round(cl.wx * W);
    const cy = wp(cl.wy);
    const cw = cl.rw;
    const ch = Math.round(cl.rh / BG_H * H);
    for (let i = 0; i < 5; i++) {
      const ox = cx + (i - 2) * cw * 0.22;
      const oy = cy - Math.abs(i - 2) * ch * 0.25;
      g.fillStyle = 'rgba(255,255,255,0.82)';
      g.beginPath();
      g.ellipse(ox, oy, cw * 0.5, ch * (0.55 + (i % 2) * 0.2), 0, 0, Math.PI * 2);
      g.fill();
    }
  });

  // Airplane at world y ≈ 130 (heading left)
  {
    const py = wp(132);
    const px = Math.round(W * 0.62);
    g.fillStyle = 'rgba(220,230,245,0.92)';
    // fuselage
    g.fillRect(px - 22, py - 4, 44, 8);
    // nose
    g.beginPath(); g.moveTo(px + 22, py - 2); g.lineTo(px + 34, py); g.lineTo(px + 22, py + 2); g.fill();
    // tail fin
    g.fillRect(px - 26, py - 11, 8, 7);
    // wings
    g.fillRect(px - 8, py - 18, 20, 5);
    g.fillRect(px - 8, py + 13, 20, 5);
    // contrails
    g.strokeStyle = 'rgba(255,255,255,0.50)';
    g.lineWidth = 2.5;
    g.beginPath(); g.moveTo(px - 22, py - 2); g.lineTo(px - 90, py - 2); g.stroke();
    g.beginPath(); g.moveTo(px - 22, py + 2); g.lineTo(px - 90, py + 2); g.stroke();
  }

  // Satellite at world y ≈ 240
  {
    const sy = wp(248);
    const sx = Math.round(W * 0.32);
    // body
    g.fillStyle = 'rgba(185,195,210,0.92)';
    g.fillRect(sx - 9, sy - 6, 18, 12);
    // solar panels (blue)
    g.fillStyle = 'rgba(60,90,200,0.88)';
    g.fillRect(sx - 36, sy - 4, 22, 8);
    g.fillRect(sx + 14, sy - 4, 22, 8);
    // panel grid lines
    g.strokeStyle = 'rgba(120,150,255,0.5)';
    g.lineWidth = 1;
    for (let d = 0; d < 3; d++) {
      g.beginPath(); g.moveTo(sx - 36 + d * 7, sy - 4); g.lineTo(sx - 36 + d * 7, sy + 4); g.stroke();
      g.beginPath(); g.moveTo(sx + 14 + d * 7, sy - 4); g.lineTo(sx + 14 + d * 7, sy + 4); g.stroke();
    }
    // antenna
    g.strokeStyle = 'rgba(185,195,210,0.88)';
    g.lineWidth = 1.5;
    g.beginPath(); g.moveTo(sx, sy - 6); g.lineTo(sx - 4, sy - 18); g.stroke();
    g.beginPath(); g.moveTo(sx, sy - 6); g.lineTo(sx + 5, sy - 14); g.stroke();
  }

  // Second satellite at world y ≈ 270
  {
    const sy2 = wp(275);
    const sx2 = Math.round(W * 0.72);
    g.fillStyle = 'rgba(180,185,195,0.80)';
    g.fillRect(sx2 - 6, sy2 - 4, 12, 8);
    g.fillStyle = 'rgba(50,80,180,0.75)';
    g.fillRect(sx2 - 26, sy2 - 3, 16, 6);
    g.fillRect(sx2 + 10, sy2 - 3, 16, 6);
  }

  // Stars (world y > 175)
  const starsTop = wp(295);
  const starsBtm = wp(175);
  for (let i = 0; i < 220; i++) {
    const stx = ((i * 1619 + 42) % 997) / 997 * W;
    const sty_n = ((i * 2971 + 17) % 997) / 997;
    const sty = starsTop + sty_n * (starsBtm - starsTop);
    const t = i % 3;
    g.fillStyle = t === 0 ? 'rgba(255,255,255,0.90)' :
                  t === 1 ? 'rgba(200,220,255,0.70)' :
                            'rgba(255,255,200,0.60)';
    g.fillRect(stx, sty, t === 0 ? 2 : 1, t === 0 ? 2 : 1);
  }

  return new THREE.CanvasTexture(c);
}

// ---- COMPONENTS ----

function FloorBlock({ x, z, y, width, depth, colorIndex, active = false }) {
  const mats = useMemo(() => {
    const color = COLORS[colorIndex % COLORS.length];
    const sX = buildSideTex(color, depth, colorIndex);
    const sZ = buildSideTex(color, width, colorIndex);
    const roofTex = buildRoofTex(color);
    const emissive = active ? new THREE.Color(0.07, 0.25, 0.09) : new THREE.Color(0, 0, 0);
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

// Static city background plane
function Background() {
  const texture = useMemo(() => buildCityBgTex(), []);
  return (
    <mesh position={[0, (BG_TOP + BG_BOTTOM) / 2, -5]}>
      <planeGeometry args={[26, BG_H]} />
      <meshBasicMaterial map={texture} />
    </mesh>
  );
}

// Perspective camera — frontal view, follows tower
function CameraRig({ stackTopY }) {
  const { camera } = useThree();
  const stackTopYRef = useRef(stackTopY);
  stackTopYRef.current = stackTopY;

  useEffect(() => {
    camera.fov = 75;
    camera.near = 0.1;
    camera.far = 400;
    camera.updateProjectionMatrix();
    camera.position.set(0, stackTopY + 2.2, 8.5);
    camera.lookAt(0, stackTopY - 1.5, 0);
    camera.updateProjectionMatrix();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useFrame(() => {
    const ty = stackTopYRef.current;
    camera.position.y += (ty + 2.2 - camera.position.y) * 0.06;
    camera.position.x += (0 - camera.position.x) * 0.06;
    camera.lookAt(0, ty - 1.5, 0);
    camera.updateProjectionMatrix();
  });

  return null;
}

// All placed blocks — group rotates for tower sway
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

// Crane cable from pivot to block
function CraneCable({ pivotX, pivotY, blockX, blockY }) {
  const dx = blockX - pivotX;
  const dy = blockY - pivotY;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len < 0.05) return null;
  const midX = (pivotX + blockX) / 2;
  const midY = (pivotY + blockY) / 2;
  const rotZ = Math.atan2(dx, -dy);  // rotate +Y axis to cable direction
  return (
    <mesh position={[midX, midY, 0]} rotation={[0, 0, rotZ]}>
      <cylinderGeometry args={[0.025, 0.025, len, 4]} />
      <meshBasicMaterial color="#a87820" />
    </mesh>
  );
}

function Crane({ currentBlock, stackTopY }) {
  const pivotY = stackTopY + CRANE_HEIGHT;
  const blockTopY = currentBlock.y + BLOCK_HEIGHT / 2;
  return (
    <>
      <mesh position={[0, pivotY, 0]}>
        <boxGeometry args={[5.0, 0.10, 0.10]} />
        <meshLambertMaterial color="#f0a020" />
      </mesh>
      <mesh position={[0, pivotY - 0.08, 0]}>
        <sphereGeometry args={[0.10, 6, 4]} />
        <meshLambertMaterial color="#c07010" />
      </mesh>
      <CraneCable pivotX={0} pivotY={pivotY - 0.08} blockX={currentBlock.x} blockY={blockTopY} />
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
      <Background />

      <ambientLight intensity={0.70} />
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
      scene={{ background: new THREE.Color('#020215') }}
    >
      <Scene blocks={blocks} currentBlock={currentBlock} imbalance={imbalance} gameOver={gameOver} />
    </Canvas>
  );
}
