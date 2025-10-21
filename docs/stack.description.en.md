# Tech Stack with Rationale

## Frontend

-   **Astro 5:** Chosen for its "Islands Architecture," which allows for server-side rendering of the UI and delivering minimal JavaScript to the client. This ensures lightning-fast page loads, crucial for surveys, while still allowing for interactivity where needed.
-   **React 19:** Used to build dynamic and interactive components, such as the moderator panel. Its seamless integration with Astro allows us to combine the strengths of both technologies.
-   **TypeScript 5:** Provides type safety, which minimizes errors during development and simplifies future code maintenance and refactoring.
-   **Tailwind 4:** Enables rapid and consistent application styling without leaving the HTML code. Its utility-first approach speeds up UI development.
-   **Shadcn/ui:** Delivers pre-built, accessible, and easily customizable UI components, significantly reducing frontend development time and ensuring a high-quality interface.
-   **rc-slider:** A lightweight and flexible library for creating sliders, perfect for scale-based survey questions.

## Backend and Database

-   **Supabase:** A key component of the stack, serving as a "Backend as a Service." It provides a PostgreSQL database, an authentication system, auto-generated APIs, and secure access management (Row Level Security). It drastically reduces the time needed to build the MVP by eliminating the need to write a backend from scratch.

## AI Model Communication

-   **Openrouter.ai:** An AI model aggregator that provides flexibility in choosing and changing providers without modifying the application code. Its pay-as-you-go payment model helps minimize costs in the early stages of the project.

## CI/CD and Hosting

-   **GitHub Actions:** Enables the automation of testing and deployment processes with every push to the repository, ensuring code consistency and quality.
-   **Vercel:** A hosting platform optimized for Astro, offering seamless deployments, automatic scaling (serverless), and a global CDN. Its free tier is perfectly sufficient for the MVP's needs.
