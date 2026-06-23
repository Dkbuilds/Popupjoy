/* SlashSnip storage helpers backed by chrome.storage.local. */
const SlashSnipStorage = (() => {
  const KEY = 'slashsnip_snippets';
  const DEFAULTS = [
    { title: 'Follow Up', shortcut: '/followup', content: 'Just following up on my previous message.', category: 'Sales', favorite: true, usageCount: 0 },
    { title: 'Pricing', shortcut: '/pricing', content: 'Please find our pricing details attached.', category: 'Sales', favorite: false, usageCount: 0 },
    { title: 'Demo', shortcut: '/demo', content: 'Happy to schedule a demo.', category: 'Sales', favorite: true, usageCount: 0 }
  ];
  const uid = () => `snip_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const normalize = s => ({ id: s.id || uid(), title: s.title || '', shortcut: s.shortcut || '', content: s.content || '', category: s.category || 'General', favorite: Boolean(s.favorite), usageCount: Number(s.usageCount || 0), updatedAt: s.updatedAt || Date.now() });
  const get = keys => new Promise(resolve => chrome.storage.local.get(keys, resolve));
  const set = obj => new Promise(resolve => chrome.storage.local.set(obj, resolve));
  async function all() {
    const data = await get(KEY);
    if (!Array.isArray(data[KEY])) {
      const seeded = DEFAULTS.map(normalize);
      await set({ [KEY]: seeded });
      return seeded;
    }
    return data[KEY].map(normalize);
  }
  async function save(snippet) {
    const list = await all();
    const item = normalize({ ...snippet, updatedAt: Date.now() });
    const index = list.findIndex(s => s.id === item.id);
    if (index >= 0) list[index] = item; else list.unshift(item);
    await set({ [KEY]: list });
    return item;
  }
  async function remove(id) { await set({ [KEY]: (await all()).filter(s => s.id !== id) }); }
  async function increment(id) {
    const list = await all();
    const item = list.find(s => s.id === id);
    if (item) { item.usageCount = (item.usageCount || 0) + 1; item.lastUsedAt = Date.now(); await set({ [KEY]: list }); }
    return item;
  }
  return { all, save, remove, increment };
})();
