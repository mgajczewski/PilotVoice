# OpenRouter Service Implementation Plan

This document outlines the design and implementation plan for an `OpenRouterService` within the PilotVoice application. The service will act as a dedicated interface for communicating with the OpenRouter API to leverage various Large Language Models (LLMs).

## 1. Service Description

The `OpenRouterService` will encapsulate all logic related to interacting with the OpenRouter API. Its primary responsibility is to provide a simple, robust, and secure method for other parts of the application to send requests to LLMs and receive structured, validated responses. It will handle configuration, request building, API communication, response parsing, and error handling.

This service will be designed to run exclusively on the server-side (e.g., within Astro API endpoints) to protect the OpenRouter API key and manage requests securely.

## 2. Constructor Description

The service class will be initialized with an optional configuration object. This allows for flexibility in testing and configuration.

```typescript
// src/lib/openrouter/types.ts
export interface OpenRouterConfig {
  apiKey?: string;
  siteUrl?: string;
  appName?: string;
}

// src/lib/openrouter/service.ts
import type { OpenRouterConfig } from './types';

export class OpenRouterService {
  private readonly apiKey: string;
  private readonly siteUrl: string;
  private readonly appName: string;

  constructor(config: OpenRouterConfig = {}) {
    this.apiKey = config.apiKey || process.env.OPENROUTER_API_KEY;
    this.siteUrl = config.siteUrl || process.env.SITE_URL || 'http://localhost:3000';
    this.appName = config.appName || process.env.APP_NAME || 'PilotVoice';

    if (!this.apiKey) {
      // Log error to server console
      console.error('OpenRouterService: OPENROUTER_API_KEY is not configured.');
      throw new Error('OpenRouter API key is missing. The service cannot be initialized.');
    }
  }

  // ... methods
}
```

- **`config`**: An optional object containing `apiKey`, `siteUrl`, and `appName`.
- The constructor will prioritize values from the `config` object, falling back to environment variables (`process.env`). This is useful for dependency injection and mocking during tests.
- It performs a critical check for the `OPENROUTER_API_KEY` upon instantiation and throws an error if it's missing, ensuring the service fails fast in case of misconfiguration.

## 3. Public Methods and Fields

The service will expose a single primary public method for completions.

### `public async getStructuredCompletion<T>(params: CompletionParams): Promise<T>`

This is the main method for interacting with the API when a structured JSON response is expected. It will orchestrate the entire process of building the request, sending it, and parsing the structured response.

- **`params`**: An object containing all necessary information for the API call.
- **`returns`**: A promise that resolves to a strongly-typed object (`T`) matching the provided JSON schema.

```typescript
// src/lib/openrouter/types.ts
import type { JSONSchema } from 'json-schema-to-ts';

export interface CompletionParams {
  model: string;
  systemPrompt: string;
  userPrompt: string;
  responseSchema: {
    name: string;
    schema: JSONSchema;
  };
  temperature?: number;
  maxTokens?: number;
}

// src/lib/openrouter/service.ts
// Inside OpenRouterService class
public async getStructuredCompletion<T>(params: CompletionParams): Promise<T> {
  // 1. Build request body using a private method
  const requestBody = this.buildRequestBody(params);

  // 2. Make the API call using a private method
  const response = await this.makeApiCall(requestBody);

  // 3. Parse and validate the response using a private method
  const content = this.parseAndValidateResponse<T>(response, params.responseSchema);

  return content;
}
```

## 4. Private Methods and Fields

Internal logic will be encapsulated in private methods to keep the public interface clean and adhere to the single responsibility principle.

### `private buildRequestBody(params: CompletionParams): object`

- **Purpose**: Constructs the full JSON payload for the OpenRouter API.
- **Functionality**:
    1.  Assembles the `messages` array from `systemPrompt` and `userPrompt`.
    2.  Creates the `response_format` object using the provided schema name and schema definition, ensuring it matches the required structure: `{ type: 'json_schema', json_schema: { name: [schema-name], strict: true, schema: [schema-obj] } }`.
    3.  Combines the model name, messages, `response_format`, and any other model parameters (`temperature`, `max_tokens`) into a single object.

### `private async makeApiCall(body: object): Promise<Response>`

- **Purpose**: Handles the `fetch` request to the OpenRouter API.
- **Functionality**:
    1.  Sends a POST request to `https://openrouter.ai/api/v1/chat/completions`.
    2.  Sets the required headers:
        - `Authorization: Bearer ${this.apiKey}`
        - `Content-Type: application/json`
        - `HTTP-Referer: ${this.siteUrl}` (Recommended by OpenRouter)
        - `X-Title: ${this.appName}` (Recommended by OpenRouter)
    3.  Implements robust error handling for network failures and non-2xx HTTP status codes.

### `private parseAndValidateResponse<T>(response: any, schema: any): T`

- **Purpose**: Extracts, parses, and validates the content from the API response.
- **Functionality**:
    1.  Retrieves the content string from `response.choices[0].message.content`.
    2.  Uses a `try-catch` block to parse the content string into a JavaScript object (`JSON.parse`).
    3.  (Recommended) Uses a validation library like `zod` to validate the parsed object against the provided schema to ensure type safety. Throws a `ValidationError` if parsing or validation fails.

## 5. Error Handling

A set of custom error classes should be defined to handle specific failure modes, allowing the calling code to react appropriately.

```typescript
// src/lib/openrouter/errors.ts
export class OpenRouterError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'OpenRouterError';
  }
}

export class ApiError extends OpenRouterError {
  constructor(message: string, public status: number, public details?: any) {
    super(message);
    this.name = 'ApiError';
  }
}

export class ValidationError extends OpenRouterError {
  constructor(message: string, public validationErrors?: any) {
    super(message);
    this.name = 'ValidationError';
  }
}
```

**Error Scenarios and Responses**:
1.  **Missing API Key**: The constructor throws a standard `Error` on initialization.
2.  **Network Failure**: `makeApiCall` catches the error from `fetch` and throws a generic `OpenRouterError('Network request failed')`.
3.  **API Errors (4xx/5xx)**: `makeApiCall` checks `response.ok`. If false, it reads the error details from the response body and throws a specific `ApiError` with the status code and details.
    - `401 Unauthorized`: Invalid API Key.
    - `429 Too Many Requests`: Rate limit exceeded.
    - `500 Internal Server Error`: Issue on OpenRouter's end.
4.  **Response Parsing Error**: `parseAndValidateResponse` throws a `ValidationError` if the model's output is not valid JSON.
5.  **Schema Validation Error**: `parseAndValidateResponse` throws a `ValidationError` if the parsed JSON does not conform to the expected schema.

## 6. Security Considerations

1.  **API Key Management**: The `OPENROUTER_API_KEY` must be stored securely as an environment variable. It should never be hardcoded in the source code or exposed to the client-side. The `.env` file must be included in `.gitignore`.
2.  **Server-Side Execution**: The entire service must only be run on the server. Do not import or use this service in any client-side React or Astro components. It should be used exclusively within API routes (`src/pages/api/**`) or server-side rendering logic.
3.  **Input Sanitization**: While the service itself doesn't directly deal with user input from the browser, the data passed as `userPrompt` should be sanitized by the calling API endpoint to prevent prompt injection attacks.
4.  **Resource Limiting**: Use the `max_tokens` parameter to prevent unexpectedly long and expensive API calls. Implement reasonable defaults.

## 7. Step-by-step Implementation Plan

**Step 1: Directory and File Setup**

1.  Create a new directory: `src/lib/openrouter`.
2.  Inside this directory, create the following files:
    - `service.ts`: The main service class.
    - `types.ts`: TypeScript interfaces (`OpenRouterConfig`, `CompletionParams`).
    - `errors.ts`: Custom error classes.
    - `index.ts`: To export the service and types (`export * from './service';`, etc.).

**Step 2: Environment Variable Configuration**

1.  Add `OPENROUTER_API_KEY`, `SITE_URL`, and `APP_NAME` to your `.env` file for local development.
2.  Add `OPENROUTER_API_KEY` to your `.env.example` file without the value.
3.  Ensure `.env` is listed in your `.gitignore` file.
4.  Configure these variables in your Vercel project settings for production and preview deployments.

**Step 3: Implement Types and Errors**

1.  In `src/lib/openrouter/types.ts`, define the `OpenRouterConfig` and `CompletionParams` interfaces. Use a library like `json-schema-to-ts` for strong typing of the `schema` property.
2.  In `src/lib/openrouter/errors.ts`, implement the custom error classes (`OpenRouterError`, `ApiError`, `ValidationError`).

**Step 4: Implement the Service Constructor**

1.  In `src/lib/openrouter/service.ts`, create the `OpenRouterService` class.
2.  Implement the constructor as described in Section 2, including the environment variable loading and the API key check.

**Step 5: Implement Private Methods**

1.  Implement the `buildRequestBody` method. Pay close attention to the structure of the `response_format` object.
2.  Implement the `makeApiCall` method using `fetch`, setting all required headers and handling HTTP error statuses.
3.  Implement the `parseAndValidateResponse` method. Include `JSON.parse` in a `try-catch` block. For enhanced type safety, consider adding a validation library like `zod` to validate the object against a zod schema created from the JSON schema.

**Step 6: Implement the Public Method**

1.  Implement the `getStructuredCompletion` public method. It should call the private methods in the correct order: `buildRequestBody`, `makeApiCall`, and `parseAndValidateResponse`.

**Step 7: Create an Example API Endpoint**

1.  Create a new Astro API endpoint, e.g., `src/pages/api/analyze-feedback.ts`.
2.  In this file, import and instantiate the `OpenRouterService`.
3.  Define a JSON schema for the expected response.
4.  Call the `getStructuredCompletion` method with a test prompt and the schema.
5.  Handle potential errors using a `try-catch` block, returning appropriate HTTP status codes (e.g., 500 for server errors, 400 for validation errors).

**Example API Endpoint (`src/pages/api/analyze-feedback.ts`)**
```typescript
import type { APIRoute } from 'astro';
import { OpenRouterService } from '@/lib/openrouter';
import { ApiError, ValidationError } from '@/lib/openrouter/errors';
import type { JSONSchema } from 'json-schema-to-ts';

const feedbackAnalysisSchema = {
  type: 'object',
  properties: {
    sentiment: { type: 'string', enum: ['positive', 'negative', 'neutral', 'mixed'] },
    key_topics: { type: 'array', items: { type: 'string' } },
    summary: { type: 'string' }
  },
  required: ['sentiment', 'key_topics', 'summary']
} as const;

// This gives us a TypeScript type for the response
type FeedbackAnalysis = FromSchema<typeof feedbackAnalysisSchema>;

export const POST: APIRoute = async ({ request }) => {
  const { feedback } = await request.json();

  if (!feedback) {
    return new Response(JSON.stringify({ error: 'Feedback text is required.' }), { status: 400 });
  }

  const openrouter = new OpenRouterService();

  try {
    const analysis = await openrouter.getStructuredCompletion<FeedbackAnalysis>({
      model: 'openai/gpt-4o', // Or another preferred model
      systemPrompt: 'You are an AI that analyzes pilot feedback from paragliding competitions. Extract sentiment, key topics, and provide a short, objective summary.',
      userPrompt: `Analyze the following feedback: "${feedback}"`,
      responseSchema: {
        name: 'feedback_analysis',
        schema: feedbackAnalysisSchema
      },
      temperature: 0.2
    });

    return new Response(JSON.stringify(analysis), { status: 200 });

  } catch (error) {
    console.error(error);

    if (error instanceof ValidationError) {
      return new Response(JSON.stringify({ error: 'Failed to validate AI response.', details: error.message }), { status: 500 });
    }
    if (error instanceof ApiError) {
      return new Response(JSON.stringify({ error: 'Failed to communicate with AI service.', details: error.message }), { status: error.status || 502 });
    }

    return new Response(JSON.stringify({ error: 'An unexpected error occurred.' }), { status: 500 });
  }
};
```
