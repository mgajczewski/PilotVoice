# Plan implementacji widoku Strony Głównej

## 1. Przegląd

Strona główna (`/`) jest punktem wejścia do aplikacji PilotVoice. Jej głównym celem jest prezentacja aplikacji oraz zachęcenie użytkowników do interakcji poprzez rejestrację lub logowanie. Widok ma jasno komunikować wartość produktu - systematyczne zbieranie opinii od uczestników zawodów paralotniowych oraz udostępnianie zagregowanych danych dla organizatorów.

Strona jest statyczna (Astro), z minimalnymi interaktywnymi elementami (przyciski nawigacyjne). Priorytetem jest czytelna, zwięzła komunikacja i intuicyjna nawigacja do formularzy uwierzytelniania.

## 2. Routing widoku

- **Ścieżka**: `/`
- **Plik**: `src/pages/index.astro`
- **Typ**: Strona statyczna (Astro)
- **Dostępność**: Publiczna, bez wymagania uwierzytelnienia

## 3. Struktura komponentów

```
index.astro (Strona główna)
├── Layout.astro (z src/layouts)
│   └── Header (Nawigacja)
│       ├── Logo
│       └── Navigation
│           ├── Button "Zaloguj się" (link do /login)
│           └── Button "Zarejestruj się" (link do /register)
├── HeroSection (Sekcja główna)
│   ├── Headline (Nagłówek główny)
│   ├── Subheadline (Opis wartości produktu)
│   └── CallToActionButtons
│       ├── Button "Zarejestruj się" (primary)
│       └── Button "Zaloguj się" (secondary)
├── FeaturesSection (Opcjonalna sekcja z cechami)
│   └── FeatureCard[] (Lista kart z funkcjonalnościami)
│       ├── Icon
│       ├── Title
│       └── Description
└── Footer (Stopka)
    ├── Copyright
    └── Links (Opcjonalnie: polityka prywatności, kontakt)
```

## 4. Szczegóły komponentów

### 4.1. Layout.astro

- **Opis komponentu**: Główny layout aplikacji zawierający strukturę HTML, meta tagi, style globalne oraz nawigację. Jest to komponent Astro, który opakowuje wszystkie strony aplikacji.
- **Główne elementy**:
  - `<html>`, `<head>` z meta tagami (title, description, viewport, favicon)
  - `<body>` z globalną strukturą
  - Slot dla treści strony
  - Nawigacja górna (Header)
- **Obsługiwane interakcje**: Brak (statyczny)
- **Walidacja**: Brak
- **Typy**: Brak specyficznych typów
- **Propsy**:
  ```typescript
  interface Props {
    title?: string; // Tytuł strony dla <title>
    description?: string; // Opis dla meta description
  }
  ```

### 4.2. Header (Komponent nawigacji)

- **Opis komponentu**: Komponent nawigacji górnej zawierający logo aplikacji oraz przyciski nawigacyjne do logowania i rejestracji. Komponent powinien być responsywny i dobrze wyglądać na urządzeniach mobilnych.
- **Główne elementy**:
  - Kontener nawigacji (`<nav>`)
  - Logo/nazwa aplikacji "PilotVoice" (link do `/`)
  - Kontener przycisków nawigacyjnych:
    - Button/Link "Zaloguj się" (link do `/login`)
    - Button/Link "Zarejestruj się" (link do `/register`)
- **Obsługiwane interakcje**:
  - Kliknięcie logo → przekierowanie do `/`
  - Kliknięcie "Zaloguj się" → przekierowanie do `/login`
  - Kliknięcie "Zarejestruj się" → przekierowanie do `/register`
- **Walidacja**: Brak
- **Typy**: Brak specyficznych typów
- **Propsy**: Brak (statyczny komponent)

### 4.3. HeroSection

- **Opis komponentu**: Główna sekcja strony z komunikatem wartości produktu i przyciskami CTA (Call To Action). Powinna zajmować znaczącą część widoku powyżej foldingu (above the fold) i być wizualnie atrakcyjna.
- **Główne elementy**:
  - Kontener sekcji (`<section>`)
  - Headline (nagłówek H1): np. "PilotVoice - Twój głos w świecie paralotniowych zawodów"
  - Subheadline (podtytuł/opis): Krótki opis (2-3 zdania) wyjaśniający cel aplikacji - systematyczne zbieranie opinii od pilotów, dostęp do zagregowanych danych dla organizatorów
  - Grupa przycisków CTA:
    - Button "Zarejestruj się" (primary, prominent) → link do `/register`
    - Button "Zaloguj się" (secondary, subtle) → link do `/login`
- **Obsługiwane interakcje**:
  - Kliknięcie "Zarejestruj się" → przekierowanie do `/register`
  - Kliknięcie "Zaloguj się" → przekierowanie do `/login`
- **Walidacja**: Brak
- **Typy**: Brak specyficznych typów
- **Propsy**: Brak (statyczny komponent)

### 4.4. FeaturesSection (Opcjonalny)

- **Opis komponentu**: Sekcja prezentująca kluczowe funkcjonalności aplikacji w formie kart. Pomaga użytkownikom zrozumieć wartość produktu przed rejestracją.
- **Główne elementy**:
  - Kontener sekcji (`<section>`)
  - Tytuł sekcji (H2): np. "Jak to działa?"
  - Grid/Flex kontener z kartami funkcjonalności
  - FeatureCard (3-4 karty):
    - Ikona (SVG lub emoji)
    - Tytuł funkcjonalności
    - Krótki opis
- **Przykładowe funkcjonalności**:
  1. **Szybkie ankiety**: Wypełnij standaryzowaną ankietę w kilka minut po zawodach
  2. **Anonimowe opinie**: Twoje odpowiedzi są w pełni anonimowe i bezpieczne
  3. **Wpływ na zmiany**: Pomóż organizatorom doskonalić przyszłe wydarzenia
- **Obsługiwane interakcje**: Brak (prezentacyjny)
- **Walidacja**: Brak
- **Typy**:
  ```typescript
  interface Feature {
    icon: string; // Emoji lub nazwa ikony
    title: string;
    description: string;
  }
  ```
- **Propsy**:
  ```typescript
  interface Props {
    features: Feature[];
  }
  ```

### 4.5. Footer

- **Opis komponentu**: Stopka strony zawierająca informacje o prawach autorskich, rok oraz opcjonalne linki do polityki prywatności i kontaktu.
- **Główne elementy**:
  - Kontener stopki (`<footer>`)
  - Copyright text: "© 2025 PilotVoice. Wszystkie prawa zastrzeżone."
  - Opcjonalne linki nawigacyjne (jeśli dostępne):
    - Polityka prywatności
    - Regulamin
    - Kontakt
- **Obsługiwane interakcje**:
  - Kliknięcie linków → przekierowanie do odpowiednich stron (jeśli istnieją)
- **Walidacja**: Brak
- **Typy**: Brak specyficznych typów
- **Propsy**: Brak (statyczny komponent)

## 5. Typy

Dla strony głównej nie są wymagane specyficzne typy DTO ani ViewModels, ponieważ strona jest statyczna i nie komunikuje się bezpośrednio z API. Opcjonalnie, jeśli implementujemy FeaturesSection jako dynamiczny komponent:

```typescript
/**
 * Reprezentuje pojedynczą funkcjonalność aplikacji prezentowaną na stronie głównej.
 */
interface Feature {
  /**
   * Ikona funkcjonalności (emoji lub nazwa ikony z biblioteki)
   */
  icon: string;
  
  /**
   * Tytuł funkcjonalności
   */
  title: string;
  
  /**
   * Krótki opis funkcjonalności (1-2 zdania)
   */
  description: string;
}

/**
 * Props dla komponentu Layout
 */
interface LayoutProps {
  /**
   * Tytuł strony wyświetlany w <title> oraz w meta tags
   */
  title?: string;
  
  /**
   * Opis strony dla meta description (SEO)
   */
  description?: string;
}
```

## 6. Zarządzanie stanem

Strona główna jest **całkowicie statyczna** i nie wymaga zarządzania stanem. Wszystkie elementy są renderowane po stronie serwera (SSR) przez Astro.

**Brak potrzeby:**
- Stanu lokalnego (useState)
- Kontekstu React (Context API)
- Customowych hooków
- Zarządzania stanem globalnym

Nawigacja odbywa się poprzez standardowe linki HTML (`<a href="...">`) lub komponenty linkujące Astro, co powoduje pełne przeładowanie strony i przejście do odpowiedniego widoku.

## 7. Integracja API

Strona główna **nie wymaga integracji z API**. Jest to czysto prezentacyjny landing page bez wywołań do backendu.

Użytkownik jest kierowany do stron `/login` i `/register`, gdzie odpowiednie formularze będą komunikować się z API Supabase Auth dla procesów uwierzytelniania.

## 8. Interakcje użytkownika

### 8.1. Kliknięcie przycisku "Zarejestruj się" (Hero lub Header)
- **Akcja**: Przekierowanie do `/register`
- **Implementacja**: Link/Button z `href="/register"`
- **Oczekiwany rezultat**: Użytkownik trafia na stronę rejestracji zgodną z US-001

### 8.2. Kliknięcie przycisku "Zaloguj się" (Hero lub Header)
- **Akcja**: Przekierowanie do `/login`
- **Implementacja**: Link/Button z `href="/login"`
- **Oczekiwany rezultat**: Użytkownik trafia na stronę logowania zgodną z US-002

### 8.3. Kliknięcie logo "PilotVoice" (Header)
- **Akcja**: Przekierowanie do `/` (odświeżenie strony głównej)
- **Implementacja**: Link z `href="/"`
- **Oczekiwany rezultat**: Przeładowanie strony głównej

### 8.4. Przewijanie strony
- **Akcja**: Użytkownik przewija stronę, aby zobaczyć sekcję Features i Footer
- **Implementacja**: Standardowe przewijanie przeglądarki
- **Oczekiwany rezultat**: Płynne przewijanie z możliwością zobaczenia wszystkich sekcji

## 9. Warunki i walidacja

Strona główna nie zawiera formularzy ani pól wymagających walidacji. Nie ma warunków biznesowych do sprawdzenia.

**Potencjalne warunki do rozważenia w przyszłości:**
- Jeśli użytkownik jest już zalogowany, możliwe przekierowanie bezpośrednio do dashboardu lub wyświetlenie innej wersji strony (zamiast "Zaloguj się" pokazać "Panel użytkownika")
- Jednak w MVP tego nie implementujemy - strona jest identyczna dla wszystkich

## 10. Obsługa błędów

Ponieważ strona główna jest statyczna i nie zawiera logiki biznesowej ani wywołań API, obsługa błędów jest minimalna:

### 10.1. Błędy renderowania
- **Scenariusz**: Błąd w komponencie Astro podczas SSR
- **Obsługa**: Astro automatycznie wyświetli stronę błędu 500
- **Rozwiązanie**: Upewnij się, że wszystkie komponenty są poprawnie zaimplementowane i przetestowane

### 10.2. Brak zasobów (404)
- **Scenariusz**: Użytkownik próbuje uzyskać dostęp do nieistniejącej strony
- **Obsługa**: Astro przekieruje do strony 404 (należy ją stworzyć)
- **Rozwiązanie**: Implementacja `src/pages/404.astro` z przyjaznym komunikatem i linkiem powrotu do strony głównej

### 10.3. Problemy z ładowaniem zasobów (CSS, obrazy)
- **Scenariusz**: Zasoby statyczne nie mogą być załadowane
- **Obsługa**: Graceful degradation - strona powinna być czytelna nawet bez wszystkich zasobów
- **Rozwiązanie**: Użycie semantycznego HTML, który jest czytelny bez CSS

## 11. Kroki implementacji

### Krok 1: Przygotowanie struktury projektu
- Upewnij się, że `src/layouts/Layout.astro` istnieje i zawiera podstawową strukturę HTML
- Sprawdź konfigurację Tailwind CSS i Shadcn/ui

### Krok 2: Implementacja Layout.astro
- Dodaj propsy `title` i `description` do interfejsu Props
- Skonfiguruj meta tagi w `<head>`:
  - `<title>{title || 'PilotVoice'}</title>`
  - `<meta name="description" content={description || 'Systematyczne zbieranie opinii...'}>`
  - `<meta name="viewport" content="width=device-width, initial-scale=1.0">`
- Dodaj link do favicon
- Dodaj slot dla zawartości strony: `<slot />`

### Krok 3: Implementacja Header (komponent nawigacji)
- Stwórz komponent `src/components/Header.astro` lub sekcję w Layout
- Zaimplementuj responsywną nawigację z:
  - Logo/nazwą "PilotVoice" po lewej (link do `/`)
  - Przyciskami "Zaloguj się" i "Zarejestruj się" po prawej
- Użyj komponentów Button z Shadcn/ui dla spójnego stylowania
- Dodaj style Tailwind dla responsywności (hamburger menu dla mobile opcjonalny w MVP)

### Krok 4: Implementacja Footer
- Stwórz komponent `src/components/Footer.astro`
- Dodaj copyright text: `© ${new Date().getFullYear()} PilotVoice. Wszystkie prawa zastrzeżone.`
- Styluj z użyciem Tailwind (tło kontrastowe, padding, centrowanie)
- Opcjonalnie dodaj linki do przyszłych stron (Polityka prywatności, Kontakt)

### Krok 5: Implementacja HeroSection
- W `src/pages/index.astro` stwórz sekcję hero:
  - Kontener z dużym paddingiem (min-h-screen lub min-h-[80vh])
  - Nagłówek H1 z głównym hasłem (duży font, bold, Tailwind typography)
  - Subheadline/opis wartości produktu (2-3 zdania)
  - Grupa przycisków CTA:
    - Primary Button "Zarejestruj się" (href="/register")
    - Secondary Button "Zaloguj się" (href="/login")
- Użyj komponentów Button z Shadcn/ui
- Zastosuj Tailwind classes dla centrowania i responsywności

### Krok 6: Implementacja FeaturesSection (opcjonalnie)
- Stwórz komponent `src/components/FeatureCard.astro`:
  ```typescript
  interface Props {
    icon: string;
    title: string;
    description: string;
  }
  ```
- W `src/pages/index.astro` dodaj sekcję z features:
  - Tytuł sekcji "Jak to działa?" lub "Kluczowe funkcjonalności"
  - Grid/Flex kontener (3 kolumny na desktop, 1 na mobile)
  - Użyj FeatureCard dla każdej funkcjonalności:
    - Szybkie ankiety
    - Anonimowe opinie
    - Wpływ na zmiany

### Krok 7: Integracja Layout w index.astro
- W `src/pages/index.astro` opakowuj treść layoutem:
  ```astro
  ---
  import Layout from '../layouts/Layout.astro';
  ---
  <Layout 
    title="PilotVoice - Głos pilotów w zawodach paralotniowych"
    description="Systematyczne zbieranie opinii od uczestników zawodów paralotniowych."
  >
    <!-- Treść strony -->
  </Layout>
  ```

### Krok 8: Stylowanie z Tailwind CSS
- Zastosuj utility classes Tailwind dla:
  - Typografii (font-size, font-weight, line-height)
  - Kolorów (zgodnych z designem aplikacji)
  - Spacingu (padding, margin)
  - Responsywności (breakpointy: sm:, md:, lg:, xl:)
- Użyj Tailwind @apply jeśli potrzebne są niestandardowe klasy

### Krok 9: Optymalizacja i responsywność
- Przetestuj widok na różnych rozmiarach ekranu (mobile, tablet, desktop)
- Upewnij się, że przyciski są dostatecznie duże dla urządzeń dotykowych (min 44x44px)
- Sprawdź kontrast tekstu dla dostępności (WCAG AA)
- Zoptymalizuj rozmiar i format obrazów (jeśli są używane)

### Krok 10: Testy manualne
- Sprawdź wszystkie linki:
  - Logo → `/`
  - "Zaloguj się" w Header → `/login`
  - "Zarejestruj się" w Header → `/register`
  - "Zarejestruj się" w Hero → `/register`
  - "Zaloguj się" w Hero → `/login`
- Sprawdź responsywność na różnych urządzeniach
- Przetestuj w różnych przeglądarkach (Chrome, Firefox, Safari, Edge)

### Krok 11: Review i dokumentacja
- Code review przez innego członka zespołu
- Upewnij się, że kod jest czytelny i dobrze skomentowany
- Zaktualizuj dokumentację projektu jeśli potrzeba
- Przygotuj do merge'a do głównej gałęzi

### Krok 12: Deployment
- Sprawdź czy build przechodzi bez błędów: `npm run build`
- Przetestuj production build lokalnie: `npm run preview`
- Deploy na Vercel poprzez push do odpowiedniej gałęzi
- Weryfikacja działania na produkcji

## 12. Dodatkowe uwagi implementacyjne

### 12.1. Dostępność (a11y)
- Użyj semantycznego HTML (`<header>`, `<nav>`, `<main>`, `<section>`, `<footer>`)
- Dodaj odpowiednie atrybuty `aria-label` dla elementów nawigacyjnych
- Upewnij się, że kontrast kolorów spełnia wymogi WCAG AA
- Wszystkie interaktywne elementy muszą być dostępne z klawiatury (tab navigation)

### 12.2. SEO
- Właściwe meta tagi w `<head>` (title, description)
- Użycie nagłówków H1, H2 w odpowiedniej hierarchii
- Dodanie Open Graph tags dla lepszego udostępniania w social media (opcjonalnie)
- Strukturalne dane schema.org (opcjonalnie, do rozważenia w przyszłości)

### 12.3. Performance
- Astro automatycznie optymalizuje JS (0 JS dla statycznych komponentów)
- Rozważyć lazy loading dla obrazów (jeśli są używane): `loading="lazy"`
- Minimalizacja CSS poprzez Tailwind's purge
- Wykorzystanie Astro's built-in optimizations

### 12.4. Zgodność z PRD
Implementacja strony głównej spełnia wymagania PRD:
- **Jasna komunikacja wartości produktu**: HeroSection wyraźnie komunikuje cel aplikacji
- **Wezwania do akcji**: Przyciski "Zaloguj się" i "Zarejestruj się" w widocznych miejscach
- **Prosty i przejrzysty interfejs**: Minimalistyczny design skupiony na kluczowych akcjach
- **Zgodność z US-001 i US-002**: Łatwy dostęp do formularzy rejestracji i logowania

