<architecture_analysis>

### 1. Komponenty, strony i layouty

Na podstawie dokumentacji `prd.en.md` oraz `auth-spec.en.md` zidentyfikowano następujące elementy biorące udział w procesie autentykacji i zarządzania użytkownikiem:

**Layouty (`./src/layouts`):**

*   `Layout.astro`: Główny layout aplikacji, który warunkowo renderuje elementy nawigacji w zależności od statusu zalogowania użytkownika (dane z `Astro.locals.user`).

**Strony (`./src/pages`):**

*   `/login.astro`: Publiczna strona z formularzem logowania.
*   `/register.astro`: Publiczna strona z formularzem rejestracji.
*   `/forgot-password.astro`: Publiczna strona z formularzem do resetowania hasła.
*   `/update-password.astro`: Publiczna strona do ustawiania nowego hasła po resecie.
*   `/profile.astro`: Chroniona strona do zarządzania profilem użytkownika (dostępna po zalogowaniu).

**Komponenty React (`./src/components`):**

*   `RegisterForm.tsx`: Formularz rejestracji z walidacją po stronie klienta.
*   `LoginForm.tsx`: Formularz logowania.
*   `ForgotPasswordForm.tsx`: Formularz do inicjowania odzyskiwania hasła.
*   `UpdatePasswordForm.tsx`: Formularz do ustawiania nowego hasła.
*   `UserProfileForm.tsx`: Formularz do zarządzania danymi profilu (CIVL ID).
*   `ChangePasswordForm.tsx`: Formularz do zmiany hasła przez zalogowanego użytkownika.
*   `UserMenu.tsx` (wewnątrz `Layout.astro`): Komponent wyświetlający menu użytkownika (Profil, Wyloguj) lub linki do logowania/rejestracji.

**API Endpoints (`./src/pages/api/auth`):**

*   `POST /api/auth/register.ts`: Obsługuje rejestrację nowego użytkownika.
*   `POST /api/auth/login.ts`: Obsługuje logowanie użytkownika i ustawia cookie sesyjne.
*   `POST /api/auth/logout.ts`: Obsługuje wylogowanie i czyści cookie sesyjne.
*   `POST /api/auth/forgot-password.ts`: Wysyła email z linkiem do resetu hasła.

**Middleware (`./src/middleware/index.ts`):**

*   Centralny punkt systemu autentykacji. Uruchamia się przy każdym żądaniu, weryfikuje sesję użytkownika na podstawie cookies i udostępnia dane użytkownika w `Astro.locals`. Chroni strony wymagające zalogowania.

### 2. Przepływ danych w procesie logowania

1.  Użytkownik wchodzi na stronę `/login.astro`.
2.  Strona renderuje komponent `LoginForm.tsx`.
3.  Użytkownik wypełnia formularz. Komponent `LoginForm.tsx` waliduje dane po stronie klienta.
4.  Po wysłaniu formularza, `LoginForm.tsx` wysyła żądanie `POST` do endpointu `/api/auth/login.ts` z emailem i hasłem.
5.  Endpoint `/api/auth/login.ts` komunikuje się z Supabase Auth w celu weryfikacji poświadczeń.
6.  Jeśli logowanie się powiedzie, Supabase ustawia w odpowiedzi nagłówek `Set-Cookie` z tokenem sesji.
7.  Endpoint API zwraca odpowiedź `200 OK`, a frontend przekierowuje użytkownika na stronę główną.
8.  Przy kolejnych żądaniach do aplikacji, middleware (`/src/middleware/index.ts`) przechwytuje żądanie.
9.  Middleware odczytuje cookie sesyjne, weryfikuje je w Supabase i jeśli jest poprawne, umieszcza dane użytkownika w `Astro.locals.user`.
10. `Layout.astro` odczytuje `Astro.locals.user` i renderuje `UserMenu.tsx` w stanie "zalogowany", wyświetlając opcje profilu i wylogowania.

### 3. Przepływ danych w procesie rejestracji

1.  Użytkownik wchodzi na stronę `/register.astro`.
2.  Strona renderuje komponent `RegisterForm.tsx`.
3.  Użytkownik wypełnia formularz (email, hasło, captcha). Komponent waliduje dane.
4.  Po wysłaniu, `RegisterForm.tsx` wysyła żądanie `POST` do `/api/auth/register.ts`.
5.  Endpoint API waliduje dane (np. za pomocą Zod) i wywołuje `supabase.auth.signUp()`.
6.  Jeśli rejestracja się powiedzie, Supabase tworzy nowego użytkownika. Użytkownik jest automatycznie zalogowany (sesja jest tworzona).
7.  Frontend przekierowuje użytkownika na stronę główną, gdzie `Layout.astro` i `UserMenu.tsx` pokazują stan "zalogowany".

</architecture_analysis>
<mermaid_diagram>
```mermaid
flowchart TD
    classDef page fill:#8A2BE2,stroke:#333,stroke-width:2px,color:#fff;
    classDef reactComponent fill:#61DAFB,stroke:#333,stroke-width:2px,color:#000;
    classDef astroComponent fill:#FF5E00,stroke:#333,stroke-width:2px,color:#fff;
    classDef api fill:#4CAF50,stroke:#333,stroke-width:2px,color:#fff;
    classDef middleware fill:#FFC107,stroke:#333,stroke-width:2px,color:#000;
    classDef database fill:#f29111,stroke:#333,stroke-width:2px,color:#fff;

    subgraph "Strony Publiczne - Przeglądarka"
        direction LR
        P_Login["/login.astro"]:::page
        P_Register["/register.astro"]:::page
        P_ForgotPassword["/forgot-password.astro"]:::page
        P_UpdatePassword["/update-password.astro"]:::page
    end
    
    subgraph "Komponenty Formularzy (React) - Przeglądarka"
        C_LoginForm["LoginForm.tsx"]:::reactComponent
        C_RegisterForm["RegisterForm.tsx"]:::reactComponent
        C_ForgotPasswordForm["ForgotPasswordForm.tsx"]:::reactComponent
        C_UpdatePasswordForm["UpdatePasswordForm.tsx"]:::reactComponent
    end

    subgraph "Strony Chronione - Przeglądarka"
        P_Profile["/profile.astro"]:::page
    end

    subgraph "Komponenty Użytkownika (React) - Przeglądarka"
        C_ProfileForm["UserProfileForm.tsx"]:::reactComponent
        C_ChangePasswordForm["ChangePasswordForm.tsx"]:::reactComponent
        C_UserMenu["UserMenu.tsx"]:::reactComponent
    end
    
    subgraph "Infrastruktura Aplikacji - Serwer"
        direction TB
        L_Layout["Layout.astro"]:::astroComponent
        MW["Middleware (index.ts)"]:::middleware
    end
        
    subgraph "API Endpoints - Serwer"
        API_Login["POST /api/auth/login"]:::api
        API_Register["POST /api/auth/register"]:::api
        API_Logout["POST /api/auth/logout"]:::api
        API_ForgotPassword["POST /api/auth/forgot-password"]:::api
    end

    subgraph "Usługi Zewnętrzne - Serwer"
        DB_Supabase["Supabase Auth"]:::database
    end
    
    %% Relacje - Strony i Komponenty
    P_Login -- "Renderuje" --> C_LoginForm
    P_Register -- "Renderuje" --> C_RegisterForm
    P_ForgotPassword -- "Renderuje" --> C_ForgotPasswordForm
    P_UpdatePassword -- "Renderuje" --> C_UpdatePasswordForm
    P_Profile -- "Renderuje" --> C_ProfileForm
    P_Profile -- "Renderuje" --> C_ChangePasswordForm
    
    %% Relacje - Layout
    P_Login -- "Używa" --> L_Layout
    P_Register -- "Używa" --> L_Layout
    P_Profile -- "Używa" --> L_Layout
    L_Layout -- "Renderuje" --> C_UserMenu
    
    %% Przepływ Autentykacji
    C_LoginForm -- "Wysyła dane logowania" --> API_Login
    C_RegisterForm -- "Wysyła dane rejestracji" --> API_Register
    C_UserMenu -- "Inicjuje wylogowanie" --> API_Logout
    C_ForgotPasswordForm -- "Wysyła email" --> API_ForgotPassword
    
    API_Login -- "Weryfikuje poświadczenia" --> DB_Supabase
    API_Register -- "Tworzy użytkownika" --> DB_Supabase
    API_Logout -- "Kończy sesję" --> DB_Supabase
    API_ForgotPassword -- "Wysyła email przez" --> DB_Supabase
    
    DB_Supabase -- "Ustawia Cookie sesyjne" --> API_Login
    DB_Supabase -- "Ustawia Cookie sesyjne" --> API_Register

    %% Middleware
    P_Profile -- "Żądanie dostępu" --> MW
    MW -- "Weryfikuje sesję z" --> DB_Supabase
    MW -- "Udostępnia 'Astro.locals.user'" --> L_Layout

```
</mermaid_diagram>
