import { chromium } from 'playwright';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on('pageerror', (e) => errors.push(String(e).slice(0, 160)));
await page.goto('http://localhost:5199/', { waitUntil: 'networkidle', timeout: 30000 }).catch(() => {});
await page.waitForTimeout(3500);
for (let y = 0; y < 14; y++) { await page.mouse.wheel(0, 900); await page.waitForTimeout(200); }
await page.evaluate(() => window.scrollTo(0, 0));
await page.waitForTimeout(900);
await page.screenshot({ path: '/tmp/gais-landing-full.png', fullPage: true });
await page.screenshot({ path: '/tmp/gais-hero.png' });
await page.goto('http://localhost:5199/dashboard', { waitUntil: 'networkidle', timeout: 30000 }).catch(() => {});
await page.waitForTimeout(3000);
await page.screenshot({ path: '/tmp/gais-dashboard.png' });
console.log('errors:', errors.slice(0, 5).join(' | ') || 'none');
await browser.close();
