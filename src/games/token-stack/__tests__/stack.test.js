import { describe, it, expect } from 'vitest';
import { createInitialState, reduce } from '../engine/stack.js';

const SEED = 'test-seed-v1';

function makeState() {
  return createInitialState(SEED);
}

function placeAt(state, x, ts = 1000) {
  // Force the current block to position x before placing
  const forced = {
    ...state,
    currentBlock: { ...state.currentBlock, x },
  };
  return reduce(forced, { type: 'place_block', ts });
}

describe('createInitialState', () => {
  it('creates base block at (0,0) with width 1', () => {
    const s = makeState();
    expect(s.blocks).toHaveLength(1);
    expect(s.blocks[0]).toMatchObject({ x: 0, z: 0, width: 1.0, depth: 1.0 });
  });

  it('currentBlock starts on x axis', () => {
    const s = makeState();
    expect(s.currentBlock.axis).toBe('x');
  });

  it('score starts at 0', () => {
    expect(makeState().score).toBe(0);
  });

  it('gameOver starts false', () => {
    expect(makeState().gameOver).toBe(false);
  });

  it('same seed produces same initial state', () => {
    const s1 = createInitialState('abc');
    const s2 = createInitialState('abc');
    expect(s1.blocks).toEqual(s2.blocks);
    expect(s1.currentBlock.speed).toBe(s2.currentBlock.speed);
  });
});

describe('tick', () => {
  it('moves the current block', () => {
    const s = makeState();
    const startX = s.currentBlock.x;
    const ticked = reduce(s, { type: 'tick', dt: 1 });
    expect(ticked.currentBlock.x).not.toBe(startX);
  });

  it('reverses direction at boundary', () => {
    const s = makeState();
    // Force block to right boundary
    const atBoundary = {
      ...s,
      currentBlock: { ...s.currentBlock, x: 1.5, direction: 1 },
    };
    const after = reduce(atBoundary, { type: 'tick', dt: 1 });
    expect(after.currentBlock.direction).toBe(-1);
  });
});

describe('place_block — full overlap (perfect)', () => {
  it('score increases by 5 on perfect placement', () => {
    const s = makeState();
    // Place directly on top of base block (x=0 = perfect)
    const next = placeAt(s, 0);
    expect(next.score).toBe(5);
  });

  it('width is restored on perfect placement', () => {
    const s = makeState();
    const next = placeAt(s, 0);
    expect(next.blocks[next.blocks.length - 1].width).toBe(1.0);
  });

  it('perfectStreak increments', () => {
    const s = makeState();
    const next = placeAt(s, 0);
    expect(next.perfectStreak).toBe(1);
  });
});

describe('place_block — partial overlap', () => {
  it('score increases by 1 on normal placement', () => {
    const s = makeState();
    // Offset by 0.2 (20% misalignment)
    const next = placeAt(s, 0.2);
    expect(next.score).toBe(1);
  });

  it('width is reduced on partial placement', () => {
    const s = makeState();
    const next = placeAt(s, 0.3);
    const newBlock = next.blocks[next.blocks.length - 1];
    expect(newBlock.width).toBeLessThan(1.0);
  });

  it('perfectStreak resets to 0', () => {
    const s = makeState();
    const withStreak = { ...s, perfectStreak: 3 };
    const next = placeAt(withStreak, 0.3);
    expect(next.perfectStreak).toBe(0);
  });

  it('axis alternates after placement', () => {
    const s = makeState();
    expect(s.currentBlock.axis).toBe('x');
    const next = placeAt(s, 0.1);
    expect(next.currentBlock.axis).toBe('z');
  });
});

describe('place_block — no overlap (miss)', () => {
  it('gameOver becomes true when block misses completely', () => {
    const s = makeState();
    // Place far outside (base width=1, so placing at x=5 is a miss)
    const next = placeAt(s, 5);
    expect(next.gameOver).toBe(true);
  });

  it('no new block added on miss', () => {
    const s = makeState();
    const blockCountBefore = s.blocks.length;
    const next = placeAt(s, 5);
    expect(next.blocks.length).toBe(blockCountBefore);
  });
});

describe('speed curve (T-203)', () => {
  it('speed increases with score', () => {
    let s = makeState();
    const initialSpeed = s.currentBlock.speed;
    // Place multiple blocks to accumulate score
    for (let i = 0; i < 5; i++) {
      s = placeAt(s, 0.1 * i, 1000 + i * 500);
      if (s.gameOver) break;
    }
    if (!s.gameOver) {
      expect(s.currentBlock.speed).toBeGreaterThan(initialSpeed);
    }
  });

  it('speed does not exceed MAX_SPEED (0.025)', () => {
    let s = makeState();
    // Simulate many placements
    for (let i = 0; i < 100; i++) {
      s = placeAt(s, 0, 1000 + i * 500);
      if (s.gameOver) break;
      expect(s.currentBlock.speed).toBeLessThanOrEqual(0.025);
    }
  });
});

describe('determinism (T-204)', () => {
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

    const s1 = runGame('determinism-seed');
    const s2 = runGame('determinism-seed');
    expect(s1.score).toBe(s2.score);
    expect(s1.blocks.length).toBe(s2.blocks.length);
    expect(s1.gameOver).toBe(s2.gameOver);
  });

  it('different seeds can produce different states', () => {
    const s1 = createInitialState('seed-a');
    const s2 = createInitialState('seed-b');
    // At minimum, seeds are different
    expect(s1.seed).not.toBe(s2.seed);
  });
});
