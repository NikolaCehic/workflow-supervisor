# Goal And Resume Templates

Use these only for Codex goal mirroring, active-goal conflicts, or resume packs.

## Contents

- Goal-aware workflow and outcome fields
- Canonical `GOAL-STATE.md`
- Human-decision resume rule

Default path: create `GOAL-STATE.md` and goal-aware workflow artifacts under `<workspace>/.workflow/` unless the user provides another artifact directory or the project already has an established workflow-state location.

In Git-backed codebases, inspect ignore conventions first. When local mutation is authorized, ensure `.workflow/` is ignored before creating local state; otherwise keep the goal mirror inline or use an already-ignored location. Do not stage or publish workflow state unless explicitly selected as a final deliverable.

## Goal-Aware WORKFLOW.md Fields

```md
## Goal Binding

- Goal Binding: created | reused | skipped | unavailable | conflict
- Goal Status: active | complete | blocked | blocked old | unknown
- Last Goal Tool Action: get_goal | create_goal | update_goal | none
- Next Allowed Goal Action:
- Goal Objective:
- Previous Blocked Goal Reference:
- Human Decision Needed:
- Human Decision Answer:
- Resume From:
- Artifacts To Refresh:
- Stale Artifacts Invalidated:
```

## Goal-Aware OUTCOME.md Fields

```md
Goal Binding: created | reused | skipped | unavailable | conflict
Goal Status: active | complete | blocked | blocked old | unknown
Last Goal Tool Action: get_goal | create_goal | update_goal | none
Next Allowed Goal Action:
Previous Blocked Goal Reference:
Resume From:
Human Decision Resume Status:
```

## GOAL-STATE.md

```md
# Goal State

## Objective

## Goal Binding

created | reused | skipped | unavailable | conflict

## Goal Status

active | complete | blocked | blocked old | unknown

## Why A Goal Was Created Or Skipped

## Previous Blocked Goal

Goal Reference:

Reason:

Use As History Only: yes | no

## Active Goal Conflict

## Last Tool Action

get_goal | create_goal | update_goal | none

## Next Allowed Goal Action

## Last Evidence

## Current Work Unit

## Current Blocker

## Human Decision Needed

Question:

Smallest Sufficient Answer:

## Human Decision Answer

Answer:

Decision Type: clarification | scope change | requirement waiver | explicit deferral | blocker resolution | final disposition | intake change | workflow cancellation

## Resume Checkpoint

Last Completed Step:

Next Action:

Artifacts To Refresh:

Stale Artifacts Invalidated:

## Completion Rule

## Blocked Rule

## Resume Instructions
```

## Human Decision Resume Rule

When a workflow pauses for a human answer, record the blocker before asking. After the answer arrives, update the decision log, SPEC Q&A, coverage dispositions, and goal mirror before continuing. Resume from the recorded next action and re-run only affected downstream steps. Do not restart routing or unrelated work unless the answer changes the objective or governing boundaries. If the previous Codex goal is terminal blocked and cannot be reopened, keep that goal reference as history and continue with workflow docs or a newly authorized goal binding.
