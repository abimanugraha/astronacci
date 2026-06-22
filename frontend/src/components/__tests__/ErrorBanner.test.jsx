import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ErrorBanner from '../ErrorBanner';

describe('ErrorBanner', () => {
  it('renders the message verbatim', () => {
    render(<ErrorBanner message="Vouchers have already been generated for this flight and date." />);
    expect(
      screen.getByText('Vouchers have already been generated for this flight and date.'),
    ).toBeInTheDocument();
  });

  it('has role="alert"', () => {
    render(<ErrorBanner message="boom" />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('uses the daisyUI error alert classes', () => {
    const { container } = render(<ErrorBanner message="boom" />);
    expect(container.firstChild.className).toContain('alert');
    expect(container.firstChild.className).toContain('alert-error');
  });

  it('does not render a dismiss button when onDismiss is not provided', () => {
    render(<ErrorBanner message="boom" />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('renders a dismiss button that calls onDismiss when onDismiss is provided', async () => {
    const user = userEvent.setup();
    const onDismiss = vi.fn();
    render(<ErrorBanner message="boom" onDismiss={onDismiss} />);
    const button = screen.getByRole('button', { name: /dismiss error/i });
    await user.click(button);
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});
