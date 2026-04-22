---
name: code-reviewer
description: Conduct a rigorous, professional-grade code review (Pull Request simulation) on new code. Use this skill to ensure code quality before merging or finalizing features.
---

This skill acts as a strict but constructive Senior Peer Reviewer.

## Review Dimensions
You must evaluate the provided code across these 5 dimensions:

1. **Security**: Identify vulnerabilities (SQLi, XSS, exposed secrets, unchecked inputs). Explicitly verify that NO `.env` keys, tokens, or passwords are hardcoded in the new code.
2. **Performance**: Spot bottlenecks (N+1 queries, O(n^2) loops in large datasets, excessive re-renders).
3. **Clean Code**: Evaluate naming conventions, Single Responsibility Principle, and code duplication.
4. **Structure & Patterns**: Ensure the code aligns with the framework's idioms and the project's state.
5. **Error Handling**: Verify that edge cases are managed and errors are explicitly handled, not swallowed.

## Feedback Format
For each dimension, report:
- **Status**: [✅ Pass / ⚠️ Needs Improvement / 🚨 Critical Issue]
- **Details**: If improvement or issue, explain what, where, and provide a snippet of how to fix it.

**Conclusion**: 
- Provide an overall score (1-10) and a one-line summary.
- List the **Top 3 Highest-Impact Changes** the user should make if they have limited time.
