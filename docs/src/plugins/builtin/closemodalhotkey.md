# `CloseModalHotkeyPlugin`

Core export:

```ts
import { CloseModalHotkeyPlugin } from "@artisansdk/workbench"
```

Behavior:

- registers a hotkey that calls `workbench.closeModal()`
- defaults to `Escape`
- can be disabled by passing `hotkey: null`

```ts
workbench.use(new CloseModalHotkeyPlugin())
```
