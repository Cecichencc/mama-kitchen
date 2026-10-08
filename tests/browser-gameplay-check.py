"""Browser smoke test for Phase1 Pantry→Farm→Basket→Cook flow (fallback path).
Run locally with `python -m http.server 8977` from the repository root.
A network-denied test intentionally triggers the accessible non-WebGL path;
this does NOT validate real WebGL, which needs a hosted iPhone check.
"""
from pathlib import Path
from playwright.sync_api import sync_playwright

# Isolated Chromium blocks navigating to localhost. Assemble a self-contained,
# in-memory page for *fallback* browser-flow testing. Production source remains
# separate ESM modules with real Three.js network import.
import re
ROOT=Path('/mnt/data/kitchen-garden-phase1/public/phase0')

def fallback_markup():
    html=(ROOT/'index.html').read_text()
    css=(ROOT/'styles.css').read_text()
    html=html.replace('<link rel="stylesheet" href="./styles.css" />','<style>'+css+'</style>')
    chunks=[]
    for name in ['grounding.js','i18n.js','domain.js','world.js','game-ui.js','scene.js']:
        src=(ROOT/name).read_text()
        src=re.sub(r'(?ms)^import\s+\{.*?\}\s+from\s+[\"\']\./[^\"\']+[\"\'];\s*','',src)
        src=re.sub(r'(?m)^export\s+','',src)
        if name=='scene.js':
            src=re.sub(r"THREE=await import\('https://cdn\.jsdelivr\.net/npm/three@0\.167\.1/build/three\.module\.js'\);","throw new Error('Intentional non-WebGL fallback test');",src)
        chunks.append(src)
    inline='\n'.join(chunks)+ '\nwindow.__kgTestState = () => game.getState();\n'
    return html.replace('<script type="module" src="./scene.js"></script>', '<script type="module">'+inline+'</script>')

OUT=Path('/mnt/data/kitchen-garden-phase1/screenshots')
OUT.mkdir(exist_ok=True,parents=True)

with sync_playwright() as p:
    b=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
    for width in (320,375,390,430,1024):
        page=b.new_page(viewport={'width':width,'height':844 if width<500 else 800}, device_scale_factor=2 if width<500 else 1)
        
        errors=[]
        page.on('pageerror',lambda e:errors.append(str(e)))
        page.set_content(fallback_markup(),wait_until='domcontentloaded')
        page.locator('#fallback').wait_for(state='visible',timeout=12000)
        assert page.locator('#navFarm').get_attribute('aria-current')=='page'
        overflow=page.evaluate('document.documentElement.scrollWidth > window.innerWidth')
        assert not overflow, f'horizontal overflow at {width}'
        assert not errors, f'page errors at {width}: {errors}'
        if width==390:
            page.screenshot(path=str(OUT/'farm-fallback-390.png'),full_page=True)
            page.click('#navPantry')
            assert page.locator('#pantryView').is_visible()
            page.select_option('#groceryIngredient','tomato')
            page.fill('#groceryQuantity','6')
            page.select_option('#grocerySource','organic')
            page.click('#groceryForm button[type="submit"]')
            assert '6' in page.locator('#stockList').inner_text()
            page.select_option('#groceryIngredient','egg')
            page.fill('#groceryQuantity','8')
            page.select_option('#grocerySource','organic')
            page.click('#groceryForm button[type="submit"]')
            page.screenshot(path=str(OUT/'pantry-two-stocks-390.png'),full_page=True)
            page.click('#navFarm')
            page.click('#fallbackSelectBtn')
            page.locator('#ingredientSheet').wait_for(state='visible')
            assert '6' in page.locator('#ingredientAvailability').inner_text()
            page.fill('#harvestQuantity','2')
            page.click('#harvestBtn')
            assert page.locator('#basketBadge').inner_text()=='2'
            assert page.locator('#tomatoPlotCount').inner_text()=='4'
            page.click('#fallbackEggBtn')
            assert '8' in page.locator('#ingredientAvailability').inner_text()
            page.fill('#harvestQuantity','3')
            page.click('#harvestBtn')
            assert page.locator('#basketBadge').inner_text()=='5'
            page.click('#basketBtn')
            assert page.locator('#basketSheet').is_visible()
            assert page.locator('#basketRecipeBtn').is_enabled()
            page.screenshot(path=str(OUT/'basket-ready-390.png'),full_page=True)
            page.click('#basketRecipeBtn')
            assert page.locator('#recipeSheet').is_visible()
            assert 'Tomato & Egg' in page.locator('#recipeHeading').inner_text()
            page.screenshot(path=str(OUT/'recipe-390.png'),full_page=True)
            page.click('#startCookBtn')
            assert page.locator('#cookSheet').is_visible()
            assert page.locator('[data-actual-batch]').count()==2
            page.screenshot(path=str(OUT/'confirm-cook-390.png'),full_page=True)
            page.click('#confirmCookBtn')
            assert page.locator('#completeSheet').is_visible(), page.locator('#gameToast').inner_text()
            text=page.locator('#remainingStock').inner_text()
            assert '4' in text and '5' in text, text
            snap=page.evaluate('window.__kgTestState()')
            assert [b['onHand'] for b in snap['batches']]==[4,5]
            assert len(snap['sessions'])==1
            page.screenshot(path=str(OUT/'cooked-390.png'),full_page=True)
            page.click('#completeFarmBtn')
            page.click('#settingsBtn')
            page.check('input[name="language"][value="zh-CN"]')
            assert page.locator('html').get_attribute('lang')=='zh-CN'
            assert page.locator('#navPantry').inner_text().find('库存')>=0
            page.screenshot(path=str(OUT/'farm-chinese-390.png'),full_page=True)
            page.click('#settingsSheet [data-close]')
            # Reload persistence is covered by dedicated domain/i18n tests: this
            # in-memory about:blank document does not expose real origin storage.
            assert not errors, errors
            print('End-to-end browser flow: PASS (6/8 → reserve 2/3 → cook → 4/5, stock accounting and immediate localization)')
        if width==430:
            # Mixed-source flow: a shared organic-preferred dish cannot be
            # silently approved when its egg batch is non-organic.
            page.click('#navPantry')
            page.select_option('#groceryIngredient','tomato')
            page.fill('#groceryQuantity','6')
            page.select_option('#grocerySource','organic')
            page.click('#groceryForm button[type="submit"]')
            page.select_option('#groceryIngredient','egg')
            page.fill('#groceryQuantity','8')
            page.select_option('#grocerySource','nonorganic')
            page.click('#groceryForm button[type="submit"]')
            page.click('#navFarm')
            page.click('#fallbackSelectBtn')
            page.fill('#harvestQuantity','2')
            page.click('#harvestBtn')
            page.click('#fallbackEggBtn')
            page.fill('#harvestQuantity','3')
            page.click('#harvestBtn')
            page.click('#basketBtn')
            page.click('#basketRecipeBtn')
            page.click('#startCookBtn')
            assert page.locator('#organicNotice').is_visible()
            page.click('#confirmCookBtn')
            assert page.locator('#cookSheet').is_visible()
            data=page.evaluate('window.__kgTestState()')
            assert [b['onHand'] for b in data['batches']]==[6,8]
            page.check('#organicAck')
            page.click('#confirmCookBtn')
            assert page.locator('#completeSheet').is_visible()
            data=page.evaluate('window.__kgTestState()')
            assert data['sessions'][-1]['sourceStatus']=='mixed'
            assert [b['onHand'] for b in data['batches']]==[4,5]
            print('Mixed organic/nonorganic confirmation: PASS (no deduction before explicit acknowledgement)')
        print(f'Viewport {width}px: PASS — no horizontal overflow, no uncaught page errors')
        page.close()
    b.close()
