import { describe, expect, it } from 'vitest';
import { stepForKey } from './play';

describe('the computer keyboard', () => {
  it('plays do to high do on A S D F G H J K', () => {
    expect([...'asdfghjk'].map((k) => stepForKey(k, ''))).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
    expect(stepForKey('G', 'KeyG')).toBe(4);
  });

  it('plays the home row on AZERTY too', () => {
    expect(stepForKey('q', 'KeyA')).toBe(0);
  });

  it('ignores other keys', () => {
    expect(stepForKey('z', 'KeyZ')).toBeNull();
    expect(stepForKey('Enter', 'Enter')).toBeNull();
  });
});
