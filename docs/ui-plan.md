# Architektura UI dla PilotVoice

## 1. Przegląd struktury UI

Architektura interfejsu użytkownika (UI) dla PilotVoice została zaprojektowana w oparciu o podejście modułowe, z wyraźnym podziałem na widoki publiczne, dostępne dla wszystkich, oraz chroniony panel, którego zawartość dynamicznie dostosowuje się do roli zalogowanego użytkownika (`user`, `moderator`, `super_admin`).

Struktura opiera się na następujących filarach:
- **Widoki publiczne**: Obejmują strony niezbędne do prezentacji aplikacji oraz zarządzania uwierzytelnianiem, takie jak strona główna, logowanie i rejestracja.
- **Chroniony Panel (`/panel`)**: Centralny obszar aplikacji, który stanowi punkt wejścia do wszystkich funkcji specyficznych dla ról. Nawigacja i dostępne widoki wewnątrz panelu są renderowane warunkowo.
- **Zorientowanie na zadania**: Każdy widok jest zaprojektowany w celu realizacji konkretnego zadania (np. wypełnienie ankiety, utworzenie zawodów, zarządzanie rolami), co minimalizuje złożoność i ułatwia nawigację.
- **Komponenty reużywalne**: Architektura silnie opiera się na generycznych, reużywalnych komponentach (np. formularze, tabele, modale), co zapewnia spójność wizualną i przyspiesza rozwój.

## 2. Lista widoków

### Widoki publiczne

- **Nazwa widoku**: Strona główna
  - **Ścieżka**: `/`
  - **Główny cel**: Prezentacja aplikacji i zachęcenie do interakcji.
  - **Kluczowe informacje**: Krótki opis celów PilotVoice, wezwania do akcji ("Zaloguj się", "Zarejestruj").
  - **Kluczowe komponenty**: Nagłówek, sekcja "Hero", stopka.
  - **Względy**: Jasna i zwięzła komunikacja wartości produktu.

- **Nazwa widoku**: Logowanie
  - **Ścieżka**: `/login`
  - **Główny cel**: Uwierzytelnienie istniejącego użytkownika.
  - **Kluczowe informacje**: Formularz z polami na e-mail i hasło, opcja "Pamiętaj mnie".
  - **Kluczowe komponenty**: Formularz logowania, obsługa błędów, link do strony rejestracji.
  - **Względy**: Komunikaty o błędach (np. "Nieprawidłowe dane logowania").

- **Nazwa widoku**: Rejestracja
  - **Ścieżka**: `/register`
  - **Główny cel**: Umożliwienie nowym użytkownikom założenia konta.
  - **Kluczowe informacje**: Formularz (e-mail, hasło, potwierdzenie hasła).
  - **Kluczowe komponenty**: Formularz rejestracji, walidacja pól w czasie rzeczywistym, link do strony logowania.
  - **Względy bezpieczeństwa**: Niewidzialna implementacja reCAPTCHA v3 w celu ochrony przed botami.

- **Nazwa widoku**: Strona informacyjna ankiety
  - **Ścieżka**: `/survey/[slug]`
  - **Główny cel**: Przedstawienie podstawowych informacji o ankiecie i zachęcenie do jej rozpoczęcia.
  - **Kluczowe informacje**: Nazwa i daty zawodów, informacja o anonimowości odpowiedzi.
  - **Kluczowe komponenty**: Przycisk "Rozpocznij ankietę" (inicjujący proces logowania/rejestracji, jeśli to konieczne).
  - **Względy**: Jasne poinformowanie użytkownika o celu ankiety i zapewnienie o poufności danych.

### Widoki chronione (Rola: `user`)

- **Nazwa widoku**: Formularz ankiety
  - **Ścieżka**: `/survey/[slug]/fill`
  - **Główny cel**: Zbieranie opinii od pilota na temat zawodów.
  - **Kluczowe informacje**: Zestaw pytań (obowiązkowe/opcjonalne), wskaźnik autozapisu.
  - **Kluczowe komponenty**: Pola formularza (gwiazdki, pola tekstowe), dynamicznie pojawiająca się sugestia anonimizacji AI, wskaźnik ładowania podczas zapisu.
  - **Względy UX**: Automatyczny zapis co 5 sekund (debounced) w celu minimalizacji ryzyka utraty danych.

- **Nazwa widoku**: Strona z podziękowaniem
  - **Ścieżka**: `/survey/[slug]/thank-you`
  - **Główny cel**: Potwierdzenie ukończenia ankiety i wskazanie kolejnych kroków.
  - **Kluczowe informacje**: Komunikat z podziękowaniem, wezwanie do uzupełnienia profilu (jeśli to pierwsza ankieta).
  - **Kluczowe komponenty**: Link do edycji pytań opcjonalnych, link do strony profilu.
  - **Względy**: Wzmocnienie pozytywnego doświadczenia użytkownika.

- **Nazwa widoku**: Panel Użytkownika / Moje ankiety
  - **Ścieżka**: `/panel/my-surveys`
  - **Główny cel**: Wyświetlenie historii wypełnionych ankiet.
  - **Kluczowe informacje**: Lista ankiet z nazwą zawodów, datą i statusem.
  - **Kluczowe komponenty**: Lista, stany "pusty" i "ładowania".

- **Nazwa widoku**: Mój profil
  - **Ścieżka**: `/panel/profile`
  - **Główny cel**: Zarządzanie danymi konta.
  - **Kluczowe informacje**: Formularze do zmiany hasła oraz edycji CIVL ID / powodu rejestracji.
  - **Kluczowe komponenty**: Dwa oddzielne formularze, powiadomienia "toast" o sukcesie/błędzie operacji.
  - **Względy bezpieczeństwa**: Wymóg podania starego hasła przy jego zmianie.

### Widoki chronione (Rola: `moderator`)

- **Nazwa widoku**: Panel Moderatora / Lista zawodów
  - **Ścieżka**: `/panel/competitions`
  - **Główny cel**: Zarządzanie zawodami i przypisanymi do nich ankietami.
  - **Kluczowe informacje**: Tabela zawodów z kluczowymi danymi (nazwa, daty, status ankiety).
  - **Kluczowe komponenty**: Tabela z paginacją i sortowaniem, przycisk "Dodaj zawody", menu kontekstowe dla każdego wiersza (Edytuj, Zarządzaj ankietą, Zobacz wyniki).
  - **Względy**: Responsywność tabeli (transformacja w listę kart na mobile).

- **Nazwa widoku**: Formularz zawodów (Tworzenie/Edycja)
  - **Ścieżka**: `/panel/competitions/new` | `/panel/competitions/[id]/edit`
  - **Główny cel**: Wprowadzanie i aktualizacja danych o zawodach.
  - **Kluczowe informacje**: Formularz z polami: nazwa, daty, lokalizacja, liczba uczestników.
  - **Kluczowe komponenty**: Formularz z walidacją, wskaźnik ładowania na przycisku zapisu.

- **Nazwa widoku**: Konfiguracja ankiety
  - **Ścieżka**: `/panel/competitions/[id]/survey`
  - **Główny cel**: Konfiguracja parametrów ankiety powiązanej z zawodami.
  - **Kluczowe informacje**: Formularz z polami: data otwarcia/zamknięcia, niestandardowy URL.
  - **Kluczowe komponenty**: Generowanie i wyświetlanie unikalnego linku do ankiety, który można skopiować.

- **Nazwa widoku**: Wyniki ankiety
  - **Ścieżka**: `/panel/surveys/[id]/results`
  - **Główny cel**: Prezentacja zagregowanych i anonimowych wyników.
  - **Kluczowe informacje**: Kluczowe metryki (średnia ocena, wskaźnik ukończenia, etc.), wykresy.
  - **Kluczowe komponenty**: Karty ze statystykami, wizualizacje danych.
  - **Względy**: Zapewnienie pełnej anonimowości prezentowanych danych.

### Widoki chronione (Rola: `super_admin`)

- **Nazwa widoku**: Panel Super Admina / Zarządzanie użytkownikami
  - **Ścieżka**: `/panel/admin/users`
  - **Główny cel**: Zarządzanie rolami użytkowników.
  - **Kluczowe informacje**: Lista użytkowników z ich rolami.
  - **Kluczowe komponenty**: Pole wyszukiwania (po e-mailu), tabela z użytkownikami, przełącznik do zmiany roli (`user`/`moderator`).
  - **Względy**: Jasne potwierdzenie przed zmianą roli, aby uniknąć przypadkowych działań.

## 3. Mapa podróży użytkownika

### Przepływ 1: Pilot wypełnia ankietę

1.  **Wejście**: Użytkownik klika w unikalny link do ankiety.
2.  **Strona informacyjna**: Widzi stronę `/survey/[slug]` z podstawowymi danymi i klika "Rozpocznij".
3.  **Uwierzytelnienie**:
    -   Jeśli nie jest zalogowany, zostaje przekierowany na `/login`. Po pomyślnym logowaniu (lub rejestracji na `/register`) wraca automatycznie na ścieżkę `/survey/[slug]/fill`.
    -   Jeśli jest zalogowany, przechodzi bezpośrednio do formularza.
4.  **Wypełnianie**: Użytkownik wypełnia formularz ankiety na stronie `/survey/[slug]/fill`. Postęp jest autozapisywany.
5.  **Ukończenie**: Po wypełnieniu pól obowiązkowych klika "Zakończ" i zostaje przekierowany na stronę `/survey/[slug]/thank-you`.
6.  **Kolejne kroki**: Na stronie z podziękowaniem widzi zachętę do uzupełnienia profilu (jeśli to wymagane), co prowadzi go do `/panel/profile`.

### Przepływ 2: Moderator tworzy zawody i ankietę

1.  **Logowanie**: Moderator loguje się i wchodzi do panelu.
2.  **Lista zawodów**: Widzi listę na `/panel/competitions` i klika "Dodaj zawody".
3.  **Tworzenie zawodów**: Wypełnia formularz na `/panel/competitions/new` i zapisuje.
4.  **Konfiguracja ankiety**: Po utworzeniu zawodów, z listy na `/panel/competitions` wybiera opcję "Zarządzaj ankietą" dla nowo utworzonej pozycji.
5.  **Generowanie linku**: Na stronie `/panel/competitions/[id]/survey` konfiguruje ankietę (np. daty) i kopiuje wygenerowany unikalny link, aby go udostępnić pilotom.
6.  **Podgląd wyników**: Po zamknięciu ankiety, wraca na `/panel/competitions` i wybiera opcję "Zobacz wyniki", aby przejść do `/panel/surveys/[id]/results`.

## 4. Układ i struktura nawigacji

- **Nawigacja publiczna**: Prosty nagłówek z logo aplikacji oraz przyciskami "Zaloguj się" / "Zarejestruj się".
- **Nawigacja w panelu**:
  -   Po zalogowaniu użytkownik trafia do obszaru `/panel`.
  -   Po lewej stronie znajduje się stałe menu nawigacyjne (sidebar).
  -   Zawartość menu jest renderowana dynamicznie w zależności od roli użytkownika pobranej z `AuthContext`.
  -   **Użytkownik (`user`)** widzi linki: "Moje ankiety", "Mój profil".
  -   **Moderator** widzi linki: "Zawody", "Mój profil".
  -   **Super Admin** widzi linki: "Zarządzaj użytkownikami", "Mój profil".
  -   W nagłówku panelu znajduje się nazwa użytkownika i przycisk "Wyloguj".

## 5. Kluczowe komponenty

- **`ProtectedLayout`**: Komponent-layout otaczający wszystkie widoki w `/panel`. Sprawdza stan uwierzytelnienia i rolę użytkownika, w razie potrzeby przekierowując na stronę logowania.
- **`DataTable`**: Reużywalny komponent tabeli z wbudowaną obsługą sortowania, paginacji i responsywności (transformacja w karty). Używany w panelu moderatora i super admina.
- **`SurveyForm`**: Główny komponent formularza ankiety, zarządzający stanem odpowiedzi, logiką autozapisu i interakcją z mechanizmem anonimizacji AI.
- **`RoleBasedRenderer`**: Komponent pomocniczy, który renderuje swoje dzieci (`children`) tylko wtedy, gdy rola zalogowanego użytkownika pasuje do zdefiniowanych uprawnień. Używany do ukrywania/pokazywania elementów UI (np. przycisków, linków w menu).
- **`ToastNotification`**: Globalny system powiadomień (typu "toast") do informowania użytkownika o wynikach operacji (np. "Profil zaktualizowany pomyślnie") lub błędach API.
- **`Modal`**: Komponent okna modalnego używany do potwierdzania krytycznych akcji (np. "Czy na pewno chcesz usunąć te zawody?"). Zapewnia odpowiednie zarządzanie focusem dla dostępności.
- **`Form`**: Reużywalny komponent formularza, który integruje się z biblioteką do walidacji i obsługuje stany ładowania oraz wyświetlanie błędów pod polami.
