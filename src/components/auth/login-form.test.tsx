import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LoginForm } from './login-form';

const { replace, refresh, loginAction } = vi.hoisted(() => ({
  replace: vi.fn(),
  refresh: vi.fn(),
  loginAction: vi.fn(),
}));

vi.mock('next/navigation', () => ({ useRouter: () => ({ replace, refresh }) }));
vi.mock('@/lib/auth/actions', () => ({ loginAction }));

async function submit(email = 'ada@example.com', password = 'Passw0rd!123') {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText('Email'), email);
  await user.type(screen.getByLabelText('Password'), password);
  await user.click(screen.getByRole('button', { name: 'Sign in' }));
}

beforeEach(() => vi.clearAllMocks());

describe('LoginForm', () => {
  it('validates on the client and does not call the server for empty input', async () => {
    render(<LoginForm />);
    await userEvent.setup().click(screen.getByRole('button', { name: 'Sign in' }));
    expect(await screen.findByText('Email is required')).toBeInTheDocument();
    expect(screen.getByText('Password is required')).toBeInTheDocument();
    expect(loginAction).not.toHaveBeenCalled();
  });

  it('shows invalid credentials and stays on the page', async () => {
    loginAction.mockResolvedValue({
      ok: false,
      code: 'INVALID_CREDENTIALS',
      message: 'Invalid email or password.',
    });
    render(<LoginForm />);
    await submit();
    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid email or password.');
    expect(screen.getByLabelText('Email')).toHaveAttribute('aria-invalid', 'true');
    expect(replace).not.toHaveBeenCalled();
  });

  it('shows the rate limit message', async () => {
    loginAction.mockResolvedValue({
      ok: false,
      code: 'RATE_LIMITED',
      message: 'Too many attempts, try again in a minute',
    });
    render(<LoginForm />);
    await submit();
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Too many attempts, try again in a minute',
    );
  });

  it('goes to the rooms after a successful sign in', async () => {
    loginAction.mockResolvedValue({ ok: true });
    render(<LoginForm />);
    await submit();
    await vi.waitFor(() => expect(replace).toHaveBeenCalledWith('/rooms'));
    expect(refresh).toHaveBeenCalled();
    expect(loginAction).toHaveBeenCalledWith({
      email: 'ada@example.com',
      password: 'Passw0rd!123',
    });
  });

  it('honours a same-site callback url but never an external one', async () => {
    loginAction.mockResolvedValue({ ok: true });
    const { unmount } = render(<LoginForm callbackUrl="/rooms/abc" />);
    await submit();
    await vi.waitFor(() => expect(replace).toHaveBeenCalledWith('/rooms/abc'));
    unmount();

    replace.mockClear();
    render(<LoginForm callbackUrl="https://evil.example" />);
    await submit();
    await vi.waitFor(() => expect(replace).toHaveBeenCalledWith('/rooms'));
  });

  it('shows the session-expired notice', () => {
    render(<LoginForm notice="Session expired. Sign in again." />);
    expect(screen.getByRole('alert')).toHaveTextContent('Session expired. Sign in again.');
  });
});
