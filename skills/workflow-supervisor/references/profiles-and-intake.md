# Profiles, Defaults, And Authority

Use this reference only when profile routing or authority boundaries are unclear.

## Profile Decision

Choose from evidence already present:

| Signal | Profile |
|---|---|
| Bounded backlog, repeated pure units, targeted checks | `lean_work_unit_runner` |
| Material ambiguity, source conflict, risky mutation, delegation, external system, or publication | `strict_full_workflow` |
| No implementation requested | `planning_only` |

If one unit becomes risky, escalate that unit rather than converting an otherwise valid lean backlog wholesale.

## Safe Inference

The supervisor may infer:

- the lightest profile supported by the task
- sequential mode when overlap is unknown
- safe parallel read-only exploration
- same-session work or available workers according to environment policy
- local-only disposition when publication was not requested
- inline state for short work and a compact ledger for long bounded work
- targeted verification appropriate to the changed behavior

Select `execution_path: autonomous_goal` when uninterrupted execution is authorized inside the current scope. Select `execution_path: human_in_loop` when the user, law, policy, or controlling source requires named checkpoints. Neither path supplies consequential authority.

The supervisor must label meaningful assumptions and revise them if source evidence disagrees.

## Material Questions

Ask when an answer changes one of these:

- the controlling source or intended outcome
- current scope versus explicit deferral
- allowed mutable surface
- use of credentials, paid services, production, or destructive operations
- public or external disposition
- a human approval required by law, policy, or the user
- a cost, time, or visibility tradeoff the user should choose

Offer 2-3 concrete options when possible. Ask one compact packet only when several decisions are simultaneously blocking; otherwise ask the smallest single question.

## Authorization Rules

Natural language can be explicit. “Work autonomously until done” selects autonomous continuation within already authorized scope. “Keep changes local” selects local disposition. “Use your judgment” permits safe reversible implementation choices. None authorizes publication, credentials, destructive operations, external messages, paid actions, or scope expansion.

If no external disposition is requested, finish with verified local changes and report that publication was not performed.
