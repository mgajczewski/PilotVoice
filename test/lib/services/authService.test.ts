import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateTestUser } from '../../helpers/testData';
import { createMockSupabaseClient } from '../../helpers/mocks';

// Example service test
describe('Authentication Service', () => {
  let mockSupabase: ReturnType<typeof createMockSupabaseClient>;

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient();
    vi.clearAllMocks();
  });

  it('should sign in user with valid credentials', async () => {
    const testUser = generateTestUser();
    const mockSession = {
      user: { id: '123', email: testUser.email },
      access_token: 'mock-token',
    };

    mockSupabase.auth.signInWithPassword.mockResolvedValue({
      data: { user: mockSession.user, session: mockSession },
      error: null,
    } as any);

    const result = await mockSupabase.auth.signInWithPassword({
      email: testUser.email,
      password: testUser.password,
    });

    expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
      email: testUser.email,
      password: testUser.password,
    });
    expect(result.data?.user?.email).toBe(testUser.email);
    expect(result.error).toBeNull();
  });

  it('should return error for invalid credentials', async () => {
    const testUser = generateTestUser();
    const mockError = { message: 'Invalid credentials' };

    mockSupabase.auth.signInWithPassword.mockResolvedValue({
      data: { user: null, session: null },
      error: mockError,
    } as any);

    const result = await mockSupabase.auth.signInWithPassword({
      email: testUser.email,
      password: 'wrong-password',
    });

    expect(result.error).toEqual(mockError);
    expect(result.data.user).toBeNull();
  });
});

