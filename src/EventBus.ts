export type EventClass<T = unknown> = {
    new (...args: any[]): T
    label?: string
}

export type EventIdentifier<T = unknown> = string | EventClass<T>
export type Listener<T = unknown> = (event: T) => void | boolean | Promise<void | boolean>
export type WildcardListener = (eventName: string, data: unknown) => void | Promise<void>
export type Unsubscribe = () => void

export interface ListenerObject<T = unknown> {
    handle(event: T): void | boolean | Promise<void | boolean>
}

export interface EventSubscriber {
    subscribe(bus: Bus): Record<string, Listener | string> | void
}

export interface EventBus {
    listen<T>(
        event: EventIdentifier<T> | Array<EventIdentifier<T>>,
        listener: Listener<T> | ListenerObject<T>,
    ): Unsubscribe
    once<T>(event: EventIdentifier<T>, listener: Listener<T> | ListenerObject<T>): Unsubscribe
    subscribe(subscriber: EventSubscriber | (new () => EventSubscriber)): void
    dispatch<T>(event: T | string, payload?: unknown): void | Promise<void>
    fire<T>(event: T | string, payload?: unknown): Promise<void>
    until<T>(event: T | string, payload?: unknown): Promise<unknown>
    push(event: string, payload?: Record<string, unknown>): void
    flush(event: string): Promise<void>
    forget(event: EventIdentifier): void
    forgetPushed(): void
    hasListeners(event: EventIdentifier): boolean
}

type ModuleLoader = (specifier: string) => unknown

function findModuleLoader(): ModuleLoader | null {
    const globalRequire = (globalThis as { require?: ModuleLoader }).require

    if (typeof globalRequire === "function") {
        return globalRequire
    }

    try {
        return Function("return typeof require === 'function' ? require : null")() as ModuleLoader | null
    } catch {
        return null
    }
}

/**
 * Attempt to wire into @artisansdk/architect if it is installed.
 */
function createArchitectBus(): EventBus | null {
    const require = findModuleLoader()

    if (!require) {
        return null
    }

    try {
        const module = require("@artisansdk/architect/events/bus") as { Bus?: new () => EventBus }

        if (typeof module.Bus === "function") {
            return new module.Bus()
        }
    } catch {
        return null
    }

    return null
}

export class Bus implements EventBus {
    protected listeners = new Map<string, Listener[]>()
    protected wildcardListeners: WildcardListener[] = []
    protected pushedEvents = new Map<string, Record<string, unknown>[]>()

    listen<T>(
        event: EventIdentifier<T> | Array<EventIdentifier<T>>,
        listener: Listener<T> | ListenerObject<T>,
    ): Unsubscribe {
        const events = Array.isArray(event) ? event : [event]
        const normalized = this.normalizeListener(listener) as Listener
        const unsubscribers: Unsubscribe[] = []

        for (const ev of events) {
            const name = this.resolveEventName(ev)

            if (name === "*") {
                const wildcardListener: WildcardListener = (_eventName, data) => void normalized(data as T)

                this.wildcardListeners.push(wildcardListener)
                unsubscribers.push(() => {
                    const index = this.wildcardListeners.indexOf(wildcardListener)

                    if (index !== -1) {
                        this.wildcardListeners.splice(index, 1)
                    }
                })

                continue
            }

            const current = this.listeners.get(name) ?? []
            current.push(normalized)
            this.listeners.set(name, current)

            unsubscribers.push(() => {
                const all = this.listeners.get(name) ?? []
                const updated = all.filter((registered) => registered !== normalized)

                if (updated.length === 0) {
                    this.listeners.delete(name)
                } else {
                    this.listeners.set(name, updated)
                }
            })
        }

        return () => {
            unsubscribers.forEach((unsubscribe) => {
                unsubscribe()
            })
        }
    }

    once<T>(event: EventIdentifier<T>, listener: Listener<T> | ListenerObject<T>): Unsubscribe {
        const normalized = this.normalizeListener(listener)
        let unsubscribe!: Unsubscribe

        const wrapped: Listener<T> = async (data: T) => {
            unsubscribe()

            return normalized(data)
        }

        unsubscribe = this.listen(event, wrapped)

        return unsubscribe
    }

    subscribe(subscriber: EventSubscriber | (new () => EventSubscriber)): void {
        const instance = typeof subscriber === "function" ? new subscriber() : subscriber
        const mappings = instance.subscribe(this)

        if (!mappings) {
            return
        }

        for (const [event, handler] of Object.entries(mappings)) {
            const listener =
                typeof handler === "string"
                    ? (data: unknown) => (instance as unknown as Record<string, Listener>)[handler]?.(data)
                    : (handler as Listener)

            this.listen(event, listener)
        }
    }

    async dispatch<T>(event: T | string, payload?: unknown): Promise<void> {
        const [name, data] = this.parseEventAndPayload(event, payload)

        for (const wildcardListener of [...this.wildcardListeners]) {
            await wildcardListener(name, data)
        }

        const listeners = [...(this.listeners.get(name) ?? [])]

        for (const listener of listeners) {
            await listener(data)
        }
    }

    fire<T>(event: T | string, payload?: unknown): Promise<void> {
        return this.dispatch(event, payload)
    }

    async until<T>(event: T | string, payload?: unknown): Promise<unknown> {
        const [name, data] = this.parseEventAndPayload(event, payload)
        const listeners = [...(this.listeners.get(name) ?? [])]

        for (const listener of listeners) {
            const result = await listener(data)

            if (result !== null && result !== false && result !== undefined) {
                return result
            }
        }

        return null
    }

    push(event: string, payload: Record<string, unknown> = {}): void {
        const queued = this.pushedEvents.get(event) ?? []
        queued.push(payload)
        this.pushedEvents.set(event, queued)
    }

    async flush(event: string): Promise<void> {
        const queued = [...(this.pushedEvents.get(event) ?? [])]
        this.pushedEvents.delete(event)

        for (const payload of queued) {
            await this.dispatch(event, payload)
        }
    }

    forget(event: EventIdentifier): void {
        this.listeners.delete(this.resolveEventName(event))
    }

    forgetPushed(): void {
        this.pushedEvents.clear()
    }

    hasListeners(event: EventIdentifier): boolean {
        const name = this.resolveEventName(event)

        return (this.listeners.get(name)?.length ?? 0) > 0 || this.wildcardListeners.length > 0
    }

    protected resolveEventName(event: unknown): string {
        if (typeof event === "string") {
            return event
        }

        if (typeof event === "function") {
            if ("label" in event && typeof event.label === "string") {
                return event.label as string
            }

            return (event as EventClass).name
        }

        const constructor = (event as object)?.constructor

        if (constructor && "label" in constructor && typeof (constructor as { label: unknown }).label === "string") {
            return (constructor as { label: string }).label
        }

        return constructor?.name ?? ""
    }

    protected parseEventAndPayload<T>(event: T | string, payload?: unknown): [string, unknown] {
        const name = this.resolveEventName(event)
        const data = typeof event === "string" ? (payload ?? {}) : event

        return [name, data]
    }

    protected normalizeListener<T>(listener: Listener<T> | ListenerObject<T>): Listener<T> {
        if (typeof listener === "function") {
            return listener
        }

        return (event: T) => listener.handle(event)
    }
}

export class LocalEventBus extends Bus {}

class EventNameResolver extends Bus {
    nameFor(event: EventIdentifier | unknown): string {
        return this.resolveEventName(event)
    }
}

export function resolveEventId(event: EventIdentifier | unknown): string {
    return new EventNameResolver().nameFor(event)
}

export function createEventBus(): EventBus {
    return createArchitectBus() ?? new Bus()
}
