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
    const denoJsonPath = path.join(packagesDir, dir.name, "deno.json")

    if (!(await exists(packageJsonPath)) || !(await exists(denoJsonPath))) continue

    const packageJson = JSON.parse(await readFile(packageJsonPath, "utf8"))
    const denoJson = JSON.parse(await readFile(denoJsonPath, "utf8"))

    if (typeof packageJson.version !== "string") continue
    if (typeof denoJson.version !== "string") continue

    if (denoJson.version === packageJson.version) continue

    denoJson.version = packageJson.version
    await writeFile(denoJsonPath, `${JSON.stringify(denoJson, null, 2)}\n`, "utf8")
    updated++
    console.log(`Synced ${path.relative(process.cwd(), denoJsonPath)} -> ${packageJson.version}`)
  }

  if (updated === 0) {
    console.log("All deno.json versions are already in sync.")
  }
}

await main()
