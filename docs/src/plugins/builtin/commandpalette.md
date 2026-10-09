# `CommandPalettePlugin`

React export:

```ts
import { CommandPalettePlugin } from "@artisansdk/workbench/react"
```

Behavior:

- registers the command palette modal
- registers `OpenCommandPalette`
- listens for that event and opens the modal
- optionally registers the palette hotkey

Default hotkey: `$mod+k`

```ts
workbench.use(new CommandPalettePlugin())
```

The reserved modal ID is:

```ts
COMMAND_PALETTE_MODAL_ID = "$workbench:command-palette"
```

Use `hotkey: null` if you want the palette available without a default binding.
