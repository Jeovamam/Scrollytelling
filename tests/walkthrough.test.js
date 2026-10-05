import { test } from 'node:test';
import assert from 'node:assert/strict';
import { walkthroughParams } from '../src/utils/walkthroughFrames.js';

test('walkthrough starts on image A and ends settled on image B', () => {
  const start = walkthroughParams(0);
  assert.equal(start.a.alpha, 1);
  assert.equal(start.a.scale, 1);
  assert.equal(start.b.alpha, 0);

  const end = walkthroughParams(1);
  assert.equal(end.a.alpha, 0);
  assert.equal(end.b.alpha, 1);
  assert.equal(end.b.scale, 1);
});

test('walkthrough camera only moves forward and the crossfade is monotonic', () => {
  let prevA = 0, prevMix = -1;
  for (let i = 0; i <= 100; i++) {
    const p = walkthroughParams(i / 100);
    assert.ok(p.a.scale >= prevA);
    assert.ok(p.b.alpha >= prevMix);
    assert.ok(Math.abs(p.a.alpha + p.b.alpha - 1) < 1e-9);
    prevA = p.a.scale; prevMix = p.b.alpha;
  }
});
