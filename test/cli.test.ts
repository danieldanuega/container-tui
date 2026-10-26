import { expect, test } from "bun:test"
import { archArgs, execArgs, parseContainers, parseImages, parseNetworks, parseVolumes, runArgs } from "../src/cli"
import containers from "./fixtures/containers.json"
import amd64Image from "./fixtures/image-inspect-amd64.json"
import multiArchImage from "./fixtures/image-inspect-multiarch.json"
import images from "./fixtures/images.json"
import networks from "./fixtures/networks.json"
import volumes from "./fixtures/volumes.json"

test("parseContainers maps id, image reference and state", () => {
  expect(parseContainers(containers)).toEqual([
    { id: "web", image: "pocketbase:0.40.1", state: "running" },
    { id: "builder", image: "ghcr.io/apple/container-builder-shim/builder:0.12.0", state: "stopped" },
  ])
})

test("parseImages uses the reference name and a short digest", () => {
  expect(parseImages(images)).toEqual([{ name: "docker.io/library/alpine:latest", digest: "28bd5fe8b56d" }])
})

test("parseVolumes maps name and size", () => {
  expect(parseVolumes(volumes)).toEqual([{ name: "data", size: 549755813888 }])
})

test("parseNetworks maps name, mode and subnet", () => {
  expect(parseNetworks(networks)).toEqual([{ name: "default", mode: "nat", subnet: "192.168.64.0/24" }])
})

test("execArgs builds an interactive exec command", () => {
  expect(execArgs("web", "sh")).toEqual(["container", "exec", "-it", "web", "sh"])
})

test("archArgs picks amd64 only when the image has no arm64 variant", () => {
  expect(archArgs(amd64Image[0]!.variants)).toEqual(["--arch", "amd64"])
  expect(archArgs(multiArchImage[0]!.variants)).toEqual([])
  expect(archArgs(images[0]!.variants)).toEqual([])
})

test("runArgs adds only the options that were given", () => {
  expect(runArgs("alpine", {})).toEqual(["run", "--detach", "alpine"])
  expect(runArgs("web", { volume: "/src:/app", port: "8080:80", network: "dev" }, ["--arch", "amd64"])).toEqual([
    "run", "--detach", "--arch", "amd64", "--volume", "/src:/app", "--publish", "8080:80", "--network", "dev", "web",
  ])
})
