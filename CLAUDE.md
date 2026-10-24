# CLAUDE.md

A terminal UI for Apple's `container` CLI, built with Bun, TypeScript and OpenTUI's React bindings. See `README.md` for features and keybindings.

## Commands

- `bun install`: install dependencies
- `bun run dev`: run the TUI
- `bun run typecheck`: `tsc --noEmit` (strict)
- `bun test`: unit tests (CLI JSON mapping only)
- `bun run build`: compile a single binary to `dist/ctui`

## Layout

- `src/cli.ts`: the only module that runs `container`. All flags and JSON field mapping live here.
- `src/app.tsx`: state, polling, key handling, log streaming and exec.
- `src/components/`: tab bar, resource list, container list, log pane.
- `src/index.tsx`: renderer setup.
- `test/`: tests and `fixtures/*.json`, trimmed from real CLI output.

## Conventions

- Keep `container` CLI knowledge in `src/cli.ts`. Flags differ across releases and between subcommands (`--force` means different things on `delete` and `image delete`).
- Track the selection by id, not index: `container list` order is not stable between calls.
- Keep `exitOnCtrlC: false` in `src/index.tsx`. Ctrl+C goes through the same quit path as `q`, which kills the log child process.
- Exec suspends the renderer so the child process owns the terminal, then resumes it. Stop any log stream first.
- Add a fixture and a test in `test/` when changing a parser in `src/cli.ts`.
- Update `README.md` in the same change when you add or change a feature or key.

## Gotchas

- OpenTUI diff-renders, so tests and checks should assert on content that must appear, not on full redraws.
- `select` has no natural width. Give the list `minWidth` and the log pane `flexBasis: 0`.
- OpenTUI has React and Solid renderers only, so a Svelte UI is not an option.
- `bun run build` can leave `.*.bun-build` files in the repo root. Delete them, and never commit binaries (`dist` is gitignored).

## Testing against real containers

- Never delete or stop the user's own containers while testing. Use throwaway `ctui-test-*` resources and remove them afterwards.
- The `container` service must be running: `container system start`.

## Git

- Feature branches are merged into `development` through PRs. Branch from `development` and open PRs into it.
