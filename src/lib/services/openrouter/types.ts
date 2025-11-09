/**
 * Configuration options for OpenRouter service
 */
export interface OpenRouterConfig {
  apiKey?: string;
  siteUrl?: string;
  appName?: string;
}

/**
 * JSON Schema type definition
 * Based on JSON Schema Draft 7
 */
export interface JSONSchema {
  type?: "object" | "array" | "string" | "number" | "boolean" | "null";
  properties?: Record<string, JSONSchema>;
  items?: JSONSchema;
  required?: string[];
  enum?: unknown[];
  additionalProperties?: boolean | JSONSchema;
  description?: string;
  [key: string]: unknown;
}

/**
 * Parameters for structured completion request
 */
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

/**
 * OpenRouter API request body structure
 */
export interface OpenRouterRequestBody {
  model: string;
  messages: {
    role: "system" | "user" | "assistant";
    content: string;
  }[];
  response_format: {
    type: "json_schema";
    json_schema: {
      name: string;
      strict: boolean;
      schema: JSONSchema;
    };
  };
  temperature?: number;
  max_tokens?: number;
}

/**
 * OpenRouter API response structure
 */
export interface OpenRouterResponse {
  id: string;
  model: string;
  choices: {
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }[];
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}
