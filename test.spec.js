const { test, expect } = require('@playwright/test');
const path = require('path');
const FILE_URL = 'file://' + path.resolve(__dirname, 'index.html');
const MOBILE = { width: 390, height: 844, isMobile: true, hasTouch: true };

// Reusable touch drag between two cards
async function touchDrag(page, b0, b2) {
  const sx = b0.x + b0.width / 2, sy = b0.y + b0.height / 2;
  const ex = b2.x + b2.width / 2, ey = b2.y + b2.height / 2;

  function mkTouchScript(x, y) {
    return `new Touch({identifier:1,target:document.elementFromPoint(${x},${y})||document.body,clientX:${x},clientY:${y},pageX:${x},pageY:${y},screenX:${x},screenY:${y}})`;
  }

  // touchstart — dispatch on the element at the actual coordinates so e.target is correct
  await page.evaluate(([x, y]) => {
    function mkT(x, y) { return new Touch({ identifier: 1, target: document.elementFromPoint(x, y) || document.body, clientX: x, clientY: y, pageX: x, pageY: y, screenX: x, screenY: y }); }
    const el = document.elementFromPoint(x, y) || document.body;
    el.dispatchEvent(new TouchEvent('touchstart', { bubbles: true, cancelable: true, touches: [mkT(x, y)], changedTouches: [mkT(x, y)] }));
  }, [sx, sy]);

  await page.waitForTimeout(200); // wait for 150ms timer

  // touchmove steps
  const steps = 12;
  for (let i = 1; i <= steps; i++) {
    const ix = sx + (ex - sx) * i / steps;
    const iy = sy + (ey - sy) * i / steps;
    await page.evaluate(([x, y]) => {
      function mkT(x, y) { return new Touch({ identifier: 1, target: document.elementFromPoint(x, y) || document.body, clientX: x, clientY: y, pageX: x, pageY: y, screenX: x, screenY: y }); }
      document.dispatchEvent(new TouchEvent('touchmove', { bubbles: true, cancelable: true, touches: [mkT(x, y)], changedTouches: [mkT(x, y)] }));
    }, [ix, iy]);
    await page.waitForTimeout(28);
  }

  // touchend
  await page.evaluate(([x, y]) => {
    function mkT(x, y) { return new Touch({ identifier: 1, target: document.elementFromPoint(x, y) || document.body, clientX: x, clientY: y, pageX: x, pageY: y, screenX: x, screenY: y }); }
    document.dispatchEvent(new TouchEvent('touchend', { bubbles: true, cancelable: true, touches: [], changedTouches: [mkT(x, y)] }));
  }, [ex, ey]);

  await page.waitForTimeout(400);
}

test.describe('World Clock — Full Feature Suite', () => {

  // ── 1. 기본 렌더링 ─────────────────────────────────────────────────────────
  test('1. 카드 3개 렌더링 (Seoul / Hanoi / San Diego)', async ({ page }) => {
    await page.setViewportSize(MOBILE);
    await page.goto(FILE_URL);
    await page.waitForTimeout(500);
    await expect(page.locator('.clock-card')).toHaveCount(3);
    await expect(page.locator('[data-id="seoul"]')).toBeVisible();
    await expect(page.locator('[data-id="hanoi"]')).toBeVisible();
    await expect(page.locator('[data-id="sandiego"]')).toBeVisible();
    console.log('✅ 카드 3개 렌더링 OK');
  });

  // ── 2. 실시간 업데이트 ─────────────────────────────────────────────────────
  test('2. 1초마다 시간 업데이트 (ss 변경)', async ({ page }) => {
    await page.setViewportSize(MOBILE);
    await page.goto(FILE_URL);
    await page.waitForTimeout(300);
    const ss1 = await page.locator('.clock-card').first().locator('.t-ss').textContent();
    await page.waitForTimeout(1100);
    const ss2 = await page.locator('.clock-card').first().locator('.t-ss').textContent();
    expect(ss1).not.toBe(ss2);
    console.log('✅ 실시간 업데이트 OK:', ss1, '->', ss2);
  });

  // ── 3. 기본값: 초 표시 (showSeconds 기본값 = true) ──────────────────────
  test('3. 기본값 - 초(ss) 표시됨', async ({ page }) => {
    await page.setViewportSize(MOBILE);
    await page.goto(FILE_URL);
    await page.evaluate(() => localStorage.removeItem('tz-settings'));
    await page.reload();
    await page.waitForTimeout(400);
    const display = await page.locator('.clock-card').first().locator('.ss-wrap')
      .evaluate(el => getComputedStyle(el).display);
    expect(display).not.toBe('none');
    console.log('✅ 기본값 초 표시 OK');
  });

  // ── 4. 기본값: 24시간 ────────────────────────────────────────────────────
  test('4. 기본값 - 24시간 포맷 (AM/PM 없음)', async ({ page }) => {
    await page.setViewportSize(MOBILE);
    await page.goto(FILE_URL);
    await page.evaluate(() => localStorage.removeItem('tz-settings'));
    await page.reload();
    await page.waitForTimeout(400);
    const ampm = await page.locator('.clock-card').first().locator('.t-ampm').textContent();
    expect(ampm.trim()).toBe('');
    console.log('✅ 24시간 기본값 OK');
  });

  // ── 5. 설정 버튼 → 바텀시트 ──────────────────────────────────────────────
  test('5. 설정 버튼 → 바텀시트 열림/닫힘', async ({ page }) => {
    await page.setViewportSize(MOBILE);
    await page.goto(FILE_URL);
    await page.waitForTimeout(400);
    await expect(page.locator('.sheet-overlay')).not.toHaveClass(/open/);
    await page.click('#settingsBtn');
    await page.waitForTimeout(250);
    await expect(page.locator('.sheet-overlay')).toHaveClass(/open/);
    await page.click('#sheetClose');
    await page.waitForTimeout(250);
    await expect(page.locator('.sheet-overlay')).not.toHaveClass(/open/);
    console.log('✅ 바텀시트 열림/닫힘 OK');
  });

  // ── 6. 설정: 초 표시 토글 ────────────────────────────────────────────────
  test('6. 설정 - 초 표시 토글 (ON→OFF→ON)', async ({ page }) => {
    await page.setViewportSize(MOBILE);
    await page.goto(FILE_URL);
    await page.evaluate(() => localStorage.removeItem('tz-settings'));
    await page.reload();
    await page.waitForTimeout(400);
    // 기본값: 초 보임
    let display = await page.locator('.clock-card').first().locator('.ss-wrap')
      .evaluate(el => getComputedStyle(el).display);
    expect(display).not.toBe('none');
    // 설정 열고 초 OFF
    await page.click('#settingsBtn');
    await page.waitForTimeout(200);
    await page.click('#tog-showSeconds');
    await page.waitForTimeout(200);
    display = await page.locator('.clock-card').first().locator('.ss-wrap')
      .evaluate(el => getComputedStyle(el).display);
    expect(display).toBe('none');
    // 다시 초 ON
    await page.click('#tog-showSeconds');
    await page.waitForTimeout(200);
    display = await page.locator('.clock-card').first().locator('.ss-wrap')
      .evaluate(el => getComputedStyle(el).display);
    expect(display).not.toBe('none');
    console.log('✅ 초 표시 토글 ON→OFF→ON OK');
  });

  // ── 7. 설정: AM/PM 전환 ──────────────────────────────────────────────────
  test('7. 설정 - 24h ↔ AM/PM 전환', async ({ page }) => {
    await page.setViewportSize(MOBILE);
    await page.goto(FILE_URL);
    await page.evaluate(() => localStorage.removeItem('tz-settings'));
    await page.reload();
    await page.waitForTimeout(400);
    await page.click('#settingsBtn');
    await page.waitForTimeout(200);
    await page.click('#tog-use24h');  // 24h → AM/PM
    await page.waitForTimeout(300);
    const ampm = await page.locator('.clock-card').first().locator('.t-ampm').textContent();
    expect(ampm.trim()).toMatch(/AM|PM/);
    console.log('✅ AM/PM 전환 OK:', ampm.trim());
  });

  // ── 8. 설정: 다크/라이트 모드 ────────────────────────────────────────────
  test('8. 설정 - 다크 ↔ 라이트 모드 전환', async ({ page }) => {
    await page.setViewportSize(MOBILE);
    await page.goto(FILE_URL);
    await page.evaluate(() => localStorage.removeItem('tz-settings'));
    await page.reload();
    await page.waitForTimeout(400);
    // 기본 다크 모드 확인
    expect(await page.evaluate(() => document.body.classList.contains('light'))).toBe(false);
    // 라이트로 전환
    await page.click('#settingsBtn');
    await page.waitForTimeout(200);
    await page.click('#tog-darkMode');
    await page.waitForTimeout(300);
    expect(await page.evaluate(() => document.body.classList.contains('light'))).toBe(true);
    console.log('✅ 다크→라이트 전환 OK');
  });

  // ── 9. 비즈니스 상태 배지 ────────────────────────────────────────────────
  test('9. 비즈니스 상태 배지 표시', async ({ page }) => {
    await page.setViewportSize(MOBILE);
    await page.goto(FILE_URL);
    await page.waitForTimeout(500);
    const labels = await page.locator('.biz-label').allTextContents();
    expect(labels.length).toBe(3);
    for (const l of labels) expect(l).toMatch(/Working|Early\/Late|Sleeping/);
    console.log('✅ 비즈니스 배지 OK:', labels);
  });

  // ── 10. 시차 배지 ────────────────────────────────────────────────────────
  test('10. 시차 배지 (+Xh / Local)', async ({ page }) => {
    await page.setViewportSize(MOBILE);
    await page.goto(FILE_URL);
    await page.waitForTimeout(500);
    const diffs = await page.locator('.time-diff').allTextContents();
    expect(diffs.length).toBe(3);
    for (const d of diffs) expect(d).toMatch(/Local|[+-]\d+h/);
    console.log('✅ 시차 배지 OK:', diffs);
  });

  // ── 11. 하루 진행률 바 ───────────────────────────────────────────────────
  test('11. 하루 진행률 바 (0–100%)', async ({ page }) => {
    await page.setViewportSize(MOBILE);
    await page.goto(FILE_URL);
    await page.waitForTimeout(500);
    const widths = await page.locator('.progress-fill').evaluateAll(
      els => els.map(e => parseFloat(e.style.width))
    );
    expect(widths.length).toBe(3);
    widths.forEach(w => { expect(w).toBeGreaterThan(0); expect(w).toBeLessThanOrEqual(100); });
    console.log('✅ 진행률 바 OK:', widths.map(w => w.toFixed(1) + '%'));
  });

  // ── 12. 드래그 순서 변경 (핸들에서 시작) ─────────────────────────────────
  test('12. 터치 드래그 - 핸들에서 시작, 카드 순서 변경', async ({ browser }) => {
    const ctx = await browser.newContext({ ...MOBILE, permissions: [] });
    const page = await ctx.newPage();
    await page.goto(FILE_URL);
    await page.waitForTimeout(600);
    const before = await page.locator('.clock-card').evaluateAll(els => els.map(e => e.dataset.id));
    console.log('드래그 전:', before);

    // 핸들은 카드 우측 끝 52px 영역 — 핸들 중앙에서 시작
    const card0 = await page.locator('.clock-card').nth(0).boundingBox();
    const card2 = await page.locator('.clock-card').nth(2).boundingBox();

    // 시작: 첫 번째 카드의 핸들 (우측 끝 26px 지점)
    const handleBox = {
      x: card0.x + card0.width - 26,
      y: card0.y + card0.height / 2,
      width: 1, height: 1
    };
    // 끝: 세 번째 카드 중앙
    const destBox = {
      x: card2.x + card2.width / 2,
      y: card2.y + card2.height / 2,
      width: 1, height: 1
    };
    await touchDrag(page, handleBox, destBox);

    const after = await page.locator('.clock-card').evaluateAll(els => els.map(e => e.dataset.id));
    console.log('드래그 후:', after);
    expect(before.join(',')).not.toBe(after.join(','));
    console.log('✅ 드래그(핸들) 순서 변경 OK');
    await ctx.close();
  });

  // ── 13. 드래그 후 고스트 잔류 없음 ──────────────────────────────────────
  test('13. 드래그 후 고스트 DOM 잔류 없음', async ({ browser }) => {
    const ctx = await browser.newContext({ ...MOBILE, permissions: [] });
    const page = await ctx.newPage();
    await page.goto(FILE_URL);
    await page.waitForTimeout(500);
    const b0 = await page.locator('.clock-card').nth(0).boundingBox();
    const b1 = await page.locator('.clock-card').nth(1).boundingBox();
    await touchDrag(page, b0, b1);
    const orphans = await page.evaluate(() =>
      [...document.querySelectorAll('body > *')].filter(el => {
        const s = getComputedStyle(el);
        return s.position === 'fixed' && parseInt(s.zIndex) >= 9999;
      }).length
    );
    expect(orphans).toBe(0);
    console.log('✅ 고스트 잔류 없음 OK');
    await ctx.close();
  });

  // ── 14. localStorage 설정 복원 ──────────────────────────────────────────
  test('14. localStorage - 설정 저장 및 복원', async ({ page }) => {
    await page.setViewportSize(MOBILE);
    await page.goto(FILE_URL);
    await page.waitForTimeout(300);
    await page.evaluate(() => {
      localStorage.setItem('tz-settings', JSON.stringify({ showSeconds: true, use24h: false, darkMode: false }));
    });
    await page.reload();
    await page.waitForTimeout(500);
    const isLight = await page.evaluate(() => document.body.classList.contains('light'));
    const ssDisp  = await page.locator('.clock-card').first().locator('.ss-wrap').evaluate(el => getComputedStyle(el).display);
    const ampm    = await page.locator('.clock-card').first().locator('.t-ampm').textContent();
    expect(isLight).toBe(true);
    expect(ssDisp).not.toBe('none');
    expect(ampm.trim()).toMatch(/AM|PM/);
    console.log('✅ localStorage 설정 복원 OK');
  });

  // ── 15. 오버레이 클릭으로 시트 닫기 ─────────────────────────────────────
  test('15. 오버레이 클릭으로 바텀시트 닫기', async ({ page }) => {
    await page.setViewportSize(MOBILE);
    await page.goto(FILE_URL);
    await page.waitForTimeout(400);
    await page.click('#settingsBtn');
    await page.waitForTimeout(300);
    await expect(page.locator('.sheet-overlay')).toHaveClass(/open/);
    await page.mouse.click(5, 5);
    await page.waitForTimeout(300);
    await expect(page.locator('.sheet-overlay')).not.toHaveClass(/open/);
    console.log('✅ 오버레이 클릭 닫기 OK');
  });

});
