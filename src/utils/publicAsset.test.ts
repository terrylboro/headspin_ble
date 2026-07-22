import { describe, expect, test } from 'vitest';
import { publicAsset } from './publicAsset';

describe('publicAsset', () => {
  test('joins the current base path', () => {
    expect(publicAsset('/sounds/aligned.mp3')).toBe('/sounds/aligned.mp3');
  });

  test('leaves remote URLs unchanged', () => {
    expect(publicAsset('https://example.com/model.ply')).toBe('https://example.com/model.ply');
  });
});
