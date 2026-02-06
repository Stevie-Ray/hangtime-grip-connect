# Grip Connect Development Guide

## Project Overview

Grip Connect is a TypeScript monorepo delivering a consistent interface for force-sensing climbing hardware across web
and mobile platforms. The project abstracts device protocols and provides utilities for connecting, streaming, and
analyzing data from hangboards, dynamometers, and LED system boards.

## Tech Stack

- **Language**: TypeScript
- **Core Platform**: Web Bluetooth API
- **Mobile Support**: Capacitor and React Native wrappers
- **CLI**: Node.js, Deno and Bun execution
- **Documentation**: VitePress
- **Versioning**: Changesets (monorepo releases)
- **Linting**: ESLint with TypeScript ESLint
- **Formatting**: Prettier

## 4. Environment Setup

### Requirements

- Node.js 22+
- npm 10+

### Installation

```bash
git clone https://github.com/Stevie-Ray/hangtime-grip-connect
cd hangtime-grip-connect
```

With [nvm](https://github.com/nvm-sh/nvm):

```bash
nvm install   # uses .nvmrc
nvm use
npm install
```

Without nvm:

```bash
npm install
```

## Project Structure

```
packages/                      # All published packages
  core/                        # Core Abstract Web Bluetooth (ESM + CJS builds)
  capacitor/                   # Capacitor wrapper
  react-native/                # React Native wrapper
  cli/                         # CLI utilities (Node, Deno, Bun)
  docs/                        # VitePress documentation site
examples/                      # Sample applications and demos
  capacitor/                   # Capacitor demo app (Vite)
  reactnative/                 # Expo React Native demo app
  chart/                       # Data charting example
  kilter-board/                # LED system board demo
  flappy-bird/                 # Physics/game demo
  pong/                        # Minimal game loop demo
  runtime/                     # Node runtime example
```

## Packages

### core

- Heart of the project containing device abstractions and shared types.
- Entry points: `src/index.ts` for browsers, subpaths for individual devices.
- Compiles to ESM and types using `tsc`.

### capacitor

- Exposes Web Bluetooth capabilities through Capacitor for hybrid mobile apps.
- Wraps the core package and forwards TypeScript types.
- Built with `npm run build:capacitor`.

### react-native

- Provides a React Native module that proxies to the core package via native modules.
- Uses Metro-compatible exports.
- Built with `npm run build:react-native`.

### cli

- Ships utilities such as device scanners and streaming tools.
- Targets Node.js, Bun, and Deno; entry is `src/index.ts`.
- Built with `npm run build:cli`.

### docs

- VitePress site under `packages/docs` generating API and device documentation.
- Local development with `npm run dev:docs`, build with `npm run build:docs`.

## Core Development Principles

### Code Style

- Use TypeScript with strict type checking
- Prefer **named exports**
- Keep files and directories lowercase with dashes
- Format with Prettier (`npm run format`)

### Linting & Testing

- Run ESLint before committing (`npm run lint`)
- Build packages with the TypeScript compiler (`npm run build`)

### Versioning & Releases

- Versioning and changelogs are managed with [Changesets](https://github.com/changesets/changesets).
- Add a changeset for user-facing changes: `npm run changeset` (creates a file in `.changeset/`).
- To apply version bumps and update changelogs: `npm run changeset:version`.
- To publish packages to npm: `npm run changeset:publish`.

### Multi-Platform Considerations

- Abstract device logic in the core package
- Keep platform-specific code within its dedicated package
- Re-export shared interfaces from the core package

## Best Practices Summary

- Write functional, modular code
- Avoid using `any`; favor interfaces over types
- Handle connection errors and disconnections gracefully
- Document new devices and features in `packages/docs`
- Ensure examples remain minimal and runnable
