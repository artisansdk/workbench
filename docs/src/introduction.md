# Workbench

`@artisansdk/workbench` is a deterministic application shell for plugin-driven desktop and mobile interfaces.

It combines two layers:

- A core `Workbench` class that orchestrates plugin lifecycle, commands, modals, screens, and tools.
- A React shell that renders registered items into a shell.

The package is desgined to provide an 80% use case for applications yet allow you to modifiy it where needed.

- `activity` items for the icon bar
- `screen` components for the center panel
- `tool` components for primary or secondary sidebars
- `modal` components for overlays
- `command` entries for the command palette
- `hotkey` bindings
- `event` classes and listeners

If you only need a shell, use the React exports. If you need to integrate Workbench into another runtime, the core class can be used without React.

## What Workbench gives you

> A contribution is anything that gets registered to the workbench.

- Deterministic rendering of contributions with duplicate ID protection
- A plugin lifecycle with `register()` and `boot()` phases
- Built-in state for active screen, active modal, focused tools, and sidebar placement
- A bus-backed event system
- Global hotkey registration via `tinykeys`
- Optional React plugins like the command palette
- Component override hooks so the default shell can be customized without forking core behavior

## Mental model

Treat Workbench as a host runtime:

1. Create a `Workbench` instance.
2. `use()` plugins onto it.
3. Call `boot()` once all plugins have been attached.
4. Render the shell with the same instance.

Each plugin contributes UI or behavior into shared registries. Workbench then turns those contributions into a coherent shell.

> Your application specific components and code are left to you, workbench let's you stop thinking of "how do I make a collapsing sidebar" and get to building your idea(s) faster.
