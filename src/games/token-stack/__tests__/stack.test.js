import { describe, it, expect } from 'vitest';
import { createInitialState, reduce } from '../engine/stack.js';

const SEED = 'test-seed-v1';

function makeState() {
  return createInitialState(SEED);
}

// Force currentBlock.x to a value, then place it
function placeAt(state, x, ts = 1000) {
  const forced = { ...state, currentBlock: { ...state.currentBlock, x } };
  return reduce(forced, { type: 'place_block', ts });
}

describe('createInitialState', () => {
  it('creates base block at (0,0)', () => {
    const s = makeState();
    expect(s.blocks).toHaveLength(1);
    expect(s.blocks[0]).toMatchObject({ x: 0, z: 0 });
  });

  it('starts with 3 lives', () => {
    expect(makeState().lives).toBe(3);
  });

  it('starts with 0 imbalance', () => {
    expect(makeState().imbalance).toBe(0);
  });

  it('score starts at 0', () => {
    expect(makeState().score).toBe(0);
  });

  it('gameOver starts false', () => {
    expect(makeState().gameOver).toBe(false);
  });

  it('currentBlock uses phase/phaseSpeed (pendulum model)', () => {
    const s = makeState();
    expect(s.currentBlock.phase).toBeDefined();
    expect(s.currentBlock.phaseSpeed).toBeDefined();
    expect(s.currentBlock.axis).toBeUndefined();
    expect(s.currentBlock.direction).toBeUndefined();
  });

  it('same seed produces same initial state', () => {
    const s1 = createInitialState('abc');
    const s2 = createInitialState('abc');
    expect(s1.blocks).toEqual(s2.blocks);
    expect(s1.currentBlock.phase).toBe(s2.currentBlock.phase);
  });
});

describe('tick', () => {
  it('advances the phase', () => {
    const s = makeState();
    const before = s.currentBlock.phase;
    const after = reduce(s, { type: 'tick', dt: 1 });
    expect(after.currentBlock.phase).toBeGreaterThan(before);
  });

  it('moves x using sinusoidal motion', () => {
    const s = { ...makeState(), currentBlock: { ...makeState().currentBlock, phase: 0 } };
    const after = reduce(s, { type: 'tick', dt: 1 });
    expect(after.currentBlock.x).not.toBe(s.currentBlock.x);
  });
});

describe('place_block — perfect (x=0, 100% overlap)', () => {
  it('score increases by 5', () => {
    expect(placeAt(makeState(), 0).score).toBe(5);
  });

  it('block placed at exact x (no trimming)', () => {
    const next = placeAt(makeState(), 0);
    expect(next.blocks[next.blocks.length - 1].x).toBe(0);
  });

  it('width unchanged after placement', () => {
    const s = makeState();
    const originalWidth = s.currentBlock.width;
    const next = placeAt(s, 0);
    expect(next.blocks[next.blocks.length - 1].width).toBe(originalWidth);
  });
});

describe('place_block — normal (x=0.3, ~70% overlap)', () => {
  it('score increases by 1', () => {
    expect(placeAt(makeState(), 0.3).score).toBe(1);
  });

  it('width NOT reduced (no trimming)', () => {
    const s = makeState();
    const originalWidth = s.currentBlock.width;
    const next = placeAt(s, 0.3);
    expect(next.blocks[next.blocks.length - 1].width).toBe(originalWidth);
  });

  it('block placed at currentBlock x', () => {
    const next = placeAt(makeState(), 0.3);
    expect(next.blocks[next.blocks.length - 1].x).toBe(0.3);
  });
});

describe('place_block — miss (x=0.6, only 40% overlap)', () => {
  it('loses one life but game continues', () => {
    const next = placeAt(makeState(), 0.6);
    expect(next.lives).toBe(2);
    expect(next.gameOver).toBe(false);
  });

  it('no new block added on miss', () => {
    const s = makeState();
    expect(placeAt(s, 0.6).blocks.length).toBe(s.blocks.length);
  });

  it('game continues after 1st and 2nd miss', () => {
    let s = placeAt(makeState(), 0.6);
    expect(s.lives).toBe(2);
    s = placeAt(s, 0.6);
    expect(s.lives).toBe(1);
    expect(s.gameOver).toBe(false);
  });

  it('gameOver on 3rd miss', () => {
    let s = placeAt(makeState(), 0.6);
    s = placeAt(s, 0.6);
    s = placeAt(s, 0.6);
    expect(s.gameOver).toBe(true);
    expect(s.lives).toBe(0);
  });

  it('complete miss (x=5) also counts as one miss only', () => {
    const next = placeAt(makeState(), 5);
    expect(next.lives).toBe(2);
    expect(next.gameOver).toBe(false);
  });
});

describe('speed curve', () => {
  it('phaseSpeed increases with score', () => {
    let s = makeState();
    const initialSpeed = s.currentBlock.phaseSpeed;
    for (let i = 0; i < 5; i++) {
      s = placeAt(s, 0, 1000 + i * 500);
      if (s.gameOver) break;
    }
    if (!s.gameOver) {
      expect(s.currentBlock.phaseSpeed).toBeGreaterThan(initialSpeed);
    }
  });

  it('phaseSpeed does not exceed MAX_PHASE_SPEED (0.058)', () => {
    let s = makeState();
    for (let i = 0; i < 100; i++) {
      s = placeAt(s, 0, 1000 + i * 500);
      if (s.gameOver) break;
      expect(s.currentBlock.phaseSpeed).toBeLessThanOrEqual(0.058);
    }
  });
});

describe('determinism', () => {
  it('same seed + same events produce same final state', () => {
    const events = [
      { type: 'place_block', ts: 1000 },
      { type: 'place_block', ts: 1800 },
      { type: 'place_block', ts: 2600 },
    ];

    function runGame(seed) {
      let s = createInitialState(seed);
      for (const ev of events) {
        if (!s.gameOver) s = reduce(s, ev);
      }
      return s;
    }

    const s1 = runGame('det-seed');
    const s2 = runGame('det-seed');
    expect(s1.score).toBe(s2.score);
    expect(s1.blocks.length).toBe(s2.blocks.length);
    expect(s1.gameOver).toBe(s2.gameOver);
    expect(s1.lives).toBe(s2.lives);
  });

  it('different seeds are tracked separately', () => {
    expect(createInitialState('seed-a').seed).not.toBe(createInitialState('seed-b').seed);
  });
});
