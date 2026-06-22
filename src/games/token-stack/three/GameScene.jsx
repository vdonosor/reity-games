import { Canvas, useThree } from '@react-three/fiber';
import { OrthographicCamera } from '@react-three/drei';
import { useMemo, useEffect } from 'react';
import * as THREE from 'three';

const BLOCK_HEIGHT = 0.2;
const BLOCK_COLORS = [
  '#2d9e6b', // Reity green dark
  '#38c47f', // Reity green mid
  '#4fd69a', // Reity green light
  '#a8f0cc', // Reity green pale
  '#f5c842', // Reity accent yellow
];

function Block({ x, z, y, width, depth, colorIndex }) {
  const color = BLOCK_COLORS[colorIndex % BLOCK_COLORS.length];
  return (
    <mesh position={[x, y + BLOCK_HEIGHT / 2, z]} castShadow receiveShadow>
      <boxGeometry args={[width, BLOCK_HEIGHT, depth]} />
      <meshLambertMaterial color={color} />
    </mesh>
  );
}

function CurrentBlock({ x, z, y, width, depth, colorIndex }) {
  const color = BLOCK_COLORS[colorIndex % BLOCK_COLORS.length];
  return (
    <mesh position={[x, y + BLOCK_HEIGHT / 2, z]}>
      <boxGeometry args={[width, BLOCK_HEIGHT, depth]} />
      <meshLambertMaterial color={color} />
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
  const blockCount = blocks.length;

  const stackTopY = useMemo(() => {
    const topBlock = blocks[blockCount - 1];
    return topBlock ? topBlock.y + BLOCK_HEIGHT / 2 : 0;
  }, [blocks, blockCount]);

  return (
    <>
      <OrthographicCamera
        makeDefault
        position={[6, 6, 6]}
        zoom={100}
        near={0.1}
        far={200}
      />
      <CameraRig stackTopY={stackTopY} />

      <ambientLight intensity={0.6} />
      <directionalLight
        position={[5, 10, 5]}
        intensity={1.2}
        castShadow
        shadow-mapSize={[512, 512]}
      />

      {blocks.map((block, i) => (
        <Block
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
        <CurrentBlock
          x={currentBlock.x}
          z={currentBlock.z}
          y={currentBlock.y}
          width={currentBlock.width}
          depth={currentBlock.depth}
          colorIndex={blockCount}
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
      style={{ width: '100%', height: '100%' }}
      gl={{ antialias: true }}
    >
      <Scene blocks={blocks} currentBlock={currentBlock} />
    </Canvas>
  );
}
