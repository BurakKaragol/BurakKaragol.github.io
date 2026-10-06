/**
 * Universal Project Hit Tracker
 * Records unique visits per project across all devices (Projects Hub, direct URLs, bookmarks).
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
      const sessionKey = 'bk_tracked_' + slug;
      // Record hit if not already counted in current session
      if (!sessionStorage.getItem(sessionKey)) {
        sessionStorage.setItem(sessionKey, '1');
        const apiUrl = `https://countapi.mileshilliard.com/api/v1/hit/burakkaragol_proj_${slug}`;
        fetch(apiUrl, { mode: 'cors', cache: 'no-cache' }).catch(() => {});
      }
    }
  } catch (e) {
    // Non-blocking silent failover
  }
})();
