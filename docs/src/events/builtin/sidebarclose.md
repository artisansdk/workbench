# SideBarClose

`SideBarClose` requests that a sidebar collapse.

## Usage

```ts
import { SideBarClose } from "@artisansdk/workbench"

workbench.emit(new SideBarClose({ target: "primary" }))
```

## Payload

```ts
type Options = {
    target: "primary" | "secondary"
}
```

If `target` is omitted, the event defaults to the primary sidebar.

## Behavior

The React `Sidebar` component listens for this event and collapses the matching sidebar when it is received.
