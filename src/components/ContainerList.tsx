import type { ScrollBoxRenderable } from "@opentui/core"
import { useEffect, useRef } from "react"
import { HIGHLIGHT, type Row } from "./ResourceList"

// `select` can't color single rows, so containers get their own list: a bordered box per group with a status dot.
export function ContainerList({ rows, selectedId }: { rows: Row[]; selectedId?: string }) {
  const running = rows.filter((r) => r.running)
  return (
    <box style={{ flexDirection: "column", flexGrow: 1, flexBasis: 0, minWidth: 40 }}>
      <Group title="Running" rows={running} selectedId={selectedId} />
      <Group title="Stopped" rows={rows.filter((r) => !r.running)} selectedId={selectedId} grow />
    </box>
  )
}

function Group(props: { title: string; rows: Row[]; selectedId?: string; grow?: boolean }) {
  const scroll = useRef<ScrollBoxRenderable>(null)
  useEffect(() => {
    if (props.selectedId) scroll.current?.scrollChildIntoView(`row:${props.selectedId}`)
  }, [props.selectedId, props.rows.length])
  // Running is sized to its rows (two lines each) but capped at half the column; Stopped takes the rest.
  const size = props.grow
    ? { flexGrow: 1, minHeight: 4 }
    : { height: Math.max(1, props.rows.length * 2) + 2, maxHeight: "50%" as const, flexShrink: 0 }
  return (
    <box style={{ border: true, ...size }} title={`${props.title} (${props.rows.length})`}>
      <scrollbox ref={scroll} style={{ flexGrow: 1, minHeight: 0 }}>
        {props.rows.length === 0 && <text fg="#888888"> none</text>}
        {props.rows.map((r) => {
          const selected = r.id === props.selectedId
          return (
            <box key={r.id} id={`row:${r.id}`} style={{ flexDirection: "column", backgroundColor: selected ? HIGHLIGHT.bg : undefined }}>
              <text fg={selected ? HIGHLIGHT.fg : "#ffffff"} wrapMode="none">
                <span fg={r.running ? "#5fd75f" : "#888888"}>{r.running ? " ● " : " ○ "}</span>
                {r.name}
              </text>
              <text fg={selected ? HIGHLIGHT.fg : "#888888"} wrapMode="none">{`   ${r.description}`}</text>
            </box>
          )
        })}
      </scrollbox>
    </box>
  )
}
