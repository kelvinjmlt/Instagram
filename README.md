# Instagram: posts de divulgação científica

Cada post fica em `posts/<data>-<tema>/`:

- `content.json`: texto dos slides
- `legenda.md`: legenda pronta para colar no Instagram (limite: 2.200 caracteres)
- `slides/*.png`: carrossel 1080×1350 gerado

Para gerar ou atualizar os slides depois de editar `content.json`:

```bash
npm install playwright   # se ainda não estiver instalado
node scripts/render.js posts/2026-10-05-descobertas-biologia
```
