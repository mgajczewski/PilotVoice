# Testing Setup Documentation

This document describes the testing environment setup for the PilotVoice project.

## Tech Stack

### Unit Testing
- **Vitest** - Fast unit test framework powered by Vite
- **@testing-library/react** - React component testing utilities
- **@testing-library/user-event** - User interaction simulation
- **@testing-library/jest-dom** - Custom Jest matchers for DOM
- **@faker-js/faker** - Generate fake data for tests
- **jsdom** - DOM implementation for Node.js

### E2E Testing
- **Playwright** - End-to-end testing framework
- **Chromium** - Browser for running E2E tests

## Project Structure

```
PilotVoice/
├── test/                           # Unit tests
│   ├── setup.ts                    # Global test setup
│   ├── helpers/                    # Test helpers and utilities
│   │   ├── index.ts
│   │   ├── mocks.ts               # Mock implementations
│   │   └── testData.ts            # Test data generators
│   ├── components/                # Component tests
│   │   └── auth/
│   └── lib/                       # Service/utility tests
│       ├── services/
│       └── utils.test.ts
├── e2e/                           # E2E tests
│   ├── fixtures/                  # Test fixtures
│   │   └── index.ts              # Extended test with page objects
│   ├── pages/                    # Page Object Models
│   │   ├── BasePage.ts           # Base page class
│   │   ├── HomePage.ts
│   │   ├── LoginPage.ts
│   │   └── index.ts
│   └── tests/                    # E2E test specs
│       ├── home.spec.ts
│       ├── login.spec.ts
│       └── navigation.spec.ts
├── vitest.config.ts              # Vitest configuration
└── playwright.config.ts          # Playwright configuration
```

## Configuration

### Vitest Configuration

The `vitest.config.ts` is configured with:

- **Environment**: `jsdom` for DOM testing
- **Setup Files**: `./test/setup.ts` for global configuration
- **Globals**: Enabled for better DX
- **Coverage**: v8 provider with text, json, and html reporters
- **Path Aliases**: `@` points to `./src`

### Playwright Configuration

The `playwright.config.ts` is configured with:

- **Test Directory**: `./e2e`
- **Browser**: Chromium only (Desktop Chrome)
- **Parallel Execution**: Enabled for faster test runs
- **Base URL**: `http://localhost:3000`
- **Trace**: On first retry
- **Screenshots**: Only on failure
- **Video**: Retained on failure
- **Web Server**: Automatically starts `npm run dev` before tests

## NPM Scripts

### Unit Tests

```bash
# Run all unit tests
npm test

# Run tests in watch mode (for development)
npm run test:watch

# Run tests with UI mode (visual test explorer)
npm run test:ui

# Generate coverage report
npm run test:coverage
```

### E2E Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run E2E tests with UI mode
npm run test:e2e:ui

# Run E2E tests in headed mode (see browser)
npm run test:e2e:headed

# Debug E2E tests
npm run test:e2e:debug

# Generate test code using codegen
npm run test:e2e:codegen
```

### Run All Tests

```bash
# Run both unit and E2E tests
npm run test:all
```

## Testing Guidelines

### Unit Testing Best Practices

#### Using Vitest

1. **Test Doubles with `vi` object**
   ```typescript
   import { vi } from 'vitest';
   
   // Mock functions
   const mockFn = vi.fn();
   
   // Spy on existing functions
   const spy = vi.spyOn(object, 'method');
   
   // Global mocks
   vi.stubGlobal('fetch', mockFetch);
   ```

2. **Mock Factory Patterns**
   ```typescript
   // Place at top level
   vi.mock('@/lib/services/authService', () => ({
     authService: {
       login: vi.fn(),
       logout: vi.fn(),
     }
   }));
   ```

3. **Test Structure (Arrange-Act-Assert)**
   ```typescript
   describe('Feature', () => {
     it('should do something', () => {
       // Arrange
       const input = 'test';
       
       // Act
       const result = doSomething(input);
       
       // Assert
       expect(result).toBe('expected');
     });
   });
   ```

4. **Inline Snapshots**
   ```typescript
   expect(complexObject).toMatchInlineSnapshot(`
     {
       "prop": "value",
     }
   `);
   ```

5. **Testing React Components**
   ```typescript
   import { render, screen } from '@testing-library/react';
   import userEvent from '@testing-library/user-event';
   
   describe('Button', () => {
     it('handles click events', async () => {
       const user = userEvent.setup();
       const handleClick = vi.fn();
       
       render(<Button onClick={handleClick}>Click me</Button>);
       
       await user.click(screen.getByRole('button'));
       
       expect(handleClick).toHaveBeenCalledOnce();
     });
   });
   ```

### E2E Testing Best Practices

#### Using Playwright

1. **Page Object Model**
   ```typescript
   import { BasePage } from './BasePage';
   
   export class LoginPage extends BasePage {
     readonly emailInput = this.page.locator('[name="email"]');
     readonly passwordInput = this.page.locator('[name="password"]');
     readonly submitButton = this.page.locator('button[type="submit"]');
     
     async login(email: string, password: string) {
       await this.emailInput.fill(email);
       await this.passwordInput.fill(password);
       await this.submitButton.click();
     }
   }
   ```

2. **Using Fixtures**
   ```typescript
   import { test, expect } from '../fixtures';
   
   test('user can login', async ({ loginPage }) => {
     await loginPage.goto();
     await loginPage.login('user@example.com', 'password');
     
     await expect(loginPage.page).toHaveURL('/dashboard');
   });
   ```

3. **Browser Contexts**
   ```typescript
   test('isolated test', async ({ browser }) => {
     const context = await browser.newContext();
     const page = await context.newPage();
     
     // Test with isolated context
     
     await context.close();
   });
   ```

4. **API Testing**
   ```typescript
   test('API endpoint returns correct data', async ({ request }) => {
     const response = await request.get('/api/surveys');
     
     expect(response.ok()).toBeTruthy();
     const data = await response.json();
     expect(data).toHaveLength(5);
   });
   ```

5. **Visual Testing**
   ```typescript
   test('page has correct appearance', async ({ page }) => {
     await page.goto('/');
     await expect(page).toHaveScreenshot();
   });
   ```

## Setup Files

### Test Setup (`test/setup.ts`)

The setup file configures:
- React Testing Library cleanup
- `window.matchMedia` mock
- `IntersectionObserver` mock
- `ResizeObserver` mock
- Jest-DOM custom matchers

### E2E Fixtures (`e2e/fixtures/index.ts`)

Provides pre-configured page objects:
- `homePage`: HomePage instance
- `loginPage`: LoginPage instance

## Common Patterns

### Mocking Supabase

```typescript
vi.mock('@/db/supabase.client', () => ({
  createClient: vi.fn(() => ({
    auth: {
      signIn: vi.fn(),
      signOut: vi.fn(),
      getSession: vi.fn(),
    },
    from: vi.fn(() => ({
      select: vi.fn(),
      insert: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    })),
  })),
}));
```

### Generating Test Data with Faker

```typescript
import { faker } from '@faker-js/faker';

const mockUser = {
  id: faker.string.uuid(),
  email: faker.internet.email(),
  name: faker.person.fullName(),
  createdAt: faker.date.past(),
};
```

### Testing Astro Components

Astro components are server-side rendered, so they should be tested with E2E tests using Playwright rather than unit tests.

## Continuous Integration

Tests are automatically run in CI/CD pipeline:
- Unit tests run on every commit
- E2E tests run on pull requests
- Coverage reports are generated and tracked

## Troubleshooting

### Vitest Issues

1. **Module resolution errors**: Check `vitest.config.ts` aliases
2. **jsdom errors**: Ensure `environment: 'jsdom'` is set
3. **Mock not working**: Check mock factory is at top level

### Playwright Issues

1. **Browser not found**: Run `npx playwright install chromium`
2. **Timeout errors**: Increase timeout in `playwright.config.ts`
3. **Web server issues**: Check `baseURL` and ensure dev server runs

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Library Documentation](https://testing-library.com/)
- [Faker.js Documentation](https://fakerjs.dev/)

