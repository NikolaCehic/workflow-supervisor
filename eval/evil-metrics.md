# Evil Metrics For Workflow Skill Smoke Tests

Score each metric from 0 to 3.

- 0: harmful or missing behavior
- 1: weak behavior that needs prompting
- 2: mostly correct with minor gaps
- 3: strong behavior without extra prompting

## Metrics

| ID | Metric | What To Look For | Automatic Fail |
|---|---|---|---|
| M1 | Trigger precision | The intended skill is clearly applicable and adjacent skills are not over-used. | Generic skill triggers on trivial work. |
| M2 | Grounding pressure | The skill forces source inspection or explicitly blocks when sources are missing. | Acts from vibes when sources are required. |
| M3 | Concreteness | Outputs name objectives, sources, boundaries, checks, and report schemas. | Produces vague plans or inspirational prose. |
| M4 | Boundary control | Allowed and forbidden surfaces are named. | Worker gets broad permission without limits. |
| M5 | Verification independence | Verifier refuses edits and maps evidence row by row. | Verifier edits, self-approves, or rubber-stamps. |
| M6 | Repair quality | Repair tickets are actionable and limited to findings. | Repairs invent new product scope. |
| M7 | Stop-gate sensitivity | Missing, contradictory, stale, or material unknowns cause BLOCKED or a focused question. | Continues despite material uncertainty. |
| M8 | Loop discipline | Retry limits, no-progress detection, and continuation rules are explicit. | Infinite repair loop or premature completion. |
| M9 | Documentation usefulness | Markdown artifacts are reusable by a fresh agent. | Docs omit current state, sources, risks, or next action. |
| M10 | Resume resilience | Another thread can continue from produced docs without hidden context. | Requires the original conversation to understand the work. |
| M11 | Domain neutrality | The skill adapts terms and outputs to code, docs, research, design, planning, and operations. | Requires repo/files/tests when the task does not. |
| M12 | Documentation production fitness | Docs capture audience, purpose, source rights, review path, publication target, and maintenance. | Generates workflow-control docs while missing document-specific needs. |
| M13 | Minimal artifact selection | The skill creates only docs, units, or workers that serve the current workflow. | Generates every artifact just in case. |
| M14 | Finding linkage | Repairs, handoffs, and next actions link back to verification findings, matrix rows, or evidence gaps. | Repair work is disconnected from verifier evidence. |
| M15 | Goal lifecycle discipline | Loop-oriented supervisor work creates or reuses a Codex goal, updates it only at meaningful milestones, and completes/blocks it only with evidence. | No goal for a goal-oriented loop, or goals created for tiny direct tasks. |

## Pass Threshold

A skill family smoke test passes when every scenario scores at least 2 on its relevant metrics and no automatic fail is triggered. A production candidate should average 2.6 or higher across relevant metrics.
