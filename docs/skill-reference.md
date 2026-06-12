# Skill Reference

## `workflow-supervisor`

Coordinate explicit supervised or agent-loop workflows. It binds Codex goals only when the user or environment authorizes goal-oriented work, checks active goal state first, and avoids unrelated active-goal collisions.

## `source-corpus`

Rank and reconcile sources when authority, freshness, contradictions, access rights, or evidence gaps change the safe next action. It supports `allowed_next_action`: discovery, provisional draft, production change, or blocked.

## `work-unit`

Split broad work into bounded units with objective, scope, dependencies, readiness, done criteria, verification, sequencing, and parallel-safety notes.

## `dossier-builder`

Create a handoff contract for one already-bounded work unit. Use it for another agent, thread, future session, or formal worker prompt, not ordinary same-thread direct work.

## `worker-roles`

Define role contracts and solo-mode phase separation. It prevents role bleed: verifiers editing implementation, implementers self-approving, and repair authors inventing new scope.

## `acceptance-matrix`

Create formal evidence-mapped acceptance rows for high-risk, supervised, ambiguous, resumable, or handoff workflows.

## `loop-policy`

Define execution mode, approval gates, repair limits, parallel safety, no-progress rules, and Codex goal tool policy.

## `workflow-docs`

Create durable workflow-state or documentation-production artifacts. It supports Markdown, inline briefs, tickets, design annotations, runbooks, decision logs, and other usable state media.
