# Roadmap de Arquitetura e Manutenção (Fase 2)

Este documento descreve a estrutura proposta para a refatoração do sistema "DentalFlow" para um modelo modular (ES6 Modules), visando escalabilidade e facilidade de manutenção.

## Estrutura de Pastas Proposta

```
src/
├── config/
│   └── firebase.js       # Inicialização do Firebase e exportação de serviços (db, auth, storage)
├── services/
│   ├── auth.js           # Lógica de Autenticação (Login, Logout, Reset)
│   ├── firestore.js      # Operações de CRUD genéricas ou específicas por coleção
│   └── storage.js        # Lógica de Upload (incluindo a compressão já implementada)
├── utils/
│   ├── helpers.js        # Formatadores (Moeda, Data, Strings)
│   ├── imageCompressor.js # (JÁ CRIADO) Lógica de compressão de imagens
│   └── pdfGenerator.js   # Lógica isolada de geração de relatórios PDF
├── components/
│   ├── charts.js         # Configuração e renderização dos gráficos (Chart.js)
│   ├── ui.js             # Manipulação genérica de UI (Modais, Toasts, Loading)
│   └── notifications.js  # Sistema de notificações
├── views/
│   ├── dashboard.js      # Lógica da tela de Dashboard
│   ├── production.js     # Lógica da tela de Produção
│   ├── expenses.js       # Lógica da tela de Despesas
│   └── ...               # Outras views (Dentistas, Admin, etc.)
└── app.js                # (Ponto de Entrada) Orquestrador principal e Roteador
```

## Próximos Passos (Refatoração)

1.  **Configuração Centralizada:** Mover a inicialização do Firebase de `app.js` para `src/config/firebase.js`.
2.  **Extração de Utilitários:** Mover funções como `formatarMoeda`, `abbreviateName` e lógica de datas para `src/utils/helpers.js`.
3.  **Separação por View:** Isolar a lógica gigante de cada view (ex: `renderizarDashboard`, `renderizarProducaoDia`) em seus respectivos arquivos na pasta `views/`.
4.  **Gerenciamento de Estado:** Considerar um padrão simples de gerenciamento de estado (Store) se a complexidade aumentar, para evitar passar `state` gigante para todo lado.
