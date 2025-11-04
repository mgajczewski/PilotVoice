# Plan implementacji widoku: Strona informacyjna ankiety

## 1. Przegląd
Celem tego widoku jest przedstawienie użytkownikowi podstawowych informacji o ankiecie dotyczącej konkretnych zawodów paralotniowych oraz umożliwienie mu jej rozpoczęcia. Strona będzie wyświetlać nazwę i daty zawodów, informację o anonimowości odpowiedzi oraz zawierać główny przycisk akcji, który rozpocznie proces wypełniania ankiety.

## 2. Routing widoku
Widok będzie dostępny pod dynamiczną ścieżką: `/surveys/[slug]`, gdzie `[slug]` to unikalny, czytelny dla człowieka identyfikator ankiety.

## 3. Struktura komponentów
Hierarchia komponentów będzie prosta, z głównym naciskiem na oddzielenie logiki serwerowej (Astro) od logiki klienckiej (React).

```
- Layout.astro (główny szablon strony)
  - pages/surveys/[slug].astro (strona Astro)
    - Header.astro
    - Komponenty UI (np. Card, CardHeader, CardTitle, CardDescription z Shadcn/ui)
      - h1: Nazwa zawodów
      - p: Daty zawodów
      - p: Informacja o anonimowości
    - SurveyStart.tsx (komponent React, `client:load`)
      - Button (z Shadcn/ui)
    - Footer.astro
```

## 4. Szczegóły komponentów
### `pages/surveys/[slug].astro`
- **Opis komponentu**: Główny plik strony, odpowiedzialny za logikę po stronie serwera. Jego zadaniem jest pobranie danych ankiety i zawodów na podstawie `slug` z URL, a następnie wyrenderowanie statycznej zawartości strony i osadzenie w niej dynamicznego komponentu React.
- **Główne elementy**: Wykorzystuje standardowe komponenty `Layout`, `Header`, `Footer` oraz komponenty z biblioteki Shadcn/ui do strukturyzacji treści (np. `Card`). Przekazuje `surveyId` i `competitionId` jako propsy do komponentu `SurveyStart`.
- **Obsługiwane zdarzenia**: Brak (komponent serwerowy).
- **Warunki walidacji**: Po stronie serwera sprawdza, czy ankieta o danym `slug` istnieje. W przypadku braku, renderuje stronę błędu 404.
- **Typy**: `Survey` i `Competition` z bazy danych (do pobrania danych).
- **Propsy**: Brak (jest to komponent strony).

### `SurveyStart.tsx`
- **Opis komponentu**: Komponent React odpowiedzialny za całą logikę kliencką. Sprawdza status uwierzytelnienia użytkownika oraz czy rozpoczął on już wypełnianie danej ankiety. Na tej podstawie renderuje odpowiedni przycisk i zarządza jego akcją.
- **Główne elementy**: Głównie komponent `Button` z Shadcn/ui. Wyświetla również stany ładowania i ewentualne komunikaty o błędach.
- **Obsługiwane zdarzenia**: `onClick` na przycisku.
- **Warunki walidacji**: Przed wykonaniem akcji sprawdza:
  - Czy użytkownik jest zalogowany.
  - Czy ankieta nie została już wcześniej rozpoczęta przez tego użytkownika.
- **Typy**: `SurveyResponseDto`.
- **Propsy**:
  ```typescript
  interface SurveyStartProps {
    surveyId: number;
    surveySlug: string;
  }
  ```

## 5. Typy
Do implementacji tego widoku wykorzystane zostaną istniejące typy. Nie ma potrzeby tworzenia nowych.
- **`SurveyDto`**: Do przekazywania danych o ankiecie.
- **`CompetitionDto`**: Do przekazywania danych o zawodach.
- **`SurveyResponseDto`**: Do reprezentowania odpowiedzi użytkownika na ankietę, pobieranej z API.
- **`User`**: Z Supabase Auth, do sprawdzania statusu sesji użytkownika.

## 6. Zarządzanie stanem
Zarządzanie stanem będzie ograniczone do komponentu `SurveyStart.tsx` i zrealizowane przy użyciu wbudowanych hooków React (`useState`, `useEffect`).

- **`user: User | null | undefined`**: Przechowuje informacje o zalogowanym użytkowniku. Stan początkowy to `undefined` (ładowanie).
- **`surveyResponse: SurveyResponseDto | null | undefined`**: Przechowuje istniejącą odpowiedź użytkownika na ankietę. Stan początkowy to `undefined` (ładowanie).
- **`isLoading: boolean`**: Flaga informująca, czy trwa operacja (np. tworzenie nowej odpowiedzi).
- **`error: string | null`**: Przechowuje komunikaty o błędach.

Można rozważyć stworzenie customowego hooka `useSurveyStatus(surveyId: number)`, który zamknie w sobie logikę pobierania statusu użytkownika i jego odpowiedzi, zwracając obiekt `{ user, surveyResponse, isLoading, error }`.

## 7. Integracja API
Komponent `SurveyStart.tsx` będzie komunikował się z następującymi endpointami:

1.  **`GET /api/surveys/{surveyId}/responses/me`**
    -   **Cel**: Sprawdzenie, czy zalogowany użytkownik ma już rozpoczętą odpowiedź dla tej ankiety.
    -   **Wywołanie**: W `useEffect` po zamontowaniu komponentu (jeśli użytkownik jest zalogowany).
    -   **Typ odpowiedzi**: `SurveyResponseDto | null`

2.  **`POST /api/surveys/{surveyId}/responses`**
    -   **Cel**: Utworzenie nowego rekordu odpowiedzi, co jest równoznaczne z rozpoczęciem ankiety.
    -   **Wywołanie**: W obsłudze zdarzenia `onClick` przycisku "Rozpocznij ankietę".
    -   **Typ żądania**: `{}` (pusty obiekt)
    -   **Typ odpowiedzi**: `SurveyResponseDto`

## 8. Interakcje użytkownika
- **Użytkownik niezalogowany**:
  - Widzi przycisk "Zaloguj się, aby rozpocząć".
  - Po kliknięciu zostaje przekierowany na stronę logowania (`/login`) z parametrem powrotu (np. `/login?redirect=/surveys/[slug]`).
- **Użytkownik zalogowany (nie rozpoczął ankiety)**:
  - Widzi przycisk "Rozpocznij ankietę".
  - Po kliknięciu:
    - Przycisk przechodzi w stan ładowania.
    - Wywoływany jest endpoint `POST /api/surveys/{surveyId}/responses`.
    - Po pomyślnym utworzeniu odpowiedzi, użytkownik jest przekierowywany na stronę formularza ankiety (np. `/surveys/[slug]/form`).
- **Użytkownik zalogowany (rozpoczął już ankietę)**:
  - Widzi przycisk "Kontynuuj ankietę".
  - Po kliknięciu zostaje od razu przekierowany na stronę formularza ankiety (`/surveys/[slug]/form`).

## 9. Warunki i walidacja
- **Strona `[slug].astro` (serwer)**: Musi zweryfikować, czy ankieta o danym `slug` istnieje w bazie danych. Jeśli nie, należy zwrócić odpowiedź 404.
- **Komponent `SurveyStart.tsx` (klient)**:
  - Przed wywołaniem API musi sprawdzić, czy sesja użytkownika jest aktywna.
  - Logika komponentu musi poprawnie obsłużyć trzy stany: użytkownik niezalogowany, zalogowany bez odpowiedzi, zalogowany z istniejącą odpowiedzią.

## 10. Obsługa błędów
- **Brak ankiety (404)**: Obsługiwane po stronie serwera przez Astro, które powinno wyświetlić standardową stronę 404.
- **Błąd pobierania odpowiedzi (`GET .../me`)**: Komponent `SurveyStart` powinien wyświetlić komunikat o błędzie, np. "Nie udało się pobrać danych. Spróbuj odświeżyć stronę." i zablokować przycisk.
- **Błąd tworzenia odpowiedzi (`POST .../responses`)**: Komponent `SurveyStart` powinien wyświetlić stosowny komunikat błędu obok przycisku, np. "Wystąpił błąd podczas rozpoczynania ankiety. Spróbuj ponownie." (np. za pomocą komponentu Toast). Przycisk powinien wrócić do stanu aktywnego.
- **Użytkownik niezautoryzowany (401)**: Endpointy zwrócą 401, a logika kliencka powinna to zinterpretować jako stan "użytkownik niezalogowany".

## 11. Kroki implementacji
1.  **Stworzenie pliku strony**: Utworzyć plik `src/pages/surveys/[slug].astro`.
2.  **Logika pobierania danych (serwer)**: W `[slug].astro`, zaimplementować logikę `Astro.props` (lub `getStaticPaths`, jeśli ankiety są generowane statycznie), która pobierze z bazy danych dane ankiety i zawodów na podstawie `slug`. Należy obsłużyć przypadek, gdy ankieta nie zostanie znaleziona (przekierowanie na 404).
3.  **Struktura widoku (Astro)**: W `[slug].astro`, użyć pobranych danych do wyświetlenia nazwy zawodów, dat i innych statycznych informacji, korzystając z komponentów Shadcn/ui.
4.  **Stworzenie komponentu React**: Utworzyć plik `src/components/SurveyStart.tsx`.
5.  **Implementacja stanu w `SurveyStart`**: Dodać stany `user`, `surveyResponse`, `isLoading`, `error` za pomocą `useState`.
6.  **Pobieranie danych (klient)**: W `SurveyStart`, użyć `useEffect` do pobrania sesji użytkownika oraz, jeśli jest zalogowany, jego odpowiedzi na ankietę z `GET /api/surveys/{surveyId}/responses/me`.
7.  **Renderowanie warunkowe przycisku**: W `SurveyStart`, zaimplementować logikę, która na podstawie stanów `user` i `surveyResponse` renderuje przycisk z odpowiednim tekstem ("Zaloguj się...", "Rozpocznij...", "Kontynuuj...").
8.  **Implementacja akcji `onClick`**: Dodać obsługę kliknięcia przycisku, która w zależności od stanu:
    - Przekierowuje do logowania.
    - Wywołuje `POST /api/surveys/{surveyId}/responses` i przekierowuje do formularza.
    - Przekierowuje bezpośrednio do formularza.
9.  **Integracja komponentu**: Umieścić komponent `<SurveyStart client:load />` w pliku `[slug].astro`, przekazując wymagane propsy (`surveyId`, `surveySlug`).
10. **Obsługa błędów**: Dodać wyświetlanie komunikatów o błędach w komponencie `SurveyStart.tsx`.
