# Agent rules

This is the RiceCall desktop app (Next.js renderer and Electron main process). The RiceCall Engineering Standard has no module specification for this repository; only its shared rules apply. Before writing code, read:

- `RiceCallEngineeringStandard/docs/code-style.md`: naming, imports, file order, functions, types, control flow, errors and comments.
- `RiceCallEngineeringStandard/docs/environment.md`: shared environment variable names and the `.env.example` format.
- `docs/naming-conventions.md`: React and hook file names specific to this repository.
- `docs/styling.md`: Tailwind CSS conventions; do not add CSS files or CSS Modules.

Rules:

- Follow the existing directory layout under `src/`; do not introduce the Node service or Vue web module layout here.
- Business rules belong to Main Service. The app sends requests and renders results; it does not re-implement permission or gift rules.
- Use `Logger` from `@/utils/logger`; do not call `console.*` directly.
- Read environment variables only through `src/utils/env.ts` and the `env` block of `next.config.ts`. Document new ones in `.env.example` and README.
- Do not add `any` in new code; use `unknown` and narrow it.
- Keep `package.json` scripts in the order defined in `RiceCallEngineeringStandard/docs/delivery.md`.
- Before a change that departs from the shared rules or changes one of them, stop and ask the user whether every product should change, as `RiceCallEngineeringStandard/AGENTS.md` rule 10 describes; whatever is not changed everywhere is recorded in `RiceCallEngineeringStandard/docs/migration.md`.
- Run `yarn verify` before finishing.
