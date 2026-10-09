import type { ComponentType, ReactNode } from "react"
import type { ActivityItem, SidebarTarget, ToastSpec, Tool } from "../Types"

export type IconBarButtonProps = {
    item: ActivityItem
    active: boolean
    // false on touch layouts, where a hover tooltip only flashes on tap
    tooltip?: boolean
}

// An empty interface, not Record<string, never> — an index signature clashes with JSX's implicit `key` prop.
export type IconBarProps = {}

export type ToolPaneProps = {
    tool: Tool
    focused: boolean
}

export type SidebarProps = {
    target: SidebarTarget
}

export type ScreenHostProps = {}

export interface ModalHostProps {
    /** The mobile shell: modals registered with `sheet` show as bottom sheets. */
    mobile?: boolean
}

export type DrawerHostProps = {}

export type StatusBarProps = {}

export type BottomNavProps = {}

export type AppMenuProps = {}

export type ToastHostProps = {}

/** One notice: what was passed to workbench.toast(), with the message as children. */
export type ToastProps = Omit<ToastSpec, "message" | "onDismiss"> & {
    children: ReactNode
    onDismiss: () => void
}

export type WorkbenchComponents = {
    IconBar: ComponentType<IconBarProps>
    IconBarButton: ComponentType<IconBarButtonProps>
    Sidebar: ComponentType<SidebarProps>
    ToolPane: ComponentType<ToolPaneProps>
    ScreenHost: ComponentType<ScreenHostProps>
    ModalHost: ComponentType<ModalHostProps>
    DrawerHost: ComponentType<DrawerHostProps>
    StatusBar: ComponentType<StatusBarProps>
    BottomNav: ComponentType<BottomNavProps>
    AppMenu: ComponentType<AppMenuProps>
    ToastHost: ComponentType<ToastHostProps>
    Toast: ComponentType<ToastProps>
}

export type CustomComponents = Partial<WorkbenchComponents>
