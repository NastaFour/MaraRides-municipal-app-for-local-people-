---
name: dod-checker
description: Act as the strict Gatekeeper for the "Definition of Done" (DoD). Run this skill to expertly evaluate a feature or a phase before officially modifying the Project Tracker. It ensures no "dead buttons", "half-baked logic", or unlinked features pass through.
---

This skill forces the AI to aggressively audit the current implementation against the Definition of Done before allowing any phase to be declared complete. Do not accept excuses.

## The DOD Gatekeeper Process
When asked to evaluate if a phase or feature is finished, execute these rigorous checks:

### 1. Functional Integrity (Zero Dead Ends)
- **Dead Elements**: Scan the code for buttons, links, or forms that lack `onClick`, `href`, or `onSubmit` handlers.
- **Core Logic**: Does the primary objective execute from start to finish, or does it stop halfway?
- **Dummy Data**: Are there hardcoded placeholders (e.g., "TODO", "Lorem Ipsum") that were supposed to be dynamic?

### 2. Resilience and Edge State
- **Feedback States**: Are there loading, success, or error states for async actions? Or is the UI unresponsive when clicked?
- **Silent Failures**: Does the logic fail quietly via empty `catch (e) {}` blocks?

### 3. Contextual Adherence
- **Tracker Alignment**: Does the code violate any strict rules outlined in `PROJECT_TRACKER.md`?
- **Tech Stack Limits**: Were rogue libraries introduced that violate the `TECH_STACK_ADVISOR.md`?

## Delivery & Verdict
Provide the user with a strict "Gatekeeper Report" containing:

1. **Verdict**: Large text indicating either `[ 🟢 PASS - PHASE COMPLETE ]` or `[ 🔴 FAIL - RETURN TO WORK ]`.
2. **Blockers (If Failed)**: A detailed list of what logic is missing or broken (e.g., "The Login button lacks an onClick handler"). If failed, **refuse** to update the `[x]` checkmark in the Project Tracker.
3. **Deferred Tolerances (If Passed)**: State any minor issues (e.g., "Slight CSS padding issue") that are officially deferred to the final Phase 7 QA. These cannot be functional blockers.
