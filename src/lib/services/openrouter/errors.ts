/**
 * Base error class for OpenRouter service errors
 */
export class OpenRouterError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OpenRouterError";
  }
}

/**
 * Error thrown when API request fails with non-2xx status code
 */
export class ApiError extends OpenRouterError {
  constructor(
    message: string,
    public status: number,
    public details?: any
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * Error thrown when response parsing or validation fails
 */
export class ValidationError extends OpenRouterError {
  constructor(
    message: string,
    public validationErrors?: any
  ) {
    super(message);
    this.name = "ValidationError";
  }
}
