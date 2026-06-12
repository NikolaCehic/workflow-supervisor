---
name: workflow-supervisor
description: Coordinate open-ended, multi-step agent workflows when the user explicitly requests supervised or agent-loop coordination and at least one hard trigger is present, or when no explicit supervisor wording exists but two or more hard triggers are present. Hard triggers include multi-agent handoff, durable resume need, high-risk independent verification, contradictory or missing sources, multi-unit scope, repair loops, approval gates, or workflow-state documentation. Do not use for simple single-turn answers, ordinary repo inspection, medium scoped edits, typo fixes, one-off tests, or narrowly scoped changes that can be completed directly.
---

# Workflow Supervisor

Use this skill as the coordinating spine for complex work. The supervisor owns decomposition, handoff quality, loop discipline, stop gates, and outcome reporting. It may do source discovery and reporting itself, but implementation, verification, repair-ticket writing, and documentation should be treated as separate roles when the environment supports separate agents or threads.

## Domain Neutrality

This workflow must work without a repository, codebase, existing docs, or installed project conventions. Treat "surface" as any mutable target: files, documents, designs, datasets, decisions, prompts, workflows, tickets, configs, UI states, business processes, or research artifacts. Treat "check" as any evidence-producing method: tests, commands, inspections, rubrics, document diffs, stakeholder decisions, examples, screenshots, source citations, or manual verification.

When no source corpus exists, make the first work unit a discovery/intake unit instead of inventing prerequisites. Do not require `AGENTS.md`, a repo, commands, or Markdown files unless the specific task provides them or needs them.

## Codex Goal Lifecycle

This skill is loop-oriented. When the user invokes it for an open-ended supervised workflow and explicitly says goal, agent loop, long-running repair/verification cycle, or durable continuation, bind the workflow to a Codex goal when the environment supports goals and the governing instructions permit goal creation.

Use this lifecycle:

1. Call `get_goal` or the environment's equivalent first.
2. Classify goal state: `none`, `active relevant`, `active unrelated`, `complete old`, `blocked old`, or `tool unavailable`.
3. If an active relevant goal exists, reuse it.
4. If an active unrelated goal exists, do not create, reuse, complete, block, or update it. Ask the user whether to switch goals or continue with goal binding skipped.
5. If no active goal exists and the invocation explicitly asks for a goal or agent loop, or the governing environment says supervisor invocations should create goals, call `create_goal` at most once with a concrete objective.
6. Do not create a goal for simple single-turn answers, ordinary scoped edits, tiny tasks, or when the user says not to.
7. Keep the goal objective stable. Track tactical steps in the plan, dossier, workflow docs, or `GOAL-STATE.md` rather than trying to rewrite the goal.
8. Use `update_goal` only for terminal `complete` or `blocked` states when the environment supports that action.
9. Mark the goal complete only after acceptance evidence supports completion and no required supervisor work remains.
10. Distinguish workflow/unit BLOCKED from Codex goal blocked. Mark a Codex goal blocked only after the same material blocker repeats across the required consecutive goal turns and no meaningful progress remains.
11. On resume after compaction or handoff, read the active goal first, then reconcile workflow docs and current artifacts.

If the environment has no goal tool or goal creation is not permitted, state the intended goal objective in the supervisor report and continue with workflow docs or another state artifact as the fallback state container.

## Operating Contract

- Ground the workflow in sources before creating work units.
- Do not begin implementation until at least one concrete dossier exists.
- Keep roles separate: implementers implement, verifiers verify, repair authors write tickets, documenters update workflow artifacts, and the supervisor coordinates.
- Treat same-thread verification as a self-check, not independent verification.
- Prefer explicit PASS/FAIL/BLOCKED states over soft completion language.
- Stop instead of improvising when sources are missing, contradictory, materially stale, or too vague to produce acceptance criteria.
- Keep provenance optional; require enough outcome detail for another agent to resume.
- Treat companion skills as optional phase tools, not an automatic cascade. Use the smallest set needed for the current risk.

## Supervisor Loop

1. Restate the objective, constraints, non-goals, known sources, and unknowns.
2. Bind or reconcile the Codex goal when the invocation is goal/loop-oriented and no unrelated active goal prevents binding.
3. Build or request a source corpus map. Use `$source-corpus` when source authority, freshness, or contradictions matter.
4. Split the objective into bounded work units. Use `$work-unit` for ambiguous or multi-phase goals.
5. Choose a loop policy before starting work: sequential or parallel, retry limits, approval gates, budgets, goal update cadence, and blocker rules. Use `$loop-policy` when the policy is not obvious.
6. Build a dossier for the next work unit. Use `$dossier-builder` when handing work to another agent or when the task has boundaries.
7. Assign worker roles with explicit allowed and forbidden behavior. Use `$worker-roles` for multi-agent work.
8. Execute the work unit under the dossier.
9. Verify independently where possible. Use `$acceptance-matrix` to map every requirement to evidence.
10. If verification FAILs, convert findings into repair tickets and route them back to implementation. Do not expand scope during repair.
11. If verification BLOCKs, report the blocker and stop or ask for the missing decision.
12. Use `$workflow-docs` to create or refresh reusable Markdown artifacts when the workflow must persist across context loss, agents, or sessions.
13. Finish with an outcome report that names goal status, sources, work units, checks, skipped checks, residual risks, and next action.

## Minimum Dossier Gate

Do not hand off or implement a work unit unless the dossier can name:

- objective and non-goals
- source corpus used and missing
- allowed and forbidden surfaces or artifacts
- acceptance matrix or acceptance draft
- required checks or evidence
- adversarial checks
- stop gates
- worker report schema

Boundaries may be mutable artifacts, source claims, decisions, audiences, data fields, design areas, process steps, publication rights, or forbidden claims. For read-only advisory work, naming forbidden claims and decision limits can satisfy the boundary requirement.

If any item is unknown and material, stop and ask for the missing decision or mark the unit BLOCKED.

## Stop Gates

Stop when:

- source authority cannot be established
- sources contradict each other on a material requirement
- the requested scope cannot fit into a bounded work unit
- allowed and forbidden surfaces cannot be named
- acceptance cannot be verified with evidence
- a verifier is asked to edit or an implementer is asked to self-approve
- repair loops repeat without new evidence
- the user requires approval before continuing

## Final Report Shape

Report:

- Status: PASS, FAIL, BLOCKED, or PARTIAL
- Goal status and whether a Codex goal was created, reused, skipped, completed, or blocked
- Objective handled
- Sources used and gaps
- Work units completed or remaining
- Verification evidence
- Repairs performed or recommended
- Checks run and skipped
- Residual risks
- Resume point or next action
