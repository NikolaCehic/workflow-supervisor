# Security Policy

Workflow Supervisor launches local agent CLIs and evaluates model-produced data around a user-controlled workspace. Security reports are welcome, especially where an untrusted task, worker output, path, environment variable, or installed skill can cross an authority boundary.

## Supported Versions

| Version | Security support |
|---|---|
| `1.0.x` | Supported. |
| Latest `0.x` package release | Critical fixes only during the v1 migration window. |
| Older releases | Not supported. Upgrade before reporting a version-specific issue. |

GitHub releases and npm publication are separate events. Confirm the code you are running with both `workflow-supervisor --version` and the package source from which it was installed.

## In Scope

Examples include:

- command or argument injection in CLI adapters
- path traversal, symlink, hard-link, or mutation-guard bypasses
- credential or sensitive-environment leakage
- unsafe installation, overwrite, ownership, or uninstall behavior
- malformed contract or worker output that is accepted as valid
- false `PASS` results caused by a validation or evidence-mapping defect
- privilege or authority escalation caused by packaged instructions or runtime code
- sensitive data written to logs, diagnostics, generated context, or reports

The following are not security boundaries provided by this project:

- model instructions by themselves
- the post-run mutation guard as a substitute for an operating-system sandbox
- authentication, isolation, or permission guarantees of Codex, Claude Code, Node.js, Git, or the host operating system
- arbitrary third-party adapters or modified copies of the package

A weakness in one of those dependencies can still be relevant when Workflow Supervisor uses it unsafely. Explain the project-specific impact in the report.

## Reporting A Vulnerability

Do not disclose exploit details, secrets, or affected user data in a public issue.

1. If the repository Security tab offers **Report a vulnerability**, use that private GitHub channel.
2. If it is unavailable, open a minimal [security contact request](https://github.com/NikolaCehic/workflow-supervisor/issues/new) addressed to repository owner [Nikola Cehic (`@NikolaCehic`)](https://github.com/NikolaCehic). Include no exploit details. The maintainer will arrange a private follow-up channel.
3. Include the affected version or commit, operating system, Node version, agent CLI and version, reproduction steps, impact, and any proposed mitigation in the private report.

The project currently publishes no dedicated security email address and does not run a bug-bounty program. Please do not send reports to an address inferred from commits, npm metadata, or unrelated accounts.

## Response And Disclosure

This is a maintainer-run open-source project without a response-time guarantee. The project aims to:

- acknowledge a complete report within seven days
- provide an initial assessment within fourteen days
- keep the reporter informed when the assessment or fix timeline changes
- credit the reporter if requested and safe to do so

Please allow a reasonable remediation window before public disclosure. The maintainer and reporter should coordinate the advisory, fix, release notes, and publication timing. A GitHub release does not imply that a patched npm package has also been published.

## Safe Research

Test only systems and data you own or are authorized to use. Avoid privacy violations, service disruption, persistence, destructive actions, social engineering, and access to other users' data. Stop after demonstrating the minimum evidence needed to explain the issue.
