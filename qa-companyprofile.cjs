const { chromium } = require('playwright');

const SHOT_DIR = 'C:/Users/imnag/AppData/Local/Temp/claude/C--xampp-htdocs-glansa-SalesTeamManagement/8c0d1235-c064-4efb-86de-c262b93628c7/scratchpad';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  const errors = [];
  page.on('console', (msg) => { if (msg.type() === 'error') errors.push(msg.text()); });
  page.on('pageerror', (err) => errors.push(String(err)));
  page.on('requestfailed', (req) => errors.push(`REQFAIL ${req.url()} ${req.failure()?.errorText}`));

  await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle' });
  await page.fill('input[placeholder="Enter your email"]', 'qa.companyadmin@example.test');
  await page.fill('input[placeholder="Enter your password"]', 'QaTest@12345');
  await page.screenshot({ path: `${SHOT_DIR}/cp-01-login.png` });
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard', { timeout: 15000 });
  await page.screenshot({ path: `${SHOT_DIR}/cp-02-dashboard.png` });

  // Sidebar: confirm "Company Profile" link is visible for this Company Admin
  await page.click('text=Company Management');
  await page.waitForSelector('text=Company Profile', { timeout: 5000 });
  await page.screenshot({ path: `${SHOT_DIR}/cp-03-sidebar.png` });

  await page.click('text=Company Profile');
  await page.waitForURL('**/company/profile', { timeout: 10000 });
  await page.waitForSelector('text=QA Test Co', { timeout: 10000 });
  await page.screenshot({ path: `${SHOT_DIR}/cp-04-profile-view.png`, fullPage: true });

  await page.click('button:has-text("Edit Profile")');
  await page.waitForURL('**/company/profile/edit', { timeout: 10000 });
  await page.waitForSelector('text=Company Information', { timeout: 10000 });
  await page.screenshot({ path: `${SHOT_DIR}/cp-05-profile-edit.png`, fullPage: true });

  // Status toggle must NOT be present for a Company Admin editing their own profile
  const hasStatusToggle = await page.locator('.seg-group').count();

  const legalNameInput = page.getByLabel('Legal Name');
  await legalNameInput.fill('QA Test Co Legal Name Updated');
  await page.click('button:has-text("Save Changes")');
  await page.waitForSelector('text=Company updated successfully', { timeout: 10000 });
  await page.screenshot({ path: `${SHOT_DIR}/cp-06-saved-toast.png` });

  await page.waitForURL('**/company/profile', { timeout: 10000 });
  await page.waitForSelector('text=QA Test Co Legal Name Updated', { timeout: 10000 });
  await page.screenshot({ path: `${SHOT_DIR}/cp-07-profile-updated.png`, fullPage: true });

  console.log('STATUS_TOGGLE_COUNT_FOR_CA:', hasStatusToggle);
  console.log('ERRORS:', JSON.stringify(errors));
  await browser.close();
})().catch((e) => {
  console.error('TEST_FAILED:', e);
  process.exit(1);
});
