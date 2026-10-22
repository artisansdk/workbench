import { createElement, type ReactNode } from "react"
import hotToast from "react-hot-toast"
import { proxy, ref } from "valtio"
import { createEventBus, type EventBus, type EventClass, type EventIdentifier, type Listener } from "./EventBus"
import SideBarClose from "./Events/SideBarClose"
import SideBarOpen from "./Events/SideBarOpen"
import SideBarToggle from "./Events/SideBarToggle"
import type { Cleanup, Plugin } from "./Plugin"
import { ToastContent } from "./React/Components/ToastHost"
import ActivityRegistry from "./Registry/Activity"
import CommandRegistry from "./Registry/Command"
import DrawerRegistry from "./Registry/Drawer"
import EventRegistry from "./Registry/Event"
import HotkeyRegistry from "./Registry/Hotkey"
import ModalRegistry from "./Registry/Modal"
import ScreenRegistry from "./Registry/Screen"
import StatusBarRegistry from "./Registry/StatusBar"
import ToolRegistry from "./Registry/Tool"
import type {
    ActivityItem,
    ActivityTarget,
    Command,
    Drawer,
    EffectiveHotkey,
    Hotkey,
    Modal,
    PluginOrigin,
    Screen,
    Side,
    SidebarTarget,
    StatusBarItem,
    StatusBarSection,
    ToastOptions,
    Tool,
} from "./Types"

type PluginEntry = {
    plugin: Plugin
    origin: PluginOrigin
    enabled: boolean
    cleanups: Cleanup[]
    toolIds: Set<string>
}

type PlacementEntry = {
    sidebar: SidebarTarget
    order: number
    locked: boolean
}

export class Workbench {
    readonly events: EventBus

    protected tools = new ToolRegistry()
    protected screens = new ScreenRegistry()
    protected modals = new ModalRegistry()
    protected drawers = new DrawerRegistry()
    protected statusBarRegistry = new StatusBarRegistry()
    protected activityRegistry = new ActivityRegistry()
    protected eventRegistry = new EventRegistry()
    protected hotkeys = new HotkeyRegistry()
    protected commandRegistry = new CommandRegistry()

    protected plugins = new Map<string, PluginEntry>()
    protected placement = new Map<string, PlacementEntry>()

    protected currentPluginId: string | null = null
    protected currentOrigin: PluginOrigin | null = null

    activeScreenId: string | null = null
    activeModalId: string | null = null
    activeDrawerId: string | null = null
    statusBarVisible = false
    focusedTool: Record<SidebarTarget, string | null> = { primary: null, secondary: null }
    primarySide: Side = "left"
    /** How far up (px) notices sit to clear something parked at the bottom of the screen; 0 for nothing. */
    toastInset = 0
    /**
     * The user's keybindings, layered over what plugins registered: a hotkey's
     * id maps to its replacement keys, and `command:<id>` binds keys to a
     * command that has no hotkey of its own. A hotkey can be moved, never
     * switched off. Not persisted here — the app stores it however it likes
     * and assigns it back.
     */
    keybindings: Record<string, string> = {}

    constructor(events: EventBus = createEventBus()) {
        this.events = ref(events)

        // Built into the package, not app-contributed — registered directly
        // (bypassing the plugin gate) so they're always discoverable via
        // registeredEvents(), with no opt-in plugin required.
        this.eventRegistry.register(SideBarOpen, "$workbench:core")
        this.eventRegistry.register(SideBarClose, "$workbench:core")
        this.eventRegistry.register(SideBarToggle, "$workbench:core")

        // Own reactivity so callers can mutate this instance without wrapping it.
        return proxy(this)
    }

    use(plugin: Plugin, origin: PluginOrigin = "first-party"): this {
        if (this.plugins.has(plugin.id)) {
            throw new Error(`Duplicate plugin id: ${plugin.id}`)
        }

        this.plugins.set(plugin.id, { plugin, origin, enabled: true, cleanups: [], toolIds: new Set() })

        return this
    }

    boot(): this {
        for (const pluginId of this.plugins.keys()) {
            this.runPluginPhase(pluginId, "register")
        }

        for (const pluginId of this.plugins.keys()) {
            this.runPluginPhase(pluginId, "boot")
        }

        return this
    }

    tool(tool: Tool): this {
        const { id: pluginId } = this.requireCurrentPlugin()

        this.tools.register(tool, pluginId)
        this.plugins.get(pluginId)?.toolIds.add(tool.id)
        this.placement.set(tool.id, {
            sidebar: tool.sidebar ?? "primary",
            locked: tool.sidebar !== undefined,
            order: tool.order ?? this.placement.size,
        })

        return this
    }

    screen(screen: Screen): this {
        const { id: pluginId } = this.requireCurrentPlugin()

        this.screens.register(screen, pluginId)

        return this
    }

    modal(modal: Modal): this {
        const { id: pluginId } = this.requireCurrentPlugin()

        this.modals.register(modal, pluginId)

        return this
    }

    drawer(drawer: Drawer): this {
        const { id: pluginId } = this.requireCurrentPlugin()

        this.drawers.register(drawer, pluginId)

        return this
    }

    statusBarItem(item: StatusBarItem): this {
        const { id: pluginId } = this.requireCurrentPlugin()

        this.statusBarRegistry.register(item, pluginId)

        return this
    }

    event(eventClass: EventClass): this {
        const { id: pluginId } = this.requireCurrentPlugin()

        this.eventRegistry.register(eventClass, pluginId)

        return this
    }

    registeredEvents(): EventClass[] {
        return this.eventRegistry.all()
    }

    hotkey(hotkey: Hotkey): this {
        const { id: pluginId } = this.requireCurrentPlugin()

        this.hotkeys.register(hotkey, pluginId)

        return this
    }

    registeredHotkeys(): Hotkey[] {
        return this.hotkeys.all()
    }

    /** What a hotkey does, in words: its label, else the same-id command's, else its id. */
    hotkeyLabel(hotkey: Hotkey): string {
        if (hotkey.label) return hotkey.label

        const command = this.commandRegistry.get(hotkey.id)
        if (command) return command.label

        // "$workbench:open-command-palette" → "Open command palette"
        const words = hotkey.id
            .replace(/^\$[^:]*:/, "")
            .replace(/[-_]+/g, " ")
            .trim()

        return words.charAt(0).toUpperCase() + words.slice(1)
    }

    /** Every hotkey as it's actually bound: overrides applied, command bindings added. */
    effectiveHotkeys(): EffectiveHotkey[] {
        const registered = this.hotkeys.all().map((hotkey) => ({
            ...hotkey,
            keys: this.keybindings[hotkey.id] || hotkey.keys,
            label: this.hotkeyLabel(hotkey),
        }))

        const commands = Object.entries(this.keybindings).flatMap(([id, keys]) => {
            const command = id.startsWith("command:")
                ? this.commandRegistry.get(id.slice("command:".length))
                : undefined

            return command && keys ? [{ id, keys, label: command.label }] : []
        })

        return [...registered, ...commands]
    }

    runHotkey(id: string): this {
        if (id.startsWith("command:")) {
            return this.runCommand(id.slice("command:".length))
        }

        const hotkey = this.hotkeys.get(id)

        if (!hotkey) {
            throw new Error(`Unknown hotkey: ${id}`)
        }

        if (hotkey.event) {
            this.emit(hotkey.event)
        }

        hotkey.run?.()

        return this
    }

    command(command: Command): this {
        const { id: pluginId } = this.requireCurrentPlugin()

        this.commandRegistry.register(command, pluginId)

        return this
    }

    commands(): Command[] {
        return this.commandRegistry.all()
    }

    getCommand(id: string): Command | undefined {
        return this.commandRegistry.get(id)
    }

    runCommand(id: string): this {
        const command = this.commandRegistry.get(id)

        if (!command) {
            throw new Error(`Unknown command: ${id}`)
        }

        if (command.event) {
            this.emit(command.event)
        }

        command.run?.()

        return this
    }

    activity(item: ActivityItem): this {
        const { id: pluginId, origin } = this.requireCurrentPlugin()

        if ((item.placement ?? "top") === "bottom" && origin !== "first-party") {
            throw new Error(
                `Only first-party plugins may register bottom-placement activity items (attempted by ${pluginId}).`,
            )
        }

        this.activityRegistry.register(item, pluginId)

        return this
    }

    on(event: EventIdentifier, handler: Listener): Cleanup {
        const { id: pluginId } = this.requireCurrentPlugin()
        const unsubscribe = this.events.listen(event, handler)

        this.plugins.get(pluginId)?.cleanups.push(unsubscribe)

        return unsubscribe
    }

    emit(event: unknown, payload?: unknown): void {
        void this.events.dispatch(event, payload)
    }

    disable(pluginId: string): this {
        const entry = this.plugins.get(pluginId)

        if (!entry) {
            throw new Error(`Unknown plugin: ${pluginId}`)
        }

        if (!entry.enabled) {
            return this
        }

        if (entry.plugin.required && entry.origin === "first-party") {
            throw new Error(`Plugin ${pluginId} is required and cannot be disabled`)
        }

        for (const cleanup of [...entry.cleanups].reverse()) {
            cleanup()
        }

        entry.cleanups = []
        this.tools.unregisterSource(pluginId)
        this.screens.unregisterSource(pluginId)
        this.modals.unregisterSource(pluginId)
        this.drawers.unregisterSource(pluginId)
        this.statusBarRegistry.unregisterSource(pluginId)
        this.activityRegistry.unregisterSource(pluginId)
        this.eventRegistry.unregisterSource(pluginId)
        this.hotkeys.unregisterSource(pluginId)
        this.commandRegistry.unregisterSource(pluginId)

        for (const toolId of entry.toolIds) {
            this.placement.delete(toolId)
        }

        entry.toolIds.clear()
        entry.enabled = false

        return this
    }

    enable(pluginId: string): this {
        const entry = this.plugins.get(pluginId)

        if (!entry) {
            throw new Error(`Unknown plugin: ${pluginId}`)
        }

        if (entry.enabled) {
            return this
        }

        this.runPluginPhase(pluginId, "register")
        this.runPluginPhase(pluginId, "boot")
        entry.enabled = true

        return this
    }

    toolsFor(target: SidebarTarget): Tool[] {
        return this.toolIdsFor(target)
            .map((id) => this.tools.get(id))
            .filter((tool): tool is Tool => tool !== undefined)
    }

    moveTool(id: string, target: SidebarTarget, index?: number): this {
        const entry = this.placement.get(id)

        if (!entry) {
            throw new Error(`Unknown tool: ${id}`)
        }

        if (entry.locked && entry.sidebar !== target) {
            throw new Error(`Tool ${id} is locked to the ${entry.sidebar} sidebar`)
        }

        if (entry.sidebar !== target) {
            this.reindex(this.toolIdsFor(entry.sidebar).filter((toolId) => toolId !== id))
        }

        entry.sidebar = target

        const siblings = this.toolIdsFor(target).filter((toolId) => toolId !== id)
        siblings.splice(index ?? siblings.length, 0, id)
        this.reindex(siblings)

        return this
    }

    reorderTool(id: string, index: number): this {
        const entry = this.placement.get(id)

        if (!entry) {
            throw new Error(`Unknown tool: ${id}`)
        }

        const siblings = this.toolIdsFor(entry.sidebar).filter((toolId) => toolId !== id)
        siblings.splice(index, 0, id)
        this.reindex(siblings)

        return this
    }

    getTool(id: string): Tool | undefined {
        return this.tools.get(id)
    }

    getScreen(id: string): Screen | undefined {
        return this.screens.get(id)
    }

    getModal(id: string): Modal | undefined {
        return this.modals.get(id)
    }

    openModal(id: string): this {
        if (!this.modals.get(id)) {
            throw new Error(`Unknown modal: ${id}`)
        }

        this.activeModalId = id

        return this
    }

    closeModal(): this {
        this.activeModalId = null

        return this
    }

    /**
     * Says something to the user that isn't worth interrupting them for —
     * background work (a sync, an import) that has no screen of its own to
     * report on. A notice outlives whichever screen is mounted.
     *
     * @returns the notice's id, so a caller can update it or take it down.
     */
    toast(message: ReactNode, { id, duration, ...spec }: ToastOptions = {}): string {
        return hotToast((toast) => createElement(ToastContent, { spec: { ...spec, message }, toast }), { id, duration })
    }

    dismissToast(id: string): this {
        hotToast.dismiss(id)

        return this
    }

    getDrawer(id: string): Drawer | undefined {
        return this.drawers.get(id)
    }

    openDrawer(id: string): this {
        if (!this.drawers.get(id)) {
            throw new Error(`Unknown drawer: ${id}`)
        }

        this.activeDrawerId = id

        return this
    }

    closeDrawer(): this {
        this.activeDrawerId = null

        return this
    }

    statusBarItems(section: StatusBarSection): StatusBarItem[] {
        return this.statusBarRegistry.all().filter((item) => item.section === section)
    }

    showStatusBar(): this {
        this.statusBarVisible = true

        return this
    }

    hideStatusBar(): this {
        this.statusBarVisible = false

        return this
    }

    activityItems(): ActivityItem[] {
        return this.activityRegistry.all()
    }

    activate(activityItemId: string): this {
        const item = this.activityRegistry.get(activityItemId)

        if (!item) {
            throw new Error(`Unknown activity item: ${activityItemId}`)
        }

        this.apply(item.activates)

        if (item.event) {
            this.emit(item.event)
        }

        return this
    }

    /**
     * Pressing an activity that's already active: its `reactivates` target if
     * it has one, otherwise the same as activate().
     */
    reactivate(activityItemId: string): this {
        const item = this.activityRegistry.get(activityItemId)

        if (!item?.reactivates) {
            return this.activate(activityItemId)
        }

        this.apply(item.reactivates)

        return this
    }

    protected apply(target: ActivityTarget | undefined): void {
        if (target?.screen) {
            this.activeScreenId = target.screen
        }

        if (target?.tool) {
            const sidebar = this.placement.get(target.tool)?.sidebar ?? "primary"
            this.focusedTool[sidebar] = target.tool
            // A tool riding along with a screen goes beside it; on its own,
            // it's what was asked to see.
            this.emit(new SideBarOpen({ target: sidebar, beside: !!target.screen }))
        }

        if (target?.modal) {
            this.openModal(target.modal)
        }

        if (target?.drawer) {
            this.openDrawer(target.drawer)
        }
    }

    stop(): void {
        const cleanups = [...this.plugins.keys()].flatMap((id) => this.plugins.get(id)?.cleanups ?? [])

        for (const cleanup of cleanups.reverse()) {
            cleanup()
        }

        for (const entry of this.plugins.values()) {
            entry.cleanups = []
        }
    }

    protected toolIdsFor(target: SidebarTarget): string[] {
        return [...this.placement.entries()]
            .filter(([, entry]) => entry.sidebar === target)
            .sort((left, right) => left[1].order - right[1].order)
            .map(([id]) => id)
    }

    protected reindex(orderedIds: string[]): void {
        orderedIds.forEach((id, index) => {
            const entry = this.placement.get(id)

            if (entry) {
                entry.order = index
            }
        })
    }

    protected requireCurrentPlugin(): { id: string; origin: PluginOrigin } {
        if (!this.currentPluginId || !this.currentOrigin) {
            throw new Error(
                "Workbench contributions can only be registered from within a Plugin's register() or boot().",
            )
        }

        return { id: this.currentPluginId, origin: this.currentOrigin }
    }

    protected runPluginPhase(pluginId: string, phase: "register" | "boot"): void {
        const entry = this.plugins.get(pluginId)

        if (!entry) {
            return
        }

        this.currentPluginId = pluginId
        this.currentOrigin = entry.origin

        try {
            const cleanup = entry.plugin[phase](this)

            if (cleanup) {
                entry.cleanups.push(cleanup)
            }
        } finally {
            this.currentPluginId = null
            this.currentOrigin = null
        }
    }
}
