/* MV3 service worker: storage routing, command handling, and no-icon fallback status. */
importScripts('storage.js');
async function activeTab() { const [tab] = await chrome.tabs.query({ active: true, currentWindow: true }); return tab; }
async function notify(message) {
  // No icon files are shipped; use extension badge/title status instead of image-backed notifications.
  console.warn(`SlashSnip: ${message}`);
  try {
    await chrome.action.setBadgeText({ text: '!' });
    await chrome.action.setBadgeBackgroundColor({ color: '#7c3aed' });
    await chrome.action.setTitle({ title: `SlashSnip - ${message}` });
  } catch (_) {}
}
async function copyFallback(text, reason) {
  await chrome.storage.local.set({ slashsnip_clipboard_fallback: text });
  notify(`Snippet copied to clipboard. ${reason || 'Insertion was not available.'}`);
}
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  (async () => {
    if (msg.type === 'GET_SNIPPETS') sendResponse({ snippets: await SlashSnipStorage.all() });
    if (msg.type === 'SAVE_SNIPPET') { const snippet = await SlashSnipStorage.save(msg.snippet); chrome.runtime.sendMessage({ type: 'SNIPPETS_UPDATED' }); sendResponse({ snippet }); }
    if (msg.type === 'DELETE_SNIPPET') { await SlashSnipStorage.remove(msg.id); chrome.runtime.sendMessage({ type: 'SNIPPETS_UPDATED' }); sendResponse({ ok: true }); }
    if (msg.type === 'USED_SNIPPET') { await SlashSnipStorage.increment(msg.id); sendResponse({ ok: true }); }
    if (msg.type === 'INSERT_FAILED') { await copyFallback(msg.text, msg.reason); sendResponse({ ok: true }); }
  })(); return true;
});
chrome.commands.onCommand.addListener(async command => {
  if (command !== 'open-quick-search') return;
  const tab = await activeTab();
  if (!tab?.id) return notify('No active tab found.');
  chrome.tabs.sendMessage(tab.id, { type: 'OPEN_QUICK_SEARCH' }).catch(() => notify('SlashSnip cannot run on this page.'));
});
