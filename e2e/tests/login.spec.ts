import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';

test.describe('Login Page', () => {
  test('should load successfully', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    
    expect(await loginPage.isLoaded()).toBeTruthy();
  });

  test('should show validation error for invalid email', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    
    await loginPage.login('invalid-email', 'password123');
    
    // Check for validation error
    await expect(loginPage.errorMessage).toBeVisible();
  });

  test('should show error for empty fields', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    
    await loginPage.submitButton.click();
    
    // HTML5 validation should prevent submission
    expect(page.url()).toContain('/login');
  });

  test('should have forgot password link', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    
    await expect(loginPage.forgotPasswordLink).toBeVisible();
  });

  test('should navigate to forgot password page', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    
    await loginPage.forgotPasswordLink.click();
    
    expect(page.url()).toContain('/forgot-password');
  });
});

