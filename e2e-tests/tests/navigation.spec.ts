import { test, expect } from '@playwright/test';

test.describe('Navigation from Landing to Sanasto', () => {
  test('should navigate from landing page to Sanasto game', async ({ page }) => {
    // Start at the landing page
    await page.goto('/');
    
    // Verify we're on the landing page
    await expect(page.locator('h1')).toContainText('Sanaattori');
    
    // Click on the Sanasto game card
    await page.click('a[href="/sanasto"]');
    
    // Wait for navigation and verify we're on the Sanasto game page
    await page.waitForURL('**/sanasto');
    
    // Check that the Sanasto game header is displayed
    await expect(page.locator('h1')).toContainText('SANASTO');
  });

  test('should load Sanasto game assets correctly', async ({ page }) => {
    await page.goto('/');
    
    // Click to navigate to Sanasto
    await page.click('a[href="/sanasto"]');
    await page.waitForURL('**/sanasto');
    
    // Wait for the game to be fully loaded
    // Check for game board (the main game component)
    await expect(page.locator('.flex.flex-col.h-screen')).toBeVisible({ timeout: 10000 });
    
    // Verify game components are present
    // Header should be visible
    await expect(page.locator('header')).toBeVisible();
    
    // Game board area should be visible (contains the word grid)
    const boardArea = page.locator('text=Statistics').or(page.locator('text=Settings'));
    await expect(boardArea.first()).toBeVisible();
  });

  test('should have working back navigation', async ({ page }) => {
    // Navigate to Sanasto
    await page.goto('/sanasto');
    await expect(page.locator('h1')).toContainText('SANASTO');
    
    // Use browser back button
    await page.goBack();
    
    // Should be back at landing page
    await expect(page.locator('h1')).toContainText('Sanaattori');
    await expect(page.locator('text=Collection of Finnish Word Games')).toBeVisible();
  });
});
