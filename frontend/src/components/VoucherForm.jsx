import { useState } from 'react';
import { AIRCRAFT_TYPES } from '../lib/aircraft';
import { validateForm } from '../lib/validation';

const INITIAL = {
  crew_name: '',
  crew_id: '',
  flight_number: '',
  flight_date: '',
  aircraft_type: '',
};

export default function VoucherForm({ onSubmit, loading = false }) {
  const [values, setValues] = useState(INITIAL);
  const [errors, setErrors] = useState({});

  function update(field) {
    return (event) => {
      setValues((v) => ({ ...v, [field]: event.target.value }));
      setErrors((e) => ({ ...e, [field]: undefined }));
    };
  }

  function handleSubmit(event) {
    event.preventDefault();
    const nextErrors = validateForm(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    onSubmit(values);
  }

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2" noValidate>
      <Field
        label="Crew Name"
        name="crew_name"
        value={values.crew_name}
        onChange={update('crew_name')}
        error={errors.crew_name}
        disabled={loading}
        autoComplete="off"
      />
      <Field
        label="Crew ID"
        name="crew_id"
        value={values.crew_id}
        onChange={update('crew_id')}
        error={errors.crew_id}
        disabled={loading}
        autoComplete="off"
      />
      <Field
        label="Flight Number"
        name="flight_number"
        value={values.flight_number}
        onChange={update('flight_number')}
        error={errors.flight_number}
        disabled={loading}
        placeholder="GA102"
        autoComplete="off"
      />
      <Field
        label="Flight Date"
        name="flight_date"
        type="date"
        value={values.flight_date}
        onChange={update('flight_date')}
        error={errors.flight_date}
        disabled={loading}
      />
      <div className="flex flex-col sm:col-span-2">
        <label htmlFor="aircraft_type" className="label mb-1">
          <span className="label-text">Aircraft Type</span>
        </label>
        <select
          id="aircraft_type"
          name="aircraft_type"
          value={values.aircraft_type}
          onChange={update('aircraft_type')}
          disabled={loading}
          className={`select w-full ${errors.aircraft_type ? 'select-error' : ''}`}
        >
          <option value="">Select an aircraft type</option>
          {AIRCRAFT_TYPES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        {errors.aircraft_type && (
          <label htmlFor="aircraft_type" className="label">
            <span className="label-text-alt text-error">{errors.aircraft_type}</span>
          </label>
        )}
      </div>
      <div className="sm:col-span-2">
        <button
          type="submit"
          disabled={loading}
          className="btn btn-primary w-full"
        >
          {loading ? (
            <>
              <span className="loading loading-spinner loading-sm" aria-hidden="true" />
              Generating…
            </>
          ) : 'Generate Vouchers'}
        </button>
      </div>
    </form>
  );
}

function Field({ label, name, value, onChange, error, disabled, type = 'text', placeholder, autoComplete }) {
  return (
    <div className="flex flex-col">
      <label htmlFor={name} className="label mb-1">
        <span className="label-text">{label}</span>
      </label>
      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        disabled={disabled}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className={`input w-full ${error ? 'input-error' : ''}`}
      />
      {error && (
        <label htmlFor={name} className="label">
          <span className="label-text-alt text-error">{error}</span>
        </label>
      )}
    </div>
  );
}
