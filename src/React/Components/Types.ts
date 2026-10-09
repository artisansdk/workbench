import type { ComponentType } from "react"
import type { ActivityItem, SidebarTarget, Tool } from "../../Types"

export type IconBarButtonProps = {
    item: ActivityItem
    active: boolean
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

export type WorkbenchComponents = {
    IconBar: ComponentType<IconBarProps>
    IconBarButton: ComponentType<IconBarButtonProps>
    Sidebar: ComponentType<SidebarProps>
    ToolPane: ComponentType<ToolPaneProps>
    ScreenHost: ComponentType<ScreenHostProps>
    ModalHost: ComponentType<ModalHostProps>
}

export type CustomComponents = Partial<WorkbenchComponents>
