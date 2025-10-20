# Dokument wymagań produktu (PRD) - PilotVoice MVP

## 1. Przegląd produktu

PilotVoice to aplikacja internetowa dedykowana środowisku paralotniowemu, której celem jest systematyczne zbieranie opinii od uczestników zawodów. Aplikacja pozwala pilotom wypełniać standaryzowane ankiety oceniające różne aspekty rywalizacji. Z drugiej strony, moderatorzy (np. organizatorzy zawodów) otrzymują dostęp do panelu z zagregowanymi, anonimowymi danymi, co pozwala na analizę i wyciąganie wniosków w celu podnoszenia jakości przyszłych wydarzeń. MVP (Minimum Viable Product) skupia się na stworzeniu prostego, ale w pełni funkcjonalnego narzędzia do realizacji tego podstawowego celu, odkładając na później bardziej zaawansowane funkcje, takie jak integracje z zewnętrznymi systemami czy automatyzację.

## 2. Problem użytkownika

W środowisku paralotniowym istnieje wyraźny brak skutecznego kanału do przekazywania informacji zwrotnych dotyczących przebiegu zawodów. Bez systematycznego zbierania opinii od uczestników, organizatorom i organizacjom nadzorującym trudno jest identyfikować obszary wymagające poprawy i podejmować decyzje oparte na danych. Obecne metody zgłaszania uwag są często uciążliwe dla zawodników i nieefektywne, co prowadzi do utraty cennych spostrzeżeń i uniemożliwia systemowe doskonalenie organizacji zawodów paralotniowych w przyszłości.

## 3. Wymagania funkcjonalne

### 3.1. Zarządzanie Użytkownikami
-   Proces rejestracji oparty o adres e-mail i hasło, zabezpieczony mechanizmem "captcha".
-   Możliwość logowania i utrzymywania sesji użytkownika ("pamiętaj mnie").
-   Dwie role w systemie: `Użytkownik` (pilot) oraz `Moderator`.
-   Konto `Super Admina` do manualnego nadawania i odbierania uprawnień `Moderatora`.
-   Prosta strona profilu użytkownika z możliwością zarządzania hasłem oraz dodania numeru CIVL ID lub tekstowego powodu rejestracji.
-   Użytkownik musi uzupełnić profil (CIVL ID lub powód) po wypełnieniu pierwszej ankiety, zanim będzie mógł rozpocząć kolejną.

### 3.2. Proces Wypełniania Ankiety (dla Pilota)
-   Dostęp do ankiet poprzez unikalne, proste linki URL (oraz kody QR).
-   W ramach MVP istnieje jeden standardowy szablon ankiety.
-   Postęp wypełniania ankiety jest zapisywany automatycznie.
-   Statusy ankiety: `started` (rozpoczęta), `completed` (ukończone pola obowiązkowe), `abandoned` (porzucona).
-   Ankieta jest uznawana za porzuconą (`abandoned`), jeśli obowiązkowe pola nie zostaną wypełnione w ciągu konfigurowalnego okresu (np. 1 godzina).
-   Odpowiedzi na pytania otwarte są automatycznie przetwarzane przez AI w celu usunięcia danych osobowych (zgodność z GDPR). Użytkownik widzi swoją oryginalną treść i sugestię AI, ale w systemie zapisywana jest wyłącznie wersja po korekcie.
-   Po wypełnieniu wszystkich obowiązkowych pól, użytkownik jest przekierowywany na stronę z podziękowaniem i zachętą do wypełnienia pytań opcjonalnych oraz uzupełnienia profilu.
-   Użytkownik może wracać do ankiety ze statusem `completed`, aby edytować lub uzupełniać odpowiedzi na pytania opcjonalne, aż do momentu zamknięcia ankiety przez moderatora.
-   Dane z porzuconych ankiet (`abandoned`) są przechowywane w celach analitycznych.

### 3.3. Zarządzanie Ankietami i Panel Moderatora
-   Moderatorzy mogą tworzyć ankiety dla konkretnych zawodów, podając ich nazwę oraz datę rozpoczęcia i zakończenia.
-   Możliwość zdefiniowania opcjonalnego, czytelnego i unikalnego adresu URL dla ankiety.
-   Możliwość zaplanowania daty automatycznego otwarcia i zamknięcia ankiety.
-   Moderatorzy ręcznie wprowadzają liczbę uczestników danych zawodów, co jest niezbędne do mierzenia metryk sukcesu.
-   Dostęp do panelu z zagregowanymi i w pełni anonimowymi wynikami dla każdych zawodów osobno.
-   Panel moderatora prezentuje: średnią ocenę dla pytań zamkniętych, procent wypełnienia pytań otwartych, liczbę uczestników zawodów, oraz liczbę ankiet `completed` i `abandoned`.

## 4. Granice produktu

Następujące funkcjonalności celowo NIE wchodzą w zakres wersji MVP:
-   Automatyczne tworzenie ankiet poprzez integrację z oficjalnym kalendarzem zawodów.
-   Integracja systemu kont użytkowników z zewnętrznymi serwisami uwierzytelniającymi (np. Google, Facebook, CIVL).
-   System notyfikacji (e-mail, push) o ankietach do wypełnienia lub uzupełnienia.
-   Integracja z systemem do raportowania o zdarzeniach bezpieczeństwa.
-   Zaawansowana analiza zebranych danych i generowanie rozbudowanych raportów.
-   Narzędzia do komunikacji moderatorów z wypełniającymi ankiety.
-   System weryfikacji, czy dany użytkownik faktycznie brał udział w ocenianych zawodach.
-   Tłumaczenie aplikacji na inne języki.

## 5. Historyjki użytkowników

### 5.1. Uwierzytelnianie i Zarządzanie Kontem

-   ID: US-001
-   Tytuł: Rejestracja nowego użytkownika
-   Opis: Jako nowy użytkownik, chcę móc założyć konto w aplikacji przy użyciu adresu e-mail i hasła, aby móc wypełniać ankiety.
-   Kryteria akceptacji:
    1.  Formularz rejestracyjny zawiera pola: e-mail, hasło, potwierdzenie hasła.
    2.  System waliduje poprawność formatu adresu e-mail.
    3.  System wymaga, aby hasło miało co najmniej 8 znaków.
    4.  System sprawdza, czy hasło i jego potwierdzenie są identyczne.
    5.  Rejestracja jest zabezpieczona mechanizmem "captcha".
    6.  Po pomyślnej rejestracji, jestem automatycznie zalogowany i przekierowany na stronę główną.
    7.  W przypadku błędu (np. zajęty e-mail), wyświetlany jest czytelny komunikat.

-   ID: US-002
-   Tytuł: Logowanie użytkownika
-   Opis: Jako zarejestrowany użytkownik, chcę móc zalogować się do aplikacji, podając mój e-mail i hasło.
-   Kryteria akceptacji:
    1.  Formularz logowania zawiera pola: e-mail, hasło.
    2.  Po poprawnym zalogowaniu, jestem przekierowany na stronę główną lub stronę, do której próbowałem uzyskać dostęp.
    3.  W przypadku podania błędnych danych, wyświetlany jest odpowiedni komunikat.

-   ID: US-003
-   Tytuł: Utrzymanie sesji ("Pamiętaj mnie")
-   Opis: Jako zalogowany użytkownik, chcę, aby system pamiętał moją sesję przez określony czas, abym nie musiał logować się przy każdej wizycie.
-   Kryteria akceptacji:
    1.  Na stronie logowania znajduje się opcja "Pamiętaj mnie".
    2.  Jeśli opcja jest zaznaczona, moja sesja jest utrzymywana przez 30 dni.
    3.  Po zamknięciu i ponownym otwarciu przeglądarki w tym okresie, pozostaję zalogowany.

-   ID: US-004
-   Tytuł: Wylogowanie użytkownika
-   Opis: Jako zalogowany użytkownik, chcę mieć możliwość wylogowania się z aplikacji.
-   Kryteria akceptacji:
    1.  W interfejsie użytkownika dostępny jest przycisk "Wyloguj".
    2.  Po kliknięciu przycisku, moja sesja jest kończona i jestem przekierowywany na stronę główną.

-   ID: US-005
-   Tytuł: Zarządzanie profilem
-   Opis: Jako zalogowany użytkownik, chcę mieć dostęp do strony "Mój profil", gdzie mogę zarządzać swoim hasłem oraz numerem CIVL ID.
-   Kryteria akceptacji:
    1.  Strona profilu umożliwia zmianę hasła (wymaga podania starego i nowego hasła).
    2.  Strona profilu umożliwia dodanie/edycję numeru CIVL ID lub tekstowego powodu rejestracji.
    3.  Zmiany są zapisywane po zatwierdzeniu przez użytkownika.

### 5.2. Ankieta - Perspektywa Pilota

-   ID: US-006
-   Tytuł: Rozpoczęcie wypełniania ankiety
-   Opis: Jako użytkownik, chcę móc rozpocząć wypełnianie ankiety, klikając na udostępniony mi link.
-   Kryteria akceptacji:
    1.  Dostęp do ankiety przez unikalny URL nie wymaga logowania, ale jeśli nie jestem zalogowany, system poprosi o logowanie/rejestrację.
    2.  Po wejściu na link, ankieta jest wyświetlana, a w systemie otrzymuje status `started`.
    3.  Mój postęp jest automatycznie zapisywany w trakcie wypełniania.

-   ID: US-007
-   Tytuł: Weryfikacja GDPR dla pytań otwartych
-   Opis: Jako użytkownik wypełniający pytanie otwarte, chcę, aby system zwrócł mi uwagę, że moja odpowiedź zawiera dane osobowe i pomógł mi ją poprawić.
-   Kryteria akceptacji:
    1.  Po wpisaniu odpowiedzi w pole otwarte, system (AI) analizuje tekst pod kątem danych osobowych.
    2.  Jeśli potencjalne dane osobowe zostaną znalezione, system wyświetla moją oryginalną treść oraz sugestię wersji zanonimizowanej.
    3.  W bazie danych zapisana zostaje wyłącznie wersja po korekcie AI.

-   ID: US-008
-   Tytuł: Ukończenie obowiązkowej części ankiety
-   Opis: Jako użytkownik, po wypełnieniu wszystkich obowiązkowych pytań, chcę zakończyć tę część ankiety i otrzymać potwierdzenie.
-   Kryteria akceptacji:
    1.  Gdy wszystkie obowiązkowe pola są wypełnione, ankieta w systemie otrzymuje status `completed`.
    2.  Po wypełnieniu wszystkich obowiązkowych pól, widzę informację z podziękowaniem.
    3.  Widzę też informację o możliwości wypełnienia pytań opcjonalnych.

-   ID: US-009
-   Tytuł: Uzupełnianie pytań opcjonalnych
-   Opis: Jako użytkownik, chcę mieć możliwość powrotu do ukończonej ankiety, aby dodać lub zmienić odpowiedzi na pytania opcjonalne.
-   Kryteria akceptacji:
    1.  Mogę edytować odpowiedzi na pytania opcjonalne w ankiecie ze statusem `completed`.
    2.  Możliwość edycji jest zablokowana po zamknięciu ankiety przez moderatora.

-   ID: US-010
-   Tytuł: Wymóg uzupełnienia profilu
-   Opis: Jako użytkownik, który wypełnił swoją pierwszą ankietę, chcę zostać poinformowany o konieczności i celowości uzupełnienia profilu przed wypełnieniem kolejnej.
-   Kryteria akceptacji:
    1.  Po ukończeniu pierwszej ankiety, na stronie z podziękowaniem pojawia się prośba o uzupełnienie profilu (CIVL ID lub powód).
    2.  Gdy próbuję rozpocząć drugą ankietę bez uzupełnionego profilu, jestem blokowany i przekierowywany do strony profilu.

### 5.3. Zarządzanie Ankietami - Perspektywa Moderatora

-   ID: US-011
-   Tytuł: Tworzenie ankiety dla zawodów
-   Opis: Jako moderator, chcę stworzyć nową ankietę dla konkretnych zawodów, podając podstawowe informacje.
-   Kryteria akceptacji:
    1.  Formularz tworzenia ankiety wymaga podania nazwy zawodów oraz daty ich rozpoczęcia i zakończenia.
    2.  Po utworzeniu, ankieta jest widoczna na mojej liście ankiet.
    3.  System generuje unikalny link URL do ankiety.

-   ID: US-012
-   Tytuł: Konfiguracja ankiety
-   Opis: Jako moderator, chcę mieć możliwość skonfigurowania dodatkowych opcji dla ankiety, takich jak własny URL czy harmonogram publikacji.
-   Kryteria akceptacji:
    1.  Mogę ustawić opcjonalny, czytelny URL dla ankiety (np. /zawody-xyz).
    2.  System weryfikuje unikalność niestandardowego URL-a.
    3.  Mogę zaplanować datę i godzinę automatycznego otwarcia i zamknięcia ankiety.

-   ID: US-013
-   Tytuł: Wprowadzanie liczby uczestników
-   Opis: Jako moderator, chcę móc manualnie wprowadzić całkowitą liczbę uczestników zawodów, aby umożliwić systemowi obliczenie wskaźnika partycypacji.
-   Kryteria akceptacji:
    1.  W panelu zarządzania ankietą istnieje pole do wprowadzenia liczby uczestników.
    2.  Wprowadzona wartość jest wykorzystywana do obliczania metryk sukcesu.

-   ID: US-014
-   Tytuł: Podgląd wyników ankiety
-   Opis: Jako moderator, po zamknięciu ankiety, chcę mieć dostęp do strony z podsumowaniem zebranych, zanonimizowanych danych.
-   Kryteria akceptacji:
    1.  Panel wyników jest dostępny dla każdej ankiety osobno.
    2.  Wszystkie dane są prezentowane w formie zagregowanej i anonimowej.
    3.  Panel wyświetla: średnią ocenę dla pytań zamkniętych, procent wypełnienia pytań otwartych, liczbę uczestników, liczbę ankiet `completed` i `abandoned`.

### 5.4. Administracja Systemem - Perspektywa Super Admina

-   ID: US-015
-   Tytuł: Zarządzanie rolami moderatorów
-   Opis: Jako Super Admin, chcę mieć możliwość manualnego nadawania i odbierania uprawnień moderatora zwykłym użytkownikom.
-   Kryteria akceptacji:
    1.  Istnieje panel administracyjny dostępny tylko dla roli Super Admin.
    2.  W panelu mogę wyszukać użytkownika po adresie e-mail.
    3.  Mogę zmienić rolę użytkownika z `Użytkownik` na `Moderator` i odwrotnie.

## 6. Metryki sukcesu

Kluczowe wskaźniki efektywności (KPI) dla wersji MVP oraz sposoby ich mierzenia:

-   *co najmniej 50% zawodników wypełnia ankietę po zawodach*
    -   Sposób mierzenia: Porównanie liczby ankiet ze statusem `completed` z liczbą uczestników wprowadzoną manualnie przez moderatora dla danych zawodów.
    -   Wzór: `(Liczba ankiet completed / Liczba uczestników) * 100%`

-   *co najmniej 75% ankiet z wypełnionymi obowiązkowymi polami w mniej niż 3 minuty*
    -   Sposób mierzenia: Analiza różnicy czasowej między momentem rozpoczęcia ankiety (pierwsza interakcja) a momentem uzyskania statusu `completed`.
    -   Wzór: `COUNT(ankiety WHERE (completion_timestamp - start_timestamp) < 3 minuty) / COUNT(wszystkie ankiety completed) * 100%`

-   *co najmniej 25% ankiet z wypełnionym którymkolwiek polem opcjonalnym*
    -   Sposób mierzenia: Analiza zawartości ankiet ze statusem `completed` w celu sprawdzenia, czy co najmniej jedno pole opcjonalne zostało wypełnione.
    -   Wzór: `COUNT(ankiety WHERE co najmniej jedno pole opcjonalne jest wypełnione) / COUNT(wszystkie ankiety completed) * 100%`

-   *mniej niż 5% porzuconych ankiet bez wypełnionych wszystkich obowiązkowych pól*
    -   Sposób mierzenia: Stosunek liczby ankiet ze statusem `abandoned` do sumy wszystkich rozpoczętych ankiet (`completed` + `abandoned`).
    -   Wzór: `Liczba ankiet abandoned / (Liczba ankiet completed + Liczba ankiet abandoned) * 100%`
