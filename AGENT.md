# AGENT Configuration (Kursach)

## Purpose
- This file defines persistent workflow rules for this repository.
- It is used together with files in `AIInfo`.

## Core Process
1. Before implementation, read current context in:
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
2. Any work starts with priorities:
   - Priority 1: implement first.
   - Priority 2: required, but after Priority 1.
   - Priority 3: optional.
3. Do not change application code until architecture and current behavior are understood.
4. After each completed task, update `AIInfo/doneTasks.txt`.
5. Before starting any implementation, always check:
   - `AIInfo/Backend/DebugResult.txt`
   - `AIInfo/Frontend/DebugResult.txt`
6. `DebugResult.txt` files are user-managed only:
   - do not edit,
   - do not delete content from them.
7. Work order:
   - Backend first, then Frontend.
   - Priority 2 starts only when Priority 1 has no pending tasks.
   - Priority 3 starts only when Priority 1 and Priority 2 have no pending tasks.
8. If a higher-priority task appears during current implementation:
   - finish current task safely,
   - switch to the new higher-priority task next.

## Decision Rule
- If user says "на твое усмотрение", choose by:
  - low implementation complexity
  - high practical value
- Prefer simple, robust solutions (KISS) and clear responsibilities (SOLID).

## Communication Rule
- Keep open questions only in `ansvers.txt` files.
- Remove questions that were already answered by the user.
- Add only actionable questions that affect architecture, security, UX, or implementation order.
- For each active task, keep all unresolved clarifications in the corresponding `ansvers.txt`.

## Implementation Gating (VERY IMPORTANT)
- Do not start implementation if at least one condition is true:
  1) Not all questions for the current task are answered.
  2) Another task is currently active and not finished, unless user explicitly says to pause it.
  3) `DebugResult.txt` contains unresolved items.
- If any condition is true, report blocker and ask for clarification instead of coding.

## Frontend i18n
- UI strings for new/changed screens go through `useTranslation()` / `I18nProvider`.
- Add keys to `GuitarNotepadFrontend/lib/i18n/messages/en.ts` and matching entries in `ru.ts` (`MessageKey` must stay in sync).

## Comment Policy (VERY IMPORTANT)
- Do not add code comments by default.
- Add comments only if user explicitly requests.
- If user asks to keep a marker comment, use `TODO:` format for quick search.

## VERY IMPORTANT RULE
- Every new persistent project rule MUST be written to this file (`AGENT.md`) and/or to the project skill file `./.cursor/skills/kursach-project-workflow/SKILL.md` immediately.
- Do not keep long-term rules only in chat history.
