# RiceCall Refactoring & Architectural Guidelines for AI

This document defines the strict standards for refactoring and feature implementation in the RiceCall project. Any AI agent working on this codebase must adhere to these principles to ensure stability and architectural consistency.

## 1. No "Logic Inventions" (Architecture Over Patches)

When a refactor causes a side effect (e.g., a component crashes due to missing data), **do not invent logic patches** (like regex checks, string pattern matching, or hardcoded field erasures) to mask the issue.

- **Wrong:** Writing `if (key === 'userId')` or `if (val.startsWith('['))`.
- **Right:** Investigate the environment isolation. If a component crashes, it usually means the simulated state does not align with the project's data flow (e.g., missing `initialData` or `preloadedState`). Fix the flow, not the symptoms.

## 2. Component-Level Isolation (Context-Awareness)

Web popups in RiceCall are **virtual layers (`div`)**, not independent windows or iframes. They share the same global Store and `window` object as the main application.

- **Mandate:** Any "environment-specific" behavior (like simulating hydration lag) must be implemented via **React Context** to ensure scoped isolation.
- **Constraint:** Never apply global delays or state modifications that could affect background components (like the main page's `Friend.tsx`) unless explicitly requested.

## 3. Respect Data Structural Integrity

The application relies heavily on JSON strings (e.g., `user.badges`). Returning a raw `initialState` or `undefined` from a hook without understanding the component's dependencies will cause `JSON.parse` crashes.

- **Principle:** Always ensure that any "fallback" or "mock" state returned during transitions is **structurally valid**.
- **Smart Strategy:** Mirror how the project handles this in Electron—by using `preloadedState` or `PopupLoader` to populate the structure before the view renders.

## 4. Universal Logic (No Hardcoding)

Avoid hardcoding specific field names (e.g., `userId`, `name`, `signature`) in general-purpose utilities or hooks.

- **Principle:** Use type-agnostic or structure-based logic. If you need to distinguish between identity and structure, use the project's existing Redux `initialState` or `rootReducer` as the source of truth for "default values."

## 5. Replicate Project Patterns ("Copy the Smart")

RiceCall often has "smarter" logic already implemented in one environment (e.g., Electron main process loaders) that is missing in another (Web virtual layer).

- **Workflow:** Before implementing a simulation or a fix, search for how the "opposite" environment handles the same data flow.
- **Evidence-Based:** Always provide references (file paths and line numbers) for the patterns you are replicating to ensure you are not "hallucinating" a new architecture.

## 6. The 500ms Hydration Rule

For cross-platform consistency, Web popups should simulate the **500ms Electron IPC sync lag**. This simulation must:

1.  Trigger only within a `PopupHydrationContext`.
2.  Initially return data acting as a "fresh process" (e.g., `initialState`).
3.  Transition to `realData` after the delay to trigger reactive `useEffect` runs.

---

_Follow these rules to maintain the "RiceCall Soul"—where architecture dictates behavior, and logic serves the structure._
