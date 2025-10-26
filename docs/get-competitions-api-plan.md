# API Endpoint Implementation Plan: GET /api/competitions

## 1. Przegląd punktu końcowego
Ten punkt końcowy (`endpoint`) jest odpowiedzialny za pobieranie listy zawodów. Zapewnia wsparcie dla paginacji i sortowania, aby umożliwić klientom efektywne przeglądanie danych. Dostęp jest ograniczony wyłącznie do uwierzytelnionych użytkowników.

## 2. Szczegóły żądania
-   **Metoda HTTP**: `GET`
-   **Struktura URL**: `/api/competitions`
-   **Parametry zapytania (Query Parameters)**:
    -   Wymagane: Brak.
    -   Opcjonalne:
        -   `page` (integer, domyślnie: `1`): Numer strony do wyświetlenia.
        -   `pageSize` (integer, domyślnie: `10`): Liczba zawodów na stronie.
        -   `sortBy` (string, domyślnie: `'starts_at'`): Pole, według którego wyniki mają być sortowane. Dozwolone wartości: `name`, `starts_at`, `ends_at`, `city`, `country_code`.
        -   `order` (string, domyślnie: `'desc'`): Kierunek sortowania. Dozwolone wartości: `'asc'`, `'desc'`.
-   **Request Body**: Brak.

## 3. Wykorzystywane typy
-   `CompetitionDto`: Obiekt transferu danych (DTO) reprezentujący pojedyncze zawody na liście.
-   `PaginatedCompetitionsDto`: DTO reprezentujący całą odpowiedź, zawierający tablicę `CompetitionDto` oraz informacje o paginacji.

## 4. Szczegóły odpowiedzi
-   **Odpowiedź sukcesu (`200 OK`)**:
    ```json
    {
      "data": [
        {
          "id": "integer",
          "name": "string",
          "starts_at": "timestamptz",
          "ends_at": "timestamptz",
          "city": "string",
          "country_code": "string",
          "tasks_count": "integer",
          "participant_count": "integer | null"
        }
      ],
      "pagination": {
        "page": 1,
        "pageSize": 10,
        "total": 100
      }
    }
    ```
-   **Odpowiedzi błędów**:
    -   `400 Bad Request`: Nieprawidłowe parametry zapytania.
    -   `401 Unauthorized`: Brak uwierzytelnienia.
    -   `500 Internal Server Error`: Wewnętrzny błąd serwera.

## 5. Przepływ danych
1.  Klient wysyła żądanie `GET` do `/api/competitions` z opcjonalnymi parametrami paginacji i sortowania.
2.  Middleware Astro przechwytuje żądanie i weryfikuje token JWT użytkownika w celu uwierzytelnienia sesji Supabase.
3.  Handler punktu końcowego w `src/pages/api/competitions/index.ts` zostaje wywołany.
4.  Handler sprawdza obecność `context.locals.user`, aby potwierdzić uwierzytelnienie.
5.  Parametry zapytania są parsowane i walidowane przy użyciu predefiniowanego schematu Zod.
6.  Handler wywołuje metodę `getCompetitions` z `CompetitionService`, przekazując zwalidowane parametry oraz instancję klienta Supabase.
7.  `CompetitionService` konstruuje i wykonuje dwa zapytania do bazy Supabase:
    a. Jedno zapytanie do pobrania paginowanej i posortowanej listy zawodów.
    b. Drugie zapytanie do uzyskania całkowitej liczby zawodów.
8.  Serwis mapuje wyniki na obiekt `PaginatedCompetitionsDto` i zwraca go do handlera.
9.  Handler serializuje obiekt DTO do formatu JSON i wysyła odpowiedź `200 OK` do klienta.

## 6. Względy bezpieczeństwa
-   **Uwierzytelnianie**: Każde żądanie musi zawierać prawidłowy token JWT, który jest weryfikowany przez middleware Astro. Próba dostępu bez ważnej sesji zakończy się odpowiedzią `401 Unauthorized`.
-   **Autoryzacja**: Dostęp do danych jest dodatkowo chroniony przez polityki Row-Level Security (RLS) w bazie danych Supabase, które zezwalają na odczyt tabeli `competitions` tylko uwierzytelnionym użytkownikom.
-   **Walidacja danych wejściowych**: Parametry `page`, `pageSize`, `sortBy` i `order` są rygorystycznie walidowane przy użyciu Zod. Szczególnie pole `sortBy` jest ograniczone do predefiniowanej listy dozwolonych kolumn, co zapobiega atakom typu SQL Injection.

## 7. Rozważania dotyczące wydajności
-   **Paginacja**: Zastosowanie paginacji jest kluczowe dla wydajności, aby uniknąć przesyłania dużych ilości danych w jednym żądaniu.
-   **Zapytania do bazy danych**: Wykonanie dwóch oddzielnych zapytań (jedno dla danych, drugie dla całkowitej liczby) jest optymalnym podejściem, ponieważ unika obciążenia związanego z liczeniem wierszy przy każdym zapytaniu o dane.
-   **Indeksowanie**: Domyślne sortowanie odbywa się po kolumnie `starts_at`. Należy upewnić się, że na tej kolumnie w tabeli `competitions` istnieje indeks, aby zoptymalizować wydajność zapytań.

## 8. Etapy wdrożenia
1.  **Utworzenie pliku endpointu**: Stworzyć nowy plik `src/pages/api/competitions/index.ts`.
2.  **Definicja schematu walidacji**: W pliku `index.ts` zdefiniować schemat Zod do walidacji parametrów zapytania: `page`, `pageSize`, `sortBy` (z listą dozwolonych wartości) i `order`.
3.  **Implementacja handlera `GET`**:
    -   Dodać `export const prerender = false;`.
    -   Sprawdzić, czy `context.locals.user` istnieje; jeśli nie, zwrócić `401`.
    -   Sparować i zwalidować parametry zapytania przy użyciu schematu Zod; w przypadku błędu zwrócić `400`.
    -   Wywołać metodę z serwisu `CompetitionService` w bloku `try...catch`.
    -   W przypadku błędu serwisu, zalogować go i zwrócić `500`.
    -   W przypadku sukcesu, zwrócić dane z serwisu ze statusem `200`.
4.  **Utworzenie pliku serwisu**: Stworzyć nowy plik `src/lib/services/competition.service.ts`.
5.  **Implementacja logiki serwisu**:
    -   Stworzyć funkcję asynchroniczną `getCompetitions`, która przyjmuje zwalidowane parametry i klienta Supabase.
    -   Obliczyć zakres (`from`, `to`) dla paginacji na podstawie `page` i `pageSize`.
    -   Wykonać zapytanie do Supabase o dane zawodów, używając `.select()`, `.order()` i `.range()`.
    -   Wykonać drugie zapytanie do Supabase o całkowitą liczbę rekordów, używając `{ count: 'exact', head: true }`.
    -   Obsłużyć potencjalne błędy z zapytań do Supabase.
    -   Złożyć i zwrócić obiekt zgodny z typem `PaginatedCompetitionsDto`.
6.  **Weryfikacja indeksu bazy danych**: Sprawdzić w schemacie bazy danych (`docs/db-plan.md` oraz migracje Supabase), czy na kolumnie `competitions(starts_at)` istnieje indeks. Jeśli nie, dodać go w nowej migracji.
