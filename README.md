# Instagram: posts de divulgação científica

Cada notícia vira um carrossel próprio em `posts/<data>-<n>-<tema>/`:

- `content.json`: texto e estrutura dos slides
- `legenda.md`: legenda pronta para colar no Instagram (limite: 2.200 caracteres)
- `slides/*.png`: carrossel 1080×1350 gerado

## Estrutura padrão de um carrossel

Capa → contexto/conceito básico → método → resultados → por que importa → limites do estudo → glossário → teste rápido → fechamento com gabarito e fontes.

Tipos de slide aceitos em `content.json`: `cover`, `text`, `steps`, `stats`, `compare`, `callout`, `glossary`, `quiz` e `end`. Os textos aceitam `**negrito**` e `*itálico*`. O campo opcional `art` coloca um emoji ilustrativo no canto inferior.

## Gerar os slides

```bash
npm install playwright   # se ainda não estiver instalado
node scripts/render.js posts/2026-10-05-1-bovino-era-do-gelo   # uma ou várias pastas
python3 scripts/contact-sheet.py posts/<pasta> previa.png       # prévia em grade (opcional)
```

O script avisa se algum slide tiver texto transbordando.

## Arte animada (vídeo)

Para animar uma arte pronta (ex.: `posts/2026-chimpanzes-roubo-animado/`):

1. `python3 scripts/remove-text.py original.png fundo.png <y_do_texto> [x0,y0,x1,y1]` apaga o texto da foto (requer `opencv-python-headless`).
2. O texto é recriado em `animacao.html`, com animações CSS.
3. `node scripts/render-video.js animacao.html saida.mp4 9 30` grava o MP4 (H.264, 30 fps) quadro a quadro.
