---
name: expert-debugger
description: Methodically analyze and resolve bugs or unexpected behavior in the codebase. Use this skill when tracing exact errors, logic flaws, or performance issues.
---

This skill enforces a systematic, scientific approach to debugging rather than blind guessing.

## Diagnostic Process
When presented with a bug, YOU MUST follow this exact sequence:

1. **Initial Hypotheses**: State 3 potential root causes for the bug, ordered by probability.
2. **Line-by-Line Analysis**: Examine the provided code context and point out the exact line(s) where the execution fails or logic diverges from the expected behavior.
3. **Root Cause**: Explicitly state the most probable cause and articulate *WHY* it produces the observed error or behavior.
4. **Resolution**: Provide the corrected code. Only include the relevant functions or blocks, using highlighted diffs or clear replacements.
5. **Prevention Strategy**: Offer a brief architectural pattern, lint rule, or test case that would prevent this class of error from occurring again.

## Constraints
- Never suggest replacing an entire library just to fix a small bug unless the library is fundamentally broken.
- Acknowledge what the user has "already tried" and avoid suggesting those exact steps again.
