# SideBarToggle

`SideBarToggle` requests that a sidebar invert its current open or closed state.

## Usage

```ts
import { SideBarToggle } from "@artisansdk/workbench"

workbench.emit(new SideBarToggle({ target: "primary" }))
```

## Payload

```ts
type Options = {
    target: "primary" | "secondary"
}
```

If `target` is omitted, the event defaults to the primary sidebar.

## Behavior

The React `Sidebar` component listens for this event and toggles the matching sidebar when it is received.
