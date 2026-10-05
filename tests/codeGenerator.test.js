import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  generateHTML, generateJS,
  generateEmbedHTML, generateEmbedCSS, generateEmbedJS
} from '../src/utils/codeGenerator.js';

const slides = [
  { title: 'Sala', caption: 'Ambiente <principal>', fileName: 'a.jpg' },
  {
    title: 'Drone', isCanvasSequence: true,
    sequenceData: { totalFrames: 3, frames: [{ fileName: 'frame_001.webp' }] }
  },
  { title: 'Vista 360', is360: true, fileName: 'p.jpg' }
];

test('embed CSS scopes every selector and drops demo/global rules', () => {
  const css = generateEmbedCSS({ zoomScale: 1.3 });
  assert.match(css, /\.scrolly-embed \{\s*--zoom-max: ?1\.3|--zoom-max: 1\.3/);
  assert.doesNotMatch(css, /lp-/);
  assert.doesNotMatch(css, /^\s*body\b/m);
  assert.doesNotMatch(css, /overflow-x: hidden/);

  const selectors = [...css.matchAll(/^([^\s@}/][^{\n]*)\{/gm)].map(m => m[1].trim());
  const unscoped = selectors.filter(s => !s.startsWith('.scrolly-embed'));
  assert.deepEqual(unscoped, []);
  assert.match(css, /@keyframes scrollAnim/);
  assert.match(css, /@media \(max-width: 768px\)/);
});

test('embed HTML has no document wrapper, escapes text and loads three only for 360', () => {
  const html = generateEmbedHTML(slides);
  assert.doesNotMatch(html, /<html|<body|lp-header/);
  assert.match(html, /class="scrolly-embed"/);
  assert.match(html, /Ambiente &lt;principal&gt;/);
  assert.match(html, /three\.min\.js/);
  assert.doesNotMatch(generateEmbedHTML(slides.slice(0, 1)), /three\.min\.js/);
});

test('generated JS parses and scopes lookups to the root', () => {
  for (const js of [generateJS(slides, {}), generateEmbedJS(slides, {})]) {
    assert.doesNotThrow(() => new Function(js));
  }
  const embedJs = generateEmbedJS(slides, {});
  assert.match(embedJs, /\.scrolly-embed #tour-virtual/);
  assert.match(embedJs, /gsap\.utils\.toArray\("\.scrolly-slide", section\)/);
  assert.match(embedJs, /document\.readyState/);
});

test('full page keeps its landing-page shell', () => {
  const html = generateHTML(slides, { title: 'T' });
  assert.match(html, /<html lang="pt-BR">/);
  assert.match(html, /lp-header/);
});
