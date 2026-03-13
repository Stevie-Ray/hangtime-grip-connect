---
title: AI skill
description: Install the Grip Connect skill for AI agents and route them to the right docs and examples.
---

# AI skill

Grip Connect ships a skill for AI agents that need help choosing the right package, wiring a supported device, or
navigating setup, integration, and device-specific workflows.

## Install

```sh
npx skills add Stevie-Ray/hangtime-grip-connect
```

The skill bundles the guidance it needs, so users do not need the full monorepo checkout. If you want the explicit skill
name form, this also works:

```sh
npx skills add Stevie-Ray/hangtime-grip-connect --skill grip-connect
```

## Use it for

- package selection across web, Capacitor, React Native, runtime, and CLI
- supported-device integration and common connection issues
- runtime scripts and CLI workflows
- unsupported or custom hardware routing

## What it covers

The skill includes bundled guidance for:

- package selection across web, Capacitor, React Native, runtime, and CLI
- supported-device workflows and common connection issues
- runtime scripts and CLI usage
- unsupported or custom hardware routing

## Example prompt

`Use $grip-connect to help me add a Tindeq Progressor to my Capacitor app.`
