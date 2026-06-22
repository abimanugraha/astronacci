import { describe, it, expect } from 'vitest';
import { SEAT_LAYOUTS } from '../seatLayout';

describe('SEAT_LAYOUTS', () => {
  it('exposes the three spec-defined aircraft types as keys', () => {
    expect(Object.keys(SEAT_LAYOUTS).sort()).toEqual(
      ['ATR', 'Airbus 320', 'Boeing 737 Max'].sort(),
    );
  });

  it('defines ATR as 18 rows with 2-2 layout (A,C | D,F)', () => {
    expect(SEAT_LAYOUTS.ATR).toEqual({
      rows: 18,
      left: ['A', 'C'],
      right: ['D', 'F'],
    });
  });

  it('defines Airbus 320 as 32 rows with 3-3 layout', () => {
    expect(SEAT_LAYOUTS['Airbus 320']).toEqual({
      rows: 32,
      left: ['A', 'B', 'C'],
      right: ['D', 'E', 'F'],
    });
  });

  it('defines Boeing 737 Max as 32 rows with 3-3 layout', () => {
    expect(SEAT_LAYOUTS['Boeing 737 Max']).toEqual({
      rows: 32,
      left: ['A', 'B', 'C'],
      right: ['D', 'E', 'F'],
    });
  });

  it('never lists B or E for ATR (those seats do not exist on that aircraft)', () => {
    const all = [...SEAT_LAYOUTS.ATR.left, ...SEAT_LAYOUTS.ATR.right];
    expect(all).not.toContain('B');
    expect(all).not.toContain('E');
  });

  it('is frozen at the top level and per-entry', () => {
    expect(Object.isFrozen(SEAT_LAYOUTS)).toBe(true);
    expect(Object.isFrozen(SEAT_LAYOUTS.ATR)).toBe(true);
    expect(Object.isFrozen(SEAT_LAYOUTS['Airbus 320'])).toBe(true);
    expect(Object.isFrozen(SEAT_LAYOUTS['Boeing 737 Max'])).toBe(true);
  });

  it('left and right arrays are frozen', () => {
    expect(Object.isFrozen(SEAT_LAYOUTS.ATR.left)).toBe(true);
    expect(Object.isFrozen(SEAT_LAYOUTS.ATR.right)).toBe(true);
  });
});
