import type { EventClass } from "../EventBus"
import Contribution from "./Contribution"

// Mirrors Bus's own name resolution (static `label`, else the class name) so
// the id used for dedup here is the same channel name Bus dispatches on.
function resolveEventId(eventClass: EventClass): string {
    if ("label" in eventClass && typeof (eventClass as { label?: unknown }).label === "string") {
        return (eventClass as { label: string }).label
    }

    return eventClass.name
}

export default class Event extends Contribution<EventClass> {
    constructor() {
        super({
            type: "Event",
            getId: resolveEventId,
        })
    }
}
