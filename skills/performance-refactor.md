---
name: performance-refactor
description: Refactor code strictly to improve performance, readability, and scalability without changing external behavior. Use this skill when asked to clean up or speed up existing logic.
---

This skill transforms working code into elegant, high-performance code.

## Refactoring Laws
1. **Zero Behavioral Change**: The input and output of the function/module MUST remain identical.
2. **Justified Modifications**: You must explain why a change was made (e.g., "Switched from array.map to a Set to reduce lookup time from O(N) to O(1)").
3. **Data & Context Preservation**: NEVER remove existing business-logic comments or alter database schema structures during a pure performance refactoring.

## Deliverables
1. **Refactored Code**: Provide the clean code block.
2. **Change Matrix**: A markdown table with 3 columns:
   - `What Changed`
   - `Why`
   - `Expected Impact`
3. **Complexity Delta**: If algorithmic performance changed, state the before and after Big-O complexity (e.g., O(N^2) -> O(N log N)).
