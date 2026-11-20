# Codex task: David Taylor interactive workflow prototype

You are acting as a senior product designer, frontend engineer, and QA engineer. Build a polished, clickable, browser-first demonstration of a production task tracking application for a prospective client, David Taylor.

## Source of truth
Read `CLIENT_CONTEXT.md` in full before writing code. Treat David's quoted requirements as confirmed, and every unconfirmed detail as a prototype assumption. Do not invent the nature of David's industry, production output, real employee names, logos, or current sheet columns. Write assumptions in `ASSUMPTIONS.md`. Do not wait for additional materials: use clearly fictional, anonymized sample tasks until real samples are provided.

## Business goal
David currently loses information between chats/calls, a shared sheet, production docs, and people. Approximately 30–40 tasks/week and six participants. He needs one task/one place/one responsible owner, visible statuses/priorities/deadlines, reliable handoffs and reminders, and less manual status chasing. Ideal process: task captured same day; production brief prepared within one day; production takes 2–5 days depending on complexity; quick final check.

## Outcome
Create an interactive English-language SaaS-style demo that David can explore without login. It must explain the intended day-to-day workflow, not merely render decorative UI. This is a local-first prototype with a static frontend, test data and simulated automations, NOT an operational app. No real email, Telegram, AI, authentication, database, external data APIs, or background jobs.

## Product model
Task fields: ID, title, description, source (chat/call/manual; illustrative), createdAt, status, priority, ownerId, dueAt, productionBrief, requiredInformation checklist, comments/activity history, updatedAt. One current owner per task. Show explicit unassigned state where relevant. Include task activity for status changes/ownership changes. Sample data must be fiction, clearly labelled in UI. Include 25–35 sample tasks with realistic variation, including completed, at risk, overdue, missing information, and unassigned. Sample team ~6 fictional staff. Do NOT imply sample data came from David.

Proposed statuses (hypothesis, not client-approved): New, Brief Needed, Ready for Production, In Production, Final Review, Done. Support moving tasks forward and backward with explicit choices, and demonstrate how handoff/owner changes are surfaced. Make status names/configurable in a centralized config so client feedback is easy to implement.

## Screens
1. Overview: summary tiles for total active, due soon, overdue, blocked/missing details; attention queue and quick access to tasks. Metrics derived from local sample state, not hard-coded.
2. Board: Kanban with status columns, clickable cards, owner/priority/due date, filtering by owner/status/priority, search, and a user-friendly way to update status. Drag/drop optional, but must not be the only way to move a task.
3. List: sortable/filterable task table with clear deadlines and ownership.
4. Task drawer/detail view: full description, production brief, mandatory info checklist, editable owner/priority/due date/status, history, comments/notes with local persistence, validation of required information before transition to production readiness. Make it evident what changes and what needs attention.
5. My Tasks: switch between six demo personas to see the responsibilities of different team members, no actual login.
6. Activity & Reminders: a simulated notifications inbox showing 'due soon', 'overdue', 'missing brief', 'handoff' events, plus an understandable escalation example. Never send any actual reminders. Make simulation explicit in UI.
7. Demo Guide: 4–6 step walkthrough to help David test the system. Include a prominent Reset Demo button.

## Must-work interactions
- Create a task from a manual intake form and show it on the board immediately.
- Open task details, change owner, priority, due date, and status.
- Update a production brief and checklist; visually prevent or warn about moving to Ready for Production if required brief fields are incomplete.
- Create a note and see an entry in the activity timeline.
- Search, filter, change view and persona.
- See deadlines and risk indicators update from edited task state.
- Observe a simulated missed-deadline escalation in Activity & Reminders. It must be labelled SIMULATION.
- Reset demo to initial example state.
- Keep UI state across refresh using localStorage, gracefully handling invalid stored data; no backend.

## UX/UI constraints
- Professional, restrained, mature enterprise SaaS style, clear information hierarchy. No AI gimmicks, loud gradients or excessive animations. Prioritize clarity and task throughput.
- Responsive desktop/tablet/mobile, with accessible controls, keyboard focus states and usable contrast.
- Entire UI in natural English. User-facing sample descriptions, help text and tour steps must be understandable to someone nontechnical.
- Display subtle but visible banner: 'Interactive demo • Fictional data • No live integrations'.
- Never present mock notification delivery as real.
- Do not use client's photo, company branding, or assert an industry you do not know. Use an appropriately neutral demo product name like 'Production Flow'.

## Engineering
- First inspect the current working directory. Never overwrite unrelated existing files. If project is empty, scaffold React + TypeScript + Vite with Tailwind CSS (use stable compatible versions). If an existing stack is present, adapt to it rather than replacing it.
- Use clean, maintainable architecture: reusable UI components, typed task state, status/config constants, demo fixtures, selectors and pure update utilities. Keep dependencies modest.
- Prefer client-side state and localStorage. No secret keys or external services. Avoid analytics/tracking.
- Provide working npm scripts for dev/build/preview; pin or record dependencies in lockfile.
- Include README.md with local startup, test checklist, known limitations, deployment instructions for Vercel, and how to replace sample content with anonymized client tasks later.
- Add `ASSUMPTIONS.md` (client-confirmed vs prototype proposals) and `PILOT_SCOPE.md` (backend, auth/permissions, audit, Telegram/sheets integrations, reliable reminders/escalations, security, migration, observability as future production work).

## Quality gates
- Run package installation, typechecking (where configured), build and available tests. Repair failures. Do not claim tests pass without running them.
- Manually inspect the primary UI if browser tooling is available, including mobile width. If browser automation is unavailable, explain what could not be verified.
- Ensure no inert buttons, placeholder links or fake controls that look clickable. Either implement a meaningful demo interaction or explicitly label as preview-only and disable it.
- Do not claim a public URL exists until a deployment actually succeeds. Do not deploy or publish without asking for permission/access when required. Do not add actual personal or commercial data to the public demo.

## Deliverables
1. Running local app.
2. Tested production build.
3. README.md, ASSUMPTIONS.md, PILOT_SCOPE.md.
4. Brief report containing: implemented features, how to run locally, test outcomes, known limitations, deployment instructions, and suggested 5-minute demo script for David.

## Working method
Read the context, outline implementation steps briefly, then implement completely. Make reasonable reversible UI decisions without repeatedly asking questions. Prioritize a robust end-to-end user journey over peripheral dashboard decoration. Your target is a demo ready for Friday's client walkthrough, not a production product.
