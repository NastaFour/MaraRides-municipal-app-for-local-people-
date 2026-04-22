---
name: frontend-design-marathon-graphic-realism
description: Create aggressive, high-contrast frontend interfaces inspired by the "Graphic Realism" and utilitarian sci-fi aesthetic. Use this skill when building web components, landing pages, or system dashboards that need a striking, industrial, Y2K-cyberpunk, and typography-heavy look. Generates unapologetic, flat, and vivid code that avoids soft corporate design.
license: Complete terms in LICENSE.txt
---

This skill guides the creation of distinctive, production-grade frontend interfaces strictly adhering to a "Graphic Realism" aesthetic. Think industrial design meets avant-garde poster art: hyper-vibrant colors, brutalist layouts, and unapologetic utilitarianism.

The user provides frontend requirements. You must wrap those requirements in a high-tech, corporate-dystopian, yet incredibly clean visual language.

## Design Thinking

Before coding, commit to this BOLD aesthetic direction:
- **Purpose**: To present information as if it were a high-end, functional piece of industrial hardware, a corporate terminal, or a synthetic hazard warning.
- **Tone**: Aggressive, functional, clean, sterile, synthetic, and loud. It is NOT dirty or rusted; it is factory-new, mass-produced corporate sci-fi.
- **Constraints**: No soft shadows, no gentle gradients, no rounded corners (unless heavily stylized like a pill-box). Everything must look manufactured and precise.
- **Differentiation**: Information is treated as visual texture. Serial numbers, barcodes, and technical readouts should be visible components of the design.

**CRITICAL**: The core of this style is extreme contrast. You are mixing the sterile void of space (deep, absolute darks) with hyper-saturated, synthetic neon elements. 

## Frontend Aesthetics Guidelines

Focus strictly on the following implementations:

- **Typography**: Typography IS the architecture. Use massive, heavy, extended sans-serif fonts for headings (e.g., Anton, Impact, Syncopate, Monument Extended) and monospace fonts for body text, data, and details (e.g., Roboto Mono, JetBrains Mono, Share Tech Mono). Use text as texture: add fake serial numbers (e.g., `SYS-ID: 4892-A`), barcodes, crosshairs `[ + ]`, and warning labels `// HAZARD` to frame the layout.
- **Color & Theme**: Default to a pitch-black or deep charcoal background (`#050505`, `#111`). Pair it with **Acidic and Hyper-vibrant accents**: Neon Chartreuse/Yellow (`#CCFF00`), Cyan (`#00FFFF`), Hot Pink/Magenta (`#FF00FF`), or Blood Orange (`#FF3300`). 
  - *Rule*: Do not mix these accents into a gradient. Use them as solid, flat blocks of aggressive color. Contrast must be blindingly sharp.
- **Motion**: No smooth, bouncy, or elastic easing (`ease-in-out` is forbidden). Use sharp, linear, or step-based timing functions (`steps()`). Animations should feel like mechanical snaps, CRT flickers, glitch reveals, or fast terminal typing. Progress bars should be segmented and blocky. 
- **Spatial Composition**: Utilitarian Brutalism. Use rigid, asymmetrical grid layouts. Separate content using thick, solid borders (1px to 3px solid neon colors). Elements should look like they are housed inside mechanical framing or UI panels. Use generous padding inside containers, but pack data densely within designated "readout" zones.
- **Backgrounds & Visual Details**: Avoid generic solid colors. Incorporate structural elements:
  - Hazard stripes (`repeating-linear-gradient` at 45 degrees).
  - Fine grid overlays (using background-image linear-gradients).
  - Registration marks, corner brackets (like `L` shapes on the corners of divs).
  - Subtle noise textures over flat colors to simulate printed ink or matte plastic.
  - "Clipped" corners using `clip-path: polygon()` to give divs a chamfered, hardware-like shape.

NEVER use soft box-shadows. If depth is needed, use hard, solid drop-shadows (e.g., `box-shadow: 4px 4px 0px #CCFF00`). 

**IMPORTANT**: Match implementation to the vision. HTML structures should be highly semantic but wrapped in complex framing `divs` to achieve the border and corner effects. Use CSS variables extensively for the strict color palette. 

Show what can be created when you abandon safe, soft, "modern" UI and embrace the aggressive, high-contrast world of Graphic Realism.