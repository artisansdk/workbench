# SideBarOpen

`SideBarOpen` requests that a sidebar expand.

## Usage

```ts
import { SideBarOpen } from "@artisansdk/workbench"

workbench.emit(new SideBarOpen({ target: "secondary" }))
```

## Payload

```ts
type Options = {
    target: "primary" | "secondary"
}
```

If `target` is omitted, the event defaults to the primary sidebar.

## Behavior

The React `Sidebar` component listens for this event and expands the matching sidebar when it is received.
