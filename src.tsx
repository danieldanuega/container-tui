import { createCliRenderer, type SelectOption } from "@opentui/core"
import { createRoot, useKeyboard, useRenderer } from "@opentui/react"
import { useEffect, useRef, useState } from "react"

type Row = { id: string; state: string }

async function listContainers(): Promise<Row[]> {
  const out = await Bun.$`container list --all --format json`.quiet().json()
  return out.map((c: any) => ({ id: c.configuration.id, state: c.status.state }))
}

function App() {
  const renderer = useRenderer()
  const [rows, setRows] = useState<Row[]>([])
  const [index, setIndex] = useState(0)
  const [logs, setLogs] = useState<string[]>([])
  const logProc = useRef<ReturnType<typeof Bun.spawn> | null>(null)

  useEffect(() => {
    const tick = () => listContainers().then(setRows).catch(() => {})
    tick()
    const t = setInterval(tick, 2000)
    return () => clearInterval(t)
  }, [])

  const selected = rows[index]

  function stopLogs() {
    logProc.current?.kill()
    logProc.current = null
  }

  async function streamLogs(id: string) {
    stopLogs()
    setLogs([])
    const proc = Bun.spawn(["container", "logs", "-f", id], { stdout: "pipe", stderr: "pipe" })
    logProc.current = proc
    const decoder = new TextDecoder()
    for await (const chunk of proc.stdout as ReadableStream<Uint8Array>) {
      const lines = decoder.decode(chunk).split("\n").filter(Boolean)
      setLogs((prev) => [...prev, ...lines].slice(-500))
    }
  }

  async function execShell(id: string) {
    stopLogs()
    await renderer.suspend()
    const proc = Bun.spawn(["container", "exec", "-it", id, "sh"], {
      stdin: "inherit",
      stdout: "inherit",
      stderr: "inherit",
    })
    await proc.exited
    await renderer.resume()
  }

  useKeyboard((key) => {
    if (key.name === "q") {
      stopLogs()
      renderer.destroy()
      process.exit(0)
    }
    if (!selected) return
    if (key.name === "l") streamLogs(selected.id)
    if (key.name === "e") execShell(selected.id)
  })

  const options: SelectOption[] = rows.map((r) => ({
    name: r.id,
    description: r.state,
    value: r.id,
  }))

  return (
    <box style={{ flexDirection: "row", width: "100%", height: "100%" }}>
      <box style={{ border: true, width: 40 }} title="containers">
        <select
          style={{ height: "100%" }}
          options={options}
          focused
          onChange={(i) => setIndex(i)}
        />
      </box>
      <box
        style={{ border: true, flexGrow: 1 }}
        title={`logs${selected ? ` - ${selected.id}` : ""}  [l]ogs [e]xec [q]uit`}
      >
        <scrollbox style={{ height: "100%" }} stickyScroll stickyStart="bottom">
          {logs.map((line, i) => (
            <text key={i}>{line}</text>
          ))}
        </scrollbox>
      </box>
    </box>
  )
}

const renderer = await createCliRenderer({ exitOnCtrlC: true })
createRoot(renderer).render(<App />)
