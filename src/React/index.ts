import "@raubjo/tooltip" // auto-boots the [data-tooltip] runtime for every workbench consumer

export { default as CommandPalette } from "./Components/CommandPalette"
export { ScreenHeader, type ScreenHeaderProps, useHasScreenHeader } from "./Components/ScreenHeader"
export { useWorkbench, useWorkbenchComponents, WorkbenchRoot, type WorkbenchRootProps } from "./context"
export {
    AppMenu,
    BottomNav,
    DrawerHost,
    defaultComponents,
    IconBar,
    IconBarButton,
    isActivityActive,
    ModalHost,
    mergeComponents,
    ScreenHost,
    Sidebar,
    StatusBar,
    Toast,
    ToastHost,
    ToolPane,
} from "./DefaultComponents"
export { default as OpenCommandPalette } from "./Plugins/CommandPalette/Events/OpenCommandPalette"
export {
    COMMAND_PALETTE_MODAL_ID,
    default as CommandPalettePlugin,
    type Options as CommandPalettePluginOptions,
} from "./Plugins/CommandPalette/Plugin"
export { Shell, type ShellProps } from "./Shell"
export type {
    AppMenuProps,
    BottomNavProps,
    CustomComponents,
    DrawerHostProps,
    IconBarButtonProps,
    IconBarProps,
    ModalHostProps,
    ScreenHostProps,
    SidebarProps,
    StatusBarProps,
    ToastHostProps,
    ToastProps,
    ToolPaneProps,
    WorkbenchComponents,
} from "./Types"
export { useHotkeys } from "./useHotkeys"
export { type Layout, useLayout } from "./useLayout"
