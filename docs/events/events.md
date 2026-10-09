# Events

Workbench uses events for shell coordination and plugin-to-plugin communication.

At the package level there are two distinct pieces:

- event classes, which give an action a stable name and payload shape
- an event bus, which delivers those events to listeners

Most integrations use events for UI intent rather than direct component control. A plugin emits an event such as `SideBarToggle`, and the shell reacts to it.

## Event names

Workbench resolves an event name using the same rules for registration and dispatch:

1. If the event is a string, that string is the event name.
2. If the event is a class with a static `label`, that label is the event name.
3. Otherwise the class name is used.

That makes class-based events the best default for most Workbench APIs. They keep the name and payload together and avoid stringly-typed coordination.

## Dispatch model

Workbench exposes the bus through `workbench.events` and also provides `workbench.emit()` as the common convenience method.

```ts
workbench.emit(new SideBarToggle({ target: "primary" }))
```

When dispatching:

- class instances are delivered as the event payload
- string events use the optional second argument as payload
- string events default to `{}` when no payload is provided

## Listening

Plugins usually attach listeners during `register()`:

```ts
workbench.on(SideBarToggle, (event) => {
    console.log(event.options.target)
})
```

`workbench.on()` stores the unsubscriber with the current plugin, so it is cleaned up automatically when the plugin is disabled or stopped.

The bus also supports direct usage through `workbench.events` when you need lower-level features such as `once()` or `until()`.

## Bus capabilities

The built-in Workbench bus supports the same core behavior whether it is using the in-package bus or an installed Architect bus:

- `listen(event, listener)`
- `once(event, listener)`
- `dispatch(event, payload?)`
- `fire(event, payload?)`
- `until(event, payload?)`
- `push(event, payload?)`
- `flush(event)`
- `forget(event)`
- `forgetPushed()`
- `hasListeners(event)`
- `subscribe(subscriber)`

Wildcard listeners are also supported:

```ts
workbench.events.listen("*", (event) => {
    console.log(event)
})
```

Wildcard listeners receive the event payload, not the event name.

## Built-in shell events

Workbench registers three shell events in its constructor so they are always available:

- `SideBarOpen`
- `SideBarClose`
- `SideBarToggle`

These events target either the `primary` or `secondary` sidebar.

## `SideBarOpen`

Use `SideBarOpen` to request that a sidebar expand.

```ts
workbench.emit(new SideBarOpen({ target: "secondary" }))
```

Payload shape:

```ts
type Options = {
    target: "primary" | "secondary"
}
```

If `target` is omitted, the event defaults to the primary sidebar.

## `SideBarClose`

Use `SideBarClose` to request that a sidebar collapse.

```ts
workbench.emit(new SideBarClose({ target: "primary" }))
```

Payload shape:

```ts
type Options = {
    target: "primary" | "secondary"
}
```

If `target` is omitted, the event defaults to the primary sidebar.

## `SideBarToggle`

Use `SideBarToggle` to invert the open or closed state of a sidebar.

```ts
workbench.emit(new SideBarToggle({ target: "primary" }))
```

Payload shape:

```ts
type Options = {
    target: "primary" | "secondary"
}
```

If `target` is omitted, the event defaults to the primary sidebar.

## When to use events

Use events when:

- a plugin wants to request shell behavior without knowing component internals
- multiple plugins may react to the same action
- the action has a meaningful name and payload

Prefer direct method calls when:

- you are already inside code that owns the `Workbench` instance
- no cross-plugin coordination is needed
- the behavior is purely local and imperative

For example, `workbench.openModal("user-editor")` is often clearer than inventing a one-off event just to open a single modal.
