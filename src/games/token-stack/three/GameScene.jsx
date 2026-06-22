import { Canvas, useThree } from '@react-three/fiber';
import { OrthographicCamera } from '@react-three/drei';
import { useMemo, useEffect } from 'react';
import * as THREE from 'three';

const BLOCK_HEIGHT = 0.5;

// Ajusta luminosidad de un color hex (factor>1 aclara, <1 oscurece)
function adj(hex, f) {
  const r = Math.min(255, Math.round(parseInt(hex.slice(1,3),16)*f));
  const g = Math.min(255, Math.round(parseInt(hex.slice(3,5),16)*f));
  const b = Math.min(255, Math.round(parseInt(hex.slice(5,7),16)*f));
  return `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`;
}

// Paleta de colores estilo cartoon — saturados como en los edificios de referencia
const COLORS = ['#42c855','#4ab8d0','#f0b030','#e84888','#9050e0'];

function buildSideTex(color, widthUnits) {
  const W = Math.max(80, Math.round(widthUnits * 100));
  const H = 80;
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const g = c.getContext('2d');

  // Pared base
  g.fillStyle = color;
  g.fillRect(0, 0, W, H);

  // Cornisa superior (más claro)
  g.fillStyle = adj(color, 1.22);
  g.fillRect(0, 0, W, 11);

  // Zócalo inferior (más oscuro)
  g.fillStyle = adj(color, 0.72);
  g.fillRect(0, H - 9, W, 9);

  // Columnas laterales
  g.fillStyle = adj(color, 0.82);
  g.fillRect(0, 11, 7, H - 20);
  g.fillRect(W - 7, 11, 7, H - 20);

  // Ventanas: marco blanco + 4 vidrios (2×2)
  const FW = 28, FH = 44, FRAME = 4, GAP = 10;
  const TOP = 14;
  const inner = W - 14;
  const num = Math.max(1, Math.floor((inner + GAP) / (FW + GAP)));
  const totalW = num * FW + (num - 1) * GAP;
  let sx = Math.round((W - totalW) / 2);

  for (let i = 0; i < num; i++) {
    const wx = sx + i * (FW + GAP);
    // Sombra
    g.fillStyle = adj(color, 0.62);
    g.fillRect(wx+3, TOP+3, FW, FH);
    // Marco blanco
    g.fillStyle = '#f5f0e8';
    g.fillRect(wx, TOP, FW, FH);
    // Vidrios (2 columnas × 2 filas)
    const pw = Math.floor((FW - FRAME*2 - 2)/2);
    const ph = Math.floor((FH - FRAME*2 - 2)/2);
    for (let row=0; row<2; row++) {
      for (let col=0; col<2; col++) {
        const px = wx + FRAME + col*(pw+2);
        const py = TOP + FRAME + row*(ph+2);
        // Vidrio (mezcla azul + color del edificio para tinte)
        g.fillStyle = '#c8eaf8';
        g.fillRect(px, py, pw, ph);
        // Reflejo
        g.fillStyle = 'rgba(255,255,255,0.38)';
        g.fillRect(px+1, py+1, Math.floor(pw*0.45), Math.floor(ph*0.42));
      }
    }
    // Línea horizontal de marco (palo del marco)
    g.fillStyle = '#f5f0e8';
    g.fillRect(wx+FRAME, TOP + FRAME + ph, FW-FRAME*2, 2);
  }

  const t = new THREE.CanvasTexture(c);
  return t;
}

function buildRoofTex(color) {
  const c = document.createElement('canvas');
  c.width = 128; c.height = 128;
  const g = c.getContext('2d');
  // Techo: mismo color que el edificio, más claro
  g.fillStyle = adj(color, 1.15);
  g.fillRect(0, 0, 128, 128);
  // Borde antepecho
  g.strokeStyle = adj(color, 0.72);
  g.lineWidth = 5;
  g.strokeRect(2.5, 2.5, 123, 123);
  // Líneas sutiles de azotea
  g.strokeStyle = adj(color, 0.88);
  g.lineWidth = 1;
  for (let i=20;i<128;i+=20){
    g.beginPath();g.moveTo(i,0);g.lineTo(i,128);g.stroke();
    g.beginPath();g.moveTo(0,i);g.lineTo(128,i);g.stroke();
  }
  return new THREE.CanvasTexture(c);
}

// BoxGeometry face order: px(0) nx(1) py(2) ny(3) pz(4) nz(5)
// Desde cámara (7,7,7): caras visibles = +x, +y, +z
function FloorBlock({ x, z, y, width, depth, colorIndex, active=false }) {
  const mats = useMemo(() => {
    const color = COLORS[colorIndex % COLORS.length];
    // px/nx → cara perpendicular a X, abarca `depth` en ancho
    const sX = buildSideTex(color, depth);
    // pz/nz → cara perpendicular a Z, abarca `width` en ancho
    const sZ = buildSideTex(color, width);
    const roofTex = buildRoofTex(color);

    const emissive = active ? new THREE.Color(0.08,0.28,0.10) : new THREE.Color(0,0,0);
    const mX = new THREE.MeshLambertMaterial({ map: sX, emissive });
    const mZ = new THREE.MeshLambertMaterial({ map: sZ, emissive });
    const mR = new THREE.MeshLambertMaterial({ map: roofTex, emissive: new THREE.Color(0,0,0) });
    const mB = new THREE.MeshLambertMaterial({ color: adj(color,0.55) });

    return [mX, mX, mR, mB, mZ, mZ];
  }, [colorIndex, width, depth, active]);

  return (
    <mesh position={[x, y + BLOCK_HEIGHT/2, z]} castShadow receiveShadow>
      <boxGeometry args={[width, BLOCK_HEIGHT, depth]} />
      {mats.map((m,i)=><primitive key={i} object={m} attach={`material-${i}`}/>)}
    </mesh>
  );
}

function CameraRig({ stackTopY }) {
  const { camera } = useThree();
  useEffect(() => {
    const target = new THREE.Vector3(0, stackTopY, 0);
    const offset = new THREE.Vector3(7, 7, 7);
    camera.position.copy(target).add(offset);
    camera.lookAt(target);
    camera.updateProjectionMatrix();
  }, [camera, stackTopY]);
  return null;
}

function Scene({ blocks, currentBlock }) {
  const stackTopY = useMemo(() => {
    const top = blocks[blocks.length-1];
    return top ? top.y + BLOCK_HEIGHT/2 : 0;
  }, [blocks]);

  return (
    <>
      <OrthographicCamera makeDefault position={[7,7,7]} zoom={90} near={0.1} far={300}/>
      <CameraRig stackTopY={stackTopY}/>

      <ambientLight intensity={0.65}/>
      <directionalLight position={[5,14,4]} intensity={1.2} castShadow shadow-mapSize={[512,512]}/>
      <directionalLight position={[-4,6,-3]} intensity={0.30}/>

      {blocks.map((block,i)=>(
        <FloorBlock
          key={i}
          x={block.x} z={block.z} y={block.y}
          width={block.width} depth={block.depth}
          colorIndex={i}
        />
      ))}

      {!currentBlock.gameOver && (
        <FloorBlock
          x={currentBlock.x} z={currentBlock.z} y={currentBlock.y}
          width={currentBlock.width} depth={currentBlock.depth}
          colorIndex={blocks.length}
          active
        />
      )}
    </>
  );
}

export function GameScene({ blocks, currentBlock }) {
  return (
    <Canvas
      data-testid="game-scene-ready"
      shadows
      style={{ width:'100%', height:'100%' }}
      gl={{ antialias:true, preserveDrawingBuffer:true }}
    >
      <Scene blocks={blocks} currentBlock={currentBlock}/>
    </Canvas>
  );
}
