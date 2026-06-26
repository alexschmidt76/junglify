import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('better-auth/react', () => ({ useStore: vi.fn() }));
vi.mock('@/src/layouts/auth/auth-client', () => ({ default: { useSession: 'session-store' } }));

import { useStore } from 'better-auth/react';
import UserNavMenu from '@/src/components/UserNavMenu';

const useStoreMock = vi.mocked(useStore);

describe('UserNavMenu', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows sign up / log in links while the session is pending', () => {
    useStoreMock.mockReturnValue({ isPending: true, data: null } as never);
    render(<UserNavMenu />);
    expect(screen.getByRole('link', { name: 'Sign Up' })).toHaveAttribute('href', '/sign-up');
    expect(screen.getByRole('link', { name: 'Log In' })).toHaveAttribute('href', '/log-in');
  });

  it('shows sign up / log in links when there is no session data', () => {
    useStoreMock.mockReturnValue({ isPending: false, data: null } as never);
    render(<UserNavMenu />);
    expect(screen.getByRole('link', { name: 'Sign Up' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Log In' })).toBeInTheDocument();
  });

  it('greets the logged-in user and links to their profile', () => {
    useStoreMock.mockReturnValue({
      isPending: false,
      data: { user: { username: 'george' } },
    } as never);
    render(<UserNavMenu />);
    expect(screen.getByText(/Welcome back to the jungle/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'george' })).toHaveAttribute('href', '/users/george');
  });
});
