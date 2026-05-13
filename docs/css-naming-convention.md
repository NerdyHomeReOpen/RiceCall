# CSS Module Naming Convention

## Format

- **kebab-case** for all class names.
- Processed by CSS Modules — access in TSX via bracket notation: `styles['class-name']`.

## No Component Prefix

CSS Modules already scopes classes to their file. Do not prefix with the component name.

```css
/* Bad — in FriendTab.module.css */
.friend-tab-name-text { }

/* Good */
.name-text { }
```

Exception: when two structural levels coexist in the same file (e.g. a list and its cards), a short qualifier prevents ambiguity:

```css
/* Good — ServerList.module.css has both list and card elements */
.list { }
.card { }
.card-avatar { }
.card-name-text { }
```

## Self-Descriptive Names

The class name alone must identify the element's purpose. Prefer concrete nouns over vague words like `box`, `wrapper`, `container` — use them only when no more specific term applies.

## Suffixes

| Suffix | Use for |
|--------|---------|
| `-button` | Any clickable interactive element (div, span, or button tag with cursor:pointer) |
| `-icon` | Decorative non-clickable image or SVG |
| `-text` | Text display element |
| `-input` | Form input |
| `-list` | List container |
| `-item` | List item |
| `-section` | Logical grouping within a layout |
| `-bar` | Horizontal toolbar or progress bar |
| `-tab` / `-tabs` | Tab navigation element / container |
| `-dropdown` | Dropdown container |
| `-overlay` | Overlay layer |

## State Classes

Use plain semantic names without a prefix:

```css
.selected { }
.active { }
.expanded { }
.disabled { }
.loading { }
.muted { }
.hidden { }
.visible { }
```

## Full Words, No Abbreviations

| Avoid | Use |
|-------|-----|
| `btn` | `button` |
| `navegate` | `navigate` |
| `saperator` | `separator` |
| `spliter` | `splitter` |
| `slogen` | `slogan` |
| `datail` | `detail` |
| `ct-` | full name |

## Reference

`src/page-components/Friend/Friend.module.css` is the canonical example of a well-named CSS module in this project.
