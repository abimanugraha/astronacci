import { describe, it, expect } from 'vitest';
import { AIRCRAFT_TYPES } from '../aircraft';

describe('AIRCRAFT_TYPES', () => {
  it('contains the three spec-defined aircraft types in order', () => {
    expect(AIRCRAFT_TYPES).toEqual(['ATR', 'Airbus 320', 'Boeing 737 Max']);
  });

  it('is frozen', () => {
    expect(Object.isFrozen(AIRCRAFT_TYPES)).toBe(true);
  });
});
