import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  findUserResponse,
  createSurveyResponse,
  updateSurveyResponse,
  SurveyNotFoundError,
  DuplicateSurveyResponseError,
  SurveyResponseNotFoundError,
  SurveyResponseForbiddenError,
} from "../../../src/lib/services/surveyResponseService";
import { AnonymizationError } from "../../../src/lib/services/anonymizationService";
import { SUPABASE_ERROR_CODES } from "../../../src/lib/constants/supabaseErrors";
import type { SurveyResponseDto, CreateSurveyResponseCommand, UpdateSurveyResponseCommand } from "../../../src/types";
import type { SupabaseClient } from "../../../src/db/supabase.client";
import log from "../../../src/lib/logger";

// Mock the AnonymizationService
vi.mock("../../../src/lib/services/anonymizationServiceProvider", () => ({
  AnonymizationService: {
    checkAndAnonymize: vi.fn(),
  },
}));

// Import the mocked service to access it in tests
import { AnonymizationService } from "../../../src/lib/services/anonymizationServiceProvider";

describe("SurveyResponseService", () => {
  type SupabaseFromMock = ReturnType<typeof vi.fn>;

  interface SupabaseStub {
    from: SupabaseFromMock;
  }

  let mockSupabase: SupabaseStub;
  const testSurveyId = 42;
  const testUserId = "user-123";
  const testResponseId = 100;

  interface QueryResult<T> {
    data: T | null;
    error: unknown;
  }

  const createSingleQueryBuilder = <T>(result: QueryResult<T>) => ({
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue(result),
  });

  const createMaybeSingleQueryBuilder = <T>(result: QueryResult<T>) => ({
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue(result),
  });

  const createInsertQueryBuilder = <T>(result: QueryResult<T>) => ({
    insert: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue(result),
  });

  const createUpdateQueryBuilder = <T>(result: QueryResult<T>) => ({
    update: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue(result),
  });

  const toSupabaseClient = () => mockSupabase as unknown as SupabaseClient;

  const captureError = async (promise: Promise<unknown>): Promise<Error> => {
    try {
      await promise;
      throw new Error("Expected promise to reject");
    } catch (error) {
      if (error instanceof Error) {
        return error;
      }
      return new Error(String(error));
    }
  };

  beforeEach(() => {
    mockSupabase = {
      from: vi.fn(),
    };
    vi.clearAllMocks();
  });

  describe("findUserResponse", () => {
    it("should return user response when it exists", async () => {
      // Arrange
      const mockSurvey = { id: testSurveyId };
      const mockResponse: SurveyResponseDto = {
        id: testResponseId,
        survey_id: testSurveyId,
        user_id: testUserId,
        overall_rating: 4,
        open_feedback: "Great event!",
        completed_at: null,
        created_at: "2025-01-01T00:00:00Z",
        updated_at: "2025-01-01T00:00:00Z",
      };

      const surveyQueryBuilder = createSingleQueryBuilder({ data: mockSurvey, error: null });
      const responseQueryBuilder = createMaybeSingleQueryBuilder({ data: mockResponse, error: null });

      mockSupabase.from.mockReturnValueOnce(surveyQueryBuilder).mockReturnValueOnce(responseQueryBuilder);

      // Act
      const result = await findUserResponse(testSurveyId, testUserId, toSupabaseClient());

      // Assert
      expect(result).toEqual(mockResponse);
      expect(mockSupabase.from).toHaveBeenCalledWith("surveys");
      expect(mockSupabase.from).toHaveBeenCalledWith("survey_responses");
      expect(surveyQueryBuilder.select).toHaveBeenCalledWith("id");
      expect(surveyQueryBuilder.eq).toHaveBeenCalledWith("id", testSurveyId);
      expect(responseQueryBuilder.select).toHaveBeenCalledWith("*");
      expect(responseQueryBuilder.eq).toHaveBeenNthCalledWith(1, "survey_id", testSurveyId);
      expect(responseQueryBuilder.eq).toHaveBeenNthCalledWith(2, "user_id", testUserId);
    });

    it("should return null when user has no response", async () => {
      // Arrange
      const mockSurvey = { id: testSurveyId };

      const surveyQueryBuilder = createSingleQueryBuilder({ data: mockSurvey, error: null });
      const responseQueryBuilder = createMaybeSingleQueryBuilder({ data: null, error: null });

      mockSupabase.from.mockReturnValueOnce(surveyQueryBuilder).mockReturnValueOnce(responseQueryBuilder);

      // Act
      const result = await findUserResponse(testSurveyId, testUserId, toSupabaseClient());

      // Assert
      expect(result).toBeNull();
      expect(surveyQueryBuilder.select).toHaveBeenCalledWith("id");
      expect(surveyQueryBuilder.eq).toHaveBeenCalledWith("id", testSurveyId);
      expect(responseQueryBuilder.select).toHaveBeenCalledWith("*");
      expect(responseQueryBuilder.eq).toHaveBeenNthCalledWith(1, "survey_id", testSurveyId);
      expect(responseQueryBuilder.eq).toHaveBeenNthCalledWith(2, "user_id", testUserId);
    });

    it("should throw SurveyNotFoundError when survey does not exist", async () => {
      // Arrange
      const surveyQueryBuilder = createSingleQueryBuilder({
        data: null,
        error: { code: SUPABASE_ERROR_CODES.NOT_FOUND },
      });

      mockSupabase.from.mockReturnValue(surveyQueryBuilder);

      // Act
      const error = await captureError(findUserResponse(testSurveyId, testUserId, toSupabaseClient()));

      // Assert
      expect(error).toBeInstanceOf(SurveyNotFoundError);
      expect(error.message).toBe(`Survey with id ${testSurveyId} not found`);
      expect(surveyQueryBuilder.select).toHaveBeenCalledWith("id");
      expect(surveyQueryBuilder.eq).toHaveBeenCalledWith("id", testSurveyId);
    });

    it("should throw SurveyNotFoundError when survey data is null without error code", async () => {
      // Arrange
      const surveyQueryBuilder = createSingleQueryBuilder({ data: null, error: null });

      mockSupabase.from.mockReturnValue(surveyQueryBuilder);

      // Act
      const error = await captureError(findUserResponse(testSurveyId, testUserId, toSupabaseClient()));

      // Assert
      expect(error).toBeInstanceOf(SurveyNotFoundError);
      expect(error.message).toBe(`Survey with id ${testSurveyId} not found`);
      expect(surveyQueryBuilder.select).toHaveBeenCalledWith("id");
      expect(surveyQueryBuilder.eq).toHaveBeenCalledWith("id", testSurveyId);
    });

    it("should throw generic error when survey check fails with other error", async () => {
      // Arrange
      const surveyQueryBuilder = createSingleQueryBuilder({
        data: null,
        error: { code: "SOME_OTHER_ERROR", message: "Database error" },
      });

      mockSupabase.from.mockReturnValue(surveyQueryBuilder);

      // Act
      const error = await captureError(findUserResponse(testSurveyId, testUserId, toSupabaseClient()));

      // Assert
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe("Failed to check survey existence");
      expect(surveyQueryBuilder.select).toHaveBeenCalledWith("id");
      expect(surveyQueryBuilder.eq).toHaveBeenCalledWith("id", testSurveyId);
    });

    it("should throw generic error when response fetch fails", async () => {
      // Arrange
      const mockSurvey = { id: testSurveyId };

      const surveyQueryBuilder = createSingleQueryBuilder({ data: mockSurvey, error: null });
      const responseQueryBuilder = createMaybeSingleQueryBuilder({
        data: null,
        error: { message: "Database error" },
      });

      mockSupabase.from.mockReturnValueOnce(surveyQueryBuilder).mockReturnValueOnce(responseQueryBuilder);

      // Act
      const error = await captureError(findUserResponse(testSurveyId, testUserId, toSupabaseClient()));

      // Assert
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe("Failed to fetch survey response");
      expect(surveyQueryBuilder.select).toHaveBeenCalledWith("id");
      expect(surveyQueryBuilder.eq).toHaveBeenCalledWith("id", testSurveyId);
      expect(responseQueryBuilder.select).toHaveBeenCalledWith("*");
      expect(responseQueryBuilder.eq).toHaveBeenNthCalledWith(1, "survey_id", testSurveyId);
      expect(responseQueryBuilder.eq).toHaveBeenNthCalledWith(2, "user_id", testUserId);
    });
  });

  describe("createSurveyResponse", () => {
    it("should create survey response with overall_rating", async () => {
      // Arrange
      const command: CreateSurveyResponseCommand = { overall_rating: 5 };
      const mockSurvey = { id: testSurveyId };
      const mockCreatedResponse: SurveyResponseDto = {
        id: testResponseId,
        survey_id: testSurveyId,
        user_id: testUserId,
        overall_rating: 5,
        open_feedback: null,
        completed_at: null,
        created_at: "2025-01-01T00:00:00Z",
        updated_at: "2025-01-01T00:00:00Z",
      };

      const surveyQueryBuilder = createSingleQueryBuilder({ data: mockSurvey, error: null });
      const insertQueryBuilder = createInsertQueryBuilder({ data: mockCreatedResponse, error: null });

      mockSupabase.from.mockReturnValueOnce(surveyQueryBuilder).mockReturnValueOnce(insertQueryBuilder);

      // Act
      const result = await createSurveyResponse(toSupabaseClient(), command, testSurveyId, testUserId);

      // Assert
      expect(result).toEqual(mockCreatedResponse);
      expect(mockSupabase.from).toHaveBeenCalledWith("surveys");
      expect(mockSupabase.from).toHaveBeenCalledWith("survey_responses");
      expect(surveyQueryBuilder.select).toHaveBeenCalledWith("id");
      expect(surveyQueryBuilder.eq).toHaveBeenCalledWith("id", testSurveyId);
      expect(insertQueryBuilder.insert).toHaveBeenCalledWith({
        survey_id: testSurveyId,
        user_id: testUserId,
        overall_rating: 5,
      });
      expect(insertQueryBuilder.select).toHaveBeenCalled();
    });

    it("should create survey response with null overall_rating when not provided", async () => {
      // Arrange
      const command: CreateSurveyResponseCommand = {};
      const mockSurvey = { id: testSurveyId };
      const mockCreatedResponse: SurveyResponseDto = {
        id: testResponseId,
        survey_id: testSurveyId,
        user_id: testUserId,
        overall_rating: null,
        open_feedback: null,
        completed_at: null,
        created_at: "2025-01-01T00:00:00Z",
        updated_at: "2025-01-01T00:00:00Z",
      };

      const surveyQueryBuilder = createSingleQueryBuilder({ data: mockSurvey, error: null });
      const insertQueryBuilder = createInsertQueryBuilder({ data: mockCreatedResponse, error: null });

      mockSupabase.from.mockReturnValueOnce(surveyQueryBuilder).mockReturnValueOnce(insertQueryBuilder);

      // Act
      const result = await createSurveyResponse(toSupabaseClient(), command, testSurveyId, testUserId);

      // Assert
      expect(result).toEqual(mockCreatedResponse);
      expect(result.overall_rating).toBeNull();
      expect(surveyQueryBuilder.select).toHaveBeenCalledWith("id");
      expect(surveyQueryBuilder.eq).toHaveBeenCalledWith("id", testSurveyId);
      expect(insertQueryBuilder.insert).toHaveBeenCalledWith({
        survey_id: testSurveyId,
        user_id: testUserId,
        overall_rating: null,
      });
    });

    it("should throw SurveyNotFoundError when survey does not exist", async () => {
      // Arrange
      const command: CreateSurveyResponseCommand = {};

      const surveyQueryBuilder = createSingleQueryBuilder({
        data: null,
        error: { code: SUPABASE_ERROR_CODES.NOT_FOUND },
      });

      mockSupabase.from.mockReturnValue(surveyQueryBuilder);

      // Act
      const error = await captureError(createSurveyResponse(toSupabaseClient(), command, testSurveyId, testUserId));

      // Assert
      expect(error).toBeInstanceOf(SurveyNotFoundError);
      expect(error.message).toBe(`Survey with id ${testSurveyId} not found`);
      expect(surveyQueryBuilder.select).toHaveBeenCalledWith("id");
      expect(surveyQueryBuilder.eq).toHaveBeenCalledWith("id", testSurveyId);
    });

    it("should throw DuplicateSurveyResponseError when user already has a response", async () => {
      // Arrange
      const command: CreateSurveyResponseCommand = {};
      const mockSurvey = { id: testSurveyId };

      const surveyQueryBuilder = createSingleQueryBuilder({ data: mockSurvey, error: null });
      const insertQueryBuilder = createInsertQueryBuilder({
        data: null,
        error: { code: SUPABASE_ERROR_CODES.UNIQUE_VIOLATION },
      });

      mockSupabase.from.mockReturnValueOnce(surveyQueryBuilder).mockReturnValueOnce(insertQueryBuilder);

      // Act
      const error = await captureError(createSurveyResponse(toSupabaseClient(), command, testSurveyId, testUserId));

      // Assert
      expect(error).toBeInstanceOf(DuplicateSurveyResponseError);
      expect(error.message).toBe(`User ${testUserId} has already created a response for survey ${testSurveyId}`);
      expect(surveyQueryBuilder.select).toHaveBeenCalledWith("id");
      expect(surveyQueryBuilder.eq).toHaveBeenCalledWith("id", testSurveyId);
      expect(insertQueryBuilder.insert).toHaveBeenCalledWith({
        survey_id: testSurveyId,
        user_id: testUserId,
        overall_rating: null,
      });
    });

    it("should throw generic error when insert fails with other error", async () => {
      // Arrange
      const command: CreateSurveyResponseCommand = {};
      const mockSurvey = { id: testSurveyId };

      const surveyQueryBuilder = createSingleQueryBuilder({ data: mockSurvey, error: null });
      const insertQueryBuilder = createInsertQueryBuilder({
        data: null,
        error: { code: "SOME_ERROR", message: "Insert failed" },
      });

      mockSupabase.from.mockReturnValueOnce(surveyQueryBuilder).mockReturnValueOnce(insertQueryBuilder);

      // Act
      const error = await captureError(createSurveyResponse(toSupabaseClient(), command, testSurveyId, testUserId));

      // Assert
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe("Failed to create survey response");
      expect(surveyQueryBuilder.select).toHaveBeenCalledWith("id");
      expect(surveyQueryBuilder.eq).toHaveBeenCalledWith("id", testSurveyId);
      expect(insertQueryBuilder.insert).toHaveBeenCalledWith({
        survey_id: testSurveyId,
        user_id: testUserId,
        overall_rating: null,
      });
    });

    it("should throw error when no data is returned after successful insert", async () => {
      // Arrange
      const command: CreateSurveyResponseCommand = {};
      const mockSurvey = { id: testSurveyId };

      const surveyQueryBuilder = createSingleQueryBuilder({ data: mockSurvey, error: null });
      const insertQueryBuilder = createInsertQueryBuilder({ data: null, error: null });

      mockSupabase.from.mockReturnValueOnce(surveyQueryBuilder).mockReturnValueOnce(insertQueryBuilder);

      // Act
      const error = await captureError(createSurveyResponse(toSupabaseClient(), command, testSurveyId, testUserId));

      // Assert
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe("Failed to create survey response: no data returned");
      expect(surveyQueryBuilder.select).toHaveBeenCalledWith("id");
      expect(surveyQueryBuilder.eq).toHaveBeenCalledWith("id", testSurveyId);
      expect(insertQueryBuilder.insert).toHaveBeenCalledWith({
        survey_id: testSurveyId,
        user_id: testUserId,
        overall_rating: null,
      });
    });
  });

  describe("updateSurveyResponse", () => {
    const mockExistingResponse: SurveyResponseDto = {
      id: testResponseId,
      survey_id: testSurveyId,
      user_id: testUserId,
      overall_rating: 3,
      open_feedback: null,
      completed_at: null,
      created_at: "2025-01-01T00:00:00Z",
      updated_at: "2025-01-01T00:00:00Z",
    };

    it("should update overall_rating", async () => {
      // Arrange
      const command: UpdateSurveyResponseCommand = { overall_rating: 5 };
      const mockUpdatedResponse: SurveyResponseDto = {
        ...mockExistingResponse,
        overall_rating: 5,
        updated_at: "2025-01-02T00:00:00Z",
      };

      const fetchQueryBuilder = createMaybeSingleQueryBuilder({ data: mockExistingResponse, error: null });
      const updateQueryBuilder = createUpdateQueryBuilder({ data: mockUpdatedResponse, error: null });

      mockSupabase.from.mockReturnValueOnce(fetchQueryBuilder).mockReturnValueOnce(updateQueryBuilder);

      // Act
      const result = await updateSurveyResponse(toSupabaseClient(), command, testResponseId, testUserId);

      // Assert
      expect(result).toEqual(mockUpdatedResponse);
      expect(result.overall_rating).toBe(5);
      expect(fetchQueryBuilder.select).toHaveBeenCalledWith("*");
      expect(fetchQueryBuilder.eq).toHaveBeenCalledWith("id", testResponseId);
      expect(updateQueryBuilder.update).toHaveBeenCalledWith({ overall_rating: 5 });
      expect(updateQueryBuilder.eq).toHaveBeenCalledWith("id", testResponseId);
    });

    it("should update completed_at timestamp", async () => {
      // Arrange
      const completedAt = "2025-01-02T12:00:00Z";
      const command: UpdateSurveyResponseCommand = { completed_at: completedAt };
      const mockUpdatedResponse: SurveyResponseDto = {
        ...mockExistingResponse,
        completed_at: completedAt,
        updated_at: "2025-01-02T00:00:00Z",
      };

      const fetchQueryBuilder = createMaybeSingleQueryBuilder({ data: mockExistingResponse, error: null });
      const updateQueryBuilder = createUpdateQueryBuilder({ data: mockUpdatedResponse, error: null });

      mockSupabase.from.mockReturnValueOnce(fetchQueryBuilder).mockReturnValueOnce(updateQueryBuilder);

      // Act
      const result = await updateSurveyResponse(toSupabaseClient(), command, testResponseId, testUserId);

      // Assert
      expect(result.completed_at).toBe(completedAt);
      expect(fetchQueryBuilder.select).toHaveBeenCalledWith("*");
      expect(fetchQueryBuilder.eq).toHaveBeenCalledWith("id", testResponseId);
      expect(updateQueryBuilder.update).toHaveBeenCalledWith({ completed_at: completedAt });
      expect(updateQueryBuilder.eq).toHaveBeenCalledWith("id", testResponseId);
    });

    it("should anonymize and update open_feedback", async () => {
      // Arrange
      const originalFeedback = "Call me at 555-1234 or email john@example.com";
      const anonymizedFeedback = "Call me at [PHONE] or email [EMAIL]";
      const command: UpdateSurveyResponseCommand = { open_feedback: originalFeedback };
      const mockUpdatedResponse: SurveyResponseDto = {
        ...mockExistingResponse,
        open_feedback: anonymizedFeedback,
        updated_at: "2025-01-02T00:00:00Z",
      };

      vi.mocked(AnonymizationService.checkAndAnonymize).mockResolvedValue({
        containsPersonalData: true,
        confidence: 0.95,
        originalText: originalFeedback,
        anonymizedText: anonymizedFeedback,
        detectedDataTypes: ["phone", "email"],
      });

      const fetchQueryBuilder = createMaybeSingleQueryBuilder({ data: mockExistingResponse, error: null });
      const updateQueryBuilder = createUpdateQueryBuilder({ data: mockUpdatedResponse, error: null });

      mockSupabase.from.mockReturnValueOnce(fetchQueryBuilder).mockReturnValueOnce(updateQueryBuilder);

      // Act
      const result = await updateSurveyResponse(toSupabaseClient(), command, testResponseId, testUserId);

      // Assert
      expect(AnonymizationService.checkAndAnonymize).toHaveBeenCalledWith(originalFeedback);
      expect(result.open_feedback).toBe(anonymizedFeedback);
      expect(fetchQueryBuilder.select).toHaveBeenCalledWith("*");
      expect(fetchQueryBuilder.eq).toHaveBeenCalledWith("id", testResponseId);
      expect(updateQueryBuilder.update).toHaveBeenCalledWith({ open_feedback: anonymizedFeedback });
      expect(updateQueryBuilder.eq).toHaveBeenCalledWith("id", testResponseId);
    });

    it("should store original text when no PII is detected", async () => {
      // Arrange
      const cleanFeedback = "This was a great event!";
      const command: UpdateSurveyResponseCommand = { open_feedback: cleanFeedback };
      const mockUpdatedResponse: SurveyResponseDto = {
        ...mockExistingResponse,
        open_feedback: cleanFeedback,
        updated_at: "2025-01-02T00:00:00Z",
      };

      vi.mocked(AnonymizationService.checkAndAnonymize).mockResolvedValue({
        containsPersonalData: false,
        confidence: 1,
        originalText: cleanFeedback,
        anonymizedText: null,
        detectedDataTypes: [],
      });

      const fetchQueryBuilder = createMaybeSingleQueryBuilder({ data: mockExistingResponse, error: null });
      const updateQueryBuilder = createUpdateQueryBuilder({ data: mockUpdatedResponse, error: null });

      mockSupabase.from.mockReturnValueOnce(fetchQueryBuilder).mockReturnValueOnce(updateQueryBuilder);

      // Act
      const result = await updateSurveyResponse(toSupabaseClient(), command, testResponseId, testUserId);

      // Assert
      expect(AnonymizationService.checkAndAnonymize).toHaveBeenCalledWith(cleanFeedback);
      expect(result.open_feedback).toBe(cleanFeedback);
      expect(fetchQueryBuilder.select).toHaveBeenCalledWith("*");
      expect(fetchQueryBuilder.eq).toHaveBeenCalledWith("id", testResponseId);
      expect(updateQueryBuilder.update).toHaveBeenCalledWith({ open_feedback: cleanFeedback });
      expect(updateQueryBuilder.eq).toHaveBeenCalledWith("id", testResponseId);
    });

    it("should allow clearing open_feedback with null", async () => {
      // Arrange
      const command: UpdateSurveyResponseCommand = { open_feedback: null };
      const mockUpdatedResponse: SurveyResponseDto = {
        ...mockExistingResponse,
        open_feedback: null,
        updated_at: "2025-01-02T00:00:00Z",
      };

      const fetchQueryBuilder = createMaybeSingleQueryBuilder({ data: mockExistingResponse, error: null });
      const updateQueryBuilder = createUpdateQueryBuilder({ data: mockUpdatedResponse, error: null });

      mockSupabase.from.mockReturnValueOnce(fetchQueryBuilder).mockReturnValueOnce(updateQueryBuilder);

      // Act
      const result = await updateSurveyResponse(toSupabaseClient(), command, testResponseId, testUserId);

      // Assert
      expect(AnonymizationService.checkAndAnonymize).not.toHaveBeenCalled();
      expect(result.open_feedback).toBeNull();
      expect(fetchQueryBuilder.select).toHaveBeenCalledWith("*");
      expect(fetchQueryBuilder.eq).toHaveBeenCalledWith("id", testResponseId);
      expect(updateQueryBuilder.update).toHaveBeenCalledWith({ open_feedback: null });
      expect(updateQueryBuilder.eq).toHaveBeenCalledWith("id", testResponseId);
    });

    it("should update multiple fields at once", async () => {
      // Arrange
      const completedAt = "2025-01-02T12:00:00Z";
      const command: UpdateSurveyResponseCommand = {
        overall_rating: 5,
        open_feedback: "Great event!",
        completed_at: completedAt,
      };
      const mockUpdatedResponse: SurveyResponseDto = {
        ...mockExistingResponse,
        overall_rating: 5,
        open_feedback: "Great event!",
        completed_at: completedAt,
        updated_at: "2025-01-02T00:00:00Z",
      };

      vi.mocked(AnonymizationService.checkAndAnonymize).mockResolvedValue({
        containsPersonalData: false,
        confidence: 1,
        originalText: "Great event!",
        anonymizedText: null,
        detectedDataTypes: [],
      });

      const fetchQueryBuilder = createMaybeSingleQueryBuilder({ data: mockExistingResponse, error: null });
      const updateQueryBuilder = createUpdateQueryBuilder({ data: mockUpdatedResponse, error: null });

      mockSupabase.from.mockReturnValueOnce(fetchQueryBuilder).mockReturnValueOnce(updateQueryBuilder);

      // Act
      const result = await updateSurveyResponse(toSupabaseClient(), command, testResponseId, testUserId);

      // Assert
      expect(result.overall_rating).toBe(5);
      expect(result.open_feedback).toBe("Great event!");
      expect(result.completed_at).toBe(completedAt);
      expect(fetchQueryBuilder.select).toHaveBeenCalledWith("*");
      expect(fetchQueryBuilder.eq).toHaveBeenCalledWith("id", testResponseId);
      expect(updateQueryBuilder.update).toHaveBeenCalledWith({
        overall_rating: 5,
        open_feedback: "Great event!",
        completed_at: completedAt,
      });
      expect(updateQueryBuilder.eq).toHaveBeenCalledWith("id", testResponseId);
    });

    it("should throw SurveyResponseNotFoundError when response does not exist", async () => {
      // Arrange
      const command: UpdateSurveyResponseCommand = { overall_rating: 5 };

      const fetchQueryBuilder = createMaybeSingleQueryBuilder({ data: null, error: null });

      mockSupabase.from.mockReturnValue(fetchQueryBuilder);

      // Act
      const error = await captureError(updateSurveyResponse(toSupabaseClient(), command, testResponseId, testUserId));

      // Assert
      expect(error).toBeInstanceOf(SurveyResponseNotFoundError);
      expect(error.message).toBe(`Survey response with id ${testResponseId} not found`);
      expect(fetchQueryBuilder.select).toHaveBeenCalledWith("*");
      expect(fetchQueryBuilder.eq).toHaveBeenCalledWith("id", testResponseId);
    });

    it("should throw SurveyResponseForbiddenError when user does not own the response", async () => {
      // Arrange
      const command: UpdateSurveyResponseCommand = { overall_rating: 5 };
      const otherUserResponse: SurveyResponseDto = {
        ...mockExistingResponse,
        user_id: "other-user-456",
      };

      const fetchQueryBuilder = createMaybeSingleQueryBuilder({ data: otherUserResponse, error: null });

      mockSupabase.from.mockReturnValue(fetchQueryBuilder);

      // Act
      const error = await captureError(updateSurveyResponse(toSupabaseClient(), command, testResponseId, testUserId));

      // Assert
      expect(error).toBeInstanceOf(SurveyResponseForbiddenError);
      expect(error.message).toBe("You can only update your own survey responses");
      expect(fetchQueryBuilder.select).toHaveBeenCalledWith("*");
      expect(fetchQueryBuilder.eq).toHaveBeenCalledWith("id", testResponseId);
    });

    it("should throw AnonymizationError when anonymization fails", async () => {
      // Arrange
      const command: UpdateSurveyResponseCommand = { open_feedback: "Some feedback with PII" };
      const anonymizationError = new AnonymizationError("API rate limit exceeded");

      vi.mocked(AnonymizationService.checkAndAnonymize).mockRejectedValue(anonymizationError);

      const fetchQueryBuilder = createMaybeSingleQueryBuilder({ data: mockExistingResponse, error: null });

      mockSupabase.from.mockReturnValue(fetchQueryBuilder);

      const logErrorSpy = vi.spyOn(log, "error").mockImplementation(() => undefined);

      // Act
      const error = await captureError(updateSurveyResponse(toSupabaseClient(), command, testResponseId, testUserId));

      // Assert
      expect(error).toBeInstanceOf(AnonymizationError);
      expect(error.message).toBe("Failed to anonymize feedback: API rate limit exceeded");
      expect(logErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining(`Anonymization error for survey response ${testResponseId}`),
        anonymizationError
      );
      expect(fetchQueryBuilder.select).toHaveBeenCalledWith("*");
      expect(fetchQueryBuilder.eq).toHaveBeenCalledWith("id", testResponseId);

      logErrorSpy.mockRestore();
    });

    it("should wrap unknown errors in AnonymizationError", async () => {
      // Arrange
      const command: UpdateSurveyResponseCommand = { open_feedback: "Some feedback" };
      const unknownError = new Error("Network failure");

      vi.mocked(AnonymizationService.checkAndAnonymize).mockRejectedValue(unknownError);

      const fetchQueryBuilder = createMaybeSingleQueryBuilder({ data: mockExistingResponse, error: null });

      mockSupabase.from.mockReturnValue(fetchQueryBuilder);

      const logErrorSpy = vi.spyOn(log, "error").mockImplementation(() => undefined);

      // Act
      const error = await captureError(updateSurveyResponse(toSupabaseClient(), command, testResponseId, testUserId));

      // Assert
      expect(error).toBeInstanceOf(AnonymizationError);
      expect(error.message).toBe("Failed to anonymize feedback: Network failure");
      expect(logErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining(`Unknown error during anonymization for survey response ${testResponseId}`),
        unknownError
      );
      expect(fetchQueryBuilder.select).toHaveBeenCalledWith("*");
      expect(fetchQueryBuilder.eq).toHaveBeenCalledWith("id", testResponseId);

      logErrorSpy.mockRestore();
    });

    it("should throw generic error when fetch fails", async () => {
      // Arrange
      const command: UpdateSurveyResponseCommand = { overall_rating: 5 };

      const fetchQueryBuilder = createMaybeSingleQueryBuilder({
        data: null,
        error: { message: "Database error" },
      });

      mockSupabase.from.mockReturnValue(fetchQueryBuilder);

      // Act
      const error = await captureError(updateSurveyResponse(toSupabaseClient(), command, testResponseId, testUserId));

      // Assert
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe("Failed to fetch survey response");
      expect(fetchQueryBuilder.select).toHaveBeenCalledWith("*");
      expect(fetchQueryBuilder.eq).toHaveBeenCalledWith("id", testResponseId);
    });

    it("should throw generic error when update fails", async () => {
      // Arrange
      const command: UpdateSurveyResponseCommand = { overall_rating: 5 };

      const fetchQueryBuilder = createMaybeSingleQueryBuilder({ data: mockExistingResponse, error: null });
      const updateQueryBuilder = createUpdateQueryBuilder({
        data: null,
        error: { message: "Update failed" },
      });

      mockSupabase.from.mockReturnValueOnce(fetchQueryBuilder).mockReturnValueOnce(updateQueryBuilder);

      // Act
      const error = await captureError(updateSurveyResponse(toSupabaseClient(), command, testResponseId, testUserId));

      // Assert
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe("Failed to update survey response");
      expect(fetchQueryBuilder.select).toHaveBeenCalledWith("*");
      expect(fetchQueryBuilder.eq).toHaveBeenCalledWith("id", testResponseId);
      expect(updateQueryBuilder.update).toHaveBeenCalledWith({ overall_rating: 5 });
      expect(updateQueryBuilder.eq).toHaveBeenCalledWith("id", testResponseId);
    });

    it("should throw error when no data is returned after successful update", async () => {
      // Arrange
      const command: UpdateSurveyResponseCommand = { overall_rating: 5 };

      const fetchQueryBuilder = createMaybeSingleQueryBuilder({ data: mockExistingResponse, error: null });
      const updateQueryBuilder = createUpdateQueryBuilder({ data: null, error: null });

      mockSupabase.from.mockReturnValueOnce(fetchQueryBuilder).mockReturnValueOnce(updateQueryBuilder);

      // Act
      const error = await captureError(updateSurveyResponse(toSupabaseClient(), command, testResponseId, testUserId));

      // Assert
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe("Failed to update survey response: no data returned");
      expect(fetchQueryBuilder.select).toHaveBeenCalledWith("*");
      expect(fetchQueryBuilder.eq).toHaveBeenCalledWith("id", testResponseId);
      expect(updateQueryBuilder.update).toHaveBeenCalledWith({ overall_rating: 5 });
      expect(updateQueryBuilder.eq).toHaveBeenCalledWith("id", testResponseId);
    });
  });
});
