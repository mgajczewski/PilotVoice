# Plan implementacji widoku: Formularz ankiety

## 1. Przegląd
Widok ten umożliwia pilotom wypełnianie ankiety dotyczącej konkretnych zawodów. Jego głównym celem jest zbieranie opinii poprzez formularz, który zawiera zarówno pytania obowiązkowe (ocena w formie gwiazdek), jak i opcjonalne (pole tekstowe). Kluczową funkcjonalnością jest automatyczny, opóźniony (debounced) zapis postępów użytkownika, aby zminimalizować ryzyko utraty danych. Widok zarządza całym cyklem życia odpowiedzi na ankietę – od jej utworzenia, przez zapisywanie postępów, aż po finalne jej ukończenie.

## 2. Routing widoku
Widok będzie dostępny pod dynamiczną ścieżką: `/surveys/[slug]/fill`, gdzie `[slug]` jest unikalnym identyfikatorem ankiety.

## 3. Struktura komponentów
Hierarchia komponentów zostanie zaimplementowana z wykorzystaniem Reacta renderowanego po stronie klienta w ramach strony Astro.

```
- `src/pages/surveys/[slug]/fill.astro` (Strona Astro)
  - Pobiera wstępne dane po stronie serwera (dane ankiety, zawodów, odpowiedź użytkownika).
  - Renderuje główny komponent React `SurveyFillForm`, przekazując mu pobrane dane jako propsy.
    - `SurveyFillForm.tsx` (Główny komponent React)
      - `SaveStatusIndicator.tsx` (Wskaźnik statusu zapisu)
      - `RatingInput.tsx` (Komponent do oceny gwiazdkowej)
      - `FeedbackInput.tsx` (Komponent pola tekstowego)
      - `Button` (Przycisk do ukończenia ankiety)
```

## 4. Szczegóły komponentów
### `SurveyFillForm.tsx`
- **Opis komponentu**: Główny, interaktywny komponent React, który zarządza stanem całego formularza, obsługuje wprowadzanie danych przez użytkownika, komunikuje się z API w celu zapisu postępów i finalizacji ankiety. Jest sercem widoku.
- **Główne elementy**: Wyświetla tytuł zawodów, których dotyczy ankieta. Zawiera komponenty `RatingInput` i `FeedbackInput` wewnątrz komponentu `Card` z biblioteki Shadcn/ui. Posiada również wskaźnik zapisu `SaveStatusIndicator` oraz przycisk `Button` do ukończenia ankiety.
- **Obsługiwane interakcje**:
    - Zmiana oceny w `RatingInput`.
    - Wprowadzanie tekstu w `FeedbackInput`.
    - Kliknięcie przycisku "Ukończ ankietę".
- **Obsługiwana walidacja**: Przycisk "Ukończ ankietę" jest nieaktywny, dopóki pole obowiązkowe (`overall_rating`) nie zostanie wypełnione.
- **Typy**: `SurveyDto`, `CompetitionDto`, `SurveyResponseDto`.
- **Propsy**:
    - `initialSurvey: SurveyDto`
    - `initialCompetition: CompetitionDto`
    - `initialResponse: SurveyResponseDto | null`
    - `user: User` (obiekt użytkownika z sesji)
- **Język interfejsu**: Wszystkie teksty widoczne dla użytkownika (etykiety, przyciski, statusy) powinny być w języku angielskim, zgodnie z ogólnymi wytycznymi projektu.

### `RatingInput.tsx`
- **Opis komponentu**: Komponent do wprowadzania obowiązkowej oceny ogólnej (np. w skali 1-5).
- **Główne elementy**: Zostanie zaimplementowany przy użyciu komponentu `RadioGroup` z Shadcn/ui, stylizowanego na gwiazdki lub przyciski. Będzie zawierał etykietę pytania.
- **Obsługiwane interakcje**: Wybór oceny przez użytkownika.
- **Obsługiwana walidacja**: Pole jest oznaczone jako wymagane.
- **Typy**: -
- **Propsy**:
    - `value: number | null`
    - `onChange: (value: number) => void`
    - `label: string`
    - `required: boolean`

### `FeedbackInput.tsx`
- **Opis komponentu**: Prosty komponent pola tekstowego dla opcjonalnej opinii otwartej.
- **Główne elementy**: Komponent `Textarea` z Shadcn/ui wraz z etykietą.
- **Obsługiwane interakcje**: Wprowadzanie tekstu przez użytkownika.
- **Obsługiwana walidacja**: Brak (pole opcjonalne).
- **Typy**: -
- **Propsy**:
    - `value: string | null`
    - `onChange: (value: string) => void`
    - `label: string`
    - `placeholder: string`

### `SaveStatusIndicator.tsx`
- **Opis komponentu**: Mały element interfejsu (tekst lub ikona), który informuje użytkownika o stanie zapisu formularza.
- **Główne elementy**: Element tekstowy, który wyświetla statusy: "Saving...", "Saved", "Save error".
- **Obsługiwane interakcje**: Brak.
- **Obsługiwana walidacja**: Brak.
- **Typy**: `type Status = 'idle' | 'typing' | 'saving' | 'saved' | 'error'`
- **Propsy**:
    - `status: Status`

## 5. Typy
Do implementacji widoku wykorzystane zostaną istniejące typy zdefiniowane w `src/types.ts`. Nie ma potrzeby tworzenia nowych typów DTO ani ViewModeli.

-   **`SurveyDto`**: Obiekt transferu danych dla ankiety.
-   **`CompetitionDto`**: Obiekt transferu danych dla zawodów.
-   **`SurveyResponseDto`**: Obiekt transferu danych dla odpowiedzi na ankietę; będzie głównym obiektem stanu formularza.
-   **`UpdateSurveyResponseCommand`**: Model polecenia do aktualizacji odpowiedzi na ankietę.

## 6. Zarządzanie stanem
Stan będzie zarządzany lokalnie wewnątrz komponentu `SurveyFillForm.tsx` przy użyciu hooka `useState`. Główny stan będzie przechowywał obiekt `SurveyResponseDto` oraz status zapisu.

Zostanie stworzony niestandardowy hook `useSurveyAutoSave` w celu enkapsulacji logiki automatycznego zapisu:
- Hook będzie przyjmował aktualny stan odpowiedzi (`SurveyResponseDto`) jako argument.
- Będzie używał `useEffect` i `setTimeout` do implementacji opóźnienia (debouncing, np. 5 sekund).
- Po upływie opóźnienia, hook wywoła endpoint `PATCH /api/survey-responses/{responseId}`, wysyłając zaktualizowane dane.
- Będzie zarządzał stanem zapisu (`saving`, `saved`, `error`) i zwracał go do komponentu `SurveyFillForm` w celu wyświetlenia w `SaveStatusIndicator`.

## 7. Integracja API
Integracja z backendem będzie opierać się na trzech głównych endpointach:

1.  **Pobranie istniejącej odpowiedzi**: `GET /api/surveys/{surveyId}/responses/me`
    -   **Cel**: Sprawdzenie, czy użytkownik rozpoczął już wypełnianie tej ankiety.
    -   **Typ odpowiedzi**: `SurveyResponseDto | null`

2.  **Utworzenie nowej odpowiedzi**: `POST /api/surveys/{surveyId}/responses`
    -   **Cel**: Inicjalizacja nowej odpowiedzi, gdy użytkownik po raz pierwszy otwiera formularz ankiety.
    -   **Typ żądania**: `CreateSurveyResponseCommand` (może być pustym obiektem)
    -   **Typ odpowiedzi**: `SurveyResponseDto`

3.  **Aktualizacja odpowiedzi (Auto-save)**: `PATCH /api/survey-responses/{responseId}`
    -   **Cel**: Zapisywanie postępów użytkownika (ocena, treść opinii) oraz finalne oznaczenie ankiety jako ukończonej.
    -   **Typ żądania**: `UpdateSurveyResponseCommand`
    -   **Typ odpowiedzi**: `SurveyResponseDto`

## 8. Interakcje użytkownika
-   **Wejście na stronę**: System sprawdza, czy istnieje odpowiedź użytkownika. Jeśli nie, tworzy nową. Formularz jest inicjalizowany pustymi lub zapisanymi wcześniej danymi.
-   **Zmiana wartości w polu formularza**: Wartość w stanie komponentu jest natychmiast aktualizowana. Status zapisu zmienia się na "Typing...". Po 5 sekundach bezczynności, dane są wysyłane do API, a status zmienia się na "Saving...", a następnie "Saved".
-   **Kliknięcie "Complete Survey"**:
    -   Jeśli pola wymagane nie są wypełnione, przycisk jest nieaktywny lub wyświetla komunikat.
    -   Jeśli walidacja przejdzie pomyślnie, wysyłane jest żądanie `PATCH` z aktualnymi danymi oraz `completed_at` ustawionym na bieżący czas. Po sukcesie, użytkownik jest przekierowywany na stronę z podziękowaniem.

## 9. Warunki i walidacja
-   **Warunek**: Użytkownik musi być zalogowany, aby wypełnić ankietę.
    -   **Obsługa**: Strona Astro (`fill.astro`) sprawdzi sesję użytkownika na serwerze i przekieruje do strony logowania w razie jej braku.
-   **Warunek**: Pole `overall_rating` jest obowiązkowe do ukończenia ankiety.
    -   **Obsługa**: Przycisk "Complete Survey" w komponencie `SurveyFillForm` będzie nieaktywny (`disabled`), dopóki `response.overall_rating` nie będzie miało wartości innej niż `null`.

## 10. Obsługa błędów
-   **Błąd pobierania danych początkowych**: Jeśli ankieta lub zawody nie zostaną znalezione, strona Astro zwróci błąd 404.
-   **Błąd inicjalizacji odpowiedzi (GET/POST)**: W komponencie `SurveyFillForm` zostanie wyświetlony komunikat o błędzie na pełnym ekranie z prośbą o odświeżenie strony i przyciskiem "Try Again".
-   **Błąd automatycznego zapisu (PATCH)**: `SaveStatusIndicator` wyświetli status "Save error". W konsoli zostanie zalogowany błąd. System automatycznie spróbuje zapisać dane przy kolejnej zmianie.
-   **Błąd ukończenia ankiety (PATCH)**: Pod formularzem zostanie wyświetlony komunikat o błędzie (np. "Could not complete survey. Check your connection and try again."), a przycisk powróci do stanu aktywnego.

## 11. Kroki implementacji
1.  Utworzenie nowego pliku strony `src/pages/surveys/[slug]/fill.astro`.
2.  W `fill.astro`, zaimplementowanie logiki po stronie serwera do pobierania danych ankiety, zawodów i odpowiedzi użytkownika, a także do obsługi uwierzytelniania i przekierowań.
3.  Stworzenie struktury plików dla komponentów React: `src/components/survey/SurveyFillForm.tsx`, `RatingInput.tsx`, `FeedbackInput.tsx`, `SaveStatusIndicator.tsx`.
4.  Implementacja komponentu `SurveyFillForm.tsx` z logiką zarządzania stanem (`useState`) oraz obsługą cyklu życia odpowiedzi (początkowe pobranie/utworzenie).
5.  Stworzenie i integracja customowego hooka `useSurveyAutoSave` do obsługi opóźnionego zapisu.
6.  Implementacja pozostałych, mniejszych komponentów (`RatingInput`, `FeedbackInput`, `SaveStatusIndicator`) z wykorzystaniem biblioteki Shadcn/ui.
7.  Implementacja logiki przycisku "Ukończ ankietę", włączając walidację i wysłanie finalnego żądania `PATCH` z polem `completed_at`.
8.  Dodanie obsługi stanów ładowania i błędów we wszystkich odpowiednich miejscach.
9.  Aktualizacja istniejącej strony `src/pages/surveys/[slug].astro`, aby przycisk "Rozpocznij ankietę" kierował do nowo utworzonej strony `/surveys/[slug]/fill`.
10. Stworzenie prostej strony z podziękowaniem, np. `src/pages/surveys/[slug]/thanks.astro`, na którą użytkownik będzie przekierowywany po ukończeniu ankiety.
