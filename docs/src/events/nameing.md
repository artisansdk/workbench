# Nameing

Workbench resolves an event name using the same rules for registration and dispatch:

1. If the event is a string, that string is the event name.
2. If the event is a class with a static `label`, that label is the event name.
3. Otherwise the class name is used.

That makes class-based events the best default for most Workbench APIs. They keep the name and payload together and avoid stringly-typed coordination.
