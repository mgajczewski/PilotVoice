# Konfiguracja środowiska testowego

Ten dokument opisuje konfigurację środowiska testowego dla projektu PilotVoice.

## Stos technologiczny

### Testy jednostkowe
- **Vitest** - Szybki framework do testów jednostkowych oparty na Vite
- **@testing-library/react** - Narzędzia do testowania komponentów React
- **@testing-library/user-event** - Symulacja interakcji użytkownika
- **@testing-library/jest-dom** - Niestandardowe matchery Jest dla DOM
- **@faker-js/faker** - Generowanie fałszywych danych do testów
- **jsdom** - Implementacja DOM dla Node.js

### Testy E2E
- **Playwright** - Framework do testów end-to-end
- **Chromium** - Przeglądarka do uruchamiania testów E2E

## Struktura projektu

```
PilotVoice/
├── test/                           # Testy jednostkowe
│   ├── setup.ts                    # Globalna konfiguracja testów
│   ├── helpers/                    # Pomocniki i narzędzia testowe
│   │   ├── index.ts
│   │   ├── mocks.ts               # Implementacje mocków
│   │   └── testData.ts            # Generatory danych testowych
│   ├── components/                # Testy komponentów
│   │   └── auth/
│   └── lib/                       # Testy serwisów/narzędzi
│       ├── services/
│       └── utils.test.ts
├── e2e/                           # Testy E2E
│   ├── fixtures/                  # Fixtures testowe
│   │   └── index.ts              # Rozszerzony test z obiektami stron
│   ├── pages/                    # Page Object Models
│   │   ├── BasePage.ts           # Bazowa klasa strony
│   │   ├── HomePage.ts
│   │   ├── LoginPage.ts
│   │   └── index.ts
│   └── tests/                    # Specyfikacje testów E2E
│       ├── home.spec.ts
│       ├── login.spec.ts
│       └── navigation.spec.ts
├── vitest.config.ts              # Konfiguracja Vitest
└── playwright.config.ts          # Konfiguracja Playwright
```

## Konfiguracja

### Konfiguracja Vitest

Plik `vitest.config.ts` jest skonfigurowany z:

- **Środowisko**: `jsdom` do testowania DOM
- **Pliki setup**: `./test/setup.ts` dla globalnej konfiguracji
- **Globals**: Włączone dla lepszego DX
- **Coverage**: Provider v8 z raportami text, json i html
- **Aliasy ścieżek**: `@` wskazuje na `./src`

### Konfiguracja Playwright

Plik `playwright.config.ts` jest skonfigurowany z:

- **Katalog testów**: `./e2e`
- **Przeglądarka**: Tylko Chromium (Desktop Chrome)
- **Równoległe wykonanie**: Włączone dla szybszych testów
- **Base URL**: `http://localhost:3000`
- **Trace**: Przy pierwszej próbie
- **Zrzuty ekranu**: Tylko przy błędach
- **Wideo**: Zachowane przy błędach
- **Serwer WWW**: Automatycznie uruchamia `npm run dev` przed testami

## Skrypty NPM

### Testy jednostkowe

```bash
# Uruchom wszystkie testy jednostkowe
npm test

# Uruchom testy w trybie watch (dla developmentu)
npm run test:watch

# Uruchom testy z trybem UI (wizualny eksplorator testów)
npm run test:ui

# Wygeneruj raport pokrycia
npm run test:coverage
```

### Testy E2E

```bash
# Uruchom wszystkie testy E2E
npm run test:e2e

# Uruchom testy E2E z trybem UI
npm run test:e2e:ui

# Uruchom testy E2E w trybie headed (widzisz przeglądarkę)
npm run test:e2e:headed

# Debuguj testy E2E
npm run test:e2e:debug

# Generuj kod testowy używając codegen
npm run test:e2e:codegen
```

### Uruchom wszystkie testy

```bash
# Uruchom zarówno testy jednostkowe jak i E2E
npm run test:all
```

## Wytyczne testowania

### Najlepsze praktyki testów jednostkowych

#### Używanie Vitest

1. **Podwójne testy z obiektem `vi`**
   ```typescript
   import { vi } from 'vitest';
   
   // Funkcje mockowe
   const mockFn = vi.fn();
   
   // Szpiegowanie istniejących funkcji
   const spy = vi.spyOn(object, 'method');
   
   // Globalne mocki
   vi.stubGlobal('fetch', mockFetch);
   ```

2. **Wzorce fabryki mocków**
   ```typescript
   // Umieść na najwyższym poziomie
   vi.mock('@/lib/services/authService', () => ({
     authService: {
       login: vi.fn(),
       logout: vi.fn(),
     }
   }));
   ```

3. **Struktura testu (Arrange-Act-Assert)**
   ```typescript
   describe('Feature', () => {
     it('should do something', () => {
       // Arrange - przygotowanie
       const input = 'test';
       
       // Act - działanie
       const result = doSomething(input);
       
       // Assert - sprawdzenie
       expect(result).toBe('expected');
     });
   });
   ```

4. **Inline Snapshots**
   ```typescript
   expect(complexObject).toMatchInlineSnapshot(`
     {
       "prop": "value",
     }
   `);
   ```

5. **Testowanie komponentów React**
   ```typescript
   import { render, screen } from '@testing-library/react';
   import userEvent from '@testing-library/user-event';
   
   describe('Button', () => {
     it('handles click events', async () => {
       const user = userEvent.setup();
       const handleClick = vi.fn();
       
       render(<Button onClick={handleClick}>Kliknij mnie</Button>);
       
       await user.click(screen.getByRole('button'));
       
       expect(handleClick).toHaveBeenCalledOnce();
     });
   });
   ```

### Najlepsze praktyki testów E2E

#### Używanie Playwright

1. **Page Object Model**
   ```typescript
   import { BasePage } from './BasePage';
   
   export class LoginPage extends BasePage {
     readonly emailInput = this.page.locator('[name="email"]');
     readonly passwordInput = this.page.locator('[name="password"]');
     readonly submitButton = this.page.locator('button[type="submit"]');
     
     async login(email: string, password: string) {
       await this.emailInput.fill(email);
       await this.passwordInput.fill(password);
       await this.submitButton.click();
     }
   }
   ```

2. **Używanie Fixtures**
   ```typescript
   import { test, expect } from '../fixtures';
   
   test('użytkownik może się zalogować', async ({ loginPage }) => {
     await loginPage.goto();
     await loginPage.login('user@example.com', 'password');
     
     await expect(loginPage.page).toHaveURL('/dashboard');
   });
   ```

3. **Konteksty przeglądarki**
   ```typescript
   test('izolowany test', async ({ browser }) => {
     const context = await browser.newContext();
     const page = await context.newPage();
     
     // Test z izolowanym kontekstem
     
     await context.close();
   });
   ```

4. **Testowanie API**
   ```typescript
   test('endpoint API zwraca poprawne dane', async ({ request }) => {
     const response = await request.get('/api/surveys');
     
     expect(response.ok()).toBeTruthy();
     const data = await response.json();
     expect(data).toHaveLength(5);
   });
   ```

5. **Testowanie wizualne**
   ```typescript
   test('strona ma poprawny wygląd', async ({ page }) => {
     await page.goto('/');
     await expect(page).toHaveScreenshot();
   });
   ```

## Pliki konfiguracyjne

### Setup testów (`test/setup.ts`)

Plik setup konfiguruje:
- Czyszczenie React Testing Library
- Mock `window.matchMedia`
- Mock `IntersectionObserver`
- Mock `ResizeObserver`
- Niestandardowe matchery Jest-DOM

### Fixtures E2E (`e2e/fixtures/index.ts`)

Zapewnia wstępnie skonfigurowane obiekty stron:
- `homePage`: Instancja HomePage
- `loginPage`: Instancja LoginPage

## Typowe wzorce

### Mockowanie Supabase

```typescript
vi.mock('@/db/supabase.client', () => ({
  createClient: vi.fn(() => ({
    auth: {
      signIn: vi.fn(),
      signOut: vi.fn(),
      getSession: vi.fn(),
    },
    from: vi.fn(() => ({
      select: vi.fn(),
      insert: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    })),
  })),
}));
```

### Generowanie danych testowych z Faker

```typescript
import { faker } from '@faker-js/faker';

const mockUser = {
  id: faker.string.uuid(),
  email: faker.internet.email(),
  name: faker.person.fullName(),
  createdAt: faker.date.past(),
};
```

### Testowanie komponentów Astro

Komponenty Astro są renderowane po stronie serwera, więc powinny być testowane z testami E2E używając Playwright, a nie testami jednostkowymi.

## Continuous Integration

Testy są automatycznie uruchamiane w pipeline CI/CD:
- Testy jednostkowe uruchamiane przy każdym commicie
- Testy E2E uruchamiane przy pull requestach
- Raporty pokrycia są generowane i śledzone

## Rozwiązywanie problemów

### Problemy z Vitest

1. **Błędy rozwiązywania modułów**: Sprawdź aliasy w `vitest.config.ts`
2. **Błędy jsdom**: Upewnij się, że `environment: 'jsdom'` jest ustawione
3. **Mock nie działa**: Sprawdź, czy fabryka mocka jest na najwyższym poziomie

### Problemy z Playwright

1. **Przeglądarka nie znaleziona**: Uruchom `npx playwright install chromium`
2. **Błędy timeout**: Zwiększ timeout w `playwright.config.ts`
3. **Problemy z serwerem WWW**: Sprawdź `baseURL` i upewnij się, że serwer dev działa

## Zasoby

- [Dokumentacja Vitest](https://vitest.dev/)
- [Dokumentacja Playwright](https://playwright.dev/)
- [Dokumentacja Testing Library](https://testing-library.com/)
- [Dokumentacja Faker.js](https://fakerjs.dev/)

