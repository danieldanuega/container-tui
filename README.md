# container-tui

A terminal UI for [Apple's `container`](https://github.com/apple/container) CLI. Browse your Linux containers, tail their logs and drop into a shell without leaving the terminal.

> **Status:** v1. Expect rough edges.

## Features

- Tabs for Containers, Images, Volumes and Networks, refreshed every 2 seconds
- Start, stop and delete containers; delete images, volumes and networks (with a y/n prompt)
- Groups containers into Running and Stopped
- Right pane auto-streams logs for the selected container (`container logs -f`), keeping the last 500 lines
- Opens an interactive shell in the selected container (`container exec -it <id> sh`), then returns to the UI when you exit. The shell is the `SHELL` constant in `src/app.tsx`.
- Errors from the CLI are shown in the status line

## Usage

| Key                 | Action                                          |
| ------------------- | ----------------------------------------------- |
| `1`-`4`, `Tab` / `Shift+Tab` | Switch tab                             |
| `↑` / `↓`           | Select an item                                  |
| `r`                 | Refresh now                                     |
| `d`                 | Delete the selected item (asks y/n; running containers are force-deleted) |
| `s` / `x`           | Start / stop the selected container             |
| `e`                 | Exec a shell in the selected (running) container |
| `q` / `Ctrl+C`      | Quit                                            |

The footer shows the keys for the current tab.

## Requirements

- Apple silicon Mac running macOS with the [`container` CLI](https://github.com/apple/container) installed (developed against 1.6.1) and its service started (`container system start`)
- [Bun](https://bun.sh) (developed against 1.4.2)

## Getting started

```sh
bun install
bun run dev
```

### Building a binary

```sh
bun run build                     # bun build --compile src/index.tsx --outfile dist/ctui
cp dist/ctui /usr/local/bin/ctui  # or any directory on your PATH
ctui
```

The binary bundles Bun and all dependencies, so nothing else is needed at runtime except the `container` CLI.

## How it works

It shells out to the `container` CLI (using `Bun.spawn`) rather than talking to the service directly, and renders with [OpenTUI](https://github.com/sst/opentui) through its React bindings.

- `src/cli.ts` is the only module that runs `container`. It holds all CLI flags and JSON mapping, since these change between CLI releases.
- `src/app.tsx` polls the current tab's list, tracks the selection by id, and handles key presses. Exec suspends the renderer so the child process owns the terminal, then resumes it afterwards.
- `src/components/` has the tab bar, list and log pane.
- `src/index.tsx` creates the renderer.

## Contributing

Contributions are welcome. Because the project is young, please open an issue to discuss larger changes before starting on them.

1. Fork the repository and create a branch from `main`.
2. Run `bun install`, then `bun run dev` to try the app against your local containers.
3. Make your change. Keep it focused, and match the style of the surrounding code.
4. Type-check with `bun run typecheck` and run `bun test`. The project uses strict TypeScript; the tests cover the CLI JSON mapping only.
5. Run the app and check the behavior you changed. Mention what you tried in your PR.
6. Open a pull request describing what changed and why.

Bug reports are useful too. Include your macOS version, `container --version` and the steps to reproduce.

## License

[Apache License 2.0](LICENSE)
