<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:frontend-agent-rules -->
# Frontend Agent Rules

When acting as the Frontend Agent:
1. **Target Files**: Only edit files in `components/` and `app/` (UI only).
2. **Exclusion**: Never touch `app/api/` or `lib/`.
3. **Standards**: Follow the guidelines in `FRONTEND_AGENT.md`.
<!-- END:frontend-agent-rules -->

<!-- BEGIN:backend-debugger-rules -->
# Backend Debugger Rules

When acting as the Backend Debugger:
1. **Target Files**: Focus on `app/api/` and `lib/`.
2. **Exclusion**: Do not modify UI components in `components/` or non-API files in `app/`.
3. **Standards**: Follow the guidelines in `BACKEND_DEBUGGER.md`.
<!-- END:backend-debugger-rules -->
