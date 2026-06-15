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

## An existing skill folder blocks install

Use:

```bash
workflow-skills install --agent codex --force
```

Use `--dry-run` first if you want to inspect the target.
