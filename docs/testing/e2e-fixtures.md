# E2E Test Fixtures Usage Guide

## Overview

The fixtures system provides:

- **Test isolation** - each test creates its own data
- **Automatic cleanup** - data is removed even when tests fail
- **Ease of use** - simple helper functions
- **Clarity** - all test context in one place

## Basic Usage

### 1. Import fixtures in your test

```typescript
import { test, expect } from "../fixtures";
import {
  createEmptySurvey,
  createSurveyWithResponse,
  getUserIdByEmail,
} from "../fixtures/survey-fixtures";
```

### 2. Use fixtures in your test

```typescript
test("my test", async ({ supabase, cleanup }) => {
  // Create data
  const surveyData = await createEmptySurvey(supabase);
  
  // IMPORTANT: Always track created data for cleanup
  cleanup.track(surveyData);
  
  // Your test...
  
  // Cleanup will run automatically after the test finishes
});
```

## Available Helper Functions

### `createEmptySurvey()`

Creates an empty survey without responses.

```typescript
const surveyData = await createEmptySurvey(
  supabase,
  competitionId, // optional - creates new competition if not provided
  suffix // optional - unique suffix for slug
);
cleanup.track(surveyData);
```

**Returns:**
```typescript
{
  competitionId: number;
  surveyId: number;
  surveySlug: string;
}
```

### `createSurveyWithResponse()`

Creates a survey with an existing response for a specific user.

```typescript
const userId = await getUserIdByEmail(supabase, "user@example.com");
const surveyData = await createSurveyWithResponse(
  supabase,
  userId,
  competitionId, // optional
  suffix // optional
);
cleanup.track(surveyData);
```

**Returns:**
```typescript
{
  competitionId: number;
  surveyId: number;
  surveySlug: string;
  responseId: number;
}
```

### `getUserIdByEmail()`

Gets user ID by email address.

```typescript
const userId = await getUserIdByEmail(supabase, "user@example.com");
```

### `createTestCompetition()`

Creates a test competition (usually you don't need to use this directly).

```typescript
const competitionId = await createTestCompetition(supabase, suffix);
```

## Usage Examples

### Example 1: Test with empty survey

```typescript
test("should handle empty survey", async ({ page, surveyPage, supabase, cleanup }) => {
  // Create empty survey
  const surveyData = await createEmptySurvey(supabase, undefined, `test-${Date.now()}`);
  cleanup.track(surveyData);
  
  // Test
  await surveyPage.goto(surveyData.surveySlug);
  await surveyPage.waitForDataLoaded();
  
  const buttonText = await surveyPage.getStartButtonText();
  expect(buttonText).toBe("Sign In to Start");
  
  // Cleanup will automatically remove survey and competition
});
```

### Example 2: Test with existing response

```typescript
test("should show continue button for existing response", async ({ 
  page, 
  surveyPage, 
  loginPage,
  supabase, 
  cleanup 
}) => {
  const email = process.env.E2E_USER_EMAIL!;
  const userId = await getUserIdByEmail(supabase, email);
  
  // Create survey with response
  const surveyData = await createSurveyWithResponse(
    supabase,
    userId,
    undefined,
    `with-response-${Date.now()}`
  );
  cleanup.track(surveyData);
  
  // Login and test
  await loginPage.goto();
  await loginPage.login(email, process.env.E2E_USER_PASSWORD!);
  await page.waitForURL("/");
  
  await surveyPage.goto(surveyData.surveySlug);
  await surveyPage.waitForDataLoaded();
  
  const buttonText = await surveyPage.getStartButtonText();
  expect(buttonText).toBe("Continue Survey");
  
  // Cleanup will automatically remove response, survey and competition
});
```

### Example 3: Multiple surveys in one test

```typescript
test("should handle multiple surveys", async ({ supabase, cleanup }) => {
  // Create shared competition for both surveys
  const competitionId = await createTestCompetition(supabase, `multi-${Date.now()}`);
  
  // First survey - empty
  const survey1 = await createEmptySurvey(supabase, competitionId, "survey-1");
  cleanup.track(survey1);
  
  // Second survey - with response
  const userId = await getUserIdByEmail(supabase, process.env.E2E_USER_EMAIL!);
  const survey2 = await createSurveyWithResponse(supabase, userId, competitionId, "survey-2");
  cleanup.track(survey2);
  
  // Tests...
  
  // Cleanup will automatically remove both surveys, responses and competition
});
```

## Cleanup Mechanism

### How does it work?

1. **Create tracker**: `cleanup` fixture is automatically available in every test
2. **Tracking**: You call `cleanup.track(data)` for each created data
3. **Automatic cleanup**: After the test finishes (even if it fails), cleanup automatically:
   - Removes responses
   - Removes surveys
   - Removes competitions
   - In the correct order (respecting foreign keys)

### Why does it work even when the test fails?

Playwright's fixtures use a try-finally pattern:

```typescript
cleanup: async ({ supabase }, use) => {
  const cleanup = new FixtureCleanup();
  await use(cleanup);  // Test executes here
  // Cleanup ALWAYS runs, even when test fails
  await cleanup.cleanup(supabase);
}
```

### What if cleanup fails?

- Errors are logged to console
- Process continues (doesn't throw)
- This allows partial cleanup when possible

## Best Practices

### ✅ DO:

1. **Always track created data:**
   ```typescript
   const data = await createEmptySurvey(supabase);
   cleanup.track(data);
   ```

2. **Use unique suffixes:**
   ```typescript
   const suffix = `test-${Date.now()}`;
   const data = await createEmptySurvey(supabase, undefined, suffix);
   ```

3. **Create data at the beginning of the test:**
   ```typescript
   test("my test", async ({ supabase, cleanup }) => {
     const data = await createEmptySurvey(supabase);
     cleanup.track(data);
     
     // Rest of the test...
   });
   ```

### ❌ DON'T:

1. **Don't use global state:**
   ```typescript
   // BAD - tests are not isolated
   const surveySlugs = getSurveySlugs();
   ```

2. **Don't create data manually without tracking:**
   ```typescript
   // BAD - data won't be removed
   await supabase.from("surveys").insert(...);
   ```

3. **Don't use the same data in multiple tests:**
   ```typescript
   // BAD - tests depend on each other
   test.describe.configure({ mode: 'serial' });
   ```

## Migration from Old Approach

### Old approach (global.setup.ts):

```typescript
const surveySlugs = getSurveySlugs();
const testSurveySlug = surveySlugs[0];
```

### New approach (fixtures):

```typescript
test("my test", async ({ supabase, cleanup }) => {
  const surveyData = await createEmptySurvey(supabase);
  cleanup.track(surveyData);
  
  await surveyPage.goto(surveyData.surveySlug);
  // ...
});
```

## Debugging

### Check what was created:

```typescript
test("debug test", async ({ supabase, cleanup }) => {
  const data = await createEmptySurvey(supabase);
  console.log("Created survey:", data);
  cleanup.track(data);
  
  // Test...
});
```

### Check if cleanup worked:

Cleanup logs errors to console. Check test output:

```
Cleanup errors occurred: [
  "Failed to delete surveys: ..."
]
```

### Manual cleanup:

```typescript
test("manual cleanup test", async ({ supabase }) => {
  const cleanup = new FixtureCleanup();
  
  try {
    const data = await createEmptySurvey(supabase);
    cleanup.track(data);
    
    // Test...
  } finally {
    await cleanup.cleanup(supabase);
  }
});
```

## See Also

- [E2E Authentication Strategy](./e2e-authentication.md) - Learn about authentication in E2E tests
- [Main Testing Documentation](../testing.md) - Complete testing documentation
- [Quick Reference](../TESTING_QUICK_REFERENCE.md) - Testing commands and patterns

