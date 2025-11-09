import { test, expect } from "../fixtures";
import { createEmptySurvey, createSurveyWithResponse, getUserIdByEmail } from "../fixtures/survey-fixtures";

test.describe("Survey Start Flow", () => {
  test("should complete full survey start flow for unauthenticated user", async ({
    page,
    surveyPage,
    loginPage,
    surveyFillPage,
    supabase,
    cleanup,
  }) => {
    // Create empty survey for this test
    const surveyData = await createEmptySurvey(supabase, undefined, `unauthenticated-${Date.now()}`);
    cleanup.track(surveyData);

    // Step 1: Open survey page for existing survey
    await surveyPage.goto(surveyData.surveySlug);

    // Step 2: Wait for data to be loaded
    await surveyPage.waitForDataLoaded();

    // Step 3: Check if basic competition information is displayed
    // TODO: check if the information is correct (e.g. competition name, dates, location)
    expect(await surveyPage.isCompetitionInfoVisible()).toBeTruthy();
    expect(await surveyPage.isAnonymityInfoVisible()).toBeTruthy();
    expect(await surveyPage.getCompetitionName()).toBeTruthy();
    expect(await surveyPage.getCompetitionDates()).toBeTruthy();
    expect(await surveyPage.getCompetitionLocation()).toBeTruthy();

    // Step 4: Check if "Sign In to Start" button is visible
    expect(await surveyPage.isStartButtonVisible()).toBeTruthy();
    const buttonText = await surveyPage.getStartButtonText();
    expect(buttonText).toBe("Sign In to Start");

    // Step 5: Click "Sign In to Start" button
    await surveyPage.clickStartButton();

    // Step 6: Check if redirected to login page
    await page.waitForURL(/\/login/);
    expect(page.url()).toContain("/login");
    expect(page.url()).toContain(`redirect_to=/surveys/${surveyData.surveySlug}/fill`);

    // Step 7: Enter credentials from environment variables
    const email = process.env.E2E_USER_EMAIL;
    const password = process.env.E2E_USER_PASSWORD;

    if (!email || !password) {
      throw new Error("E2E_USER_EMAIL and E2E_USER_PASSWORD must be set in .env.test");
    }

    await loginPage.login(email, password);

    // Step 8: Check if redirected to survey fill page
    await page.waitForURL(new RegExp(`/surveys/.*/fill`), { timeout: 10000 });
    expect(page.url()).toContain(`/surveys/${surveyData.surveySlug}/fill`);

    // Verify survey fill page is loaded
    await surveyFillPage.waitForPageVisible();
    expect(await surveyFillPage.isLoaded()).toBeTruthy();
  });

  test("should show 'Continue Survey' for authenticated user with existing response", async ({
    page,
    surveyPage,
    loginPage,
    supabase,
    cleanup,
  }) => {
    const email = process.env.E2E_USER_EMAIL;
    const password = process.env.E2E_USER_PASSWORD;

    if (!email || !password) {
      throw new Error("E2E_USER_EMAIL and E2E_USER_PASSWORD must be set in .env.test");
    }

    // Get user ID to create response for
    const userId = await getUserIdByEmail(supabase, email);

    // Create survey with existing response for this user
    const surveyData = await createSurveyWithResponse(
      supabase,
      userId,
      undefined,
      `with-other-user-response-${Date.now()}`
    );
    cleanup.track(surveyData);

    // First, login
    await loginPage.goto();
    await loginPage.login(email, password);
    await page.waitForURL("/");

    // Then visit survey page
    await surveyPage.goto(surveyData.surveySlug);
    await surveyPage.waitForDataLoaded();

    // Should show "Continue Survey" if user already has a response
    const buttonText = await surveyPage.getStartButtonText();
    expect(buttonText).toBe("Continue Survey");
  });

  test("should show 'Start Survey' for authenticated user without response", async ({
    page,
    surveyPage,
    loginPage,
    supabase,
    cleanup,
  }) => {
    const email = process.env.E2E_USER_EMAIL;
    const password = process.env.E2E_USER_PASSWORD;

    if (!email || !password) {
      throw new Error("E2E_USER_EMAIL and E2E_USER_PASSWORD must be set in .env.test");
    }

    const email2 = process.env.E2E_USER2_EMAIL;
    if (!email2) {
      throw new Error("E2E_USER2_EMAIL must be set in .env.test");
    }

    // Get user ID to create response for
    const userId2 = await getUserIdByEmail(supabase, email2);

    // Create a survey with response for another user
    const surveyData = await createSurveyWithResponse(
      supabase,
      userId2,
      undefined,
      `no-other-users-response-${Date.now()}`
    );
    cleanup.track(surveyData);

    // First, login
    await loginPage.goto();
    await loginPage.login(email, password);
    await page.waitForURL("/");

    // Visit survey page
    await surveyPage.goto(surveyData.surveySlug);
    await surveyPage.waitForDataLoaded();

    // Should show "Start Survey" for authenticated user without response (ignoring other users' responses)
    const buttonText = await surveyPage.getStartButtonText();
    expect(buttonText).toBe("Start Survey");
  });
});
