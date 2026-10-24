import type { Container } from "../cli"

export function LogPane({ container, logs }: { container?: Container; logs: string[] }) {
  return (
    <box style={{ border: true, flexGrow: 2, flexBasis: 0, flexDirection: "column" }} title={container ? `${container.id}` : "details"}>
      {container && (
        <text fg="#888888">{`image: ${container.image}   state: ${container.state}`}</text>
      )}
      <scrollbox style={{ flexGrow: 1 }} stickyScroll stickyStart="bottom">
        {logs.map((line, i) => (
          <text key={i}>{line}</text>
        ))}
      </scrollbox>
    </box>
  )
}
