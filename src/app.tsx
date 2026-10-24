import { useKeyboard, useRenderer } from "@opentui/react"
import { useEffect, useRef, useState } from "react"
import {
  type Container,
  deleteContainer,
  deleteImage,
  deleteNetwork,
  deleteVolume,
  execArgs,
  listContainers,
  listImages,
  listNetworks,
  listVolumes,
  startContainer,
  stopContainer,
  stopSystem,
  streamLogs,
} from "./cli"
import { LogPane } from "./components/LogPane"
import { ResourceList, type Row } from "./components/ResourceList"
import { TabBar } from "./components/TabBar"

// Shell started by `e`. Change to "bash" etc. if your images have it.
const SHELL = "sh"

const TABS = ["Containers", "Images", "Volumes", "Networks"] as const
const HELP = [
  "s start  x stop  d delete  e exec  r refresh  S stop system",
  "d delete  r refresh  S stop system",
  "d delete  r refresh  S stop system",
  "d delete  r refresh  S stop system",
]
const DELETE = [deleteContainer, deleteImage, deleteVolume, deleteNetwork]

async function load(tab: number): Promise<{ rows: Row[]; containers: Container[] }> {
  if (tab === 0) {
    const containers = await listContainers()
    const toRow = (c: Container) => ({ id: c.id, name: c.id, description: `${c.state}  ${c.image}` })
    const running = containers.filter((c) => c.state === "running")
    const stopped = containers.filter((c) => c.state !== "running")
    const rows: Row[] = []
    for (const [label, group] of [["Running", running], ["Stopped", stopped]] as const) {
      if (group.length === 0) continue
      rows.push({ id: `header:${label}`, name: `── ${label} (${group.length}) ──`, description: "", header: true })
      rows.push(...group.map(toRow))
    }
    return { rows, containers }
  }
  if (tab === 1) {
    const rows = (await listImages()).map((i) => ({ id: i.name, name: i.name, description: i.digest }))
    return { rows, containers: [] }
  }
  if (tab === 2) {
    const rows = (await listVolumes()).map((v) => ({
      id: v.name,
      name: v.name,
      description: `${Math.round(v.size / 2 ** 30)} GiB`,
    }))
    return { rows, containers: [] }
  }
  const rows = (await listNetworks()).map((n) => ({ id: n.name, name: n.name, description: `${n.mode}  ${n.subnet}` }))
  return { rows, containers: [] }
}

const errorText = (e: unknown) => (e instanceof Error ? e.message : String(e))

export function App() {
  const renderer = useRenderer()
  const [tab, setTab] = useState(0)
  const [rows, setRows] = useState<Row[]>([])
  const [containers, setContainers] = useState<Container[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [logs, setLogs] = useState<string[]>([])
  const [status, setStatus] = useState("")
  const [confirm, setConfirm] = useState<{ prompt: string; label: string; run: () => Promise<unknown> } | null>(null)
  const lastIndex = useRef(0)
  const logProc = useRef<ReturnType<typeof streamLogs> | null>(null)
  const tabRef = useRef(tab)
  tabRef.current = tab

  async function refresh() {
    const t = tabRef.current
    try {
      const result = await load(t)
      if (tabRef.current !== t) return
      setRows(result.rows)
      setContainers(result.containers)
    } catch (e) {
      setStatus(errorText(e))
    }
  }

  useEffect(() => {
    setRows([])
    setSelectedId(null)
    lastIndex.current = 0
    refresh()
    const timer = setInterval(refresh, 2000)
    return () => clearInterval(timer)
  }, [tab])

  // Track the selection by id so it survives refreshes; fall back to the last index if it vanished.
  // Header rows are never selectable: move to the nearest real row in the given direction, else the other way.
  const nearestRow = (from: number, dir: 1 | -1) => {
    for (const d of [dir, -dir]) {
      for (let i = from; i >= 0 && i < rows.length; i += d) if (!rows[i]!.header) return i
    }
    return 0
  }
  let index = rows.findIndex((r) => r.id === selectedId)
  if (index < 0) index = nearestRow(Math.min(lastIndex.current, Math.max(0, rows.length - 1)), 1)
  const selected = rows[index]
  const container = tab === 0 ? containers.find((c) => c.id === selected?.id) : undefined

  function stopLogs() {
    logProc.current?.kill()
    logProc.current = null
  }

  // Stream logs of the selected container; restart when its state changes (e.g. after start/stop).
  const logId = container?.id
  const logState = container?.state
  useEffect(() => {
    setLogs([])
    if (logId) showLogs(logId)
    return stopLogs
  }, [tab, logId, logState])

  async function showLogs(id: string) {
    stopLogs()
    setLogs([])
    const proc = streamLogs(id)
    logProc.current = proc
    const decoder = new TextDecoder()
    for await (const chunk of proc.stdout as ReadableStream<Uint8Array>) {
      if (logProc.current !== proc) break
      const lines = decoder.decode(chunk).split("\n").filter(Boolean)
      setLogs((prev) => [...prev, ...lines].slice(-500))
    }
    const code = await proc.exited
    if (logProc.current === proc && code !== 0) {
      setStatus(`logs ${id}: ${(await new Response(proc.stderr).text()).trim() || `exit code ${code}`}`)
    }
  }

  async function execShell(c: Container) {
    if (c.state !== "running") return setStatus(`${c.id} is not running`)
    stopLogs()
    await renderer.suspend()
    const proc = Bun.spawn(execArgs(c.id, SHELL), { stdin: "inherit", stdout: "inherit", stderr: "inherit" })
    const code = await proc.exited
    await renderer.resume()
    setStatus(`exec ${c.id}: exited with code ${code}`)
  }

  async function act(label: string, run: () => Promise<unknown>) {
    setStatus(`${label}...`)
    try {
      await run()
      setStatus(`${label}: done`)
    } catch (e) {
      setStatus(errorText(e))
    }
    refresh()
  }

  function askDelete(id: string) {
    const force = container?.state === "running"
    const kind = TABS[tab]!.toLowerCase().slice(0, -1)
    setConfirm({
      prompt: `Delete ${kind} ${id}${force ? " (running, will force)" : ""}? [y/n]`,
      label: `delete ${id}`,
      run: () => (tab === 0 ? deleteContainer(id, force) : DELETE[tab]!(id)),
    })
  }

  function quit() {
    stopLogs()
    renderer.destroy()
    process.exit(0)
  }

  function askStopSystem() {
    setConfirm({
      prompt: "Stop the container system? This stops all running containers and exits. [y/n]",
      label: "stop container system",
      run: async () => {
        await stopSystem()
        quit()
      },
    })
  }

  useKeyboard((key) => {
    if (key.name === "q" || (key.ctrl && key.name === "c")) return quit()
    if (confirm) {
      setConfirm(null)
      if (key.name === "y") act(confirm.label, confirm.run)
      else setStatus("cancelled")
      return
    }
    const n = Number(key.name)
    if (n >= 1 && n <= TABS.length) return setTab(n - 1)
    if (key.name === "tab") return setTab((tab + (key.shift ? TABS.length - 1 : 1)) % TABS.length)
    if (key.name === "r") return void refresh()
    if (key.shift && key.name === "s") return askStopSystem()
    if (!selected) return
    if (key.name === "d") return askDelete(selected.id)
    if (!container) return
    const id = container.id
    if (key.name === "s") act(`start ${id}`, () => startContainer(id))
    if (key.name === "x") act(`stop ${id}`, () => stopContainer(id))
    if (key.name === "e") execShell(container)
  })

  return (
    <box style={{ flexDirection: "column", width: "100%", height: "100%" }}>
      <TabBar tabs={TABS} active={tab} />
      <box style={{ flexDirection: "row", flexGrow: 1, minHeight: 0 }}>
        <ResourceList
          title={TABS[tab]!}
          rows={rows}
          index={index}
          focused={!confirm}
          onSelect={(i) => {
            const target = rows[i]!.header ? nearestRow(i, i > index ? 1 : -1) : i
            setSelectedId(rows[target]?.id ?? null)
            lastIndex.current = target
          }}
        />
        {tab === 0 && <LogPane container={container} logs={logs} />}
      </box>
      <text fg="#ffd75f">{confirm?.prompt || status || " "}</text>
      <text fg="#888888">{`${HELP[tab]}  1-4/tab switch tabs  q quit`}</text>
    </box>
  )
}
