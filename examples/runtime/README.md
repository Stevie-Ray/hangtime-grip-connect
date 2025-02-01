# Grip Connect - Runtime

This example demonstrates how to use Grip Connect in a Node.js, Bun or Deno environment.

## Setup

### Node.js

```bash
npm install @hangtime/grip-connect
```

### Deno

Make sure you add `--allow-scripts` to run the `postinstall` script:

```bash
deno add jsr:@hangtime/grip-connect --allow-scripts
```

Also add the following in the root `deno.json` file:

```json
{
  "nodeModulesDir": "auto"
}
```

### Bun

```bash
bun add @hangtime/grip-connect
```

Make sure you have the following in your `package.json` file, to execute `postinstall` script:

```json
{
  "trustedDependencies": ["@hangtime/grip-connect", "webbluetooth"]
}
```
