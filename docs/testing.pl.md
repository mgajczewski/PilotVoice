# Dokumentacja Testowania

## Przegląd

Ten dokument opisuje środowisko testowe oraz najlepsze praktyki dla projektu PilotVoice.

## Stack Technologiczny

### Testy Jednostkowe
- **Vitest** - Szybki i nowoczesny runner testów
- **@testing-library/react** - Narzędzia do testowania komponentów React
- **@testing-library/user-event** - Symulacja interakcji użytkownika
- **@faker-js/faker** - Generowanie danych testowych
- **jsdom** - Środowisko DOM dla testów

### Testy E2E
- **Playwright** - Nowoczesny framework do testów E2E
- **Chromium** - Przeglądarka do uruchamiania testów

## Struktura Projektu

```
├── test/                           # Testy jednostkowe
│   ├── setup.ts                   # Globalna konfiguracja testów
│   ├── helpers/                   # Narzędzia testowe
│   │   ├── testData.ts           # Generatory danych testowych
│   │   ├── mocks.ts              # Fabryki mocków
│   │   └── index.ts              # Eksporty
│   ├── components/               # Testy komponentów
│   │   └── auth/
│   │       └── LoginForm.test.tsx
│   └── lib/                      # Testy serwisów/narzędzi
│       ├── utils.test.ts
│       └── services/
│           └── authService.test.ts
│
├── e2e/                           # Testy E2E
│   ├── pages/                    # Modele obiektów stron
│   │   ├── BasePage.ts          # Klasa bazowa strony
│   │   ├── HomePage.ts          # Strona główna
│   │   ├── LoginPage.ts         # Strona logowania
│   │   └── index.ts             # Eksporty
│   ├── fixtures/                # Fixtures testowe
│   │   └── index.ts            # Niestandardowe rozszerzenia testów
│   └── tests/                   # Specyfikacje testów
│       ├── home.spec.ts
│       ├── login.spec.ts
│       └── navigation.spec.ts
│
├── vitest.config.ts              # Konfiguracja Vitest
└── playwright.config.ts          # Konfiguracja Playwright
```

## Uruchamianie Testów

### Testy Jednostkowe

```bash
# Uruchom wszystkie testy jednostkowe
npm test

# Uruchom testy w trybie watch
npm run test:watch

# Uruchom testy z interfejsem UI
npm run test:ui

# Uruchom testy z raportem pokrycia kodu
npm run test:coverage
```

### Testy E2E

```bash
# Uruchom wszystkie testy E2E
npm run test:e2e

# Uruchom testy E2E z trybem UI
npm run test:e2e:ui

# Uruchom testy E2E z widoczną przeglądarką
npm run test:e2e:headed

# Debuguj testy E2E
npm run test:e2e:debug

# Generuj testy E2E za pomocą codegen
npm run test:e2e:codegen
```

### Uruchom Wszystkie Testy

```bash
# Uruchom zarówno testy jednostkowe jak i E2E
npm run test:all
```

## Pisanie Testów Jednostkowych

### Wytyczne

1. **Używaj opisowych nazw testów** - Nazwy testów powinny jasno opisywać co jest testowane
2. **Stosuj wzorzec AAA** - Arrange, Act, Assert (Przygotuj, Wykonaj, Sprawdź)
3. **Używaj właściwego mockowania** - Mockuj zewnętrzne zależności za pomocą `vi.mock()` i `vi.fn()`
4. **Testuj zachowanie użytkownika** - Skup się na tym, jak użytkownicy wchodzą w interakcję z komponentami
5. **Zachowuj izolację testów** - Każdy test powinien być niezależny

### Przykład: Test Komponentu

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { MyComponent } from '@/components/MyComponent';

describe('MyComponent', () => {
  it('renderuje się poprawnie', () => {
    render(<MyComponent />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('obsługuje interakcję użytkownika', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();
    
    render(<MyComponent onClick={handleClick} />);
    await user.click(screen.getByRole('button'));
    
    expect(handleClick).toHaveBeenCalled();
  });
});
```

### Przykład: Test Serwisu

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateTestUser } from '../../helpers/testData';
import { createMockSupabaseClient } from '../../helpers/mocks';

describe('MyService', () => {
  let mockClient: ReturnType<typeof createMockSupabaseClient>;

  beforeEach(() => {
    mockClient = createMockSupabaseClient();
    vi.clearAllMocks();
  });

  it('wykonuje operację pomyślnie', async () => {
    const testData = generateTestUser();
    mockClient.from().select.mockResolvedValue({ data: testData, error: null });
    
    const result = await myService.getData(mockClient);
    
    expect(result).toEqual(testData);
  });
});
```

## Pisanie Testów E2E

### Wytyczne

1. **Używaj Page Object Model** - Enkapsuluj interakcje ze stroną w obiektach stron
2. **Pisz czytelne testy** - Testy powinny czytać się jak user stories
3. **Używaj właściwych lokatorów** - Preferuj lokatory oparte na rolach i tekście
4. **Obsługuj async poprawnie** - Zawsze czekaj na operacje asynchroniczne
5. **Testuj rzeczywiste ścieżki użytkownika** - Skup się na kompletnych podróżach użytkownika

### Przykład: Page Object

```typescript
import { type Page, type Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class LoginPage extends BasePage {
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;

  constructor(page: Page) {
    super(page);
    this.emailInput = page.getByRole('textbox', { name: /email/i });
    this.passwordInput = page.getByLabel(/password|hasło/i);
    this.submitButton = page.getByRole('button', { name: /login|zaloguj/i });
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }
}
```

### Przykład: Specyfikacja Testu

```typescript
import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';

test.describe('Przepływ Logowania', () => {
  test('użytkownik może zalogować się z poprawnymi danymi', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    
    await loginPage.login('test@example.com', 'password123');
    
    expect(page.url()).toContain('/profile');
  });
});
```

### Używanie Fixtures

Fixtures ułatwiają ponowne wykorzystanie obiektów stron w testach:

```typescript
import { test, expect } from '../fixtures';

test('test nawigacji', async ({ homePage, loginPage }) => {
  await homePage.goto();
  await homePage.navigateToLogin();
  expect(await loginPage.isLoaded()).toBeTruthy();
});
```

## Najlepsze Praktyki

### Najlepsze Praktyki Testów Jednostkowych

1. **Mockuj zewnętrzne zależności** - Używaj `vi.mock()` dla modułów, `vi.fn()` dla funkcji
2. **Używaj zapytań Testing Library** - Preferuj `getByRole`, `getByLabelText` zamiast `querySelector`
3. **Testuj dostępność** - Używaj zapytań opartych na rolach aby zapewnić dostępny markup
4. **Zachowuj szybkość testów** - Mockuj wywołania API i unikaj niepotrzebnych opóźnień
5. **Używaj faker do danych testowych** - Generuj realistyczne dane testowe z `@faker-js/faker`

### Najlepsze Praktyki Testów E2E

1. **Jedna przeglądarka wystarczy** - Skup się na Chromium dla szybszych testów
2. **Używaj Page Object Model** - Utrzymuj testy łatwe w utrzymaniu i czytelne
3. **Unikaj zakodowanych na sztywno czekań** - Używaj funkcji auto-waiting Playwright
4. **Testuj krytyczne ścieżki** - Skup się na przepływach użytkownika, które są najważniejsze
5. **Używaj codegen do eksploracji** - Użyj `npm run test:e2e:codegen` aby eksplorować aplikację

## Debugowanie

### Testy Jednostkowe

```bash
# Uruchom konkretny plik testowy
npm test -- LoginForm.test.tsx

# Uruchom z UI dla lepszego debugowania
npm run test:ui

# Użyj debuggera
# Dodaj statement `debugger` w swoim teście i uruchom z flagą --inspect
```

### Testy E2E

```bash
# Tryb debugowania - krok po kroku przez testy
npm run test:e2e:debug

# Tryb UI - wizualny runner testów
npm run test:e2e:ui

# Tryb headed - zobacz akcje przeglądarki
npm run test:e2e:headed

# Zobacz pliki trace (po niepowodzeniu testu)
npx playwright show-trace trace.zip
```

## Integracja CI/CD

Testy są zaprojektowane do uruchamiania w środowiskach CI:

- Testy jednostkowe działają szybko i mogą być wykonywane przy każdym commicie
- Testy E2E są zoptymalizowane dla CI z odpowiednimi powtórzeniami i zrównolegleniem
- Raporty pokrycia kodu są generowane do monitorowania jakości testów

## Zasoby

- [Dokumentacja Vitest](https://vitest.dev/)
- [Dokumentacja Testing Library](https://testing-library.com/)
- [Dokumentacja Playwright](https://playwright.dev/)
- [Dokumentacja Faker.js](https://fakerjs.dev/)

