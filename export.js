(() => {
  'use strict';

  const csvEscape = value => `"${String(value ?? '').replaceAll('"', '""')}"`;

  function flattenReport(report) {
    const rows = [];
    Object.entries(report.detections || {}).forEach(([category, detections]) => {
      detections.forEach(item => {
        rows.push({
          Category: category,
          Name: item.name || item.id,
          Detected: item.detected ? 'Yes' : 'No',
          Evidence: (item.evidence || []).join('; '),
          URL: report.url,
          ScannedAt: report.scannedAt
        });
      });
    });

    const seo = report.seo || {};
    rows.push(
      { Category: 'seo', Name: 'Page title', Detected: seo.title ? 'Yes' : 'No', Evidence: seo.title, URL: report.url, ScannedAt: report.scannedAt },
      { Category: 'seo', Name: 'Meta description', Detected: seo.metaDescription ? 'Yes' : 'No', Evidence: seo.metaDescription, URL: report.url, ScannedAt: report.scannedAt },
      { Category: 'seo', Name: 'Canonical URL', Detected: seo.canonicalUrl ? 'Yes' : 'No', Evidence: seo.canonicalUrl, URL: report.url, ScannedAt: report.scannedAt },
      { Category: 'seo', Name: 'H1 count', Detected: seo.h1Count === 1 ? 'Yes' : 'No', Evidence: String(seo.h1Count ?? 0), URL: report.url, ScannedAt: report.scannedAt },
      { Category: 'seo', Name: 'Open Graph tags', Detected: seo.openGraphTags?.length ? 'Yes' : 'No', Evidence: String(seo.openGraphTags?.length || 0), URL: report.url, ScannedAt: report.scannedAt },
      { Category: 'seo', Name: 'Robots meta', Detected: seo.robotsMeta ? 'Yes' : 'No', Evidence: seo.robotsMeta, URL: report.url, ScannedAt: report.scannedAt },
      { Category: 'seo', Name: 'Schema markup', Detected: seo.schemaMarkup?.length ? 'Yes' : 'No', Evidence: String(seo.schemaMarkup?.length || 0), URL: report.url, ScannedAt: report.scannedAt }
    );
    return rows;
  }

  function toCsv(report) {
    const rows = flattenReport(report);
    const headers = ['Category', 'Name', 'Detected', 'Evidence', 'URL', 'ScannedAt'];
    return [headers.join(','), ...rows.map(row => headers.map(header => csvEscape(row[header])).join(','))].join('\n');
  }

  function downloadText(filename, text, mimeType) {
    const blob = new Blob([text], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.append(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  window.StackSpyExport = { flattenReport, toCsv, downloadText };
})();
