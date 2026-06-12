# Productionization Plan

## Package Shape

- Canonical skills live in `skills/<skill-name>/SKILL.md`.
- Agent adapter metadata lives in `adapters/<agent>/adapter.json`.
- The CLI lives at `bin/workflow-skills.mjs` and is exposed as `workflow-skills`.
- Evaluation assets live in `eval/`; runtime smoke tests live in `test/`.
- Prototype scratch folders are ignored and excluded from the npm package.

## Install Targets

| Agent | User Scope | Project Scope |
|---|---|---|
| Codex | `~/.agents/skills` | `<project>/.agents/skills` |
| Claude Code | `${CLAUDE_HOME:-~/.claude}/skills` | `<project>/.claude/skills` |
| OpenCode | `${OPENCODE_HOME:-~/.config/opencode}/skills` | `<project>/.opencode/skills` |
| HermesAgent | `${HERMESAGENT_HOME:-${HERMES_HOME:-~/.hermes}}/skills` | `<project>/.hermes/skills` |
| Generic | custom `--target` | custom `--target` |

Project-scope HermesAgent is a package convention for portable local bundles. Use `--target` when a Hermes setup expects another path.

## Local Release Candidate

```bash
npm run validate
npm run validate:tests
npm test
npm run pack:dry
npm pack
```

Validate the packed tarball, not only the checkout:

```bash
tmpdir=$(mktemp -d)
npm pack --pack-destination "$tmpdir"
tar -xzf "$tmpdir"/workflow-skill-pack-*.tgz -C "$tmpdir"
cd "$tmpdir/package"
npm run validate
npm run validate:tests
npm test
python3 eval/static_validate.py
```

## Publish Path

1. Confirm package name or choose a scoped package name.
2. Run all release candidate checks.
3. Install into a temporary project with `workflow-skills install --agent all --scope project --project <tmp-project>`.
4. Confirm each target has all eight skills, `WORKFLOW_SKILL_PACK.md`, and `.workflow-skills-install.json`.
5. Run fresh-thread adversarial prompts from `eval/smoke-prompts-only.md`.
6. Score results with `eval/smoke-answer-key.md` and `eval/evil-metrics.md`.
7. Publish only when no automatic fail remains and relevant metrics meet the bar in `docs/evaluation.md`.

## Non-Negotiable Gates

- Every skill passes skill-creator validation.
- Packaged tarball passes validation from a fresh extraction.
- Tests and answer keys are never installed into agent skill directories.
- Skills stay explicit and opt-in until trigger precision is proven.
- Supervisor goal binding is used only for open-ended or explicit agent-loop work.
- Workflow docs must be reusable by a fresh agent after context loss.
