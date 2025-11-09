# Quick Testing Reference Card

## 🚀 Quick Commands

```bash
# Unit Tests
npm test                    # Run once
npm run test:watch          # Auto-rerun on changes
npm run test:ui             # Visual explorer
npm run test:coverage       # With coverage report

# E2E Tests
npm run test:e2e            # Run all E2E tests
npm run test:e2e:headed     # See the browser
npm run test:e2e:debug      # Step-by-step debugging
npm run test:e2e:codegen    # Generate test code from browser actions

# All Tests
npm run test:all            # Run everything
```

## 📝 Writing Unit Tests

### Basic Test Structure

```typescript
import { describe, it, expect } from 'vitest';

describe('MyFunction', () => {
  it('should do something', () => {
    // Arrange
    const input = 'test';
    
    // Act
    const result = myFunction(input);
    
    // Assert
    expect(result).toBe('expected');
  });
});
```

### Testing React Components

```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

it('handles user interaction', async () => {
  const user = userEvent.setup();
  
  render(<MyComponent />);
  
  await user.click(screen.getByRole('button'));
  
  expect(screen.getByText('Success')).toBeInTheDocument();
});
```

### Mocking

```typescript
import { vi } from 'vitest';

// Mock a function
const mockFn = vi.fn();
mockFn.mockReturnValue('mocked');

// Mock a module
vi.mock('@/lib/service', () => ({
  myService: {
    getData: vi.fn().mockResolvedValue({ data: 'test' })
  }
}));

// Spy on existing function
const spy = vi.spyOn(object, 'method');
```

## 🌐 Writing E2E Tests

### Basic E2E Test

```typescript
import { test, expect } from '@playwright/test';

test('user can navigate', async ({ page }) => {
  await page.goto('/');
  
  await page.click('text=Login');
  
  await expect(page).toHaveURL('/login');
});
```

### Using Page Object Model

```typescript
import { test } from '../fixtures';

test('user can login', async ({ loginPage }) => {
  await loginPage.goto();
  await loginPage.login('user@test.com', 'password');
  
  await expect(loginPage.page).toHaveURL('/dashboard');
});
```

### Creating a Page Object

```typescript
import { BasePage } from './BasePage';

export class MyPage extends BasePage {
  readonly submitBtn = this.page.locator('button[type="submit"]');
  readonly emailInput = this.page.locator('[name="email"]');
  
  async submit() {
    await this.submitBtn.click();
  }
}
```

## 🎯 Common Patterns

### Generate Fake Data

```typescript
import { faker } from '@faker-js/faker';

const testUser = {
  email: faker.internet.email(),
  name: faker.person.fullName(),
  id: faker.string.uuid()
};
```

### Test Async Code

```typescript
it('handles async operations', async () => {
  const promise = asyncFunction();
  
  await expect(promise).resolves.toBe('success');
  // or
  await expect(promise).rejects.toThrow('error');
});
```

### Mock Supabase

```typescript
vi.mock('@/db/supabase.client', () => ({
  supabase: {
    auth: {
      signIn: vi.fn(),
      signOut: vi.fn()
    },
    from: vi.fn(() => ({
      select: vi.fn(),
      insert: vi.fn()
    }))
  }
}));
```

## 🐛 Debugging Tips

### Unit Tests
- Use `test.only()` to run single test
- Use `console.log()` to debug values
- Use `screen.debug()` to see current DOM

### E2E Tests
- Use `--headed` to see browser
- Use `--debug` for step-by-step execution
- Use `await page.pause()` to pause test

## 📚 Full Documentation

- [Main Testing Documentation](../testing.md)
- [Test Plan](./test-plan.md)
- [E2E Authentication Strategy](./e2e-authentication.md)
- [E2E Fixtures Guide](./e2e-fixtures.md)

## ✅ Test Status

Run `npm test` to see current test status.

---

**Happy Testing!** 🎉

