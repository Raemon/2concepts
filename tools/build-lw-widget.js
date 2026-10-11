#!/usr/bin/env node
// Turn a built single-file game into the form that survives LessWrong's widget pipeline:
//
//   node tools/build-lw-widget.js [in.html] [out.html] [--no-check] [--strict]
//   (default in: dist/still-water.html, else dist/hush.html; default out: <in>-lw.html, e.g. dist/still-water-lw.html)
//
// A pure transformation of the built file, so it keeps working when the game is rewritten. What it does and why
// (evidence and simulations: docs/process-v2/10-lesswrong-widget.md, tools/lw-sim.js):
//   - Emits a fragment: <style> first, then the body markup, scripts kept in place. No doctype/<html>/<head>/<body>/
//     <meta>/<title>: LessWrong drops them anyway (the editor preview keeps documentElement.innerHTML, the reader
//     re-parses the srcdoc as a fragment), and srcdoc documents never enter quirks mode, so nothing is lost, and the
//     editor preview, the published page and the agent API all see the same document.
//   - Compacts CSS (no comments, no indentation, no blank lines) so an HTML clipboard that turns indentation into
//     non-breaking spaces cannot invalidate every selector.
//   - Collapses runs of blank lines: two consecutive empty lines in a paste make Lexical's code block exit, and the
//     rest of the paste lands outside the widget as plain paragraphs.
//   - Rewrites character references in markup text to literal characters where that is safe, and fails on the
//     rest: LessWrong's reader pipeline decodes one level of them (MathJax re-serializes the srcdoc attribute
//     escaping only '"'), so "&lt;b&gt;" in the source reaches readers as a real <b> tag.
//   - Fails on "```" (the agent API's widget fence regex would cut the widget there).
//   - Adds a self-check (unless --no-check): a small notice that is visible only if the widget's scripts never ran
//     or did not all finish, its stylesheet is missing, a script threw while loading, or a pasted-twice dump of the
//     code follows the widget (LessWrong's HTML round trip appends one), with a hint on how to fix the paste. It is hidden by the first script before anything paints, so a healthy widget never shows it.

const fs = require('fs');
const path = require('path');

const argv = process.argv.slice(2);
const opts = { check: !argv.includes('--no-check'), strict: argv.includes('--strict') };
const files = argv.filter((a) => !a.startsWith('--'));
const root = path.resolve(__dirname, '..');
const defaultIn = ['dist/still-water.html', 'dist/hush.html'].map((f) => path.join(root, f)).find((f) => fs.existsSync(f));
const inFile = path.resolve(files[0] || defaultIn || 'dist/still-water.html');
const outFile = path.resolve(files[1] || inFile.replace(/\.html?$/i, '') + '-lw.html');

const warnings = [];
const errors = [];

// ---------------------------------------------------------------- HTML scanning (browser tokenizer semantics, enough of them)

const RAWTEXT = new Set(['script', 'style', 'xmp', 'iframe', 'noembed', 'noframes', 'noscript']);
const RCDATA = new Set(['textarea', 'title']);

// End of a start/end tag beginning at `lt`, honouring quoted attribute values.
function tagEnd(html, lt) {
  let q = null;
  for (let i = lt + 1; i < html.length; i++) {
    const c = html[i];
    if (q) { if (c === q) q = null; } else if (c === '"' || c === "'") q = c; else if (c === '>') return i + 1;
  }
  return html.length;
}

function attrsOf(tag) {
  const out = {};
  const body = tag.replace(/^<\/?[a-zA-Z][^\s/>]*/, '').replace(/\/?>$/, '');
  const re = /([^\s"'=<>`/]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
  let m;
  while ((m = re.exec(body))) out[m[1].toLowerCase()] = m[2] ?? m[3] ?? m[4] ?? '';
  return out;
}

function scan(html) {
  const tokens = [];
  let i = 0;
  while (i < html.length) {
    const lt = html.indexOf('<', i);
    if (lt < 0) { tokens.push({ type: 'text', s: html.slice(i) }); break; }
    if (lt > i) tokens.push({ type: 'text', s: html.slice(i, lt) });
    if (html.startsWith('<!--', lt)) {
      const e = html.indexOf('-->', lt + 4);
      const end = e < 0 ? html.length : e + 3;
      tokens.push({ type: 'comment', s: html.slice(lt, end) });
      i = end;
      continue;
    }
    if (/^<![a-z]/i.test(html.slice(lt, lt + 3))) {
      const end = tagEnd(html, lt);
      tokens.push({ type: 'doctype', s: html.slice(lt, end) });
      i = end;
      continue;
    }
    const m = /^<(\/?)([a-zA-Z][a-zA-Z0-9-]*)/.exec(html.slice(lt, lt + 64));
    if (!m) { tokens.push({ type: 'text', s: '<' }); i = lt + 1; continue; }
    const end = tagEnd(html, lt);
    const tag = html.slice(lt, end);
    const name = m[2].toLowerCase();
    if (m[1]) { tokens.push({ type: 'end', name, s: tag }); i = end; continue; }
    if (RAWTEXT.has(name) || RCDATA.has(name)) {
      const closeRe = new RegExp(`</${name}(?=[\\s/>])`, 'ig');
      closeRe.lastIndex = end;
      const c = closeRe.exec(html);
      const contentEnd = c ? c.index : html.length;
      const closeEnd = c ? tagEnd(html, c.index) : html.length;
      tokens.push({ type: 'element', name, open: tag, attrs: attrsOf(tag), content: html.slice(end, contentEnd), close: html.slice(contentEnd, closeEnd) });
      i = closeEnd;
      continue;
    }
    tokens.push({ type: 'start', name, s: tag, attrs: attrsOf(tag) });
    i = end;
  }
  return tokens;
}

// ---------------------------------------------------------------- CSS compaction (comment- and string-aware)

function compactCss(css) {
  let out = '';
  for (let i = 0; i < css.length; i++) {
    const c = css[i];
    if (c === '/' && css[i + 1] === '*') { const e = css.indexOf('*/', i + 2); i = e < 0 ? css.length : e + 1; continue; }
    if (c === '"' || c === "'") {
      let j = i + 1;
      while (j < css.length && css[j] !== c && css[j] !== '\n') j += css[j] === '\\' ? 2 : 1;
      out += css.slice(i, j + 1);
      i = j;
      continue;
    }
    out += c;
  }
  return out.split('\n').map((l) => l.trim()).filter(Boolean).join('\n');
}

// ---------------------------------------------------------------- character references

// Characters a reader-side decode can produce safely in markup text (anything but markup-significant ones).
const NAMED = { nbsp: ' ', times: '×', divide: '÷', middot: '·', hellip: '…', mdash: '—',
  ndash: '–', rarr: '→', larr: '←', uarr: '↑', darr: '↓', harr: '↔', copy: '©',
  reg: '®', trade: '™', deg: '°', plusmn: '±', minus: '−', frac12: '½', frac14: '¼',
  frac34: '¾', laquo: '«', raquo: '»', lsquo: '‘', rsquo: '’', ldquo: '“', rdquo: '”',
  bull: '•', hearts: '♥', check: '✓', star: '☆', le: '≤', ge: '≥', ne: '≠',
  infin: '∞', sup2: '²', sup3: '³', para: '¶', sect: '§', euro: '€', pound: '£',
  cent: '¢', yen: '¥', thinsp: ' ', ensp: ' ', emsp: ' ', zwj: '‍', zwnj: '‌' };
const MARKUP_SIGNIFICANT = new Set(['<', '>', '&', '"', "'"]);
// Named references the HTML parser decodes without a trailing ';' (the "legacy" ones). In an attribute value that is
// only when the next character is not alphanumeric or '='.
const LEGACY = new Set(('AElig AMP Aacute Acirc Agrave Aring Atilde Auml COPY Ccedil ETH Eacute Ecirc Egrave Euml GT ' +
  'Iacute Icirc Igrave Iuml LT Ntilde Oacute Ocirc Ograve Oslash Otilde Ouml QUOT REG THORN Uacute Ucirc Ugrave Uuml ' +
  'Yacute aacute acirc acute aelig agrave amp aring atilde auml brvbar ccedil cedil cent copy curren deg divide ' +
  'eacute ecirc egrave eth euml frac12 frac14 frac34 gt iacute icirc iexcl igrave iquest iuml laquo lt macr micro ' +
  'middot nbsp not ntilde oacute ocirc ograve ordf ordm oslash otilde ouml para plusmn pound quot raquo reg sect shy ' +
  'sup1 sup2 sup3 szlig thorn times uacute ucirc ugrave uml uuml yacute yen yuml').split(' '));
const REF_RE = /&(?:#(\d+);?|#[xX]([0-9a-fA-F]+);?|([A-Za-z][A-Za-z0-9]*)(;?))/g;

function refHazard(m, next) {
  if (m[1] !== undefined || m[2] !== undefined) return true;
  if (m[4] === ';') return true;
  return LEGACY.has(m[3]) && !/[A-Za-z0-9=]/.test(next || '');
}
function literalFor(m) {
  const cp = m[1] !== undefined ? parseInt(m[1], 10) : m[2] !== undefined ? parseInt(m[2], 16) : null;
  const ch = cp !== null ? (cp > 0 && cp < 0x110000 ? String.fromCodePoint(cp) : null) : (m[4] === ';' ? NAMED[m[3]] : null);
  return ch && !MARKUP_SIGNIFICANT.has(ch) ? ch : null;
}
function fixMarkupRefs(text) {
  return text.replace(REF_RE, (...a) => {
    const m = a; const next = a[a.length - 1][a[a.length - 2] + m[0].length];
    if (!refHazard(m, next)) return m[0];
    return literalFor(m) ?? m[0];
  });
}
function lineOf(s, index) { return s.slice(0, index).split('\n').length; }
function reportRefs(s, where) {
  const re = new RegExp(REF_RE.source, 'g');
  let m;
  while ((m = re.exec(s))) {
    if (refHazard(m, s[m.index + m[0].length])) errors.push(`${where} line ${lineOf(s, m.index)}: "${m[0]}" will be decoded for readers (LessWrong decodes character references in widget source once). ${where === 'markup' ? 'Use the literal character, or set the text from JS.' : 'Write & as \\x26 (JS) or \\26 (CSS).'}`);
  }
}

// ---------------------------------------------------------------- self-check

const CHECK_ID = 'lw-widget-check';
const FIX_HINT = 'Author: open the widget code view, check that it starts with the style tag and ends with a script tag, and re-paste the code as plain text (Ctrl+Shift+V, or Cmd+Option+Shift+V on a Mac).';
const DUP_HINT = 'Author: open the widget code view and delete everything after the final script tag.';
const CHECK_BOX = `<div id="${CHECK_ID}" style="display:block;margin:8px;padding:10px 12px;border:1px solid #c0392b;border-radius:6px;background:#fff4f2;color:#5a1a12;font:14px/1.4 system-ui,-apple-system,Segoe UI,Roboto,sans-serif">This widget did not start: its scripts are not running. ${FIX_HINT}</div>`;
const checkPrelude = (cssMarkers) => `<script>${cssMarkers ? 'window.__lwCssMarkers=1;' : ''}(function(){var b=document.getElementById('${CHECK_ID}');if(b)b.style.display='none';var e=window.__lwWidgetErrors=[];window.addEventListener('error',function(v){e.push(String(v.message||'error'));});})();</script>`;
const checkEpilogue = (scripts) => `<script>(function(){var b=document.getElementById('${CHECK_ID}');if(!b)return;var cs=getComputedStyle(b),p=[],ran=window.__lwRan||0;if(ran<${scripts})p.push('its scripts did not run ('+ran+' of ${scripts} finished)');if(window.__lwCssMarkers&&(!cs.getPropertyValue('--lw-css-first')||!cs.getPropertyValue('--lw-css-last')))p.push('its styles did not load');var e=window.__lwWidgetErrors||[];if(e.length)p.push('a script failed while loading: '+e[0]);function show(m){b.textContent='This widget did not load correctly: '+m;b.style.display='block';}if(p.length){show(p.join('; ')+'. ${FIX_HINT}');return;}var me=document.currentScript;document.addEventListener('readystatechange',function(){if(document.readyState!=='interactive')return;var n=me&&me.nextSibling,x=0;for(;n;n=n.nextSibling)if((n.nodeType===1&&n.tagName!=='SCRIPT')||(n.nodeType===3&&n.textContent.trim()))x++;if(x>=20)show('extra content follows the widget code ('+x+' nodes), which happens when LessWrong re-imports a post from HTML. ${DUP_HINT}');else b.remove();});})();</script>`;

// ---------------------------------------------------------------- transform

// Each classic inline script ends by bumping a counter, so the self-check can tell a script that never finished
// (syntax error, early throw, or code turned into a comment when a paste joined its lines) from one that ran.
const RAN_MARK = '\n;window.__lwRan=(window.__lwRan||0)+1;\n';
const isClassicInline = (t) => t.attrs.src === undefined && (!t.attrs.type || /^(text|application)\/(java|ecma)script$/i.test(t.attrs.type)) && t.content.trim() !== '';
let instrumented = 0;

if (!fs.existsSync(inFile)) { console.error(`no such file: ${inFile} (build the game first, or pass the built HTML path)`); process.exit(2); }
const input = fs.readFileSync(inFile, 'utf8').replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
const tokens = scan(input);
const styles = [];
const parts = [];
let inHead = false;
let sawBody = false;
for (const t of tokens) {
  if (t.type === 'doctype' || t.type === 'comment') continue;
  if ((t.type === 'start' || t.type === 'end') && ['html', 'head', 'body'].includes(t.name)) {
    if (t.type === 'start' && t.name === 'head') inHead = true;
    if (t.name === 'head' && t.type === 'end') inHead = false;
    if (t.type === 'start' && t.name === 'body') { inHead = false; sawBody = true; }
    if (t.type === 'start') {
      const keep = Object.keys(t.attrs).filter((a) => !(t.name === 'html' && a === 'lang'));
      if (keep.length) warnings.push(`<${t.name}> attributes dropped: ${keep.join(', ')} (move them onto an element inside the body if they matter)`);
    }
    continue;
  }
  if (t.type === 'element' && t.name === 'style') { styles.push({ attrs: t.open.replace(/^<style/i, '').replace(/>$/, ''), css: compactCss(t.content) }); continue; }
  if (t.type === 'element' && t.name === 'title') continue;
  if (t.type === 'start' && t.name === 'meta') {
    const equiv = (t.attrs['http-equiv'] || '').toLowerCase();
    if (equiv && equiv !== 'content-type') { warnings.push(`kept <meta http-equiv="${equiv}">`); parts.push(t.s); }
    continue;
  }
  if (inHead && t.type === 'text') { if (t.s.trim()) warnings.push(`text in <head> kept: ${JSON.stringify(t.s.trim().slice(0, 40))}`); else continue; }
  if (t.type === 'start' && (t.name === 'link' || t.name === 'base')) warnings.push(`kept external <${t.name}> (loads over the network inside the sandbox)`);
  if (t.type === 'element' && t.name === 'script' && t.attrs.src !== undefined) warnings.push(`kept external <script src="${t.attrs.src}">`);
  if (t.type === 'text') { parts.push(fixMarkupRefs(t.s)); continue; }
  if (t.type === 'element' && t.name === 'script' && opts.check && isClassicInline(t)) {
    instrumented++;
    parts.push(t.open + t.content.replace(/\s+$/, '') + RAN_MARK + t.close);
    continue;
  }
  if (t.type === 'element') { parts.push(t.open + (t.name === 'textarea' || t.name === 'title' ? fixMarkupRefs(t.content) : t.content) + t.close); continue; }
  parts.push(t.s);
}
if (!sawBody) warnings.push('input has no <body> tag; treated the whole file as body content');

let body = parts.join('').replace(/^\s+|\s+$/g, '');
const plainStyles = styles.filter((s) => !s.attrs.trim());
if (opts.check && plainStyles.length) {
  plainStyles[0].css = `#${CHECK_ID}{--lw-css-first:1}\n` + plainStyles[0].css;
  plainStyles[plainStyles.length - 1].css += `\n#${CHECK_ID}{--lw-css-last:1}`;
}
const styleHtml = styles.map((s) => `<style${s.attrs}>\n${s.css}\n</style>`).join('\n');
let out = [
  styleHtml,
  opts.check ? CHECK_BOX : '',
  opts.check ? checkPrelude(plainStyles.length > 0) : '',
  body,
  opts.check ? checkEpilogue(instrumented) : '',
].filter(Boolean).join('\n') + '\n';

const blankRuns = (out.match(/\n{3,}/g) || []).length;
out = out.replace(/\n{3,}/g, '\n\n');

// ---------------------------------------------------------------- hazards in the result

for (const t of scan(out)) {
  if (t.type === 'element' && (t.name === 'script' || t.name === 'style')) reportRefs(t.content, t.name);
}
reportRefs(scan(out).filter((t) => t.type === 'text').map((t) => t.s).join(''), 'markup');
for (const t of scan(out)) if (t.type === 'start') reportRefs(t.s, 'tag attributes');
if (out.includes('```')) errors.push(`contains \`\`\` at line ${lineOf(out, out.indexOf('```'))}: the agent API's widget fence (\`\`\`widget[id] ... \`\`\`) would end there`);
if (/<\/iframe/i.test(out)) warnings.push('contains "</iframe": harmless in the editor, but avoid it if the widget will be edited through the agent API');
if (/\n\n\n/.test(out)) errors.push('still contains two consecutive blank lines');

fs.writeFileSync(outFile, out);
const rel = (f) => path.relative(process.cwd(), f) || f;
console.log(`${rel(outFile)}  ${(out.length / 1024).toFixed(1)} KB  (from ${rel(inFile)}, ${(input.length / 1024).toFixed(1)} KB)`);
console.log(`  ${styles.length} style block(s) compacted, ${tokens.filter((t) => t.type === 'element' && t.name === 'script').length} script(s) kept in place, ${blankRuns} blank-line run(s) collapsed, self-check ${opts.check ? `on (${instrumented} script(s) counted)` : 'off'}`);
for (const w of warnings) console.log(`  warning: ${w}`);
for (const e of errors) console.log(`  ERROR: ${e}`);
console.log('  verify: NODE_PATH=/opt/node22/lib/node_modules node tools/lw-sim.js ' + rel(outFile));
if (errors.length && opts.strict) process.exit(1);
