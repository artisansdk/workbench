# `CloseModalHotkeyPlugin`

Core export:

```ts
import { CloseModalHotkeyPlugin } from "@artisansdk/workbench"
```

`ModalHost` closes modals on Escape by itself, going through a modal's guard and playing its exit, so most apps don't need this. It's for binding closing to another key, and it closes outright: no guard, no exit.

Behavior:

- registers a hotkey that calls `workbench.closeModal()`
- defaults to `Escape`
- can be disabled by passing `hotkey: null`

```ts
workbench.use(new CloseModalHotkeyPlugin())
```
