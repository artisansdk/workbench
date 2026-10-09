# Bus

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
