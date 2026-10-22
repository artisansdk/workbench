# Workbench API

## Registration methods

These methods are only valid while a plugin's `register()` or `boot()` is executing:

- `tool(tool)`
- `screen(screen)`
- `modal(modal)` — `{ id, component, sheet?, label? }`; the component is only the content — the host draws the backdrop, frame, close button and animation; `sheet` shows it as a bottom sheet in the mobile shell, titled `label` for screen readers
- `drawer(drawer)`
- `statusBarItem(item)`
- `activity(item)`
- `event(eventClass)`
- `hotkey(hotkey)` — `{ id, keys, label?, event?, run? }`; `keys` in tinykeys syntax. `label` names it in a keybindings list, falling back to the same-id command's label, then the humanized id
- `command(command)`
- `on(event, handler)`

Calling them outside plugin execution throws because Workbench needs an active plugin ID to attribute ownership.

## Constructor

```ts
new Workbench(events?)
```

If you pass an event bus, Workbench uses it directly. If you do not, Workbench creates one:

- Architect `Bus` when `@artisansdk/architect` is installed and loadable
- otherwise the package's built-in `LocalEventBus`

## Query methods

- `toolsFor(target)`
- `getTool(id)`
- `getScreen(id)`
- `getModal(id)`
- `getDrawer(id)`
- `commands()`
- `getCommand(id)`
- `activityItems()`
- `registeredEvents()`
- `registeredHotkeys()` — as plugins registered them
- `effectiveHotkeys()` — as actually bound: `keybindings` overrides applied, command bindings added; each labelled
- `hotkeyLabel(hotkey)`

These are the main read-side APIs consumed by the React shell.

## State-changing methods

### Navigation and overlays

- `activate(activityItemId)`
- `reactivate(activityItemId)` — what an activity button calls when its activity is already active: the item's `reactivates` target if it has one (e.g. `{ modal: "select-binder" }`), otherwise `activate()`
- `openModal(id)`
- `closeModal()`
- `openDrawer(id)`
- `closeDrawer()`
- `statusBarItems(section)`
- `showStatusBar()`
- `hideStatusBar()`
- `toast(message, options?)` — a notice that isn't worth interrupting for; returns its id. `options`: `variant` (`neutral` | `positive` | `warning` | `negative`), `action` (`{ label, onClick }`), `icon` (`null` for none), `onDismiss` (replaces taking it down), `id` (an existing id updates that notice in place and restarts its timer), `duration` (ms; `Infinity` until dismissed)
- `dismissToast(id)`
- `toastInset` — px to lift notices clear of something parked at the bottom of the screen; `0` for nothing

`activate()` can change screen focus, tool focus, modal state, and optionally emit an event.

### Commands and hotkeys

- `runCommand(id)`
- `runHotkey(id)` — a `command:<id>` id runs that command

Both resolve the registered item, optionally emit its event, then call its `run()` handler if one exists.

### Tool placement

- `moveTool(id, target, index?)`
- `reorderTool(id, index)`

`moveTool()` can change sidebars unless the tool was explicitly locked to a sidebar by its definition.

### Events

- `emit(event, payload?)`

Dispatches through the underlying `Bus`.

## Mutable public state

The `Workbench` instance exposes reactive mutable fields:

- `activeScreenId`
- `activeModalId`
- `activeDrawerId`
- `statusBarVisible`
- `focusedTool`
- `primarySide`
- `toastInset`
- `keybindings` — the user's keybindings over the registered ones: a hotkey id maps to replacement keys (a hotkey can be moved, never switched off), and `command:<id>` binds keys to a command. Not persisted by the workbench; the app stores it and assigns it back.

`new Workbench()` returns a Valtio proxy. Direct assignments and methods such as `openModal()` and `closeModal()` update the same observable state. Each React component subscribes to the properties it reads through `useWorkbench()`.

```tsx
import { useWorkbench } from "@artisansdk/workbench/react"

function ActiveScreenLabel() {
    const workbench = useWorkbench()

    return <span>{workbench.activeScreenId ?? "none"}</span>
}
```

This component subscribes to `activeScreenId`; opening a modal alone does not trigger its subscription. Nested reads such as `workbench.focusedTool.primary` are tracked too. The event bus remains a stable reference and is separate from state subscriptions: direct state changes do not need to dispatch an event.

## Error behavior

Workbench throws on:

- duplicate plugin IDs
- duplicate contribution IDs
- unknown tool, command, modal, or activity IDs where the API expects a registered one
- attempts to disable required first-party plugins
- attempts to move a tool across sidebars when that tool is locked
