<conversation_summary>
<decisions>
1.  **Role Management**: User roles (`User`, `Moderator`, `Super Admin`) will be managed in the `profiles` table, linked one-to-one with the `auth.users` table from Supabase. A trigger will automatically create a profile for each new user.
2.  **Main Entities**: `Competitions` and `Surveys` will be separate entities to enable flexibility in the future. A competition can have one survey in the MVP.
3.  **Survey Responses**: The table with user responses will be called `survey_responses`. It will contain a unique constraint on `(user_id, survey_id)` to prevent multiple submissions.
4.  **MVP Survey Structure**: For the MVP, the `survey_responses` table will directly contain columns for `overall_rating` (INTEGER 1-10) and `open_feedback` (TEXT), simplifying the initial schema.
5.  **Status Calculation**: The `abandoned` status for survey responses will be determined dynamically using a database `VIEW`, rather than stored as state. The view will calculate status based on `created_at` and `completed_at` timestamps.
6.  **Permissions (RLS)**:
    *   **Users**: Can create, read, and update only their own survey responses.
    *   **Moderators**: Have full CRUD permissions for `competitions` and `surveys`, all User permissions, and `SELECT` (read) access to all `survey_responses`.
    *   **Super Admins**: Inherit all Moderator permissions and can additionally manage user roles in the `profiles` table.
7.  **Data Anonymization**: Only the AI-anonymized version of open feedback will be stored in the database to ensure GDPR compliance.
8.  **Competition Details**: The `competitions` table will use an `INTEGER` primary key and will contain fields for `city`, `country_code` (ISO 3166-1 alpha-3), and `tasks_count`.
9.  **Data Integrity**: `CHECK` constraints will be used to ensure logical date ordering (e.g., `ends_at > starts_at`) and valid formats for URL slugs.
10. **Survey URL**: The `slug` column in the `surveys` table will store the user-friendly URL part. A partial unique index will ensure uniqueness for non-null values.
11. **Timestamps**: Key tables will contain an `updated_at` column, automatically managed by a database trigger, to track the time of last modification.
12. **Default Survey State**: A survey will be considered closed by default if its `opens_at` and `closes_at` dates are not set (are `NULL`).
</decisions>

<matched_recommendations>
1.  **User Profiles and Roles**: Create a `profiles` table with a one-to-one relationship with `auth.users` to handle application-specific user data and roles.
2.  **Dynamic Status**: Use a database `VIEW` to dynamically calculate the `abandoned` status for survey responses, centralizing logic and simplifying the backend.
3.  **Simplified MVP Schema**: Add `overall_rating` and `open_feedback` columns directly to the `survey_responses` table to simplify the initial model, deferring complex question/answer structure.
4.  **Role-Based Security (RLS)**: Implement Row-Level Security policies to strictly control data access: users can only access their own responses, while moderators have broader read access to results and full control over competitions/surveys.
5.  **Unique Submissions**: Enforce a `UNIQUE` constraint on the combination of `user_id` and `survey_id` in the `survey_responses` table to prevent duplicates.
6.  **Data Types and Constraints**: Use specific data types such as `ENUM` for roles, `TIMESTAMPTZ` for dates, `CHAR(3)` for ISO country codes, and `CHECK` constraints to enforce data integrity at the database level.
7.  **URL Slugs**: Use a `TEXT` column for URL slugs with a partial unique index to ensure uniqueness while allowing `NULL` values.
8.  **Automatic Timestamps**: Implement a trigger to automatically update the `updated_at` column when records change, ensuring a reliable audit log.
</matched_recommendations>

<database_planning_summary>
### a. Main Database Schema Requirements
The database schema for PilotVoice MVP will be built on PostgreSQL and Supabase. The main principles are simplicity, scalability, and security. The schema must support user authentication, competition and survey management, response collection, and permission differentiation for different roles. It is crucial to ensure response anonymity and data integrity through the use of appropriate data types and constraints.

### b. Key Entities and Their Relationships
1.  **`profiles`**: Stores user data. 1-to-1 relationship with `auth.users`. Contains `user_id`, `role`, optional `civl_id`, and `registration_reason`.
2.  **`competitions`**: Stores competition information. Contains `id`, `name`, dates, `city`, `country_code`, `tasks_count`, and `participant_count`.
3.  **`surveys`**: Defines surveys. Has an N-to-1 relationship with `competitions` (`competition_id`). Contains `id`, opening/closing dates, and an optional unique URL `slug`.
4.  **`survey_responses`**: Stores pilot responses to surveys. N-to-1 relationship with `users` (`user_id`) and N-to-1 with `surveys` (`survey_id`). In MVP, contains `overall_rating` and `open_feedback`.

### c. Important Security and Scalability Considerations
*   **Security**: Data access will be strictly controlled through Row-Level Security (RLS) in PostgreSQL. Users will only have access to their own data. Moderators will have access to manage competitions/surveys and read all responses, but not edit them. Super Admin will manage roles.
*   **Scalability**: Separating `competitions` and `surveys` entities allows for future expansion. The simplified response model in MVP can be migrated in the future to a more complex question and answer structure without disrupting existing data. Using indexes on foreign keys and frequently filtered columns will ensure performance.

</database_planning_summary>=
</conversation_summary>

