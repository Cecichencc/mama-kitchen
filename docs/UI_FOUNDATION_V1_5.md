# Kitchen Garden — UI Foundation v1.5 (Step 01)

**Status:** Implemented on a development branch; not merged to production. Based on the approved Kitchen Garden UI Elements & Design System board. Scope is **CSS tokens, buttons, controls and card surfaces only**. The existing 3D farm geometry, crop icons and empty-plot mechanics are intentionally unchanged for Steps 02–03.

## Colour tokens

| Token | Value | Role |
| --- | --- | --- |
| `--kg-primary` | `#4CAF7A` | Green primary CTA |
| `--kg-primary-pressed` | `#2F7D46` | Pressed/hover action |
| `--kg-primary-light` | `#E8F4EA` | Quiet action and quantity increment |
| `--kg-cream` | `#FFF9F2` | Warm cream sheets |
| `--kg-background` | `#F7FAFD` | Future neutral page background |
| `--kg-pink` | `#FFD9E0` | Decorative pink accent |
| `--kg-blue` | `#E3F2FF` | Informational accent |
| `--kg-text` | `#2D3748` | Future main text role |
| `--kg-text-secondary` | `#8A94A6` | Future muted text role |
| `--kg-warning` | `#FFB74D` | Warning |
| `--kg-error` | `#FF6B6B` | Error |
| `--kg-border` | `#E5E7EB` | Neutral border |

**Preserved:** The existing `--coral`, `--sky`, `--barn` and `WORLD_COLORS` are not removed or recoloured; these still serve legacy CSS and 3D art direction. Token migration should be incremental, not a global replace.

## Reusable components and states

| Component | Current selector | States | Guidance |
| --- | --- | --- | --- |
| Primary CTA | `.cta-button`, `.pill-button.primary` | Default green, hover/pressed deep green, disabled muted green, keyboard focus | Minimum 48px tall, white text, 16px radius |
| Secondary action | `.pill-button:not(.primary)` | Cream default, active press | Green-tinted outline, 16px radius |
| Compact action | `.mini-action` | Light green, disabled, pressed | Minimum 42px tall; check 44px touch targets in implementation |
| Destructive action | `.mini-action.warning`, `.remove-line` | Pale red, red text | Avoid destructive green |
| Quantity control | `.stepper button`, `.quantity-row button` | Default, + highlighted, disabled | Minimum 44×44px targets; preserve numeric validation |
| Content card | `.card-surface`, `.meal-slot`, `.stock-batch`, `.basket-line`, `.recipe-teaser` | Standard | 20px radius, subtle shadow |
| Bottom sheet | `.game-sheet` | Open/closed | Warm cream, 28px upper corners |
| Navigation active | `.bottom-nav .nav-item.active` | Active | Deep garden green; keep 3-tab IA |

## Implementation rules

- **Do not** replace the live 3D farm with illustrations or alter the existing tomato/chicken/house models.
- Do not modify inventory domain or recipe logic in a visual-only step.
- All buttons retain accessible focus outlines and reduced-motion support.
- Keep English first and Simplified Chinese available.
- Green primary actions must not be confused with organic-source labels.
- Source of truth for runtime CSS remains `public/phase0/styles.css`.

## Next isolated steps

1. **Step 02 — Grocery icon library:** reusable clay-style icons for tomato, egg, bok choy, carrot, potato, fish and other ingredients, including unavailable states.
2. **Step 03 — Empty 3D plot:** actual empty soil geometry with a large + tap target and preselected Add Groceries action.
3. **Step 04 — Harvest and basket UI:** source labels, quantity stepper and basket rows.
4. **Step 05 — Recipe cards:** illustrated matching suggestions and View Recipe/Another Idea.
5. **Step 06 — Full mobile review:** real WebGL, 320/375/390/430px, both languages and iPhone Safari.

## Review acceptance

- Primary CTA and hover/pressed states use green, not coral.
- Disabled controls remain visibly disabled and don't fire actions.
- Quantity controls remain large enough to tap.
- Card surfaces and sheets retain the approved soft pastel appearance.
- Existing 3D selection and inventory remain unchanged.
- Actual browser screenshots and contrast checks are still required before visual sign-off.
