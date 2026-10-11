// Inline every source file into one self-contained HTML widget: dist/hush.html
const fs = require('fs');
const path = require('path');
const src = f => fs.readFileSync(path.join(__dirname, '../src', f), 'utf8');
const order = ['shell.js', 'logic.js', 'levels.js', 'solver.js', 'audio.js', 'render.js', 'game.js'];
const scripts = order.map(f => `<script>\n/* ${f} */\n${src(f)}\n</script>`).join('\n');
const html = src('index.html').replace('<!--SCRIPTS-->', scripts);
fs.mkdirSync(path.join(__dirname, '../dist'), { recursive: true });
fs.writeFileSync(path.join(__dirname, '../dist/hush.html'), html);
console.log('dist/hush.html', (html.length / 1024).toFixed(1) + ' KB');

// A standalone page version (for sharing a playable link outside LessWrong): the same widget, without the
// document skeleton, with a page gutter.
if (process.argv.includes('--page')) {
  const body = html
    .replace(/<!doctype html>\s*<html[^>]*>\s*<head>/i, '')
    .replace(/<meta charset="utf-8">\s*<meta name="viewport"[^>]*>/i, '')
    .replace(/<\/head>\s*<body>/i, '')
    .replace(/<\/body>\s*<\/html>\s*$/i, '')
    .replace('html, body { margin: 0; padding: 0; background: var(--bg); color: var(--ink); }', 'body { margin: 0; background: var(--bg); color: var(--ink); }')
    .replace('</style>', `  :root { color-scheme: dark; background: var(--bg); }
  body { background: var(--bg); padding-inline: 16px; padding-block: 16px 28px; }
</style>`)
    ;
  const page = body;
  fs.writeFileSync(path.join(__dirname, '../dist/hush-page.html'), page.trim() + '\n');
  console.log('dist/hush-page.html', (page.length / 1024).toFixed(1) + ' KB');
}
