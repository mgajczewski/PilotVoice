# API Endpoint Implementation Plan: POST /api/surveys/{surveyId}/responses

## 1. Przegląd punktu końcowego

Ten punkt końcowy umożliwia uwierzytelnionemu użytkownikowi utworzenie nowej odpowiedzi na ankietę. Jest to akcja inicjująca, która ma miejsce, gdy użytkownik po raz pierwszy rozpoczyna wypełnianie ankiety. Endpoint zapisuje nowy wiersz w tabeli `survey_responses`, wiążąc go z ankietą (`surveyId`) i bieżącym użytkownikiem. System zapobiega tworzeniu przez użytkownika wielu odpowiedzi na tę samą ankietę.

## 2. Szczegóły żądania

- **Metoda HTTP**: `POST`
- **Struktura URL**: `/api/surveys/{surveyId}/responses`
- **Parametry**:
  - **Wymagane**:
    - `surveyId` (w ścieżce URL): Identyfikator ankiety, musi być dodatnią liczbą całkowitą.
  - **Opcjonalne**: Brak.
- **Request Body**:
  - Opcjonalny obiekt JSON. Może być pusty lub zawierać wstępną ocenę.

  ```json
  {
    "overall_rating": "integer | null"
  }
  ```

## 3. Wykorzystywane typy

- **Command Model (Request)**: `CreateSurveyResponseCommand`
  ```typescript
  export type CreateSurveyResponseCommand = Partial<Pick<TablesInsert<"survey_responses">, "overall_rating">>;
  ```
- **DTO (Response)**: `SurveyResponseDto`
  ```typescript
  export type SurveyResponseDto = Tables<"survey_responses">;
  ```

## 4. Szczegóły odpowiedzi

- **Odpowiedź sukcesu (201 Created)**: Zwraca nowo utworzony obiekt odpowiedzi na ankietę.
  ```json
  {
    "id": 1,
    "survey_id": 123,
    "user_id": "user-uuid-string",
    "overall_rating": 8,
    "open_feedback": null,
    "completed_at": null,
    "created_at": "2025-11-02T10:00:00.000Z",
    "updated_at": "2025-11-02T10:00:00.000Z"
  }
  ```
- **Odpowiedzi błędów**: Zwraca standardowy obiekt błędu.
  ```json
  {
    "error": "Komunikat o błędzie"
  }
  ```

## 5. Przepływ danych

1.  Użytkownik wysyła żądanie `POST` do `/api/surveys/{surveyId}/responses` z opcjonalną zawartością.
2.  Middleware Astro weryfikuje sesję użytkownika. Jeśli sesja jest nieprawidłowa, zwraca błąd `401 Unauthorized`.
3.  Handler API weryfikuje `surveyId` z URL oraz dane z ciała żądania przy użyciu Zod.
4.  Handler wywołuje funkcję `createSurveyResponse` z nowego serwisu `surveyResponseService`.
5.  `surveyResponseService` sprawdza, czy ankieta o podanym `surveyId` istnieje w bazie danych.
6.  Serwis próbuje wstawić nowy rekord do tabeli `survey_responses` z `survey_id`, `user_id` i opcjonalnym `overall_rating`.
7.  Baza danych (Supabase/Postgres) wymusza unikalność pary `(survey_id, user_id)`.
8.  Jeśli wstawienie się powiedzie, serwis zwraca nowo utworzony obiekt odpowiedzi.
9.  Handler API serializuje obiekt odpowiedzi i zwraca go z kodem statusu `201 Created`.
10. W przypadku błędu (np. naruszenia unikalności), serwis przechwytuje błąd i zwraca odpowiedni kod błędu, który handler API przekazuje do klienta.

## 6. Względy bezpieczeństwa

- **Uwierzytelnianie**: Endpoint musi być chroniony. Dostęp jest dozwolony tylko dla zalogowanych użytkowników. Middleware Astro (`src/middleware/index.ts`) musi zapewnić, że `context.locals.session.user` jest dostępne.
- **Autoryzacja**: Każdy uwierzytelniony użytkownik może utworzyć odpowiedź. Nie są wymagane żadne dodatkowe role.
- **Walidacja danych wejściowych**:
  - `surveyId` musi być walidowane jako dodatnia liczba całkowita.
  - Ciało żądania musi być walidowane przy użyciu schemy Zod, aby upewnić się, że `overall_rating` (jeśli podane) jest liczbą całkowitą w zakresie 1-10 lub `null`.
- **Ochrona przed duplikacją**: Unikalny indeks w bazie danych na `(survey_id, user_id)` zapobiega utworzeniu przez jednego użytkownika wielu odpowiedzi na tę samą ankietę.

## 7. Obsługa błędów

| Kod statusu                 | Opis                                                                                                                                          |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `400 Bad Request`           | - `surveyId` nie jest prawidłową liczbą całkowitą.<br>- Ciało żądania ma nieprawidłowy format (np. `overall_rating` jest poza zakresem 1-10). |
| `401 Unauthorized`          | - Użytkownik nie jest zalogowany (brak aktywnej sesji).                                                                                       |
| `404 Not Found`             | - Ankieta o podanym `surveyId` nie istnieje.                                                                                                  |
| `409 Conflict`              | - Użytkownik już utworzył odpowiedź na tę ankietę.                                                                                            |
| `500 Internal Server Error` | - Wystąpił nieoczekiwany błąd serwera, np. problem z połączeniem z bazą danych.                                                               |

## 8. Rozważania dotyczące wydajności

- Operacja jest prostym zapytaniem `INSERT` z jednym `SELECT` w celu weryfikacji istnienia ankiety. Oczekuje się, że będzie bardzo wydajna.
- Należy zapewnić, że kolumny `survey_id` i `user_id` w tabeli `survey_responses` są odpowiednio zindeksowane, aby zapytania były szybkie (indeks unikalny już to zapewnia).

## 9. Etapy wdrożenia

1.  **Utworzenie schemy walidacji Zod**:
    - W nowym pliku `src/lib/schemas/surveyResponseSchemas.ts` utwórz schemę Zod dla `CreateSurveyResponseCommand`.

2.  **Utworzenie serwisu**:
    - Utwórz nowy plik serwisu: `src/lib/services/surveyResponseService.ts`.
    - Zaimplementuj w nim funkcję `createSurveyResponse(supabase: SupabaseClient, command: CreateSurveyResponseCommand, surveyId: number, userId: string): Promise<SurveyResponseDto>`.
    - Logika wewnątrz serwisu powinna:
      - Sprawdzić, czy ankieta o podanym `surveyId` istnieje. Jeśli nie, rzucić błąd (`404 Not Found`).
      - Wykonać operację `insert` na tabeli `survey_responses`.
      - Obsłużyć potencjalny błąd naruszenia unikalności (kod `23505` z Postgresa) i rzucić odpowiedni błąd (`409 Conflict`).
      - Zwrócić nowo utworzony rekord.

3.  **Implementacja punktu końcowego API**:
    - Utwórz nowy plik trasy: `src/pages/api/surveys/[surveyId]/responses/index.ts`.
    - Dodaj `export const prerender = false;`.
    - Zaimplementuj handler `POST({ params, request, context }: APIContext)`.
    - Pobierz `supabase` i `session` z `context.locals`.
    - Sprawdź, czy użytkownik jest zalogowany; jeśli nie, zwróć `401 Unauthorized`.
    - Waliduj `surveyId` z `params` i ciało żądania `request` przy użyciu schemy Zod. W razie błędu zwróć `400 Bad Request`.
    - Wywołaj metodę `surveyResponseService.createSurveyResponse`.
    - Obsłuż błędy zwrócone z serwisu i mapuj je na odpowiednie odpowiedzi HTTP.
    - Jeśli operacja się powiedzie, zwróć odpowiedź `201 Created` z nowo utworzonym obiektem `SurveyResponseDto`.
