# Plan Testów dla Aplikacji PilotVoice

---

### **1. Wprowadzenie i Cele Testów**

*   **Cel dokumentu:** Niniejszy dokument określa strategię, zakres, zasoby i harmonogram testowania aplikacji PilotVoice. Jego celem jest zapewnienie wysokiej jakości produktu końcowego poprzez systematyczną weryfikację funkcjonalności, wydajności i bezpieczeństwa.

*   **Zakres testów:** Testom poddane zostaną następujące moduły i funkcjonalności:
    *   **Moduł uwierzytelniania:** Rejestracja (`RegisterForm`), logowanie (`LoginForm`), wylogowywanie, przypomnienie i zmiana hasła (`ForgotPasswordForm`, `UpdatePasswordForm`, `ChangePasswordForm`), aktualizacja profilu użytkownika (`UserProfileForm`).
    *   **Moduł ankiet:** Wypełnianie ankiety (`SurveyFillForm`), wyświetlanie informacji o ankiecie (`SurveyInfoCard`), walidacja danych wejściowych, automatyczne zapisywanie postępów (`useSurveyAutoSave`), obsługa ostrzeżenia RODO (`GdprWarning`).
    *   **API Backendowe:** Wszystkie punkty końcowe w `src/pages/api`, w tym operacje na ankietach (`survey-responses`), uwierzytelnianiu (`auth`), zawodach (`competitions`) i profilu użytkownika (`user`).
    *   **Serwisy backendowe:** Logika biznesowa zawarta w `src/lib/services`, w szczególności `surveyResponseService`, `surveyService`, `competitionService` oraz `anonymizationService`.
    *   **Integracja z AI:** Proces anonimizacji danych tekstowych z wykorzystaniem `openrouterService` w ramach `anonymizationService` oraz jego weryfikacja przez endpoint `check-gdpr`.

*   **Elementy poza zakresem:**
    *   **Testy obciążeniowe infrastruktury Supabase i Vercel:** Zakładamy, że dostawcy tych usług zapewniają odpowiednią skalowalność i niezawodność. Testy skupią się na wydajności samej aplikacji.
    *   **Bezpośrednie testy modeli AI w OpenRouter:** Testowana będzie integracja z usługą i poprawność przetwarzania danych przez aplikację, a nie jakość samego modelu językowego.
    *   **Testy statycznych stron informacyjnych:** Strony takie jak `index.astro` (jeśli nie zawierają dynamicznej logiki) zostaną pominięte w testach funkcjonalnych.

### **2. Analiza Priorytetów i Ryzyka**

*   **Priorytetowe obszary funkcjonalne:**
    1.  **Proces wypełniania i przesyłania ankiety:** Jest to kluczowa funkcjonalność aplikacji. Należy zapewnić jej niezawodność, poprawne zapisywanie danych i intuicyjność interfejsu.
    2.  **Uwierzytelnianie i autoryzacja:** Bezpieczeństwo danych użytkowników jest krytyczne. Należy dokładnie przetestować logowanie, rejestrację oraz ochronę endpointów API.
    3.  **Usługa anonimizacji danych (GDPR/RODO):** Błędne działanie tego modułu może prowadzić do poważnych konsekwencji prawnych i utraty zaufania użytkowników. Endpoint `check-gdpr` i logika `anonymizationService` muszą być gruntownie sprawdzone.
    4.  **Pobieranie i wyświetlanie danych o zawodach i ankietach:** Użytkownik musi mieć bezproblemowy dostęp do listy ankiet, do których jest uprawniony.

*   **Potencjalne ryzyka:**
    *   **Ryzyko wycieku danych osobowych:** Nieprawidłowa anonimizacja w `anonymizationService` może prowadzić do ujawnienia danych wrażliwych. **Mitygacja:** Rygorystyczne testy jednostkowe i integracyjne serwisu anonimizacji, weryfikacja działania endpointu `check-gdpr` z różnorodnymi danymi wejściowymi.
    *   **Ryzyko utraty danych z ankiety:** Błędy w logice automatycznego zapisu (`useSurveyAutoSave`) lub podczas finalnego przesyłania ankiety mogą frustrować użytkowników. **Mitygacja:** Testy E2E symulujące różne scenariusze (np. utrata połączenia, zamknięcie przeglądarki) oraz testy integracyjne API.
    *   **Ryzyko błędów w logice biznesowej po stronie serwera:** Złożoność logiki w `surveyResponseService` może prowadzić do nieprawidłowego przetwarzania odpowiedzi. **Mitygacja:** Dokładne pokrycie serwisu testami jednostkowymi.
    *   **Ryzyko niekompatybilności przeglądarek:** Interfejs użytkownika oparty na React i Tailwind może zachowywać się różnie w zależności od przeglądarki. **Mitygacja:** Przeprowadzenie testów E2E na najpopularniejszych przeglądarkach (Chrome, Firefox, Safari).

### **3. Strategia Testowania**

*   **Podejście ogólne:** Strategia oparta na ryzyku, z naciskiem na automatyzację na wszystkich poziomach testowania. Testy będą pisane równolegle z rozwojem nowych funkcjonalności, zgodnie z zasadami Continuous Integration.

*   **Poziomy i typy testów:**
    *   **Testy jednostkowe:**
        *   **Cel:** Weryfikacja logiki pojedynczych funkcji i komponentów w izolacji.
        *   **Technologia:** Vitest do testowania logiki biznesowej w serwisach (`src/lib/services`), funkcji pomocniczych (`src/lib/utils.ts`) oraz schematów walidacji (`src/lib/schemas`). Do generowania danych testowych wykorzystywany jest `@faker-js/faker`.
        *   **Przykład:** Testowanie funkcji `createSurveyResponse` w `surveyResponseService` z zaślepionym klientem Supabase, aby sprawdzić, czy poprawnie przetwarza dane wejściowe.
    *   **Testy komponentów:**
        *   **Cel:** Weryfikacja zachowania komponentów React w izolacji, szybsza alternatywa dla testów E2E.
        *   **Technologia:** Vitest w połączeniu z `@testing-library/react` i `@testing-library/user-event` do symulacji interakcji użytkownika z komponentami.
        *   **Przykład:** Testowanie komponentu `SurveyFillForm`, sprawdzenie walidacji pól formularza, wyświetlania komunikatów błędów oraz interakcji z przyciskami.
    *   **Testy integracyjne:**
        *   **Cel:** Sprawdzenie poprawności współpracy pomiędzy różnymi częściami systemu.
        *   **Technologia:** Vitest/Jest w połączeniu z Supabase Test Helpers do testowania integracji serwisów z bazą danych oraz endpointów API.
        *   **Przykład:** Test endpointu `POST /api/survey-responses`, który sprawdza, czy dane wysłane z frontendu są poprawnie walidowane, przetwarzane przez serwis i zapisywane w bazie danych.
    *   **Testy E2E (End-to-End):**
        *   **Cel:** Symulacja rzeczywistych scenariuszy użycia aplikacji z perspektywy użytkownika końcowego.
        *   **Technologia:** Playwright lub Cypress do automatyzacji interakcji w przeglądarce.
        *   **Przykład:** Scenariusz, w którym użytkownik rejestruje się, loguje, przechodzi do ankiety, wypełnia ją, a następnie wylogowuje się. Test weryfikuje cały ten przepływ.
    *   **Testy wydajnościowe:**
        *   **Cel:** Ocena, jak aplikacja zachowuje się pod obciążeniem.
        *   **Technologia:** Artillery do generowania obciążenia na kluczowych endpointach API. Prostsze w konfiguracji niż k6, z konfiguracją opartą na YAML i lepszym raportowaniem.
        *   **Przykład:** Test obciążeniowy dla endpointu `POST /api/survey-responses` oraz `POST /api/survey-responses/check-gdpr`, aby zmierzyć czas odpowiedzi przy symulacji jednoczesnego przesyłania wielu ankiet.
    *   **Testy bezpieczeństwa:**
        *   **Cel:** Identyfikacja podstawowych podatności i ochrona przed zagrożeniami w łańcuchu dostaw.
        *   **Technologia:** Użycie narzędzi takich jak `npm audit` oraz **Snyk** do skanowania zależności i wykrywania podatności. Snyk oferuje lepszą detekcję zagrożeń i jest bezpłatny dla projektów open source. Weryfikacja, czy wszystkie endpointy API mają poprawnie zaimplementowaną autoryzację i walidację danych wejściowych.
        *   **Przykład:** Próba dostępu do chronionego endpointu (np. `GET /api/user/profile`) bez aktywnej sesji (tokenu JWT) i weryfikacja otrzymania błędu 401. Automatyczne skanowanie Snyk w pipeline CI/CD.

### **4. Środowisko i Narzędzia Testowe**

*   **Konfiguracja środowiska:**
    *   **Środowisko lokalne:** Uruchamianie testów jednostkowych i integracyjnych lokalnie z wykorzystaniem lokalnej instancji Supabase (za pomocą Supabase CLI).
    *   **Środowisko CI/CD (GitHub Actions):** Automatyczne uruchamianie testów jednostkowych i integracyjnych po każdym pushu do repozytorium.
    *   **Środowisko Staging:** Dedykowana instancja aplikacji na Vercel połączona z osobnym projektem Supabase (baza danych "staging"). Na tym środowisku będą uruchamiane testy E2E.

*   **Narzędzia:**
    *   **Framework do testów:** Vitest (szybki i kompatybilny z Vite, którego używa Astro).
    *   **Testy komponentów:** `@testing-library/react` i `@testing-library/user-event` do testowania komponentów React w izolacji.
    *   **Generowanie danych testowych:** `@faker-js/faker` do tworzenia realistycznych danych testowych (e-maile, nazwiska, numery telefonów, itp.).
    *   **Automatyzacja E2E:** Playwright (nowoczesne i wszechstronne narzędzie).
    *   **Testy wydajnościowe:** Artillery (konfiguracja YAML, lepsze raportowanie, łatwiejsza integracja).
    *   **Bezpieczeństwo:** Snyk do skanowania podatności w zależnościach, `npm audit` jako dodatkowe narzędzie.
    *   **Zarządzanie testami i defektami:** GitHub Issues / Projects.
    *   **CI/CD:** GitHub Actions.
    *   **Testy API (manualne):** Postman lub Thunder Client (wtyczka do VS Code).

### **5. Przykładowe Scenariusze Testowe**

*   **ID Scenariusza:** E2E-01
*   **Opis:** Pomyślne wypełnienie i przesłanie ankiety przez zalogowanego użytkownika.
*   **Kroki do wykonania:**
    1.  Otwórz stronę logowania.
    2.  Wprowadź poprawne dane uwierzytelniające i kliknij "Zaloguj".
    3.  Przejdź do strony z listą ankiet.
    4.  Wybierz i otwórz ankietę "Testowa ankieta".
    5.  Wypełnij wszystkie pola formularza poprawnymi danymi.
    6.  Upewnij się, że wskaźnik zapisu pokazuje stan "Zapisano".
    7.  Kliknij przycisk "Zakończ i wyślij".
*   **Oczekiwany rezultat:** Użytkownik zostaje przeniesiony na stronę z podziękowaniem (`/surveys/[slug]/thanks`). W bazie danych, w tabeli `survey_responses`, pojawia się nowy wpis z danymi z ankiety powiązany z ID użytkownika.

---

*   **ID Scenariusza:** INT-01
*   **Opis:** Weryfikacja endpointu anonimizacji tekstu.
*   **Kroki do wykonania:**
    1.  Wyślij żądanie POST na endpoint `/api/survey-responses/check-gdpr`.
    2.  W ciele żądania przekaż obiekt JSON zawierający tekst z danymi osobowymi, np. `{"text": "Mój email to jan.kowalski@example.com, a numer telefonu 123-456-789."}`.
    3.  Dołącz nagłówek autoryzacji z poprawnym tokenem JWT.
*   **Oczekiwany rezultat:** Serwer odpowiada statusem 200 OK. Ciało odpowiedzi zawiera obiekt JSON ze wskaźnikiem `isGdprCompliant: false` oraz zidentyfikowanymi danymi, np. `{"isGdprCompliant":false,"violations":[{"type":"EMAIL", "value":"jan.kowalski@example.com"}, ...]}`.

---

*   **ID Scenariusza:** UNIT-01
*   **Opis:** Test logiki serwisu `anonymizationService` dla tekstu bez danych osobowych.
*   **Kroki do wykonania:**
    1.  Zaimportuj funkcję `checkGdprCompliance` z `anonymizationService`.
    2.  Wywołaj funkcję, przekazując jako argument tekst, który nie zawiera danych osobowych, np. `"To jest świetna inicjatywa, wszystko mi się podoba."`.
    3.  Zaślepi (mock) wywołanie do `openrouterService`, aby zwracał pustą listę naruszeń.
*   **Oczekiwany rezultat:** Funkcja zwraca obiekt `{ isGdprCompliant: true, violations: [] }`.

### **6. Kryteria Wejścia i Wyjścia**

*   **Kryteria rozpoczęcia testów:**
    *   Funkcjonalność została zaimplementowana i przeszła pomyślnie code review.
    *   Build aplikacji na środowisku testowym (staging) kończy się powodzeniem.
    *   Wszystkie zależności (np. dostęp do bazy danych Supabase) na środowisku testowym są poprawnie skonfigurowane.

*   **Kryteria zakończenia testów:**
    *   100% krytycznych scenariuszy testowych (E2E i integracyjnych) zakończyło się powodzeniem.
    *   Pokrycie kodu testami jednostkowymi dla logiki biznesowej w serwisach przekracza 80%.
    *   Brak znanych błędów krytycznych lub blokujących.
    *   Wszystkie zgłoszone błędy o wysokim priorytecie zostały naprawione i zweryfikowane.

### **7. Raportowanie i Śledzenie Defektów**

*   **Proces zgłaszania błędów:** Każdy znaleziony błąd zostanie zgłoszony jako "Issue" w repozytorium GitHub projektu. Zgłoszenie powinno zawierać:
    *   Tytuł jasno opisujący problem.
    *   Szczegółowe kroki do reprodukcji błędu.
    *   Opis rezultatu oczekiwanego i faktycznego.
    *   Zrzuty ekranu lub logi (jeśli dotyczy).
    *   Etykiety (`bug`, priorytet: `critical`/`high`/`medium`/`low`, nazwa modułu np. `auth`).
*   **Metryki:**
    *   **Liczba otwartych defektów wg priorytetu:** Śledzona na bieżąco w GitHub Projects.
    *   **Pokrycie kodu testami:** Monitorowane za pomocą narzędzi zintegrowanych w CI/CD (np. Codecov).
    *   **Procentowy postęp wykonania testów E2E:** Mierzony na podstawie liczby scenariuszy zakończonych powodzeniem w danym cyklu testowym.
