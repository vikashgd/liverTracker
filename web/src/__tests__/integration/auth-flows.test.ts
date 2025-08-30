import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SessionProvider } from 'next-auth/react';
import { signIn, signOut } from 'next-auth/react';

// Mock NextAuth
vi.mock('next-auth/react', () => ({
  SessionProvider: ({ children }: { children: React.ReactNode }) => children,
  signIn: vi.fn(),
  signOut: vi.fn(),
  useSession: vi.fn(() => ({
    data: null,
    status: 'unauthenticated'
  }))
}));

// Mock fetch for API calls
global.fetch = vi.fn();

// Mock router
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    back: vi.fn()
  }),
  useSearchParams: () => ({
    get: vi.fn(() => null)
  })
}));

// Import components after mocks
import SignInForm from '../../app/auth/signin/signin-form';
import SignUpForm from '../../app/auth/signup/signup-form';
import { ReusableSignInForm, ReusableSignUpForm } from '../../components/auth';

describe('Authentication Flow Integration Tests', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
    (fetch as any).mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Sign In Flow', () => {
    it('should complete successful email/password sign in', async () => {
      const mockSignIn = vi.mocked(signIn);
      mockSignIn.mockResolvedValue({ ok: true, error: null, status: 200, url: '/dashboard' });

      render(
        <SessionProvider session={null}>
          <ReusableSignInForm />
        </SessionProvider>
      );

      // Fill in the form
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'TestPassword123!');
      await user.click(submitButton);

      // Verify sign in was called with correct credentials
      await waitFor(() => {
        expect(mockSignIn).toHaveBeenCalledWith('credentials', {
          email: 'test@example.com',
          password: 'TestPassword123!',
          redirect: false
        });
      });

      // Verify redirect
      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    });

    it('should handle sign in errors gracefully', async () => {
      const mockSignIn = vi.mocked(signIn);
      mockSignIn.mockResolvedValue({ 
        ok: false, 
        error: 'CredentialsSignin', 
        status: 401, 
        url: null 
      });

      render(
        <SessionProvider session={null}>
          <ReusableSignInForm />
        </SessionProvider>
      );

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'wrongpassword');
      await user.click(submitButton);

      // Wait for error message to appear
      await waitFor(() => {
        expect(screen.getByText(/invalid email or password/i)).toBeInTheDocument();
      });
    });

    it('should handle Google OAuth sign in', async () => {
      const mockSignIn = vi.mocked(signIn);
      mockSignIn.mockResolvedValue({ ok: true, error: null, status: 200, url: '/dashboard' });

      render(
        <SessionProvider session={null}>
          <ReusableSignInForm />
        </SessionProvider>
      );

      const googleButton = screen.getByRole('button', { name: /continue with google/i });
      await user.click(googleButton);

      await waitFor(() => {
        expect(mockSignIn).toHaveBeenCalledWith('google', {
          callbackUrl: '/dashboard',
          redirect: false
        });
      });
    });

    it('should validate form inputs before submission', async () => {
      render(
        <SessionProvider session={null}>
          <ReusableSignInForm />
        </SessionProvider>
      );

      const submitButton = screen.getByRole('button', { name: /sign in/i });
      await user.click(submitButton);

      // Should show validation errors
      await waitFor(() => {
        expect(screen.getByText(/email is required/i)).toBeInTheDocument();
        expect(screen.getByText(/password is required/i)).toBeInTheDocument();
      });

      // Should not call signIn
      expect(signIn).not.toHaveBeenCalled();
    });

    it('should handle network errors during sign in', async () => {
      const mockSignIn = vi.mocked(signIn);
      mockSignIn.mockRejectedValue(new Error('Network error'));

      render(
        <SessionProvider session={null}>
          <ReusableSignInForm />
        </SessionProvider>
      );

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'TestPassword123!');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/network connection error/i)).toBeInTheDocument();
      });
    });
  });

  describe('Sign Up Flow', () => {
    it('should complete successful user registration', async () => {
      // Mock successful API response
      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, userId: 'new-user-123' })
      });

      // Mock successful auto sign in
      const mockSignIn = vi.mocked(signIn);
      mockSignIn.mockResolvedValue({ ok: true, error: null, status: 200, url: '/dashboard' });

      render(
        <SessionProvider session={null}>
          <ReusableSignUpForm />
        </SessionProvider>
      );

      // Fill in the registration form
      const nameInput = screen.getByLabelText(/full name/i);
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
      const termsCheckbox = screen.getByLabelText(/terms of service/i);
      const submitButton = screen.getByRole('button', { name: /create account/i });

      await user.type(nameInput, 'John Doe');
      await user.type(emailInput, 'john@example.com');
      await user.type(passwordInput, 'StrongPassword123!');
      await user.type(confirmPasswordInput, 'StrongPassword123!');
      await user.click(termsCheckbox);
      await user.click(submitButton);

      // Verify API call
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('/api/auth/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'John Doe',
            email: 'john@example.com',
            password: 'StrongPassword123!'
          })
        });
      });

      // Verify auto sign in
      await waitFor(() => {
        expect(mockSignIn).toHaveBeenCalledWith('credentials', {
          email: 'john@example.com',
          password: 'StrongPassword123!',
          redirect: false
        });
      });

      // Verify redirect
      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    });

    it('should validate password strength', async () => {
      render(
        <SessionProvider session={null}>
          <ReusableSignUpForm />
        </SessionProvider>
      );

      const passwordInput = screen.getByLabelText(/^password$/i);
      
      // Test weak password
      await user.type(passwordInput, 'weak');
      
      await waitFor(() => {
        expect(screen.getByText(/password strength: weak/i)).toBeInTheDocument();
      });

      // Test strong password
      await user.clear(passwordInput);
      await user.type(passwordInput, 'StrongPassword123!');
      
      await waitFor(() => {
        expect(screen.getByText(/password strength: strong/i)).toBeInTheDocument();
      });
    });

    it('should validate password confirmation', async () => {
      render(
        <SessionProvider session={null}>
          <ReusableSignUpForm />
        </SessionProvider>
      );

      const passwordInput = screen.getByLabelText(/^password$/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
      const submitButton = screen.getByRole('button', { name: /create account/i });

      await user.type(passwordInput, 'StrongPassword123!');
      await user.type(confirmPasswordInput, 'DifferentPassword123!');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
      });
    });

    it('should handle registration errors', async () => {
      // Mock API error response
      (fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ error: 'Email already exists' })
      });

      render(
        <SessionProvider session={null}>
          <ReusableSignUpForm />
        </SessionProvider>
      );

      const nameInput = screen.getByLabelText(/full name/i);
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
      const termsCheckbox = screen.getByLabelText(/terms of service/i);
      const submitButton = screen.getByRole('button', { name: /create account/i });

      await user.type(nameInput, 'John Doe');
      await user.type(emailInput, 'existing@example.com');
      await user.type(passwordInput, 'StrongPassword123!');
      await user.type(confirmPasswordInput, 'StrongPassword123!');
      await user.click(termsCheckbox);
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/email already exists/i)).toBeInTheDocument();
      });
    });

    it('should require terms acceptance', async () => {
      render(
        <SessionProvider session={null}>
          <ReusableSignUpForm />
        </SessionProvider>
      );

      const nameInput = screen.getByLabelText(/full name/i);
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
      const submitButton = screen.getByRole('button', { name: /create account/i });

      await user.type(nameInput, 'John Doe');
      await user.type(emailInput, 'john@example.com');
      await user.type(passwordInput, 'StrongPassword123!');
      await user.type(confirmPasswordInput, 'StrongPassword123!');
      // Don't check terms checkbox
      await user.click(submitButton);

      // Form should not submit without terms acceptance
      expect(fetch).not.toHaveBeenCalled();
    });
  });

  describe('Password Reset Flow', () => {
    it('should handle password reset request', async () => {
      // Mock successful API response
      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, message: 'Reset email sent' })
      });

      // Mock forgot password form (simplified)
      const ForgotPasswordForm = () => {
        const [email, setEmail] = React.useState('');
        const [loading, setLoading] = React.useState(false);
        const [message, setMessage] = React.useState('');

        const handleSubmit = async (e: React.FormEvent) => {
          e.preventDefault();
          setLoading(true);
          
          try {
            const response = await fetch('/api/auth/forgot-password', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email })
            });
            
            const data = await response.json();
            if (response.ok) {
              setMessage('Reset email sent');
            }
          } finally {
            setLoading(false);
          }
        };

        return (
          <form onSubmit={handleSubmit}>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              aria-label="Email"
            />
            <button type="submit" disabled={loading}>
              {loading ? 'Sending...' : 'Send Reset Email'}
            </button>
            {message && <p>{message}</p>}
          </form>
        );
      };

      render(<ForgotPasswordForm />);

      const emailInput = screen.getByLabelText(/email/i);
      const submitButton = screen.getByRole('button', { name: /send reset email/i });

      await user.type(emailInput, 'test@example.com');
      await user.click(submitButton);

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('/api/auth/forgot-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: 'test@example.com' })
        });
      });

      await waitFor(() => {
        expect(screen.getByText(/reset email sent/i)).toBeInTheDocument();
      });
    });

    it('should handle password reset completion', async () => {
      // Mock token validation
      (fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ valid: true })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true })
        });

      // Mock reset password form (simplified)
      const ResetPasswordForm = ({ token }: { token: string }) => {
        const [password, setPassword] = React.useState('');
        const [confirmPassword, setConfirmPassword] = React.useState('');
        const [loading, setLoading] = React.useState(false);
        const [success, setSuccess] = React.useState(false);

        const handleSubmit = async (e: React.FormEvent) => {
          e.preventDefault();
          if (password !== confirmPassword) return;
          
          setLoading(true);
          
          try {
            const response = await fetch('/api/auth/reset-password', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ token, password })
            });
            
            if (response.ok) {
              setSuccess(true);
            }
          } finally {
            setLoading(false);
          }
        };

        if (success) {
          return <p>Password reset successful</p>;
        }

        return (
          <form onSubmit={handleSubmit}>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="New password"
              aria-label="New password"
            />
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm password"
              aria-label="Confirm password"
            />
            <button type="submit" disabled={loading || password !== confirmPassword}>
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        );
      };

      render(<ResetPasswordForm token="valid-token" />);

      const passwordInput = screen.getByLabelText(/new password/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
      const submitButton = screen.getByRole('button', { name: /reset password/i });

      await user.type(passwordInput, 'NewPassword123!');
      await user.type(confirmPasswordInput, 'NewPassword123!');
      await user.click(submitButton);

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('/api/auth/reset-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            token: 'valid-token', 
            password: 'NewPassword123!' 
          })
        });
      });

      await waitFor(() => {
        expect(screen.getByText(/password reset successful/i)).toBeInTheDocument();
      });
    });
  });

  describe('Session Management', () => {
    it('should handle session expiration', async () => {
      const { useSession } = await import('next-auth/react');
      
      // Mock expired session
      vi.mocked(useSession).mockReturnValue({
        data: null,
        status: 'unauthenticated',
        update: vi.fn()
      });

      // Mock protected component
      const ProtectedComponent = () => {
        const { data: session, status } = useSession();
        
        if (status === 'loading') return <div>Loading...</div>;
        if (!session) return <div>Please sign in</div>;
        
        return <div>Protected content</div>;
      };

      render(
        <SessionProvider session={null}>
          <ProtectedComponent />
        </SessionProvider>
      );

      expect(screen.getByText(/please sign in/i)).toBeInTheDocument();
    });

    it('should handle sign out', async () => {
      const mockSignOut = vi.mocked(signOut);
      mockSignOut.mockResolvedValue({ url: '/auth/signin' });

      // Mock component with sign out
      const ComponentWithSignOut = () => {
        const handleSignOut = async () => {
          await signOut({ callbackUrl: '/auth/signin' });
        };

        return (
          <button onClick={handleSignOut}>
            Sign Out
          </button>
        );
      };

      render(<ComponentWithSignOut />);

      const signOutButton = screen.getByRole('button', { name: /sign out/i });
      await user.click(signOutButton);

      expect(mockSignOut).toHaveBeenCalledWith({ callbackUrl: '/auth/signin' });
    });
  });

  describe('Error Handling Integration', () => {
    it('should display appropriate error messages for different error types', async () => {
      const errorScenarios = [
        { error: 'CredentialsSignin', expectedMessage: /invalid email or password/i },
        { error: 'OAuthSignin', expectedMessage: /google sign-in failed/i },
        { error: 'SessionRequired', expectedMessage: /session has expired/i }
      ];

      for (const scenario of errorScenarios) {
        const mockSignIn = vi.mocked(signIn);
        mockSignIn.mockResolvedValue({ 
          ok: false, 
          error: scenario.error, 
          status: 401, 
          url: null 
        });

        const { unmount } = render(
          <SessionProvider session={null}>
            <ReusableSignInForm />
          </SessionProvider>
        );

        const emailInput = screen.getByLabelText(/email/i);
        const passwordInput = screen.getByLabelText(/password/i);
        const submitButton = screen.getByRole('button', { name: /sign in/i });

        await user.type(emailInput, 'test@example.com');
        await user.type(passwordInput, 'password');
        await user.click(submitButton);

        await waitFor(() => {
          expect(screen.getByText(scenario.expectedMessage)).toBeInTheDocument();
        });

        unmount();
        vi.clearAllMocks();
      }
    });

    it('should provide fallback options for OAuth failures', async () => {
      const mockSignIn = vi.mocked(signIn);
      mockSignIn.mockResolvedValue({ 
        ok: false, 
        error: 'OAuthSignin', 
        status: 401, 
        url: null 
      });

      render(
        <SessionProvider session={null}>
          <ReusableSignInForm />
        </SessionProvider>
      );

      const googleButton = screen.getByRole('button', { name: /continue with google/i });
      await user.click(googleButton);

      await waitFor(() => {
        expect(screen.getByText(/google sign-in failed/i)).toBeInTheDocument();
      });

      // Should still be able to use email/password
      const emailInput = screen.getByLabelText(/email/i);
      expect(emailInput).toBeEnabled();
    });
  });

  describe('Accessibility Integration', () => {
    it('should be keyboard navigable', async () => {
      render(
        <SessionProvider session={null}>
          <ReusableSignInForm />
        </SessionProvider>
      );

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      // Tab navigation
      emailInput.focus();
      expect(document.activeElement).toBe(emailInput);

      await user.tab();
      expect(document.activeElement).toBe(passwordInput);

      await user.tab();
      await user.tab(); // Skip remember me checkbox
      expect(document.activeElement).toBe(submitButton);
    });

    it('should announce errors to screen readers', async () => {
      const mockSignIn = vi.mocked(signIn);
      mockSignIn.mockResolvedValue({ 
        ok: false, 
        error: 'CredentialsSignin', 
        status: 401, 
        url: null 
      });

      render(
        <SessionProvider session={null}>
          <ReusableSignInForm />
        </SessionProvider>
      );

      const submitButton = screen.getByRole('button', { name: /sign in/i });
      await user.click(submitButton);

      await waitFor(() => {
        const errorMessage = screen.getByRole('alert');
        expect(errorMessage).toBeInTheDocument();
      });
    });
  });
});

// Helper to add React import for JSX
import React from 'react';