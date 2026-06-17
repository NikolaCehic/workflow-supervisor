# Troubleshooting

## The skills trigger too often

Keep `policy.allow_implicit_invocation: false`. Use explicit `$skill-name` invocation until live routing tests prove trigger precision.

## The agent cannot find the skills

Run:

```bash
workflow-skills doctor --agent codex
workflow-skills install --agent generic --target ./agent-skills --dry-run
```

Then verify the target directory contains folders such as `workflow-supervisor/SKILL.md`.

## Goal tools are unavailable

Use `.workflow/GOAL-STATE.md` or a workflow continuation document. The supervisor skill explicitly falls back to workflow docs when goal tools are unavailable or not permitted.

## Too many docs are created

Use `$workflow-docs` with a minimal artifact request. The skill must reject "create every document just in case."

## Verification rubber-stamps the result

Use `$acceptance-matrix` for formal evidence rows. A PASS requires row-by-row evidence or explicit waiver evidence.

## A broad roadmap becomes one giant work unit

Use the source-requirement coverage gate before work-unit finalization. Every material roadmap item, exit criterion, named integration, and numeric target should be mapped to a unit and acceptance row, explicitly deferred by the user, blocked for a decision, or marked non-material with a reason. Do not accept "future work" or residual risk notes as a substitute for work units.

## Residual risks contain required work

Treat this as FAIL or BLOCKED. Residual risks may describe remaining uncertainty after acceptance, but they must not contain unimplemented material source requirements, skipped mandatory checks, or source-of-truth deliverables that were quietly downgraded.

## An existing skill folder blocks install

Use:

```bash
workflow-skills install --agent codex --force
```

Use `--dry-run` first if you want to inspect the target.
