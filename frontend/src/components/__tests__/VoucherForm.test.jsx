import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import VoucherForm from '../VoucherForm';

describe('VoucherForm', () => {
  it('renders all five labelled inputs', () => {
    render(<VoucherForm onSubmit={() => {}} />);
    expect(screen.getByLabelText(/crew name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/crew id/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/flight number/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/flight date/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/aircraft type/i)).toBeInTheDocument();
  });

  it('renders a Generate Vouchers submit button', () => {
    render(<VoucherForm onSubmit={() => {}} />);
    expect(screen.getByRole('button', { name: /generate vouchers/i })).toBeInTheDocument();
  });

  it('shows the three aircraft types as options', () => {
    render(<VoucherForm onSubmit={() => {}} />);
    expect(screen.getByRole('option', { name: 'ATR' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Airbus 320' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Boeing 737 Max' })).toBeInTheDocument();
  });

  it('does not call onSubmit when fields are empty and shows inline errors', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<VoucherForm onSubmit={onSubmit} />);
    await user.click(screen.getByRole('button', { name: /generate vouchers/i }));
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText(/crew name is required/i)).toBeInTheDocument();
  });

  it('submits the five values when the form is valid', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<VoucherForm onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText(/crew name/i), 'Putri');
    await user.type(screen.getByLabelText(/crew id/i), 'CRW001');
    await user.type(screen.getByLabelText(/flight number/i), 'GA102');
    await user.type(screen.getByLabelText(/flight date/i), '2026-07-01');
    await user.selectOptions(
      screen.getByLabelText(/aircraft type/i),
      'Airbus 320',
    );
    await user.click(screen.getByRole('button', { name: /generate vouchers/i }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith({
      crew_name: 'Putri',
      crew_id: 'CRW001',
      flight_number: 'GA102',
      flight_date: '2026-07-01',
      aircraft_type: 'Airbus 320',
    });
  });

  it('disables all inputs and the button and shows Generating… when loading=true', () => {
    render(<VoucherForm onSubmit={() => {}} loading />);
    expect(screen.getByLabelText(/crew name/i)).toBeDisabled();
    expect(screen.getByLabelText(/crew id/i)).toBeDisabled();
    expect(screen.getByLabelText(/flight number/i)).toBeDisabled();
    expect(screen.getByLabelText(/flight date/i)).toBeDisabled();
    expect(screen.getByLabelText(/aircraft type/i)).toBeDisabled();
    expect(screen.getByRole('button', { name: /generating/i })).toBeDisabled();
  });
});
