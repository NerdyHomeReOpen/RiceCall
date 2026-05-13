# CSS Module Naming Standardization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Standardize all 58 `.module.css` files to follow a consistent kebab-case naming convention based on `Friend.module.css` as the reference.

**Architecture:** For each CSS module file, rename classes according to the rules below, then update every TSX file in the same directory (and sub-files if any) that references `styles['old-name']`. TSX files use bracket notation exclusively — search for `styles['class-name']` patterns.

**Tech Stack:** CSS Modules, React/Next.js TSX, kebab-case class names, bracket-notation style access.

---

## Naming Rules Reference

These rules govern every rename decision in this plan:

1. **kebab-case only** — e.g. `user-avatar`, not `userAvatar` or `user_avatar`
2. **No component-name prefix** — CSS Modules scoping makes it redundant. `.friend-tab-name-text` in `FriendTab.module.css` → `.name-text`. Exception: keep a prefix when it adds genuine disambiguation (e.g. `.card-avatar` vs `.avatar` when both exist in the same file).
3. **Self-descriptive names** — the name alone identifies the element's purpose without reading the code.
4. **Full words, no abbreviations** — `btn` → `button`, `navegate` → `navigate`, `saperator` → `separator`, `spliter` → `splitter`, `slogen` → `slogan`.
5. **`-button` suffix** — any clickable interactive element, regardless of visual appearance.
6. **`-icon` suffix** — decorative, non-clickable image/SVG.
7. **State classes remain semantic** — `.selected`, `.active`, `.loading`, `.muted`, `.expanded`, `.disabled` stay as-is.
8. **Fix all typos** (see rule 4 examples).

---

## How to execute each task

For each CSS file in a task:

1. Open the CSS file. Rename classes per the mapping table.
2. Find all TSX files in the same directory:
   ```bash
   find src/path/to/component -name "*.tsx"
   ```
3. For each rename `old-name → new-name`, replace all occurrences in every TSX file:
   ```bash
   # Example: renaming friend-tab-box → detail-box in FriendTab
   sed -i '' "s/styles\['friend-tab-box'\]/styles['detail-box']/g" src/components/FriendTab/index.tsx
   ```
4. Verify no old class name remains:
   ```bash
   grep -rn "styles\['old-name'\]" src/path/to/component/
   # Should return 0 matches
   ```
5. Verify the new class name is in the CSS file:
   ```bash
   grep "new-name" src/path/to/component/Component.module.css
   ```

---

## Task 1: Create CSS Naming Convention Document

**Files:**
- Create: `docs/css-naming-convention.md`

- [ ] **Step 1: Write the convention document**

Create `docs/css-naming-convention.md` with this exact content:

```markdown
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
```

- [ ] **Step 2: Commit**

```bash
git add docs/css-naming-convention.md
git commit -m "docs: add CSS module naming convention"
```

---

## Task 2: components/ group A — ActionLink through FriendTab

**Files:**
- Modify: `src/components/ActionLink/ActionLink.module.css`
- Modify: `src/components/ActionLink/index.tsx` (and any sibling TSX)
- Modify: `src/components/BadgeInfoCard/BadgeInfoCard.module.css` + sibling TSX
- Modify: `src/components/BadgeList/BadgeList.module.css` + sibling TSX
- Modify: `src/components/CategoryTab/CategoryTab.module.css` + sibling TSX
- Modify: `src/components/ChannelTab/ChannelTab.module.css` + sibling TSX
- Modify: `src/components/EmojiPicker/EmojiPicker.module.css` + sibling TSX
- Modify: `src/components/FriendActivity/FriendActivity.module.css` + sibling TSX
- Modify: `src/components/FriendGroupTab/FriendGroupTab.module.css` + sibling TSX
- Modify: `src/components/FriendTab/FriendTab.module.css` + sibling TSX

- [ ] **Step 1: Rename classes in ActionLink.module.css**

Rename mapping:
| Old | New |
|-----|-----|
| `invitation-contents` | `invitation-content` |
| `invitation-headers` | `invitation-header` |

All other classes unchanged: `.action-link`, `.icon`, `.invitation-container`, `.server-name`, `.title`.

- [ ] **Step 2: Update ActionLink TSX references**

```bash
find src/components/ActionLink -name "*.tsx" | xargs grep -l "styles\[" 
# Run sed for each changed class found above
sed -i '' "s/styles\['invitation-contents'\]/styles['invitation-content']/g" src/components/ActionLink/index.tsx
sed -i '' "s/styles\['invitation-headers'\]/styles['invitation-header']/g" src/components/ActionLink/index.tsx
```

- [ ] **Step 3: Rename classes in BadgeInfoCard.module.css**

Rename mapping:
| Old | New |
|-----|-----|
| `badge-info-card` | `card` |
| `badge-info-wrapper` | `info-wrapper` |
| `badge-avatar-box` | `avatar-wrapper` |
| `badge-image` | `image` |
| `badge-name` | `name-text` |
| `badge-rarity-text` | `rarity-text` |
| `badge-description` | `description` |
| `badge-description-box` | `description-section` |
| `badge-show-time` | `show-time` |

- [ ] **Step 4: Update BadgeInfoCard TSX references**

```bash
find src/components/BadgeInfoCard -name "*.tsx" | xargs grep -l "styles\["
# Apply sed for each renamed class
```

- [ ] **Step 5: Rename classes in BadgeList.module.css**

Rename mapping:
| Old | New |
|-----|-----|
| `badge-list-wrapper` | `wrapper` |

- [ ] **Step 6: Update BadgeList TSX references**

```bash
sed -i '' "s/styles\['badge-list-wrapper'\]/styles['wrapper']/g" src/components/BadgeList/index.tsx
```

- [ ] **Step 7: Rename classes in CategoryTab.module.css**

Rename mapping:
| Old | New |
|-----|-----|
| `channel-tab` | `category` |
| `channel-tab-channel-list` | `channel-list` |
| `channel-tab-icon` | `category-icon` |
| `channel-tab-label` | `label` |
| `channel-tab-user-count-text` | `user-count-text` |
| `channel-tab-user-list` | `user-list` |

Unchanged: `.expanded`, `.is-reception-lobby`, `.lobby`, `.member`, `.my-location-icon`, `.private`, `.readonly`, `.selected`, `.svg`.

- [ ] **Step 8: Update CategoryTab TSX references**

```bash
find src/components/CategoryTab -name "*.tsx" | xargs grep -l "styles\["
# Apply sed for each renamed class
```

- [ ] **Step 9: Rename classes in ChannelTab.module.css**

Rename mapping:
| Old | New |
|-----|-----|
| `channel-tab` | `channel` |
| `channel-tab-icon` | `channel-icon` |
| `channel-tab-label` | `label` |
| `channel-tab-user-count-text` | `user-count-text` |
| `channel-tab-user-list` | `user-list` |

Unchanged: `.expanded`, `.is-reception-lobby`, `.lobby`, `.member`, `.my-location-icon`, `.private`, `.readonly`, `.selected`, `.svg`.

- [ ] **Step 10: Update ChannelTab TSX references**

```bash
find src/components/ChannelTab -name "*.tsx" | xargs grep -l "styles\["
```

- [ ] **Step 11: Rename classes in EmojiPicker.module.css**

Rename mapping:
| Old | New |
|-----|-----|
| `emoji-tab-btn` | `tab-button` |
| `emoji-tab-label` | `tab-label` |
| `emoji-tabs` | `tabs` |
| `emoji-fontbar` | `font-bar` |
| `emoji-font-select` | `font-select` |
| `emoji-font-icon` | `font-icon` |
| `emoji-grid` | `grid` |
| `emoji-native` | `native-emoji` |
| `emoji-page` | `page` |
| `emoji-pages` | `pages` |
| `emoji-panel` | `panel` |
| `emoji-panel-compact` | `panel-compact` |
| `emoji-vip-placeholder` | `vip-placeholder` |

Unchanged: `.active`, `.color-option`, `.color-panel`, `.color-select-box`, `.color-swatch`, `.emoji`, `.font-select-box`, `.img`, `.svg`, `.tab-def`, `.tab-other`, `.tab-vip`, `.user-info-emoji`.

- [ ] **Step 12: Update EmojiPicker TSX references**

```bash
find src/components/EmojiPicker -name "*.tsx" | xargs grep -l "styles\["
```

- [ ] **Step 13: Rename classes in FriendActivity.module.css**

Rename mapping:
| Old | New |
|-----|-----|
| `friend-activity` | `activity-item` |
| `friend-activity-avatar` | `avatar` |
| `friend-activity-content` | `content` |
| `friend-activity-content-top` | `content-top` |
| `friend-activity-content-bottom` | `content-bottom` |
| `friend-activity-timestamp-text` | `timestamp-text` |
| `friend-name-text` | `name-text` |
| `user-activity-wrapper` | `wrapper` |

Unchanged: `.vip`, `.vip-icon`.

- [ ] **Step 14: Update FriendActivity TSX references**

```bash
find src/components/FriendActivity -name "*.tsx" | xargs grep -l "styles\["
```

- [ ] **Step 15: Rename classes in FriendGroupTab.module.css**

Rename mapping:
| Old | New |
|-----|-----|
| `friend-group-tab` | `group` |
| `friend-group-tab-content` | `content` |
| `friend-group-tab-toggle-icon` | `toggle-icon` |

Note: verify in TSX whether `toggle-icon` is clickable. If it has `cursor: pointer` or an `onClick`, rename to `toggle-button` instead.

Unchanged: `.expanded`, `.selected`, `.svg`.

- [ ] **Step 16: Update FriendGroupTab TSX references**

```bash
find src/components/FriendGroupTab -name "*.tsx" | xargs grep -l "styles\["
```

- [ ] **Step 17: Rename classes in FriendTab.module.css**

Rename mapping:
| Old | New |
|-----|-----|
| `friend-tab` | `item` |
| `friend-tab-avatar-picture` | `avatar` |
| `friend-tab-base-info` | `base-info` |
| `friend-tab-box` | `detail-row` |
| `friend-tab-location-icon` | `location-icon` |
| `friend-tab-name-text` | `name-text` |
| `friend-tab-server-name-text` | `server-name-text` |
| `friend-tab-signature-text` | `signature-text` |

Unchanged: `.has-server`, `.selected`, `.svg`, `.vip`.

- [ ] **Step 18: Update FriendTab TSX references**

```bash
find src/components/FriendTab -name "*.tsx" | xargs grep -l "styles\["
# Apply sed for all 8 renames
```

- [ ] **Step 19: Commit**

```bash
git add src/components/ActionLink/ src/components/BadgeInfoCard/ src/components/BadgeList/ src/components/CategoryTab/ src/components/ChannelTab/ src/components/EmojiPicker/ src/components/FriendActivity/ src/components/FriendGroupTab/ src/components/FriendTab/
git commit -m "refactor(css): standardize naming in components A–FriendTab"
```

---

## Task 3: components/ group B — Header through UserTab

**Files:**
- Modify: `src/components/Header/Header.module.css` + sibling TSX
- Modify: `src/components/LoadingOverlay/LoadingOverlay.module.css` + sibling TSX
- Modify: `src/components/MaximizedPopup/MaximizedPopup.module.css` + sibling TSX
- Modify: `src/components/MessageInputBox/MessageInputBox.module.css` + sibling TSX
- Modify: `src/components/MicVolumeSlider/MicVolumeSlider.module.css` + sibling TSX
- Modify: `src/components/NotificationMenu/NotificationMenu.module.css` + sibling TSX
- Modify: `src/components/NotificationToaster/NotificationToaster.module.css` + sibling TSX
- Modify: `src/components/QueueUserTab/QueueUserTab.module.css` + sibling TSX
- Modify: `src/components/ServerList/ServerList.module.css` + sibling TSX
- Modify: `src/components/ServerSearchBar/ServerSearchBar.module.css` + sibling TSX
- Modify: `src/components/SpeakerVolumeSlider/SpeakerVolumeSlider.module.css` + sibling TSX
- Modify: `src/components/UserInfoCard/UserInfoCard.module.css` + sibling TSX
- Modify: `src/components/UserTab/UserTab.module.css` + sibling TSX

- [ ] **Step 1: Rename classes in Header.module.css**

Rename mapping:
| Old | New |
|-----|-----|
| `spliter` | `splitter` |
| `main-tabs` | `tabs` |
| `main-tab` | `tab` |
| `main-tab-background` | `tab-background` |
| `main-tab-close-button` | `tab-close-button` |
| `main-tab-label` | `tab-label` |

Unchanged: `.buttons`, `.close-button`, `.game-button`, `.gift-button`, `.header`, `.maxsize-button`, `.menu-button`, `.menu-dropdown`, `.minimize-button`, `.name-box`, `.new`, `.notice-button`, `.notice-overlay`, `.restore-button`, `.selected`, `.status-box`, `.status-display`, `.status-dropdown`, `.status-triangle`, `.svg`, `.title-box`.

- [ ] **Step 2: Update Header TSX references**

```bash
find src/components/Header -name "*.tsx" | xargs grep -l "styles\["
```

- [ ] **Step 3: Rename classes in LoadingOverlay.module.css**

Rename mapping:
| Old | New |
|-----|-----|
| `loading-overlay-close-button` | `close-button` |
| `loading-overlay-gif` | `loading-animation` |
| `loading-overlay-server-id` | `server-id-text` |
| `loading-overlay-title-text` | `title-text` |
| `loading-overlay-wrapper` | `wrapper` |

Unchanged: `.gif`, `.loading-overlay`, `.svg`.

- [ ] **Step 4: Update LoadingOverlay TSX references**

```bash
find src/components/LoadingOverlay -name "*.tsx" | xargs grep -l "styles\["
```

- [ ] **Step 5: Rename classes in MaximizedPopup.module.css**

Rename mapping:
| Old | New |
|-----|-----|
| `maximized-popup` | `popup` |
| `maximized-popup-close-btn` | `close-button` |
| `maximized-popup-title-text` | `title-text` |

Unchanged: `.svg`.

- [ ] **Step 6: Update MaximizedPopup TSX references**

```bash
find src/components/MaximizedPopup -name "*.tsx" | xargs grep -l "styles\["
```

- [ ] **Step 7: Rename classes in MessageInputBox.module.css**

Rename mapping:
| Old | New |
|-----|-----|
| `emoji-btn` | `emoji-button` |

Unchanged: `.disabled`, `.input-area`, `.input-length-text`, `.message-input-box`, `.svg`, `.warning`.

- [ ] **Step 8: Update MessageInputBox TSX references**

```bash
find src/components/MessageInputBox -name "*.tsx" | xargs grep -l "styles\["
sed -i '' "s/styles\['emoji-btn'\]/styles['emoji-button']/g" src/components/MessageInputBox/index.tsx
```

- [ ] **Step 9: Rename classes in MicVolumeSlider.module.css**

Rename mapping:
| Old | New |
|-----|-----|
| `mic-volume-container` | `container` |
| `mic-volume-slider` | `slider-track` |
| `mic-volume-slider-container` | `slider-container` |
| `mic-volume-button` | `volume-button` |
| `mic-mode-dropdown-button` | `mode-dropdown-button` |
| `mic-mode-menu` | `mode-menu` |
| `voice-threshold-input-wrapper` | `threshold-input-wrapper` |

Unchanged: `.active`, `.muted`, `.slider`, `.svg`, `.voice-state-icon`, `.voice-threshold-input`.

- [ ] **Step 10: Update MicVolumeSlider TSX references**

```bash
find src/components/MicVolumeSlider -name "*.tsx" | xargs grep -l "styles\["
```

- [ ] **Step 11: Rename classes in NotificationMenu.module.css**

Rename mapping:
| Old | New |
|-----|-----|
| `notification-menu` | `menu` |
| `notification-menu-contents` | `contents` |
| `notification-menu-image` | `image` |
| `notification-menu-option` | `option` |

Unchanged: `.readonly`, `.svg`.

- [ ] **Step 12: Update NotificationMenu TSX references**

```bash
find src/components/NotificationMenu -name "*.tsx" | xargs grep -l "styles\["
```

- [ ] **Step 13: Rename classes in NotificationToaster.module.css**

Rename mapping:
| Old | New |
|-----|-----|
| `notification-toaster` | `toaster` |
| `notification-toaster-close` | `close-button` |

Verify in TSX that `notification-toaster-close` has an `onClick` handler (if not, use `close-icon`).

Unchanged: `.show`, `.svg`.

- [ ] **Step 14: Update NotificationToaster TSX references**

```bash
find src/components/NotificationToaster -name "*.tsx" | xargs grep -l "styles\["
```

- [ ] **Step 15: Rename classes in QueueUserTab.module.css**

Rename mapping:
| Old | New |
|-----|-----|
| `queue-user-tab` | `item` |
| `queue-user-tab-name-text` | `name-text` |
| `queue-user-audio-state` | `audio-state` |
| `queue-user-position-text` | `position-text` |
| `queue-user-seconds-remaining-box` | `time-remaining` |
| `queue-user-text-state` | `text-state` |

Unchanged: `.gif`, `.loading`, `.member`, `.muted`, `.play`, `.selected`, `.svg`, `.vip`.

- [ ] **Step 16: Update QueueUserTab TSX references**

```bash
find src/components/QueueUserTab -name "*.tsx" | xargs grep -l "styles\["
```

- [ ] **Step 17: Rename classes in ServerList.module.css**

Rename mapping:
| Old | New |
|-----|-----|
| `server-list` | `list` |
| `server-list-container` | `container` |
| `server-list-title` | `list-title` |
| `server-card` | `card` |
| `server-card-avatar-picture` | `card-avatar` |
| `server-card-id-text` | `card-id-text` |
| `server-card-info-text` | `card-info-text` |
| `server-card-name-text` | `card-name-text` |
| `server-card-online-text` | `card-online-count-text` |
| `server-card-slogen-text` | `card-slogan-text` |

Unchanged: `.is-owner`, `.svg`, `.view-less-button`, `.view-more-button`.

Note: `slogen` → `slogan` is a typo fix, not just a rename.

- [ ] **Step 18: Update ServerList TSX references**

```bash
find src/components/ServerList -name "*.tsx" | xargs grep -l "styles\["
```

- [ ] **Step 19: Rename classes in ServerSearchBar.module.css**

Rename mapping:
| Old | New |
|-----|-----|
| `server-search-bar` | `search-bar` |
| `server-search-dropdown` | `dropdown` |
| `server-search-dropdown-header-text` | `dropdown-header-text` |
| `server-search-dropdown-item` | `dropdown-item` |
| `server-search-dropdown-item-avatar-picture` | `dropdown-item-avatar` |
| `server-search-dropdown-item-id-box` | `dropdown-item-id` |
| `server-search-dropdown-item-info-text` | `dropdown-item-info-text` |
| `server-search-dropdown-item-name-text` | `dropdown-item-name-text` |
| `server-search-dropdown-spliter` | `dropdown-separator` |
| `server-search-input` | `search-input` |
| `server-search-input-clear-button` | `search-clear-button` |
| `server-search-input-icon` | `search-icon` |

Unchanged: `.exact-match`, `.input-empty-item`, `.svg`.

- [ ] **Step 20: Update ServerSearchBar TSX references**

```bash
find src/components/ServerSearchBar -name "*.tsx" | xargs grep -l "styles\["
```

- [ ] **Step 21: Rename classes in SpeakerVolumeSlider.module.css**

Rename mapping:
| Old | New |
|-----|-----|
| `mic-volume-container` | `mic-container` |
| `mic-volume-slider` | `mic-slider` |
| `speaker-volume-container` | `speaker-container` |
| `speaker-volume-slider` | `speaker-slider` |
| `speaker-volume-slider-container` | `speaker-slider-container` |

Unchanged: `.mic-button`, `.muted`, `.slider`, `.speaker-button`, `.svg`.

- [ ] **Step 22: Update SpeakerVolumeSlider TSX references**

```bash
find src/components/SpeakerVolumeSlider -name "*.tsx" | xargs grep -l "styles\["
```

- [ ] **Step 23: Rename classes in UserInfoCard.module.css**

Rename mapping:
| Old | New |
|-----|-----|
| `saperator` | `separator` |

Unchanged: all other classes (`.body`, `.bottom`, `.contribution-value`, `.contribution-wrapper`, `.footer`, `.info-row`, `.level-text`, `.name-text`, `.nickname-row`, `.nickname-text`, `.permission-text`, `.permission-wrapper`, `.svg`, `.top`, `.user-info-card`, `.user-info-wrapper`, `.vip`, `.vip-0` through `.vip-5`, `.vip-boost-text`, `.xp-progress`, `.xp-progress-container`, `.xp-wrapper`).

- [ ] **Step 24: Update UserInfoCard TSX references**

```bash
find src/components/UserInfoCard -name "*.tsx" | xargs grep -l "styles\["
sed -i '' "s/styles\['saperator'\]/styles['separator']/g" src/components/UserInfoCard/index.tsx
```

- [ ] **Step 25: Rename classes in UserTab.module.css**

Rename mapping:
| Old | New |
|-----|-----|
| `user-tab` | `item` |
| `user-tab-name-text` | `name-text` |
| `user-audio-state` | `audio-state` |
| `user-queue-position` | `queue-position` |
| `user-text-state` | `text-state` |

Unchanged: `.gif`, `.loading`, `.member`, `.muted`, `.my-location-icon`, `.play`, `.selected`, `.svg`, `.vip`.

- [ ] **Step 26: Update UserTab TSX references**

```bash
find src/components/UserTab -name "*.tsx" | xargs grep -l "styles\["
```

- [ ] **Step 27: Commit**

```bash
git add src/components/Header/ src/components/LoadingOverlay/ src/components/MaximizedPopup/ src/components/MessageInputBox/ src/components/MicVolumeSlider/ src/components/NotificationMenu/ src/components/NotificationToaster/ src/components/QueueUserTab/ src/components/ServerList/ src/components/ServerSearchBar/ src/components/SpeakerVolumeSlider/ src/components/UserInfoCard/ src/components/UserTab/
git commit -m "refactor(css): standardize naming in components Header–UserTab"
```

---

## Task 4: page-components/

**Files:**
- Modify: `src/page-components/ChangeServer/ChangeServer.module.css` + sibling TSX
- Modify: `src/page-components/Friend/Friend.module.css` + all sibling TSX (index.tsx, FriendPageHeader.tsx, FriendPageSidebar.tsx, FriendPageContent.tsx)
- Modify: `src/page-components/Home/Home.module.css` + all sibling TSX (index.tsx, HomePageHeader.tsx, HomePageContent.tsx, HomePagePersonalExclusive.tsx)
- Modify: `src/page-components/Login/Login.module.css` + sibling TSX
- Modify: `src/page-components/Register/Register.module.css` + sibling TSX
- Modify: `src/page-components/Server/Server.module.css` + all sibling TSX (index.tsx, MicButton.tsx, ServerPageContent.tsx, ServerPageSidebar.tsx)

- [ ] **Step 1: Rename classes in ChangeServer.module.css**

Rename mapping:
| Old | New |
|-----|-----|
| `change-server-page` | `page` |
| `change-server-page-body` | `body` |
| `change-server-page-footer` | `footer` |
| `change-server-form-wrapper` | `form-wrapper` |

Unchanged: `.app-logo`, `.back-to-login-button`, `.server-option`, `.svg`.

- [ ] **Step 2: Update ChangeServer TSX references**

```bash
find src/page-components/ChangeServer -name "*.tsx" | xargs grep -l "styles\["
```

- [ ] **Step 3: Rename classes in Friend.module.css**

Rename mapping:
| Old | New |
|-----|-----|
| `emoji-btn` | `emoji-button` |
| `prev-icon` | `prev-button` |
| `next-icon` | `next-button` |

All other classes are already compliant. Verify `search-icon` in the TSX — if it has `onClick`, rename to `search-button`.

- [ ] **Step 4: Update all Friend page TSX references**

```bash
find src/page-components/Friend -name "*.tsx" | xargs grep -l "styles\["
# Apply sed for emoji-btn, prev-icon, next-icon across all 4 TSX files
```

- [ ] **Step 5: Rename classes in Home.module.css**

Rename mapping:
| Old | New |
|-----|-----|
| `home-page` | `page` |
| `home-page-body` | `body` |
| `home-page-content` | `content` |
| `home-page-header` | `header` |
| `home-page-header-left` | `header-left` |
| `home-page-header-mid` | `header-mid` |
| `home-page-header-right` | `header-right` |
| `home-wrapper` | `wrapper` |
| `navegate-button` | `navigate-button` |
| `next-btn` | `next-button` |
| `prev-btn` | `prev-button` |
| `announcement-datail-date` | `announcement-detail-date` |

Unchanged: `.active`, `.announcement-date`, `.announcement-detail-container`, `.announcement-detail-content`, `.announcement-detail-header`, `.announcement-detail-title`, `.announcement-detail-wrapper`, `.announcement-header`, `.announcement-item`, `.announcement-list`, `.announcement-tab`, `.announcement-title`, `.announcement-type`, `.announcement-wrapper`, `.back-button`, `.banner`, `.banner-container`, `.banner-detail`, `.banner-list`, `.banner-wrapper`, `.forward-button`, `.logo`, `.nav`, `.number-list`, `.recommend-server-tab`, `.recommend-server-tabs`, `.recommended-servers-wrapper`, `.server-list`, `.svg`.

- [ ] **Step 6: Update all Home page TSX references**

```bash
find src/page-components/Home -name "*.tsx" | xargs grep -l "styles\["
```

- [ ] **Step 7: Rename classes in Login.module.css**

Rename mapping:
| Old | New |
|-----|-----|
| `login-page` | `page` |
| `login-page-body` | `body` |
| `login-page-footer` | `footer` |
| `login-form-wrapper` | `form-wrapper` |

Unchanged: `.account-delete-button`, `.account-dropdown-arrow`, `.account-option`, `.account-options`, `.app-logo`, `.change-server-button`, `.check`, `.check-box`, `.check-box-wrapper`, `.create-account-button`, `.forget-password-button`, `.gif`, `.input`, `.input-box`, `.input-wrapper`, `.label`, `.loading-bar`, `.loading-text`, `.selected`, `.submit-button`, `.svg`.

- [ ] **Step 8: Update Login TSX references**

```bash
find src/page-components/Login -name "*.tsx" | xargs grep -l "styles\["
```

- [ ] **Step 9: Rename classes in Register.module.css**

Rename mapping:
| Old | New |
|-----|-----|
| `register-page` | `page` |
| `register-page-body` | `body` |
| `register-page-footer` | `footer` |
| `register-form-wrapper` | `form-wrapper` |

Unchanged: `.back-to-login-button`, `.gif`, `.hint-text`, `.input`, `.input-box`, `.input-wrapper`, `.label`, `.loading-bar`, `.loading-text`, `.submit-button`, `.warn-text`.

- [ ] **Step 10: Update Register TSX references**

```bash
find src/page-components/Register -name "*.tsx" | xargs grep -l "styles\["
```

- [ ] **Step 11: Rename classes in Server.module.css**

Rename mapping (large file — apply all):
| Old | New |
|-----|-----|
| `server-page` | `page` |
| `server-page-body` | `body` |
| `server-page-content` | `content` |
| `server-page-content-layout` | `content-layout` |
| `server-page-sidebar` | `sidebar` |
| `server-page-sidebar-footer` | `sidebar-footer` |
| `server-page-sidebar-header` | `sidebar-header` |
| `server-page-sidebar-navegate-tab` | `sidebar-navigate-tab` |
| `server-base-info-box` | `server-info-box` |
| `server-base-info-wrapper` | `server-info-wrapper` |
| `server-avatar-picture` | `server-avatar` |
| `channel-list-saperator` | `channel-list-separator` |
| `server-option-saperator` | `options-separator` |
| `queue-list-saperator` | `queue-list-separator` |
| `widget-bar-spliter` | `widget-bar-splitter` |
| `mixing-mode-btn` | `mixing-mode-button` |

Unchanged: `.active`, `.announcement-area`, `.announcement-icon`, `.arrow-down-icon`, `.broadcast-area`, `.broadcast-close-button`, `.channel-list`, `.chat-area`, `.classic`, `.connecting`, `.control-area`, `.control-button-separator`, `.control-buttons`, `.current-channel-box`, `.current-channel-icon`, `.current-channel-name-text`, `.current-channel-ping`, `.current-channel-text`, `.failed`, `.gif`, `.input-area`, `.invitation-button`, `.level1`–`.level9`, `.message-area`, `.mic-button`, `.mic-button-icon`, `.mic-button-sub-text`, `.mic-button-text`, `.more-icon`, `.muted`, `.new`, `.no-selection`, `.normal`, `.queue-list`, `.queuing`, `.record-box`, `.record-button`, `.record-text`, `.rtc-latency-icon`, `.screen-preview`, `.screen-preview-header`, `.screen-preview-stop`, `.screen-preview-video`, `.scroll-view`, `.section-title-text`, `.server-id-text`, `.server-name-text`, `.server-online-count-text`, `.server-options`, `.server-verify-icon`, `.setting-button`, `.setting-overlay`, `.show-area`, `.show-icon`, `.speaking`, `.status1`–`.status4`, `.svg`, `.three-line`, `.voice-mode-dropdown`, `.widget-bar`, `.widget-bar-expanded`, `.widget-bar-item`, `.widget-bar-item-active`, `.widget-bar-item-icon`, `.widget-bar-item-text`, `.widget-bar-toggle-button`.

- [ ] **Step 12: Update all Server page TSX references**

```bash
find src/page-components/Server -name "*.tsx" | xargs grep -l "styles\["
# 4 files: index.tsx, MicButton.tsx, ServerPageContent.tsx, ServerPageSidebar.tsx
# Apply sed for all 16 renames across all 4 files
```

- [ ] **Step 13: Commit**

```bash
git add src/page-components/
git commit -m "refactor(css): standardize naming in page-components"
```

---

## Task 5: popups/ group A — About through FriendVerification

**Files:**
- Modify: `src/popups/About/About.module.css` + sibling TSX
- Modify: `src/popups/ChangeTheme/ChangeTheme.module.css` + sibling TSX
- Modify: `src/popups/ChannelEvent/ChannelEvent.module.css` + sibling TSX
- Modify: `src/popups/ChatHistory/ChatHistory.module.css` + sibling TSX
- Modify: `src/popups/DirectMessage/DirectMessage.module.css` + sibling TSX
- Modify: `src/popups/EditChannelOrder/EditChannelOrder.module.css` + sibling TSX
- Modify: `src/popups/FriendVerification/FriendVerification.module.css` + sibling TSX

Files with no changes needed (already compliant):
- `ApplyFriend/ApplyFriend.module.css` — no changes
- `ApplyMember/ApplyMember.module.css` — no changes
- `ChannelSetting/ChannelSetting.module.css` — no changes

- [ ] **Step 1: Rename classes in About.module.css**

Rename mapping:
| Old | New |
|-----|-----|
| `discord-icon-link` | `discord-link` |
| `github-icon-link` | `github-link` |

Unchanged: all other classes.

- [ ] **Step 2: Update About TSX references**

```bash
find src/popups/About -name "*.tsx" | xargs grep -l "styles\["
```

- [ ] **Step 3: Rename classes in ChangeTheme.module.css**

Rename mapping:
| Old | New |
|-----|-----|
| `ct-contain` | `content` |
| `ct-wrapper` | `wrapper` |
| `color-selected-btn` | `color-select-button` |
| `color-selected-cancel` | `cancel-button` |
| `color-selected-save` | `save-button` |
| `color-selected-color` | `selected-color` |

Unchanged: `.color-selector`, `.color-selector-box`, `.color-selector-footer`, `.color-selector-image`, `.image-selector`, `.small`, `.svg`, `.theme`, `.theme-description`, `.theme-selector`, `.theme-slots-big`, `.theme-slots-small`.

- [ ] **Step 4: Update ChangeTheme TSX references**

```bash
find src/popups/ChangeTheme -name "*.tsx" | xargs grep -l "styles\["
```

- [ ] **Step 5: Rename classes in ChannelEvent.module.css**

Rename mapping:
| Old | New |
|-----|-----|
| `spliter` | `splitter` |

Unchanged: all other classes.

- [ ] **Step 6: Update ChannelEvent TSX references**

```bash
find src/popups/ChannelEvent -name "*.tsx" | xargs grep -l "styles\["
sed -i '' "s/styles\['spliter'\]/styles['splitter']/g" src/popups/ChannelEvent/index.tsx
```

- [ ] **Step 7: Rename classes in ChatHistory.module.css**

Rename mapping:
| Old | New |
|-----|-----|
| `page-btn` | `page-button` |
| `delete-button-icon` | `delete-button` |
| `main-delete-button-box` | `delete-button-container` |
| `body-right-message-box` | `message-section` |

Note: verify in TSX that `delete-button-icon` has an `onClick` (if it does, use `delete-button`; if truly decorative, use `delete-icon`).

Unchanged: all other classes.

- [ ] **Step 8: Update ChatHistory TSX references**

```bash
find src/popups/ChatHistory -name "*.tsx" | xargs grep -l "styles\["
```

- [ ] **Step 9: Rename classes in DirectMessage.module.css**

Rename mapping:
| Old | New |
|-----|-----|
| `action-icon` | `action-button` |

Note: verify in TSX that `action-icon` is clickable. If it has `onClick`, use `action-button`. If decorative, keep `action-icon`.

Unchanged: all other classes (already well-named).

- [ ] **Step 10: Update DirectMessage TSX references**

```bash
find src/popups/DirectMessage -name "*.tsx" | xargs grep -l "styles\["
```

- [ ] **Step 11: Rename classes in EditChannelOrder.module.css**

Rename mapping:
| Old | New |
|-----|-----|
| `channel-tab` | `channel-item` |
| `channel-tab-box` | `channel-box` |
| `channel-tab-icon` | `channel-icon` |
| `channel-tab-index-text` | `channel-index-text` |
| `channel-tab-label` | `channel-label` |

Unchanged: `.add-channel-button`, `.bottom-channel-order-button`, `.change-channel-name-button`, `.channel-list`, `.delete-channel-button`, `.disabled-button`, `.down-channel-order-button`, `.edit-channel-order-body`, `.edit-channel-order-header`, `.expanded`, `.is-reception-lobby`, `.lobby`, `.member`, `.private`, `.readonly`, `.selected`, `.svg`, `.top-channel-order-button`, `.up-channel-order-button`.

- [ ] **Step 12: Update EditChannelOrder TSX references**

```bash
find src/popups/EditChannelOrder -name "*.tsx" | xargs grep -l "styles\["
```

- [ ] **Step 13: FriendVerification.module.css — no changes needed**

All classes are already compliant: `.action-button`, `.action-buttons`, `.all-cancel-text`, `.application`, `.application-content-box`, `.avatar-picture`, `.body`, `.content`, `.content-text`, `.direct-message-button`, `.direct-message-icon`, `.header`, `.svg`, `.time-text`, `.user-info-box`, `.user-name-text`.

- [ ] **Step 14: Commit**

```bash
git add src/popups/About/ src/popups/ChangeTheme/ src/popups/ChannelEvent/ src/popups/ChatHistory/ src/popups/DirectMessage/ src/popups/EditChannelOrder/
git commit -m "refactor(css): standardize naming in popups A–FriendVerification"
```

---

## Task 6: popups/ group B — InviteFriend through UserInfo

**Files:**
- Modify: `src/popups/InviteFriend/InviteFriend.module.css` + sibling TSX
- Modify: `src/popups/NetworkDiagnosis/NetworkDiagnosis.module.css` + sibling TSX
- Modify: `src/popups/ServerAnnouncement/ServerAnnouncement.module.css` + sibling TSX
- Modify: `src/popups/ServerApplication/ServerApplication.module.css` + sibling TSX
- Modify: `src/popups/ServerSetting/ServerSetting.module.css` + sibling TSX
- Modify: `src/popups/SystemSetting/SystemSetting.module.css` + sibling TSX
- Modify: `src/popups/UserInfo/UserSetting.module.css` + sibling TSX

Files with no changes needed:
- `InviteMember/InviteMember.module.css` — no changes
- `MemberInvitation/MemberInvitation.module.css` — no changes

- [ ] **Step 1: Rename classes in InviteFriend.module.css**

Rename mapping:
| Old | New |
|-----|-----|
| `friend-group-tab` | `group-item` |
| `friend-group-tab-content` | `group-content` |
| `friend-group-tab-details` | `group-details` |
| `friend-group-tab-toggle-icon` | `toggle-icon` |
| `friend-tab` | `friend-item` |
| `friend-tab-avatar-picture` | `avatar` |
| `friend-tab-base-info-box` | `base-info` |
| `friend-tab-location-icon` | `location-icon` |
| `friend-tab-name-text` | `name-text` |
| `friend-tab-server-name-text` | `server-name-text` |
| `friend-tab-signature-text` | `signature-text` |

Note: verify `friend-group-tab-toggle-icon` and `next-icon`/`prev-icon` clickability in TSX. If clickable → rename to `toggle-button`, `next-button`, `prev-button`.

Unchanged: `.checkbox`, `.expanded`, `.friend-group-list`, `.header`, `.next-icon`, `.options-content`, `.prev-icon`, `.scroll-view`, `.search-bar`, `.search-icon`, `.search-input`, `.selected`, `.svg`.

Wait — `next-icon` and `prev-icon` here: check if they match Friend.module.css behavior (cursor:pointer → rename to `next-button`, `prev-button`).

- [ ] **Step 2: Update InviteFriend TSX references**

```bash
find src/popups/InviteFriend -name "*.tsx" | xargs grep -l "styles\["
```

- [ ] **Step 3: Rename classes in NetworkDiagnosis.module.css**

Rename mapping:
| Old | New |
|-----|-----|
| `btn-disabled` | `disabled-button` |
| `btn-export` | `export-button` |

Unchanged: all other classes (already well-named).

- [ ] **Step 4: Update NetworkDiagnosis TSX references**

```bash
find src/popups/NetworkDiagnosis -name "*.tsx" | xargs grep -l "styles\["
```

- [ ] **Step 5: Rename classes in ServerAnnouncement.module.css**

Rename mapping:
| Old | New |
|-----|-----|
| `close-btn` | `close-button` |

Unchanged: `.action-bars`, `.headers`, `.svg`, `.tabs`.

- [ ] **Step 6: Update ServerAnnouncement TSX references**

```bash
find src/popups/ServerAnnouncement -name "*.tsx" | xargs grep -l "styles\["
sed -i '' "s/styles\['close-btn'\]/styles['close-button']/g" src/popups/ServerAnnouncement/index.tsx
```

- [ ] **Step 7: Rename classes in ServerApplication.module.css**

Rename mapping:
| Old | New |
|-----|-----|
| `button-item-box` | `item-wrapper` |
| `button-item-icon` | `item-icon` |
| `button-item-text` | `item-text` |
| `button-list-box` | `list` |

Unchanged: `.middle-area`, `.placeholder`, `.svg`.

- [ ] **Step 8: Update ServerApplication TSX references**

```bash
find src/popups/ServerApplication -name "*.tsx" | xargs grep -l "styles\["
```

- [ ] **Step 9: Rename classes in ServerSetting.module.css**

Rename mapping:
| Old | New |
|-----|-----|
| `server-avatar-picture` | `avatar` |
| `server-avatar-wrapper` | `avatar-wrapper` |

Unchanged: `.svg`, `.wealth-coin-icon`.

- [ ] **Step 10: Update ServerSetting TSX references**

```bash
find src/popups/ServerSetting -name "*.tsx" | xargs grep -l "styles\["
```

- [ ] **Step 11: Rename classes in SystemSetting.module.css**

Rename mapping:
| Old | New |
|-----|-----|
| `sound-effect-preview-btn` | `sound-effect-preview-button` |

Unchanged: `.sound-effect-enable-text`, `.svg`.

- [ ] **Step 12: Update SystemSetting TSX references**

```bash
find src/popups/SystemSetting -name "*.tsx" | xargs grep -l "styles\["
sed -i '' "s/styles\['sound-effect-preview-btn'\]/styles['sound-effect-preview-button']/g" src/popups/SystemSetting/index.tsx
```

- [ ] **Step 13: Rename classes in UserInfo/UserSetting.module.css**

Rename mapping:
| Old | New |
|-----|-----|
| `close-btn` | `close-button` |
| `minimize-btn` | `minimize-button` |

Unchanged: all other classes.

- [ ] **Step 14: Update UserInfo TSX references**

```bash
find src/popups/UserInfo -name "*.tsx" | xargs grep -l "styles\["
```

- [ ] **Step 15: Final verification — check for remaining non-compliant patterns**

```bash
# Check for any remaining -btn suffix
grep -rn "'[a-z-]*-btn'" src/ --include="*.tsx"
grep -rn "-btn['\"]" src/ --include="*.module.css"

# Check for remaining typos
grep -rn "saperator\|navegate\|spliter\b\|slogen\|datail" src/ --include="*.module.css"
grep -rn "saperator\|navegate\|spliter\b\|slogen\|datail" src/ --include="*.tsx"
```

Expected: 0 matches for all patterns.

- [ ] **Step 16: Commit**

```bash
git add src/popups/InviteFriend/ src/popups/NetworkDiagnosis/ src/popups/ServerAnnouncement/ src/popups/ServerApplication/ src/popups/ServerSetting/ src/popups/SystemSetting/ src/popups/UserInfo/
git commit -m "refactor(css): standardize naming in popups InviteFriend–UserInfo"
```
