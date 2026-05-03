---
name: kursach-project-workflow
description: Manages the project workflow through AIInfo files, priorities, open questions, and completed-task tracking. Use when planning, implementing, or documenting work in this repository.
---

# Kursach Project Workflow

## When to use
- Use this skill for any task in this repository.
- Use this skill before implementation planning or code edits.

## Required inputs
- `AGENT.md`
- `AIInfo/Backend/ansvers.txt`
- `AIInfo/Frontend/ansvers.txt`
- `AIInfo/Docks/ansvers.txt`
- `AIInfo/Backend/Tasks/firstPriority.txt`
- `AIInfo/Backend/Tasks/secondPriority.txt`
- `AIInfo/Backend/Tasks/thirdPriority.txt`
- `AIInfo/Frontend/Tasks/firstPriority.txt`
- `AIInfo/Frontend/Tasks/secondPriority.txt`
- `AIInfo/Frontend/Tasks/thirdPriority.txt`
- `AIInfo/doneTasks.txt`
- `AIInfo/Backend/DebugResult.txt`
- `AIInfo/Frontend/DebugResult.txt`

## Workflow
1. Read current open questions and priorities.
2. If a question is already answered by the user, remove it from `ansvers.txt`.
3. Add new questions only if they block or improve implementation quality.
4. Execute tasks by priority order:
   - firstPriority.txt
   - secondPriority.txt
   - thirdPriority.txt
5. After finishing a task, append a short entry to `AIInfo/doneTasks.txt`.
6. Never edit `DebugResult.txt`; these files are user-managed.
7. Before coding, ensure all gating checks pass:
   - all task questions answered,
   - no other active unfinished task,
   - `DebugResult.txt` files are empty.
8. Execution order:
   - Backend first, then Frontend.
   - Priority 2 only after Priority 1 has no pending tasks.
   - Priority 3 only after Priority 1 and Priority 2 are clear.
9. If new higher-priority task appears during current work:
   - finish current task safely,
   - move to higher-priority task next.

## Decision policy
- If the user says "на твое усмотрение", choose by:
  - low complexity
  - high user value
  - low regression risk

## Constraints
- Frontend: user-visible strings use i18n (`useTranslation`, `lib/i18n/messages/en.ts` + `ru.ts`); keep keys aligned.
- Do not modify application code before understanding current behavior.
- Follow SOLID and KISS.
- Avoid useless comments.
- Do not add code comments unless user explicitly asks.
- If comment is explicitly requested, prefer `TODO:` markers.

## VERY IMPORTANT RULE
- Every new persistent project rule must be added to `AGENT.md` and/or this skill file immediately.
- Do not rely on chat-only memory for long-term rules.
- Implementation is forbidden while gating checks fail.
