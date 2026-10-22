# React Shell

The React entrypoint lives under `@artisansdk/workbench/react`.

## Main exports

- `Shell`
- `WorkbenchRoot`
- `useWorkbench()`
- `useWorkbenchComponents()`
- `useHotkeys()`
- `useLayout()`
- default shell components
- `CommandPalette`
- `CommandPalettePlugin`

## `Shell`

`Shell` is the highest-level renderer:

```tsx
<Shell workbench={workbench} />
```

It wraps `WorkbenchRoot`, installs hotkey bindings, renders the active screen and the chrome around it for the current layout, and hosts the active drawer, modal, and toasts.

### Desktop and mobile

One shell serves both layouts and picks between them by screen width:

- **Desktop** — icon bar, resizable sidebars, status bar.
- **Mobile** — a header bar (filled by the screen through `<ScreenHeader>`), a bottom nav, and the app menu. Sidebar content renders as a bottom sheet.

Both are on by default, and widths below `mobileBreakpoint` (768px) get the mobile layout. Turn one off to pin the shell to the other:

```tsx
<Shell workbench={workbench} />                        // follows the screen
<Shell workbench={workbench} mobileBreakpoint={640} /> // a different switch point
<Shell workbench={workbench} desktop={false} />        // always mobile
<Shell workbench={workbench} mobile={false} />         // always desktop
```

Crossing the breakpoint (a window resized, a tablet turned) swaps the chrome in place without remounting the open screen, and a sidebar whose tool is focused opens on the way back to desktop. `hideHeaderOnScroll` (default `true`) tucks the mobile header away while the screen scrolls down.

Components whose shape differs between the layouts read it with `useLayout()`:

```tsx
const layout = useLayout() // "desktop" | "mobile"
```

For anything beyond these two layouts, replace the pieces through `components`.

Choose the shell presentation and number of available sidebars with `variant` and `sidebars`:

```tsx
<Shell workbench={workbench} variant="classic" sidebars={1} />
```

- `variant="modern"` uses the compact icon-only activity rail and is the default.
- `variant="classic"` uses a wider activity rail with each activity's icon and label.
- `sidebars={0}` renders no sidebars, `sidebars={1}` enables the primary sidebar, and `sidebars={2}` enables both. The default is `2`; enabled sidebars with no registered tools remain hidden.

## Context and reactivity

`WorkbenchRoot` provides the `Workbench` instance through React context.

Create one `Workbench` instance and pass it to `Shell` or `WorkbenchRoot`. `new Workbench()` creates a Valtio proxy; consumers do not need an additional proxy or a shell-wide `useSnapshot()` subscription.

`useWorkbench()` uses a Valtio snapshot to track the properties read during rendering. Reading `activeModalId` subscribes to modal changes; reading only `activeScreenId` does not. A component that only calls commands does not subscribe to modal state. Normal React parent renders can still render children.

```tsx
function ModalLabel() {
    const workbench = useWorkbench()
    return <span>{workbench.activeModalId ?? "No modal"}</span>
}

function OpenSettings() {
    const workbench = useWorkbench()
    return <button onClick={() => workbench.openModal("settings")}>Settings</button>
}
```

Render reads use a tracked snapshot; event handlers and effects read and mutate the live instance. Keep method calls on the object (`workbench.openModal(id)`) so they retain their receiver. Custom shell components use the same hook and receive the same property-level subscriptions.

The hook returns a new view each render, not the original instance. Do not put that view in effect dependencies: doing so restarts subscriptions and runs cleanup on every render. Depend on the specific values or stable objects the effect uses. For example, the event bus retains its identity:

```tsx
const { events } = useWorkbench()

useEffect(() => events.listen(MyEvent, onEvent), [events, onEvent])
```

When migrating, remove consumer-side subscriptions that force the entire shell to render, and replace effects keyed on the hook's returned object with specific dependencies. See [Mutable public state](workbench-api.md#mutable-public-state).

## Component overrides

You can replace shell pieces without replacing the full shell:

```tsx
<Shell
    workbench={workbench}
    components={{
        IconBar: MyIconBar,
        Sidebar: MySidebar,
    }}
/>
```

Available override points:

- `IconBar`
- `IconBarButton`
- `Sidebar`
- `ToolPane`
- `ScreenHost`
- `ModalHost`
- `DrawerHost`
- `StatusBar`
- `BottomNav` (mobile)
- `AppMenu` (mobile)
- `ToastHost`
- `Toast` — draws one notice from `workbench.toast()`; receives `variant`, `icon`, `action`, `onDismiss` and the message as `children`

Unspecified entries fall back to the default components.

## Sidebar behavior

The `Sidebar` component listens for:

- [`SideBarOpen`](events/builtin/sidebaropen.md)
- [`SideBarClose`](events/builtin/sidebarclose.md)
- [`SideBarToggle`](events/builtin/sidebartoggle.md)

It starts collapsed (open, when its tool is already focused as it mounts) and restores its last width when reopened through `react-resizable-panels`.

On mobile a sidebar is a bottom sheet. The shell adds no trigger for it — screens provide their own, as on desktop. `SideBarOpen` and `SideBarToggle` open the sheet. `SideBarOpen` with `beside: true` — a screen opening its panel next to itself as it mounts — only focuses the tool there, since a sheet would cover the screen. An activity that switches screen and opens a tool opens it `beside`.

## Hotkeys

`useHotkeys()` converts `workbench.effectiveHotkeys()` — the registered hotkeys with the user's `keybindings` applied — into a single `tinykeys()` binding map.

Hotkeys rebind when the set of `(id, keys)` pairs changes.

## Screen and modal rendering

- `ScreenHost` renders the currently active screen component
- `ModalHost` renders the active modal inside a backdrop and wires `close()`. A framed modal scales up from 95% and fades in; closing it from inside (backdrop, ✕, or the modal's `close()`) plays a shorter exit before it unmounts, while `workbench.closeModal()` removes it at once. Tuned with `--wb-modal-ease`, `--wb-modal-enter-duration` and `--wb-modal-exit-duration`; with reduced motion it only fades.
- `DrawerHost` renders the active drawer with Vaul and wires swipe, backdrop, and `close()` dismissal

Tool and modal components receive helper props from the shell:

```ts
type ToolProps = {
    emit: (event: unknown, payload?: unknown) => void
}

type ModalProps = {
    emit: (event: unknown, payload?: unknown) => void
    close: () => void
    /** While set, a dismissal the user starts (backdrop, ✕, swipe) calls this instead of closing. */
    guard: (handler: (() => void) | null) => void
}
```

A modal component is only its content: the host draws the backdrop, frame, close button and animation (or the sheet, on mobile), so every modal looks and moves the same. `guard` is for content that shouldn't be dismissed carelessly — set it while there's unsaved work, and ask from the handler.

Drawers take `emit` and `close` and add an accessible label at registration:

```tsx
workbench.drawer({
    id: "filters",
    label: "Filters",
    component: FiltersDrawer,
})

workbench.openDrawer("filters")
```

Status bar items are registered into the left, center, or right section. Each section is a fit-content, shrinking flex row, and the bar overlays the bottom of the complete shell below drawers:

```tsx
workbench.statusBarItem({
    id: "connection",
    section: "right",
    component: ConnectionStatus,
})

workbench.showStatusBar()
```

The status bar is hidden by default. Call `hideStatusBar()` to hide it without unregistering its items.
