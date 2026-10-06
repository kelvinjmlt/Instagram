// Gera um carrossel do Instagram (1080x1350) a partir de content.json.
// Uso: node scripts/render.js posts/<pasta-do-post>
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const W = 1080;
const H = 1350;

const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const css = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { width: ${W}px; height: ${H}px; font-family: 'Inter', sans-serif; color: #F4F1EA;
         background: #0F1A17; overflow: hidden; }
  .slide { width: ${W}px; height: ${H}px; padding: 88px 84px 72px; display: flex;
           flex-direction: column; position: relative;
           background: radial-gradient(circle at 85% 8%, var(--glow) 0%, transparent 45%), #0F1A17; }
  .top { display: flex; justify-content: space-between; align-items: center;
         font-size: 26px; letter-spacing: .08em; text-transform: uppercase; color: #A9B5AF; font-weight: 600; }
  .num { color: var(--accent); font-weight: 800; }
  .emoji { font-size: 96px; line-height: 1; margin: 40px 0 24px; font-family: 'Noto Color Emoji'; }
  h1 { font-family: 'Inter Display', 'Inter', sans-serif; font-weight: 800; font-size: 58px;
       line-height: 1.08; letter-spacing: -.02em; }
  ul { list-style: none; margin: 34px 0 36px; display: flex; flex-direction: column; gap: 18px; }
  li { font-size: 29px; line-height: 1.32; padding-left: 34px; position: relative; color: #E2DED5; }
  li::before { content: ''; position: absolute; left: 0; top: 15px; width: 14px; height: 14px;
               border-radius: 50%; background: var(--accent); }
  .why { margin-top: auto; border-left: 8px solid var(--accent); background: rgba(255,255,255,.06);
         padding: 26px 30px; border-radius: 0 18px 18px 0; }
  .why b { display: block; font-size: 24px; letter-spacing: .1em; text-transform: uppercase;
           color: var(--accent); margin-bottom: 10px; }
  .why p { font-size: 28px; line-height: 1.32; }
  .caveat { margin-top: 20px; font-size: 25px; line-height: 1.35; color: #A9B5AF; font-style: italic; }
  .foot { margin-top: 26px; display: flex; justify-content: space-between; font-size: 22px; color: #7E8C86; }
  .cover h1 { font-size: 104px; margin-top: auto; }
  .cover .kicker { font-size: 34px; font-weight: 700; color: var(--accent); letter-spacing: .06em;
                   text-transform: uppercase; margin-bottom: 26px; }
  .cover .sub { font-size: 32px; color: #A9B5AF; margin-top: 34px; line-height: 1.4; }
  .row { display: flex; gap: 26px; font-size: 92px; font-family: 'Noto Color Emoji'; margin-top: 64px; }
  .swipe { margin-top: auto; font-size: 30px; font-weight: 700; color: var(--accent); }
  .closing h1 { font-size: 96px; margin-top: auto; }
  .closing .sub { font-size: 40px; margin-top: 30px; color: #E2DED5; }
  .closing .cta { margin-top: auto; font-size: 30px; color: #A9B5AF; }
`;

const page = (inner, accent, cls = '') => `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">
<style>${css}</style></head><body>
<div class="slide ${cls}" style="--accent:${accent};--glow:${accent}33">${inner}</div></body></html>`;

function buildSlides(c) {
  const total = c.items.length + 2;
  const slides = [];
  slides.push(page(`
    <div class="top"><span>Biologia</span><span>${esc(c.date)}</span></div>
    <div class="row">${c.cover.emojis.join('')}</div>
    <div style="margin-top:auto"></div>
    <div class="kicker">${esc(c.cover.kicker)}</div>
    <h1 style="margin-top:0">${esc(c.cover.title)}</h1>
    <div class="sub">${esc(c.cover.subtitle)}</div>
    <div class="swipe" style="margin-top:56px">Arraste para o lado →</div>`, '#7BC47F', 'cover'));

  c.items.forEach((it, i) => {
    slides.push(page(`
      <div class="top"><span><span class="num">${i + 1}/${c.items.length}</span> · ${esc(it.area)}</span></div>
      <div class="emoji">${it.emoji}</div>
      <h1>${esc(it.title)}</h1>
      <ul>${it.points.map((p) => `<li>${esc(p)}</li>`).join('')}</ul>
      <div class="why"><b>Por que importa</b><p>${esc(it.why)}</p></div>
      ${it.caveat ? `<div class="caveat">⚠️ ${esc(it.caveat)}</div>` : ''}
      <div class="foot"><span>Fonte: ${esc(it.source)}</span><span>${i + 2}/${total}</span></div>`,
      it.accent));
  });

  slides.push(page(`
    <div class="top"><span>Biologia</span><span>${total}/${total}</span></div>
    <h1>${esc(c.closing.title)}</h1>
    <div class="sub">${esc(c.closing.subtitle)}</div>
    <div class="row" style="margin-top:48px">${c.items.map((it) => it.emoji).join('')}</div>
    <div class="cta">${esc(c.closing.cta)}</div>`, '#7BC47F', 'closing'));
  return slides;
}

async function main() {
  const dir = process.argv[2];
  if (!dir) throw new Error('Informe a pasta do post, ex.: posts/2026-10-05-descobertas-biologia');
  const content = JSON.parse(fs.readFileSync(path.join(dir, 'content.json'), 'utf8'));
  const slides = buildSlides(content);
  const out = path.join(dir, 'slides');
  fs.mkdirSync(out, { recursive: true });

  const browser = await chromium.launch();
  const tab = await browser.newPage({ viewport: { width: W, height: H } });
  for (let i = 0; i < slides.length; i++) {
    await tab.setContent(slides[i], { waitUntil: 'load' });
    await tab.evaluate(() => document.fonts.ready);
    const overflow = await tab.evaluate(() => {
      const s = document.querySelector('.slide');
      return s.scrollHeight > s.clientHeight;
    });
    if (overflow) console.warn(`Aviso: o slide ${i + 1} tem texto transbordando`);
    const file = path.join(out, `${String(i + 1).padStart(2, '0')}.png`);
    await tab.screenshot({ path: file });
    console.log(file);
  }
  await browser.close();
}

main().catch((e) => { console.error(e); process.exit(1); });
