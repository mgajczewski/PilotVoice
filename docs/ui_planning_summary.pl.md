<conversation_summary>
<decisions>
1.  **Lokalizacja i Język**: Wszystkie teksty i komponenty interfejsu użytkownika muszą być domyślnie w języku angielskim.
2.  **Anonimizacja AI w Ankiecie**: Interfejs powinien wyświetlać sugestię AI dotyczącą anonimizacji odpowiedzi tylko wtedy, gdy faktycznie dokonano w niej zmian. Oryginalny tekst użytkownika jest widoczny w polu edycji.
3.  **Wyświetlanie Dat**: Daty rozpoczęcia i zakończenia zawodów muszą być wyświetlane jako data kalendarzowa bez konwersji do lokalnej strefy czasowej użytkownika, aby zapewnić spójność globalną. Inne znaczniki czasu (np. `created_at`) powinny być lokalizowane.
4.  **Komunikacja o Anonimowości**: Informacja o tym, że odpowiedzi są analizowane anonimowo, powinna znaleźć się na stronie informacyjnej ankiety (przed jej rozpoczęciem) oraz na stronie z podziękowaniem (po jej zakończeniu).
5.  **Onboarding Moderatora**: Dla MVP nie będzie specjalnego "stanu powitalnego" dla nowych moderatorów. Zamiast tego zobaczą oni standardowy "stan pusty" na liście zawodów.
6.  **Mechanizm Captcha**: W formularzu rejestracji zostanie zaimplementowany niewidzialny mechanizm Google reCAPTCHA v3.
7.  **Zarządzanie Stanem Profilu**: Globalny kontekst autentykacji (`AuthContext`) będzie przechowywał jedynie flagę boolean (`profileCompleted`), a nie pełne dane profilowe.
8.  **Aktualizacje UI po operacjach CRUD**: W panelu moderatora nie będą stosowane "optimistic updates". Zamiast tego, interfejs będzie blokowany za pomocą wskaźnika ładowania (`spinner`) na czas operacji API.
</decisions>

<matched_recommendations>
1.  **Nawigacja i Role**: Zostanie stworzony jednolity, chroniony obszar (`/panel`) z dynamicznie renderowanymi elementami nawigacji w zależności od roli zalogowanego użytkownika (`user`, `moderator`, `super_admin`).
2.  **Przepływ Rozpoczynania Ankiety**: Niezalogowany użytkownik po kliknięciu "Rozpocznij ankietę" jest przekierowywany do logowania/rejestracji, a następnie z powrotem do formularza ankiety.
3.  **Automatyczny Zapis Ankiety**: Postęp wypełniania ankiety będzie zapisywany automatycznie co 5 sekund (przy użyciu "debouncingu") w przypadku wykrycia zmian w formularzu.
4.  **Stany Komponentów (Ładowanie/Pusty/Błąd)**: Kluczowe komponenty pobierające dane (np. tabele) zaimplementują dedykowane widoki dla stanu ładowania (`skeleton screen`), stanu pustego (z komunikatem i "call-to-action") oraz stanu błędu (z opcją ponowienia próby).
5.  **Walidacja Formularzy**: Walidacja w formularzach będzie uruchamiana w czasie rzeczywistym po zdarzeniu `onBlur` dla danego pola, z komunikatami o błędach wyświetlanymi bezpośrednio pod nim.
6.  **Responsywność Tabel**: Tabele z dużą ilością danych (np. lista zawodów) będą na urządzeniach mobilnych transformowane w listę kart (`Card`), gdzie każda karta reprezentuje jeden wiersz.
7.  **Dostępność (Zarządzanie Fokusem)**: W interakcjach z oknami modalnymi fokus klawiatury będzie "uwięziony" wewnątrz modala i po jego zamknięciu wróci do elementu, który go wywołał.
8.  **Obsługa Błędów API**: Błędy będą obsługiwane globalnie przez system powiadomień "toast" (dla błędów serwera) oraz lokalnie w formularzach (dla błędów walidacji). Błędy autoryzacji (401/403) spowodują przekierowanie na stronę logowania.
</matched_recommendations>

<ui_architecture_planning_summary>
### Główne Wymagania Architektury UI

Architektura UI dla PilotVoice MVP zostanie zbudowana w oparciu o stack technologiczny: **Astro 5** dla routingu i stron statycznych oraz **React 19** dla dynamicznych "wysp interaktywności". Interfejs będzie wykorzystywał **Tailwind CSS** oraz bibliotekę komponentów **Shadcn/ui**. Kluczowe wymagania to podejście **mobile-first** dla widoków użytkownika (wypełnianie ankiety) oraz **desktop-first** dla paneli administracyjnych, z zachowaniem używalności na mniejszych ekranach. Wszystkie teksty w UI będą w języku **angielskim**.

### Kluczowe Widoki, Ekrany i Przepływy Użytkownika

-   **Widoki Publiczne**: Strona główna, Logowanie, Rejestracja, Strona informacyjna o ankiecie.
-   **Widoki Użytkownika (Rola `user`)**: Formularz ankiety, Strona profilu, Panel użytkownika (z listą wypełnionych ankiet).
-   **Widoki Moderatora (Rola `moderator`)**: Panel z listą zawodów (tabela/karty), formularze tworzenia/edycji zawodów i ankiet, widok zagregowanych wyników ankiety.
-   **Widoki Super Admina (Rola `super_admin`)**: Panel zarządzania rolami użytkowników z wyszukiwarką.

**Główne Przepływy**:
1.  **Wypełnianie Ankiety**: Użytkownik trafia na stronę ankiety przez unikalny link, jest proszony o logowanie/rejestrację, a następnie wypełnia formularz z autozapisem. Po zakończeniu jest informowany o konieczności uzupełnienia profilu.
2.  **Tworzenie Ankiety**: Moderator loguje się, tworzy nowe zawody, a następnie w ramach tych zawodów tworzy ankietę i otrzymuje link do udostępnienia.
3.  **Zarządzanie Rolami**: Super Admin wyszukuje użytkownika po e-mailu i zmienia jego rolę za pomocą dedykowanego interfejsu.

### Strategia Integracji z API i Zarządzania Stanem

-   **Zarządzanie Stanem**: Aplikacja będzie wykorzystywać **React Context API** do zarządzania stanem globalnym, unikając dodatkowych zależności. Powstaną co najmniej dwa konteksty: `AuthContext` (przechowujący sesję, dane użytkownika i flagę `profileCompleted`) oraz `NotificationContext` (do obsługi globalnych powiadomień). Stan lokalny będzie zarządzany przez hooki `useState` i `useReducer`.
-   **Integracja z API**: Komunikacja z API będzie realizowana przez standardowy `fetch` opakowany w dedykowane funkcje serwisowe. Aplikacja będzie obsługiwać błędy API i stany ładowania, informując o nich użytkownika. Dla MVP nie planuje się zaawansowanego buforowania danych po stronie klienta.

### Kwestie Dotyczące Responsywności, Dostępności i Bezpieczeństwa

-   **Responsywność**: Interfejs ankiety będzie w pełni responsywny. Panele administracyjne będą używały adaptacyjnych layoutów, zmieniając np. tabele w listy kart na mniejszych ekranach.
-   **Dostępność**: Komponenty z `Shadcn/ui` zapewnią solidną podstawę dla dostępności (semantyczny HTML, ARIA). Szczególna uwaga zostanie zwrócona na zarządzanie focusem klawiatury w elementach takich jak okna modalne.
-   **Bezpieczeństwo**: Formularz rejestracji będzie chroniony przez niewidzialny mechanizm **Google reCAPTCHA v3**. Dostęp do poszczególnych widoków i funkcji będzie kontrolowany na poziomie UI w oparciu o rolę użytkownika pobraną z `AuthContext`, przy czym ostatecznym źródłem prawdy pozostaje API i polityki RLS w bazie danych.

</ui_architecture_planning_summary>
</conversation_summary>
