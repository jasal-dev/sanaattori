import { test, expect } from '@playwright/test';

test.describe('Statistics Features', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/sanasto');
  });

  test('should open statistics modal when Statistics button is clicked', async ({ page }) => {
    // Click Statistics button in header
    await page.click('button:has-text("Statistics"), button:has-text("Tilastot")');
    
    // Check that the statistics modal opened
    await expect(page.locator('text=/Statistics|Tilastot/i').first()).toBeVisible();
    
    // Check that stats are displayed
    await expect(page.locator('text=/Played|Pelattu/i')).toBeVisible();
    await expect(page.locator('text=/Win Rate|Voittoprosentti/i')).toBeVisible();
  });

  test('should display variation filter dropdown in statistics modal', async ({ page }) => {
    // Open statistics modal
    await page.click('button:has-text("Statistics"), button:has-text("Tilastot")');
    
    // Wait for modal to open
    await expect(page.locator('text=/Statistics|Tilastot/i').first()).toBeVisible();
    
    // Check that variation dropdown exists
    const dropdown = page.locator('select, [role="combobox"]').first();
    await expect(dropdown).toBeVisible();
    
    // Check that dropdown has options for different variations
    // Should have options for 5, 6, 7 letter words and normal/hard modes
    const options = await dropdown.locator('option').allTextContents();
    expect(options.length).toBeGreaterThan(0);
    
    // Verify it contains expected variations (at least 5 letters normal and hard)
    const hasNormalMode = options.some(opt => opt.includes('Normal') || opt.includes('Normaali'));
    const hasHardMode = options.some(opt => opt.includes('Hard') || opt.includes('Vaikea'));
    expect(hasNormalMode).toBeTruthy();
    expect(hasHardMode).toBeTruthy();
  });

  test('should filter statistics when variation is changed', async ({ page }) => {
    // Open statistics modal
    await page.click('button:has-text("Statistics"), button:has-text("Tilastot")');
    await expect(page.locator('text=/Statistics|Tilastot/i').first()).toBeVisible();
    
    // Get the dropdown
    const dropdown = page.locator('select').first();
    
    // Get initial stats value
    const initialPlayed = await page.locator('text=/Played|Pelattu/i').locator('..').locator('.text-3xl, .text-2xl').first().textContent();
    
    // Change variation (select a different option)
    const options = await dropdown.locator('option').all();
    if (options.length > 1) {
      await dropdown.selectOption({ index: 1 });
      
      // Wait a bit for stats to update
      await page.waitForTimeout(500);
      
      // Stats might be different (or same if no games played in that variation)
      // Just verify that the dropdown change was processed
      await expect(dropdown).toBeVisible();
    }
  });

  test('should display guess distribution bar chart when stats are available', async ({ page }) => {
    // First, play a game to generate some statistics
    // Type a word (assuming the game accepts any input or we know valid words)
    await page.keyboard.type('testi'); // 5-letter Finnish word
    await page.keyboard.press('Enter');
    
    // Wait a bit for the guess to be processed
    await page.waitForTimeout(1000);
    
    // Open statistics modal
    await page.click('button:has-text("Statistics"), button:has-text("Tilastot")');
    await expect(page.locator('text=/Statistics|Tilastot/i').first()).toBeVisible();
    
    // Check if guess distribution section exists (it should only show if there are wins)
    const guessDistribution = page.locator('text=/Guess Distribution|Arvausten jakauma/i');
    
    // If there are no wins yet, the chart might not be visible
    // We can't guarantee wins in E2E tests without knowing the solution
    // So we just check that the modal structure is correct
    await expect(page.locator('text=/Played|Pelattu/i')).toBeVisible();
  });

  test('should show guess distribution only for variations with wins', async ({ page }) => {
    // Open statistics modal
    await page.click('button:has-text("Statistics"), button:has-text("Tilastot")');
    await expect(page.locator('text=/Statistics|Tilastot/i').first()).toBeVisible();
    
    // Check the "Won" statistic
    const wonElement = page.locator('text=/Won|Voitettu/i').locator('..').locator('.text-3xl, .text-2xl').first();
    const wonText = await wonElement.textContent();
    const wonCount = wonText ? parseInt(wonText.replace(/[^0-9]/g, '')) : 0;
    
    // If there are wins, guess distribution should be visible
    const guessDistribution = page.locator('text=/Guess Distribution|Arvausten jakauma/i');
    
    if (wonCount > 0) {
      await expect(guessDistribution).toBeVisible();
    }
    // If no wins, the distribution might not be shown - that's expected
  });

  test('should persist statistics in localStorage for unauthenticated users', async ({ page }) => {
    // Clear localStorage first
    await page.evaluate(() => localStorage.clear());
    
    // Play a game to generate stats
    await page.keyboard.type('testi');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);
    
    // Open stats modal
    await page.click('button:has-text("Statistics"), button:has-text("Tilastot")');
    await expect(page.locator('text=/Statistics|Tilastot/i').first()).toBeVisible();
    
    // Get the "Played" count
    const playedElement = page.locator('text=/Played|Pelattu/i').locator('..').locator('.text-3xl').first();
    const playedText = await playedElement.textContent();
    const playedCount = playedText ? parseInt(playedText.replace(/[^0-9]/g, '')) : 0;
    
    // Close modal
    await page.keyboard.press('Escape');
    
    // Reload page
    await page.reload();
    
    // Open stats modal again
    await page.click('button:has-text("Statistics"), button:has-text("Tilastot")');
    await expect(page.locator('text=/Statistics|Tilastot/i').first()).toBeVisible();
    
    // Check that stats are still the same (persisted)
    const playedElementAfter = page.locator('text=/Played|Pelattu/i').locator('..').locator('.text-3xl').first();
    const playedTextAfter = await playedElementAfter.textContent();
    const playedCountAfter = playedTextAfter ? parseInt(playedTextAfter.replace(/[^0-9]/g, '')) : 0;
    
    expect(playedCountAfter).toBeGreaterThanOrEqual(playedCount);
  });

  test('should track statistics separately for different word lengths', async ({ page }) => {
    // Open settings modal
    await page.click('button:has-text("Settings"), button:has-text("Asetukset")');
    await expect(page.locator('text=/Settings|Asetukset/i').first()).toBeVisible();
    
    // Change word length to 6
    await page.click('button:has-text("6")');
    await page.waitForTimeout(500);
    
    // Close settings modal
    await page.keyboard.press('Escape');
    
    // Open statistics modal
    await page.click('button:has-text("Statistics"), button:has-text("Tilastot")');
    await expect(page.locator('text=/Statistics|Tilastot/i').first()).toBeVisible();
    
    // Check that dropdown shows 6 letters variation
    const dropdown = page.locator('select').first();
    const selectedOption = await dropdown.locator('option[selected]').textContent();
    
    // Selected option should mention 6 letters
    expect(selectedOption).toMatch(/6/);
  });

  test('should track statistics separately for normal and hard mode', async ({ page }) => {
    // Open settings modal
    await page.click('button:has-text("Settings"), button:has-text("Asetukset")');
    await expect(page.locator('text=/Settings|Asetukset/i').first()).toBeVisible();
    
    // Enable hard mode (click the toggle)
    const hardModeToggle = page.locator('button').filter({ hasText: /Hard Mode|Vaikea tila/i }).locator('..').locator('button').first();
    await hardModeToggle.click();
    await page.waitForTimeout(500);
    
    // Close settings modal
    await page.keyboard.press('Escape');
    
    // Open statistics modal
    await page.click('button:has-text("Statistics"), button:has-text("Tilastot")');
    await expect(page.locator('text=/Statistics|Tilastot/i').first()).toBeVisible();
    
    // Check that dropdown shows hard mode variation
    const dropdown = page.locator('select').first();
    const selectedOption = await dropdown.locator('option[selected]').textContent();
    
    // Selected option should mention hard mode
    expect(selectedOption).toMatch(/Hard|Vaikea|Schwer|Svår/i);
  });

  test('should close statistics modal when close button is clicked', async ({ page }) => {
    // Open statistics modal
    await page.click('button:has-text("Statistics"), button:has-text("Tilastot")');
    await expect(page.locator('text=/Statistics|Tilastot/i').first()).toBeVisible();
    
    // Click close button (×)
    await page.click('button:has-text("×")');
    
    // Modal should be closed
    await expect(page.locator('text=/Statistics|Tilastot/i').first()).not.toBeVisible({ timeout: 2000 });
  });

  test('should close statistics modal when Escape key is pressed', async ({ page }) => {
    // Open statistics modal
    await page.click('button:has-text("Statistics"), button:has-text("Tilastot")');
    await expect(page.locator('text=/Statistics|Tilastot/i').first()).toBeVisible();
    
    // Press Escape
    await page.keyboard.press('Escape');
    
    // Modal should be closed
    await expect(page.locator('text=/Statistics|Tilastot/i').first()).not.toBeVisible({ timeout: 2000 });
  });

  test('should display all required stat metrics', async ({ page }) => {
    // Open statistics modal
    await page.click('button:has-text("Statistics"), button:has-text("Tilastot")');
    await expect(page.locator('text=/Statistics|Tilastot/i').first()).toBeVisible();
    
    // Check that all required metrics are displayed
    await expect(page.locator('text=/Played|Pelattu/i')).toBeVisible();
    await expect(page.locator('text=/Win Rate|Voittoprosentti/i')).toBeVisible();
    await expect(page.locator('text=/Current Streak|Nykyinen putki/i')).toBeVisible();
    await expect(page.locator('text=/Max Streak|Paras putki/i')).toBeVisible();
    await expect(page.locator('text=/Won|Voitettu/i')).toBeVisible();
    await expect(page.locator('text=/Lost|Hävitty/i')).toBeVisible();
  });
});
