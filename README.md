# AstroTaro

# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

## Мови інтерфейсу

Англійська, українська, іспанська. Вибір: вкладка **Language** на екрані Settings, список Language у профілі, перемикач EN / УК / ES на лендінгу, вході й реєстрації.
Мова зберігається в налаштуваннях акаунта (сервер) і застосовується до інтерфейсу, відповідей AI, карт і тлумачень.

- Словники: `src/i18n/uk.js`, `src/i18n/es.js` (ключ — англійський текст). Повнота: `npm run i18n:check`.
- Нова фраза в коді: `t('English text')` з `src/i18n/index.js`, потім переклад у обидва словники.
- Наскрізна перевірка: `node scripts/app/lang-flow.mjs`; знімки екранів: `LANG_ID=uk node scripts/app/shot.mjs all`.
