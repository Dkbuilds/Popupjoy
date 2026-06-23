/* Bridge popup/background messages to page insertion, health, and quick search. */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  (async () => {
    if (message.type === 'INSERT_SNIPPET') {
      const result = window.SlashSnipEngine.insertText(message.text || '');
      sendResponse(result);
    } else if (message.type === 'HEALTH_CHECK') {
      sendResponse(window.SlashSnipHealth());
    } else if (message.type === 'OPEN_QUICK_SEARCH') {
      window.SlashSnipQuickSearch(); sendResponse({ ok: true });
    }
  })();
  return true;
});
