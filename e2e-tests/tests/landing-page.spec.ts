import { test, expect } from '@playwright/test';

test.describe('Landing Page', () => {
  test('should display the Sanaattori title', async ({ page }) => {
    await page.goto('/');
    
    // Check main title
    await expect(page.locator('h1')).toContainText('Sanaattori');
    
    // Check subtitle
    await expect(page.locator('text=Collection of Finnish Word Games')).toBeVisible();
  });

  test('should display Sanasto game card', async ({ page }) => {
    await page.goto('/');
    
    // Check Sanasto game card is present
    await expect(page.locator('text=Sanasto')).toBeVisible();
    await expect(page.locator('text=A Wordle-style word guessing game in Finnish')).toBeVisible();
    
    // Check the game card link
    const sanastoLink = page.locator('a[href="/sanasto"]');
    await expect(sanastoLink).toBeVisible();
  });

  test('should display placeholder cards for future games', async ({ page }) => {
    await page.goto('/');
    
    // Check for "Coming Soon" placeholders
    const comingSoonCards = page.locator('text=Coming Soon');
    await expect(comingSoonCards).toHaveCount(2);
  });

  test('should have proper styling and layout', async ({ page }) => {
    await page.goto('/');
    
    // Check that the game grid exists
    const gameGrid = page.locator('.games-grid');
    await expect(gameGrid).toBeVisible();
    
    // Check footer
    await expect(page.locator('footer')).toContainText('Enjoy our collection of Finnish word games!');
  });
});
