# New Composition

Cria uma nova composição Remotion em `my-kohlvideos/src/` a partir de uma descrição em linguagem natural.

## Como usar

```
/new-composition <descrição>
```

**Exemplos:**
- `/new-composition intro animada com logo e texto de boas-vindas, 3 segundos, fundo azul`
- `/new-composition lower third com nome e cargo, entra da esquerda, 2 segundos`
- `/new-composition countdown de 5 segundos com círculo pulsante`

## O que faz

1. Cria `my-kohlvideos/src/<NomeComposicao>.tsx` com a composição descrita
2. Registra a composição em `my-kohlvideos/src/Root.tsx`
3. Usa as convenções do projeto: React 19, Remotion 4, TypeScript, Tailwind CSS 4
4. Aplica `useCurrentFrame`, `interpolate`, `spring` conforme necessário

## Convenções do projeto

- Arquivo: `PascalCase.tsx` em `my-kohlvideos/src/`
- Exportar o componente como default
- Registrar em `Root.tsx` com `<Composition id="..." .../>`
- Duração padrão: 150 frames (5s a 30fps) se não especificado
- Dimensões padrão: 1920×1080

## Após criar

Rode `/preview-composition remotion` para visualizar no Remotion Studio.
