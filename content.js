(() => {
  'use strict';

  function scan() {
    if (!window.StackSpyDetectors?.runStackSpyDetections) {
      throw new Error('StackSpy detectors are unavailable on this page.');
    }
    return window.StackSpyDetectors.runStackSpyDetections();
  }

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message?.type !== 'STACKSPY_SCAN') return false;

    try {
      sendResponse({ ok: true, data: scan() });
    } catch (error) {
      sendResponse({ ok: false, error: error.message || 'Unable to scan this page.' });
    }

    return true;
  });
})();
