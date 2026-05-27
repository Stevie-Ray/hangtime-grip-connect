import { mkdir, writeFile } from "node:fs/promises"

const cjsDirectory = new URL("../packages/core/dist/cjs/", import.meta.url)
const packageJson = new URL("package.json", cjsDirectory)

await mkdir(cjsDirectory, { recursive: true })
await writeFile(packageJson, `${JSON.stringify({ type: "commonjs" }, null, 2)}\n`)
