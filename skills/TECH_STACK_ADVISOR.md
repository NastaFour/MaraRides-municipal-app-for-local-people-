---
name: tech-stack-advisor
description: Autonomously select the optimal technology stack for a new project or feature based exclusively on the developer's known skills and proficiencies. Use this skill when proposing architectures, starting new projects, or dynamically updating the PROJECT_TRACKER.md.
---

This skill acts as an architectural advisor. It guides the AI to propose, select, and justify technologies for a project by relying strictly on the developer's mastered toolbelt. It prevents the AI from suggesting random frameworks, ensuring high development velocity.

## The Developer's Arsenal (Context)

The developer (Nasta) is highly proficient in the following domains. **ONLY** select technologies from this list when architecting solutions, unless the user explicitly asks to explore something completely new:

### 🎨 Frontend
- **Frameworks**: React / Vite, Next.js
- **Languages**: TypeScript (Default)
- **Styling**: Tailwind CSS (or Vanilla CSS depending on the project instructions)

### ⚙️ Backend
- **Core**: Node.js, Express.js
- **Database**: PostgreSQL
- **ORM/Data**: Prisma ORM

### 🏗️ Arquitectura & DevOps
- **Structure**: Microservicios, NPM Workspaces
- **Real-Time**: Socket.io
- **Security**: JWT / bcryptjs

### 🧠 Inteligencia Artificial
- **Capabilities**: AI Orchestration, LLM Integration
- **Optimization**: Prompt Engineering
- **Infrastructure**: API AI Billing

### 📱 Apps Multiplataforma
- **Mobile Native**: React Native, Expo
- **Desktop**: Electron.js
- **Web App**: PWA / Capacitor

## Tech Selection Guidelines

When the user asks you to start a project or suggest an architecture, execute this routine:

1. **Analyze Requirements**: 
   - *¿Es un proyecto centrado en SEO o e-commerce?* -> Sugiere Next.js.
   - *¿Es un panel de administración rápido?* -> Sugiere React + Vite.
   - *¿Necesita chat o notificaciones en vivo?* -> Sugiere Node + Express + Socket.io.
   - *¿Es app de escritorio?* -> Sugiere Electron.js + Vite.
2. **Compile the Stack**: Pick exactly what is needed from the arsenal above. Do not over-engineer.
3. **Present & Justify**: Present the chosen stack to the user, briefly explaining *why* those specific tools from their arsenal are the best fit for this specific project.
4. **Update the Ledger**: Once the user approves the stack, assume the initiative and gracefully update the `Tech Stack` and `Decision Log` sections in the `PROJECT_TRACKER.md` file without being told.

**CRITICAL**: NEVER suggest tools outside of this list (e.g., Do not suggest MongoDB, Vue.js, Angular, Django, Go) unless specifically commanded. Maximize the developer's existing strengths.
