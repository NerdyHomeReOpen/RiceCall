# Naming conventions

Identifier, function and general file naming follow `RiceCallBlueprint/docs/code-style.md`. This document lists only the file naming rules specific to the desktop app.

Use lowercase `kebab-case` for source directories and ordinary files in `src/`, `scripts/`, and `build-deb/`, while preserving Next.js route filenames.

- React component files under `components/`, `page-components/`, `popups/`, and `providers/` use `PascalCase.tsx`. Existing `index.tsx` entry points keep their framework-neutral name.
- Hook files use `usePascalCase.ts` or `usePascalCase.tsx`. Other hook support files use `kebab-case`.
- Next.js route files such as `page.tsx` and `layout.tsx` keep their framework-required names. Dynamic route segments may use `[parameterName]`.
- Other TypeScript and JavaScript modules use `kebab-case`; exported classes and types may still use PascalCase identifiers.
- Public assets and Electron resource filenames are not renamed here because their paths can be external references.

Run `yarn check-names` after adding or moving source files.
