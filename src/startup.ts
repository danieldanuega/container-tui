import { createInterface } from "node:readline/promises"
import { isSystemRunning, startSystem } from "./cli"

// Runs before the renderer starts, so plain terminal I/O is fine here.
// Returns false when the TUI should not launch.
export async function ensureSystemRunning(): Promise<boolean> {
  if (await isSystemRunning()) return true

  const rl = createInterface({ input: process.stdin, output: process.stdout })
  const answer = await rl.question("The container system is not running. Start it now? [y/N] ")
  rl.close()
  if (!/^y(es)?$/i.test(answer.trim())) return false

  if (await startSystem()) return true
  console.error("Failed to start the container system.")
  return false
}
