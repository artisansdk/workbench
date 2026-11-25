import { type CSSProperties, type ReactNode, type RefObject, useLayoutEffect, useRef, useState } from "react"
import { Group, Separator } from "react-resizable-panels"
import type { Workbench } from "../Workbench"
import { ScreenHeaderSlot } from "./Components/ScreenHeader"
import { SidebarSheet } from "./Components/SidebarSheet"
import { useWorkbench, useWorkbenchComponents, WorkbenchRoot } from "./context"
import type { HeaderTrigger } from "../Types"
import type { CustomComponents } from "./Types"
import { useHotkeys } from "./useHotkeys"
import { LayoutContext, useMediaQuery } from "./useLayout"
import { HeaderBar } from "./useScrollingHeader"

export type ShellProps = {
    workbench: Workbench
    components?: CustomComponents
    variant?: "classic" | "modern"
    sidebars?: 0 | 1 | 2
    // Both layouts are on by default and the screen's width picks between
    // them. Turning one off pins the shell to the other — desktop={false} for
    // an app that's only ever on a phone, say.
    desktop?: boolean
    mobile?: boolean
    /** Widths below this (px) get the mobile layout, when both are on. */
    mobileBreakpoint?: number
}

type LayoutProps = Pick<ShellProps, "variant" | "sidebars"> & { mobile: boolean }

/**
 * Runs the workbench's header trigger as a hook and reports what it says.
 * Its own component, keyed by the trigger, so swapping one in starts its
 * hooks afresh instead of breaking the shell's — and keyed by the screen
 * too, so every screen starts with the bar showing.
 */
function HeaderTriggerHost({ trigger, onChange }: { trigger: HeaderTrigger; onChange: (visible: boolean) => void }) {
    const visible = trigger()

    useLayoutEffect(() => onChange(visible), [visible, onChange])

    return null
}

const triggerKeys = new WeakMap<HeaderTrigger, number>()
let nextTriggerKey = 0

function triggerKey(trigger: HeaderTrigger): number {
    if (!triggerKeys.has(trigger)) triggerKeys.set(trigger, nextTriggerKey++)

    return triggerKeys.get(trigger) as number
}

/** The element's height in px, kept current as it resizes. */
function useHeight(element: RefObject<HTMLElement | null>, enabled: boolean): number {
    const [height, setHeight] = useState(0)

    // Before paint, so the first frame doesn't lay the screen out under the bar.
    useLayoutEffect(() => {
        const target = element.current

        if (!enabled || !target) return

        const observer = new ResizeObserver(() => setHeight(target.offsetHeight))
        setHeight(target.offsetHeight)
        observer.observe(target)

        return () => observer.disconnect()
    }, [element, enabled])

    return height
}

/**
 * One shell for both layouts. Each region swaps in place rather than the two
 * being separate trees, so the screen keeps its spot — crossing the breakpoint
 * (a window resized, a tablet turned) doesn't remount whatever is open.
 */
function Layout({ mobile, variant = "modern", sidebars = 2 }: LayoutProps) {
    const workbench = useWorkbench()
    const { AppMenu, BottomNav, IconBar, Sidebar, ScreenHost, ModalHost, DrawerHost, StatusBar, ToastHost } =
        useWorkbenchComponents()
    const [headerSlot, setHeaderSlot] = useState<HTMLDivElement | null>(null)
    const headerBar = useRef<HTMLDivElement>(null)
    const headerSetting = workbench.headerVisible
    // What the trigger last said, when the setting is one.
    const [triggered, setTriggered] = useState(true)
    const headerVisible = typeof headerSetting === "function" ? triggered : headerSetting
    const headerHeight = useHeight(headerBar, mobile)

    useHotkeys()

    const hasPrimary = !mobile && sidebars >= 1 && workbench.toolsFor("primary").length > 0
    const hasSecondary = !mobile && sidebars === 2 && workbench.toolsFor("secondary").length > 0

    const primary = <Sidebar key="primary" target="primary" />
    const secondary = <Sidebar key="secondary" target="secondary" />
    const screen = <ScreenHost key="screen" />
    const separator = (key: string) => <Separator key={key} className="wb-sidebar-handle" />

    // Separators only appear next to a sidebar that's actually rendering — an
    // empty target contributes nothing to the Group.
    const children: ReactNode[] =
        workbench.primarySide === "left"
            ? [
                  ...(hasPrimary ? [primary, separator("h1")] : []),
                  screen,
                  ...(hasSecondary ? [separator("h2"), secondary] : []),
              ]
            : [
                  ...(hasSecondary ? [secondary, separator("h1")] : []),
                  screen,
                  ...(hasPrimary ? [separator("h2"), primary] : []),
              ]

    return (
        // Always provided so the tree's shape doesn't change with the layout;
        // undefined on desktop is what tells <ScreenHeader> there's no bar.
        <ScreenHeaderSlot.Provider value={mobile ? headerSlot : undefined}>
            <div
                className="wb-shell"
                data-layout={mobile ? "mobile" : "desktop"}
                data-primary-side={mobile ? undefined : workbench.primarySide}
                data-variant={mobile ? undefined : variant}
                style={
                    mobile
                        ? ({
                              "--wb-header-height": `${headerHeight}px`,
                              "--wb-header-offset": headerVisible ? `${headerHeight}px` : "0px",
                          } as CSSProperties)
                        : undefined
                }
            >
                {mobile ? (
                    // The screen fills the slot through <ScreenHeader>; the menu button is the shell's.
                    <header className="wb-mobile-header" data-hidden={!headerVisible || undefined}>
                        <div className="wb-mobile-header-bar" ref={headerBar}>
                            <div className="wb-screen-header" ref={setHeaderSlot} />
                            <div className="wb-mobile-header-menu">
                                <AppMenu />
                            </div>
                        </div>
                        {typeof headerSetting === "function" && (
                            <HeaderBar.Provider value={headerBar}>
                                <HeaderTriggerHost
                                    key={`${triggerKey(headerSetting)}:${workbench.activeScreenId}:${workbench.headerResets}`}
                                    trigger={headerSetting}
                                    onChange={setTriggered}
                                />
                            </HeaderBar.Provider>
                        )}
                    </header>
                ) : (
                    workbench.primarySide === "left" && <IconBar />
                )}
                <Group orientation="horizontal" className="wb-panel-group">
                    {children}
                </Group>
                {mobile ? (
                    <>
                        <BottomNav />
                        {/* After the nav, so at the same z-index the sheets cover it. */}
                        <SidebarSheet target="primary" />
                        <SidebarSheet target="secondary" />
                    </>
                ) : (
                    <>
                        {workbench.primarySide === "right" && <IconBar />}
                        <StatusBar />
                    </>
                )}
                <DrawerHost />
                <ModalHost mobile={mobile} />
                <ToastHost />
            </div>
        </ScreenHeaderSlot.Provider>
    )
}

export function Shell({
    workbench,
    components,
    desktop = true,
    mobile = true,
    mobileBreakpoint = 768,
    ...props
}: ShellProps) {
    const narrow = useMediaQuery(`(max-width: ${mobileBreakpoint - 1}px)`)
    const isMobile = mobile && (!desktop || narrow)

    return (
        <WorkbenchRoot workbench={workbench} components={components}>
            <LayoutContext.Provider value={isMobile ? "mobile" : "desktop"}>
                <Layout mobile={isMobile} {...props} />
            </LayoutContext.Provider>
        </WorkbenchRoot>
    )
}
