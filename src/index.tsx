import { createCliRenderer } from "@opentui/core"
import { createRoot } from "@opentui/react"
import { App } from "./app"

// Ctrl+C is handled in App so log streams are killed before exiting.
const renderer = await createCliRenderer({ exitOnCtrlC: false })
createRoot(renderer).render(<App />)
