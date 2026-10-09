# Core Concepts

## Plugins

Plugins are the unit of extension. A plugin subclasses `Plugin` and contributes into Workbench during `register()` and `boot()`.

```ts
import { Plugin, type Workbench } from "@artisansdk/workbench"

export default class ExamplePlugin extends Plugin {
    readonly id = "example"

    register(workbench: Workbench) {
        // register tools, screens, commands, listeners...
    }
}
```

Every contribution is attributed to the currently running plugin. Calling `workbench.tool()` or similar outside `register()` or `boot()` throws.

## Contributions

Workbench exposes several contribution types:

- `tool`: sidebar panel content
- `screen`: primary content area
- `modal`: overlay content
- `activity`: icon bar item that can activate a tool, screen, or modal
- `command`: action for palette-style execution
- `hotkey`: keyboard shortcut
- `event`: event class registration for discoverability and deduplication

All contribution IDs must be unique within their type.

## Activities

Activities are the top-level navigation model (a mode). They can activate any combination of:

- a screen
- a tool
- a modal

They can also emit an event for behavior that is not covered by direct activation.

```ts
workbench.activity({
    id: "users",
    label: "Users",
    icon: <UsersIcon />,
    activates: { screen: "users", tool: "user-filters" },
})
```

Top-placement activities render above the spacer in the icon bar. Bottom-placement activities render below it.

## Tools and placement

Tools belong to either the `primary` or `secondary` sidebar.

- If `sidebar` is omitted, the tool starts in `primary`.
- If `sidebar` is set explicitly, the placement is locked to that target.
- `order` controls initial ordering.

Workbench tracks placement separately from the tool definition so sidebars can be reordered or moved at runtime.

## Commands and hotkeys

Commands and hotkeys share the same execution model:

- `event`: the common path, dispatching through `workbench.emit()`
- `run`: an escape hatch for imperative behavior

Use `event` when possible. Use `run` when you need direct method calls or non-event logic.

## Events

Workbench exposes its own event bus contract and will fall back to an internal bus when no external bus is provided. If `@artisansdk/architect` is installed and loadable, Workbench will use Architect's `Bus` automatically.

The shell itself ships three core event classes:

- `SideBarOpen`
- `SideBarClose`
- `SideBarToggle`

These are registered by the constructor and available even if no plugin adds them.
