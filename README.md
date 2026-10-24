# container-tui

A terminal UI for [Apple's `container`](https://github.com/apple/container) CLI. Browse your Linux containers, tail their logs and drop into a shell without leaving the terminal.

> **Status:** early spike. The core loop works, but expect rough edges and missing features.

## Features

- Lists all containers (running and stopped) with their state, refreshed every 2 seconds
- Streams logs for the selected container (`container logs -f`), keeping the last 500 lines
- Opens an interactive shell in the selected container (`container exec -it <id> sh`), then returns to the UI when you exit

### Keybindings

| Key        | Action                                  |
| ---------- | --------------------------------------- |
| `↑` / `↓`  | Select a container                      |
| `l`        | Stream logs for the selected container  |
| `e`        | Exec into the selected container        |
| `q`        | Quit                                    |
| `Ctrl+C`   | Quit                                    |

## Requirements

- Apple silicon Mac running macOS with the [`container` CLI](https://github.com/apple/container) installed (developed against 1.6.1) and its service started (`container system start`)
- [Bun](https://bun.sh) (developed against 1.4.2)

## Getting started

```sh
bun install
bun src.tsx
```

## How it works

The app is a single file, `src.tsx`. It shells out to the `container` CLI (using `Bun.$` and `Bun.spawn`) rather than talking to the service directly, and renders with [OpenTUI](https://github.com/sst/opentui) through its React bindings.

- `listContainers()` runs `container list --all --format json` and maps each entry to an id and state.
- `App` polls that list, holds the selection and log buffer, and handles key presses.
- `execShell()` suspends the renderer so the child process owns the terminal, then resumes it afterwards.

## Contributing

Contributions are welcome. Because the project is young, please open an issue to discuss larger changes before starting on them.

1. Fork the repository and create a branch from `main`.
2. Run `bun install`, then `bun src.tsx` to try the app against your local containers.
3. Make your change. Keep it focused, and match the style of the surrounding code.
4. Type-check with `bunx tsc --noEmit`. The project uses strict TypeScript.
5. Run the app and check the behavior you changed, since there is no automated test suite yet. Mention what you tried in your PR.
6. Open a pull request describing what changed and why.

Bug reports are useful too. Include your macOS version, `container --version` and the steps to reproduce.

## License

[Apache License 2.0](LICENSE)
