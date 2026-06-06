```markdown
# Design System Strategy: Terminal Editorial

## 1. Overview & Creative North Star
**The Creative North Star: "The Brutalist Command"**

This design system rejects the "friendly" aesthetics of modern SaaS in favor of a high-end, editorial approach to terminal-inspired interfaces. We are merging the raw, functional power of a CLI with the sophisticated layout logic of a luxury portfolio.

To break the "template" look, we utilize **intentional asymmetry**. Layouts should not always be centered; use a "weighted-left" or "heavy-right" approach common in code editors. We avoid soft corners and gradients, opting instead for a razor-sharp, monochrome environment where every pixel feels calculated. This is not just a community platform; it is a high-performance IDE for social interaction.

---

## 2. Colors & Tonal Architecture
The palette is rooted in absolute blacks and tactical greys. While the user requested 1px borders, we will treat them as **surgical instruments**—used only to define the skeleton, never to clutter the view.

### The Surface Hierarchy
Depth is achieved through "Tonal Stacking." We do not use shadows; we use luminance shifts.
- **Surface (Base):** `#131313` – The void. All work starts here.
- **Surface-Container-Low:** `#1c1b1b` – Used for secondary sidebars or "sunken" utility areas.
- **Surface-Container-Highest:** `#353534` – Used for active states or "elevated" terminal windows.

### The "No-Line" Rule (Exceptions)
While this system utilizes borders, they must never be used for "sectioning" large blocks of layout. Use **Background Color Shifts** (`surface` vs `surface-container-low`) to define major regions. Reserve the 1px `outline_variant` (`#474747`) strictly for interactive components (cards, inputs, buttons) to maintain the "windowed" terminal aesthetic.

### Signature Textures
- **The Scanline Overlay:** Apply a 2% opacity repeating linear gradient (black/transparent) over `surface-container` elements to mimic CRT monitors.
- **The Pure CTA:** Primary actions use `on_primary_fixed` (`#ffffff`). This is the only element allowed to break the monochrome scale with pure luminosity.

---

## 3. Typography: The Dual-Engine Scale
We use a high-contrast pairing to distinguish between "Content" and "System."

### Space Grotesk (The Content Engine)
Used for headlines and body. Its geometric quirks provide the "Editorial" feel.
- **Display-LG (3.5rem):** Set with `-0.04em` letter spacing. Use for hero statements and major page titles.
- **Body-MD (0.875rem):** Standard reading size. High line-height (1.6) to offset the density of the terminal look.

### JetBrains Mono (The System Engine)
Used for labels, navigation, IDs, and metadata.
- **Label-MD (0.75rem):** Always uppercase with `0.1em` letter spacing. 
- **The "Blinking Cursor" Rule:** Every `Title-LG` or `Headline` should conclude with a `_` or `|` character using the blinking animation utility to reinforce the terminal metaphor.

---

## 4. Elevation & Depth (Non-Traditional)
Traditional shadows are prohibited. Depth is "Optical," not "Physical."

- **The Layering Principle:** Stack `surface-container-lowest` cards on a `surface` background. If an element needs to "pop," increase its border contrast from `outline_variant` to `outline`.
- **The "Ghost Border" Fallback:** For inactive states, use the `outline_variant` at 20% opacity. This creates a "wireframe" look that suggests the structure is there, but dormant.
- **Translate-Y Interaction:** Instead of shadows, elevation is communicated through movement. On hover, components should translate `-4px` on the Y-axis. This "physical lift" replaces the need for glow or shadow.

---

## 5. Components

### Buttons
- **Primary:** Background: `#ffffff`, Text: `#131313`, Radius: `0px`. On hover: Negative shift (Background: `#131313`, Text: `#ffffff`, 1px Border).
- **Secondary:** Background: Transparent, 1px Border: `#ffffff`, Text: `#ffffff`.
- **Tertiary:** JetBrains Mono text with a leading `>` character.

### Input Fields & Terminal Prompts
- **Styling:** No background fill. 1px bottom border only (`outline_variant`). 
- **States:** On focus, the bottom border becomes `primary` (#ffffff) and a blinking cursor appears at the end of the placeholder text.

### XP Progress Bars (The "System" Component)
- **Track:** `surface-container-highest` (`#353534`).
- **Indicator:** `primary` (`#ffffff`).
- **Design:** Use a segmented block style (e.g., `[|||||||   ]`) using JetBrains Mono characters or a CSS grid to mimic old OS installation bars.

### Cards & Lists
- **Cards:** 1px border (`#1a1a1a`), background (`#111111`), `0px` radius. 
- **Lists:** No dividers. Use `1.5rem` of vertical white space. Hovering over a list item triggers a background shift to `surface-container-low`.

---

## 6. Do's and Don'ts

### Do:
- **Embrace the Grid:** Align every element to a strict 4px or 8px baseline. Terminal interfaces are built on fixed-width logic.
- **Use Mono for Metadata:** Timestamps, tags, and "User IDs" must always be JetBrains Mono.
- **Intentional Asymmetry:** If a sidebar is on the left, let the right side have "dead space" to emphasize the editorial layout.

### Don't:
- **No Rounded Corners:** `0px` is the only acceptable value. Rounded corners break the "Terminal" illusion.
- **No Soft Shadows:** If you need to separate a floating modal, use a solid 1px `primary` border or a high-contrast background shift.
- **Avoid Color Bloat:** This is a monochrome system. Errors (`#ffb4ab`) should be used sparingly, like a warning light on a dashboard, not as a decorative accent.

### Accessibility Note:
While high contrast is a hallmark of this system, ensure that `muted text` (`#333333`) is only used for non-essential metadata. Ensure all interactive labels meet WCAG AA contrast ratios against the `#0a0a0a` background.```