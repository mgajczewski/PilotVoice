# E2E Tests Authentication Strategy

## Overview

This document describes the authentication strategy for E2E tests in PilotVoice. The test suite uses Playwright's `storageState` feature to optimize test execution by reusing authenticated sessions.

## How it Works

### 1. Global Setup (`e2e/global.setup.ts`)

The global setup runs once before all tests and performs the following tasks:

- Clears test data from database
- Seeds database with test competitions and surveys
- Logs in as `E2E_USER_EMAIL` 
- Saves the authenticated session to `e2e/auth.json`
- This file contains cookies and localStorage needed for authenticated requests

### 2. Test Organization

Tests are organized into two categories:

- **Unauthenticated tests**: Start with a fresh browser context (no stored session)
- **Authenticated tests**: Use `test.use({ storageState: "e2e/auth.json" })` to start already logged in

## Benefits

- **Faster execution**: Authenticated tests skip the login flow
- **Isolated tests**: Unauthenticated tests remain independent
- **Flexibility**: Different test groups can use different authentication states
- **Clean code**: `test.use()` can be applied once for multiple tests

## Example Usage

```typescript
const authStoragePath = path.join(process.cwd(), "e2e", "auth.json");

test.describe("Survey Start Flow", () => {
  // This test starts unauthenticated and goes through login flow
  test("should work for unauthenticated user", async ({
    page,
    loginPage,
  }) => {
    await loginPage.goto();
    await loginPage.login(email, password);
    // ... rest of test
  });

  // Apply storageState to all following tests in this describe block
  test.use({ storageState: authStoragePath });

  test("should show correct button for authenticated user", async ({
    surveyPage,
  }) => {
    // No login needed - already authenticated!
    await surveyPage.goto(surveySlug);
    // ... rest of test
  });

  test("another authenticated test", async ({ surveyPage }) => {
    // This test is also authenticated
    await surveyPage.goto(anotherSlug);
    // ... rest of test
  });
});
```

## E2E Project Structure

```
e2e/
├── global.setup.ts          # Main setup file (coordinates everything)
├── global.teardown.ts       # Cleanup after all tests
├── auth.json                # Generated auth state (git-ignored)
├── utils/
│   ├── auth.ts              # Authentication helper (createAuthenticatedSession)
│   ├── seed.ts              # Database seeding helper (seedDatabase)
│   └── supabase.ts          # Supabase client and cleanup utilities
├── fixtures/
│   ├── index.ts             # Custom Playwright fixtures
│   └── survey-fixtures.ts   # Survey-specific test fixtures
├── pages/
│   ├── LoginPage.ts         # Page Object for login page
│   └── SurveyPage.ts        # Page Object for survey page
└── tests/
    └── survey-start.spec.ts # Test file
```

## Key Files

### `e2e/auth.json`
Generated authentication state file (git-ignored). Contains cookies and localStorage data needed to maintain authenticated sessions across tests.

### `e2e/global.setup.ts`
Orchestrates the entire test setup:
- Cleans up old test data
- Seeds database with fresh test data
- Creates authenticated session and saves to `auth.json`

### `e2e/utils/auth.ts`
Contains the `createAuthenticatedSession()` function that:
- Opens a browser
- Logs in with test credentials
- Saves the session state to `auth.json`

### `e2e/utils/seed.ts`
Contains the `seedDatabase()` function that creates test data (competitions, surveys) in the database.

### `.gitignore`
Excludes `e2e/auth.json` from version control to prevent leaking session data.

## Environment Variables

Required in `.env.test`:

- `E2E_USER_EMAIL` - Primary test user email
- `E2E_USER_PASSWORD` - Primary test user password
- `E2E_USER2_EMAIL` - Secondary test user email (for multi-user scenarios)

## Best Practices

1. **Use authenticated sessions when possible**: Most tests should use the pre-authenticated session to save time
2. **Test login flows explicitly**: Have dedicated tests that verify the login process works
3. **Keep auth.json out of version control**: Never commit this file
4. **Regenerate auth state in CI/CD**: Always run global setup in CI to generate fresh auth state

## See Also

- [E2E Fixtures Guide](./e2e-fixtures.md) - Learn how to use test fixtures for data management
- [Main Testing Documentation](../testing.md) - Complete testing documentation
- [Quick Reference](../TESTING_QUICK_REFERENCE.md) - Testing commands and patterns

