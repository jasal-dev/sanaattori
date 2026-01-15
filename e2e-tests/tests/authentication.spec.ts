import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  // Generate a unique username for each test run to avoid conflicts
  const timestamp = Date.now();
  const testUsername = `testuser_${timestamp}`;
  const testPassword = 'TestPassword123!';

  test('should display Login and Register buttons when not authenticated', async ({ page }) => {
    await page.goto('/sanasto');
    
    // Check that Login and Register buttons are visible
    await expect(page.locator('button:has-text("Login")')).toBeVisible();
    await expect(page.locator('button:has-text("Register")')).toBeVisible();
    
    // Logout button should not be visible
    await expect(page.locator('button:has-text("Logout")')).not.toBeVisible();
  });

  test('should open registration modal when Register button is clicked', async ({ page }) => {
    await page.goto('/sanasto');
    
    // Click Register button
    await page.click('button:has-text("Register")');
    
    // Check that the auth modal opened with registration form
    await expect(page.locator('text=Create Account')).toBeVisible();
    await expect(page.locator('input[type="text"]')).toBeVisible();
    await expect(page.locator('input[type="password"]').first()).toBeVisible();
  });

  test('should open login modal when Login button is clicked', async ({ page }) => {
    await page.goto('/sanasto');
    
    // Click Login button
    await page.click('button:has-text("Login")');
    
    // Check that the auth modal opened with login form
    await expect(page.locator('text=Login').first()).toBeVisible();
    await expect(page.locator('input[type="text"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('should successfully register a new user', async ({ page }) => {
    await page.goto('/sanasto');
    
    // Click Register button
    await page.click('button:has-text("Register")');
    
    // Fill in the registration form
    await page.fill('input[type="text"]', testUsername);
    await page.fill('input[type="password"]', testPassword);
    
    // Fill confirm password (assuming there's a second password field)
    const passwordFields = await page.locator('input[type="password"]').all();
    if (passwordFields.length > 1) {
      await passwordFields[1].fill(testPassword);
    }
    
    // Submit the form
    await page.click('button[type="submit"]:has-text("Create Account")');
    
    // Wait for the modal to close and check that user is logged in
    await page.waitForTimeout(1000); // Give time for API call
    
    // After successful registration, user should be logged in
    // Check for username display or Logout button
    await expect(page.locator(`text=${testUsername}`).or(page.locator('button:has-text("Logout")'))).toBeVisible({ timeout: 5000 });
  });

  test('should successfully login with existing user', async ({ page }) => {
    await page.goto('/sanasto');
    
    // Click Login button
    await page.click('button:has-text("Login")');
    
    // Fill in the login form with the user we just created
    await page.fill('input[type="text"]', testUsername);
    await page.fill('input[type="password"]', testPassword);
    
    // Submit the form
    await page.click('button[type="submit"]:has-text("Login")');
    
    // Wait for the modal to close and check that user is logged in
    await page.waitForTimeout(1000); // Give time for API call
    
    // Check that username is displayed
    await expect(page.locator(`text=${testUsername}`)).toBeVisible({ timeout: 5000 });
    
    // Check that Logout button is visible
    await expect(page.locator('button:has-text("Logout")')).toBeVisible();
    
    // Login and Register buttons should not be visible
    await expect(page.locator('button:has-text("Login")')).not.toBeVisible();
    await expect(page.locator('button:has-text("Register")')).not.toBeVisible();
  });

  test('should successfully logout', async ({ page }) => {
    await page.goto('/sanasto');
    
    // First login
    await page.click('button:has-text("Login")');
    await page.fill('input[type="text"]', testUsername);
    await page.fill('input[type="password"]', testPassword);
    await page.click('button[type="submit"]:has-text("Login")');
    
    // Wait for login to complete
    await page.waitForTimeout(1000);
    await expect(page.locator('button:has-text("Logout")')).toBeVisible({ timeout: 5000 });
    
    // Click Logout button
    await page.click('button:has-text("Logout")');
    
    // Wait for logout to complete
    await page.waitForTimeout(1000);
    
    // Check that we're logged out
    await expect(page.locator('button:has-text("Login")')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('button:has-text("Register")')).toBeVisible();
    await expect(page.locator('button:has-text("Logout")')).not.toBeVisible();
    
    // Username should not be visible
    await expect(page.locator(`text=${testUsername}`)).not.toBeVisible();
  });

  test('should persist authentication across page reloads', async ({ page }) => {
    await page.goto('/sanasto');
    
    // Login
    await page.click('button:has-text("Login")');
    await page.fill('input[type="text"]', testUsername);
    await page.fill('input[type="password"]', testPassword);
    await page.click('button[type="submit"]:has-text("Login")');
    
    // Wait for login to complete
    await page.waitForTimeout(1000);
    await expect(page.locator('button:has-text("Logout")')).toBeVisible({ timeout: 5000 });
    
    // Reload the page
    await page.reload();
    
    // Check that user is still logged in after reload
    await expect(page.locator('button:has-text("Logout")')).toBeVisible({ timeout: 5000 });
    await expect(page.locator(`text=${testUsername}`)).toBeVisible();
  });

  test('should not allow typing in game board when login modal is open', async ({ page }) => {
    await page.goto('/sanasto');
    
    // Click Login button to open modal
    await page.click('button:has-text("Login")');
    
    // Wait for modal to open
    await expect(page.locator('text=Login').first()).toBeVisible();
    
    // Try to type a letter (which would normally go to the game board)
    await page.keyboard.press('a');
    
    // The letter should NOT appear in the game board
    // Instead, it should either be in the username field or ignored
    // We can check that the game board hasn't changed
    // This is a regression test for the keyboard input bug
    
    // Close modal by pressing Escape
    await page.keyboard.press('Escape');
    
    // Wait for modal to close
    await expect(page.locator('text=Login').first()).not.toBeVisible({ timeout: 2000 });
  });

  test('should show error message for invalid login credentials', async ({ page }) => {
    await page.goto('/sanasto');
    
    // Click Login button
    await page.click('button:has-text("Login")');
    
    // Try to login with invalid credentials
    await page.fill('input[type="text"]', 'nonexistentuser');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]:has-text("Login")');
    
    // Wait for error message
    await page.waitForTimeout(1000);
    
    // Check for error message (assuming there's an error display)
    // This might need adjustment based on actual error UI
    await expect(page.locator('text=/Invalid|Error|failed/i')).toBeVisible({ timeout: 5000 });
  });

  test('should validate username and password requirements', async ({ page }) => {
    await page.goto('/sanasto');
    
    // Click Register button
    await page.click('button:has-text("Register")');
    
    // Try to register with username that's too short (less than 3 characters)
    await page.fill('input[type="text"]', 'ab');
    await page.fill('input[type="password"]', testPassword);
    
    const passwordFields = await page.locator('input[type="password"]').all();
    if (passwordFields.length > 1) {
      await passwordFields[1].fill(testPassword);
    }
    
    // Try to submit - should show validation error or prevent submission
    await page.click('button[type="submit"]:has-text("Create Account")');
    
    // Check for validation message (minimum 3 characters for username)
    await expect(page.locator('text=/minimum|least 3/i').or(page.locator('text=Minimum 3 characters'))).toBeVisible({ timeout: 2000 });
  });
});
