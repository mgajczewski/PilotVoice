# API Endpoint Implementation Plan: PATCH /api/survey-responses/{responseId}

## 1. Przegląd punktu końcowego

Endpoint służy do aktualizacji (zapisywania postępu) konkretnej odpowiedzi na ankietę. Użytkownik może zapisać częściowe wypełnienie ankiety, aby później do niej wrócić, lub oznaczyć ankietę jako ukończoną. Kluczową funkcjonalnością jest automatyczna anonimizacja pola `open_feedback` przez serwer przed zapisem do bazy danych, co zapewnia zgodność z GDPR.

**Cel biznesowy**: Umożliwienie użytkownikom zapisywania postępu w wypełnianiu ankiety oraz finalizacji odpowiedzi z zachowaniem prywatności danych.

## 2. Szczegóły żądania

- **Metoda HTTP**: PATCH
- **Struktura URL**: `/api/survey-responses/{responseId}`
- **Parametry**:
  - **Wymagane** (path params):
    - `responseId` (bigint): Unikalny identyfikator odpowiedzi na ankietę
  - **Opcjonalne** (request body - wszystkie pola są opcjonalne):
    - `overall_rating` (integer | null): Ogólna ocena w skali 1-10
    - `open_feedback` (string | null): Otwarta opinia użytkownika (zostanie zanonimizowana)
    - `completed_at` (timestamptz | null): Timestamp oznaczający finalizację odpowiedzi
- **Request Body** (JSON):

```json
{
  "overall_rating": 8,
  "open_feedback": "Bardzo dobra organizacja, ale parking był zbyt daleko...",
  "completed_at": "2025-11-02T14:30:00Z"
}
```

- **Headers**:
  - `Content-Type: application/json`
  - Ciasteczko sesji Supabase (automatyczne)

## 3. Wykorzystywane typy

### DTOs (Data Transfer Objects)

```typescript
// z src/types.ts
export type SurveyResponseDto = Tables<"survey_responses">;
// Struktura:
// {
//   id: bigint;
//   survey_id: integer;
//   user_id: uuid;
//   overall_rating: integer | null;
//   open_feedback: string | null;
//   completed_at: timestamptz | null;
//   created_at: timestamptz;
//   updated_at: timestamptz;
// }
```

### Command Models

```typescript
// z src/types.ts
export type UpdateSurveyResponseCommand = Pick<
  TablesUpdate<"survey_responses">,
  "overall_rating" | "open_feedback" | "completed_at"
>;
```

### Zod Schemas (do utworzenia/rozszerzenia)

```typescript
// w src/lib/schemas/surveyResponseSchemas.ts
export const updateSurveyResponseSchema = z.object({
  overall_rating: z.number().int().min(1).max(10).nullable().optional(),
  open_feedback: z.string().max(10000).nullable().optional(),
  completed_at: z.string().datetime().nullable().optional(),
});

export const responseIdParamSchema = z.object({
  responseId: z.string().transform((val) => {
    const parsed = parseInt(val, 10);
    if (isNaN(parsed) || parsed <= 0) {
      throw new Error("Invalid responseId");
    }
    return parsed;
  }),
});
```

### Custom Errors (do dodania w serwisie)

```typescript
export class SurveyResponseNotFoundError extends Error {
  constructor(responseId: number) {
    super(`Survey response with id ${responseId} not found`);
    this.name = "SurveyResponseNotFoundError";
  }
}

export class AnonymizationError extends Error {
  constructor(message: string) {
    super(`Failed to anonymize feedback: ${message}`);
    this.name = "AnonymizationError";
  }
}
```

## 4. Szczegóły odpowiedzi

### Sukces (200 OK)

```json
{
  "id": 123,
  "survey_id": 5,
  "user_id": "abc-123-def",
  "overall_rating": 8,
  "open_feedback": "Bardzo dobra organizacja. Parking był oddalony od miejsca startu.",
  "completed_at": "2025-11-02T14:30:00Z",
  "created_at": "2025-11-01T10:00:00Z",
  "updated_at": "2025-11-02T14:30:15Z"
}
```

### Błędy

**400 Bad Request** - Nieprawidłowe dane wejściowe:

```json
{
  "error": "Invalid input",
  "details": "overall_rating must be between 1 and 10"
}
```

**401 Unauthorized** - Brak autoryzacji:

```json
{
  "error": "Unauthorized",
  "message": "You must be logged in to update survey responses"
}
```

**403 Forbidden** - Próba aktualizacji cudzej odpowiedzi:

```json
{
  "error": "Forbidden",
  "message": "You can only update your own survey responses"
}
```

**404 Not Found** - Response nie istnieje:

```json
{
  "error": "Not Found",
  "message": "Survey response with id 123 not found"
}
```

**500 Internal Server Error** - Błąd serwera:

```json
{
  "error": "Internal Server Error",
  "message": "Failed to update survey response"
}
```

## 5. Przepływ danych

### Ogólny przepływ:

1. Żądanie PATCH trafia do endpointu `/api/survey-responses/{responseId}`
2. Middleware Astro przetwarza żądanie i dodaje kontekst (supabase, session)
3. Handler endpointu:
   - Wyodrębnia `responseId` z params
   - Sprawdza autoryzację (session)
   - Waliduje dane wejściowe (Zod)
   - Wywołuje serwis `surveyResponseService.updateSurveyResponse()`
4. Serwis:
   - Sprawdza czy response istnieje
   - Jeśli `open_feedback` jest w danych: anonimizuje tekst przez API OpenRouter.ai
   - Wykonuje operację UPDATE w Supabase
   - Zwraca zaktualizowany rekord
5. Handler zwraca odpowiedź 200 OK z zaktualizowanym obiektem

### Szczegółowy przepływ z anonimizacją:

```
Client Request
    ↓
[Astro Middleware]
    ↓ context.locals (supabase, session)
[PATCH Handler] ← Walidacja: params + body (Zod)
    ↓
[surveyResponseService.updateSurveyResponse()]
    ↓
    ├─→ [Sprawdź istnienie response] (SELECT)
    │   ├─→ Nie istnieje → throw SurveyResponseNotFoundError
    │   └─→ Istnieje → kontynuuj
    ↓
    ├─→ [Jeśli open_feedback w command]
    │   ├─→ [anonymizeFeedback()] → wywołanie OpenRouter API
    │   │   ├─→ Sukces → zanonimizowany tekst
    │   │   └─→ Błąd → throw AnonymizationError
    │   └─→ Zamień open_feedback w command na zanonimizowaną wersję
    ↓
    └─→ [UPDATE survey_responses] (Supabase)
        ├─→ RLS sprawdza user_id = auth.uid()
        │   └─→ Brak dostępu → 403 (obsłużone przez Supabase RLS)
        ↓
        └─→ Zwróć zaktualizowany rekord
    ↓
[Handler] → Response 200 OK
    ↓
Client
```

### Interakcje z zewnętrznymi usługami:

1. **Supabase Database**:
   - SELECT: Sprawdzenie istnienia response
   - UPDATE: Aktualizacja rekordu
   - RLS: Automatyczna weryfikacja uprawnień

2. **OpenRouter.ai**:
   - POST: Anonimizacja open_feedback
   - Model: Claude 3.5 Sonnet lub podobny
   - Prompt: System message z instrukcjami anonimizacji

## 6. Względy bezpieczeństwa

### 6.1. Uwierzytelnianie

- **Wymagane**: Użytkownik musi być zalogowany (session w context.locals)
- **Sprawdzenie**: Na początku handlera, przed jakąkolwiek operacją
- **Błąd**: 401 Unauthorized jeśli brak sesji

### 6.2. Autoryzacja

- **RLS (Row Level Security)**: Supabase automatycznie egzekwuje politykę:
  ```sql
  CREATE POLICY "Users can update their own responses" ON public.survey_responses
    FOR UPDATE USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
  ```
- **Efekt**: Użytkownik może zaktualizować tylko własne odpowiedzi
- **Błąd**: 403 Forbidden (zwrócony przez Supabase jako brak wyniku z UPDATE)

### 6.3. Walidacja danych

- **responseId**: Musi być dodatnią liczbą całkowitą (Zod validation)
- **overall_rating**: Musi być w zakresie 1-10 lub null (Zod + DB constraint)
- **open_feedback**: Max 10000 znaków (Zod)
- **completed_at**: Musi być prawidłowym ISO 8601 timestamp (Zod)

### 6.4. Anonimizacja (GDPR Compliance)

- **KRYTYCZNE**: `open_feedback` MUSI być zanonimizowane przed zapisem
- **Implementacja**: Wywołanie OpenRouter.ai z odpowiednim promptem
- **Backup**: Jeśli anonimizacja się nie powiedzie → zwróć błąd 500, NIE zapisuj oryginalnego tekstu
- **Prompt guidance**:
  - Zapewnij rozsądną zgodność z GDPR
  - Usuń imiona, nazwiska - zastąp je ogólnymi
  - Zachowaj sens i ton opinii

### 6.5. Rate Limiting

- **MVP**: Nie wymagane
- **Przyszłość**: Rozważyć ograniczenie do X requestów na minutę per user

### 6.6. Input Sanitization

- **Nie wymagane**: Supabase chroni przed SQL injection
- **JSON**: Astro automatycznie parsuje i waliduje JSON

## 7. Obsługa błędów

### Tabela scenariuszy błędów:

| Scenariusz                               | HTTP Status | Error Message                             | Obsługa                                 |
| ---------------------------------------- | ----------- | ----------------------------------------- | --------------------------------------- |
| Brak sesji użytkownika                   | 401         | "You must be logged in"                   | Sprawdzenie na początku handlera        |
| Nieprawidłowy responseId (nie liczba)    | 400         | "Invalid responseId"                      | Zod validation w schemacie params       |
| Nieprawidłowy overall_rating (poza 1-10) | 400         | "overall_rating must be between 1 and 10" | Zod validation                          |
| Nieprawidłowy format completed_at        | 400         | "Invalid datetime format"                 | Zod validation                          |
| Response nie istnieje                    | 404         | "Survey response not found"               | Custom error z serwisu                  |
| Użytkownik nie jest właścicielem         | 403         | "You can only update your own responses"  | RLS w Supabase + sprawdzenie w serwisie |
| Błąd anonimizacji                        | 500         | "Failed to anonymize feedback"            | Custom error z serwisu                  |
| Błąd bazy danych                         | 500         | "Failed to update survey response"        | Console.error + generic error           |

### Implementacja w handlerze:

```typescript
try {
  // ... logika ...
} catch (error) {
  if (error instanceof ZodError) {
    return new Response(
      JSON.stringify({
        error: "Invalid input",
        details: error.errors,
      }),
      { status: 400 }
    );
  }

  if (error instanceof SurveyResponseNotFoundError) {
    return new Response(
      JSON.stringify({
        error: "Not Found",
        message: error.message,
      }),
      { status: 404 }
    );
  }

  if (error instanceof AnonymizationError) {
    console.error("Anonymization failed:", error);
    return new Response(
      JSON.stringify({
        error: "Internal Server Error",
        message: "Failed to process feedback",
      }),
      { status: 500 }
    );
  }

  // Generic error
  console.error("Unexpected error:", error);
  return new Response(
    JSON.stringify({
      error: "Internal Server Error",
      message: "Failed to update survey response",
    }),
    { status: 500 }
  );
}
```

### Logowanie błędów:

- **Console.error**: Dla wszystkich błędów serwera (500)
- **Format**: Zawsze loguj pełny error object dla debugowania
- **Nie loguj**: Danych wrażliwych (user_id OK, email/password NIE)

## 8. Rozważania dotyczące wydajności

### 8.1. Potencjalne wąskie gardła:

1. **Wywołanie API anonimizacji**:
   - **Problem**: Zewnętrzne API (OpenRouter) może być wolne (1-5s)
   - **Impact**: Opóźnienie w odpowiedzi dla użytkownika
   - **Mitigation (MVP)**: Akceptowalne opóźnienie dla MVP
   - **Mitigation (future)**:
     - Asynchroniczne przetwarzanie (job queue)
     - Cache dla podobnych tekstów
     - Timeout na API call (max 10s)

2. **Częste UPDATE operacje**:
   - **Problem**: Użytkownik może zapisywać postęp wielokrotnie
   - **Impact**: Load na bazie danych
   - **Mitigation**:
     - Indeks na `id` (primary key - automatyczny)
     - Debouncing po stronie klienta (save co 30s)

3. **RLS Policy Evaluation**:
   - **Problem**: Każdy UPDATE wymaga sprawdzenia RLS
   - **Impact**: Minimalne (RLS jest bardzo wydajne)
   - **Mitigation**: Indeks na `user_id` już istnieje

### 8.2. Strategie optymalizacji:

1. **Indeksy bazy danych** (już istniejące):
   - Primary key na `id` (automatyczny)
   - Index na `user_id`: `survey_responses_user_id_idx`
   - Index na `survey_id`: `survey_responses_survey_id_idx`

2. **Caching** (nie dla MVP):
   - W przyszłości: cache zanonimizowanych tekstów (hash → anonymized)
   - Redis lub podobne rozwiązanie

3. **Timeout dla API anonimizacji**:
   - Set timeout na 10 sekund
   - Jeśli przekroczony → zwróć 500 error

4. **Selective UPDATE**:
   - Aktualizuj tylko pola, które zostały przesłane w request body
   - Używaj partial update w Supabase

### 8.3. Monitoring (future):

- Czas odpowiedzi endpointu
- Success rate anonimizacji
- Liczba 403 errors (może wskazywać na próby ataku)

## 9. Etapy wdrożenia

### Krok 1: Rozszerzenie Zod schemas

**Plik**: `src/lib/schemas/surveyResponseSchemas.ts`

1. Dodaj schema dla body: `updateSurveyResponseSchema`
   - `overall_rating`: z.number().int().min(1).max(10).nullable().optional()
   - `open_feedback`: z.string().max(10000).nullable().optional()
   - `completed_at`: z.string().datetime().nullable().optional()
2. Dodaj schema dla params: `responseIdParamSchema`
   - `responseId`: z.string().transform() → parse to int

### Krok 2: Stworzenie serwisu anonimizacji

**Plik**: `src/lib/services/anonymizationService.ts` (nowy)

1. Zaimportuj klienta OpenRouter
2. Implementuj funkcję `anonymizeFeedback(text: string): Promise<string>`
   - Wywołaj OpenRouter API z odpowiednim promptem
   - Ustaw timeout 10s
   - Obsłuż błędy API
   - Zwróć zanonimizowany tekst
3. Zdefiniuj custom error: `AnonymizationError`
4. Dodaj testy jednostkowe (opcjonalnie dla MVP)

**Przykładowy prompt**:

```
You are an anonymization assistant. Your task is to anonymize user feedback while preserving the meaning and tone.

Rules:
- Remove or replace all personal names with generic terms (e.g., "the pilot", "the organizer")
- Preserve the sentiment and key points of the feedback
- Keep the same language as the input
- Return only the anonymized text, no additional commentary

Feedback to anonymize:
{user_feedback}
```

### Krok 3: Rozszerzenie surveyResponseService

**Plik**: `src/lib/services/surveyResponseService.ts`

1. Zaimportuj `anonymizeFeedback` z anonymizationService
2. Dodaj custom error: `SurveyResponseNotFoundError`
3. Implementuj funkcję `updateSurveyResponse()`:
   ```typescript
   export const updateSurveyResponse = async (
     supabase: SupabaseClient,
     command: UpdateSurveyResponseCommand,
     responseId: number,
     userId: string
   ): Promise<SurveyResponseDto>
   ```
4. Logika wewnątrz funkcji:
   - Sprawdź czy response istnieje (SELECT)
   - Jeśli nie istnieje → throw SurveyResponseNotFoundError
   - Jeśli `open_feedback` jest w command:
     - Wywołaj `anonymizeFeedback(command.open_feedback)`
     - Zamień `command.open_feedback` na zanonimizowaną wersję
   - Wykonaj UPDATE z RLS (user_id będzie sprawdzony automatycznie)
   - Sprawdź czy UPDATE zwrócił dane (jeśli nie → 403 lub 404)
   - Zwróć zaktualizowany rekord
5. Dodaj metodę do eksportowanego obiektu `SurveyResponseService`

### Krok 4: Implementacja endpointu API

**Plik**: `src/pages/api/survey-responses/[responseId].ts` (nowy)

1. Dodaj `export const prerender = false;`
2. Zaimplementuj handler `PATCH(context: APIContext): Promise<Response>`
3. Struktura handlera:

   ```typescript
   // 1. Wyodrębnij zależności z context
   const { supabase, session } = context.locals;

   // 2. Guard clause: sprawdź autoryzację
   if (!session?.user) {
     return new Response(
       JSON.stringify({
         error: "Unauthorized",
         message: "You must be logged in",
       }),
       { status: 401 }
     );
   }

   // 3. Walidacja params
   const paramsValidation = responseIdParamSchema.safeParse(context.params);
   if (!paramsValidation.success) {
     return new Response(
       JSON.stringify({
         error: "Invalid input",
         details: paramsValidation.error.errors,
       }),
       { status: 400 }
     );
   }
   const { responseId } = paramsValidation.data;

   // 4. Parsowanie i walidacja body
   const body = await context.request.json();
   const bodyValidation = updateSurveyResponseSchema.safeParse(body);
   if (!bodyValidation.success) {
     return new Response(
       JSON.stringify({
         error: "Invalid input",
         details: bodyValidation.error.errors,
       }),
       { status: 400 }
     );
   }
   const command = bodyValidation.data as UpdateSurveyResponseCommand;

   // 5. Wywołanie serwisu
   try {
     const updatedResponse = await SurveyResponseService.updateSurveyResponse(
       supabase,
       command,
       responseId,
       session.user.id
     );

     // 6. Zwróć sukces
     return new Response(JSON.stringify(updatedResponse), {
       status: 200,
       headers: { "Content-Type": "application/json" },
     });
   } catch (error) {
     // 7. Obsłuż błędy (jak w sekcji 7)
   }
   ```

### Krok 5: Aktualizacja typów (jeśli potrzebne)

**Plik**: `src/types.ts`

- Sprawdź czy `UpdateSurveyResponseCommand` jest poprawnie zdefiniowane
- Jeśli nie: upewnij się że zawiera `overall_rating`, `open_feedback`, `completed_at`

### Krok 6: Konfiguracja OpenRouter

**Plik**: `.env` lub konfiguracja

1. Dodaj zmienną środowiskową: `OPENROUTER_API_KEY`
2. Dodaj zmienną: `OPENROUTER_MODEL` (np. "anthropic/claude-3.5-sonnet")
3. Upewnij się że klucz API jest bezpiecznie przechowywany (nie w repo)

### Krok 7: Testy manualne

1. **Test 1**: Aktualizacja overall_rating
   - PATCH `/api/survey-responses/1` z body `{"overall_rating": 7}`
   - Oczekiwany wynik: 200 OK, zaktualizowany rekord

2. **Test 2**: Aktualizacja open_feedback (z anonimizacją)
   - PATCH z body `{"open_feedback": "Jan Kowalski był świetnym organizatorem"}`
   - Oczekiwany wynik: 200 OK, feedback zanonimizowany

3. **Test 3**: Finalizacja odpowiedzi
   - PATCH z body `{"completed_at": "2025-11-02T14:30:00Z"}`
   - Oczekiwany wynik: 200 OK, completed_at ustawione

4. **Test 4**: Unauthorized (bez sesji)
   - PATCH bez ciasteczka sesji
   - Oczekiwany wynik: 401

5. **Test 5**: Forbidden (cudza odpowiedź)
   - PATCH jako user A do response user B
   - Oczekiwany wynik: 403

6. **Test 6**: Not Found
   - PATCH do nieistniejącego response
   - Oczekiwany wynik: 404

7. **Test 7**: Bad Request (invalid data)
   - PATCH z body `{"overall_rating": 15}` (poza zakresem)
   - Oczekiwany wynik: 400

### Krok 8: Dokumentacja i cleanup

1. Zaktualizuj API documentation (jeśli istnieje)
2. Dodaj komentarze JSDoc do nowych funkcji
3. Sprawdź czy kod jest zgodny z linterem
4. Commit i push do repozytorium

### Krok 9: Code Review i Deploy

1. Utwórz Pull Request
2. Code review przez zespół
3. Merge do main
4. Deploy na Vercel
5. Sprawdź logi produkcyjne po wdrożeniu

---

## Podsumowanie implementacji

Implementacja tego endpointu wymaga:

- ✅ Utworzenia nowego serwisu anonimizacji (OpenRouter)
- ✅ Rozszerzenia istniejącego surveyResponseService
- ✅ Stworzenia nowego endpointu API
- ✅ Rozszerzenia Zod schemas
- ✅ Konfiguracji zmiennych środowiskowych
- ✅ Dokładnego testowania, szczególnie anonimizacji (GDPR compliance)

**Szacowany czas implementacji**: 4-6 godzin (w tym testy)

**Priorytet**: WYSOKI - krytyczny dla funkcjonalności zapisywania odpowiedzi na ankiety
