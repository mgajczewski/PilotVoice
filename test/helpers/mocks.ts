import { vi } from 'vitest';

/**
 * Creates a mock Supabase client for testing
 */
export const createMockSupabaseClient = () => ({
  auth: {
    getSession: vi.fn(),
    getUser: vi.fn(),
    signInWithPassword: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
    resetPasswordForEmail: vi.fn(),
    updateUser: vi.fn(),
  },
  from: vi.fn(() => ({
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
  })),
});

/**
 * Creates a mock API response
 */
export const createMockApiResponse = <T>(data: T, status = 200) => ({
  data,
  status,
  ok: status >= 200 && status < 300,
  json: async () => data,
});

