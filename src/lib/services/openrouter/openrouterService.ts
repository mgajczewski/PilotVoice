import type {
  OpenRouterConfig,
  CompletionParams,
  OpenRouterRequestBody,
  OpenRouterResponse,
  JSONSchema,
} from "./types";
import { OpenRouterError, ApiError, ValidationError } from "./errors";

/**
 * Service for interacting with OpenRouter API
 * Provides structured completion capabilities using various LLMs
 * @server-only This service must only be used on the server-side
 */
export class OpenRouterService {
  private readonly apiKey: string;
  private readonly siteUrl: string;
  private readonly appName: string;
  private readonly apiEndpoint = "https://openrouter.ai/api/v1/chat/completions";

  constructor(config: OpenRouterConfig = {}) {
    this.apiKey = config.apiKey || import.meta.env.OPENROUTER_API_KEY || "";
    this.siteUrl = config.siteUrl || import.meta.env.SITE_URL || "http://localhost:3000";
    this.appName = config.appName || import.meta.env.APP_NAME || "PilotVoice";

    if (!this.apiKey) {
      console.error("OpenRouterService: OPENROUTER_API_KEY is not configured.");
      throw new Error("OpenRouter API key is missing. The service cannot be initialized.");
    }
  }

  /**
   * Get structured completion from OpenRouter API
   * @param params - Completion parameters including prompts and response schema
   * @returns Strongly-typed object matching the provided JSON schema
   */
  public async getStructuredCompletion<T>(params: CompletionParams): Promise<T> {
    // 1. Build request body
    const requestBody = this.buildRequestBody(params);

    // 2. Make the API call
    const response = await this.makeApiCall(requestBody);

    // 3. Parse and validate the response
    const content = this.parseAndValidateResponse<T>(response, params.responseSchema);

    return content;
  }

  /**
   * Build the request body for OpenRouter API
   * @private
   */
  private buildRequestBody(params: CompletionParams): OpenRouterRequestBody {
    const requestBody: OpenRouterRequestBody = {
      model: params.model,
      messages: [
        {
          role: "system",
          content: params.systemPrompt,
        },
        {
          role: "user",
          content: params.userPrompt,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: params.responseSchema.name,
          strict: true,
          schema: params.responseSchema.schema,
        },
      },
    };

    // Add optional parameters if provided
    if (params.temperature !== undefined) {
      requestBody.temperature = params.temperature;
    }

    if (params.maxTokens !== undefined) {
      requestBody.max_tokens = params.maxTokens;
    }

    return requestBody;
  }

  /**
   * Make API call to OpenRouter
   * @private
   */
  private async makeApiCall(body: OpenRouterRequestBody): Promise<OpenRouterResponse> {
    try {
      const response = await fetch(this.apiEndpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": this.siteUrl,
          "X-Title": this.appName,
        },
        body: JSON.stringify(body),
      });

      // Handle non-2xx responses
      if (!response.ok) {
        let errorDetails;
        try {
          errorDetails = await response.json();
        } catch {
          errorDetails = { message: await response.text() };
        }

        const errorMessage = this.getErrorMessage(response.status, errorDetails);
        throw new ApiError(errorMessage, response.status, errorDetails);
      }

      const data = await response.json();
      return data as OpenRouterResponse;
    } catch (error) {
      // Re-throw ApiError as is
      if (error instanceof ApiError) {
        throw error;
      }

      // Handle network failures
      console.error("OpenRouterService: Network request failed", error);
      throw new OpenRouterError("Network request failed. Please check your connection.");
    }
  }

  /**
   * Parse and validate the API response
   * @private
   */
  private parseAndValidateResponse<T>(response: OpenRouterResponse, schema: { name: string; schema: JSONSchema }): T {
    // Extract content from response
    if (!response.choices || response.choices.length === 0) {
      throw new ValidationError("API response contains no choices");
    }

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new ValidationError("API response contains no content");
    }

    // Parse JSON
    let parsed: any;
    try {
      parsed = JSON.parse(content);
    } catch (error) {
      console.error("OpenRouterService: Failed to parse response as JSON", error);
      throw new ValidationError("Failed to parse API response as JSON", {
        content,
        error: error instanceof Error ? error.message : String(error),
      });
    }

    // Basic validation - check if parsed is an object
    if (typeof parsed !== "object" || parsed === null) {
      throw new ValidationError("Parsed response is not a valid object", { parsed });
    }

    // Note: For more robust validation, consider using Zod schemas
    // For now, we trust the LLM to return data matching the schema
    return parsed as T;
  }

  /**
   * Get user-friendly error message based on status code
   * @private
   */
  private getErrorMessage(status: number, details?: any): string {
    switch (status) {
      case 401:
        return "Invalid API Key. Please check your OpenRouter API key configuration.";
      case 429:
        return "Rate limit exceeded. Please try again later.";
      case 500:
      case 502:
      case 503:
        return "OpenRouter service is temporarily unavailable. Please try again later.";
      default:
        return `API request failed with status ${status}${details?.error?.message ? `: ${details.error.message}` : ""}`;
    }
  }
}
