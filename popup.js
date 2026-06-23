(() => {
  'use strict';

  const CATEGORY_META = {
    technologies: { title: 'Technology Detection', icon: '🧩' },
    cms: { title: 'CMS Detection', icon: '🏗️' },
    analytics: { title: 'Analytics Detection', icon: '📈' },
    marketing: { title: 'Marketing Tools', icon: '📣' },
    hosting: { title: 'Hosting Detection', icon: '☁️' }
  };

  const state = { report: null };
  const $ = selector => document.querySelector(selector);

  function setStatus(text, className = '') {
    const status = $('#status');
    status.textContent = text;
    status.className = `status ${className}`.trim();
  }

  function enrichReport(report) {
    Object.entries(report.detections).forEach(([category, items]) => {
      const catalog = report.catalog?.[category] || [];
      items.forEach(item => {
        const details = catalog.find(entry => entry.id === item.id) || {};
        item.name = details.name || item.id;
        item.icon = details.icon || '•';
      });
    });
    return report;
  }

  function renderSummary(report) {
    const totalDetected = Object.values(report.detections).flat().filter(item => item.detected).length;
    const seoScore = report.seo?.score || 0;
    $('#summary').innerHTML = `
      <article class="summary-tile"><p class="summary-value">${totalDetected}</p><p class="summary-label">Signals found</p></article>
      <article class="summary-tile"><p class="summary-value">${seoScore}/6</p><p class="summary-label">SEO score</p></article>
      <article class="summary-tile"><p class="summary-value">${Object.keys(report.detections).length}</p><p class="summary-label">Categories</p></article>
    `;
  }

  function renderCategories(report) {
    $('#categories').innerHTML = Object.entries(report.detections).map(([category, items]) => {
      const detected = items.filter(item => item.detected).length;
      const meta = CATEGORY_META[category];
      return `
        <article class="category-card">
          <div class="category-head">
            <h2 class="category-title"><span>${meta.icon}</span>${meta.title}</h2>
            <span class="category-count">${detected}/${items.length} found</span>
          </div>
          <div class="detection-list">
            ${items.map(item => `
              <div class="detection-row" title="${escapeHtml((item.evidence || []).join('; '))}">
                <div class="tool-name"><span class="tool-icon">${item.icon}</span><span>${item.name}</span></div>
                <span class="evidence">${item.detected ? escapeHtml((item.evidence || ['Detected'])[0]) : 'Not detected'}</span>
                <span class="${item.detected ? 'check' : 'miss'}">${item.detected ? '✓' : '—'}</span>
              </div>
            `).join('')}
          </div>
        </article>
      `;
    }).join('');
  }

  function renderSeo(report) {
    const seo = report.seo || {};
    const rows = [
      ['Page title', seo.title || 'Missing'],
      ['Description', seo.metaDescription || 'Missing'],
      ['Canonical URL', seo.canonicalUrl || 'Missing'],
      ['H1 count', String(seo.h1Count ?? 0)],
      ['Open Graph', `${seo.openGraphTags?.length || 0} tags`],
      ['Robots meta', seo.robotsMeta || 'Missing'],
      ['Schema markup', `${seo.schemaMarkup?.length || 0} blocks`]
    ];
    $('#seo').innerHTML = `
      <p class="category-kicker">SEO Audit</p>
      <h2 class="category-title">🔍 On-page essentials</h2>
      <div class="seo-list">
        ${rows.map(([key, value]) => `<div class="seo-row"><span class="seo-key">${key}</span><span class="seo-value">${escapeHtml(value)}</span></div>`).join('')}
      </div>
    `;
  }

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[char]));
  }

  function buildTextReport(report) {
    const lines = [`StackSpy report for ${report.url}`, `Scanned: ${report.scannedAt}`, ''];
    Object.entries(report.detections).forEach(([category, items]) => {
      lines.push(CATEGORY_META[category].title);
      items.filter(item => item.detected).forEach(item => lines.push(`- ${item.name}: ${(item.evidence || []).join('; ')}`));
      if (!items.some(item => item.detected)) lines.push('- None detected');
      lines.push('');
    });
    lines.push('SEO Audit');
    lines.push(`- Title: ${report.seo.title || 'Missing'}`);
    lines.push(`- Meta description: ${report.seo.metaDescription || 'Missing'}`);
    lines.push(`- Canonical: ${report.seo.canonicalUrl || 'Missing'}`);
    lines.push(`- H1 count: ${report.seo.h1Count}`);
    lines.push(`- Open Graph tags: ${report.seo.openGraphTags.length}`);
    lines.push(`- Robots meta: ${report.seo.robotsMeta || 'Missing'}`);
    lines.push(`- Schema blocks: ${report.seo.schemaMarkup.length}`);
    return lines.join('\n');
  }

  async function getActiveTab() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    return tab;
  }

  async function scanCurrentTab() {
    const tab = await getActiveTab();
    $('#siteUrl').textContent = tab?.url || 'Unknown page';

    if (!tab?.id || !/^https?:\/\//i.test(tab.url || '')) {
      throw new Error('Open an http or https website to scan with StackSpy.');
    }

    let response;
    try {
      response = await chrome.tabs.sendMessage(tab.id, { type: 'STACKSPY_SCAN' });
    } catch (_error) {
      await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['detectors.js', 'content.js'] });
      response = await chrome.tabs.sendMessage(tab.id, { type: 'STACKSPY_SCAN' });
    }

    if (!response?.ok) throw new Error(response?.error || 'Unable to inspect this page.');
    return enrichReport(response.data);
  }

  function enableActions() {
    $('#copyReport').disabled = false;
    $('#exportCsv').disabled = false;
  }

  async function init() {
    $('#copyReport').disabled = true;
    $('#exportCsv').disabled = true;

    try {
      state.report = await scanCurrentTab();
      renderSummary(state.report);
      renderCategories(state.report);
      renderSeo(state.report);
      setStatus('Ready', 'ready');
      enableActions();
    } catch (error) {
      $('#error').hidden = false;
      $('#error').textContent = error.message;
      setStatus('Needs page', 'error-state');
    }
  }

  $('#copyReport').addEventListener('click', async () => {
    if (!state.report) return;
    await navigator.clipboard.writeText(buildTextReport(state.report));
    setStatus('Copied', 'ready');
  });

  $('#exportCsv').addEventListener('click', () => {
    if (!state.report) return;
    const hostname = state.report.hostname || 'stackspy';
    window.StackSpyExport.downloadText(`stackspy-${hostname}.csv`, window.StackSpyExport.toCsv(state.report), 'text/csv;charset=utf-8');
  });

  document.addEventListener('DOMContentLoaded', init);
})();
