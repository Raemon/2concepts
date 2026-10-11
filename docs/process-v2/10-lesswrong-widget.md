# 10. Getting the widget onto LessWrong

The game was pasted into a LessWrong post as a "Custom Widget". It rendered as raw, unstyled HTML: default fonts,
default buttons, a visible `<textarea>`, a blank canvas, the cream page colour showing through. This note covers why,
what LessWrong (ForumMagnum) does to widget code, the format we now ship (`dist/still-water-lw.html`), and how to
insert it.

File and line references point at the ForumMagnum clone (`/home/user/forummagnum/forummagnum`, commit 2772729).

## Summary

- **The page that rendered had no working `<style>` and no working `<script>`.** That is the only way to get that
  picture. Rendering the game with its `<style>` and `<script>` elements removed reproduces the description exactly:
  title line, big heading, tagline, three grey buttons, an empty textarea, a blank 300×150 canvas, cream background.
  Every other breakage we simulated looks different (see the table below).
- **LessWrong did not strip them.** A plain-text paste into a Custom Widget block reaches the editor preview
  byte for byte, and published readers get the same `<style>` and `<script>` elements. We checked this with a real
  Lexical 0.44 editor, LessWrong's own `sanitize()`, cheerio and MathJax at the versions in its `yarn.lock`, and React's
  attribute escaping. The doctype, `<html>`, `<head>` and `<body>` tags do get dropped. That is harmless, because a
  srcdoc document never goes into quirks mode.
- **Not CSP.** lesswrong.com sends no Content-Security-Policy. We checked the live headers on `/`, `/newPost`,
  `/editPost` and a post page, plus `next.config.ts:99-107`, which sets only HSTS. So the srcdoc iframe inherits nothing
  that could block inline code.
- **So the code that ended up in the block was not the file's plain text.** The paste itself went wrong. LessWrong's
  editor makes this easy to do without noticing:
  - After `/` → **Custom Widget**, the caret sits in the paragraph *below* the new block, not inside it.
  - A clipboard that carries `text/html` is imported as HTML. Lexical's importer drops `STYLE` and `SCRIPT` elements
    outright (`@lexical/html` `IGNORE_TAGS`, LexicalHtml.dev.js:645). Code views that drop whitespace collapse each
    script onto one line, so its first `//` comment swallows the rest of the script.
  - Two consecutive blank lines in a paste make the block exit, and the rest lands outside it.

  The saved widget code is not available to us, so we can't say which of these happened. It's easy to check: open the
  widget's code view. If the code doesn't start with `<style>` (or `<!doctype html>`) and end with `</script>`, or it
  looks like plain text, that's the cause.
- **Fix:** paste `dist/still-water-lw.html` (built by `tools/build-lw-widget.js`) as plain text into the block, after
  clicking inside it. The format is a fragment with nothing LessWrong would strip or re-interpret. It also carries a
  self-check: if styles or scripts fail to load, the widget shows a red notice explaining how to re-paste, instead of
  raw HTML.

## What LessWrong does to widget code

| Step | Where | What happens to the code |
|---|---|---|
| Insert block | `/` menu → "Custom Widget" (`ComponentPickerPlugin/index.tsx:288`) → `INSERT_IFRAME_WIDGET_COMMAND` → `$insertNodeToNearestRoot` (`IframeWidgetPlugin.tsx:401-418`) | Empty `IframeWidgetNode`, a subclass of Lexical's `CodeNode`, shown in code view. **The caret ends up in the paragraph after the block** (simulated). |
| Paste | Lexical `$insertDataTransferForRichText` (`@lexical/clipboard` LexicalClipboard.dev.js:138) | Uses `text/html` whenever it differs from `text/plain`. HTML is parsed and converted to nodes, with `<style>`/`<script>` ignored (`IGNORE_TAGS`). Non-code nodes are spliced into the code block. Plain text is inserted line by line, and every newline goes through `CodeNode.insertNewAfter`. |
| Blank lines | `CodeNode.insertNewAfter` → `$exitCodeNodeOnEnter` (LexicalCodeCore.dev.js:404, 559) | LessWrong registers no `@lexical/code` extension (`LexicalEditor.tsx:477`), so the legacy rule applies: at two consecutive empty lines the block is exited. **The rest of the paste becomes ordinary paragraphs** (simulated). |
| Editor preview | `IframeWidgetPlugin.tsx:106-111, 285-313` | `DOMParser` → remove `<del>` → `documentElement.innerHTML`, so the doctype and `<html>` tag go. Then `injectResizeScript` appends a `<script>`. Rendered in `<iframe sandbox="allow-scripts" srcdoc>`. The `<>` button in the corner means preview mode. |
| Save (client) | `$generateHtmlFromNodes` with LessWrong's export map (`LexicalEditor.tsx:458-478`), `IframeWidgetNode.exportDOM` (`IframeWidgetNode.tsx:75-87`) | `<iframe data-lexical-iframe-widget sandbox="allow-scripts" srcdoc="…">`. Because the node is a `CodeNode`, Lexical **also appends every code line as `<span>`/`<br>` children inside the iframe** (`@lexical/html` `$appendNodesToHTML`). The post HTML is about 2.9× the widget size. |
| Save (server) | `buildRevision` → `lexicalMarkupToHtml` (`conversionUtils.ts:795`): `sanitize()` (`sanitize.ts:127-156, 179, 241`) → `trimLeadingAndTrailingWhiteSpace` (:649) → `removePrivateLexicalMarkup` (:771) → `renderMathInHtml` (:492) | The srcdoc attribute survives sanitize-html and cheerio intact. **MathJax's lite parser re-serializes the whole post even when there is no math, and escapes only `"` in attributes** (`mathjax-full/js/adaptors/lite/Parser.js:143, 269`). One level of character references in the widget code is therefore decoded for readers. |
| Extract | `createRevision` → `extractAndReplaceIframeWidgets` (`conversionUtils.ts:806-838`, `revisions/mutations.ts:39`) | `cheerio.load(srcdoc, null, false)` is a fragment parse, which drops doctype, `<html>`, `<head>` and `<body>` but keeps `<meta>`, `<style>`, `<script>` and the body content. Stored in `IframeWidgetSrcdocs`; the post body gets a placeholder `div`. |
| Reader | `ContentItemBody.tsx:433` → `HydratedIframeWidget.tsx:59-69` (SSR + hydrate) | `srcDoc={injectResizeScript(stored)}`, `sandbox="allow-scripts"`, starts at 400 px high and is resized by the injected script. |
| Reload from HTML | Non-collaborative load (`Editor.tsx:800-818`), or pasting a copied widget without Lexical's own clipboard format | `importDOM` takes the srcdoc, then **appends the iframe's raw-text children (the escaped code dump) to the widget**. Each round trip adds a copy of the code below the game (simulated). |
| Agent API | `insertWidget/route.ts:41-45`; `replaceWidget/route.ts:132-154`; editPost fence (`conversionUtils.ts:155`); `insertBlock` fence regex (`insertBlock/route.ts:61`) | `insertWidget` stores the content verbatim as one text node. `replaceWidget` defaults to `mode: "suggest"` (`toolSchemas.ts:6`), which keeps the old and new code side by side as suggestions. A line starting with ```` ``` ```` would cut a fenced widget short. |

## Simulation results

`tools/lw-sim.js` reproduces each step above at LessWrong's pinned versions: cheerio 1.0.0-rc.9, sanitize-html 2.17.7,
mathjax-full 3.2.2 and Lexical 0.44.0. When the clone is present, `sanitize.ts` and `iframeResizeScript.ts` are bundled
from it. Each result is rendered in a sandboxed srcdoc iframe on a mock post page and compared with the file rendered
directly. The comparison covers script errors, CSS rule count, body background, whether the scripts defined their
globals, canvas ink, the auto-measured height, and whether the self-check notice is visible.

Results for `dist/still-water.html` (about 80 KB) and `dist/still-water-lw.html` (about 82 KB), and earlier for
`dist/hush.html`:

| Path | still-water.html | still-water-lw.html |
|---|---|---|
| direct (reference) | pass | pass |
| editor: plain-text paste, then preview | pass, text identical | pass, text identical |
| editor: paste with `<pre>` HTML flavour | pass | pass |
| editor: paste with VS Code HTML flavour | pass (adds one blank line) | pass |
| reader: published (save pipeline → stored srcdoc → React) | pass | pass, **stored srcdoc byte-identical** |
| reader: server-rendered | pass | pass |
| agent: `insertWidget` → save → reader | pass | pass, byte-identical |
| agent: markdown fence round trip | pass | pass |
| hazard: paste right after inserting the block | widget empty, code in ~1430 paragraphs below | same |
| hazard: HTML flavour without newlines | scripts dead, canvas blank, CSS intact | same, plus **self-check notice shown** |
| hazard: editor reloads its own HTML | game, then a 145 KB source dump (height 5000) | same, plus **self-check notice shown** |

Entity probe: widget source `<p id="x">a &lt;b&gt; tag, &amp;amp; &quot;q&quot;</p>` is stored for readers as
`<p id="x">a <b> tag, &amp; "q"</b></p>`. It's a real `<b>` element, and the editor preview disagrees with the
published page. Neither game uses character references, but the builder now refuses them.

Hypotheses rendered to match the user's screenshot (scratch experiment):
- `<style>` and `<script>` removed: **matches**.
- Indentation turned into non-breaking spaces: CSS dies but the game draws.
- Newlines collapsed: CSS works on a dark background, scripts dead.
- `<head>` dropped: CSS lost but the game draws.
- Code dump with entities decoded once: like the screenshot, but with huge gaps between lines.

## The robust format

`node tools/build-lw-widget.js dist/still-water.html dist/still-water-lw.html` is a pure transformation of the built
file. It does the following, each for the reason given:

1. **Emits a fragment.** Order: `<style>`, then the body markup, then the scripts in their original places. It drops
   the doctype, `<html>`, `<head>`, `<body>`, `<meta>` and `<title>`. LessWrong drops or ignores these anyway, the
   preview and reader keep different subsets, and none of them matters inside a srcdoc iframe. Without them, the editor
   preview, the published page and the agent's view all receive the same document. The reader's stored copy is
   byte-identical to what was pasted, which makes it easy to diff.
2. **Compacts CSS.** No comments, no indentation, no blank lines. An HTML clipboard that turns indentation into
   non-breaking spaces then has nothing to corrupt; otherwise every selector would become invalid.
3. **Collapses runs of blank lines**, so a paste can't exit the code block partway through.
4. **Handles character references.** In markup text they become literal characters where that is safe; anywhere else
   they are a build error. This matters because LessWrong decodes them once for readers.
5. **Rejects ```` ``` ````**, which would end the agent API's widget fence.
6. **Adds a self-check** (`--no-check` turns it off). A small notice sits above the game:
   - It is visible by default and hidden by a one-line script immediately after it, so a healthy widget never paints it.
   - Each inline script ends by incrementing a counter.
   - At the end, a check shows the notice with a specific reason and the fix:
     - "its scripts are not running" (no script ran at all, which was the user's case)
     - "its styles did not load" (CSS marker rules missing)
     - "its scripts did not run (k of N finished)"
     - "a script failed while loading: …"
     - "extra content follows the widget code" (the reload duplication)

   This turns a silent "raw HTML" render into an instruction. It was tested against every hazard above and against the
   user's exact failure (styles and scripts missing).

The builder is generic: input path → output path. The default input is `dist/still-water.html`, falling back to
`dist/hush.html`; the default output is `<input>-lw.html`. `--strict` exits non-zero on errors.

## Inserting it by hand (LessWrong editor)

1. Build: `node tools/build.js && node tools/build-lw-widget.js dist/still-water.html dist/still-water-lw.html`.
2. Open `dist/still-water-lw.html` in a **plain-text editor** (VS Code, TextEdit in plain-text mode, `cat` in a
   terminal). Select all and copy. Don't copy from a rendered page or from a code view with line numbers.
3. In the LessWrong post editor, put the cursor on an **empty line**, type `/`, then type `widget` and choose **Custom
   Widget** (keywords: widget, html, iframe, embed). An empty code box with an eye button in its corner appears.
4. **Click inside the empty code box.** After insertion the caret is in the paragraph below the box, not inside it.
5. Paste **as plain text**: **Ctrl+Shift+V** (Windows/Linux) or **Cmd+Option+Shift+V** (Mac, Chrome). Plain Ctrl/Cmd+V
   also works when the clipboard holds only text, but the plain-text shortcut rules out an HTML flavour.
6. Check the code box:
   - line 1 is `<style>`;
   - the last line is `</script>`;
   - nothing from the code appears as ordinary paragraphs under the box (if it does, delete those paragraphs and the
     widget, and redo steps 3–5).
7. Click the **eye** button (top right of the box) to switch to preview. The game should appear on its dark-teal
   background at full column width, with its height adjusting automatically.
   - If a **red notice** appears instead, it says what failed. Re-paste as plain text into an empty widget.
   - The `<>` button switches back to code view.
8. Publish or save the draft. On the published post, check that the game renders and that **no source text appears
   below it**.
9. To update the game later, open the widget's code view, select all inside the box (Ctrl/Cmd+A once selects just the
   box), and paste the new build as plain text. Avoid restoring old versions of the post; reloading from HTML appends a
   copy of the code, which the self-check reports.

## Inserting it through the agent API

The `key` is the link-sharing key from the draft's `editPost?postId=…&key=…` URL.

```bash
jq -n --arg postId POST_ID --arg key LINK_KEY --rawfile content dist/still-water-lw.html \
  '{postId:$postId, key:$key, agentName:"Claude", content:$content, location:"end"}' \
| curl -sS -X POST https://www.lesswrong.com/api/agent/insertWidget \
    -H 'content-type: application/json' --data-binary @-
# -> {"ok":true,"widgetId":"…",…}  (location can also be "start", {"before":"para text"}, {"after":"para text"})
```

- Send the raw HTML as `content`. Don't wrap it in a markdown fence (SKILL.md).
- To update the widget, use `POST /api/agent/replaceWidget` with
  `{postId, key, widgetId, replacement: <file contents>, mode: "edit"}`. **Pass `mode: "edit"`**: the default is
  `"suggest"`, which leaves the old and new code side by side as a pending suggestion until someone accepts it.
- Afterwards, `GET /editPost?postId=…&key=…` shows the widget as ```` ```widget[id] ```` followed by the code. Check that
  it is complete.

## Tools

- `NODE_PATH=/opt/node22/lib/node_modules node tools/lw-sim.js [files…] [--out DIR] [--keep-going]`
  - Runs every path above.
  - Installs the pinned dependencies into `$TMPDIR/lw-sim-deps` on first run (never into the repo).
  - Writes screenshots and `report.json` to `$TMPDIR/lw-sim-out`.
  - Exits 1 if a must-pass path fails; the hazard rows are informational.
  - Set `LW_REPO` to point at a different ForumMagnum clone.
- `node tools/build-lw-widget.js [in.html] [out.html] [--no-check] [--strict]`

## LessWrong issues found on the way (worth reporting upstream)

1. After inserting a Custom Widget, the caret is left outside the block (`$insertNodeToNearestRoot` with no follow-up
   selection).
2. Two blank lines in a paste exit the widget's code block (legacy `CodeNode` exit-on-Enter, because the code
   extension isn't registered).
3. `IframeWidgetNode.exportDOM` doesn't suppress children, so the code is exported twice. Re-importing HTML appends the
   escaped copy to the widget content.
4. `renderMathInHtml` round-trips every post through MathJax's lite parser, which escapes only `"` in attributes. One
   level of entities in widget srcdocs, and in any other attribute value, gets decoded.
5. Pasting into the widget honours `text/html`. For a code block, preferring `text/plain` would avoid all the
   clipboard-flavour failures.
