// Localised user-facing copy for Kitchen Garden's Phase 0 farm.
// Stock, recipes and meal navigation remain Phase 1+ work; translation keys are reusable.
export const LANGUAGE_STORAGE_KEY = 'kitchen-garden.locale';

export const messages = {
  en: {
    'app.tagline': 'Good Food Grows at Home',
    'farm.title': 'Kitchen Garden',
    'farm.explore': 'Explore Tomato',
    'farm.back': 'Back to Farm',
    'farm.tomato': 'Tomato',
    'farm.vegetableGarden': 'Vegetable Garden',
    'farm.chickenPrompt': 'Good morning! Tap a tomato to explore.',
    'farm.loading': 'Getting your little farm ready…',
    'farm.ready': 'Your 3D farm is ready. Tap a tomato!',
    'farm.focused': 'Tomato selected — zooming in',
    'farm.noWebgl': '3D is not available in this browser.',
    'farm.loadFailed': '3D could not load. You can still inspect the tomato.',
    'farm.contextLost': 'The 3D view was interrupted. Try reloading.',
    'farm.viewLabel': 'Interactive 3D farm: tap a tomato to inspect it',
    'farm.sceneControls': 'Farm camera controls',
    'farm.backLabel': 'Return to the complete farm view',
    'farm.fallbackTitle': 'The 3D farm is unavailable right now',
    'farm.fallbackBody': 'You can still explore the tomato details using the accessible controls.',
    'farm.plotLabel': 'Tomato Garden',
    'farm.breeze': 'A little world of good food',
    'farm.helperLabel': 'Chicken helper',
    'farm.inspect': 'Inspect Tomato',
    'sheet.zone': 'VEGETABLE GARDEN',
    'sheet.description': 'Meet a juicy tomato from your miniature farm.',
    'sheet.3d': 'Real 3D',
    'sheet.3dValue': 'Tappable model',
    'sheet.camera': 'Camera focus',
    'sheet.cameraValue': 'Smooth close-up',
    'sheet.disclaimer': 'Preview only: grocery stock is not connected yet. Harvesting and cooking will arrive in the next phase.',
    'sheet.dismiss': 'Close tomato details',
    'settings.title': 'Settings',
    'settings.open': 'Open settings',
    'settings.close': 'Close settings',
    'settings.language': 'Language',
    'settings.languageHelp': 'Choose your preferred interface language.',
    'settings.english': 'English',
    'settings.chinese': '简体中文',
    'settings.devStatus': 'About this preview',
    'settings.previewNote': 'This phase proves the 3D world, tomato selection and camera movement. It does not invent grocery quantities or change stock.',
    'nav.label': 'Kitchen Garden navigation',
    'nav.farm': 'Farm',
    'nav.meals': "Today's Meals",
    'nav.pantry': 'Pantry',
    'nav.soon': 'Coming soon',
    'nav.mealsSoon': "Today's Meals — coming in a later phase",
    'nav.pantrySoon': 'Pantry — coming in a later phase',
    'common.close': 'Close'
  },
  'zh-CN': {
    'app.tagline': '好食材，在家慢慢长大',
    'farm.title': '厨房小农场',
    'farm.explore': '看看番茄',
    'farm.back': '回到农场',
    'farm.tomato': '番茄',
    'farm.vegetableGarden': '蔬菜园',
    'farm.chickenPrompt': '早上好！点一点番茄看看吧。',
    'farm.loading': '正在准备你的小小农场…',
    'farm.ready': '3D 农场已就绪，点一下番茄吧！',
    'farm.focused': '已选中番茄，镜头正在靠近',
    'farm.noWebgl': '当前浏览器暂时无法显示 3D。',
    'farm.loadFailed': '3D 资源加载失败，你仍可以查看番茄。',
    'farm.contextLost': '3D 画面中断，请刷新后重试。',
    'farm.viewLabel': '可互动的 3D 农场：点番茄查看详情',
    'farm.sceneControls': '农场镜头操作',
    'farm.backLabel': '返回完整农场全景',
    'farm.fallbackTitle': '3D 农场暂时无法显示',
    'farm.fallbackBody': '你仍然可以使用下方按钮查看番茄详情。',
    'farm.plotLabel': '番茄园',
    'farm.breeze': '小小农场，好好吃饭',
    'farm.helperLabel': '小鸡助手',
    'farm.inspect': '查看番茄',
    'sheet.zone': '蔬菜园',
    'sheet.description': '看看这颗小农场里长出来的红番茄。',
    'sheet.3d': '真实 3D',
    'sheet.3dValue': '可点选的模型',
    'sheet.camera': '镜头聚焦',
    'sheet.cameraValue': '轻柔拉近',
    'sheet.disclaimer': '当前是体验版：尚未连接真实食材库存。收获篮和做饭功能将在下一阶段加入。',
    'sheet.dismiss': '关闭番茄详情',
    'settings.title': '设置',
    'settings.open': '打开设置',
    'settings.close': '关闭设置',
    'settings.language': '语言',
    'settings.languageHelp': '选择你喜欢的界面语言。',
    'settings.english': 'English',
    'settings.chinese': '简体中文',
    'settings.devStatus': '关于体验版',
    'settings.previewNote': '本阶段只验证 3D 农场、番茄选择和镜头移动，不会编造食材数量，也不会更改真实库存。',
    'nav.label': '厨房小农场导航',
    'nav.farm': '农场',
    'nav.meals': '今日三餐',
    'nav.pantry': '库存',
    'nav.soon': '即将开放',
    'nav.mealsSoon': '今日三餐将在后续阶段开放',
    'nav.pantrySoon': '食材库存将在后续阶段开放',
    'common.close': '关闭'
  }
};

function readSavedLocale(storage) {
  try {
    const value = storage?.getItem(LANGUAGE_STORAGE_KEY);
    if (value === 'en' || value === 'zh-CN') return value;
  } catch (_) { /* Private browsing may block storage. */ }
  return 'en';
}

export function createTranslator({document: doc = document, storage} = {}) {
  let safeStorage = storage;
  if (safeStorage === undefined) { try { safeStorage = globalThis.localStorage; } catch (_) { safeStorage = null; } }
  let locale = readSavedLocale(safeStorage);
  const get = (key) => messages[locale]?.[key] ?? messages.en[key] ?? key;
  const render = () => {
    doc.documentElement.lang = locale;
    doc.title = locale === 'en' ? 'Kitchen Garden — Explore the Farm' : '厨房小农场 — 探索农场';
    doc.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = get(el.dataset.i18n); });
    doc.querySelectorAll('[data-i18n-aria]').forEach(el => { el.setAttribute('aria-label', get(el.dataset.i18nAria)); });
    doc.querySelectorAll('[data-i18n-title]').forEach(el => { el.title = get(el.dataset.i18nTitle); });
    doc.querySelectorAll('input[name="language"]').forEach(el => { el.checked = el.value === locale; });
  };
  const setLocale = next => {
    if (next !== 'en' && next !== 'zh-CN') return false;
    locale = next;
    try { safeStorage?.setItem(LANGUAGE_STORAGE_KEY, locale); } catch (_) { /* Keep in-memory preference. */ }
    render();
    doc.dispatchEvent(new CustomEvent('kg:languagechange', {detail:{locale}}));
    return true;
  };
  render();
  return {t:get, get locale(){return locale;}, setLocale, render};
}
