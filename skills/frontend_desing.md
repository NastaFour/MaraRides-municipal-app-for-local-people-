---
name: frontend-design
description: Create distinctive, production-grade frontend interfaces aligned strictly with the project's art direction. Generates accessible, polished code and UI design tailored for real-world usability.
license: Complete terms in LICENSE.txt
---

This skill guides the creation of professional frontend interfaces that balance highly specific aesthetic visions with strict real-world usability constraints (Performance and Accessibility).

## Context & Art Direction

**CRITICAL RULE 1**: NEVER hallucinate or pick an arbitrary aesthetic direction. Before generating any design, you MUST read `PROJECT_TRACKER.md` and extract the exact "Aesthetic" restrictions defined there. If a `complement.md` or any other art-reference file exists in the workspace, you must adhere implicitly to its specific art style.

Design is not just looking good, it's solving the context's problem:
- **Purpose**: What problem does this interface solve?
- **Audience**: Is it for administrators sitting at a desk, or mototaxi drivers under bright sunlight?

## Frontend Aesthetics & Engineering Guidelines

You must implement working code (React, HTML/CSS, Tailwind) that adheres to these 4 pillars:

### 1. Typography & Accessibility (A11y)
- Use modern, highly-legible fonts corresponding to the project's aesthetic.
- **Strict Touch Targets**: For mobile or operational applications, enforce a minimum **Touch Target of 44x44px** for all interactive elements (buttons, links, inputs).
- **Legibility**: Enforce strict contrast ratios (WCAG AA compliant minimum) to guarantee visibility under bright sunlight or dark-mode environments.

### 2. Design Tokens (Zero Spaghetti)
- **NO Hardcoded Colors**: Never use arbitrary HEX codes scattered in inline styles or random utility classes. 
- You MUST rely on Global CSS Variables or the `tailwind.config` system. Ensure absolute consistency. Use semantic color names (e.g., `bg-primary`, `text-muted`) rather than inventing 50 shades of blue.

### 3. Motion & Performance Limits
- Prioritize high-performance CSS transitions (`opacity`, `transform`) over heavy JS physics libraries (like Framer Motion) to conserve battery on low-end devices.
- **Respect Constraints**: Always wrap complex animations with `@media (prefers-reduced-motion: no-preference)` or its tailwind equivalent (`motion-reduce:`) to respect device settings.
- Do not overuse heavy visual filters (like heavy blurs or grain overlays) if they compromise rendering performance.

### 4. Layout & Spatial Composition
- Use modern CSS Grid and Flexbox to create robust responsive macro-layouts. 
- Adapt the UI gracefully, prioritizing Mobile-First if it's an app, or Desktop-First if it's a dashboard.
- Refine negative space based on the tone (Dense for Dashboards, Generous padding for App interfaces).

**IMPORTANT ENTRY:** When invoking this skill, the AI must explicitly justify its design choices (e.g., "I used 48px buttons and high contrast colors because the tracker indicates this is an app for mototaxi drivers"). Be creative, but always keep it production-grade, fast, and highly usable.
