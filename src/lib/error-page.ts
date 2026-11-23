/** HTML fallback when SSR fails — D4AI branded (not D4EXAM). */
export function renderErrorPage(): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>D4AI</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      body { font: 15px/1.5 system-ui, sans-serif; background: #050b18; color: #e2e8f0; display: grid; place-items: center; min-height: 100vh; margin: 0; padding: 1.5rem; }
      .card { max-width: 28rem; width: 100%; text-align: center; padding: 2rem; }
      img { width: 72px; height: 72px; object-fit: contain; margin: 0 auto 1rem; }
      h1 { font-size: 1.15rem; margin: 0 0 0.5rem; color: #a5f3fc; }
      p { color: #94a3b8; margin: 0 0 1.5rem; }
      .actions { display: flex; gap: 0.5rem; justify-content: center; flex-wrap: wrap; }
      a, button { padding: 0.65rem 1.1rem; border-radius: 999px; font-weight: 600; font-size: 0.875rem; border: none; cursor: pointer; text-decoration: none; }
      .primary { background: #22d3ee; color: #0f172a; }
      .secondary { background: transparent; color: #a5f3fc; border: 1px solid rgba(34,211,238,0.35); }
    </style>
  </head>
  <body>
    <div class="card">
      <img src="/d4ai-logo.png" alt="D4AI" />
      <h1>D4AI is warming up</h1>
      <p>Something went wrong on the server. Retry — the assistant will be right back.</p>
      <div class="actions">
        <button class="primary" onclick="location.reload()">Try again</button>
        <a class="secondary" href="/">Open D4AI</a>
      </div>
    </div>
  </body>
</html>`;
}
