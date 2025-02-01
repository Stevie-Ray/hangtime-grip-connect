# Grip Connect - Runtime

This example demonstrates how to use Grip Connect in a Node.js, Bun, or Deno environment.

## Setup

### Node.js

Install the package using npm:

```bash
npm install @hangtime/grip-connect
```

### Bun

Install with Bun using:

```bash
bun add @hangtime/grip-connect
```

Also, update your `package.json` file to include:

```json
{
  "trustedDependencies": ["@hangtime/grip-connect", "webbluetooth"]
}
```

This configuration ensures the post-install script runs correctly.

### Deno

To install for Deno, add the package with permission to run `postinstall` scripts:

```bash
deno add jsr:@hangtime/grip-connect --allow-scripts="npm:webbluetooth"
```

Then, ensure your root `deno.json` file includes the following configuration to automatically manage Node modules:

```json
{
  "nodeModulesDir": "auto"
}
```

## Usage

To run the example:

```bash
# Node.js
node index.js

# Bun
bun index.js

# Deno
deno run --allow-env --allow-read --allow-sys --allow-ffi index.js
```
