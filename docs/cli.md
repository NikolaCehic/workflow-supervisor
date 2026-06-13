# CLI Reference

The package exposes one executable:

```bash
workflow-skills
```

When using `npx`, run:

```bash
npx workflow-skill-pack <command>
```

## Commands

### `list`

Print skills bundled with the package.

```bash
workflow-skills list
```

### `validate`

Validate skill folder structure, `SKILL.md` frontmatter, required metadata, and opt-in policy.

```bash
workflow-skills validate
```

### `doctor`

Print package, target, and skill discovery information.

```bash
workflow-skills doctor --agent codex
workflow-skills doctor --agent generic --target ./agent-skills
```

### `install`

Install skills into an agent target.

```bash
workflow-skills install --agent codex
workflow-skills install --agent claude-code --target ~/.claude/skills
workflow-skills install --agent opencode --target ~/.config/opencode/skills
workflow-skills install --agent hermesagent --target ~/.hermes/skills
workflow-skills install --agent generic --target ./agent-skills
workflow-skills install --agent all --scope project --project .
workflow-skills uninstall --agent codex --scope user
```

Options:

```text
--agent codex|claude-code|opencode|hermesagent|generic|all
--scope user|project  Install to user-level or project-level location where supported.
--project <path>      Project root for project-scope installs.
--target <path>       Override install directory. Required for generic.
--skills all|a,b      Install all skills or a comma-separated subset.
--force               Replace existing installed skill folders.
--dry-run             Validate and print intended action without writing.
--root <path>         Use another package root.
```

Default targets:

| Agent | Scope | Default |
|---|---|---|
| Codex | user | `~/.agents/skills` |
| Codex | project | `<project>/.agents/skills` |
| Claude Code | user | `${CLAUDE_HOME:-~/.claude}/skills` |
| Claude Code | project | `<project>/.claude/skills` |
| OpenCode | user | `${OPENCODE_HOME:-~/.config/opencode}/skills` |
| OpenCode | project | `<project>/.opencode/skills` |
| HermesAgent | user | `${HERMESAGENT_HOME:-${HERMES_HOME:-~/.hermes}}/skills` |
| HermesAgent | project | `<project>/.hermes/skills` |
| Generic | any | requires `--target` |

HermesAgent project scope is a package-local convention for portable installs. Use `--target` if your HermesAgent setup expects another directory.

### `uninstall`

Remove installed skill folders and package context files.

```bash
workflow-skills uninstall --agent codex --scope user
workflow-skills uninstall --agent generic --target ./agent-skills
```

### `emit-context`

Create a portable instruction file for agents that do not natively discover `SKILL.md` folders.

```bash
workflow-skills emit-context --agent generic --target ./agent-skills --out AGENTS.md
workflow-skills emit-context --agent opencode --out AGENTS.md
```

## Exit Codes

- `0`: command succeeded
- `1`: validation, install, argument, or filesystem error
