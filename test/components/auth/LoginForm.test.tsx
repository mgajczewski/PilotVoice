import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { LoginForm } from '@/components/auth/LoginForm';

// Mock the Supabase client
vi.mock('@/db/supabase.client', () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn(),
    },
  },
}));

describe('LoginForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders login form with email and password inputs', () => {
    render(<LoginForm />);
    
    expect(screen.getByRole('textbox', { name: /email/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('shows validation error when email is invalid', async () => {
    const user = userEvent.setup();
    render(<LoginForm />);
    
    const emailInput = screen.getByRole('textbox', { name: /email/i });
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    
    await user.type(emailInput, 'invalid-email');
    await user.click(submitButton);
    
    expect(await screen.findByText(/please enter a valid email address/i)).toBeInTheDocument();
  });

  // TODO: Fix this test - form submission is not calling the Supabase mock
  it.skip('submits form with valid credentials', async () => {
    const user = userEvent.setup();
    const { supabase } = await import('@/db/supabase.client');
    
    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
      data: { user: { id: '123' }, session: {} },
      error: null,
    } as any);
    
    render(<LoginForm />);
    
    const emailInput = screen.getByRole('textbox', { name: /email/i });
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);
    
    expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123',
    });
  });
});

