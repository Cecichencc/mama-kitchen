"""Live Chromium checks of accessible UI when the 3D CDN is unavailable.
This is NOT a WebGL visual test; a real GPU/browser review is still required.
"""
from pathlib import Path
import base64
from playwright.sync_api import sync_playwright

base=Path(__file__).resolve().parents[1]
output=base/'screenshots'
output.mkdir(exist_ok=True)

with sync_playwright() as p:
    browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,
      args=['--no-sandbox','--disable-dev-shm-usage','--disable-gpu-sandbox'])
    for width,height in [(320,700),(375,812),(390,844),(430,932),(1024,900)]:
        page=browser.new_page(viewport={'width':width,'height':height},device_scale_factor=1)
        failures=[]
        page.on('pageerror',lambda e:failures.append(str(e)))
        page.route('https://cdn.jsdelivr.net/**',lambda route:route.abort())
        # Local navigation is blocked by the managed browser; run the exact
        # source modules as inline data URLs and explicitly block only the CDN.
        farmdir=base/'public/phase0'
        markup=(farmdir/'index.html').read_text().replace('<link rel="stylesheet" href="./styles.css" />','').replace('<script type="module" src="./scene.js"></script>','')
        page.set_content(markup)
        page.add_style_tag(content=(farmdir/'styles.css').read_text())
        def as_data(source):
            return 'data:text/javascript;base64,'+base64.b64encode(source.encode()).decode()
        ground=as_data((farmdir/'grounding.js').read_text())
        world=(farmdir/'world.js').read_text().replace("'./grounding.js'",repr(ground))
        code=(farmdir/'scene.js').read_text().replace("'./world.js'",repr(as_data(world))).replace("'./i18n.js'",repr(as_data((farmdir/'i18n.js').read_text())))
        page.add_script_tag(type='module',content=code)
        page.locator('#fallback').wait_for(state='visible')
        assert not page.evaluate('document.documentElement.scrollWidth > window.innerWidth'), f'horizontal overflow at {width}'
        assert page.locator('html').get_attribute('lang')=='en'
        assert not failures,failures
        if width==390:
            page.locator('#settingsBtn').click()
            assert page.locator('#settingsSheet').is_visible()
            page.locator('input[value="zh-CN"]').check()
            assert page.locator('[data-i18n="nav.meals"]').inner_text()=='今日三餐'
            page.locator('#settingsCloseBtn').click()
            page.locator('#fallbackSelectBtn').click()
            assert page.locator('#ingredientSheet').is_visible()
            assert page.locator('#ingredientHeading').inner_text()=='番茄'
            page.locator('#returnBtn').click()
            assert page.locator('#ingredientSheet').is_hidden()
            page.screenshot(path=str(output/'fallback-ui-390.png'),full_page=True)
        print(f'PASS browser fallback: {width}x{height}; no overflow; no uncaught errors')
        page.close()
    browser.close()
