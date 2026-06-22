import { AIRCRAFT_TYPES } from './aircraft';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function validateForm(values) {
  const errors = {};

  const crew_name = (values.crew_name ?? '').trim();
  const crew_id = (values.crew_id ?? '').trim();
  const flight_number = (values.flight_number ?? '').trim();
  const flight_date = values.flight_date ?? '';
  const aircraft_type = values.aircraft_type ?? '';

  if (!crew_name) errors.crew_name = 'Crew name is required.';
  if (!crew_id) errors.crew_id = 'Crew ID is required.';
  if (!flight_number) errors.flight_number = 'Flight number is required.';
  if (!flight_date) {
    errors.flight_date = 'Flight date is required.';
  } else if (!DATE_RE.test(flight_date)) {
    errors.flight_date = 'Flight date must be in YYYY-MM-DD format.';
  }
  if (!aircraft_type) {
    errors.aircraft_type = 'Aircraft type is required.';
  } else if (!AIRCRAFT_TYPES.includes(aircraft_type)) {
    errors.aircraft_type = 'Aircraft type is not in the allowed list.';
  }

  return errors;
}
