Przeanalizuj dogłębnie kod źródłowy mojego projektu (`{{Codebase}}`) oraz jego stack technologiczny (`{{Techstack}}`). Twoim zadaniem jest wygenerowanie kompleksowego planu testów, który będzie precyzyjnie dopasowany do zidentyfikowanych przez Ciebie kluczowych funkcjonalności, architektury i potencjalnych obszarów ryzyka.

Dokument końcowy musi być w języku polskim i w formacie Markdown. Mimo że dokumentacja jest po polsku, odwołania do kodu (np. nazwy funkcji, modułów) powinny pozostać w oryginalnym, angielskim brzmieniu.

Wygenerowany plan testów musi zawierać następujące, jasno zdefiniowane sekcje:

---

### **1. Wprowadzenie i Cele Testów**
*   **Cel dokumentu:** Krótko opisz, czemu służy ten plan testów.
*   **Zakres testów:** Na podstawie analizy kodu wskaż, które moduły, funkcjonalności i komponenty zostaną poddane testom. Wymień je z nazwy.
*   **Elementy poza zakresem:** Wylistuj funkcjonalności lub obszary, które świadomie zostaną pominięte w tym cyklu testowym, wraz z krótkim uzasadnieniem (np. "moduł X zostanie przetestowany w osobnej fazie", "integracja z API Y jest na tym etapie zaślepiona").

### **2. Analiza Priorytetów i Ryzyka**
*   **Priorytetowe obszary funkcjonalne:** Zidentyfikuj i wypunktuj najważniejsze (krytyczne z punktu widzenia biznesowego lub złożoności technicznej) części aplikacji, które wymagają najdokładniejszego przetestowania.
*   **Potencjalne ryzyka:** Wymień potencjalne problemy i ryzyka (np. "ryzyko niskiej wydajności w module raportowania przy dużej ilości danych", "ryzyko błędów integracji z zewnętrznym API płatności"). Zaproponuj, jak planowane testy pomogą w ich mitygacji.

### **3. Strategia Testowania**
*   **Podejście ogólne:** Opisz ogólną strategię (np. "strategia oparta na ryzyku, z naciskiem na automatyzację testów regresji").
*   **Poziomy i typy testów:** W odniesieniu do `{{Techstack}}`, zaproponuj konkretne rodzaje testów do wykonania. Dla każdego typu podaj uzasadnienie i przykłady:
    *   **Testy jednostkowe:** (np. "Dla logiki biznesowej w serwisach Node.js z użyciem biblioteki Jest").
    *   **Testy integracyjne:** (np. "Testy integracji pomiędzy mikroserwisem A a bazą danych PostgreSQL").
    *   **Testy E2E (End-to-End):** (np. "Automatyczne testy kluczowych ścieżek użytkownika w interfejsie React z użyciem Cypress").
    *   **Testy wydajnościowe:** (np. "Testy obciążeniowe dla endpointów API REST kluczowych dla wydajności aplikacji").
    *   **Testy bezpieczeństwa:** (np. "Podstawowe skanowanie podatności zależności w projekcie").

### **4. Środowisko i Narzędzia Testowe**
*   **Konfiguracja środowiska:** Opisz, jakie środowisko testowe będzie potrzebne (np. "dedykowana instancja aplikacji na serwerze deweloperskim z odizolowaną bazą danych").
*   **Narzędzia:** Wymień konkretne narzędzia, które będą używane na każdym etapie testowania (np. "Zarządzanie testami: Jira; Automatyzacja E2E: Cypress; Testy API: Postman").

### **5. Przykładowe Scenariusze Testowe**
Na podstawie analizy kluczowych funkcjonalności w `{{Codebase}}`, wygeneruj 3-5 szczegółowych, przykładowych scenariuszy testowych. Każdy powinien zawierać:
*   **ID Scenariusza:**
*   **Opis:** (Co jest testowane?)
*   **Kroki do wykonania:** (Szczegółowa instrukcja)
*   **Oczekiwany rezultat:**

### **6. Kryteria Wejścia i Wyjścia**
*   **Kryteria rozpoczęcia testów:** Warunki, które muszą być spełnione, aby rozpocząć proces testowy (np. "zakończony code review dla testowanych funkcjonalności", "działające środowisko testowe"). [1]
*   **Kryteria zakończenia testów:** Warunki definiujące pomyślne ukończenie fazy testów (np. "100% krytycznych przypadków testowych zakończonych powodzeniem", "brak znanych błędów blokujących"). [1, 2]

### **7. Raportowanie i Śledzenie Defektów**
*   **Proces zgłaszania błędów:** Opisz, jak i gdzie będą zgłaszane defekty (np. "każdy znaleziony błąd zostanie zgłoszony jako ticket w projekcie Jira z odpowiednimi etykietami").
*   **Metryki:** Zaproponuj kluczowe metryki do śledzenia postępu i jakości (np. "liczba znalezionych defektów na dzień", "procentowy postęp wykonania testów").

---
Upewnij się, że wygenerowany plan jest praktycznym dokumentem, który może być bezpośrednio wykorzystany przez zespół deweloperski i testerski.