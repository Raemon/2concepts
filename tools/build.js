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
// document skeleton, with a page gutter and one line of context underneath.
if (process.argv.includes('--page')) {
  const body = html
    .replace(/<!doctype html>\s*<html[^>]*>\s*<head>/i, '')
    .replace(/<meta charset="utf-8">\s*<meta name="viewport"[^>]*>/i, '')
    .replace(/<\/head>\s*<body>/i, '')
    .replace(/<\/body>\s*<\/html>\s*$/i, '')
    .replace('html, body { margin: 0; padding: 0; background: var(--bg); color: var(--ink); }', 'body { margin: 0; background: var(--bg); color: var(--ink); }')
    .replace('</style>', `  :root { color-scheme: dark; background: var(--bg); }
  body { background: var(--bg); padding-inline: 16px; padding-block: 16px 28px; }
  .about { max-width: 700px; margin: 14px auto 0; color: var(--ink-dim); font: italic 14px/1.5 Georgia, serif; }
</style>`)
    .replace('<!--ABOUT-->', '');
  const about = '<p class="about">Flowers open as they get thirsty and close again as they wilt. The Owl certifies whatever looks calm. Made for a LessWrong post about fold-back signals, refractory-check capture and certified collapse.</p>';
  const page = body.replace(/(<\/div>\s*)(<script>)/, `$1${about}\n$2`);
  fs.writeFileSync(path.join(__dirname, '../dist/hush-page.html'), page.trim() + '\n');
  console.log('dist/hush-page.html', (page.length / 1024).toFixed(1) + ' KB');
}
