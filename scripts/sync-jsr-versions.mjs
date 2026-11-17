import { readdir, readFile, writeFile } from "node:fs/promises"
import path from "node:path"

const packagesDir = path.resolve("packages")

async function exists(filePath) {
  try {
    await readFile(filePath, "utf8")
    return true
  } catch {
    return false
  }
}

async function main() {
  const packageDirs = await readdir(packagesDir, { withFileTypes: true })
  let updated = 0

  for (const dir of packageDirs) {
    if (!dir.isDirectory()) continue

    const packageJsonPath = path.join(packagesDir, dir.name, "package.json")
    const jsrJsonPath = path.join(packagesDir, dir.name, "jsr.json")

    if (!(await exists(packageJsonPath)) || !(await exists(jsrJsonPath))) continue

    const packageJson = JSON.parse(await readFile(packageJsonPath, "utf8"))
    const jsrJson = JSON.parse(await readFile(jsrJsonPath, "utf8"))

    if (typeof packageJson.version !== "string") continue
    if (typeof jsrJson.version !== "string") continue

    if (jsrJson.version === packageJson.version) continue

    jsrJson.version = packageJson.version
    await writeFile(jsrJsonPath, `${JSON.stringify(jsrJson, null, 2)}\n`, "utf8")
    updated++
    console.log(`Synced ${path.relative(process.cwd(), jsrJsonPath)} -> ${packageJson.version}`)
  }

  if (updated === 0) {
    console.log("All jsr.json versions are already in sync.")
  }
}

await main()
