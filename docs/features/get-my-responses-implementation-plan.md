# API Endpoint Implementation Plan: GET /api/surveys/{surveyId}/responses/me

## 1. Przegląd punktu końcowego
Celem tego punktu końcowego jest umożliwienie zalogowanemu użytkownikowi pobranie swojej odpowiedzi na konkretną ankietę. Jeśli użytkownik jeszcze nie rozpoczął wypełniania ankiety, punkt końcowy zwróci `null`. Jest to kluczowa funkcja pozwalająca na kontynuację wcześniej rozpoczętej ankiety.

## 2. Szczegóły żądania
-   **Metoda HTTP**: `GET`
-   **Struktura URL**: `/api/surveys/{surveyId}/responses/me`
-   **Parametry**:
    -   **Wymagane**: `surveyId` (parametr ścieżki) - numeryczny identyfikator ankiety.
-   **Request Body**: Brak.

## 3. Wykorzystywane typy
-   `SurveyResponseDto`: Typ z `src/types.ts` używany do strukturyzacji danych odpowiedzi zwracanych przez API. Reprezentuje on wiersz z tabeli `survey_responses`.

## 4. Szczegóły odpowiedzi
-   **Odpowiedź sukcesu (200 OK)**:
    -   Ciało odpowiedzi będzie zawierało obiekt JSON reprezentujący `SurveyResponseDto` lub wartość `null`, jeśli odpowiedź nie istnieje.
    ```json
    // Example with existing response
    {
      "id": 123,
      "survey_id": 1,
      "user_id": "a1b2c3d4-...",
      "overall_rating": 8,
      "open_feedback": "Great event, well organized.",
      "completed_at": "2025-10-28T10:00:00Z",
      "created_at": "2025-10-27T18:00:00Z",
      "updated_at": "2025-10-28T10:00:00Z"
    }

    // Example with no response
    null
    ```
-   **Odpowiedzi błędu**: Zobacz sekcję "Obsługa błędów".

## 5. Przepływ danych
1.  Żądanie `GET` trafia do punktu końcowego Astro w `src/pages/api/surveys/[surveyId]/responses/me.ts`.
2.  Middleware Astro weryfikuje sesję użytkownika. Jeśli użytkownik nie jest uwierzytelniony, przepływ jest przerywany i zwracany jest błąd `401`. Dane użytkownika (`user`) i klient Supabase (`supabase`) są dołączane do `context.locals`.
3.  Handler `GET` w pliku endpointa jest wywoływany.
4.  Parametr `surveyId` jest odczytywany z `Astro.params` i walidowany przy użyciu schemy `zod` w celu zapewnienia, że jest to poprawna liczba dodatnia.
5.  Handler wywołuje metodę `findUserResponse(surveyId, userId)` z serwisu `SurveyResponseService` (`src/lib/services/surveyResponseService.ts`).
6.  `SurveyResponseService` najpierw sprawdza, czy ankieta o podanym `surveyId` istnieje w tabeli `surveys`. Jeśli nie, zwraca błąd, który handler przetworzy na odpowiedź `404 Not Found`.
7.  Następnie serwis wykonuje zapytanie do tabeli `survey_responses` w bazie Supabase, filtrując wyniki po `survey_id` oraz `user_id` (uzyskanym z `context.locals.user.id`).
8.  Serwis zwraca znaleziony obiekt odpowiedzi lub `null` do handlera API.
9.  Handler API konstruuje i zwraca obiekt `Response` z kodem statusu `200 OK` i ciałem odpowiedzi w formacie JSON. W przypadku błędów zwraca odpowiedni kod statusu i komunikat błędu.

## 6. Względy bezpieczeństwa
-   **Uwierzytelnianie**: Dostęp jest ściśle ograniczony do uwierzytelnionych użytkowników. Middleware Astro będzie odpowiedzialne za weryfikację tokenu sesji Supabase. Każde żądanie bez ważnej sesji zostanie odrzucone z kodem `401 Unauthorized`.
-   **Autoryzacja**: Logika serwisu zapewni, że użytkownik może uzyskać dostęp wyłącznie do własnej odpowiedzi. Zapytanie SQL będzie zawierało klauzulę `WHERE user_id = :current_user_id`, co uniemożliwi odpytywanie o dane innych użytkowników.
-   **Walidacja danych wejściowych**: Parametr `surveyId` będzie rygorystycznie walidowany za pomocą biblioteki `zod`, aby upewnić się, że jest to liczba całkowita. Chroni to przed potencjalnymi atakami (np. SQL Injection) i błędami przetwarzania.

## 7. Obsługa błędów
-   `400 Bad Request`: Zwracany, gdy `surveyId` w URL nie jest prawidłową liczbą całkowitą. Odpowiedź będzie zawierać szczegóły błędu walidacji.
-   `401 Unauthorized`: Zwracany, gdy żądanie jest wykonywane przez niezalogowanego użytkownika.
-   `404 Not Found`: Zwracany, gdy ankieta o podanym `surveyId` nie istnieje w bazie danych.
-   `500 Internal Server Error`: Zwracany w przypadku nieoczekiwanych problemów po stronie serwera, np. błędu połączenia z bazą danych. Odpowiedź nie będzie zawierać szczegółów implementacyjnych błędu.

## 8. Rozważania dotyczące wydajności
-   Zapytanie do bazy danych będzie operować na kluczu złożonym `(survey_id, user_id)`, który ma ograniczenie `UNIQUE`. Zapewni to bardzo wysoką wydajność odczytu, ponieważ baza danych będzie mogła szybko zlokalizować rekord.
-   Należy upewnić się, że indeks na kolumnie `survey_id` w tabeli `surveys` istnieje, aby przyspieszyć początkowe sprawdzenie istnienia ankiety.

## 9. Etapy wdrożenia
1.  **Utworzenie serwisu**: Stworzyć plik `src/lib/services/surveyResponseService.ts`.
2.  **Implementacja logiki serwisu**: W `surveyResponseService.ts` zaimplementować asynchroniczną funkcję `findUserResponse(surveyId: number, userId: string, supabase: SupabaseClient)`. Funkcja ta powinna:
    -   Sprawdzić, czy ankieta o danym `surveyId` istnieje.
    -   Wykonać zapytanie `select().eq('survey_id', surveyId).eq('user_id', userId).single()` na tabeli `survey_responses`.
    -   Zwrócić dane odpowiedzi lub `null`.
3.  **Utworzenie schemy walidacji**: W pliku endpointa zdefiniować schemę `zod` do walidacji `surveyId`.
4.  **Utworzenie pliku API route**: Stworzyć plik `src/pages/api/surveys/[surveyId]/responses/me.ts`.
5.  **Implementacja handlera GET**: W pliku API route zaimplementować handler `GET({ params, locals })`, który:
    -   Sprawdzi, czy `locals.user` istnieje. Jeśli nie, zwróci odpowiedź `401`.
    -   Zwaliduje `params.surveyId` przy użyciu `zod`. W przypadku błędu zwróci `400`.
    -   Wywoła `surveyResponseService.findUserResponse` z odpowiednimi parametrami.
    -   Obsłuży odpowiedź z serwisu, opakowując ją w obiekt `Response` z odpowiednim statusem i ciałem.
    -   Dodać blok `try...catch` do obsługi nieoczekiwanych błędów i zwrócenia odpowiedzi `500`.
6.  **Eksport konfiguracji**: Upewnić się, że plik API route eksportuje `export const prerender = false;`, aby zapewnić dynamiczne renderowanie.
