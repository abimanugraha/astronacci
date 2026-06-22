import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import SeatResults from '../SeatResults';

describe('SeatResults', () => {
  it('renders three seat cards with the spec labels', () => {
    render(<SeatResults seats={['1A', '14C', '18F']} />);
    expect(screen.getByText('Seat 1:')).toBeInTheDocument();
    expect(screen.getByText('1A')).toBeInTheDocument();
    expect(screen.getByText('Seat 2:')).toBeInTheDocument();
    expect(screen.getByText('14C')).toBeInTheDocument();
    expect(screen.getByText('Seat 3:')).toBeInTheDocument();
    expect(screen.getByText('18F')).toBeInTheDocument();
  });

  it('marks each seat card with aria-label="Seat N"', () => {
    render(<SeatResults seats={['1A', '14C', '18F']} />);
    expect(screen.getByLabelText('Seat 1')).toBeInTheDocument();
    expect(screen.getByLabelText('Seat 2')).toBeInTheDocument();
    expect(screen.getByLabelText('Seat 3')).toBeInTheDocument();
  });

  it('renders a success heading', () => {
    render(<SeatResults seats={['1A', '14C', '18F']} />);
    expect(screen.getByRole('heading', { name: /seats assigned/i })).toBeInTheDocument();
  });

  it('renders crew name when provided', () => {
    render(<SeatResults seats={['1A', '14C', '18F']} crewName="Putri" />);
    expect(screen.getByText(/Putri/)).toBeInTheDocument();
  });

  it('does not render crew line when crewName is absent', () => {
    render(<SeatResults seats={['1A', '14C', '18F']} />);
    expect(screen.queryByText(/Crew:/i)).not.toBeInTheDocument();
  });
});
