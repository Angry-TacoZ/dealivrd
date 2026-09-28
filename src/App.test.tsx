import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';

describe('Dealivrd app', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.reject(new Error('API unavailable'))),
    );
  });

  it('renders the ranked deal board with source transparency copy', async () => {
    render(<App />);

    expect(screen.getByText('Dealivrd')).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText(/Missing public data/i)).toBeInTheDocument());
    expect(screen.getByRole('button', { name: /2026 Toyota Camry/i })).toBeInTheDocument();
  });

  it('validates ZIP input before updating search filters', async () => {
    const user = userEvent.setup();
    render(<App />);

    const zipInput = screen.getByLabelText(/ZIP code/i);
    await user.clear(zipInput);
    await user.type(zipInput, '12');
    await user.click(screen.getByRole('button', { name: /Search/i }));

    expect(screen.getByText('Enter a 5-digit ZIP code.')).toBeInTheDocument();
  });
});
