# E2E Tests Documentation

## Authentication Strategy

This test suite uses Playwright's `storageState` feature to optimize test execution by reusing authenticated sessions.

### How it Works

1. **Global Setup** (`global.setup.ts`):
   - Runs once before all tests
   - Clears test data from database
   - Seeds database with test competitions and surveys
   - Logs in as `E2E_USER_EMAIL` 
   - Saves the authenticated session to `e2e/auth.json`
   - This file contains cookies and localStorage needed for authenticated requests

2. **Test Organization**:
   - **Unauthenticated tests**: Start with a fresh browser context (no stored session)
   - **Authenticated tests**: Use `test.use({ storageState: "e2e/auth.json" })` to start already logged in

### Benefits

- **Faster execution**: Authenticated tests skip the login flow
- **Isolated tests**: Unauthenticated tests remain independent
- **Flexibility**: Different test groups can use different authentication states
- **Clean code**: `test.use()` can be applied once for multiple tests

### Example Usage

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

### Project Structure

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

### Files

- `e2e/auth.json` - Generated authentication state (git-ignored)
- `e2e/global.setup.ts` - Orchestrates setup (cleanup, seed, auth)
- `e2e/utils/auth.ts` - Creates and saves authenticated sessions
- `e2e/utils/seed.ts` - Seeds database with test data
- `.gitignore` - Excludes auth.json from version control

### Environment Variables

Required in `.env.test`:
- `E2E_USER_EMAIL` - Primary test user email
- `E2E_USER_PASSWORD` - Primary test user password
- `E2E_USER2_EMAIL` - Secondary test user email (for multi-user scenarios)

