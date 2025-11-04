<conversation_summary>
<decisions>
1.  **Zarządzanie rolami**: Role użytkowników (`User`, `Moderator`, `Super Admin`) będą zarządzane w tabeli `profiles`, powiązanej jeden-do-jednego z tabelą `auth.users` z Supabase. Trigger automatycznie utworzy profil dla każdego nowego użytkownika.
2.  **Główne encje**: `Competitions` i `Surveys` będą oddzielnymi encjami, aby umożliwić elastyczność w przyszłości. Zawody mogą mieć jedną ankietę w MVP.
3.  **Odpowiedzi na ankiety**: Tabela z odpowiedziami użytkowników będzie nazywać się `survey_responses`. Będzie zawierała ograniczenie unikalności na `(user_id, survey_id)`, aby zapobiec wielokrotnym zgłoszeniom.
4.  **Struktura ankiety MVP**: Dla MVP tabela `survey_responses` będzie bezpośrednio zawierać kolumny dla `overall_rating` (INTEGER 1-10) i `open_feedback` (TEXT), upraszczając początkowy schemat.
5.  **Obliczanie statusu**: Status `abandoned` dla odpowiedzi na ankietę będzie określany dynamicznie za pomocą `VIEW` w bazie danych, a nie przechowywany jako stan. Widok obliczy status na podstawie znaczników czasu `created_at` i `completed_at`.
6.  **Uprawnienia (RLS)**:
    *   **Users**: Mogą tworzyć, odczytywać i aktualizować tylko swoje własne odpowiedzi na ankiety.
    *   **Moderators**: Mają pełne uprawnienia CRUD do `competitions` i `surveys`, wszystkie uprawnienia Users i dostęp `SELECT` (odczyt) do wszystkich `survey_responses`.
    *   **Super Admins**: Dziedziczą wszystkie uprawnienia Moderators i dodatkowo mogą zarządzać rolami użytkowników w tabeli `profiles`.
7.  **Anonimizacja danych**: Tylko zaanonimizowana przez AI wersja otwartych opinii będzie przechowywana w bazie danych, aby zapewnić zgodność z GDPR.
8.  **Szczegóły zawodów**: Tabela `competitions` będzie używać klucza głównego `INTEGER` i będzie zawierać pola dla `city`, `country_code` (ISO 3166-1 alpha-3) oraz `tasks_count`.
9.  **Integralność danych**: Ograniczenia `CHECK` będą używane do zapewnienia logicznej kolejności dat (np. `ends_at > starts_at`) i prawidłowych formatów dla URL slugs.
10. **URL ankiety**: Kolumna `slug` w tabeli `surveys` będzie przechowywać przyjazną dla użytkownika część URL. Częściowy indeks unikalny zapewni unikalność dla wartości innych niż null.
11. **Znaczniki czasu**: Kluczowe tabele będą zawierać kolumnę `updated_at`, automatycznie zarządzaną przez trigger bazy danych, aby śledzić czas ostatniej modyfikacji.
12. **Domyślny stan ankiety**: Ankieta będzie uznawana za zamkniętą domyślnie, jeśli jej daty `opens_at` i `closes_at` nie są ustawione (są `NULL`).
</decisions>

<matched_recommendations>
1.  **Profile użytkowników i role**: Utwórz tabelę `profiles` z relacją jeden-do-jednego z `auth.users`, aby obsługiwać dane użytkowników i role specyficzne dla aplikacji.
2.  **Dynamiczny status**: Użyj `VIEW` w bazie danych do dynamicznego obliczania statusu `abandoned` dla odpowiedzi na ankiety, centralizując logikę i upraszczając backend.
3.  **Uproszczony schemat MVP**: Dodaj kolumny `overall_rating` i `open_feedback` bezpośrednio do tabeli `survey_responses`, aby uprościć początkowy model, odkładając złożoną strukturę pytań/odpowiedzi.
4.  **Bezpieczeństwo oparte na rolach (RLS)**: Zaimplementuj polityki Row-Level Security, aby ściśle kontrolować dostęp do danych: użytkownicy mogą uzyskać dostęp tylko do swoich odpowiedzi, podczas gdy moderatorzy mają szerszy dostęp do odczytu wyników i pełną kontrolę nad zawodami/ankietami.
5.  **Unikalne zgłoszenia**: Wymuś ograniczenie `UNIQUE` na kombinacji `user_id` i `survey_id` w tabeli `survey_responses`, aby zapobiec duplikatom.
6.  **Typy danych i ograniczenia**: Użyj określonych typów danych, takich jak `ENUM` dla ról, `TIMESTAMPTZ` dla dat, `CHAR(3)` dla kodów krajów ISO i ograniczeń `CHECK`, aby wymusić integralność danych na poziomie bazy danych.
7.  **URL Slugs**: Użyj kolumny `TEXT` dla URL slugs z częściowym indeksem unikalnym, aby zapewnić unikalność przy jednoczesnym dopuszczeniu wartości `NULL`.
8.  **Automatyczne znaczniki czasu**: Zaimplementuj trigger, aby automatycznie aktualizować kolumnę `updated_at` przy zmianach rekordów, zapewniając niezawodny dziennik audytu.
</matched_recommendations>

<database_planning_summary>
### a. Główne wymagania dotyczące schematu bazy danych
Schemat bazy danych dla MVP PilotVoice zostanie zbudowany w oparciu o PostgreSQL i Supabase. Główne założenia to prostota, skalowalność i bezpieczeństwo. Schemat musi obsługiwać uwierzytelnianie użytkowników, zarządzanie zawodami i ankietami, zbieranie odpowiedzi oraz rozróżnianie uprawnień dla różnych ról. Kluczowe jest zapewnienie anonimowości odpowiedzi i integralności danych poprzez użycie odpowiednich typów danych i ograniczeń.

### b. Kluczowe encje i ich relacje
1.  **`profiles`**: Przechowuje dane użytkowników. Relacja 1-do-1 z `auth.users`. Zawiera `user_id`, `role`, opcjonalne `civl_id` i `registration_reason`.
2.  **`competitions`**: Przechowuje informacje o zawodach. Zawiera `id`, `name`, daty, `city`, `country_code`, `tasks_count` i `participant_count`.
3.  **`surveys`**: Definiuje ankiety. Posiada relację N-do-1 z `competitions` (`competition_id`). Zawiera `id`, daty otwarcia/zamknięcia i opcjonalny unikalny `slug` URL.
4.  **`survey_responses`**: Przechowuje odpowiedzi pilotów na ankiety. Relacja N-do-1 z `users` (`user_id`) oraz N-do-1 z `surveys` (`survey_id`). W MVP zawiera `overall_rating` i `open_feedback`.

### c. Ważne kwestie dotyczące bezpieczeństwa i skalowalności
*   **Bezpieczeństwo**: Dostęp do danych będzie ściśle kontrolowany przez Row-Level Security (RLS) w PostgreSQL. Użytkownicy będą mieli dostęp tylko do swoich danych. Moderatorzy będą mieli dostęp do zarządzania zawodami/ankietami i odczytu wszystkich odpowiedzi, ale nie ich edycji. Super Admin będzie zarządzał rolami.
*   **Skalowalność**: Oddzielenie encji `competitions` i `surveys` pozwala na przyszłą rozbudowę. Uproszczony model odpowiedzi w MVP można w przyszłości zmigrować do bardziej złożonej struktury pytań i odpowiedzi bez naruszania istniejących danych. Użycie indeksów na kluczach obcych i często filtrowanych kolumnach zapewni wydajność.

</database_planning_summary>=
</conversation_summary>

