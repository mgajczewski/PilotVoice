# Mock AI Service Configuration

## Purpose

This guide explains how to enable the mock AnonymizationService for testing without making real API calls to OpenRouter.

## Configuration

### 1. Environment Variable

Add the following variable to your `.env` file:

```bash
MOCK_AI_SERVICE=true
```

To use the real OpenRouter service, either:
- Set the variable to `false`
- Remove the variable entirely
- Comment it out with `#`

### 2. How It Works

A central provider module, `anonymizationServiceProvider.ts`, reads the `MOCK_AI_SERVICE` environment variable and exports the correct service implementation. The rest of the application, including the `/api/survey-responses/check-gdpr` endpoint and `surveyResponseService`, imports the service from this provider.

When `MOCK_AI_SERVICE=true`:
- The provider exports the `MockAnonymizationService`.
- No real API calls are made to OpenRouter.
- No API costs are incurred.
- Random responses are returned for testing purposes.

When `MOCK_AI_SERVICE` is not set or is `false`:
- The real `AnonymizationService` is used
- Actual API calls are made to OpenRouter
- API costs apply

### 3. Mock Responses

The mock service returns random responses from a predefined set:
- **>50%** of responses indicate no personal data detected
- **<50%** of responses indicate personal data detected with:
  - Anonymized text
  - Detected data types (e.g., `full_name`, `email`, `phone`)
  - Confidence scores > 0.5

### 4. Testing Scenarios

With the mock enabled, you can test:
- **No GDPR warning**: When mock returns `containsPersonalData: false`
- **GDPR warning displayed**: When mock returns `containsPersonalData: true`
- **Different data types**: Various `detectedDataTypes` combinations
- **Different confidence levels**: Various confidence scores

### 5. Development Workflow

**During UI Development:**
```bash
# In .env
MOCK_AI_SERVICE=true
```

**For Production or Real Testing:**
```bash
# In .env
MOCK_AI_SERVICE=false
# or simply remove the line
```

### 6. Debugging

The service provider logs which implementation is being used upon application startup. Check the server console logs to confirm which service is active:

```
[AnonymizationServiceProvider] Using MOCK AnonymizationService
```
or
```
[AnonymizationServiceProvider] Using REAL AnonymizationService
```

## Files Involved

- `src/lib/services/anonymizationServiceProvider.ts` - Provider that selects the correct service
- `src/lib/services/mock/mockAnonymizationService.ts` - Mock implementation
- `src/lib/services/anonymizationService.ts` - Real implementation
- `src/lib/services/surveyResponseService.ts` - Service that consumes the anonymization service
- `src/pages/api/survey-responses/check-gdpr.ts` - API endpoint that consumes the anonymization service
- `src/env.d.ts` - TypeScript type definitions for environment variables

## Example .env Configuration

```bash
# Supabase Configuration
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key

# OpenRouter Configuration
OPENROUTER_API_KEY=your_openrouter_api_key
OPENROUTER_MODEL=anthropic/claude-3.5-sonnet

# reCAPTCHA Configuration
RECAPTCHA_SITE_KEY=your_recaptcha_site_key
RECAPTCHA_SECRET_KEY=your_recaptcha_secret_key

# Mock AI Service (set to true for testing without API costs)
MOCK_AI_SERVICE=true
```

## Notes

- The `PUBLIC_` prefix makes this variable available on both client and server
- The mock service simulates network delay (300-700ms) for realistic testing
- Mock responses include hints of the original text for debugging purposes

