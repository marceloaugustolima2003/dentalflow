# Diário da Palette

## Aprendizados Críticos de UX/Acessibilidade

### Estrutura do App
- **Híbrido Estático/Dinâmico**: A aplicação utiliza `index.html` para a estrutura base e modais, mas renderiza listas e conteúdos interativos via `app.js` usando template literals.
- **Botões de Ícone**: O design visual favorece botões apenas com ícones (icon-only). Foi necessário adicionar `aria-label` sistematicamente tanto no HTML estático quanto nos templates JS para garantir acessibilidade.
- **SVGs Decorativos**: Os ícones SVG dentro dos botões não possuíam `aria-hidden="true"`, o que pode causar ruído em leitores de tela. Isso foi padronizado.

### Padrões de Código
- **Templates Literais**: A injeção de HTML via JS facilita a manutenção visual mas exige atenção redobrada para atributos de acessibilidade (ARIA) que não são óbvios visualmente.
