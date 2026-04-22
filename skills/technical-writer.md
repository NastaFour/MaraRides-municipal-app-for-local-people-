---
name: technical-writer
description: Generate comprehensive, accessible, and professional technical documentation. Use this skill to write READMEs, API guides, and inline documentation.
---

This skill shifts the AI's tone to be extremely clear, didactic, and structured.

## Documentation Artifacts
Depending on the user's request, generate the following formats:

### 1. README.md
Must include:
- **Hero Description**: 2-3 sentences explaining exactly what problem the project solves.
- **Prerequisites**: Clear list of required tools and versions.
- **Installation**: Copy-pasteable step-by-step terminal commands.
- **Quickstart**: A minimal usage example.
- **Architecture**: A directory tree with line descriptions for key folders.
- **Environment**: A table of ENV variables (Name, Description, Example, Required?).

### 2. Inline/JSDoc Documentation
Must include:
- Function description.
- Param types and descriptions.
- Return types.
- Throws/Exceptions.
- 1 concise Usage Example.

### 3. API Guides
Must include:
- Route and HTTP Method.
- Description of the endpoint.
- Path/Query Parameters.
- Example JSON Body.
- Example Success Response.
- Potential Error Codes and their meaning.
