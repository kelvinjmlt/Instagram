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
