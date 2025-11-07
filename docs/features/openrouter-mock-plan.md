# Plan Zamockowania Usługi OpenRouter

## 1. Cel

Głównym celem jest umożliwienie testowania interfejsu użytkownika, w szczególności komponentów `SurveyFillForm.tsx` i `GdprWarning.tsx`, bez konieczności wykonywania rzeczywistych, kosztownych zapytań do API OpenRouter. Chcemy symulować różne odpowiedzi z serwisu `anonymizationService`, aby w pełni zweryfikować obsługę różnych scenariuszy związanych z RODO (GDPR) po stronie klienta.

## 2. Strategia

Najbardziej efektywnym i najmniej inwazyjnym podejściem będzie stworzenie zamockowanej implementacji `AnonymizationService` i warunkowe jej użycie w oparciu o zmienną środowiskową. Pozwoli to na łatwe przełączanie dowolnej części aplikacji, która korzysta z tego serwisu, na wersję zamockowaną na potrzeby testów, izolując logikę od backendowych usług AI.

Strategia opiera się na następujących założeniach:

1.  **Stworzenie dedykowanego mocka:** Utworzymy nowy, zamockowany serwis (`mockAnonymizationService.ts`), który będzie eksportował funkcję `checkAndAnonymize` z logiką zwracającą predefiniowane, losowe odpowiedzi.
2.  **Przełączanie za pomocą zmiennej środowiskowej:** Wprowadzimy zmienną środowiskową, np. `MOCK_AI_SERVICE`, która będzie działać jako przełącznik między prawdziwą a zamockowaną implementacją serwisu.
3.  **Centralizacja logiki w dostawcy (Provider):** Stworzymy dedykowany moduł dostawcy (`anonymizationServiceProvider.ts`), który będzie zawierał logikę warunkowego importu. Wszystkie inne części aplikacji (konsumenci) będą importować serwis `AnonymizationService` bezpośrednio z tego dostawcy, eliminując duplikację kodu.

## 3. Kroki Implementacji

### Krok 1: Stworzenie zamockowanego serwisu `anonymizationService`

1.  Utwórz nowy katalog `src/lib/services/mock`.
2.  Wewnątrz tego katalogu stwórz plik `mockAnonymizationService.ts`.
3.  W pliku tym zaimplementuj funkcję `checkAndAnonymize`, która będzie zgodna z interfejsem prawdziwego serwisu.

**Logika mocka:**

-   Funkcja będzie przyjmować `text: string` jako argument.
-   Zdefiniowana zostanie tablica z kilkunastoma możliwymi odpowiedziami w formacie `GdprCheckResult`.
-   Zgodnie z wymaganiami:
    -   Ponad połowa odpowiedzi powinna zwracać `containsPersonalData: false`.
    -   Pozostałe odpowiedzi powinny zwracać `containsPersonalData: true`, wraz z przykładowymi `anonymizedText` (mogącym być modyfikacją tekstu wejściowego), `detectedDataTypes` oraz `confidence > 0.5`.
-   Funkcja będzie losowo wybierać jedną z odpowiedzi i zwracać ją, wstawiając oryginalny tekst do pola `originalText`.

### Krok 2: Stworzenie dostawcy serwisu i modyfikacja konsumentów

1.  Utwórz nowy plik `src/lib/services/anonymizationServiceProvider.ts`.
2.  W pliku tym umieść logikę warunkowego importu i eksportu `AnonymizationService` na podstawie zmiennej `MOCK_AI_SERVICE`.
3.  Zmodyfikuj pliki `src/pages/api/survey-responses/check-gdpr.ts` oraz `src/lib/services/surveyResponseService.ts`, aby importowały `AnonymizationService` z nowego dostawcy.

### Krok 3: Konfiguracja zmiennych środowiskowych

1.  Upewnij się, że w głównym katalogu projektu istnieje plik `.env` (jeśli nie, utwórz go).
2.  Dodaj do niego następujący wpis, aby aktywować mockowanie:
    ```
    MOCK_AI_SERVICE=true
    ```
3.  Zaktualizuj plik `src/env.d.ts`, aby TypeScript rozpoznał nową zmienną:
    ```typescript
    interface ImportMetaEnv {
      // ... istniejące zmienne
      readonly MOCK_AI_SERVICE?: string;
    }
    ```

### Krok 4: Testowanie

1.  Uruchom aplikację deweloperską. Zmienna środowiskowa `MOCK_AI_SERVICE=true` powinna być automatycznie wczytana.
2.  Przejdź do formularza wypełniania ankiety.
3.  Wpisz dowolny tekst w pole "Feedback".
4.  Kliknij przycisk "Complete Survey".
5.  Obserwuj zachowanie aplikacji. Przy kolejnych próbach powinieneś otrzymywać różne odpowiedzi:
    -   Czasem ankieta zostanie wysłana od razu (gdy mock zwróci `containsPersonalData: false`).
    -   Czasem pojawi się komponent `GdprWarning` z różnymi danymi (gdy mock zwróci `containsPersonalData: true`).

## 4. Przykłady Kodu

### `src/lib/services/anonymizationServiceProvider.ts`

```typescript
// Conditionally import and export the correct service implementation
const useMock = import.meta.env.MOCK_AI_SERVICE === "true";

export const AnonymizationService = useMock
  ? (await import("@/lib/services/mock/mockAnonymizationService")).MockAnonymizationService
  : (await import("@/lib/services/anonymizationService")).AnonymizationService;

// Optional: log once at module initialization
console.log(`[AnonymizationServiceProvider] Using ${useMock ? "MOCK" : "REAL"} AnonymizationService`);
```

### `src/lib/services/mock/mockAnonymizationService.ts`

```typescript
import type { GdprCheckResult } from "@/lib/services/anonymizationService";

const mockResponses: Omit<GdprCheckResult, "originalText">[] = [
  // Przypadki bez danych osobowych (>50%)
  { containsPersonalData: false, confidence: 0.99, anonymizedText: null },
  { containsPersonalData: false, confidence: 0.95, anonymizedText: null },
  { containsPersonalData: false, confidence: 0.92, anonymizedText: null },
  { containsPersonalData: false, confidence: 0.88, anonymizedText: null },
  { containsPersonalData: false, confidence: 0.96, anonymizedText: null },
  { containsPersonalData: false, confidence: 0.99, anonymizedText: null },

  // Przypadki z danymi osobowymi
  {
    containsPersonalData: true,
    confidence: 0.85,
    anonymizedText: "The organizer did a great job.",
    detectedDataTypes: ["full_name"],
  },
  {
    containsPersonalData: true,
    confidence: 0.95,
    anonymizedText: "Please contact me at the provided email.",
    detectedDataTypes: ["email"],
  },
  {
    containsPersonalData: true,
    confidence: 0.75,
    anonymizedText: "A participant mentioned an issue with the landing zone.",
    detectedDataTypes: ["full_name", "location"],
  },
  {
    containsPersonalData: true,
    confidence: 0.91,
    anonymizedText: "My phone number was called by mistake.",
    detectedDataTypes: ["phone"],
  },
];

export const checkAndAnonymize = async (text: string): Promise<GdprCheckResult> => {
  const randomIndex = Math.floor(Math.random() * mockResponses.length);
  const mockResponse = mockResponses[randomIndex];

  // Symulacja opóźnienia sieciowego
  await new Promise(res => setTimeout(res, 500));

  if (mockResponse.containsPersonalData) {
    mockResponse.anonymizedText = `${mockResponse.anonymizedText} (Original: ...${text.substring(0, 20)}...)`;
  }

  return {
    ...mockResponse,
    originalText: text,
  };
};

export const MockAnonymizationService = {
  checkAndAnonymize,
};
```

### `src/pages/api/survey-responses/check-gdpr.ts` (fragment)

```typescript
import type { APIRoute } from "astro";
import { AnonymizationService } from "@/lib/services/anonymizationServiceProvider";
// ... inne importy

export const POST: APIRoute = async ({ request }) => {
  // ... walidacja
  const { text } = await request.json();

  try {
    const result = await AnonymizationService.checkAndAnonymize(text);
    return new Response(JSON.stringify(result), { status: 200 });
  } catch (error) {
    // ... obsługa błędów
  }
};
```
