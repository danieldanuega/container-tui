import type { Container } from "../cli"

export function LogPane({ container, logs }: { container?: Container; logs: string[] }) {
  return (
    <box style={{ border: true, flexGrow: 2, flexBasis: 0, flexDirection: "column", overflow: "hidden" }} title={container ? `logs: ${container.id}` : "logs"}>
      <scrollbox style={{ flexGrow: 1, flexBasis: 0, minHeight: 0 }} stickyScroll stickyStart="bottom">
        {logs.map((line, i) => (
          <text key={i}>{line}</text>
        ))}
      </scrollbox>
    </box>
  )
}
