import assert from "node:assert/strict"
import { execFileSync } from "node:child_process"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { describe, it } from "node:test"

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..")

function runNode(code) {
  return execFileSync(process.execPath, ["-e", code], {
    cwd: packageRoot,
    encoding: "utf8",
  }).trim()
}

describe("package exports", () => {
  it("supports package self-reference through ESM and CommonJS", () => {
    assert.equal(
      runNode(
        "import('@hangtime/grip-connect').then((grip) => console.log(typeof grip.Progressor)).catch((error) => { console.error(error); process.exit(1) })",
      ),
      "function",
    )
    assert.equal(
      runNode("const grip = require('@hangtime/grip-connect'); console.log(typeof grip.Progressor)"),
      "function",
    )
  })

  it("routes legacy src subpath exports to built JavaScript", () => {
    assert.equal(
      runNode(
        "import('@hangtime/grip-connect/src/models/device/aurora.model.js').then((module) => console.log(typeof module.AuroraBoard)).catch((error) => { console.error(error); process.exit(1) })",
      ),
      "function",
    )
    assert.equal(
      runNode("require('@hangtime/grip-connect/src/interfaces/callback.interface.js'); console.log('ok')"),
      "ok",
    )
  })
})
