import { describe, it, expect } from 'vitest';
import { cn } from '@/lib/utils';

describe('Utils', () => {
  describe('cn (className merger)', () => {
    it('merges class names correctly', () => {
      const result = cn('text-red-500', 'bg-blue-500');
      expect(result).toContain('text-red-500');
      expect(result).toContain('bg-blue-500');
    });

    it('handles conditional classes', () => {
      const isActive = true;
      const result = cn('base-class', isActive && 'active-class');
      expect(result).toContain('base-class');
      expect(result).toContain('active-class');
    });

    it('removes falsy values', () => {
      const result = cn('base-class', false && 'hidden-class', undefined, null);
      expect(result).toContain('base-class');
      expect(result).not.toContain('hidden-class');
    });

    it('handles Tailwind conflicts correctly', () => {
      const result = cn('px-2', 'px-4');
      // Should keep only px-4
      expect(result).not.toContain('px-2');
      expect(result).toContain('px-4');
    });
  });
});

