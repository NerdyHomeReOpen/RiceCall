# Styling

The app is styled with Tailwind CSS v4. `src/globals.css` is the only stylesheet; components do not add CSS files or CSS Modules.

## Where styles go

- Component styles are Tailwind utilities in `className`. Conditional classes use template strings; there is no class-merging helper.
- Shared classes used by many components (`row`, `col`, `popup-*`, `button`, `input-box`, `select-box`, `markdown-*`, `permission-*`, `vip-*`, …) live in `@layer components` of `src/globals.css`, written with `@apply` where a utility exists. Element defaults live in `@layer base`.
- Keyframe animations are theme variables in the `@theme` block (`--animate-visibility`, `--animate-fade-in`, `--animate-mixing`), used as `animate-*`.
- Only rules that must beat an unlayered third-party stylesheet (the highlight.js overrides) stay outside the layers.

## Values

- Theme colours come from the CSS variables that themes set at runtime. Use their tokens: `bg-background`, `text-text-color`, `border-border`, `bg-hover`, `bg-selected`, `text-text-link`, `shadow-box-shadow`, `font-app`, `bg-(image:--header-image)`. Do not hard-code a theme colour.
- The root font size is 13px and `--spacing` is 4px, so `p-2` is 8px. Font sizes are written in px (`text-[13px]`); Tailwind's `text-sm` and friends are rem-based.
- Sprites use `bg-[url('/…')]` with `bg-position-[x_y]`, and `hover:`/`active:`/`checked:` variants move the position.
- CSS keyword easings are `ease-[ease]`, `ease-[ease-in-out]`; Tailwind's `ease-in-out` is a different curve. `grid-cols-[repeat(n,1fr)]` keeps `1fr`, since `grid-cols-n` is `minmax(0,1fr)`.
- The shared `row`, `col`, `disabled` and a few markdown classes use `!important`. A utility overrides them only with the important suffix (`flex-row!`).
- `antialiased` and `table` are plain class names in the markup, so Tailwind does not generate them (`@source not inline` in `globals.css`).

`yarn lint` runs stylelint on `src/globals.css`.
