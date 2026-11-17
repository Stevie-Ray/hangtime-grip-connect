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
    const jsrJsonPath = path.join(packagesDir, dir.name, "jsr.json")

    if (!(await exists(packageJsonPath)) || !(await exists(jsrJsonPath))) continue

    const packageJson = JSON.parse(await readFile(packageJsonPath, "utf8"))
    const jsrJson = JSON.parse(await readFile(jsrJsonPath, "utf8"))

    if (typeof packageJson.version !== "string") continue
    if (typeof jsrJson.version !== "string") continue

    if (jsrJson.version !== packageJson.version) {
      mismatches.push({
        file: path.relative(process.cwd(), jsrJsonPath),
        jsrVersion: jsrJson.version,
        packageVersion: packageJson.version,
      })
    }
  }

  if (mismatches.length === 0) {
    console.log("jsr.json versions are in sync.")
    return
  }

  console.error("jsr.json version mismatches found:")
  for (const mismatch of mismatches) {
    console.error(`- ${mismatch.file}: jsr.json=${mismatch.jsrVersion}, package.json=${mismatch.packageVersion}`)
  }
  console.error("Run: npm run sync:jsr-versions")
  process.exit(1)
}

await main()
