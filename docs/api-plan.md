# REST API Plan

## 1. Resources

-   **Profiles**: Represents user-specific data extending Supabase's `auth.users`. Mapped to the `profiles` table.
-   **Competitions**: Represents paragliding competitions. Mapped to the `competitions` table.
-   **Surveys**: Represents surveys associated with competitions. Mapped to the `surveys` table.
-   **Survey Responses**: Represents user-submitted responses to surveys. Mapped to the `survey_responses` table.
-   **Admin**: A virtual resource for administrative operations like role management.
-   **Anonymizer**: A virtual resource for processing text to remove personal data.

## 2. Endpoints

### Profiles

#### GET /api/profiles/me

-   **Description**: Retrieves the profile of the currently authenticated user.
-   **Request Body**: None.
-   **Response Body**:
    ```json
    {
      "user_id": "uuid",
      "role": "user | moderator | super_admin",
      "civl_id": "integer | null",
      "registration_reason": "string | null",
      "created_at": "timestamptz",
      "updated_at": "timestamptz"
    }
    ```
-   **Success**: `200 OK`
-   **Error**: `401 Unauthorized`, `404 Not Found`

#### PATCH /api/profiles/me

-   **Description**: Updates the profile of the currently authenticated user.
-   **Request Body**:
    ```json
    {
      "civl_id": "integer | null",
      "registration_reason": "string | null"
    }
    ```
-   **Response Body**: The updated profile object.
-   **Success**: `200 OK`
-   **Error**: `400 Bad Request`, `401 Unauthorized`

### Competitions

#### GET /api/competitions

-   **Description**: Retrieves a paginated list of all competitions.
-   **Query Parameters**:
    -   `page` (integer, default: 1): The page number for pagination.
    -   `pageSize` (integer, default: 10): The number of items per page.
    -   `sortBy` (string, default: 'starts_at'): Field to sort by.
    -   `order` (string, default: 'desc'): Sort order ('asc' or 'desc').
-   **Response Body**:
    ```json
    {
      "data": [
        {
          "id": "integer",
          "name": "string",
          "starts_at": "timestamptz",
          "ends_at": "timestamptz",
          "city": "string",
          "country_code": "string",
          "tasks_count": "integer",
          "participant_count": "integer | null"
        }
      ],
      "pagination": {
        "page": 1,
        "pageSize": 10,
        "total": 100
      }
    }
    ```
-   **Success**: `200 OK`
-   **Error**: `401 Unauthorized`

#### GET /api/competitions/{id}

-   **Description**: Retrieves a single competition by its ID.
-   **Response Body**: A single competition object.
-   **Success**: `200 OK`
-   **Error**: `401 Unauthorized`, `404 Not Found`

#### POST /api/competitions

-   **Description**: Creates a new competition. (Moderator or Super Admin only)
-   **Request Body**:
    ```json
    {
      "name": "string",
      "starts_at": "timestamptz",
      "ends_at": "timestamptz",
      "city": "string",
      "country_code": "string",
      "tasks_count": "integer",
      "participant_count": "integer | null"
    }
    ```
-   **Response Body**: The newly created competition object.
-   **Success**: `201 Created`
-   **Error**: `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`

#### PATCH /api/competitions/{id}

-   **Description**: Updates an existing competition. (Moderator or Super Admin only)
-   **Request Body**: Fields from the competition object to update.
-   **Response Body**: The updated competition object.
-   **Success**: `200 OK`
-   **Error**: `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`

#### DELETE /api/competitions/{id}

-   **Description**: Deletes a competition. (Moderator or Super Admin only)
-   **Response Body**: None.
-   **Success**: `204 No Content`
-   **Error**: `401 Unauthorized`, `403 Forbidden`, `404 Not Found`

### Surveys

#### GET /api/surveys

-   **Description**: Retrieves a list of surveys, filterable by competition.
-   **Query Parameters**:
    -   `competitionId` (integer, optional): Filter surveys by competition ID.
-   **Response Body**: An array of survey objects.
-   **Success**: `200 OK`
-   **Error**: `401 Unauthorized`

#### GET /api/surveys/{id}

-   **Description**: Retrieves a single survey by its ID.
-   **Response Body**: A single survey object.
-   **Success**: `200 OK`
-   **Error**: `401 Unauthorized`, `404 Not Found`

#### POST /api/surveys

-   **Description**: Creates a new survey. (Moderator or Super Admin only)
-   **Request Body**:
    ```json
    {
      "competition_id": "integer",
      "opens_at": "timestamptz | null",
      "closes_at": "timestamptz | null",
      "slug": "string | null"
    }
    ```
-   **Response Body**: The newly created survey object.
-   **Success**: `201 Created`
-   **Error**: `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`

#### PATCH /api/surveys/{id}

-   **Description**: Updates a survey. (Moderator or Super Admin only)
-   **Request Body**: Fields from the survey object to update.
-   **Response Body**: The updated survey object.
-   **Success**: `200 OK`
-   **Error**: `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`

### Survey Responses

#### GET /api/surveys/{surveyId}/responses/me

-   **Description**: Retrieves the current user's response for a specific survey.
-   **Response Body**: The survey response object or `null` if it doesn't exist.
-   **Success**: `200 OK`
-   **Error**: `401 Unauthorized`, `404 Not Found` (for the survey)

#### POST /api/surveys/{surveyId}/responses

-   **Description**: Creates a new survey response for the current user. This is called when a user first starts a survey.
-   **Request Body**: Can be an empty object to initialize the response, or can contain initial data.
    ```json
    {
      "overall_rating": "integer | null"
    }
    ```
-   **Response Body**: The newly created survey response object.
-   **Success**: `201 Created`
-   **Error**: `400 Bad Request`, `401 Unauthorized`, `409 Conflict` (if response already exists)

#### PATCH /api/survey-responses/{responseId}

-   **Description**: Updates (saves progress for) a specific survey response.
-   **Request Body**:
    ```json
    {
      "overall_rating": "integer | null",
      "open_feedback": "string | null",
      "completed_at": "timestamptz | null"
    }
    ```
-   **Response Body**: The updated survey response object.
-   **Success**: `200 OK`
-   **Error**: `400 Bad Request`, `401 Unauthorized`, `403 Forbidden` (if not owner)

### Admin

#### GET /api/admin/users

-   **Description**: Retrieves a list of users for role management. (Super Admin only)
-   **Query Parameters**:
    -   `email` (string, optional): Filter users by email.
    -   `page`, `pageSize` for pagination.
-   **Response Body**: A paginated list of user and profile objects.
-   **Success**: `200 OK`
-   **Error**: `401 Unauthorized`, `403 Forbidden`

#### PATCH /api/admin/profiles/{userId}

-   **Description**: Updates a user's role. (Super Admin only)
-   **Request Body**:
    ```json
    {
      "role": "user | moderator"
    }
    ```
-   **Response Body**: The updated profile object.
-   **Success**: `200 OK`
-   **Error**: `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`

### Anonymizer

#### POST /api/anonymize

-   **Description**: Processes a string of text to find and suggest anonymized replacements for personal data.
-   **Request Body**:
    ```json
    {
      "text": "The user's original text."
    }
    ```
-   **Response Body**:
    ```json
    {
      "originalText": "The user's original text.",
      "anonymizedText": "The AI-processed, anonymized text."
    }
    ```
-   **Success**: `200 OK`
-   **Error**: `400 Bad Request`

### Business Logic

#### GET /api/surveys/{id}/results

-   **Description**: Retrieves aggregated, anonymous results for a survey. (Moderator or Super Admin only)
-   **Response Body**:
    ```json
    {
      "surveyId": "integer",
      "competitionName": "string",
      "participantCount": "integer",
      "responsesCompleted": "integer",
      "responsesAbandoned": "integer",
      "averageOverallRating": "float",
      "openFeedbackCompletionRate": "float" // as a percentage
    }
    ```
-   **Success**: `200 OK`
-   **Error**: `401 Unauthorized`, `403 Forbidden`, `404 Not Found`

## 3. Authentication and Authorization

-   **Authentication**: The API will use JSON Web Tokens (JWTs) provided by Supabase Auth. The client must include the `Authorization: Bearer <SUPABASE_JWT>` header in all requests to authenticated endpoints. The Astro middleware will validate the token and attach the user session to `context.locals`.

-   **Authorization**: Authorization is enforced at two levels:
    1.  **Database (RLS)**: Supabase's Row Level Security policies are the primary mechanism. They ensure users can only access or modify data they own, and that roles like 'moderator' and 'super_admin' have appropriate permissions as defined in `db-plan.md`.
    2.  **API Endpoints**: The API routes in Astro will contain checks against the user's role (`context.locals.user.role`) for endpoints that require specific permissions (e.g., creating a competition, viewing aggregated results). This provides an additional layer of security and allows for earlier, more specific error responses.

## 4. Validation and Business Logic

-   **Validation**:
    -   Input validation will be handled by Zod schemas in each API route handler.
    -   This includes checking for required fields, data types, string formats (e.g., email), and ranges (e.g., `overall_rating` between 1 and 10).
    -   Database constraints (e.g., `CHECK (ends_at > starts_at)`) provide a final layer of data integrity. Zod schemas in the API should mirror these constraints to provide better user feedback.

-   **Business Logic Implementation**:
    -   **GDPR Anonymization**: Implemented via the `/api/anonymize` endpoint. The client is responsible for calling this endpoint before submitting open feedback via `PATCH /api/survey-responses/{id}`.
    -   **Survey Status**: The `survey_responses_status` view in the database computes the status (`started`, `completed`, `abandoned`) dynamically. The API can query this view for reporting. The client sets `completed_at` when the user finishes the mandatory parts, which triggers the 'completed' status.
    -   **Profile Completion Gate**: This logic will be implemented on the client-side. After a user completes a survey, the client will check their profile. If it's incomplete and they try to start another survey, the UI will redirect them to their profile page instead of calling the API to start a new response.
    -   **Aggregated Results**: The `/api/surveys/{id}/results` endpoint encapsulates the logic for calculating metrics. It will fetch the necessary data (responses, competition details) and perform the aggregations before returning the final report.
