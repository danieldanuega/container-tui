import { expect, test } from "bun:test"
import { execArgs, parseContainers, parseImages, parseNetworks, parseVolumes } from "../src/cli"
import containers from "./fixtures/containers.json"
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
