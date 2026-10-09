# Common Patterns

## Provider-level bootstrapping

Register plugins before calling `boot()`:

- attach feature plugins first
- attach optional shell plugins such as the command palette
- call `boot()` last

This matters because Workbench runs all `register()` phases before any `boot()` phase, so the full plugin set should already be known.

## Screen-only activity

A feature can contribute a screen and an activity that activates only that screen:

```ts
workbench.screen({ id: "todos", component: TodoListScreen })

workbench.activity({
    id: "todos",
    label: "Todos",
    icon: <TodoIcon />,
    activates: { screen: "todos" },
})
```

Use this when the main content area is the whole feature.

## Screen plus focused tool

A feature can activate both a screen and a tool:

```ts
workbench.activity({
    id: "users",
    label: "Users",
    icon: <UsersIcon />,
    activates: { screen: "users", tool: "user-filters" },
})
```

Use this when the feature depends on a sidebar being open alongside the screen.

## Bottom-placement utility tools

Global utility plugins can attach activity items at the bottom of the icon bar. Workbench reserves this space for the developer.

That gives the shell a stable place for global utilities while reserving the primary stack for domain navigation.

## Commands as discoverable affordances

Register both hotkeys and commands for important actions:

- hotkeys make actions fast for repeat users
- commands make the same actions discoverable through the palette

If a user can trigger something from a keyboard shortcut, it usually deserves a command entry too.

Additionally this pattern provides cleaner code as the hotkey can fire the command in it's handler.

```ts
@todo add an example
```

## Events for shell coordination

The shell-side `SideBarToggle` event is a good model for plugin cooperation:

- plugins emit intent
- the shell owns the UI reaction

That keeps plugins from reaching into component internals.
