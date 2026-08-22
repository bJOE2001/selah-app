const fs = require('fs');
const path = require('path');

const distDir = path.join(__dirname, '..', 'dist');
const distIndex = path.join(distDir, 'index.html');
const jsDir = path.join(distDir, '_expo', 'static', 'js', 'web');

// 1. Sanitize any un-transpiled 'import.meta' in Metro bundle JS files
if (fs.existsSync(jsDir)) {
  const jsFiles = fs.readdirSync(jsDir).filter((f) => f.endsWith('.js'));
  for (const file of jsFiles) {
    const filePath = path.join(jsDir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    if (content.includes('import.meta')) {
      content = content.replace(/import\.meta\.env/g, '(typeof process !== "undefined" ? process.env : {})');
      content = content.replace(/import\.meta/g, '({ url: "" })');
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`[Shepema PWA] Patched import.meta in ${file}`);
    }
  }
}

// 2. Inject PWA meta tags and Service Worker into dist/index.html
if (fs.existsSync(distIndex)) {
  let html = fs.readFileSync(distIndex, 'utf8');

  const pwaHeadTags = `
    <!-- Shepema PWA Assets & Metadata -->
    <link rel="manifest" href="/manifest.json" />
    <meta name="theme-color" content="#377333" />
    <meta name="description" content="Daily Rhema scripture, guided devotions, and spiritual journaling." />
    <meta name="mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="default" />
    <meta name="apple-mobile-web-app-title" content="Shepema" />
    <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
    <link rel="icon" type="image/png" href="/icons/favicon.png" />
    
    <!-- PWA Service Worker Registration -->
    <script>
      if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
        window.addEventListener('load', function() {
          navigator.serviceWorker.register('/sw.js')
            .then(function(reg) {
              console.log('[Shepema PWA] Service Worker active on scope:', reg.scope);
            })
            .catch(function(err) {
              console.warn('[Shepema PWA] Service Worker error:', err);
            });
        });
      }
    </script>
  </head>`;

  if (!html.includes('rel="manifest"')) {
    html = html.replace('</head>', pwaHeadTags);
  }

  // Ensure script tags use type="module" or clean defer
  html = html.replace(/<script src="([^"]+)" defer><\/script>/g, '<script type="module" src="$1" defer></script>');

  fs.writeFileSync(distIndex, html, 'utf8');
  console.log('[Shepema PWA] Successfully configured dist/index.html');
} else {
  console.warn('[Shepema PWA] dist/index.html not found!');
}
