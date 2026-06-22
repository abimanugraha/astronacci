import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import SeatMap from '../SeatMap';

describe('SeatMap', () => {
  it('renders 72 seats for ATR (18 rows × 4 seats)', () => {
    render(<SeatMap aircraftType="ATR" wonSeats={['1A', '14C', '18F']} />);
    const map = screen.getByLabelText('Seat map for ATR');
    const seats = within(map).getAllByRole('listitem');
    expect(seats).toHaveLength(72);
  });

  it('renders 192 seats for Airbus 320 (32 rows × 6 seats)', () => {
    render(<SeatMap aircraftType="Airbus 320" wonSeats={['1A']} />);
    const map = screen.getByLabelText('Seat map for Airbus 320');
    expect(within(map).getAllByRole('listitem')).toHaveLength(192);
  });

  it('renders 192 seats for Boeing 737 Max', () => {
    render(<SeatMap aircraftType="Boeing 737 Max" wonSeats={[]} />);
    const map = screen.getByLabelText('Seat map for Boeing 737 Max');
    expect(within(map).getAllByRole('listitem')).toHaveLength(192);
  });

  it('never renders a B or E seat for ATR', () => {
    render(<SeatMap aircraftType="ATR" wonSeats={[]} />);
    const map = screen.getByLabelText('Seat map for ATR');
    expect(within(map).queryByLabelText('1B')).toBeNull();
    expect(within(map).queryByLabelText('1E')).toBeNull();
    expect(within(map).queryByLabelText('10B')).toBeNull();
    expect(within(map).queryByLabelText('10E')).toBeNull();
  });

  it('marks each won seat with "(voucher)" in its aria-label', () => {
    render(<SeatMap aircraftType="ATR" wonSeats={['1A', '14C', '18F']} />);
    const map = screen.getByLabelText('Seat map for ATR');
    expect(within(map).getByLabelText('1A (voucher)')).toBeInTheDocument();
    expect(within(map).getByLabelText('14C (voucher)')).toBeInTheDocument();
    expect(within(map).getByLabelText('18F (voucher)')).toBeInTheDocument();
  });

  it('does NOT mark non-won seats with "(voucher)"', () => {
    render(<SeatMap aircraftType="ATR" wonSeats={['1A']} />);
    const map = screen.getByLabelText('Seat map for ATR');
    expect(within(map).getByLabelText('1C')).toBeInTheDocument();
    expect(within(map).getByLabelText('1D')).toBeInTheDocument();
    expect(within(map).getByLabelText('1F')).toBeInTheDocument();
  });

  it('renders a legend mentioning "voucher won"', () => {
    render(<SeatMap aircraftType="ATR" wonSeats={['1A']} />);
    const map = screen.getByLabelText('Seat map for ATR');
    expect(within(map).getByText(/voucher won/i)).toBeInTheDocument();
  });

  it('renders nothing when aircraftType is unknown', () => {
    const { container } = render(<SeatMap aircraftType="Concorde" wonSeats={[]} />);
    expect(container.firstChild).toBeNull();
  });
});
