# Plugin Lifecycle

## `use()`

`workbench.use(plugin, origin?)` queues a plugin for registration.

```ts
workbench.use(new SettingsPlugin())
workbench.use(new ThirdPartyPlugin(), "third-party")
```

Origin matters for policy:

- only `first-party` plugins may add bottom-placement activity items
- required `first-party` plugins cannot be disabled

## `register()`

Use `register()` for static contributions and event listeners.

Typical responsibilities:

- register screens, tools, modals
- register commands and hotkeys
- register event classes
- subscribe to bus events with `workbench.on()`

If `register()` returns a cleanup function, Workbench stores it and runs it on disable or stop.

## `boot()`

Use `boot()` for post-registration startup behavior.

Typical responsibilities:

- activate an initial screen
- open or focus an initial tool
- derive state from contributions that other plugins registered

Because all plugins finish `register()` before any `boot()` begins, `boot()` is the safe place to depend on other plugins' registrations.

## `disable()` and `enable()`

Disabling a plugin:

- runs cleanup functions in reverse order
- unregisters that plugin's tools, screens, modals, activities, events, hotkeys, and commands
- removes tracked tool placement state
- closes removed modals, drawers, and focused tool sidebars
- moves off a removed screen to the first remaining screen (or no screen), clearing its navigation guard
- marks the plugin as disabled

Re-enabling a plugin reruns both phases:

1. `register()`
2. `boot()`

This makes plugins effectively restartable. Their own code should be written to tolerate re-entry.

Both methods work while the shell is mounted. Contribution changes update navigation,
tools, status items, commands, and hotkey bindings without reloading the page. Re-enabling
does not restore previously open UI unless the plugin's `boot()` opens it.

## `stop()`

`stop()` runs all plugin cleanup functions and clears the stored cleanup arrays. It does not rebuild registries or reset UI state; it is a shutdown hook, not a full reset.
