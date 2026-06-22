import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import VoucherList from '../VoucherList';

vi.mock('../../lib/api', () => ({
  listVouchers: vi.fn(),
}));

import { listVouchers } from '../../lib/api';

const sampleVouchers = [
  {
    id: 1, crew_name: 'Putri', crew_id: 'CRW001',
    flight_number: 'GA102', flight_date: '2026-07-01',
    aircraft_type: 'ATR',
    seats: ['1A', '14C', '18F'],
  },
  {
    id: 2, crew_name: 'Budi', crew_id: 'CRW002',
    flight_number: 'GA205', flight_date: '2026-07-03',
    aircraft_type: 'Airbus 320',
    seats: ['5A', '6B', '7C'],
  },
];

describe('VoucherList', () => {
  beforeEach(() => {
    listVouchers.mockReset();
  });

  it('shows the loading state on first render', () => {
    listVouchers.mockReturnValue(new Promise(() => {}));
    render(<VoucherList />);
    expect(screen.getByText(/Loading flights/i)).toBeInTheDocument();
  });

  it('renders a row per voucher once loaded', async () => {
    listVouchers.mockResolvedValue(sampleVouchers);
    render(<VoucherList />);
    await waitFor(() => {
      expect(screen.getByText('Putri')).toBeInTheDocument();
      expect(screen.getByText('Budi')).toBeInTheDocument();
    });
    expect(screen.getByText('1A, 14C, 18F')).toBeInTheDocument();
    expect(screen.getByText('5A, 6B, 7C')).toBeInTheDocument();
    expect(screen.getByText('GA102')).toBeInTheDocument();
    expect(screen.getByText('Airbus 320')).toBeInTheDocument();
  });

  it('shows the empty state when no vouchers exist', async () => {
    listVouchers.mockResolvedValue([]);
    render(<VoucherList />);
    await waitFor(() => {
      expect(screen.getByText(/No vouchers generated yet/i)).toBeInTheDocument();
    });
  });

  it('shows the error banner when the fetch rejects', async () => {
    listVouchers.mockRejectedValue(new Error('network down'));
    render(<VoucherList />);
    await waitFor(() => {
      expect(screen.getByText(/Could not load flights/i)).toBeInTheDocument();
    });
  });
});
