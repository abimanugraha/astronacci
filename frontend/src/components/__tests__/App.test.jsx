import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../../App';

vi.mock('../../lib/api', () => ({
  checkVoucher: vi.fn(),
  generateVoucher: vi.fn(),
  listVouchers: vi.fn(),
}));

import { checkVoucher, generateVoucher, listVouchers } from '../../lib/api';

async function fillForm(user) {
  await user.type(screen.getByLabelText(/crew name/i), 'Putri');
  await user.type(screen.getByLabelText(/crew id/i), 'CRW001');
  await user.type(screen.getByLabelText(/flight number/i), 'GA102');
  await user.type(screen.getByLabelText(/flight date/i), '2026-07-01');
  await user.selectOptions(screen.getByLabelText(/aircraft type/i), 'ATR');
}

describe('App', () => {
  beforeEach(() => {
    checkVoucher.mockReset();
    generateVoucher.mockReset();
    listVouchers.mockReset();
  });

  it('renders the page heading and form', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: /voucher seat assignment/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/crew name/i)).toBeInTheDocument();
  });

  it('calls checkVoucher then generateVoucher in order on a successful submit and shows seats', async () => {
    const user = userEvent.setup();
    checkVoucher.mockResolvedValueOnce({ exists: false, message: 'no voucher' });
    generateVoucher.mockResolvedValueOnce({
      id: 7,
      crew_name: 'Putri',
      crew_id: 'CRW001',
      flight_number: 'GA102',
      flight_date: '2026-07-01',
      aircraft_type: 'ATR',
      seats: ['1A', '14C', '18F'],
      created_at: '2026-06-22T00:00:00.000000Z',
      updated_at: '2026-06-22T00:00:00.000000Z',
    });

    render(<App />);
    await fillForm(user);
    await user.click(screen.getByRole('button', { name: /generate vouchers/i }));

    expect(checkVoucher).toHaveBeenCalledWith({ flight_number: 'GA102', flight_date: '2026-07-01' });
    expect(generateVoucher).toHaveBeenCalledTimes(1);

    await waitFor(() => {
      expect(screen.getAllByText('1A').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('14C').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('18F').length).toBeGreaterThanOrEqual(1);
    });

    await waitFor(() => {
      expect(screen.getByLabelText('Seat map for ATR')).toBeInTheDocument();
    });
  });

  it('shows the duplicate banner when checkVoucher returns exists=true and does NOT call generateVoucher', async () => {
    const user = userEvent.setup();
    checkVoucher.mockResolvedValueOnce({ exists: true, message: 'exists' });

    render(<App />);
    await fillForm(user);
    await user.click(screen.getByRole('button', { name: /generate vouchers/i }));

    await waitFor(() => {
      expect(
        screen.getByText('Vouchers have already been generated for this flight and date.'),
      ).toBeInTheDocument();
    });
    expect(generateVoucher).not.toHaveBeenCalled();
  });

  it('shows the duplicate banner when checkVoucher throws (422) and does NOT call generateVoucher', async () => {
    const user = userEvent.setup();
    const err = new Error('422');
    err.response = { status: 422, data: { message: 'invalid' } };
    checkVoucher.mockRejectedValueOnce(err);

    render(<App />);
    await fillForm(user);
    await user.click(screen.getByRole('button', { name: /generate vouchers/i }));

    await waitFor(() => {
      expect(
        screen.getByText('Vouchers have already been generated for this flight and date.'),
      ).toBeInTheDocument();
    });
    expect(generateVoucher).not.toHaveBeenCalled();
  });

  it('shows the duplicate banner when generateVoucher throws 409', async () => {
    const user = userEvent.setup();
    checkVoucher.mockResolvedValueOnce({ exists: false, message: 'no voucher' });
    const err = new Error('409');
    err.response = { status: 409, data: { message: 'duplicate' } };
    generateVoucher.mockRejectedValueOnce(err);

    render(<App />);
    await fillForm(user);
    await user.click(screen.getByRole('button', { name: /generate vouchers/i }));

    await waitFor(() => {
      expect(
        screen.getByText('Vouchers have already been generated for this flight and date.'),
      ).toBeInTheDocument();
    });
  });

  it('shows generic error when generateVoucher throws a non-409 error', async () => {
    const user = userEvent.setup();
    checkVoucher.mockResolvedValueOnce({ exists: false, message: 'no voucher' });
    const err = new Error('500');
    err.response = { status: 500, data: { message: 'boom' } };
    generateVoucher.mockRejectedValueOnce(err);

    render(<App />);
    await fillForm(user);
    await user.click(screen.getByRole('button', { name: /generate vouchers/i }));

    await waitFor(() => {
      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    });
  });

  it('shows the Generate form by default and hides the Flight List table', () => {
    render(<App />);
    expect(screen.getByLabelText(/crew name/i)).toBeInTheDocument();
    expect(screen.queryByText(/No vouchers generated yet/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('switches to the Flight List when its tab is clicked', async () => {
    listVouchers.mockResolvedValue([
      {
        id: 1, crew_name: 'Putri', crew_id: 'CRW001',
        flight_number: 'GA102', flight_date: '2026-07-01',
        aircraft_type: 'ATR',
        seats: ['1A', '14C', '18F'],
      },
    ]);

    render(<App />);
    await userEvent.setup().click(screen.getByRole('tab', { name: /flight list/i }));

    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument();
      expect(screen.getByText('Putri')).toBeInTheDocument();
    });
    expect(screen.queryByLabelText(/crew name/i)).not.toBeInTheDocument();
  });
});
