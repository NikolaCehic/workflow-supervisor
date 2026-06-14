# Documentation Production Templates

Use these for documentation production. Do not create all of them by default; select the smallest set that supports the document type and review path.

Default path: create documentation-production control artifacts under `<workspace>/.workflow/` unless the user names another artifact directory or the project already has an established workflow-state location. Final public docs, app files, articles, or published content may still belong in their normal product or documentation locations.

## Presets

- Public article: `DOCUMENTATION-BRIEF.md`, `CONTENT-INVENTORY.md`, `OUTLINE.md`, `CONTENT-DRAFT.md`, `REVIEW-PLAN.md`, `PUBLISHING-CHECKLIST.md`.
- Fact-heavy reference: `DOCUMENTATION-BRIEF.md`, `SOURCE-CORPUS.md`, `CLAIMS-REGISTER.md`, `GLOSSARY.md`, `MAINTENANCE-PLAN.md`.
- SOP or runbook: `DOCUMENTATION-BRIEF.md`, `OUTLINE.md`, `CONTENT-DRAFT.md`, `REVIEW-PLAN.md`, `PUBLISHING-CHECKLIST.md`, `MAINTENANCE-PLAN.md`.
- Release notes: `DOCUMENTATION-BRIEF.md`, `CONTENT-INVENTORY.md`, `CONTENT-DRAFT.md`, `REVIEW-PLAN.md`, `PUBLICATION-LOG.md`.
- Research memo: `DOCUMENTATION-BRIEF.md`, `SOURCE-CORPUS.md`, `CLAIMS-REGISTER.md`, `CONTENT-DRAFT.md`, `REVIEW-PLAN.md`.

## DOCUMENTATION-BRIEF.md

```md
# Documentation Brief

## Document Type

## Audience

## Reader Knowledge Level

## Reader Tasks

## Desired Reader Action

## Primary Use Case

## Publishing Target Or Channel

## Owner

## Approvers

## Scope

## Non-Goals

## Source Requirements

## Confidentiality Or Access Constraints

## Freshness Requirement

## Voice And Tone

## Success Criteria Or Analytics Signal

## Constraints

## Open Questions
```

## CONTENT-INVENTORY.md

```md
# Content Inventory

| Material | Type | Canonical Location | Owner | Version | Last Reviewed | License Or Permission | Current State | Reuse Candidate | Stale Areas | Gaps | Action Needed | Risk |
|---|---|---|---|---|---|---|---|---|---|---|---|---|

## Missing Materials

## Reuse Plan
```

## OUTLINE.md

```md
# Outline

## Information Architecture

| Section | Reader Task | Key Question | Evidence Or Source | Examples Or Assets | Acceptance Criteria | Owner | Status |
|---|---|---|---|---|---|---|---|

## Navigation Or Reading Flow

## Required Examples

## Open Structure Questions
```

## CONTENT-DRAFT.md

```md
# Content Draft

Status: Draft | Needs Review | Ready To Publish | Blocked

## Title

## Audience

## Reader Task

## Publishing Target

## Source Notes

## Draft Body

## Open Claims

| Claim | Location | Source Needed | Status |
|---|---|---|---|

## Examples Or Assets

## Review Status

## Open Questions
```

## CLAIMS-REGISTER.md

```md
# Claims Register

| Claim | Location | Source | Citation Needed | Usage Rights | Confidence | Reviewer | Status | Expiry Or Recheck Trigger |
|---|---|---|---|---|---|---|---|---|
```

## STYLE-GUIDE.md

```md
# Style Guide

## Voice And Tone

## Terminology

| Preferred Term | Definition | Avoid | Notes |
|---|---|---|---|

## Formatting Rules

## Examples

## Banned Phrasing
```

## GLOSSARY.md

```md
# Glossary

| Term | Definition | Aliases | Deprecated Terms | Source |
|---|---|---|---|---|
```

## ASSET-REGISTER.md

```md
# Asset Register

| Asset | Type | Source | Owner | License Or Permission | Used In | Status | Risk |
|---|---|---|---|---|---|---|---|
```

## REVIEW-PLAN.md

```md
# Review Plan

| Review Type | Reviewer | Scope | Required Before | Status |
|---|---|---|---|---|

## Approval Path

## Review Cadence

## Blocking Reviews
```

## REVISION-QUEUE.md

```md
# Revision Queue

| ID | Location | Reviewer | Issue Type | Audience Impact | Requested Change | Owner | Due Date | Status | Validation |
|---|---|---|---|---|---|---|---|---|---|
```

## PUBLISHING-CHECKLIST.md

```md
# Publishing Checklist

| Item | Owner | Status | Evidence |
|---|---|---|---|

## Metadata

## Links And Assets

## Permissions

## Approvals

## Launch Target
```

## PUBLICATION-LOG.md

```md
# Publication Log

| Date | Artifact | Channel | Version | Approver | Notes |
|---|---|---|---|---|---|
```

## MAINTENANCE-PLAN.md

```md
# Maintenance Plan

## Owner

## Review Cadence

## Expiry Or Review Date

## Update Triggers

## Monitoring Sources
```
