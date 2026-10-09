# Events

Workbench uses events for shell coordination and plugin-to-plugin communication.

At the package level there are two distinct pieces:

- event classes, which give an action a stable name and payload shape
- an event bus, which delivers those events to listeners

Most integrations use events for UI intent rather than direct component control. A plugin emits an event such as `SideBarToggle`, and the shell reacts to it.
