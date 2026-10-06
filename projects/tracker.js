/**
 * Universal Project Hit Tracker
 * Records each visit per project across all devices (Projects Hub, direct URLs, bookmarks).
 */
(function() {
  'use strict';
  try {
    const cleanPath = window.location.pathname
      .replace(/\\/g, '/')
      .replace(/\/index\.html$/, '')
      .replace(/\/$/, '');
    
    const segments = cleanPath.split('/').filter(Boolean);
    const rawSlug = segments[segments.length - 1] || '';
    const slug = rawSlug.toLowerCase().replace(/[^a-z0-9_-]/g, '_');

    if (slug && slug !== 'projects') {
      const apiUrl = `https://countapi.mileshilliard.com/api/v1/hit/burakkaragol_proj_${slug}?_t=${Date.now()}`;
      fetch(apiUrl, { mode: 'cors', cache: 'no-store' }).catch(() => {});
    }
  } catch (e) {
    // Non-blocking silent failover
  }
})();
