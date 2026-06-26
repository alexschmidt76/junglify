import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('@/src/layouts/auth/auth-client', () => ({ default: { __mock: 'authClient' } }));

// stub the shared form so we can trigger its success callback on demand
vi.mock('@repo/react-components/auth-forms/LogInForm', () => ({
  default: (props: { callbackFn: (...params: string[]) => void }) => (
    <button onClick={() => props.callbackFn('george', 'token')}>do-login</button>
  ),
}));

import LogInFormIsland from '@/src/components/LogInFormIsland';

describe('LogInFormIsland', () => {
  const originalLocation = window.location;

  beforeEach(() => {
    Object.defineProperty(window, 'location', {
      configurable: true,
      writable: true,
      value: { href: '' },
    });
  });

  afterEach(() => {
    Object.defineProperty(window, 'location', {
      configurable: true,
      writable: true,
      value: originalLocation,
    });
  });

  it('renders the shared login form', () => {
    render(<LogInFormIsland />);
    expect(screen.getByText('do-login')).toBeInTheDocument();
  });

  it('redirects to the new user profile on a successful login', () => {
    render(<LogInFormIsland />);
    fireEvent.click(screen.getByText('do-login'));
    expect(window.location.href).toBe('https://junglify.test/users/george');
  });
});
