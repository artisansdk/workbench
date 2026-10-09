# Listening

Plugins usually attach listeners during `register()`:

```ts
workbench.on(SideBarToggle, (event) => {
    console.log(event.options.target)
})
```

`workbench.on()` stores the unsubscriber with the current plugin, so it is cleaned up automatically when the plugin is disabled or stopped.

The bus also supports direct usage through `workbench.events` when you need lower-level features such as `once()` or `until()`.
