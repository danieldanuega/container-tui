// The only module that shells out to Apple's `container` CLI. Flags and JSON
// shapes change between CLI releases, so keep that knowledge here.

export type Container = { id: string; image: string; state: string }
export type Image = { name: string; digest: string }
export type Volume = { name: string; size: number }
export type Network = { name: string; mode: string; subnet: string }

const BIN = "container"

async function run(args: string[]): Promise<string> {
  const proc = Bun.spawn([BIN, ...args], { stdout: "pipe", stderr: "pipe" })
  const [out, err, code] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
    proc.exited,
  ])
  if (code !== 0) throw new Error(`${BIN} ${args.join(" ")}: ${err.trim() || `exit code ${code}`}`)
  return out
}

export function parseContainers(json: any[]): Container[] {
  return json.map((c) => ({
    id: c.configuration.id,
    image: c.configuration.image?.reference ?? "",
    state: c.status?.state ?? "unknown",
  }))
}

export function parseImages(json: any[]): Image[] {
  return json.map((i) => ({ name: i.configuration.name, digest: String(i.id).slice(0, 12) }))
}

export function parseVolumes(json: any[]): Volume[] {
  return json.map((v) => ({ name: v.configuration.name, size: v.configuration.sizeInBytes ?? 0 }))
}

export function parseNetworks(json: any[]): Network[] {
  return json.map((n) => ({
    name: n.id,
    mode: n.configuration?.mode ?? "",
    subnet: n.status?.ipv4Subnet ?? "",
  }))
}

const listJson = async (args: string[]) => JSON.parse(await run([...args, "--format", "json"]))

export const listContainers = async () => parseContainers(await listJson(["list", "--all"]))
export const listImages = async () => parseImages(await listJson(["image", "list"]))
export const listVolumes = async () => parseVolumes(await listJson(["volume", "list"]))
export const listNetworks = async () => parseNetworks(await listJson(["network", "list"]))

// `system status` exits non-zero when the API server is not running.
export const isSystemRunning = async () => {
  const proc = Bun.spawn([BIN, "system", "status"], { stdout: "ignore", stderr: "ignore" })
  return (await proc.exited) === 0
}

// Inherits stdio because `system start` can prompt (e.g. to install the default kernel).
export const startSystem = async () => {
  const proc = Bun.spawn([BIN, "system", "start"], { stdio: ["inherit", "inherit", "inherit"] })
  return (await proc.exited) === 0
}

export const startContainer =(id: string) => run(["start", id])
export const stopContainer = (id: string) => run(["stop", id])
export const deleteContainer = (id: string, force = false) =>
  run(["delete", ...(force ? ["--force"] : []), id])
export const deleteImage = (name: string) => run(["image", "delete", name])
export const deleteVolume = (name: string) => run(["volume", "delete", name])
export const deleteNetwork = (name: string) => run(["network", "delete", name])

export const streamLogs = (id: string) =>
  Bun.spawn([BIN, "logs", "-f", id], { stdout: "pipe", stderr: "pipe" })

export const execArgs = (id: string, shell: string) => [BIN, "exec", "-it", id, shell]
