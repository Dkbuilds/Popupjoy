/* Robust text insertion engine for plain inputs, contenteditable, and React editors. */
(function () {
  const Engine = {
    editable(el) { return el && (el.tagName === 'TEXTAREA' || (el.tagName === 'INPUT' && /^(text|search|url|tel|email|password|number)?$/i.test(el.type || 'text')) || el.isContentEditable); },
    active() {
      let el = document.activeElement;
      if (el && el.shadowRoot && el.shadowRoot.activeElement) el = el.shadowRoot.activeElement;
      return this.editable(el) ? el : null;
    },
    events(el) {
      ['keydown', 'input', 'keyup', 'change'].forEach(type => el.dispatchEvent(new Event(type, { bubbles: true, cancelable: true, composed: true })));
    },
    setNativeValue(el, value) {
      const proto = el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
      const desc = Object.getOwnPropertyDescriptor(proto, 'value');
      desc && desc.set ? desc.set.call(el, value) : (el.value = value);
    },
    insertText(text) {
      const el = this.active();
      if (!el) return { ok: false, reason: 'No focused editable field was found.' };
      try { el.focus(); } catch (_) {}
      try {
        if (el.tagName === 'TEXTAREA' || el.tagName === 'INPUT') {
          const start = el.selectionStart ?? el.value.length;
          const end = el.selectionEnd ?? start;
          const next = el.value.slice(0, start) + text + el.value.slice(end);
          this.setNativeValue(el, next);
          const pos = start + text.length;
          el.setSelectionRange && el.setSelectionRange(pos, pos);
          this.events(el);
          return { ok: true, method: 'native-input' };
        }
        const sel = window.getSelection();
        if (sel && sel.rangeCount) {
          const range = sel.getRangeAt(0);
          range.deleteContents();
          range.insertNode(document.createTextNode(text));
          range.collapse(false);
          sel.removeAllRanges(); sel.addRange(range);
          this.events(el);
          return { ok: true, method: 'selection-api' };
        }
        if (document.execCommand && document.execCommand('insertText', false, text)) {
          this.events(el); return { ok: true, method: 'execCommand' };
        }
        return { ok: false, reason: 'Editable field was focused, but browser insertion APIs were unavailable.' };
      } catch (error) { return { ok: false, reason: error.message || 'Unexpected insertion error.' }; }
    },
    replaceBeforeCursor(chars, text) {
      const el = this.active();
      if (!el) return { ok: false, reason: 'No focused editable field was found.' };
      if (el.tagName === 'TEXTAREA' || el.tagName === 'INPUT') {
        const end = el.selectionStart ?? 0, start = Math.max(0, end - chars);
        this.setNativeValue(el, el.value.slice(0, start) + text + el.value.slice(el.selectionEnd ?? end));
        const pos = start + text.length; el.setSelectionRange(pos, pos); this.events(el); return { ok: true };
      }
      const sel = window.getSelection();
      if (!sel || !sel.rangeCount) return this.insertText(text);
      for (let i = 0; i < chars; i++) document.execCommand('delete', false);
      return this.insertText(text);
    }
  };
  window.SlashSnipEngine = Engine;
})();
