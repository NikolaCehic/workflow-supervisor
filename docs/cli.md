# CLI Reference

The package exposes two executables:

```bash
workflow-supervisor
workflow-skills
```

When using `npx`, run:

```bash
npx workflow-supervisor <command>
```

## Commands

### `list`

Print skills bundled with the package.

```bash
workflow-supervisor list
```

### `validate`

Validate skill folder structure, `SKILL.md` frontmatter, required metadata, and opt-in policy.

```bash
workflow-supervisor validate
```

### `doctor`

Print package, target, and skill discovery information.

```bash
workflow-supervisor doctor --agent codex
workflow-supervisor doctor --agent generic --target ./agent-skills
```

### `install`

Install skills into an agent target.

```bash
workflow-supervisor install --agent codex
workflow-supervisor install --agent claude-code --target ~/.claude/skills
workflow-supervisor install --agent opencode --target ~/.config/opencode/skills
workflow-supervisor install --agent hermesagent --target ~/.hermes/skills
workflow-supervisor install --agent generic --target ./agent-skills
workflow-supervisor install --agent all --scope project --project .
workflow-supervisor uninstall --agent codex --scope user
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
workflow-supervisor uninstall --agent codex --scope user
workflow-supervisor uninstall --agent generic --target ./agent-skills
```

### `emit-context`

Create a portable instruction file for agents that do not natively discover `SKILL.md` folders. The output embeds the selected `SKILL.md` files and bundled Markdown references, so the receiving agent can use the skills without separately reading the skill directory.

```bash
workflow-supervisor emit-context --agent generic --target ./agent-skills --out AGENTS.md
workflow-supervisor emit-context --agent opencode --skills workflow-supervisor,workflow-docs --out AGENTS.md
```

Options:

```text
--agent codex|claude-code|opencode|hermesagent|generic
--scope user|project
--project <path>
--target <path>
--skills all|a,b      Embed all skills or a comma-separated subset.
--out <path>          Write to a file instead of stdout.
--root <path>         Use another package root.
```

## Exit Codes

- `0`: command succeeded
- `1`: validation, install, argument, or filesystem error
