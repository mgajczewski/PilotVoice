# Technical Specification: Authentication and User Management Module

## Introduction

This document describes the technical architecture of the user registration, login, and account management module for the PilotVoice application. The specification is based on the requirements defined in the PRD document and the established technology stack (Astro, React, Supabase).

## 1. User Interface Architecture

### 1.1. Changes in Page and Layout Structure

New pages and modifications to existing layouts will be introduced to handle "authenticated" and "unauthenticated" states.

#### 1.1.1. New Pages (`./src/pages`)

-   **`/login.astro`**: A public page containing the login form component.
-   **`/register.astro`**: A public page containing the registration form component.
-   **`/forgot-password.astro`**: A public page containing the form to initiate the password recovery process.
-   **`/update-password.astro`**: A public page, linked from the recovery email, containing the form to set a new password.
-   **`/profile.astro`**: A protected page, accessible only to logged-in users, for managing password and profile data (CIVL ID).

#### 1.1.2. Layouts (`./src/layouts`)

-   **`Layout.astro`**: The main application layout will be extended with logic to conditionally render UI elements based on the user's authentication status. User session data will be available via `Astro.locals.user`, injected by the middleware.
    -   **Navigation (non-auth):** Displays "Sign In" and "Sign Up" links.
    -   **Navigation (auth):** Instead of login/register links, it displays a user menu with "My Profile" and "Sign Out" options.

### 1.2. React Components (`./src/components`)

Form logic, client-side validation, and API interaction will be encapsulated in React components, rendered on the client-side (`client:load`).

-   **`RegisterForm.tsx`**:
    -   Responsibility: New user registration.
    -   Fields: `email`, `password`, `confirmPassword`, `Captcha`.
    -   Validation:
        -   Correct email format.
        -   Password must be at least 8 characters long.
        -   Password and confirmation must match.
        -   Captcha validation before form submission.
    -   Interaction: On successful validation, sends a `POST` request to `/api/auth/register`. Handles error messages (e.g., "User already exists") and success, followed by a redirect.

-   **`LoginForm.tsx`**:
    -   Responsibility: User login.
    -   Fields: `email`, `password`.
    -   Interaction: Sends a `POST` request to `/api/auth/login`. On error, displays a message (e.g., "Invalid credentials"). On success, redirects to the main page or the intended destination.

-   **`ForgotPasswordForm.tsx`**:
    -   Responsibility: Initiating the password recovery process.
    -   Fields: `email`.
    -   Interaction: Sends a `POST` request to `/api/auth/forgot-password`. Displays a message confirming that instructions have been sent to the provided email address.

-   **`UpdatePasswordForm.tsx`**:
    -   Responsibility: Setting a new password by the user.
    -   Fields: `password`, `confirmPassword`.
    -   Interaction: Sends a `POST` request to `/api/auth/update-password` along with the recovery token (passed by Supabase in the URL).

-   **`UserProfileForm.tsx`**:
    -   Responsibility: Managing profile data.
    -   Fields: `CIVL ID` or `Reason for registration`.
    -   Interaction: Sends a `PUT` or `PATCH` request to `/api/user/profile` to update the data.

-   **`ChangePasswordForm.tsx`**:
    -   Responsibility: Changing password by a logged-in user.
    -   Fields: `newPassword`, `confirmNewPassword`.
    -   Interaction: Sends a `PUT` request to `/api/user/change-password`.

The forms will be built using pre-made components from `shadcn/ui` (`Input`, `Button`, `Form`, etc.).

### 1.3. Scenarios and Error Handling

-   **Client-side validation:** Each form will have real-time validation (e.g., on blur) and validation on submission.
-   **Error messages:** Validation errors will be displayed below the respective fields. API errors (e.g., "Incorrect password," "Email is already taken") will be displayed as a global message for the form (e.g., using the `Alert` component from `shadcn/ui`).
-   **Loading state:** Submit buttons will be disabled and show a loading indicator during API communication.

## 2. Backend Logic

Server-side logic will be implemented using Astro API Routes (`/src/pages/api`). They will act as intermediaries for communication between the frontend and Supabase Auth.

### 2.1. API Endpoint Structure (`./src/pages/api/auth/`)

-   **`POST /api/auth/register.ts`**:
    -   Accepts: `RegisterDto { email, password }`.
    -   Logic: Validates input data. Calls `supabase.auth.signUp()`.
    -   Returns: `200 OK` on success or an error (e.g., `409 Conflict` if the email is taken).

-   **`POST /api/auth/login.ts`**:
    -   Accepts: `LoginDto { email, password }`.
    -   Logic: Validates data. Calls `supabase.auth.signInWithPassword()`. Supabase automatically sets the `Set-Cookie` header with the session token in the response.
    -   Returns: `200 OK` or `401 Unauthorized` for incorrect credentials.

-   **`POST /api/auth/logout.ts`**:
    -   Accepts: No body.
    -   Logic: Calls `supabase.auth.signOut()`. Supabase clears the session cookie.
    -   Returns: `200 OK`.

-   **`POST /api/auth/forgot-password.ts`**:
    -   Accepts: `{ email }`.
    -   Logic: Calls `supabase.auth.resetPasswordForEmail()` with the URL to the frontend page (`/update-password`).
    -   Returns: `200 OK` (regardless of whether the email exists in the database, to avoid disclosing user information).

### 2.2. Validation and Data Models

The `Zod` library will be used for input data validation in the API endpoints. A DTO (Data Transfer Object) schema will be defined for each endpoint.

Example for registration (`./src/lib/validators/auth.ts`):

```typescript
import { z } from 'zod';

export const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export type RegisterDto = z.infer<typeof RegisterSchema>;
```

### 2.3. Server-Side Rendering (`output: "server"`)

The `output: "server"` configuration in `astro.config.mjs` is crucial. It allows middleware to run on every request, which is the foundation of secure authentication in SSR mode. This enables each page to dynamically render content based on the user session (`Astro.locals.user`) without waiting for client-side JavaScript to load.

## 3. Authentication System (Supabase Auth + Astro)

### 3.1. Supabase Client Configuration

Two Supabase clients will be created in the project (`./src/db/supabase.ts`):
1.  **Server-side client**: Used in middleware and API endpoints. It is created for each request using `createServerClient` from the `@supabase/ssr` library, allowing for secure session management based on request cookies.
2.  **Client-side client**: Used in React components. It is created once using `createBrowserClient` for interacting with Supabase on the browser side.

### 3.2. Middleware (`./src/middleware/index.ts`)

Middleware will be the central point of the authentication system.

**Operational Logic:**

1.  It runs for every request to the server.
2.  It ignores public paths (e.g., `/login`, `/register`, `/api/auth/*`, static assets).
3.  For other (protected) paths:
    a. Creates a server-side Supabase client based on the request's cookies.
    b. Attempts to retrieve the active user session using `supabase.auth.getSession()`.
    c. **If a session does not exist:** Redirects the user to the `/login` page with a `redirect_to` parameter, so that after logging in, they are returned to the page they were trying to access.
    d. **If a session exists:** Saves the user data in `Astro.locals.user` and allows the request to proceed (`next()`).

### 3.3. Authentication Processes

-   **Registration and Login:** As described in section 2.1, the process is initiated by the frontend and handled by the Astro API, which delegates the task to Supabase. Supabase manages user creation and sessions (HTTP-Only cookies).
-   **Account Recovery:**
    1.  The user provides their email in the `ForgotPasswordForm` component.
    2.  The frontend sends a request to `POST /api/auth/forgot-password`.
    3.  The backend calls `supabase.auth.resetPasswordForEmail()`. Supabase sends an email with a unique link.
    4.  The user clicks the link, which leads to `/update-password`. Supabase Auth appends a token to the URL, creating a temporary session.
    5.  The `UpdatePasswordForm` component uses this session to send a password update request.
