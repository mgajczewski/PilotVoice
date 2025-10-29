<conversation_summary>
<decisions>
1.  **Localization and Language**: All user interface texts and components must default to English.
2.  **AI Anonymization in the Survey**: The interface should display an AI suggestion about anonymizing the response only if it actually made changes. The user’s original text is visible in the editing field.
3.  **Date Display**: Competition start and end dates must be displayed as calendar dates without converting to the user's local time zone to ensure global consistency. Other timestamps (e.g., `created_at`) should be localized.
4.  **Anonymity Communication**: Information that responses are analyzed anonymously should appear on the survey information page (before it starts) and on the thank-you page (after it ends).
5.  **Moderator Onboarding**: For the MVP there will be no special "welcome state" for new moderators. Instead, they will see the standard "empty state" on the competitions list.
6.  **Captcha Mechanism**: The registration form will implement the invisible Google reCAPTCHA v3 mechanism.
7.  **Profile State Management**: The global authentication context (`AuthContext`) will store only a boolean flag (`profileCompleted`), not full profile data.
8.  **UI Updates after CRUD Operations**: In the moderator panel we will not use optimistic updates. Instead, the interface will be blocked with a loading indicator (`spinner`) during API operations.
</decisions>

<matched_recommendations>
1.  **Navigation and Roles**: A unified, protected area (`/panel`) will be created with navigation elements rendered dynamically depending on the logged-in user's role (`user`, `moderator`, `super_admin`).
2.  **Survey Start Flow**: An unauthenticated user who clicks "Start survey" is redirected to login/registration and then back to the survey form.
3.  **Automatic Survey Save**: Survey progress will be saved automatically every 5 seconds (using debouncing) when changes in the form are detected.
4.  **Component States (Loading/Empty/Error)**: Key data-fetching components (e.g., tables) will implement dedicated views for loading state (`skeleton screen`), empty state (with a message and call-to-action), and error state (with a retry option).
5.  **Form Validation**: Validation in forms will run in real time on the `onBlur` event for a given field, with error messages displayed directly beneath it.
6.  **Table Responsiveness**: Tables with large amounts of data (e.g., competitions list) will be transformed on mobile devices into a list of cards (`Card`), where each card represents one row.
7.  **Accessibility (Focus Management)**: In interactions with modals, keyboard focus will be "trapped" inside the modal and upon closing will return to the element that triggered it.
8.  **API Error Handling**: Errors will be handled globally by a toast notification system (for server errors) and locally in forms (for validation errors). Authorization errors (401/403) will redirect to the login page.
</matched_recommendations>

<ui_architecture_planning_summary>
### Main UI Architecture Requirements

The UI architecture for the PilotVoice MVP will be built on the technology stack: **Astro 5** for routing and static pages and **React 19** for dynamic "islands of interactivity." The interface will use **Tailwind CSS** and the **Shadcn/ui** component library. Key requirements include a **mobile-first** approach for user-facing views (survey filling) and a **desktop-first** approach for administrative panels, while maintaining usability on smaller screens. All UI texts will be in **English**.

### Key Views, Screens, and User Flows

-   **Public Views**: Home, Login, Registration, Survey information page.
-   **User Views (Role `user`)**: Survey form, Profile page, User dashboard (with a list of completed surveys).
-   **Moderator Views (Role `moderator`)**: Panel with competitions list (table/cards), forms for creating/editing competitions and surveys, aggregated survey results view.
-   **Super Admin Views (Role `super_admin`)**: User role management panel with a search bar.

**Main Flows**:
1.  **Filling Out the Survey**: The user lands on the survey page via a unique link, is prompted to log in/register, and then fills out the form with autosave. After completion, they are informed about the need to complete their profile.
2.  **Creating a Survey**: The moderator logs in, creates a new competition, and within that competition creates a survey and receives a shareable link.
3.  **Role Management**: The Super Admin searches for a user by email and changes their role using a dedicated interface.

### API Integration and State Management Strategy

-   **State Management**: The application will use the **React Context API** for global state management, avoiding additional dependencies. At least two contexts will be created: `AuthContext` (storing the session, user data, and the `profileCompleted` flag) and `NotificationContext` (for handling global notifications). Local state will be managed with `useState` and `useReducer` hooks.
-   **API Integration**: Communication with the API will be implemented using the standard `fetch` wrapped in dedicated service functions. The application will handle API errors and loading states and inform the user accordingly. For the MVP, advanced client-side data caching is not planned.

### Responsiveness, Accessibility, and Security Considerations

-   **Responsiveness**: The survey interface will be fully responsive. Administrative panels will use adaptive layouts, e.g., turning tables into lists of cards on smaller screens.
-   **Accessibility**: Components from `Shadcn/ui` will provide a solid foundation for accessibility (semantic HTML, ARIA). Special attention will be paid to keyboard focus management in elements such as modals.
-   **Security**: The registration form will be protected by the invisible **Google reCAPTCHA v3** mechanism. Access to specific views and functions will be controlled at the UI level based on the user role retrieved from `AuthContext`, with the API and RLS policies in the database remaining the final source of truth.

</ui_architecture_planning_summary>
</conversation_summary>


