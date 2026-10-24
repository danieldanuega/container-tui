import { createCliRenderer } from "@opentui/core"
import { createRoot } from "@opentui/react"
import { App } from "./app"
import { ensureSystemRunning } from "./startup"

if (!(await ensureSystemRunning())) process.exit(1)

// Ctrl+C is handled in App so log streams are killed before exiting.
const renderer = await createCliRenderer({ exitOnCtrlC: false })
createRoot(renderer).render(<App />)
