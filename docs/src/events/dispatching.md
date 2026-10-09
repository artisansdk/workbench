# Dispatching

Workbench exposes the bus through `workbench.events` and also provides `workbench.emit()` as the common convenience method.

```ts
workbench.emit(new SideBarToggle({ target: "primary" }))
```

When dispatching:

- class instances are delivered as the event payload
- string events use the optional second argument as payload
- string events default to `{}` when no payload is provided
