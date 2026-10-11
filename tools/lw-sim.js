#!/usr/bin/env node
// Reproduce what LessWrong (ForumMagnum) does to an iframe-widget's HTML, end to end, and render every result in a
// sandboxed srcdoc iframe the way LessWrong does, to see whether the widget still boots.
//
//   NODE_PATH=/opt/node22/lib/node_modules node tools/lw-sim.js [file.html ...] [--out DIR] [--keep-going]
//
// Default files: dist/still-water.html, dist/still-water-lw.html, dist/hush.html, dist/hush-lw.html (those present). Exit code 1 if any "must pass" path fails.
//
// Paths simulated (file:line refs are to github.com/ForumMagnum/ForumMagnum as cloned at LW_REPO):
//   direct                   reference: the file as srcdoc + LW's resize script (iframeResizeScript.ts:47)
//   editor:plain-paste       real Lexical 0.44 editor: "Custom Widget" block, click into it, paste text/plain;
//                            preview = injectResizeScript(stripDeletedMarkupFromSrcdoc(text)) (IframeWidgetPlugin.tsx:106,285)
//   editor:pre-html-paste    same, clipboard also carries text/html copied from a <pre> code view
//   editor:vscode-html-paste same, clipboard carries VS Code's monospace-div text/html
//   reader:published         Lexical export ($generateHtmlFromNodes + LW export map, LexicalEditor.tsx:458) ->
//                            sanitize() (sanitize.ts:158) -> trimLeadingAndTrailingWhiteSpace (conversionUtils.ts:649) ->
//                            removePrivateLexicalMarkup (:771) -> renderMathInHtml/MathJax liteAdaptor (:492) ->
//                            extractAndReplaceIframeWidgets (:806) -> stored srcdoc -> HydratedIframeWidget (React srcDoc)
//   reader:ssr               same stored srcdoc, but server-rendered into the page HTML (React attribute escaping)
//   agent:insertWidget       POST /api/agent/insertWidget (route.ts:43: one TextNode) -> export -> reader pipeline
//   agent:markdown-roundtrip editPost markdown fence (conversionUtils.ts:155) -> insertBlock fence regex (insertBlock/route.ts:61)
// Hazard demonstrations (expected to break for ordinary files; reported, never fail the run):
//   hazard:paste-right-after-insert  paste without clicking into the new block (caret is in the paragraph after it)
//   hazard:lines-html-paste          text/html whose code lines lose their newlines (no white-space:pre)
//   hazard:reload-from-html          editor re-imports its own exported HTML (non-collab load, copy/paste w/o Lexical MIME)
//
// Dependencies are the versions ForumMagnum's yarn.lock pins. They are installed on first run into LW_SIM_DEPS
// (default: $TMPDIR/lw-sim-deps), never into this repo. When the ForumMagnum clone exists at LW_REPO, sanitize.ts and
// iframeResizeScript.ts are bundled from it so the sanitizer config is LessWrong's own; otherwise embedded copies are used.

const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const LW_REPO = process.env.LW_REPO || '/home/user/forummagnum/forummagnum';
const DEPS = path.resolve(process.env.LW_SIM_DEPS || path.join(os.tmpdir(), 'lw-sim-deps'));
const PINNED = [
  'cheerio@1.0.0-rc.9', 'sanitize-html@2.17.7', 'mathjax-full@3.2.2',
  'lexical@0.44.0', '@lexical/rich-text@0.44.0', '@lexical/code@0.44.0', '@lexical/html@0.44.0',
  '@lexical/clipboard@0.44.0', '@lexical/utils@0.44.0', '@lexical/selection@0.44.0', '@lexical/link@0.44.0',
  'esbuild@0.25.5',
];

const args = process.argv.slice(2);
const flag = (name) => { const i = args.indexOf(name); if (i < 0) return null; const v = args[i + 1]; args.splice(i, 2); return v; };
const OUT = path.resolve(flag('--out') || path.join(os.tmpdir(), 'lw-sim-out'));
const keepGoing = args.includes('--keep-going') && args.splice(args.indexOf('--keep-going'), 1);
let FILES = args.length ? args : ['dist/still-water.html', 'dist/still-water-lw.html', 'dist/hush.html', 'dist/hush-lw.html'].filter((f) => fs.existsSync(path.join(ROOT, f)));
FILES = FILES.map((f) => path.resolve(f.startsWith('/') ? f : path.join(process.cwd(), f)));

// ---------------------------------------------------------------- dependencies

function ensureDeps() {
  const missing = PINNED.filter((spec) => {
    const name = spec.slice(0, spec.lastIndexOf('@'));
    const want = spec.slice(spec.lastIndexOf('@') + 1);
    try { return JSON.parse(fs.readFileSync(path.join(DEPS, 'node_modules', name, 'package.json'), 'utf8')).version !== want; }
    catch (e) { return true; }
  });
  if (!missing.length) return;
  fs.mkdirSync(DEPS, { recursive: true });
  if (!fs.existsSync(path.join(DEPS, 'package.json'))) fs.writeFileSync(path.join(DEPS, 'package.json'), '{"private":true}\n');
  console.log(`installing ${missing.length} pinned packages into ${DEPS} ...`);
  execFileSync('npm', ['install', '--no-audit', '--no-fund', '--prefix', DEPS, ...PINNED], { stdio: 'inherit' });
}
const dep = (name) => require(require.resolve(name, { paths: [DEPS] }));

// Bundle a self-contained TS file from the ForumMagnum clone into DEPS (so its bare imports resolve from DEPS).
function bundleFromRepo(rel, outName) {
  const src = path.join(LW_REPO, rel);
  if (!fs.existsSync(src)) return null;
  const out = path.join(DEPS, outName);
  execFileSync(path.join(DEPS, 'node_modules/.bin/esbuild'), [src, '--bundle', '--platform=node', '--format=cjs',
    '--external:sanitize-html', `--outfile=${out}`, '--log-level=error']);
  return require(out);
}

// ---------------------------------------------------------------- LessWrong server pipeline (Node)

// Embedded fallback copy of iframeResizeScript.ts:7-48 (used only when the clone is missing).
const EMBEDDED_RESIZE_SCRIPT = `<script>
(function() {
  function postHeight() {
    var body = document.body;
    if (!body) return;
    var cs = getComputedStyle(body);
    var h = body.offsetHeight
      + (parseFloat(cs.marginTop) || 0)
      + (parseFloat(cs.marginBottom) || 0);
    parent.postMessage({ type: 'iframe-widget-resize', height: Math.ceil(h) }, '*');
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', postHeight);
  } else {
    postHeight();
  }
  if (typeof ResizeObserver !== 'undefined') {
    var raf;
    new ResizeObserver(function() {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(postHeight);
    }).observe(document.documentElement);
  }
  window.addEventListener('message', function(event) {
    if (event.data?.type === 'iframe-widget-request-resize') {
      postHeight();
    }
  });
  window.addEventListener('resize', postHeight);
})();
</script>`;

// Embedded fallback of the srcdoc-relevant part of sanitize.ts (iframe attributes, transformTags.iframe, exclusiveFilter).
function embeddedSanitize(sanitizeHtml) {
  return (s) => sanitizeHtml(s, {
    allowedTags: ['p', 'span', 'div', 'br', 'pre', 'code', 'iframe', 'del', 'ins', 'b', 'i', 'em', 'strong'],
    allowedAttributes: { ...sanitizeHtml.defaults.allowedAttributes, span: ['style'], iframe: ['src', 'allowfullscreen', 'allow', 'srcdoc', 'sandbox', 'title', 'data-lexical-iframe-widget'] },
    transformTags: {
      iframe: (tagName, attribs) => {
        if (attribs.srcdoc === undefined) return { tagName, attribs };
        if (attribs['data-lexical-iframe-widget'] !== 'true') return { tagName: 'div', attribs: {}, text: '' };
        const a = { srcdoc: attribs.srcdoc, sandbox: 'allow-scripts', 'data-lexical-iframe-widget': 'true' };
        if (attribs.title) a.title = attribs.title;
        return { tagName, attribs: a };
      },
    },
    exclusiveFilter: (frame) => frame.tag === 'iframe' && (frame.attribs.srcdoc !== undefined ? frame.attribs['data-lexical-iframe-widget'] !== 'true' : frame.attribs.src === undefined),
    allowedStyles: { span: { 'white-space': [/^pre-wrap$/] } },
  });
}

function makeServer() {
  const cheerio = dep('cheerio');
  const lwSanitize = bundleFromRepo('packages/lesswrong/lib/utils/sanitize.ts', 'lw-sanitize.cjs');
  const lwResize = bundleFromRepo('packages/lesswrong/components/lexical/embeds/IframeWidgetEmbed/iframeResizeScript.ts', 'lw-resize.cjs');
  const sanitize = lwSanitize ? lwSanitize.sanitize : embeddedSanitize(dep('sanitize-html'));
  const injectResizeScript = lwResize ? lwResize.injectResizeScript : (h) => h + EMBEDDED_RESIZE_SCRIPT;

  // htmlUtil.ts:10
  const cheerioParse = (html) => cheerio.load(html ?? '', null, false);

  // conversionUtils.ts:649-681
  function trimLeadingAndTrailingWhiteSpace(html) {
    const $ = cheerioParse(`<div id="root">${html}</div>`);
    const els = $('#root').children().get();
    const isEmpty = (el) => {
      if (el.type === 'tag' && el.name === 'p') {
        if (!el.children || el.children.length === 0) return true;
        return el.children.length === 1 && el.children[0].type === 'text' && el.children[0].data.trim() === '';
      }
      return el.type === 'tag' && el.name === 'br';
    };
    for (const el of els) { if (isEmpty(el)) $(el).remove(); else break; }
    for (const el of els.reverse()) { if (isEmpty(el)) $(el).remove(); else break; }
    return $('#root').html() || '';
  }

  // conversionUtils.ts:771-793
  function removePrivateLexicalMarkup(markup) {
    const $ = cheerioParse(markup);
    $('ins').remove();
    $('del').unwrap();
    $('mark').unwrap();
    return $.html();
  }

  // conversionUtils.ts:464-552 (MathJax 3 with the lite DOM adaptor; re-serializes the whole post even without math)
  let mj = null;
  function renderMathInHtml(html) {
    if (!mj) {
      const { mathjax } = dep('mathjax-full/js/mathjax.js');
      const { TeX } = dep('mathjax-full/js/input/tex.js');
      const { CHTML } = dep('mathjax-full/js/output/chtml.js');
      const { liteAdaptor } = dep('mathjax-full/js/adaptors/liteAdaptor.js');
      const { RegisterHTMLHandler } = dep('mathjax-full/js/handlers/html.js');
      const { AllPackages } = dep('mathjax-full/js/input/tex/AllPackages.js');
      dep('mathjax-full/js/util/entities/all.js');
      const adaptor = liteAdaptor();
      RegisterHTMLHandler(adaptor);
      mj = { mathjax, adaptor, tex: new TeX({ packages: AllPackages }), chtml: new CHTML({ fontURL: 'https://cdn.jsdelivr.net/npm/mathjax@3/es5/output/chtml/fonts/woff-v2', scale: 0.92 }) };
    }
    const doc = mj.mathjax.document(html, { InputJax: mj.tex, OutputJax: mj.chtml });
    doc.render();
    for (const item of doc.math) if (item.typesetRoot) { mj.adaptor.setAttribute(item.typesetRoot, 'aria-label', item.math); mj.adaptor.setAttribute(item.typesetRoot, 'role', 'math'); }
    const rendered = mj.adaptor.innerHTML(mj.adaptor.body(doc.document));
    const css = mj.adaptor.textContent(mj.chtml.styleSheet(doc));
    if (!css || !rendered.includes('mjx-container')) return rendered;
    const $ = cheerioParse(rendered);
    const first = $('mjx-container').first();
    if (first.length) { first.before($('<style></style>').text(css)); return $.html(); }
    return rendered;
  }

  // conversionUtils.ts:806-838 (returns the srcdocs that would be inserted into IframeWidgetSrcdocs)
  function extractAndReplaceIframeWidgets(html) {
    const $ = cheerioParse(html);
    const srcdocs = [];
    $('iframe[data-lexical-iframe-widget]').each((_, el) => {
      const iframe = $(el);
      const raw = iframe.attr('srcdoc') ?? '';
      if (!raw) return;
      srcdocs.push(cheerioParse(raw).root().find('del').remove().end().html() ?? '');
      iframe.replaceWith($('<div></div>').addClass('iframe-widget').attr('data-iframe-widget-id', 'w' + srcdocs.length));
    });
    return { html: srcdocs.length ? $.html() : html, srcdocs };
  }

  // buildRevision -> dataToHTML("lexical") (conversionUtils.ts:795) -> createRevision (revisions/mutations.ts:39)
  function saveRevision(exportedHtml) {
    const html = renderMathInHtml(removePrivateLexicalMarkup(trimLeadingAndTrailingWhiteSpace(sanitize(exportedHtml))));
    return extractAndReplaceIframeWidgets(html).srcdocs;
  }

  // conversionUtils.ts:155-158 (agent read view) and insertBlock/route.ts:60-78 (agent write path)
  const widgetToMarkdown = (srcdoc, id = 'w1') => `\n\n\`\`\`widget[${id}]\n${srcdoc}\n\`\`\`\n\n`;
  function parseWidgetFence(markdown) {
    const whole = markdown.trim().match(/^```widget\[(.*?)\]\n([\s\S]*?)\n```$/);
    if (whole) return whole[2];
    const m = /```widget\[(.*?)\]\n([\s\S]*?)\n```/.exec(markdown);
    return m ? m[2] : null;
  }

  return { sanitize, injectResizeScript, saveRevision, widgetToMarkdown, parseWidgetFence, renderMathInHtml, fromRepo: !!lwSanitize };
}

// ---------------------------------------------------------------- Lexical editor harness (browser)

// A minimal LessWrong editor: Lexical 0.44 rich text + CodeNode + a port of IframeWidgetNode.tsx (exportDOM/importDOM
// verbatim) + LW's TextNode export override (lexicalDomExport.ts:27). LW registers no @lexical/code extension, so
// CodeNode.insertNewAfter keeps its legacy "two blank lines exit the block" behaviour, as here.
const LEXICAL_ENTRY = String.raw`
import { createEditor, $getRoot, $createTextNode, $createParagraphNode, $getSelection, $isRangeSelection,
  ParagraphNode, TextNode, LineBreakNode, TabNode, PASTE_COMMAND } from 'lexical';
import { registerRichText, HeadingNode, QuoteNode } from '@lexical/rich-text';
import { CodeNode, CodeHighlightNode } from '@lexical/code';
import { $generateHtmlFromNodes, $generateNodesFromDOM } from '@lexical/html';
import { $insertNodeToNearestRoot } from '@lexical/utils';
import { LinkNode, AutoLinkNode } from '@lexical/link';

function $convertIframeWidgetElement(domNode) {
  const iframe = domNode.tagName === 'IFRAME' ? domNode : domNode.querySelector('iframe');
  if (!iframe) return null;
  const htmlCode = iframe.getAttribute('srcdoc');
  if (!htmlCode) return null;
  if (!iframe.hasAttribute('data-lexical-iframe-widget')) return null;
  const node = $createIframeWidgetNode(iframe.getAttribute('data-widget-id') || 'imported');
  node.append($createTextNode(htmlCode));
  return { node };
}
class IframeWidgetNode extends CodeNode {
  static getType() { return 'iframe-widget'; }
  static clone(n) { return new IframeWidgetNode(n.__language, n.__key, n.__widgetId); }
  constructor(language, key, widgetId) { super(language || 'html', key); this.__widgetId = widgetId || null; }
  collapseAtStart() { return false; }
  createDOM(config) { const el = super.createDOM(config); el.classList.add('iframe-widget-code'); return el; }
  exportDOM() {
    const iframe = document.createElement('iframe');
    iframe.setAttribute('data-lexical-iframe-widget', 'true');
    if (this.__widgetId) iframe.setAttribute('data-widget-id', this.__widgetId);
    iframe.setAttribute('sandbox', 'allow-scripts');
    iframe.setAttribute('title', 'Embedded widget');
    iframe.setAttribute('style', 'width: 100%; height: 400px; border: 1px solid #ccc; border-radius: 4px;');
    iframe.setAttribute('srcdoc', this.getTextContent());
    return { element: iframe };
  }
  static importDOM() {
    return { iframe: (d) => d.hasAttribute('data-lexical-iframe-widget') ? { conversion: $convertIframeWidgetElement, priority: 2 } : null };
  }
  static importJSON(s) { return $createIframeWidgetNode(s.widgetId).updateFromJSON(s); }
  exportJSON() { return { ...super.exportJSON(), widgetId: this.__widgetId }; }
}
function $createIframeWidgetNode(widgetId) { return new IframeWidgetNode('html', undefined, widgetId); }
function exportTextNode(_editor, target) {
  if (!(target instanceof TextNode)) return { element: null };
  const span = document.createElement('span');
  span.style.whiteSpace = 'pre-wrap';
  span.textContent = target.getTextContent();
  return { element: span };
}
const editor = createEditor({
  namespace: 'Playground',
  nodes: [ParagraphNode, TextNode, LineBreakNode, TabNode, HeadingNode, QuoteNode, CodeNode, CodeHighlightNode, IframeWidgetNode, LinkNode, AutoLinkNode],
  html: { export: new Map([[TextNode, exportTextNode]]) },
  onError: (e) => { window.__lexErrors.push(String((e && e.stack) || e)); },
});
window.__lexErrors = [];
editor.setRootElement(document.getElementById('editor'));
registerRichText(editor);
const update = (fn) => new Promise((resolve) => editor.update(fn, { onUpdate: resolve, discrete: true }));

window.lex = {
  // ComponentPicker "Custom Widget" (ComponentPickerPlugin/index.tsx:292) -> INSERT_IFRAME_WIDGET_COMMAND ->
  // $insertNodeToNearestRoot (IframeWidgetPlugin.tsx:411-415). clickInto = the user clicks inside the empty block.
  async insertCustomWidget(clickInto) {
    await update(() => { const r = $getRoot(); r.clear(); const p = $createParagraphNode(); r.append(p); p.select(); });
    await update(() => { const node = $createIframeWidgetNode('w1'); $insertNodeToNearestRoot(node); });
    if (clickInto) await update(() => { $getRoot().getChildren().find((n) => n.getType() === 'iframe-widget').select(0, 0); });
  },
  // /api/agent/insertWidget (insertWidget/route.ts:41-45)
  async agentInsertWidget(content) {
    await update(() => { const r = $getRoot(); r.clear(); const n = $createIframeWidgetNode('w1'); n.append($createTextNode(content)); r.append($createParagraphNode(), n, $createParagraphNode()); });
  },
  async paste(data) {
    const dt = new DataTransfer();
    for (const k of Object.keys(data)) dt.setData(k, data[k]);
    editor.dispatchCommand(PASTE_COMMAND, new ClipboardEvent('paste', { clipboardData: dt, bubbles: true, cancelable: true }));
    await new Promise((r) => setTimeout(r, 30));
  },
  // non-collaborative load of saved HTML (Editor.tsx:800-818), or a paste of a copied widget without Lexical's MIME
  async importHtml(html) {
    await update(() => { const dom = new DOMParser().parseFromString(html, 'text/html'); const nodes = $generateNodesFromDOM(editor, dom); const r = $getRoot(); r.clear(); for (const n of nodes) r.append(n instanceof TextNode ? $createParagraphNode().append(n) : n); });
  },
  blocks() { const out = []; editor.getEditorState().read(() => { for (const c of $getRoot().getChildren()) out.push({ type: c.getType(), text: c.getTextContent() }); }); return out; },
  exportHtml() { let h = ''; editor.getEditorState().read(() => { h = $generateHtmlFromNodes(editor, null); }); return h; },
  // IframeWidgetPlugin.tsx:106-111
  stripDeletedMarkupFromSrcdoc(srcdoc) { const doc = new DOMParser().parseFromString(srcdoc, 'text/html'); doc.querySelectorAll('del').forEach((n) => n.remove()); return doc.documentElement.innerHTML; },
};
`;

function buildLexicalBundle() {
  const hash = crypto.createHash('sha1').update(LEXICAL_ENTRY).digest('hex').slice(0, 10);
  const out = path.join(DEPS, `lw-sim-lexical-${hash}.js`);
  if (!fs.existsSync(out)) {
    const entry = path.join(DEPS, 'lw-sim-lexical-entry.js');
    fs.writeFileSync(entry, LEXICAL_ENTRY);
    execFileSync(path.join(DEPS, 'node_modules/.bin/esbuild'), [entry, '--bundle', '--format=iife', `--outfile=${out}`,
      '--define:process.env.NODE_ENV="production"', '--log-level=error'], { cwd: DEPS });
  }
  return out;
}

// ---------------------------------------------------------------- clipboard flavours

const escHtml = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const clipboards = {
  plain: (t) => ({ 'text/plain': t }),
  preHtml: (t) => ({ 'text/plain': t, 'text/html': `<meta charset="utf-8"><pre style="white-space: pre-wrap;">${escHtml(t)}</pre>` }),
  vscodeHtml: (t) => ({ 'text/plain': t, 'text/html': `<meta charset="utf-8"><div style="color: #cccccc;background-color: #1f1f1f;font-family: Menlo, Monaco, 'Courier New', monospace;font-weight: normal;font-size: 12px;line-height: 18px;white-space: pre;">${t.split('\n').map((l) => (l ? `<div><span style="color: #cccccc;">${escHtml(l)}</span></div>` : '<br>')).join('')}</div>` }),
  linesHtml: (t) => ({ 'text/plain': t, 'text/html': `<meta charset="utf-8"><div class="code"><code>${t.split('\n').map((l) => `<span class="line">${escHtml(l)}</span>`).join('\n')}</code></div>` }),
};

// ---------------------------------------------------------------- rendering + checks

const LW_PAGE = (iframeTag) => `<!doctype html><html><head><meta charset="utf-8"><style>
body{margin:0;background:#f8f4ee;font-family:Georgia,serif}.col{width:700px;margin:24px auto}
iframe{width:100%;border:none;border-radius:4px;display:block}</style></head><body><div class="col"><p>Post text above.</p>${iframeTag}<p>Post text below.</p></div>
<script>
var f=document.getElementById('w');window.__h=400;f.style.height='400px';
addEventListener('message',function(e){if(e.source!==f.contentWindow)return;if(!e.data||e.data.type!=='iframe-widget-resize')return;var h=Math.max(50,Math.min(5000,Math.round(e.data.height)));f.style.height=h+'px';window.__h=h;});
</script></body></html>`;

// React's escapeTextForBrowser, used for attributes in SSR output
const reactEscape = (s) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#x27;' }[c]));

async function renderSrcdoc(page, srcdoc, { ssr = false, shot } = {}) {
  const errors = [];
  const onErr = (e) => errors.push(String(e.message || e).slice(0, 160));
  const onConsole = (m) => { if (m.type() === 'error') errors.push(m.text().slice(0, 160)); };
  page.on('pageerror', onErr); page.on('console', onConsole);
  if (ssr) {
    await page.setContent(LW_PAGE(`<iframe id="w" srcdoc="${reactEscape(srcdoc)}" sandbox="allow-scripts" title="Embedded widget" data-lexical-iframe-widget="true"></iframe>`));
  } else {
    await page.setContent(LW_PAGE('<iframe id="w" sandbox="allow-scripts" title="Embedded widget" data-lexical-iframe-widget="true"></iframe>'));
    await page.$eval('#w', (f, d) => f.setAttribute('srcdoc', d), srcdoc);
  }
  await page.waitForTimeout(1800);
  const frame = page.frames().find((fr) => fr.parentFrame() === page.mainFrame());
  const m = await frame.evaluate(() => {
    let rules = 0;
    for (const s of document.styleSheets) { try { rules += s.cssRules.length; } catch (e) { /* cross-origin */ } }
    let ink = null;
    const c = document.querySelector('canvas');
    if (c && c.width && c.height) {
      try { const t = document.createElement('canvas'); t.width = 64; t.height = 64; const x = t.getContext('2d'); x.drawImage(c, 0, 0, 64, 64); const d = x.getImageData(0, 0, 64, 64).data; let n = 0; for (let i = 3; i < d.length; i += 4) if (d[i]) n++; ink = n; } catch (e) { ink = -1; }
    }
    const check = document.getElementById('lw-widget-check');
    return { rules, globals: Object.keys(window).length, bodyBg: getComputedStyle(document.body).backgroundColor, ink,
      check: check && getComputedStyle(check).display !== 'none' ? check.textContent.slice(0, 140) : null };
  }).catch((e) => ({ evalError: String(e).slice(0, 120) }));
  m.height = await page.evaluate(() => window.__h);
  m.errors = errors;
  if (shot) await page.screenshot({ path: shot, fullPage: true });
  page.off('pageerror', onErr); page.off('console', onConsole);
  return m;
}

// Same widget? Compare against the reference rendering of the original file.
function judge(m, ref, { lw = false } = {}) {
  const problems = [];
  if (m.evalError) return [m.evalError];
  if (m.errors.length) problems.push(`errors: ${m.errors[0]}`);
  if (m.rules < ref.rules) problems.push(`css rules ${m.rules}/${ref.rules}`);
  if (m.bodyBg !== ref.bodyBg) problems.push(`body background ${m.bodyBg} (want ${ref.bodyBg})`);
  if (m.globals < ref.globals - (lw ? 0 : 1)) problems.push(`globals ${m.globals}/${ref.globals} (scripts did not run)`);
  if (ref.ink && !m.ink) problems.push('canvas blank');
  if (Math.abs(m.height - ref.height) > Math.max(40, ref.height * 0.2)) problems.push(`height ${m.height} (want ~${ref.height})`);
  if (m.check) problems.push(`self-check shown: "${m.check}"`);
  return problems;
}

function textDiff(a, b) {
  if (a === b) return 'identical';
  let i = 0; while (i < a.length && a[i] === b[i]) i++;
  return `differs at char ${i}/${a.length} (got length ${b.length}): ${JSON.stringify(b.slice(i, i + 50))}`;
}

// ---------------------------------------------------------------- main

(async () => {
  if (!FILES.length) { console.error('no input files'); process.exit(2); }
  ensureDeps();
  const server = makeServer();
  const bundle = buildLexicalBundle();
  fs.mkdirSync(OUT, { recursive: true });
  console.log(`sanitizer: ${server.fromRepo ? 'bundled from ' + LW_REPO : 'embedded copy'}; screenshots: ${OUT}\n`);

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 760, height: 1000 } });
  const ed = await browser.newPage();
  await ed.setContent('<!doctype html><meta charset="utf-8"><div id="editor" contenteditable="true" style="white-space:pre-wrap"></div>');
  await ed.addScriptTag({ path: bundle });

  const report = {};
  let mustFail = 0;
  for (const file of FILES) {
    const name = path.basename(file, '.html');
    const text = fs.readFileSync(file, 'utf8');
    const isLw = /-lw\.html$/.test(file);
    const rows = [];
    const shot = (p) => path.join(OUT, `${name}--${p.replace(/[^a-z0-9]+/gi, '-')}.png`);
    const ref = await renderSrcdoc(page, server.injectResizeScript(text), { shot: shot('direct') });
    rows.push({ path: 'direct', kind: 'must', problems: ref.errors.length ? [`errors: ${ref.errors[0]}`] : [], note: `height ${ref.height}, ${ref.rules} css rules, bg ${ref.bodyBg}` });

    const editorPaste = async (flavor, clickInto = true) => {
      await ed.evaluate((c) => lex.insertCustomWidget(c), clickInto);
      await ed.evaluate((d) => lex.paste(d), clipboards[flavor](text));
      const blocks = await ed.evaluate(() => lex.blocks());
      const widget = blocks.find((b) => b.type === 'iframe-widget');
      const outside = blocks.filter((b) => b.type !== 'iframe-widget' && b.text.trim()).length;
      return { widgetText: widget ? widget.text : '', outside };
    };
    const preview = async (widgetText, label, kind, extraNote = '') => {
      if (!widgetText.trim()) { rows.push({ path: label, kind, problems: ['widget is empty ("No HTML content")'], note: extraNote }); return; }
      const srcdoc = server.injectResizeScript(await ed.evaluate((t) => lex.stripDeletedMarkupFromSrcdoc(t), widgetText));
      const m = await renderSrcdoc(page, srcdoc, { shot: shot(label) });
      rows.push({ path: label, kind, problems: judge(m, ref, { lw: isLw }), note: [`widget text ${textDiff(text, widgetText)}`, extraNote, m.check ? '' : ''].filter(Boolean).join('; ') });
    };

    // editor paths
    for (const [flavor, label] of [['plain', 'editor:plain-paste'], ['preHtml', 'editor:pre-html-paste'], ['vscodeHtml', 'editor:vscode-html-paste']]) {
      const r = await editorPaste(flavor);
      await preview(r.widgetText, label, 'must', r.outside ? `${r.outside} block(s) landed outside the widget` : '');
    }
    // reader paths, from the editor's own export of the plain paste
    await editorPaste('plain');
    const exported = await ed.evaluate(() => lex.exportHtml());
    const stored = server.saveRevision(exported);
    if (stored.length !== 1) {
      rows.push({ path: 'reader:published', kind: 'must', problems: [`${stored.length} srcdocs stored`] });
    } else {
      const m1 = await renderSrcdoc(page, server.injectResizeScript(stored[0]), { shot: shot('reader-published') });
      rows.push({ path: 'reader:published', kind: 'must', problems: judge(m1, ref, { lw: isLw }), note: `stored srcdoc ${textDiff(text, stored[0])}; exported post HTML ${(exported.length / 1024).toFixed(0)} KB` });
      const m2 = await renderSrcdoc(page, server.injectResizeScript(stored[0]), { ssr: true, shot: shot('reader-ssr') });
      rows.push({ path: 'reader:ssr', kind: 'must', problems: judge(m2, ref, { lw: isLw }) });
    }
    // agent paths
    await ed.evaluate((t) => lex.agentInsertWidget(t), text);
    const agentStored = server.saveRevision(await ed.evaluate(() => lex.exportHtml()));
    if (agentStored.length === 1) {
      const m3 = await renderSrcdoc(page, server.injectResizeScript(agentStored[0]), { shot: shot('agent-insertWidget') });
      rows.push({ path: 'agent:insertWidget', kind: 'must', problems: judge(m3, ref, { lw: isLw }), note: `stored srcdoc ${textDiff(text, agentStored[0])}` });
    } else rows.push({ path: 'agent:insertWidget', kind: 'must', problems: [`${agentStored.length} srcdocs stored`] });
    const fenced = server.parseWidgetFence(server.widgetToMarkdown(text));
    rows.push({ path: 'agent:markdown-roundtrip', kind: 'must', problems: fenced === text ? [] : [`fence parse ${textDiff(text, fenced || '')}`] });

    // hazards
    const early = await editorPaste('plain', false);
    rows.push({ path: 'hazard:paste-right-after-insert', kind: 'hazard', problems: early.widgetText.trim() ? [] : [`widget empty; the code went into ${early.outside} paragraph(s) below it`] });
    const lines = await editorPaste('linesHtml');
    await preview(lines.widgetText, 'hazard:lines-html-paste', 'hazard');
    await editorPaste('plain');
    await ed.evaluate((h) => lex.importHtml(h), await ed.evaluate(() => lex.exportHtml()));
    const reloaded = (await ed.evaluate(() => lex.blocks())).find((b) => b.type === 'iframe-widget');
    await preview(reloaded ? reloaded.text : '', 'hazard:reload-from-html', 'hazard');

    console.log(`== ${path.relative(process.cwd(), file)} (${(text.length / 1024).toFixed(1)} KB)`);
    for (const r of rows) {
      const ok = !r.problems.length;
      if (!ok && r.kind === 'must') mustFail++;
      const tag = ok ? 'PASS' : r.kind === 'must' ? 'FAIL' : 'BREAKS';
      console.log(`  ${tag.padEnd(6)} ${r.path.padEnd(32)} ${ok ? '' : r.problems.join('; ')}${r.note ? (ok ? '' : ' | ') + r.note : ''}`);
    }
    console.log('');
    report[file] = rows;
  }

  // Entity probe: LessWrong's reader pipeline decodes one level of HTML character references inside widget source,
  // because MathJax's LiteParser.protectAttribute (adaptors/lite/Parser.js:269) escapes only '"' when it re-serializes.
  await ed.evaluate((t) => lex.agentInsertWidget(t), '<p id="x">a &lt;b&gt; tag, &amp;amp; &quot;q&quot;</p>');
  const probe = server.saveRevision(await ed.evaluate(() => lex.exportHtml()))[0];
  console.log(`entity probe: widget source '<p id="x">a &lt;b&gt; tag, &amp;amp; &quot;q&quot;</p>'\n           stored for readers as ${JSON.stringify(probe)}`);

  fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(report, null, 2));
  await browser.close();
  console.log(mustFail ? `\n${mustFail} must-pass path(s) FAILED` : '\nall must-pass paths passed');
  process.exit(mustFail && !keepGoing ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(2); });
