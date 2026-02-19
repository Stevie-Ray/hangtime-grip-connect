import { readdir, readFile } from "node:fs/promises"
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
  const mismatches = []

  for (const dir of packageDirs) {
    if (!dir.isDirectory()) continue

    const packageJsonPath = path.join(packagesDir, dir.name, "package.json")
    const denoJsonPath = path.join(packagesDir, dir.name, "deno.json")

    if (!(await exists(packageJsonPath)) || !(await exists(denoJsonPath))) continue

    const packageJson = JSON.parse(await readFile(packageJsonPath, "utf8"))
    const denoJson = JSON.parse(await readFile(denoJsonPath, "utf8"))

    if (typeof packageJson.version !== "string") continue
    if (typeof denoJson.version !== "string") continue

    if (denoJson.version !== packageJson.version) {
      mismatches.push({
        file: path.relative(process.cwd(), denoJsonPath),
        denoVersion: denoJson.version,
        packageVersion: packageJson.version,
      })
    }
  }

  if (mismatches.length === 0) {
    console.log("deno.json versions are in sync.")
    return
  }

  console.error("deno.json version mismatches found:")
  for (const mismatch of mismatches) {
    console.error(`- ${mismatch.file}: deno.json=${mismatch.denoVersion}, package.json=${mismatch.packageVersion}`)
  }
  console.error("Run: npm run sync:deno-versions")
  process.exit(1)
}

await main()
