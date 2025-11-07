import { test, expect } from '@playwright/test';
import { HomePage } from '../pages/HomePage';

test.describe('Home Page', () => {
  test('should load successfully', async ({ page }) => {
    const homePage = new HomePage(page);
    await homePage.goto();
    
    expect(await homePage.isLoaded()).toBeTruthy();
  });

  test('should have correct page title', async ({ page }) => {
    const homePage = new HomePage(page);
    await homePage.goto();
    
    const title = await homePage.getTitle();
    expect(title).toContain('PilotVoice');
  });

  test('should navigate to login page', async ({ page }) => {
    const homePage = new HomePage(page);
    await homePage.goto();
    
    await homePage.navigateToLogin();
    
    expect(page.url()).toContain('/login');
  });

  test('should navigate to register page', async ({ page }) => {
    const homePage = new HomePage(page);
    await homePage.goto();
    
    await homePage.navigateToRegister();
    
    expect(page.url()).toContain('/register');
  });

  test('should have visible heading', async ({ page }) => {
    const homePage = new HomePage(page);
    await homePage.goto();
    
    await expect(homePage.heading).toBeVisible();
  });
});

