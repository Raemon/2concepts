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
