/**
 * Universal Project Hit Tracker
 * Tracks visits from any source (Projects Hub, direct link, bookmark) across all devices.
 */
(function() {
  'use strict';
  try {
    const path = window.location.pathname.replace(/\/index\.html$/, '').replace(/\/$/, '');
    const segments = path.split('/').filter(Boolean);
    const slug = segments[segments.length - 1] || '';

    if (slug && slug !== 'projects') {
      const trackerImg = new Image();
      trackerImg.src = `https://hits.sh/burakkaragol.github.io/projects/${slug}.svg?style=flat`;
    }
  } catch (e) {
    // Non-blocking silent failover
  }
})();
