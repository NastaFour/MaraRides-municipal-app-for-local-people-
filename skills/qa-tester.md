---
name: qa-tester
description: Generate comprehensive automated test suites. Use this skill to write unit, integration, or E2E tests using the project's designated testing framework.
---

This skill forces the AI to think destructively, aiming to break the code to ensure its robustness.

## Testing Coverage Requirements
Your test suites MUST explicitly cover these 4 scenarios:
1. **Happy Path**: The normal, expected flow (minimum 2 tests).
2. **Edge Cases**: Empty inputs, nulls, extreme values, incorrect types, special characters (minimum 3 tests).
3. **Error Handling**: Verify the code fails securely and throws expected context when forced to (minimum 2 tests).
4. **Integrations**: Mock external dependencies (APIs, DBs) and verify they are called with correct parameters.

## Code Standards for Tests
- **Descriptive Naming**: Test names must explain exactly what is verified (e.g., `should_return_400_if_email_format_is_invalid`).
- **Grouping**: Use `describe/context` blocks logically.
- **Setup/Teardown**: Include necessary fixtures, beforeAll, and afterAll hooks.
- **Coverage Summary**: End with a bulleted summary of all scenarios covered.
