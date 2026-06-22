import { describe, it, expect } from 'vitest';
import { validateForm } from '../validation';

const valid = {
  crew_name: 'Putri',
  crew_id: 'CRW001',
  flight_number: 'GA102',
  flight_date: '2026-07-01',
  aircraft_type: 'ATR',
};

describe('validateForm', () => {
  it('returns no errors for a fully valid payload', () => {
    expect(validateForm(valid)).toEqual({});
  });

  it('flags missing crew_name', () => {
    expect(validateForm({ ...valid, crew_name: '' })).toHaveProperty('crew_name');
  });

  it('flags whitespace-only crew_name', () => {
    expect(validateForm({ ...valid, crew_name: '   ' })).toHaveProperty('crew_name');
  });

  it('flags missing crew_id', () => {
    expect(validateForm({ ...valid, crew_id: '' })).toHaveProperty('crew_id');
  });

  it('flags missing flight_number', () => {
    expect(validateForm({ ...valid, flight_number: '' })).toHaveProperty('flight_number');
  });

  it('flags missing flight_date', () => {
    expect(validateForm({ ...valid, flight_date: '' })).toHaveProperty('flight_date');
  });

  it('flags flight_date in wrong format', () => {
    expect(validateForm({ ...valid, flight_date: '01/07/2026' })).toHaveProperty('flight_date');
  });

  it('flags missing aircraft_type', () => {
    expect(validateForm({ ...valid, aircraft_type: '' })).toHaveProperty('aircraft_type');
  });

  it('flags aircraft_type not in allowlist', () => {
    expect(validateForm({ ...valid, aircraft_type: 'Boeing 747' })).toHaveProperty('aircraft_type');
  });

  it('accepts all three valid aircraft types', () => {
    for (const t of ['ATR', 'Airbus 320', 'Boeing 737 Max']) {
      expect(validateForm({ ...valid, aircraft_type: t })).toEqual({});
    }
  });

  it('does not mutate the input', () => {
    const input = { ...valid, crew_name: '  Putri  ' };
    const snapshot = JSON.stringify(input);
    validateForm(input);
    expect(JSON.stringify(input)).toBe(snapshot);
  });
});
