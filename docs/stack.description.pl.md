# Stos technologiczny z uzasadnieniem

## Frontend

-   **Astro 5:** Wybrany ze względu na architekturę "Islands", która pozwala na renderowanie interfejsu po stronie serwera i dostarczanie minimalnej ilości JavaScriptu do klienta. Zapewnia to błyskawiczne ładowanie stron, co jest kluczowe dla ankiet, jednocześnie umożliwiając dodawanie interaktywności tam, gdzie jest potrzebna.
-   **React 19:** Używany do budowy dynamicznych i interaktywnych komponentów, takich jak panel moderatora. Jego integracja z Astro jest bezproblemowa, co pozwala łączyć zalety obu technologii.
-   **TypeScript 5:** Zapewnia bezpieczeństwo typów, co minimalizuje błędy w trakcie developmentu i ułatwia utrzymanie oraz refaktoryzację kodu w przyszłości.
-   **Tailwind 4:** Umożliwia szybkie i spójne stylowanie aplikacji bez opuszczania kodu HTML. Jego "utility-first" podejście przyspiesza pracę nad interfejsem.
-   **Shadcn/ui:** Dostarcza gotowe, dostępne (accessibility) i łatwe do customizacji komponenty UI, co znacząco skraca czas developmentu frontendu i zapewnia wysoką jakość interfejsu.
-   **rc-slider:** Lekka i elastyczna biblioteka do tworzenia suwaków, idealna do pytań ankietowych opartych na skali.

## Backend i Baza Danych

-   **Supabase:** Kluczowy element stosu, który pełni rolę "Backend as a Service". Dostarcza bazę danych PostgreSQL, system autentykacji, automatycznie generowane API i bezpieczne zarządzanie dostępem (Row Level Security). Drastycznie skraca czas potrzebny na stworzenie MVP, eliminując potrzebę pisania backendu od zera.

## Komunikacja z modelami AI

-   **Openrouter.ai:** Agregator modeli AI, który daje elastyczność w wyborze i zmianie dostawcy bez modyfikacji kodu aplikacji. Model płatności `pay-as-you-go` pozwala na minimalizację kosztów na wczesnym etapie projektu.

## CI/CD i Hosting

-   **Github Actions:** Umożliwia automatyzację procesów testowania i wdrażania aplikacji przy każdym `push` do repozytorium, co zapewnia spójność i jakość kodu.
-   **Vercel:** Platforma hostingowa zoptymalizowana pod Astro, oferująca bezproblemowe wdrożenia, automatyczne skalowanie (serverless) i globalną sieć CDN. Jej darmowy plan jest w pełni wystarczający na potrzeby MVP.
