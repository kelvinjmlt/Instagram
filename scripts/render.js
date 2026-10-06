// Gera um carrossel do Instagram (1080x1350) a partir de content.json.
// Uso: node scripts/render.js posts/<pasta-do-post> [outras pastas...]
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const W = 1080;
const H = 1350;

const esc = (s) =>
  String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
// Permite **negrito** e *itálico* dentro dos textos.
const rich = (s) =>
  esc(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\*(.+?)\*/g, '<em>$1</em>');

const css = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { width: ${W}px; height: ${H}px; font-family: 'Inter', sans-serif; color: #F4F1EA;
         background: #0F1A17; overflow: hidden; }
  strong { color: #fff; font-weight: 700; }
  .slide { width: ${W}px; height: ${H}px; padding: 80px 84px 64px; display: flex; flex-direction: column;
           background: radial-gradient(circle at 88% 6%, var(--glow) 0%, transparent 46%), #0F1A17; }
  .top { display: flex; justify-content: space-between; align-items: center; font-size: 24px;
         letter-spacing: .08em; text-transform: uppercase; color: #A9B5AF; font-weight: 600; }
  .top .tag { color: var(--accent); font-weight: 800; }
  .content { flex: 1; display: flex; flex-direction: column; min-height: 0; padding-top: 48px; }
  .label { font-size: 26px; font-weight: 800; letter-spacing: .1em; text-transform: uppercase;
           color: var(--accent); margin-bottom: 18px; }
  h1 { font-family: 'Inter Display', 'Inter', sans-serif; font-weight: 800; font-size: 64px;
       line-height: 1.07; letter-spacing: -.02em; }
  h2 { font-family: 'Inter Display', 'Inter', sans-serif; font-weight: 800; font-size: 58px;
       line-height: 1.08; letter-spacing: -.02em; }
  .emoji { font-family: 'Noto Color Emoji'; line-height: 1; }
  p.body { font-size: 37px; line-height: 1.42; color: #E2DED5; margin-top: 34px; }
  p.body + p.body { margin-top: 22px; }
  ul.bullets { list-style: none; margin-top: 38px; display: flex; flex-direction: column; gap: 28px; }
  ul.bullets li { font-size: 35px; line-height: 1.38; padding-left: 36px; position: relative; color: #E2DED5; }
  ul.bullets li::before { content: ''; position: absolute; left: 0; top: 18px; width: 14px; height: 14px;
                          border-radius: 50%; background: var(--accent); }
  .foot { display: flex; align-items: center; gap: 24px; margin-top: 28px; font-size: 22px; color: #7E8C86; }
  .bar { flex: 1; height: 6px; border-radius: 3px; background: rgba(255,255,255,.1); overflow: hidden; }
  .bar i { display: block; height: 100%; background: var(--accent); }
  .swipe { color: var(--accent); font-weight: 700; }
  .art { margin-top: auto; align-self: flex-end; font-family: 'Noto Color Emoji'; font-size: 150px; line-height: 1; padding-top: 4px; }

  /* capa */
  .t-cover .emoji { font-size: 150px; margin-top: 20px; }
  .t-cover h1 { font-size: 88px; margin-top: auto; }
  .t-cover .sub { font-size: 36px; line-height: 1.38; color: #C9D2CD; margin-top: 30px; }
  .t-cover .hook { margin-top: 40px; font-size: 30px; font-weight: 700; color: var(--accent); }

  /* passos */
  ol.steps { list-style: none; margin-top: 40px; display: flex; flex-direction: column; gap: 0; }
  ol.steps li { display: grid; grid-template-columns: 76px 1fr; column-gap: 26px; position: relative;
                padding-bottom: 34px; }
  ol.steps li:not(:last-child)::after { content: ''; position: absolute; left: 37px; top: 76px; bottom: 4px;
                                        width: 3px; background: rgba(255,255,255,.14); }
  ol.steps .n { width: 76px; height: 76px; border-radius: 50%; border: 3px solid var(--accent);
                display: flex; align-items: center; justify-content: center; font-size: 26px;
                font-weight: 800; color: var(--accent); text-align: center; line-height: 1; }
  ol.steps .t { font-size: 34px; font-weight: 700; padding-top: 4px; line-height: 1.25; }
  ol.steps .d { font-size: 29px; line-height: 1.38; color: #C9D2CD; margin-top: 6px; }

  /* números */
  .stats { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-top: 44px; }
  .stat { background: rgba(255,255,255,.06); border-radius: 22px; padding: 30px 30px 32px; }
  .stat .v { font-family: 'Inter Display', 'Inter', sans-serif; font-size: 76px; font-weight: 800;
             color: var(--accent); line-height: 1; letter-spacing: -.02em; }
  .stat .l { font-size: 29px; line-height: 1.35; color: #E2DED5; margin-top: 14px; }
  .stats.one { grid-template-columns: 1fr; }
  .note { font-size: 30px; line-height: 1.4; color: #A9B5AF; margin-top: 30px; }

  /* comparação */
  .compare { display: grid; grid-template-columns: 1fr 1fr; gap: 22px; margin-top: 44px; }
  .col { border-radius: 22px; padding: 30px; background: rgba(255,255,255,.05); }
  .col.hl { background: rgba(255,255,255,.09); outline: 3px solid var(--accent); }
  .col h3 { font-size: 34px; font-weight: 800; margin-bottom: 20px; }
  .col.hl h3 { color: var(--accent); }
  .col li { list-style: none; font-size: 30px; line-height: 1.36; color: #E2DED5; padding: 12px 0;
            border-top: 1px solid rgba(255,255,255,.1); }

  /* destaque */
  .callout { margin-top: 40px; border-left: 10px solid var(--accent); background: rgba(255,255,255,.06);
             padding: 34px 36px; border-radius: 0 22px 22px 0; font-size: 34px; line-height: 1.42; }
  .quote { margin-top: auto; font-size: 30px; line-height: 1.42; font-style: italic; color: #C9D2CD; }
  .quote cite { display: block; margin-top: 14px; font-style: normal; font-size: 24px; color: #7E8C86; }

  /* glossário */
  dl.gloss { margin-top: 36px; display: flex; flex-direction: column; gap: 22px; }
  dl.gloss div { border-top: 1px solid rgba(255,255,255,.12); padding-top: 20px; }
  dt { font-size: 31px; font-weight: 800; color: var(--accent); }
  dd { font-size: 29px; line-height: 1.38; color: #E2DED5; margin-top: 6px; }

  /* quiz */
  .opts { margin-top: 40px; display: flex; flex-direction: column; gap: 18px; }
  .opt { display: flex; gap: 24px; align-items: center; background: rgba(255,255,255,.06);
         border-radius: 20px; padding: 24px 28px; font-size: 30px; line-height: 1.32; }
  .opt b { flex: 0 0 58px; height: 58px; border-radius: 50%; background: var(--accent); color: #0F1A17;
           display: flex; align-items: center; justify-content: center; font-size: 28px; }
  .hint { margin-top: auto; font-size: 28px; color: #A9B5AF; }

  /* fim */
  .t-end h1 { font-size: 80px; margin-top: 30px; }
  .t-end .answer { margin-top: 40px; background: rgba(255,255,255,.07); border-radius: 22px; padding: 28px 32px;
                 font-size: 30px; line-height: 1.4; }
  .t-end .answer b { color: var(--accent); }
  .t-end .cta { margin-top: 34px; font-size: 32px; line-height: 1.5; color: #E2DED5; }
  .t-end .src { margin-top: auto; font-size: 22px; line-height: 1.5; color: #8E9B95; }
  .t-end .src b { color: #C9D2CD; }
`;

const blocks = {
  cover: (s) => `
    <div class="emoji">${s.emoji}</div>
    <h1>${rich(s.title)}</h1>
    ${s.subtitle ? `<div class="sub">${rich(s.subtitle)}</div>` : ''}
    ${s.hook ? `<div class="hook">${rich(s.hook)}</div>` : ''}`,

  text: (s) => `
    ${s.label ? `<div class="label">${esc(s.label)}</div>` : ''}
    <h2>${rich(s.title)}</h2>
    ${(s.paragraphs || []).map((p) => `<p class="body">${rich(p)}</p>`).join('')}
    ${s.bullets ? `<ul class="bullets">${s.bullets.map((b) => `<li>${rich(b)}</li>`).join('')}</ul>` : ''}
    ${s.quote ? `<div class="quote">“${esc(s.quote.text)}”<cite>— ${esc(s.quote.by)}</cite></div>` : ''}`,

  steps: (s) => `
    ${s.label ? `<div class="label">${esc(s.label)}</div>` : ''}
    <h2>${rich(s.title)}</h2>
    <ol class="steps">${s.steps.map((st, i) => `
      <li><div class="n">${esc(st.n ?? i + 1)}</div>
        <div><div class="t">${rich(st.title)}</div>${st.text ? `<div class="d">${rich(st.text)}</div>` : ''}</div></li>`).join('')}
    </ol>`,

  stats: (s) => `
    ${s.label ? `<div class="label">${esc(s.label)}</div>` : ''}
    <h2>${rich(s.title)}</h2>
    <div class="stats ${s.stats.length === 1 ? 'one' : ''}">${s.stats.map((st) => `
      <div class="stat"><div class="v">${esc(st.value)}</div><div class="l">${rich(st.label)}</div></div>`).join('')}
    </div>
    ${s.note ? `<div class="note">${rich(s.note)}</div>` : ''}`,

  compare: (s) => `
    ${s.label ? `<div class="label">${esc(s.label)}</div>` : ''}
    <h2>${rich(s.title)}</h2>
    <div class="compare">${s.columns.map((c) => `
      <div class="col ${c.highlight ? 'hl' : ''}"><h3>${esc(c.title)}</h3>
        <ul>${c.items.map((it) => `<li>${rich(it)}</li>`).join('')}</ul></div>`).join('')}
    </div>
    ${s.note ? `<div class="note">${rich(s.note)}</div>` : ''}`,

  callout: (s) => `
    ${s.label ? `<div class="label">${esc(s.label)}</div>` : ''}
    <h2>${rich(s.title)}</h2>
    <div class="callout">${rich(s.text)}</div>
    ${s.bullets ? `<ul class="bullets">${s.bullets.map((b) => `<li>${rich(b)}</li>`).join('')}</ul>` : ''}
    ${s.quote ? `<div class="quote">“${esc(s.quote.text)}”<cite>— ${esc(s.quote.by)}</cite></div>` : ''}`,

  glossary: (s) => `
    <div class="label">${esc(s.label || 'Glossário')}</div>
    <h2>${rich(s.title || 'Palavras-chave para entender')}</h2>
    <dl class="gloss">${s.terms.map((t) => `<div><dt>${esc(t.term)}</dt><dd>${rich(t.def)}</dd></div>`).join('')}</dl>`,

  quiz: (s) => `
    <div class="label">${esc(s.label || 'Teste rápido')}</div>
    <h2>${rich(s.question)}</h2>
    <div class="opts">${s.options.map((o, i) => `
      <div class="opt"><b>${'ABCDE'[i]}</b><span>${rich(o)}</span></div>`).join('')}
    </div>
    <div class="hint">Responda nos comentários. O gabarito está no último slide →</div>`,

  end: (s, c) => `
    <div class="emoji" style="font-size:96px">${c.emoji}</div>
    <h1>${rich(s.title)}</h1>
    ${c.quizAnswer ? `<div class="answer"><b>Gabarito do teste: ${esc(c.quizAnswer.letter)}</b><br>${rich(c.quizAnswer.why)}</div>` : ''}
    <div class="cta">${[].concat(s.cta).map(rich).join('<br>')}</div>
    <div class="src"><b>Fontes</b><br>${c.sources.map(esc).join('<br>')}</div>`,
};

function buildPage(slide, i, c) {
  const total = c.slides.length;
  const last = i === total - 1;
  const block = blocks[slide.type];
  if (!block) throw new Error(`Tipo de slide desconhecido: ${slide.type}`);
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><style>${css}</style></head><body>
  <div class="slide t-${slide.type}" style="--accent:${c.accent};--glow:${c.accent}38">
    <div class="top"><span><span class="tag">${esc(c.area)}</span></span><span>${esc(c.date)}</span></div>
    <div class="content">${block(slide, c)}${slide.art ? `<div class="art">${slide.art}</div>` : ''}</div>
    <div class="foot"><span>${i + 1}/${total}</span>
      <div class="bar"><i style="width:${((i + 1) / total) * 100}%"></i></div>
      ${last ? '<span>Biologia · Notícias da ciência</span>' : '<span class="swipe">Arraste →</span>'}</div>
  </div></body></html>`;
}

async function renderPost(browser, dir) {
  const c = JSON.parse(fs.readFileSync(path.join(dir, 'content.json'), 'utf8'));
  const out = path.join(dir, 'slides');
  fs.rmSync(out, { recursive: true, force: true });
  fs.mkdirSync(out, { recursive: true });
  const tab = await browser.newPage({ viewport: { width: W, height: H } });
  for (let i = 0; i < c.slides.length; i++) {
    await tab.setContent(buildPage(c.slides[i], i, c), { waitUntil: 'load' });
    await tab.evaluate(() => document.fonts.ready);
    const overflow = await tab.evaluate(() => {
      // A ilustração (.art) fica no rodapé do bloco; o glifo do emoji não conta como transbordo.
      const el = document.querySelector('.content');
      const art = el.querySelector('.art');
      if (art) art.style.display = 'none';
      const diff = el.scrollHeight - el.clientHeight;
      if (art) art.style.display = '';
      return diff;
    });
    if (overflow > 0) console.warn(`AVISO: ${dir} slide ${i + 1} transborda ${overflow}px`);
    const file = path.join(out, `${String(i + 1).padStart(2, '0')}.png`);
    await tab.screenshot({ path: file });
  }
  await tab.close();
  console.log(`${dir}: ${c.slides.length} slides`);
}

async function main() {
  const dirs = process.argv.slice(2);
  if (!dirs.length) throw new Error('Informe a pasta do post, ex.: posts/2026-10-05-1-bovino-era-do-gelo');
  const browser = await chromium.launch();
  for (const dir of dirs) await renderPost(browser, dir);
  await browser.close();
}

main().catch((e) => { console.error(e); process.exit(1); });
