# PilotVoice

[![Project Status: WIP](https://img.shields.io/badge/status-work_in_progress-yellow.svg)](https://github.com/mgajczewski/pilot-voice)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

PilotVoice is a web application for the paragliding community, designed to systematically collect feedback from competition participants. The application allows pilots to fill out standardized surveys evaluating various aspects of a competition. Moderators, such as event organizers, get access to a panel with aggregated, anonymous data, which enables analysis and helps improve the quality of future events.

## Table of Contents

- [Tech Stack](#tech-stack)
- [Getting Started Locally](#getting-started-locally)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
- [Available Scripts](#available-scripts)
- [Project Scope (MVP)](#project-scope-mvp)
  - [Key Features](#key-features)
  - [Out of Scope](#out-of-scope)
- [Project Status](#project-status)
- [License](#license)

## Tech Stack

- **Frontend:** Astro 5, React 19, TypeScript 5, Tailwind 4, Shadcn/ui
- **Backend & Database:** Supabase
- **AI Integration:** Openrouter.ai
- **CI/CD & Hosting:** GitHub Actions, Vercel
- **Testing:** Vitest, Playwright, @faker-js/faker

## Getting Started Locally

Follow these instructions to get the project up and running on your local machine.

### Prerequisites

- **Node.js**: `v22.14.0` (it's recommended to use a version manager like [nvm](https://github.com/nvm-sh/nvm))
- **npm**: version 10 or higher
- **Supabase Account**: You will need a Supabase project to connect to the database and authentication.

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/mgajczewski/pilot-voice.git
    cd pilot-voice
    ```

2.  **Set the Node.js version:**
    If you are using `nvm`, run this command to use the correct Node.js version:
    ```bash
    nvm use
    ```

3.  **Install dependencies:**
    ```bash
    npm install
    ```

4.  **Set up environment variables:**
    Create a `.env` file in the root of the project by copying the example file:
    ```bash
    cp .env.example .env
    ```
    Populate the `.env` file with your Supabase project credentials.
    ```env
    PUBLIC_SUPABASE_URL="YOUR_SUPABASE_URL"
    PUBLIC_SUPABASE_ANON_KEY="YOUR_SUPABASE_ANON_KEY"
    ```

5.  **Run the development server:**
    ```bash
    npm run dev
    ```
    The application will be available at `http://localhost:3000`.

## Available Scripts

The following scripts are available in the `package.json`:

### Development
- `npm run dev`: Starts the application in development mode.
- `npm run build`: Builds the application for production.
- `npm run preview`: Runs a local server to preview the production build.

### Code Quality
- `npm run lint`: Lints the source code using ESLint.
- `npm run lint:fix`: Lints the source code and attempts to fix issues automatically.
- `npm run format`: Formats the code using Prettier.

### Testing
- `npm test`: Runs all unit tests.
- `npm run test:watch`: Runs unit tests in watch mode.
- `npm run test:ui`: Opens Vitest UI for visual test exploration.
- `npm run test:coverage`: Runs tests with coverage report.
- `npm run test:e2e`: Runs end-to-end tests with Playwright.
- `npm run test:e2e:ui`: Opens Playwright UI for visual E2E testing.
- `npm run test:e2e:headed`: Runs E2E tests in headed mode (visible browser).
- `npm run test:e2e:debug`: Runs E2E tests in debug mode.
- `npm run test:e2e:codegen`: Generate test code using Playwright codegen.
- `npm run test:all`: Runs both unit and E2E tests.

For detailed testing documentation, see:
- [Testing Setup Guide](docs/testing-setup.md) (English)
- [Przewodnik konfiguracji testów](docs/testing-setup.pl.md) (Polish)
- [Quick Testing Reference](docs/TESTING_QUICK_REFERENCE.md)

## Project Scope (MVP)

This section outlines the features included in the Minimum Viable Product (MVP).

### Key Features

- **User Management:**
    - Email/password registration and login.
    - User roles: `Pilot` and `Moderator`.
    - Simple user profile management.
- **Survey Process (Pilot):**
    - Access surveys via unique URLs.
    - Automatic saving of survey progress.
    - AI-powered anonymization of answers in open-ended questions.
- **Survey Management (Moderator):**
    - Create and configure surveys for competitions.
    - Schedule survey opening and closing times.
    - Access a dashboard with aggregated and anonymous results.

### Out of Scope

The following features are intentionally not included in the MVP:

- Automatic survey creation from external competition calendars.
- Integration with external authentication services (e.g., Google, Facebook).
- Email or push notification system.
- Integration with safety incident reporting systems.
- Advanced data analysis and report generation.
- Direct communication tools between moderators and pilots.
- A system to verify if a user participated in the assessed competition.
- Multi-language support.

## Project Status

The project is currently in the **initial development phase** for its MVP release. Contributions and feedback are welcome.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for more details.
