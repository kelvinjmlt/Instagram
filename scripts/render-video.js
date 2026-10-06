// Grava uma página HTML animada (animações CSS) como vídeo MP4 para o Instagram, quadro a quadro.
// Uso: node scripts/render-video.js <pagina.html> <saida.mp4> [duracao_s=9] [fps=30]
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');
const { chromium } = require('playwright');

async function main() {
  const [html, out, duration = '9', fps = '30'] = process.argv.slice(2);
  if (!html || !out) throw new Error('Uso: node scripts/render-video.js <pagina.html> <saida.mp4> [duracao_s] [fps]');
  const frames = Math.round(Number(duration) * Number(fps));
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'frames-'));

  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('file://' + path.resolve(html));
  await page.evaluate(() => document.fonts.ready);
  const size = await page.evaluate(() => ({ width: document.body.offsetWidth, height: document.body.offsetHeight }));
  await page.setViewportSize(size);

  // Congela todas as animações e avança o relógio manualmente: cada quadro sai exato, sem travadas.
  await page.evaluate(() => document.getAnimations().forEach((a) => a.pause()));
  for (let i = 0; i < frames; i++) {
    const t = (i * 1000) / Number(fps);
    await page.evaluate((ms) => document.getAnimations().forEach((a) => { a.currentTime = ms; }), t);
    await page.screenshot({ path: path.join(tmp, `${String(i).padStart(5, '0')}.png`) });
  }
  await browser.close();

  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', fps, '-i', path.join(tmp, '%05d.png'),
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '17', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', out]);
  fs.rmSync(tmp, { recursive: true, force: true });
  console.log(`${out}: ${frames} quadros, ${size.width}x${size.height}, ${fps} fps`);
}

main().catch((e) => { console.error(e); process.exit(1); });
