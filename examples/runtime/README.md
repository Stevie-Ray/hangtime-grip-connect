# Grip Connect - Runtime

This example demonstrates how to use Grip Connect in a Node.js, Bun, or Deno environment.

## Setup

Copy `.env.example` to `.env` and add your personal, non-commercial Frez Developer Program key:

```dotenv
FREZ_ACCESS_KEY=your-access-key
```

Keep this file private. Do not distribute the key or make it available through a public service.

### Node.js

Install the package using npm:

```bash
npm install @hangtime/grip-connect-runtime
```

### Bun

Install with Bun using:

```bash
bun add @hangtime/grip-connect-runtime
```

Also, update your `package.json` file to include:

```json
{
  "trustedDependencies": ["@hangtime/grip-connect-runtime", "webbluetooth"]
}
```

This configuration ensures the post-install script runs correctly.

### Deno

To install for Deno, add the package with permission to run `postinstall` scripts:

```bash
deno add jsr:@hangtime/grip-connect-runtime --allow-scripts="npm:webbluetooth"
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
npm start

# Bun
bun index.js

# Deno
deno run --env-file=.env --allow-env --allow-net --allow-read --allow-write --allow-sys --allow-ffi index.js
```
