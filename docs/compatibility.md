# Agent Compatibility

The built-in support set is intentionally small: Codex and Claude Code for automated delegation, plus `generic` for emitting or installing Markdown instructions into a custom directory.

## Skills And Workers

Loading a skill does not spawn a worker, thread, or subagent. A skill is instruction context for the current agent until the supervisor uses an approved delegation mechanism.

`$workflow-supervisor` can plan role-scoped workers after objective, sources, boundaries, acceptance, authority, and report contract are concrete. The portable mechanism is the one-shot `workflow-supervisor delegate` command described in [portable-delegation.md](portable-delegation.md). Native workers are valid optimizations when the environment exposes them; use only lifecycle operations actually present in that environment.

Delegated dossiers use a human-facing `display_role` plus the canonical machine `worker_role` (`implementer`, `verifier`, `repair`, or `documenter`), `boundary_kind`, a non-empty authority list, and `authority_source` pointing to the granting user, policy, or artifact. Read-only Approver workers can recommend or report a designated authority's decision; persisting it requires a separately authorized documenter, and neither role creates authorization.

## Codex

Codex support is native:

- each skill has `SKILL.md`
- each skill has `agents/openai.yaml`
- all skills are explicit opt-in; invoking `$workflow-supervisor` routes proportionally and companion skills remain optional phase tools
- `$workflow-supervisor`, `$loop-policy`, and `$workflow-docs` include Codex goal lifecycle rules

Install:

```bash
npx workflow-supervisor install --agent codex --scope user
npx workflow-supervisor install --agent codex --scope project --project .
```

Use:

```text
Use $workflow-supervisor to supervise this migration, infer safe local defaults, and ask only for material missing authority or scope decisions.
```

## Claude Code

Claude Code support uses the same `SKILL.md` folders and the `claude` CLI for one-shot delegated workers.

```bash
npx workflow-supervisor install --agent claude-code --scope user
npx workflow-supervisor install --agent claude-code --scope project --project .
```

If native discovery is unavailable, emit a context file:

```bash
npx workflow-supervisor emit-context --agent claude-code --skills workflow-supervisor,workflow-docs --out CLAUDE.md
```

Codex goal APIs degrade to `.workflow/GOAL-STATE.md` and workflow docs.

## Generic Agent

Use `generic` only for Markdown instruction export or installation into a custom directory. It is not an automated delegation adapter.

```bash
npx workflow-supervisor install --agent generic --target ./agent-skills
npx workflow-supervisor emit-context --agent generic --skills workflow-supervisor,workflow-docs --out AGENTS.md
```

Then point the receiving agent at `./agent-skills/WORKFLOW_SKILL_PACK.md`, the individual `SKILL.md` files, or the emitted context file.
