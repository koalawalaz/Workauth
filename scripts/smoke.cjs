// End-to-end smoke walk-through of the prototype. Usage: node scripts/smoke.cjs [baseUrl] [shotDir]
const { chromium } = require('playwright');
const BASE = process.argv[2] || 'http://localhost:4173/';
const SHOTS = process.argv[3] || 'screenshots';
const fs = require('fs');
fs.mkdirSync(SHOTS, { recursive: true });

(async () => {
  const browser = await chromium.launch();
  const errors = [];
  const ctx = await browser.newContext({ viewport: { width: 1366, height: 900 } });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push('console: ' + m.text()));
  page.on('dialog', (d) => d.accept());
  const shot = async (n) => { await page.waitForTimeout(1500); return page.screenshot({ path: `${SHOTS}/${n}.png`, fullPage: true }); };
  const step = (s) => console.log('✓', s);
  let n = 0;
  const as = async (session, path) => {
    await page.evaluate((v) => localStorage.setItem('workauth-demo-session-v1', JSON.stringify(v)), session);
    await page.goto(BASE + '?r=' + ++n + '#' + path);
  };

  await page.goto(BASE);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.getByText('Every worker’s record, verified').waitFor();
  await shot('01-landing'); step('landing');

  // Directory
  await page.goto(BASE + '#/directory');
  await page.getByText('Dead Sea Hospitality Group').waitFor();
  await shot('02-directory'); step('directory');

  // Employer registration (provisional path)
  await page.goto(BASE + '#/register');
  await page.getByLabel('Commercial Registration No. (CRN)').fill('300125');
  await page.getByRole('button', { name: 'Check CRN' }).click();
  await page.getByText('verified manually by the Ministry').waitFor();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByLabel('Company legal name').fill('Zarqa Test Bakery');
  await page.getByLabel('Authorised representative').fill('Test Owner');
  await page.getByLabel('Contact email').fill('owner@bakery.jo');
  await page.getByLabel('Mobile number').fill('+962790000000');
  await page.getByLabel('Choose a password').fill('password123');
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByLabel('Verification code').fill('123456');
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByText('Get started').waitFor();
  await page.getByText('Unrated').first().waitFor();
  step('employer registered (provisional, unrated)');

  // Add employee with an SSC mismatch (ID ends in 7)
  await page.getByRole('button', { name: 'Add employee' }).first().click();
  await page.getByLabel('Full name (English)').fill('Test Worker');
  await page.getByLabel('Full name (Arabic)').fill('عامل تجريبي');
  await page.getByLabel('NIN / Work permit no.').fill('9990001117');
  await page.getByLabel('Date of birth').fill('1995-01-01');
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByLabel('Job title').fill('Baker');
  await page.getByLabel('Department').fill('Kitchen');
  await page.getByLabel('Gross monthly salary').fill('300');
  await page.getByLabel('Start date').fill('2025-01-01');
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByLabel('SSC reference no.').fill('SSC-1');
  await page.getByLabel('Insurance provider').fill('Jordan Insurance Co.');
  await page.getByLabel('Policy expiry').fill('2027-06-01');
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.locator('input[type=file]').first().setInputFiles({ name: 'contract.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4') });
  await page.getByText('no malware found').waitFor();
  await page.getByRole('button', { name: 'Save' }).click();
  await page.getByText(/SSC verification result: SSC mismatch/).waitFor();
  step('employee added → SSC mismatch flagged');
  await page.goto(BASE + '#/employer');
  await page.getByText('Red Zone — score below 70').waitFor();
  await shot('03-employer-new-redzone'); step('score recalculated → Red Zone (60/100)');

  // Seeded employer dashboard
  await as({ role: 'employer', employerId: 'emp-1' }, '/employer');
  await page.getByText('Score history (12 months)').waitFor();
  await shot('04-employer-dashboard'); step('employer dashboard');

  // Bulk upload sample
  await page.goto(BASE + '#/employer/bulk');
  await page.getByRole('button', { name: 'Use sample file' }).click();
  await page.getByText('Import results').waitFor();
  await shot('05-bulk'); step('bulk upload report');

  // Employee files an anonymous dispute
  await as(null, '/login/employee');
  await page.getByLabel('National ID or Work Permit number').fill('9861234501');
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByLabel('Verification code').fill('123456');
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByText('Your record').first().waitFor();
  await shot('06-employee-record'); step('employee login + record');
  await page.getByRole('button', { name: 'This is wrong' }).nth(1).click();
  await page.getByLabel('What is the correct information?').fill('280 JOD');
  await page.getByText('Keep my identity private').click();
  await page.getByRole('button', { name: 'Submit' }).click();
  await page.getByText('Your report was sent').waitFor();
  const tracking = (await page.locator('.font-mono.text-2xl').textContent()).trim();
  await page.getByRole('button', { name: 'Track my reports' }).click();
  await page.getByText(tracking).waitFor();
  step('dispute filed ' + tracking);

  // AI contract analyzer (demo results)
  await page.getByRole('link', { name: 'Check my contract' }).click();
  await page.getByRole('button', { name: /Check this contract/ }).click();
  await page.getByText('Checking your contract…').waitFor();
  await page.getByText('Your contract report').waitFor({ timeout: 10000 });
  await page.getByText('Critical risk').waitFor();
  await shot('06b-analyzer'); step('contract analyzer report');
  await page.getByRole('button', { name: /Dead Sea Hospitality/ }).click();
  await page.getByRole('button', { name: /Check this contract/ }).click();
  await page.getByText('No clauses conflict with the law.').waitFor({ timeout: 10000 }).catch(async () => { await page.getByRole('tab', { name: /Problems/ }).click(); await page.getByText('No clauses conflict with the law.').waitFor(); });
  step('compliant sample shows no violations');

  // Employer sees it anonymised
  await as({ role: 'employer', employerId: 'emp-1' }, '/employer/disputes');
  await page.getByText(tracking).waitFor();
  const card = page.locator('article', { hasText: tracking });
  if (await card.getByText('Mahmoud').count()) throw new Error('anonymous reporter name leaked to employer');
  await shot('07-employer-disputes'); step('employer sees anonymous dispute without name');

  // Advance clock 5 business days → auto-escalation
  await page.getByRole('button', { name: 'Demo', exact: true }).click();
  await page.getByRole('button', { name: /Advance clock 5 business days/ }).click();
  await page.getByRole('button', { name: /Advance clock 1 day/ }).click();
  await page.getByRole('button', { name: 'Demo', exact: true }).click();
  await page.getByRole('button', { name: 'Closed' }).click();
  await page.locator('article', { hasText: tracking }).getByText('Escalated to MoL').waitFor();
  step('auto-escalation after deadline');

  // MoL inspector resolves + logs an inspection
  await as({ role: 'mol', inspectorId: 'insp-1' }, '/mol');
  await page.getByText('National compliance overview').waitFor();
  await page.waitForTimeout(600);
  await shot('08-mol-overview'); step('MoL overview');
  await page.goto(BASE + '#/mol/disputes');
  const mcard = page.locator('article', { hasText: tracking });
  await mcard.getByText('Identity protected').waitFor();
  await mcard.getByPlaceholder('Resolution notes').fill('Employer ordered to pay the difference.');
  await mcard.getByRole('button', { name: 'Resolve' }).click();
  await page.locator('article', { hasText: tracking }).waitFor({ state: 'detached' });
  step('MoL resolved escalated dispute');
  await page.goto(BASE + '#/mol/employers/emp-1');
  await page.getByRole('button', { name: 'Record inspection' }).click();
  await page.getByLabel('Findings').fill('Smoke test inspection.');
  await page.getByRole('button', { name: 'Submit' }).click();
  await page.getByText('Smoke test inspection.').waitFor();
  if (await page.getByRole('button', { name: /edit|delete/i }).count()) throw new Error('inspection is editable');
  await shot('09-mol-employer'); step('inspection recorded, append-only');

  // Admin weights page
  await as({ role: 'mol', inspectorId: 'admin-1' }, '/mol/weights');
  await page.getByText('Trust Score weights').waitFor();
  await page.goto(BASE + '#/mol/audit');
  await page.getByText('dispute.resolve').first().waitFor();
  step('admin weights + audit log');

  // Arabic / RTL
  await page.getByRole('button', { name: 'العربية' }).click();
  const dir = await page.evaluate(() => document.documentElement.dir);
  if (dir !== 'rtl') throw new Error('dir is ' + dir);
  await page.goto(BASE + '#/mol');
  await page.getByText('نظرة عامة على الامتثال الوطني').waitFor();
  await page.waitForTimeout(600);
  await shot('10-mol-overview-ar'); step('Arabic RTL');

  // Phone width, Arabic employee portal
  const phone = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const p2 = await phone.newPage();
  p2.on('pageerror', (e) => errors.push('pageerror(phone): ' + e.message));
  await p2.goto(BASE);
  await p2.evaluate(() => { localStorage.setItem('workauth-lang', 'ar'); localStorage.setItem('workauth-demo-session-v1', JSON.stringify({ role: 'employee', employeeId: 'ee-demo' })); });
  await p2.goto(BASE + '?r=phone#/employee');
  await p2.getByText('سجلّك').first().waitFor({ timeout: 8000 }).catch(async (e) => { await p2.screenshot({ path: SHOTS + '/fail.png' }); console.log('URL', p2.url()); throw e; });
  const overflow = await p2.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
  if (overflow) errors.push('horizontal overflow on phone employee page');
  await p2.screenshot({ path: `${SHOTS}/11-employee-phone-ar.png`, fullPage: true });
  await p2.goto(BASE + '#/');
  const overflow2 = await p2.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
  if (overflow2) errors.push('horizontal overflow on phone landing');
  await p2.screenshot({ path: `${SHOTS}/12-landing-phone-ar.png`, fullPage: true });
  await p2.goto(BASE + '?r=phone2#/employee/contract');
  await p2.getByRole('button', { name: /افحص هذا العقد/ }).click();
  await p2.getByText('تقرير عقدك').waitFor({ timeout: 10000 });
  await p2.waitForTimeout(500);
  if (await p2.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1)) errors.push('horizontal overflow on phone analyzer');
  await p2.screenshot({ path: `${SHOTS}/13-analyzer-phone-ar.png`, fullPage: true });
  step('phone width');

  await browser.close();
  const real = errors.filter((e) => !/fonts\.googleapis|ERR_|net::/.test(e));
  if (real.length) { console.log('ERRORS:\n' + real.join('\n')); process.exit(1); }
  console.log('ALL PASSED');
})().catch((e) => { console.error('FAILED:', e.message); process.exit(1); });
