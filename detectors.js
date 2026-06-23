(() => {
  'use strict';

  const DETECTION_CATALOG = {
    technologies: [
      { id: 'react', name: 'React', icon: '⚛️' },
      { id: 'nextjs', name: 'Next.js', icon: '▲' },
      { id: 'vue', name: 'Vue', icon: '🟢' },
      { id: 'angular', name: 'Angular', icon: '🅰️' },
      { id: 'tailwind', name: 'Tailwind CSS', icon: '🌊' },
      { id: 'bootstrap', name: 'Bootstrap', icon: '🅱️' },
      { id: 'jquery', name: 'jQuery', icon: '💠' }
    ],
    cms: [
      { id: 'wordpress', name: 'WordPress', icon: '📝' },
      { id: 'webflow', name: 'Webflow', icon: '🌐' },
      { id: 'shopify', name: 'Shopify', icon: '🛍️' },
      { id: 'wix', name: 'Wix', icon: '✨' },
      { id: 'ghost', name: 'Ghost', icon: '👻' },
      { id: 'hubspotCms', name: 'HubSpot CMS', icon: '🧡' }
    ],
    analytics: [
      { id: 'googleAnalytics', name: 'Google Analytics', icon: '📈' },
      { id: 'googleTagManager', name: 'Google Tag Manager', icon: '🏷️' },
      { id: 'metaPixel', name: 'Meta Pixel', icon: '🔵' },
      { id: 'microsoftClarity', name: 'Microsoft Clarity', icon: '🔎' },
      { id: 'hotjar', name: 'Hotjar', icon: '🔥' },
      { id: 'mixpanel', name: 'Mixpanel', icon: '📊' }
    ],
    marketing: [
      { id: 'hubspotMarketing', name: 'HubSpot', icon: '🧡' },
      { id: 'intercom', name: 'Intercom', icon: '💬' },
      { id: 'drift', name: 'Drift', icon: '🌊' },
      { id: 'calendly', name: 'Calendly', icon: '📅' },
      { id: 'zendesk', name: 'Zendesk', icon: '🎧' }
    ],
    hosting: [
      { id: 'cloudflare', name: 'Cloudflare', icon: '☁️' },
      { id: 'vercel', name: 'Vercel', icon: '▲' },
      { id: 'netlify', name: 'Netlify', icon: '🟦' },
      { id: 'aws', name: 'AWS', icon: '🟠' }
    ]
  };

  const normalize = value => String(value || '').toLowerCase();
  const uniq = values => [...new Set(values.filter(Boolean))];

  function collectPageSignals() {
    const scripts = [...document.scripts].map(script => script.src || script.textContent || '');
    const links = [...document.querySelectorAll('link')].map(link => link.href || link.getAttribute('href') || '');
    const styles = [...document.querySelectorAll('style')].map(style => style.textContent || '');
    const metas = [...document.querySelectorAll('meta')].map(meta => ({
      name: meta.getAttribute('name'),
      property: meta.getAttribute('property'),
      content: meta.getAttribute('content')
    }));
    const html = document.documentElement.outerHTML;
    const bodyClasses = document.body ? [...document.body.classList] : [];
    const allClasses = [...document.querySelectorAll('[class]')]
      .slice(0, 800)
      .flatMap(el => [...el.classList]);
    const scriptText = scripts.join('\n');
    const resourceText = [...scripts, ...links, ...styles].join('\n');
    const sourceText = `${html}\n${resourceText}`;
    const source = normalize(sourceText);

    return {
      html,
      source,
      scripts,
      links,
      styles,
      metas,
      bodyClasses,
      allClasses,
      scriptText: normalize(scriptText),
      resourceText: normalize(resourceText),
      generator: normalize(document.querySelector('meta[name="generator"]')?.content),
      hostname: normalize(location.hostname),
      dom: document
    };
  }

  function detectWithEvidence(id, detected, evidence) {
    return { id, detected: Boolean(detected), evidence: uniq(Array.isArray(evidence) ? evidence : [evidence]) };
  }

  function detectTechnologies(s) {
    const hasClass = prefixes => s.allClasses.some(cls => prefixes.some(prefix => cls === prefix || cls.startsWith(`${prefix}-`) || cls.startsWith(prefix)));
    return [
      detectWithEvidence('react', s.source.includes('__react') || Boolean(window.React) || Boolean(document.querySelector('[data-reactroot], [data-reactid]')), 'React markers in DOM/source'),
      detectWithEvidence('nextjs', Boolean(window.__NEXT_DATA__) || s.source.includes('/_next/') || Boolean(document.querySelector('#__next')), 'Next.js __NEXT_DATA__ or /_next/ assets'),
      detectWithEvidence('vue', Boolean(window.Vue) || s.source.includes('__vue__') || Boolean(document.querySelector('[data-v-app], [data-server-rendered]')), 'Vue runtime or attributes'),
      detectWithEvidence('angular', Boolean(window.angular) || s.source.includes('ng-version') || Boolean(document.querySelector('[ng-version], [ng-app], app-root')), 'Angular runtime or ng-* attributes'),
      detectWithEvidence('tailwind', s.source.includes('tailwind') || hasClass(['sm:', 'md:', 'lg:', 'xl:', '2xl:', 'bg-', 'text-', 'flex', 'grid', 'rounded-', 'shadow-']), 'Tailwind utility classes or assets'),
      detectWithEvidence('bootstrap', s.source.includes('bootstrap') || hasClass(['container', 'row', 'col-', 'btn', 'navbar', 'modal', 'dropdown']), 'Bootstrap classes or assets'),
      detectWithEvidence('jquery', Boolean(window.jQuery || window.$?.fn?.jquery) || s.source.includes('jquery'), 'jQuery global or script source')
    ];
  }

  function detectCms(s) {
    return [
      detectWithEvidence('wordpress', s.source.includes('/wp-content/') || s.source.includes('/wp-includes/') || s.generator.includes('wordpress'), 'WordPress paths or generator meta'),
      detectWithEvidence('webflow', s.source.includes('webflow') || Boolean(document.querySelector('[data-wf-page], [data-wf-site]')), 'Webflow attributes or assets'),
      detectWithEvidence('shopify', s.source.includes('cdn.shopify.com') || s.source.includes('shopify') || Boolean(window.Shopify), 'Shopify CDN/runtime'),
      detectWithEvidence('wix', s.source.includes('wixstatic.com') || s.source.includes('wix.com') || s.generator.includes('wix'), 'Wix assets or generator meta'),
      detectWithEvidence('ghost', s.generator.includes('ghost') || s.source.includes('/ghost/') || s.source.includes('ghost.org'), 'Ghost generator or paths'),
      detectWithEvidence('hubspotCms', s.source.includes('hubspot') || s.source.includes('hs-sites') || s.source.includes('hs-scripts'), 'HubSpot CMS/assets')
    ];
  }

  function detectAnalytics(s) {
    return [
      detectWithEvidence('googleAnalytics', Boolean(window.gtag || window.ga || window.GoogleAnalyticsObject) || /google-analytics\.com|googletagmanager\.com\/gtag\/js|ga\(|gtag\(/i.test(s.source), 'GA globals or scripts'),
      detectWithEvidence('googleTagManager', Boolean(window.google_tag_manager) || /googletagmanager\.com\/gtm\.js|GTM-[A-Z0-9]+/i.test(s.html), 'GTM container marker'),
      detectWithEvidence('metaPixel', Boolean(window.fbq) || /connect\.facebook\.net|fbevents\.js|fbq\(/i.test(s.source), 'Meta Pixel script or fbq'),
      detectWithEvidence('microsoftClarity', Boolean(window.clarity) || /clarity\.ms|clarity\(/i.test(s.source), 'Microsoft Clarity script or function'),
      detectWithEvidence('hotjar', Boolean(window.hj) || /hotjar\.com|hjid|hj\(/i.test(s.source), 'Hotjar script or hj function'),
      detectWithEvidence('mixpanel', Boolean(window.mixpanel) || /cdn\.mxpnl\.com|mixpanel/i.test(s.source), 'Mixpanel script or global')
    ];
  }

  function detectMarketing(s) {
    return [
      detectWithEvidence('hubspotMarketing', /js\.hs-scripts\.com|js\.hsforms\.net|hubspot|_hsq/i.test(s.source), 'HubSpot scripts/forms'),
      detectWithEvidence('intercom', Boolean(window.Intercom) || /widget\.intercom\.io|intercomcdn\.com|intercom/i.test(s.source), 'Intercom widget'),
      detectWithEvidence('drift', Boolean(window.drift) || /js\.driftt\.com|drift\.com|driftt/i.test(s.source), 'Drift widget'),
      detectWithEvidence('calendly', /assets\.calendly\.com|calendly\.com/i.test(s.source), 'Calendly embed'),
      detectWithEvidence('zendesk', Boolean(window.zE || window.zEmbed) || /static\.zendesk\.com|zdassets\.com|zendesk/i.test(s.source), 'Zendesk widget')
    ];
  }

  function detectHosting(s) {
    return [
      detectWithEvidence('cloudflare', /cloudflare|cdnjs\.cloudflare\.com|cf-ray|__cf_bm/i.test(s.source), 'Cloudflare markers or CDN assets'),
      detectWithEvidence('vercel', /vercel\.app|_vercel|x-vercel|\/cdn-cgi\/image|now\.sh/i.test(`${s.hostname}\n${s.source}`), 'Vercel host or markers'),
      detectWithEvidence('netlify', /netlify\.app|netlify\.com|x-nf-|netlify/i.test(`${s.hostname}\n${s.source}`), 'Netlify host or markers'),
      detectWithEvidence('aws', /amazonaws\.com|cloudfront\.net|aws|amplifyapp\.com/i.test(`${s.hostname}\n${s.source}`), 'AWS, S3, CloudFront, or Amplify markers')
    ];
  }

  function auditSeo() {
    const ogTags = [...document.querySelectorAll('meta[property^="og:"]')].map(tag => ({
      property: tag.getAttribute('property'),
      content: tag.getAttribute('content')
    }));
    const schemaNodes = [...document.querySelectorAll('script[type="application/ld+json"]')];
    return {
      title: document.title || '',
      metaDescription: document.querySelector('meta[name="description"]')?.content || '',
      canonicalUrl: document.querySelector('link[rel="canonical"]')?.href || '',
      h1Count: document.querySelectorAll('h1').length,
      openGraphTags: ogTags,
      robotsMeta: document.querySelector('meta[name="robots"]')?.content || '',
      schemaMarkup: schemaNodes.map(node => node.textContent?.trim()).filter(Boolean),
      score: [
        Boolean(document.title),
        Boolean(document.querySelector('meta[name="description"]')?.content),
        Boolean(document.querySelector('link[rel="canonical"]')?.href),
        document.querySelectorAll('h1').length === 1,
        ogTags.length > 0,
        schemaNodes.length > 0
      ].filter(Boolean).length
    };
  }

  function runStackSpyDetections() {
    const signals = collectPageSignals();
    return {
      catalog: DETECTION_CATALOG,
      url: location.href,
      hostname: location.hostname,
      scannedAt: new Date().toISOString(),
      detections: {
        technologies: detectTechnologies(signals),
        cms: detectCms(signals),
        analytics: detectAnalytics(signals),
        marketing: detectMarketing(signals),
        hosting: detectHosting(signals)
      },
      seo: auditSeo()
    };
  }

  window.StackSpyDetectors = { DETECTION_CATALOG, runStackSpyDetections };
})();
