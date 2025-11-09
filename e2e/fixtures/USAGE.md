# Survey Fixtures Usage Guide

## Overview

System fixtures zapewnia:
- **Izolację testów** - każdy test tworzy własne dane
- **Automatyczny cleanup** - dane są usuwane nawet gdy test failuje
- **Łatwość użycia** - proste funkcje pomocnicze
- **Czytelność** - cały kontekst testu w jednym miejscu

## Podstawowe użycie

### 1. Import fixtures w teście

```typescript
import { test, expect } from "../fixtures";
import {
  createEmptySurvey,
  createSurveyWithResponse,
  getUserIdByEmail,
} from "../fixtures/survey-fixtures";
```

### 2. Użyj fixtures w teście

```typescript
test("my test", async ({ supabase, cleanup }) => {
  // Tworzenie danych
  const surveyData = await createEmptySurvey(supabase);
  
  // WAŻNE: Zawsze trackuj utworzone dane dla cleanup
  cleanup.track(surveyData);
  
  // Twój test...
  
  // Cleanup automatycznie uruchomi się po zakończeniu testu
});
```

## Dostępne funkcje pomocnicze

### `createEmptySurvey()`

Tworzy pustą ankietę bez odpowiedzi.

```typescript
const surveyData = await createEmptySurvey(
  supabase,
  competitionId, // opcjonalne - utworzy nową competition jeśli nie podano
  suffix // opcjonalne - unikalny suffix dla slug
);
cleanup.track(surveyData);
```

**Zwraca:**
```typescript
{
  competitionId: number;
  surveyId: number;
  surveySlug: string;
}
```

### `createSurveyWithResponse()`

Tworzy ankietę z istniejącą odpowiedzią dla konkretnego użytkownika.

```typescript
const userId = await getUserIdByEmail(supabase, "user@example.com");
const surveyData = await createSurveyWithResponse(
  supabase,
  userId,
  competitionId, // opcjonalne
  suffix // opcjonalne
);
cleanup.track(surveyData);
```

**Zwraca:**
```typescript
{
  competitionId: number;
  surveyId: number;
  surveySlug: string;
  responseId: number;
}
```

### `getUserIdByEmail()`

Pobiera ID użytkownika na podstawie email.

```typescript
const userId = await getUserIdByEmail(supabase, "user@example.com");
```

### `createTestCompetition()`

Tworzy testową competition (zwykle nie musisz tego używać bezpośrednio).

```typescript
const competitionId = await createTestCompetition(supabase, suffix);
```

## Przykłady użycia

### Przykład 1: Test z pustą ankietą

```typescript
test("should handle empty survey", async ({ page, surveyPage, supabase, cleanup }) => {
  // Tworzenie pustej ankiety
  const surveyData = await createEmptySurvey(supabase, undefined, `test-${Date.now()}`);
  cleanup.track(surveyData);
  
  // Test
  await surveyPage.goto(surveyData.surveySlug);
  await surveyPage.waitForDataLoaded();
  
  const buttonText = await surveyPage.getStartButtonText();
  expect(buttonText).toBe("Sign In to Start");
  
  // Cleanup automatycznie usunie survey i competition
});
```

### Przykład 2: Test z istniejącą odpowiedzią

```typescript
test("should show continue button for existing response", async ({ 
  page, 
  surveyPage, 
  loginPage,
  supabase, 
  cleanup 
}) => {
  const email = process.env.E2E_USER_EMAIL!;
  const userId = await getUserIdByEmail(supabase, email);
  
  // Tworzenie ankiety z odpowiedzią
  const surveyData = await createSurveyWithResponse(
    supabase,
    userId,
    undefined,
    `with-response-${Date.now()}`
  );
  cleanup.track(surveyData);
  
  // Login i test
  await loginPage.goto();
  await loginPage.login(email, process.env.E2E_USER_PASSWORD!);
  await page.waitForURL("/");
  
  await surveyPage.goto(surveyData.surveySlug);
  await surveyPage.waitForDataLoaded();
  
  const buttonText = await surveyPage.getStartButtonText();
  expect(buttonText).toBe("Continue Survey");
  
  // Cleanup automatycznie usunie response, survey i competition
});
```

### Przykład 3: Wiele ankiet w jednym teście

```typescript
test("should handle multiple surveys", async ({ supabase, cleanup }) => {
  // Tworzenie wspólnej competition dla obu ankiet
  const competitionId = await createTestCompetition(supabase, `multi-${Date.now()}`);
  
  // Pierwsza ankieta - pusta
  const survey1 = await createEmptySurvey(supabase, competitionId, "survey-1");
  cleanup.track(survey1);
  
  // Druga ankieta - z odpowiedzią
  const userId = await getUserIdByEmail(supabase, process.env.E2E_USER_EMAIL!);
  const survey2 = await createSurveyWithResponse(supabase, userId, competitionId, "survey-2");
  cleanup.track(survey2);
  
  // Testy...
  
  // Cleanup automatycznie usunie obie ankiety, odpowiedzi i competition
});
```

## Mechanizm Cleanup

### Jak działa?

1. **Utworzenie tracker**: `cleanup` fixture jest automatycznie dostępny w każdym teście
2. **Tracking**: Wywołujesz `cleanup.track(data)` dla każdych utworzonych danych
3. **Automatyczny cleanup**: Po zakończeniu testu (nawet jeśli failuje) cleanup automatycznie:
   - Usuwa responses
   - Usuwa surveys
   - Usuwa competitions
   - W odpowiedniej kolejności (uwzględniając foreign keys)

### Dlaczego to działa nawet gdy test failuje?

Playwright's fixtures używają try-finally pattern:

```typescript
cleanup: async ({ supabase }, use) => {
  const cleanup = new FixtureCleanup();
  await use(cleanup);  // Test wykonuje się tutaj
  // Cleanup ZAWSZE się wykona, nawet gdy test failuje
  await cleanup.cleanup(supabase);
}
```

### Co jeśli cleanup failuje?

- Błędy są logowane do konsoli
- Proces kontynuuje (nie throwuje)
- To pozwala na częściowy cleanup gdy to możliwe

## Best Practices

### ✅ DO:

1. **Zawsze trackuj utworzone dane:**
   ```typescript
   const data = await createEmptySurvey(supabase);
   cleanup.track(data);
   ```

2. **Używaj unikalnych suffixów:**
   ```typescript
   const suffix = `test-${Date.now()}`;
   const data = await createEmptySurvey(supabase, undefined, suffix);
   ```

3. **Twórz dane na początku testu:**
   ```typescript
   test("my test", async ({ supabase, cleanup }) => {
     const data = await createEmptySurvey(supabase);
     cleanup.track(data);
     
     // Reszta testu...
   });
   ```

### ❌ DON'T:

1. **Nie używaj globalnego state:**
   ```typescript
   // ZŁE - testy nie są izolowane
   const surveySlugs = getSurveySlugs();
   ```

2. **Nie twórz danych ręcznie bez trackingu:**
   ```typescript
   // ZŁE - dane nie będą usunięte
   await supabase.from("surveys").insert(...);
   ```

3. **Nie używaj tych samych danych w wielu testach:**
   ```typescript
   // ZŁE - testy są zależne od siebie
   test.describe.configure({ mode: 'serial' });
   ```

## Migracja ze starego podejścia

### Stare podejście (global.setup.ts):

```typescript
const surveySlugs = getSurveySlugs();
const testSurveySlug = surveySlugs[0];
```

### Nowe podejście (fixtures):

```typescript
test("my test", async ({ supabase, cleanup }) => {
  const surveyData = await createEmptySurvey(supabase);
  cleanup.track(surveyData);
  
  await surveyPage.goto(surveyData.surveySlug);
  // ...
});
```

## Debugging

### Sprawdzenie co zostało utworzone:

```typescript
test("debug test", async ({ supabase, cleanup }) => {
  const data = await createEmptySurvey(supabase);
  console.log("Created survey:", data);
  cleanup.track(data);
  
  // Test...
});
```

### Sprawdzenie czy cleanup zadziałał:

Cleanup loguje błędy do konsoli. Sprawdź output testów:

```
Cleanup errors occurred: [
  "Failed to delete surveys: ..."
]
```

### Manualny cleanup:

```typescript
test("manual cleanup test", async ({ supabase }) => {
  const cleanup = new FixtureCleanup();
  
  try {
    const data = await createEmptySurvey(supabase);
    cleanup.track(data);
    
    // Test...
  } finally {
    await cleanup.cleanup(supabase);
  }
});
```

