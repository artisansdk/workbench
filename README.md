# @artisansdk/workbench

[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Docs](https://img.shields.io/badge/docs-book-red)](https://artisansdk.github.io/workbench/)

> [!WARNING]
> This package is currently unstable. Breaking changes will occur.

A deterministic application shell for plugin-driven desktop and mobile interfaces: a core `Workbench` that orchestrates plugin lifecycle, commands, modals, screens, and tools, plus a React shell that renders them into an icon bar, sidebars, screen host, and modal host.

It aims at the 80% case: register contributions from plugins and get a working shell, then reach for the core class directly when you need to integrate with another runtime.

```bash
npm i @artisansdk/workbench
pnpm add  @artisansdk/workbench
yarn add  @artisansdk/workbench
bun add @artisansdk/workbench
```

```tsx
import { Workbench, Plugin } from "@artisansdk/workbench"
import { Shell, CommandPalettePlugin } from "@artisansdk/workbench/react"

function HomeScreen() {
    return <div>Home</div>
}

class HomePlugin extends Plugin {
    readonly id = "home"

    register(workbench: Workbench) {
        workbench.screen({ id: "home", component: HomeScreen })
        workbench.activity({ id: "home", label: "Home", icon: <span>H</span>, activates: { screen: "home" } })
    }

    boot(workbench: Workbench) {
        workbench.activate("home")
    }
}

const workbench = new Workbench()
    .use(new HomePlugin())
    .use(new CommandPalettePlugin())
    .boot()

export default function App() {
    return <Shell workbench={workbench} />
}
```

## Documentation

Full guides and API reference: **[artisansdk.github.io/workbench](https://artisansdk.github.io/workbench/)**

- [Getting Started](https://artisansdk.github.io/workbench/getting-started.html)
- [Core Concepts](https://artisansdk.github.io/workbench/core-concepts.html) — Plugin Lifecycle, Workbench API, React Shell
- [Built-In Plugins](https://artisansdk.github.io/workbench/plugins/builtin/commandpalette.html) — CommandPalette, CloseModalHotkey
- [Events](https://artisansdk.github.io/workbench/events.html) — Naming, Dispatching, Listening, Bus
- [Common Patterns](https://artisansdk.github.io/workbench/patterns.html)
- [Config](https://artisansdk.github.io/workbench/config.html)

## Development

```sh
bun install
mdbook serve docs
```

## Licensing

Copyright (c) 2026 [Artisan Made, Co](https://www.artisanmade.io) and Joseph Raub

This package is released under the [MIT](LICENSE) license. Please see the LICENSE file distributed with every copy of the code for commercial licensing terms.
