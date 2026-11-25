import type { ComponentType, ReactNode } from "react"

export type SidebarTarget = "primary" | "secondary"
export type Side = "left" | "right"
export type PluginOrigin = "first-party" | "third-party"
export type StatusBarSection = "left" | "center" | "right"

/**
 * Decides whether the mobile header bar shows. The shell calls it while it
 * renders, so it can be a React hook — it may use state and effects to
 * follow whatever should hide the bar. Keep the same function for as long as
 * it's in use; passing a different one starts its hooks afresh.
 */
export type HeaderTrigger = () => boolean

export type ToolProps = {
    emit: (event: unknown, payload?: unknown) => void
}

export type ScreenProps = Record<string, unknown>

export type DrawerProps = {
    emit: (event: unknown, payload?: unknown) => void
    close: () => void
}

export type ModalProps = DrawerProps & {
    /**
     * While a handler is set, a dismissal the user starts — the backdrop, ✕,
     * or swiping the sheet — calls it instead of closing, e.g. to ask before
     * throwing work away. `close()` always closes. Pass null to clear it.
     */
    guard: (handler: (() => void) | null) => void
}
export type StatusBarItemProps = ToolProps

export type Tool = {
    id: string
    label: string
    icon: ReactNode
    /** Controls drawn at the end of the tool's header, beside its label — e.g. a "New" button. */
    actions?: ReactNode
    order?: number
    sidebar?: SidebarTarget
    component: ComponentType<ToolProps>
}

export type Screen = {
    id: string
    component: ComponentType<ScreenProps>
}

export type Modal = {
    id: string
    component: ComponentType<ModalProps>
    /** In the mobile shell, shown as a bottom sheet instead of a centered modal. */
    sheet?: boolean
    /** The sheet's accessible title; defaults to the id. */
    label?: string
}

export type Drawer = {
    id: string
    label: string
    component: ComponentType<DrawerProps>
}

export type StatusBarItem = {
    id: string
    section: StatusBarSection
    component: ComponentType<StatusBarItemProps>
}

export type Command = {
    id: string
    label: string
    icon?: ReactNode
    /** extra search terms matched alongside label, e.g. aliases/synonyms. */
    keywords?: string[]
    /** dispatched via workbench.emit() when run — the common case. */
    event?: unknown
    /** called directly when run — the escape hatch for anything a bare event can't express. */
    run?: () => void
}

export type Hotkey = {
    id: string
    /** What it does, for listing bindings. Falls back to the same-id command's label, then the id. */
    label?: string
    /** tinykeys syntax, e.g. "$mod+k", "shift+?", "g e" (sequence). */
    keys: string
    /** dispatched via workbench.emit() when the combo fires — the common case. */
    event?: unknown
    /** called directly when the combo fires — the escape hatch for anything a bare event can't express. */
    run?: () => void
}

/** A hotkey as it's actually bound: user overrides applied, always labelled. */
export type EffectiveHotkey = Hotkey & { label: string }

export type ActivityTarget = {
    tool?: string
    screen?: string
    modal?: string
    drawer?: string
    /** Opens or closes this tool's sidebar, or brings the tool back if another took the sidebar. */
    toggleTool?: string
}

export type ActivityItem = {
    id: string
    label: string
    icon: ReactNode
    order?: number
    placement?: "top" | "bottom"
    /** Where it sits on the mobile shell instead, where "top" is the bottom nav and "bottom" the app menu. */
    onMobile?: { placement?: "top" | "bottom"; order?: number }
    activates?: ActivityTarget
    /**
     * What pressing it again does while it's already active, e.g. a picker for
     * the screen it shows. Only the button press: activate() always uses
     * `activates`. Without it, pressing again just activates again.
     */
    reactivates?: ActivityTarget
    /** `reactivates` for the mobile shell, where a sidebar would be a sheet covering the screen. */
    reactivatesOnMobile?: ActivityTarget
    // dispatched via workbench.emit() on click, alongside any `activates` — for
    // behavior activate()'s built-in tool/screen switching doesn't cover (e.g. toggling)
    event?: unknown
}

export type ToastVariant = "neutral" | "positive" | "warning" | "negative"

export type ToastOptions = {
    variant?: ToastVariant
    action?: { label: string; onClick: () => void }
    /** Replaces the variant's icon; `null` for none. */
    icon?: ReactNode
    /** Replaces the dismiss button's default of taking the notice down, e.g. to confirm first. */
    onDismiss?: () => void
    /** An existing notice's id updates it in place, restarting its duration. */
    id?: string
    /** How long it stays up, in ms; Infinity until dismissed. */
    duration?: number
}

/** A notice as the Toast component receives it. */
export type ToastSpec = Omit<ToastOptions, "id" | "duration"> & { message: ReactNode }
