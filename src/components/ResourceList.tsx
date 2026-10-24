import type { SelectOption } from "@opentui/core"

// Selected-row colors from the Atola design system: atola-blue at 40% over black (terminals have no
// real transparency), with ink's dark-theme value on top.
export const HIGHLIGHT = { bg: "#183654", fg: "#f5f5f4" }

export type Row = { id: string; name: string; description: string; running?: boolean }

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
        selectedBackgroundColor={HIGHLIGHT.bg}
        selectedTextColor={HIGHLIGHT.fg}
        selectedDescriptionColor={HIGHLIGHT.fg}
        showSelectionIndicator={false}
        focused={props.focused}
        onChange={(i) => {
          if (props.rows[i]) props.onSelect(i)
        }}
      />
    </box>
  )
}
