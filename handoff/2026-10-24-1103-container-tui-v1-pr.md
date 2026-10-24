# Handoff: Container TUI v1 shipped to branch, PR pending

- **Date:** 2026-10-24 11:03 (local)
- **Project:** container-tui
- **Branch:** worktree-opentui-spike @ 76cde65 "Document v1 usage and building the binary"
- **Next session focus:** Continue main work

## Goal
Terminal UI for managing Apple `container` resources, built with Bun + TypeScript + OpenTUI React, compiled to one binary invokable from any terminal.

## State
- **Done:** Spike proving OpenTUI + `bun build --compile` + `exec -it` TTY handoff (ref: 28640b2).
- **Done:** v1 build: tabs (Containers/Images/Volumes/Networks), container start/stop/delete/logs/exec, delete on other tabs, 2s polling, status-line errors (ref: d936b71, 0f4f7e2, 76cde65).
- **In progress:** First PR into `main`. Branch is pushed and matches `origin/worktree-opentui-spike`. The PR is NOT opened yet: `gh` is not installed and no GitHub token is set. The user chose to open it by hand in the GitHub UI; PR title/description text was given in chat.
- **Not started:** Anything beyond v1 scope (run/create container, image pull, search/filter, bash shell option, stats).
- **Uncommitted changes:** None (only this handoff file, committed separately).

## Decisions
- Stay on OpenTUI React binding: no Svelte renderer exists for OpenTUI (React and Solid only); a Svelte renderer would cost more than the app. Solid was the alternative if switching.
- Selection tracked by container id, not index: `container list` order is not stable between calls.
- `exitOnCtrlC: false` in `src/index.tsx` so Ctrl+C uses the same clean quit as `q` (kills the log child process).
- Merge preference for the PR: merge commit (keep the 5 commits) and keep the branch; squash is acceptable if the user prefers.

## Dead ends
- Svelte for the UI: no binding or renderer on npm; faking a DOM relies on compiler internals and was rejected.
- First layout drew the list box at zero width: `select` has no natural width. Fixed with `minWidth: 40` on the list and `flexBasis: 0` on the log pane.
- Asserting full redraws in pty tests: OpenTUI diff-renders, so assert on content that must appear (the agent used pyte for real screen assertions).

## Open questions and blockers
- PR creation/merge: needs the user to open it in the GitHub UI, or install and sign in to `gh` (`brew install gh`, `gh auth login`, run via `!` in the prompt).
- Exec shell is hardcoded `sh` (`SHELL` constant in `src/app.tsx`): ask the user whether to default to `bash` or auto-detect.

## Next steps
1. Check whether the PR exists and is merged: `git fetch origin && git log --oneline origin/main -3`. If not, remind the user of the PR URL below (do not merge locally or push to `main`).
2. Once merged, ask the user which v2 features to prioritise (run/create container, image pull, search/filter, exec shell choice).
3. Known small issues to consider: containers list takes about half the width instead of a third; Volumes tab shows max size (`configuration.sizeInBytes`, 512 GiB) not used space; log stream exiting on its own with an error is untested.
4. Keep all `container` CLI knowledge in `src/cli.ts` (flags differ across releases, e.g. `--force` means different things on `delete` vs `image delete`).

## References
- PR URL (open manually): https://github.com/danieldanuega/container-tui/pull/new/worktree-opentui-spike
- `README.md`: usage, keys, build and install steps.
- `src/cli.ts`: the only module that shells out to `container`; JSON field notes (image name in `configuration.name`, network name is `id`, subnet in `status.ipv4Subnet`).
- `test/cli.test.ts` and `test/fixtures/*.json`: fixtures trimmed from real CLI output.
- Worktree path: `/Users/danieldanuega/Developer/container-tui/.claude/worktrees/opentui-spike`.

## How to verify
- `bunx tsc --noEmit`: no output (clean).
- `bun test`: 5 pass, 0 fail.
- `bun run build`: produces `dist/ctui` (gitignored). Delete stray `.*.bun-build` files from the repo root afterwards; never commit binaries.
- `bun run dev`: TUI shows tabs and real containers; `q` quits cleanly.
- Never delete or stop the user's real containers when testing (buildkit, tradingview-mcp, pb-frame, pb-aridas, frame). Use throwaway `ctui-test-*` resources and remove them.

## Suggested skills
- `run`: to launch and drive the app and confirm a change works in the real TUI.
- `code-review`: before opening or updating a PR for the next feature.
- `anthropic-skills:apple-container-skill`: when adding features that need unfamiliar `container` CLI subcommands or when debugging CLI/service failures.
