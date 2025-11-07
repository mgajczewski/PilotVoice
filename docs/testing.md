# Testing Documentation

## Overview

This document describes the testing environment and best practices for PilotVoice project.

## Tech Stack

### Unit Testing
- **Vitest** - Fast and modern test runner
- **@testing-library/react** - Testing utilities for React components
- **@testing-library/user-event** - User interaction simulation
- **@faker-js/faker** - Test data generation
- **jsdom** - DOM environment for testing

### E2E Testing
- **Playwright** - Modern E2E testing framework
- **Chromium** - Browser for running tests

## Project Structure

```
├── test/                           # Unit tests
│   ├── setup.ts                   # Global test setup
│   ├── helpers/                   # Test utilities
│   │   ├── testData.ts           # Test data generators
│   │   ├── mocks.ts              # Mock factories
│   │   └── index.ts              # Exports
│   ├── components/               # Component tests
│   │   └── auth/
│   │       └── LoginForm.test.tsx
│   └── lib/                      # Service/utility tests
│       ├── utils.test.ts
│       └── services/
│           └── authService.test.ts
│
├── e2e/                           # E2E tests
│   ├── pages/                    # Page Object Models
│   │   ├── BasePage.ts          # Base page class
│   │   ├── HomePage.ts          # Home page
│   │   ├── LoginPage.ts         # Login page
│   │   └── index.ts             # Exports
│   ├── fixtures/                # Test fixtures
│   │   └── index.ts            # Custom test extensions
│   └── tests/                   # Test specs
│       ├── home.spec.ts
│       ├── login.spec.ts
│       └── navigation.spec.ts
│
├── vitest.config.ts              # Vitest configuration
└── playwright.config.ts          # Playwright configuration
```

## Running Tests

### Unit Tests

```bash
# Run all unit tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with UI
npm run test:ui

# Run tests with coverage report
npm run test:coverage
```

### E2E Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run E2E tests with UI mode
npm run test:e2e:ui

# Run E2E tests in headed mode (visible browser)
npm run test:e2e:headed

# Debug E2E tests
npm run test:e2e:debug

# Generate E2E tests with codegen
npm run test:e2e:codegen
```

### Run All Tests

```bash
# Run both unit and E2E tests
npm run test:all
```

## Writing Unit Tests

### Guidelines

1. **Use descriptive test names** - Test names should clearly describe what is being tested
2. **Follow AAA pattern** - Arrange, Act, Assert
3. **Use proper mocking** - Mock external dependencies with `vi.mock()` and `vi.fn()`
4. **Test user behavior** - Focus on how users interact with components
5. **Keep tests isolated** - Each test should be independent

### Example: Component Test

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { MyComponent } from '@/components/MyComponent';

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('handles user interaction', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();
    
    render(<MyComponent onClick={handleClick} />);
    await user.click(screen.getByRole('button'));
    
    expect(handleClick).toHaveBeenCalled();
  });
});
```

### Example: Service Test

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateTestUser } from '../../helpers/testData';
import { createMockSupabaseClient } from '../../helpers/mocks';

describe('MyService', () => {
  let mockClient: ReturnType<typeof createMockSupabaseClient>;

  beforeEach(() => {
    mockClient = createMockSupabaseClient();
    vi.clearAllMocks();
  });

  it('performs operation successfully', async () => {
    const testData = generateTestUser();
    mockClient.from().select.mockResolvedValue({ data: testData, error: null });
    
    const result = await myService.getData(mockClient);
    
    expect(result).toEqual(testData);
  });
});
```

## Writing E2E Tests

### Guidelines

1. **Use Page Object Model** - Encapsulate page interactions in page objects
2. **Write readable tests** - Tests should read like user stories
3. **Use proper locators** - Prefer role-based and text-based locators
4. **Handle async properly** - Always await async operations
5. **Test real user flows** - Focus on complete user journeys

### Example: Page Object

```typescript
import { type Page, type Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class LoginPage extends BasePage {
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;

  constructor(page: Page) {
    super(page);
    this.emailInput = page.getByRole('textbox', { name: /email/i });
    this.passwordInput = page.getByLabel(/password/i);
    this.submitButton = page.getByRole('button', { name: /login/i });
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }
}
```

### Example: Test Spec

```typescript
import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';

test.describe('Login Flow', () => {
  test('user can login with valid credentials', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    
    await loginPage.login('test@example.com', 'password123');
    
    expect(page.url()).toContain('/profile');
  });
});
```

### Using Fixtures

Fixtures make it easier to reuse page objects across tests:

```typescript
import { test, expect } from '../fixtures';

test('navigation test', async ({ homePage, loginPage }) => {
  await homePage.goto();
  await homePage.navigateToLogin();
  expect(await loginPage.isLoaded()).toBeTruthy();
});
```

## Best Practices

### Unit Testing Best Practices

1. **Mock external dependencies** - Use `vi.mock()` for modules, `vi.fn()` for functions
2. **Use Testing Library queries** - Prefer `getByRole`, `getByLabelText` over `querySelector`
3. **Test accessibility** - Use role-based queries to ensure accessible markup
4. **Keep tests fast** - Mock API calls and avoid unnecessary delays
5. **Use faker for test data** - Generate realistic test data with `@faker-js/faker`

### E2E Testing Best Practices

1. **One browser is enough** - Focus on Chromium for faster test runs
2. **Use Page Object Model** - Keep tests maintainable and readable
3. **Avoid hard-coded waits** - Use Playwright's auto-waiting features
4. **Test critical paths** - Focus on user flows that matter most
5. **Use codegen for discovery** - Use `npm run test:e2e:codegen` to explore the app

## Debugging

### Unit Tests

```bash
# Run specific test file
npm test -- LoginForm.test.tsx

# Run with UI for better debugging
npm run test:ui

# Use debugger
# Add `debugger` statement in your test and run with --inspect flag
```

### E2E Tests

```bash
# Debug mode - step through tests
npm run test:e2e:debug

# UI mode - visual test runner
npm run test:e2e:ui

# Headed mode - see browser actions
npm run test:e2e:headed

# View trace files (after test failure)
npx playwright show-trace trace.zip
```

## CI/CD Integration

Tests are designed to run in CI environments:

- Unit tests run fast and can be executed on every commit
- E2E tests are optimized for CI with proper retries and parallelization
- Coverage reports are generated for monitoring test quality

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library Documentation](https://testing-library.com/)
- [Playwright Documentation](https://playwright.dev/)
- [Faker.js Documentation](https://fakerjs.dev/)

