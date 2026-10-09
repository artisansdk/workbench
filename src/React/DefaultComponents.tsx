import { AppMenu } from "./Components/AppMenu"
import { BottomNav } from "./Components/BottomNav"
import { DrawerHost } from "./Components/DrawerHost"
import { IconBar, isActivityActive } from "./Components/IconBar"
import { IconBarButton } from "./Components/IconBarButton"
import { ModalHost } from "./Components/ModalHost"
import { ScreenHost } from "./Components/ScreenHost"
import { Sidebar } from "./Components/Sidebar"
import { StatusBar } from "./Components/StatusBar"
import { Toast, ToastHost } from "./Components/ToastHost"
import { ToolPane } from "./Components/ToolPane"
import type { WorkbenchComponents } from "./Types"

export {
    AppMenu,
    BottomNav,
    DrawerHost,
    IconBar,
    IconBarButton,
    isActivityActive,
    ModalHost,
    ScreenHost,
    Sidebar,
    StatusBar,
    Toast,
    ToastHost,
    ToolPane,
}

export const defaultComponents: WorkbenchComponents = {
    IconBar,
    IconBarButton,
    Sidebar,
    ToolPane,
    ScreenHost,
    ModalHost,
    DrawerHost,
    StatusBar,
    BottomNav,
    AppMenu,
    ToastHost,
    Toast,
}

export function mergeComponents(overrides?: Partial<WorkbenchComponents>): WorkbenchComponents {
    return { ...defaultComponents, ...overrides }
}
