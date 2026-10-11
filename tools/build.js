// Inline every source file into one self-contained HTML widget: dist/still-water.html
//   node tools/build.js           -> dist/still-water.html (the widget)
//   node tools/build.js --page    -> also dist/still-water-page.html (a standalone page, for sharing a link)
const fs = require('fs');
const path = require('path');
const src = f => fs.readFileSync(path.join(__dirname, '../src', f), 'utf8');
const order = ['shell.js', 'logic.js', 'levels.js', 'audio.js', 'render.js', 'game.js'];
const scripts = order.map(f => `<script>\n/* ${f} */\n${src(f)}\n</script>`).join('\n');
const html = src('index.html').replace('<!--SCRIPTS-->', () => scripts);
fs.mkdirSync(path.join(__dirname, '../dist'), { recursive: true });
fs.writeFileSync(path.join(__dirname, '../dist/still-water.html'), html);
console.log('dist/still-water.html', (html.length / 1024).toFixed(1) + ' KB');

if (process.argv.includes('--page')) {
  const page = html
    .replace(/<!doctype html>\s*<html[^>]*>\s*<head>/i, '')
    .replace(/<meta charset="utf-8">\s*<meta name="viewport"[^>]*>/i, '')
    .replace(/<\/head>\s*<body>/i, '')
    .replace(/<\/body>\s*<\/html>\s*$/i, '')
    .replace('</style>', `  :root { background: var(--paper); }
  body { padding-inline: 16px; padding-block: 16px 28px; }
</style>`);
  fs.writeFileSync(path.join(__dirname, '../dist/still-water-page.html'), page.trim() + '\n');
  console.log('dist/still-water-page.html', (page.length / 1024).toFixed(1) + ' KB');
}

// The LessWrong paste-safe fragment (see docs/process-v2/10-lesswrong-widget.md), rebuilt every time so it can't drift.
require('child_process').execFileSync(process.execPath, [path.join(__dirname, 'build-lw-widget.js'), path.join(__dirname, '../dist/still-water.html'), path.join(__dirname, '../dist/still-water-lw.html')], { stdio: 'inherit' });
