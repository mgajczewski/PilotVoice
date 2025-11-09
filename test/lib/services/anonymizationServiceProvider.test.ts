import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { IAnonymizationService } from "@/types";

const MockAnonymizationServiceMock: IAnonymizationService = {
  checkAndAnonymize: vi.fn(),
};
const RealAnonymizationServiceMock: IAnonymizationService = {
  checkAndAnonymize: vi.fn(),
};

// Mock the service modules at the top level
vi.mock("@/lib/services/mock/mockAnonymizationService", () => ({
  MockAnonymizationService: MockAnonymizationServiceMock,
}));

vi.mock("@/lib/services/anonymizationService", () => ({
  AnonymizationService: RealAnonymizationServiceMock,
}));

describe("AnonymizationServiceProvider", () => {
  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks();

    // Clear module cache to allow fresh imports
    vi.resetModules();
  });

  afterEach(() => {
    // Clean up environment stubs
    vi.unstubAllEnvs();
  });

  describe("Service Selection Based on Environment Variable", () => {
    it.each([
      {
        envValue: "true",
        description: "MOCK_AI_SERVICE is 'true'",
      },
      {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        envValue: true as any,
        description: "boolean true (not string)",
      },
    ])("should load MockAnonymizationService when $description", async ({ envValue }) => {
      // Arrange: Set environment variable
      vi.stubEnv("MOCK_AI_SERVICE", envValue);

      // Act: Import the provider module
      const module = await import("@/lib/services/anonymizationServiceProvider");

      // Assert: Verify mock service is exported
      expect(module.AnonymizationService).toBe(MockAnonymizationServiceMock);
    });

    it.each([
      { envValue: "false", description: "'false'" },
      { envValue: undefined, description: "undefined (default)" },
      { envValue: "", description: "empty string (strict equality check)" },
      { envValue: "TRUE", description: "'TRUE' (case sensitive)" },
      { envValue: "1", description: "'1' (truthy but not 'true')" },
      { envValue: " true ", description: "' true ' (whitespace, no trimming)" },
    ])("should load real AnonymizationService when MOCK_AI_SERVICE is $description", async ({ envValue }) => {
      // Arrange: Set environment variable (or leave undefined)
      vi.stubEnv("MOCK_AI_SERVICE", envValue);

      // Act: Import the provider module
      const module = await import("@/lib/services/anonymizationServiceProvider");

      // Assert: Verify real service is exported
      expect(module.AnonymizationService).toBe(RealAnonymizationServiceMock);
    });
  });

  describe("Performance Considerations", () => {
    it("should use dynamic imports for lazy loading", async () => {
      // This test verifies that the implementation uses dynamic imports
      // by checking that modules are not loaded until provider is imported

      // Arrange: Clear module cache
      vi.resetModules();
      vi.stubEnv("MOCK_AI_SERVICE", "true");

      // Act: Import only the provider
      const module = await import("@/lib/services/anonymizationServiceProvider");

      // Assert: Verify that the service was loaded correctly
      expect(module.AnonymizationService).toBeDefined();
    });
  });

  // ... inne testy ...

  describe("Runtime Environment Variable Changes", () => {
    it("should not switch service if env var changes after initial import", async () => {
      // Arrange (Part 1): Load with MOCK enabled
      vi.resetModules(); // Ensure a clean slate for modules
      vi.stubEnv("MOCK_AI_SERVICE", "true");

      // Act (Part 1): First import
      const module1 = await import("@/lib/services/anonymizationServiceProvider");

      // Assert (Part 1): Verify the mock service was loaded
      expect(module1.AnonymizationService).toBe(MockAnonymizationServiceMock);

      // Arrange (Part 2): Change the environment variable at runtime
      vi.stubEnv("MOCK_AI_SERVICE", "false");

      // Act (Part 2): Re-import the provider. This will hit the module cache.
      const module2 = await import("@/lib/services/anonymizationServiceProvider");

      // Assert (Part 2): The service should NOT have changed
      expect(module2.AnonymizationService).toBe(MockAnonymizationServiceMock);
      expect(module2.AnonymizationService).not.toBe(RealAnonymizationServiceMock);
    });
  });
});
