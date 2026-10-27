import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RegisterForm } from './register-form';

const { replace, refresh, registerAction } = vi.hoisted(() => ({
  replace: vi.fn(),
  refresh: vi.fn(),
  registerAction: vi.fn(),
}));

vi.mock('next/navigation', () => ({ useRouter: () => ({ replace, refresh }) }));
vi.mock('@/lib/auth/actions', () => ({ registerAction }));

async function fill(values: { email: string; username: string; password: string }) {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText('Email'), values.email);
  await user.type(screen.getByLabelText('Username'), values.username);
  await user.type(screen.getByLabelText('Password'), values.password);
  await user.click(screen.getByRole('button', { name: 'Create account' }));
}

const valid = { email: 'ada@example.com', username: 'ada_1', password: 'longenough' };

beforeEach(() => vi.clearAllMocks());

describe('RegisterForm', () => {
  it('shows the hints and replaces them with field errors on invalid input', async () => {
    render(<RegisterForm />);
    expect(screen.getByText('3-20 characters: a-z, 0-9 and _')).toBeInTheDocument();

    await fill({ email: 'nope', username: 'No Spaces', password: 'short' });
    expect(await screen.findByText('Enter a valid email address')).toBeInTheDocument();
    expect(screen.getByText(/Only lowercase letters, numbers and _/)).toBeInTheDocument();
    expect(screen.getByText('Password must be at least 8 characters')).toBeInTheDocument();
    expect(screen.queryByText('8+ characters')).not.toBeInTheDocument();
    expect(registerAction).not.toHaveBeenCalled();
  });

  it('puts a server conflict on the email field', async () => {
    registerAction.mockResolvedValue({
      ok: false,
      code: 'CONFLICT',
      message: 'Check the highlighted fields.',
      fieldErrors: { email: 'This email is already registered.' },
    });
    render(<RegisterForm />);
    await fill(valid);
    expect(await screen.findByText('This email is already registered.')).toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });

  it('shows a general error when the server gives no field errors', async () => {
    registerAction.mockResolvedValue({
      ok: false,
      code: 'UNAVAILABLE',
      message: 'Lumen is unreachable. Try again in a moment.',
    });
    render(<RegisterForm />);
    await fill(valid);
    expect(await screen.findByRole('alert')).toHaveTextContent('Lumen is unreachable');
  });

  it('goes to the rooms once the account is created', async () => {
    registerAction.mockResolvedValue({ ok: true });
    render(<RegisterForm />);
    await fill(valid);
    await vi.waitFor(() => expect(replace).toHaveBeenCalledWith('/rooms'));
    expect(registerAction).toHaveBeenCalledWith(valid);
  });
});
