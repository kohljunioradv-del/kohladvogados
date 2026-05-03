# Preview Composition

Inicia o studio de preview para composições Remotion (`my-kohlvideos`) ou Hyperframes.

## Como usar

```
/preview-composition [remotion|hyperframes]
```

**Exemplos:**
- `/preview-composition remotion` — abre o Remotion Studio
- `/preview-composition hyperframes` — abre o Hyperframes Studio
- `/preview-composition` — pergunta qual abrir

## Remotion Studio

Abre o Remotion Studio em `http://localhost:3000` com hot-reload.
Composições ficam em `my-kohlvideos/src/`.

## Hyperframes Studio

Abre o Hyperframes Studio (editor visual de HTML-to-video) em `http://localhost:5173`.
Composições ficam em `hyperframes/`.

## Execução

Se o argumento for "remotion" ou vazio, rode:

!cd /home/user/kohladvogados/my-kohlvideos && npm run dev

Se o argumento for "hyperframes", rode:

!cd /home/user/kohladvogados/hyperframes && bun run dev
