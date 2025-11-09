import type { IAnonymizationService } from "@/types";
import log from "@/lib/logger";

// Conditionally import and export the correct service implementation
const useMock = import.meta.env.MOCK_AI_SERVICE === "true";

export const AnonymizationService: IAnonymizationService = useMock
  ? (await import("@/lib/services/mock/mockAnonymizationService")).MockAnonymizationService
  : (await import("@/lib/services/anonymizationService")).AnonymizationService;

// Optional: log once at module initialization
log.info(`[AnonymizationServiceProvider] Using ${useMock ? "MOCK" : "REAL"} AnonymizationService`);
