export function TabBar({ tabs, active }: { tabs: readonly string[]; active: number }) {
  return (
    <box style={{ flexDirection: "row", height: 1 }}>
      {tabs.map((name, i) => (
        <text key={name} fg={i === active ? "#000000" : "#888888"} bg={i === active ? "#5fafff" : undefined}>
          {` ${i + 1} ${name} `}
        </text>
      ))}
    </box>
  )
}
