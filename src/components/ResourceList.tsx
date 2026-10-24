import type { SelectOption } from "@opentui/core"

export type Row = { id: string; name: string; description: string; header?: boolean }

export function ResourceList(props: {
  title: string
  rows: Row[]
  index: number
  focused: boolean
  onSelect: (index: number) => void
}) {
  const options: SelectOption[] = props.rows.map((r) => ({
    name: r.name,
    description: r.description,
    value: r.id,
  }))
  return (
    <box style={{ border: true, flexGrow: 1, minWidth: 40 }} title={props.title}>
      {/* options before selectedIndex: setting options clamps the index */}
      <select
        style={{ height: "100%" }}
        options={options}
        selectedIndex={props.index}
        focused={props.focused}
        onChange={(i) => {
          if (props.rows[i]) props.onSelect(i)
        }}
      />
    </box>
  )
}
