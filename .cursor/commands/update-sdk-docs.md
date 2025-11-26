# Auto-update SDK Docs

Use this command when an SDK ships a new version and the docs need to be updated to match. Invoke it as `update-sdk-docs <sdk> <new-version>`. Both the SDK and the new version must be provided.

## Required Inputs
1. `sdk` — One of `ios`, `android`, `flutter`, `expo`, `react-native`.
2. `newVersion` — The newly released version (e.g. `4.6.0`).

## Workflow
1. **Prep and validation**
   - Run `bun run download:references` to sync `reference/*` per `AGENTS.md`.
   - Define:
     - `overviewPath = content/docs/<sdk>/index.mdx`
     - `referenceOverviewPath = content/docs/<sdk>/sdk-reference/index.mdx`
   - Parse the `<SdkLatestVersion version="…">` value from each file. They must match; if they don't, fix them before proceeding. Save this value as `previousVersion`.
2. **Compute the code diff**
   - Map `sdk` to the repo inside `reference/<sdk>/` (see `scripts/download-references.ts`).
   - Inside that repo:
     1. `git fetch --tags`.
     2. Build tag names for both versions (`previousVersion`, `newVersion`).
        - Note: expo uses a `v` prefix for tags (e.g. `v0.1.3`), the rest of the SDKs do not (e.g. `4.5.2`)
     3. Capture release context:
        - `git log --oneline <prevTag>..<newTag>`
        - `git diff --stat <prevTag>...<newTag>`
        - `git diff <prevTag>...<newTag> > /tmp/sdk.diff`
        - Extract the matching section from `CHANGELOG.md` or `RELEASE_NOTES`
          for `<newVersion>`.
   - Study the diff to understand what public APIs, behaviors, guides, or configuration steps changed.
   - Draft a checklist of doc updates needed before editing anything.
3. **Update the docs**
   - Make the checklist happen inside `content/docs/<sdk>/…`, keeping the authoring rules from `content/README/AGENTS.md` in mind (H2s only, `<Tabs>` sparingly, callouts at top, navigation via `meta.json`, etc.).
   - Examples of common edits:
     - Add or update API reference pages under `sdk-reference/`.
     - Revise quickstart/install instructions when setup steps changed.
     - Update guides to cover new features or breaking changes.
     - Adjust code snippets to match the latest API surface.
   - Keep the checklist updated as you make each change; mention reasoning for
     every change in the eventual PR body.
   - Update `<SdkLatestVersion …>` in both overview files to `newVersion`.
4. **Verification**
   - Run `bun run build` from the repo root to ensure the docs compile.
   - If you touched mdx formatting, run the formatter (e.g. `bunx prettier --write` on the modified files).
   - Re-run `git status` to ensure only intended files changed.
5. **Commit and PR**
   - Create a branch named `docs/<sdk>-<newVersion>` (strip dots if your git setup disallows them).
   - Commit with `docs(<sdk>): update for <newVersion>`.
   - Push the branch and open a PR (`gh pr create --title "docs(<sdk>): update
     for <newVersion>" --body "<summary>"`). The body should include:
       - The old vs new version.
       - Links to the upstream diff/tag and changelog entry.
       - A checklist of documentation updates that were performed.
       - Any manual follow-up items (e.g., dashboard screenshots still pending).
   - Post the PR URL in the final response along with testing/build output.

## Deliverables in Final Reply
- Link to the PR and the diff/tag you used.
- Summary of key documentation changes grouped by doc section.
- Explicit callout of any remaining tasks or unanswered questions.
- Confirmation that `bun run build` (and any other commands you ran) passed.

