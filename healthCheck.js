/* Detect editable fields for popup health reporting. */
(function () {
  function isEditable(el) { return window.SlashSnipEngine && window.SlashSnipEngine.editable(el); }
  window.SlashSnipHealth = function () {
    const active = window.SlashSnipEngine && window.SlashSnipEngine.active();
    const editables = [...document.querySelectorAll('input, textarea, [contenteditable="true"], [role="textbox"]')].filter(el => !el.disabled && !el.hidden);
    return { active: true, currentSite: location.hostname, inputDetected: Boolean(active && /INPUT|TEXTAREA/.test(active.tagName)), editableDetected: Boolean(active || editables.length), message: active || editables.length ? 'Extension active' : 'No editable field found.' };
  };
})();
