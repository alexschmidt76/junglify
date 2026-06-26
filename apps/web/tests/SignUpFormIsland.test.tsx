import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('@/src/layouts/auth/auth-client', () => ({ default: { __mock: 'authClient' } }));

// stub the shared form so we can trigger its success callback on demand
vi.mock('@repo/react-components/auth-forms/SignUpForm', () => ({
  default: (props: { callbackFn: (...params: string[]) => void }) => (
    <button onClick={() => props.callbackFn('george', 'token')}>do-signup</button>
  ),
}));

import SignUpFormIsland from '@/src/components/SignUpFormIsland';

describe('SignUpFormIsland', () => {
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

  it('renders the shared sign up form', () => {
    render(<SignUpFormIsland />);
    expect(screen.getByText('do-signup')).toBeInTheDocument();
  });

  it('redirects to the new user profile after signing up', () => {
    render(<SignUpFormIsland />);
    fireEvent.click(screen.getByText('do-signup'));
    expect(window.location.href).toBe('https://junglify.test/users/george');
  });
});
