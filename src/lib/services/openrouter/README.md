# OpenRouter Service

Service for interacting with the OpenRouter API to leverage various Large Language Models (LLMs).

## Features

- ✅ Type-safe structured completions using JSON schemas
- ✅ Comprehensive error handling with custom error types
- ✅ Server-side only execution for API key security
- ✅ Support for various OpenRouter models
- ✅ Configurable temperature and token limits

## Usage

### Basic Example

```typescript
import { OpenRouterService } from '@/lib/services/openrouter';
import type { JSONSchema } from '@/lib/services/openrouter';

// Define response schema
const analysisSchema = {
  type: 'object',
  properties: {
    sentiment: { type: 'string', enum: ['positive', 'negative', 'neutral'] },
    summary: { type: 'string' }
  },
  required: ['sentiment', 'summary']
} as const satisfies JSONSchema;

type Analysis = {
  sentiment: 'positive' | 'negative' | 'neutral';
  summary: string;
};

// Use the service
const service = new OpenRouterService();

const result = await service.getStructuredCompletion<Analysis>({
  model: 'openai/gpt-4o',
  systemPrompt: 'You are a feedback analyzer.',
  userPrompt: 'Analyze this feedback: "Great event!"',
  responseSchema: {
    name: 'feedback_analysis',
    schema: analysisSchema
  },
  temperature: 0.2,
  maxTokens: 500
});

console.log(result.sentiment); // Type-safe access
```

## Configuration

Required environment variables:

```env
OPENROUTER_API_KEY=your_api_key_here
SITE_URL=https://yoursite.com  # Optional, defaults to localhost
APP_NAME=PilotVoice             # Optional
```

## Error Handling

The service provides three custom error types:

- `OpenRouterError` - Base error class
- `ApiError` - API request failures (includes status code)
- `ValidationError` - Response parsing/validation failures

Example:

```typescript
try {
  const result = await service.getStructuredCompletion({...});
} catch (error) {
  if (error instanceof ApiError) {
    console.error(`API Error (${error.status}):`, error.message);
  } else if (error instanceof ValidationError) {
    console.error('Validation Error:', error.validationErrors);
  }
}
```

## Security

⚠️ **Important**: This service must ONLY be used server-side:
- In Astro API routes (`src/pages/api/**`)
- In server-side rendering logic
- Never import in client-side components

## Available Models

Popular models you can use:
- `openai/gpt-4o` - Latest GPT-4 Optimized
- `openai/gpt-4o-mini` - Faster, cheaper GPT-4
- `anthropic/claude-3.5-sonnet` - Claude 3.5 Sonnet
- `google/gemini-pro-1.5` - Google Gemini Pro

See [OpenRouter Models](https://openrouter.ai/models) for the full list.

