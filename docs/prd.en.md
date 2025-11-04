# Product Requirements Document (PRD) - PilotVoice MVP

## 1. Product overview

PilotVoice is a web application dedicated to the paragliding community, whose goal is to systematically collect feedback from competition participants. The application allows pilots to fill in standardized surveys evaluating various aspects of the competition. On the other hand, moderators (e.g., competition organizers) receive access to a panel with aggregated, anonymous data, which enables analysis and drawing conclusions to improve the quality of future events. The MVP (Minimum Viable Product) focuses on creating a simple yet fully functional tool to achieve this basic goal, postponing more advanced features such as integrations with external systems or automation.

## 2. User problem

Within the paragliding community, there is a clear lack of an effective channel for providing feedback on how competitions are conducted. Without systematically collecting opinions from participants, it is difficult for organizers and supervising organizations to identify areas requiring improvement and to make data-driven decisions. Current methods of submitting comments are often burdensome for competitors and inefficient, leading to the loss of valuable insights and preventing systematic improvement of paragliding competition organization in the future.

## 3. Functional requirements

### 3.1. User Management
-   Registration process based on email and password, secured with a "captcha" mechanism.
-   Ability to log in and maintain a user session ("remember me").
-   Two roles in the system: `User` (pilot) and `Moderator`.
-   A `Super Admin` account to manually grant and revoke `Moderator` privileges.
-   A simple user profile page with the ability to manage the password and add a CIVL ID number or a textual reason for registration.
-   The user must complete the profile (CIVL ID or reason) after filling in the first survey, before starting the next one.

### 3.2. Survey Filling Process (for Pilot)
-   Access to surveys via unique, simple URL links (and QR codes).
-   Within the MVP there is one standard survey template.
-   Survey progress is saved automatically.
-   Survey statuses: `started` (started), `completed` (mandatory fields completed), `abandoned` (abandoned).
-   A survey is considered `abandoned` if the mandatory fields are not filled within a configurable period (e.g., 1 hour).
-   Answers to open-ended questions are automatically processed by AI to remove personal data (GDPR compliance). The user sees their original content and the AI suggestion, but only the corrected version is stored in the system.
-   After completing all mandatory fields, the user is redirected to a thank-you page and encouraged to fill in optional questions and complete the profile.
-   The user can return to a survey with status `completed` to edit or add answers to optional questions until the survey is closed by a moderator.
-   Data from `abandoned` surveys are stored for analytical purposes.

### 3.3. Survey Management and Moderator Panel
-   Moderators can create surveys for specific competitions by providing their name and start and end dates.
-   Ability to define an optional, human-readable, and unique URL for the survey.
-   Ability to schedule the automatic opening and closing date for the survey.
-   Moderators manually enter the number of participants for a given competition, which is necessary to measure success metrics.
-   Access to a panel with aggregated and fully anonymous results for each competition separately.
-   The moderator panel presents: average rating for closed-ended questions, percentage completion for open-ended questions, number of competition participants, and number of `completed` and `abandoned` surveys.

## 4. Product boundaries

The following functionalities are intentionally NOT in scope for the MVP:
-   Automatic creation of surveys via integration with the official competition calendar.
-   Integration of the user account system with external authentication services (e.g., Google, Facebook, CIVL).
-   Notification system (email, push) about surveys to fill in or complete.
-   Integration with a safety incident reporting system.
-   Advanced analysis of collected data and generation of extensive reports.
-   Tools for moderators to communicate with survey respondents.
-   A system to verify whether a given user actually participated in the assessed competition.
-   Translation of the application into other languages.

## 5. User stories

### 5.1. Authentication and Account Management

-   ID: US-001
-   Title: New user registration
-   Description: As a new user, I want to be able to create an account in the application using my email address and password so that I can fill in surveys.
-   Acceptance criteria:
    1.  The registration form contains fields: email, password, password confirmation.
    2.  The system validates the correctness of the email format.
    3.  The system requires the password to have at least 8 characters.
    4.  The system checks that the password and its confirmation are identical.
    5.  Registration is secured with a "captcha" mechanism.
    6.  After successful registration, I am automatically logged in and redirected to the home page.
    7.  In case of an error (e.g., email already taken), a clear message is displayed.

-   ID: US-002
-   Title: User login
-   Description: As a registered user, I want to be able to log in to the application by providing my email and password.
-   Acceptance criteria:
    1.  The login form contains fields: email, password.
    2.  After successful login, I am redirected to the home page or the page I was trying to access.
    3.  In case of incorrect data, an appropriate message is displayed.

-   ID: US-003
-   Title: Automatic session persistence
-   Description: As a logged-in user, I want the system to automatically persist my session, so I don't have to log in on every visit.
-   Acceptance criteria:
    1.  The system persists the user session by default after a successful login.
    2.  After closing and reopening the browser, I remain logged in.

-   ID: US-004
-   Title: User logout
-   Description: As a logged-in user, I want to be able to log out of the application.
-   Acceptance criteria:
    1.  A "Log out" button is available in the user interface.
    2.  After clicking the button, my session ends and I am redirected to the home page.

-   ID: US-005
-   Title: Profile management
-   Description: As a logged-in user, I want to have access to a "My profile" page where I can manage my password and CIVL ID number.
-   Acceptance criteria:
    1.  The profile page allows changing the password (requires entering only the new password when the user is logged in).
    2.  The profile page allows adding/editing the CIVL ID number or a textual reason for registration.
    3.  Changes are saved upon confirmation by the user.

### 5.2. Survey - Pilot Perspective

-   ID: US-006
-   Title: Start filling the survey
-   Description: As a user, I want to be able to start filling out a survey by clicking on the link shared with me.
-   Acceptance criteria:
    1.  Access to the survey via a unique URL does not require logging in, but if I am not logged in, the system prompts me to log in/register.
    2.  Upon opening the link, the survey is displayed and in the system it receives the status `started`.
    3.  My progress is saved automatically while filling it in.

-   ID: US-007
-   Title: GDPR verification for open-ended questions
-   Description: As a user answering an open-ended question, I want the system to alert me that my answer contains personal data and help me correct it.
-   Acceptance criteria:
    1.  After entering an answer in the open-ended field, the system (AI) analyzes the text for personal data.
    2.  If potential personal data is found, the system displays my original content and a suggested anonymized version.
    3.  Only the AI-corrected version is stored in the database.

-   ID: US-008
-   Title: Completing the mandatory part of the survey
-   Description: As a user, after filling in all mandatory questions, I want to finish this part of the survey and receive confirmation.
-   Acceptance criteria:
    1.  When all mandatory fields are filled, the survey in the system receives the status `completed`.
    2.  After filling in all the mandatory fields, I see a thank-you message.
    3.  I also see information about the option to fill in optional questions.

-   ID: US-009
-   Title: Completing optional questions
-   Description: As a user, I want to be able to return to a completed survey to add or change answers to optional questions.
-   Acceptance criteria:
    1.  I can edit answers to optional questions in a survey with status `completed`.
    2.  The ability to edit is blocked after the survey is closed by a moderator.

-   ID: US-010
-   Title: Profile completion requirement
-   Description: As a user who has completed my first survey, I want to be informed about the need and purpose of completing my profile before filling out another.
-   Acceptance criteria:
    1.  After completing the first survey, the thank-you page asks to complete the profile (CIVL ID or reason).
    2.  When I try to start a second survey without a completed profile, I am blocked and redirected to the profile page.

### 5.3. Survey Management - Moderator Perspective

-   ID: US-011
-   Title: Creating a survey for a competition
-   Description: As a moderator, I want to create a new survey for a specific competition by providing basic information.
-   Acceptance criteria:
    1.  The survey creation form requires the name of the competition and its start and end dates.
    2.  After creation, the survey is visible on my list of surveys.
    3.  The system generates a unique URL link to the survey.

-   ID: US-012
-   Title: Survey configuration
-   Description: As a moderator, I want to be able to configure additional options for the survey, such as a custom URL or a publication schedule.
-   Acceptance criteria:
    1.  I can set an optional, human-readable URL for the survey (e.g., /competition-xyz).
    2.  The system verifies the uniqueness of the custom URL.
    3.  I can schedule the date and time for automatic opening and closing of the survey.

-   ID: US-013
-   Title: Entering the number of participants
-   Description: As a moderator, I want to be able to manually enter the total number of competition participants to enable the system to calculate the participation rate.
-   Acceptance criteria:
    1.  In the survey management panel there is a field for entering the number of participants.
    2.  The entered value is used to calculate success metrics.

-   ID: US-014
-   Title: Survey results overview
-   Description: As a moderator, after closing the survey, I want to have access to a page summarizing the collected, anonymized data.
-   Acceptance criteria:
    1.  The results panel is available for each survey separately.
    2.  All data is presented in an aggregated and anonymous form.
    3.  The panel displays: average rating for closed-ended questions, percentage completion for open-ended questions, number of participants, number of `completed` and `abandoned` surveys.

### 5.4. System Administration - Super Admin Perspective

-   ID: US-015
-   Title: Managing moderator roles
-   Description: As a Super Admin, I want to have the ability to manually grant and revoke moderator privileges to regular users.
-   Acceptance criteria:
    1.  There is an admin panel available only to the Super Admin role.
    2.  In the panel, I can search for a user by email address.
    3.  I can change the user's role from `User` to `Moderator` and vice versa.

## 6. Success metrics

Key performance indicators (KPIs) for the MVP and ways to measure them:

-   at least 50% of competitors complete the survey after the competition
    -   Measurement method: Comparison of the number of surveys with status `completed` with the number of participants manually entered by the moderator for a given competition.
    -   Formula: `(Number of completed surveys / Number of participants) * 100%`

-   at least 75% of surveys with mandatory fields completed in less than 3 minutes
    -   Measurement method: Analysis of the time difference between the moment the survey starts (first interaction) and the moment it reaches status `completed`.
    -   Formula: `COUNT(surveys WHERE (completion_timestamp - start_timestamp) < 3 minutes) / COUNT(all completed surveys) * 100%`

-   at least 25% of surveys with any optional field filled in
    -   Measurement method: Analysis of the content of surveys with status `completed` to check whether at least one optional field was filled in.
    -   Formula: `COUNT(surveys WHERE at least one optional field is filled in) / COUNT(all completed surveys) * 100%`

-   less than 5% of abandoned surveys without all mandatory fields filled
    -   Measurement method: The ratio of the number of surveys with status `abandoned` to the sum of all started surveys (`completed` + `abandoned`).
    -   Formula: `Number of abandoned surveys / (Number of completed surveys + Number of abandoned surveys) * 100%`


