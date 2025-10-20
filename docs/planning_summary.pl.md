<conversation_summary>
<decisions>
1.  **Rejestracja i Weryfikacja:** Rejestracja będzie otwarta dla każdego, zabezpieczona mechanizmem "captcha". Weryfikacja uczestnictwa w zawodach nie jest częścią MVP. Po wypełnieniu pierwszej ankiety, użytkownik będzie zobligowany do uzupełnienia w profilu numeru CIVL ID lub podania powodu rejestracji, zanim będzie mógł wypełnić kolejną ankietę.
2.  **Weryfikacja GDPR:** Odpowiedzi na pytania otwarte będą automatycznie przetwarzane przez AI w celu usunięcia danych osobowych. Użytkownik zobaczy swoją oryginalną treść i sugestię AI, ale w systemie zapisana zostanie wyłącznie wersja po korekcie AI.
3.  **Statusy Ankiety:** Ankieta będzie miała status `started` po rozpoczęciu. Po wypełnieniu wszystkich obowiązkowych pól, status zmieni się na `completed`. Jeśli użytkownik nie uzupełni obowiązkowych pól w ciągu konfigurowalnego okresu (np. 1 godziny), ankieta otrzyma status `abandoned`.
4.  **Panel Moderatora:** Moderatorzy będą mieli dostęp do strony z podsumowaniem danych dla każdych zawodów osobno. Widok będzie zawierał: średnią ocenę dla pytań zamkniętych, procent wypełnienia pytań otwartych, liczbę uczestników zawodów (wprowadzaną manualnie), oraz liczbę ankiet `completed` i `abandoned`.
5.  **Szablon Ankiety:** W ramach MVP będzie istniał jeden, standardowy szablon ankiety dla wszystkich zawodów.
6.  **Dostęp do Ankiet:** Dostęp będzie realizowany poprzez proste linki URL oraz kody QR. Moderatorzy będą mogli opcjonalnie ustawić własny, czytelny URL dla ankiety, a system będzie weryfikował jego unikalność.
7.  **Edycja Ankiet:** Użytkownicy będą mogli wracać do ankiet ze statusem `completed`, aby uzupełnić lub zmienić odpowiedzi na pytania opcjonalne, aż do momentu zamknięcia ankiety przez moderatora.
8.  **Dane z Porzuconych Ankiet:** Dane z ankiet o statusie `abandoned` będą przechowywane w systemie w celach analitycznych.
9.  **Role i Uprawnienia:** Wprowadzony zostanie prosty podział na role `Użytkownik` i `Moderator`. Uprawnienia moderatora będą nadawane manualnie przez konto `Super Admina`.
10. **Priorytety po MVP:** Główne kierunki rozwoju po MVP to integracja z zewnętrznymi systemami uwierzytelniania oraz wprowadzenie bardziej zaawansowanej analizy zebranych danych.
</decisions>

<matched_recommendations>
1.  Moderatorzy będą ręcznie wprowadzać liczbę uczestników danych zawodów, co umożliwi mierzenie kluczowego wskaźnika sukcesu (procent wypełnionych ankiet).
2.  Proces rejestracji będzie wymagał podania minimalnej ilości danych (e-mail i hasło), aby zminimalizować barierę wejścia.
3.  Moderatorzy otrzymają możliwość planowania daty otwarcia i zamknięcia ankiet, co ułatwi zarządzanie procesem zbierania opinii.
4.  Wszystkie dane w panelu moderatora będą prezentowane w formie zagregowanej i w pełni anonimowej, aby zachęcić użytkowników do szczerości.
5.  Po wypełnieniu obowiązkowych pytań użytkownik zostanie przekierowany na stronę z podziękowaniem, gdzie znajdzie się prośba o uzupełnienie profilu (CIVL ID) oraz o wypełnienie pytań opcjonalnych.
6.  Aplikacja będzie posiadała prostą podstronę "Mój profil", gdzie użytkownik będzie mógł zarządzać swoim hasłem oraz numerem CIVL ID.
7.  Wprowadzony zostanie mechanizm "pamiętaj mnie", który będzie utrzymywał sesję zalogowanego użytkownika przez określony czas (np. 30 dni), zwiększając wygodę korzystania z aplikacji.
</matched_recommendations>

<prd_planning_summary>
### Główne wymagania funkcjonalne produktu

*   **Zarządzanie Użytkownikami:**
    *   Prosta rejestracja za pomocą adresu e-mail i hasła, zabezpieczona mechanizmem "captcha".
    *   Dwie role w systemie: `Użytkownik` i `Moderator`, zarządzane przez `Super Admina`.
    *   Profil użytkownika z możliwością dodania/edycji CIVL ID lub tekstowego powodu rejestracji.
    *   Mechanizm sesji "pamiętaj mnie".

*   **Proces Wypełniania Ankiety (dla Pilota):**
    *   Dostęp do ankiety poprzez unikalny link (URL).
    *   Automatyczny zapis postępów w trakcie wypełniania.
    *   Po udzieleniu odpowiedzi na wszystkie obowiązkowe pytania, ankieta otrzymuje status `completed`.
    *   Automatyczna weryfikacja GDPR dla pytań otwartych z wykorzystaniem AI; w systemie zapisywana jest wersja po korekcie.
    *   Po zakończeniu części obowiązkowej, użytkownik widzi podziękowanie i prośbę o uzupełnienie pytań opcjonalnych oraz danych profilowych.
    *   Użytkownik musi uzupełnić profil (CIVL ID) przed przystąpieniem do wypełniania *drugiej* ankiety.

*   **Zarządzanie Ankietami (dla Moderatora):**
    *   Tworzenie ankiet dla konkretnych zawodów (wymagane: nazwa, data rozpoczęcia i zakończenia).
    *   Możliwość ustawienia opcjonalnego, czytelnego i unikalnego URL-a dla ankiety.
    *   Możliwość zaplanowania daty automatycznego otwarcia i zamknięcia ankiety.
    *   Dostęp do panelu z anonimowymi, zagregowanymi wynikami (średnie oceny, statystyki ukończeń).

### Kluczowe historie użytkownika i ścieżki korzystania

*   **Nowy Użytkownik (Pilot):** Jako pilot, chcę szybko założyć konto i wypełnić ankietę dotyczącą zawodów, w których brałem udział. Po jej zakończeniu, chcę zostać poproszony o uzupełnienie mojego numeru CIVL ID w profilu, aby moje przyszłe opinie były bardziej wiarygodne.
*   **Moderator:** Jako moderator, chcę w prosty sposób stworzyć ankietę dla danych zawodów, zdefiniować jej nazwę oraz daty dostępności, a następnie udostępnić uczestnikom prosty link. Po zakończeniu zbierania danych, chcę mieć dostęp do przejrzystego podsumowania wyników, aby móc wyciągnąć wnioski na przyszłość.

### Ważne kryteria sukcesu i sposoby ich mierzenia

*   **co najmniej 50% zawodników wypełnia ankietę po zawodach:** Mierzone poprzez porównanie liczby ankiet `completed` z liczbą uczestników wprowadzoną manualnie przez moderatora.
*   **co najmniej 75% ankiet z wypełnionymi obowiązkowymi polami w mniej niż 3 minuty:** Mierzone poprzez analizę czasu od otwarcia ankiety do uzyskania statusu `completed`.
*   **co najmniej 25% ankiet z wypełnionym którymkolwiek polem opcjonalnym:** Mierzone poprzez analizę zawartości ankiet `completed`.
*   **mniej niż 5% porzuconych ankiet bez wypełnionych wszystkich obowiązkowych pól:** Mierzone poprzez stosunek ankiet ze statusem `abandoned` do sumy wszystkich rozpoczętych ankiet (`completed` + `abandoned`).

</prd_planning_summary>

<unresolved_issues>
*   Brak zdefiniowanej finalnej listy pytań, ich typów (skala, jednokrotny/wielokrotny wybór, otwarte) oraz treści dla standardowego szablonu ankiety.
</unresolved_issues>
</conversation_summary>