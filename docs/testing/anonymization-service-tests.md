# Unit Testing Best Practices: Anonymization Service

## Overview

This document describes best practices for testing the anonymization service and provider pattern used in PilotVoice. These patterns can be applied to other services in the application.

## Testing Strategy

The anonymization service uses a provider pattern that dynamically loads either a mock or real implementation based on environment variables. This requires special testing techniques.

## Key Testing Techniques with Vitest

### 1. Mock Factory Pattern

Use `vi.mock()` with factory functions at the top level:

```typescript
vi.mock("@/lib/services/mock/mockAnonymizationService", () => ({
  MockAnonymizationService: MockAnonymizationServiceMock,
}));
```

**Benefits:**
- Module-level mocking
- Factory function at the top level of the test file
- Returns typed mock implementations

### 2. Environment Variable Stubbing

Use `vi.stubEnv()` to mock environment variables:

```typescript
vi.stubEnv("MOCK_AI_SERVICE", "true");
// ... test code ...
vi.unstubAllEnvs(); // cleanup
```

**Benefits:**
- Mocks `import.meta.env` correctly
- Clean state between tests
- No side effects on other tests

### 3. Module Reset for Fresh Imports

Use `vi.resetModules()` to clear the module cache:

```typescript
vi.resetModules();
const module = await import("@/lib/services/anonymizationServiceProvider");
```

**Benefits:**
- Clears module cache between tests
- Simulates different environment configurations
- Tests actual module loading behavior

### 4. Setup/Cleanup Pattern

Use `beforeEach`/`afterEach` for consistent test state:

```typescript
beforeEach(() => {
  vi.clearAllMocks();
  vi.resetModules();
});

afterEach(() => {
  vi.unstubAllEnvs();
});
```

**Benefits:**
- Test isolation
- Clean state before each test
- Automatic cleanup

### 5. Structured Test Organization

Use nested `describe()` blocks for clarity:

```typescript
describe("AnonymizationServiceProvider", () => {
  describe("Service Selection Based on Environment Variable", () => {
    it("should load MockAnonymizationService when...", async () => {
      // Arrange
      // Act
      // Assert
    });
  });
});
```

**Benefits:**
- Hierarchical grouping of related tests
- Descriptive names for self-documenting tests
- Clear **Arrange-Act-Assert** pattern

## Test Coverage Areas

### 1. Service Selection Based on Environment Variable

Test all paths for environment-based service loading:

- ✅ Loading `MockAnonymizationService` when `MOCK_AI_SERVICE === "true"`
- ✅ Loading real `AnonymizationService` when `MOCK_AI_SERVICE === "false"`
- ✅ Loading real service when variable is `undefined` (default behavior)

### 2. Edge Cases

Test boundary conditions:

- Empty string (`""`) → loads real service
- Different case (`"TRUE"`) → loads real service (case-sensitive)
- Value `"1"` → loads real service (strict comparison)
- Whitespace in value (`" true "`) → loads real service (no trim)
- Boolean `true` instead of string → appropriate handling

**Key insight:** Implementation uses **strict comparison** (`=== "true"`), so it's **case-sensitive** and only the exact string `"true"` activates the mock.

### 3. Module Exports

Verify export structure:

- ✅ `AnonymizationService` exported as **named export**
- ✅ Exported value is a **function/constructor** (not an instance)

### 4. Type Safety

Verify type compatibility:

- ✅ Compatibility between mock and real service
- ✅ Both exports are functions (constructors)

### 5. Performance

Test lazy loading behavior:

- ✅ Uses **dynamic imports** for lazy loading
- ✅ Only selected service is loaded (not both simultaneously)

## Best Practices Applied

### 1. Explicit Assertion Messages

```typescript
expect(module.AnonymizationService).toBe(MockAnonymizationServiceMock);
// Clear expectation of what should happen
```

### 2. Type Safety in Tests

```typescript
expect(typeof module.AnonymizationService).toBe("function");
```

### 3. Edge Case Coverage

- Test unusual values for environment variables
- Test `undefined`, `""`, incorrect case
- Test whitespace handling

### 4. Performance Considerations

- Verify lazy loading
- Test that only the needed module is loaded

### 5. Comprehensive Documentation

- JSDoc comments in test file headers
- "Testing strategy" section explaining the approach
- Descriptive test names

## Common Issues and Recommendations

### Issue 1: String Comparison on Environment Variable

⚠️ **Problem:** `=== "true"` is sensitive to typos
- `"TRUE"` won't work
- `" true "` (with whitespace) won't work
- Can cause hard-to-debug errors

**Recommendation:**
```typescript
const useMock = ["true", "1", "yes"].includes(
  import.meta.env.MOCK_AI_SERVICE?.toLowerCase().trim() ?? ""
);
```

### Issue 2: No Import Error Handling

⚠️ **Problem:** No error handling for failed imports
- What if mock file doesn't exist?
- No graceful degradation

**Recommendation:**
```typescript
try {
  export const AnonymizationService = useMock
    ? (await import("...")).MockAnonymizationService
    : (await import("...")).AnonymizationService;
} catch (error) {
  console.error("Failed to load AnonymizationService", error);
  throw new Error("Service initialization failed");
}
```

### Issue 3: No Runtime Service Switching

❌ **Problem:** Environment variable checked only once at initialization
- Can't change service without app restart
- Limited flexibility at runtime

**Recommendation:** Implement factory pattern with runtime switching:
```typescript
export function getAnonymizationService(forceMock?: boolean) {
  const useMock = forceMock ?? import.meta.env.MOCK_AI_SERVICE === "true";
  return useMock ? MockAnonymizationService : AnonymizationService;
}
```

## Running Tests

### Run specific test file:
```bash
npm test -- anonymizationServiceProvider
```

### With coverage:
```bash
npm test -- anonymizationServiceProvider --coverage
```

### In watch mode:
```bash
npm test -- anonymizationServiceProvider --watch
```

### With UI mode:
```bash
npm test -- anonymizationServiceProvider --ui
```

## See Also

- [Main Testing Documentation](../testing.md)
- [Quick Reference](./quick-reference.md)
- [E2E Fixtures Guide](./e2e-fixtures.md)

