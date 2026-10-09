import { type ReactNode, type RefObject, useEffect, useRef, useState } from "react"
import { Group, Separator } from "react-resizable-panels"
import type { Workbench } from "../Workbench"
import { ScreenHeaderSlot } from "./Components/ScreenHeader"
import { SidebarSheet } from "./Components/SidebarSheet"
import { useWorkbench, useWorkbenchComponents, WorkbenchRoot } from "./context"
import type { CustomComponents } from "./Types"
import { useHotkeys } from "./useHotkeys"
import { LayoutContext, useMediaQuery } from "./useLayout"

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
    // Mobile only: tuck the header bar away while the screen scrolls down. Worth it on a
    // phone's short screen; a tablet has the room to keep it.
    hideHeaderOnScroll?: boolean
}

type LayoutProps = Pick<ShellProps, "variant" | "sidebars" | "hideHeaderOnScroll"> & { mobile: boolean }

/**
 * How far the screen has to scroll in one direction before the header
 * follows — either way, so a gesture's opening jitter or a bounce at the
 * ends of a list doesn't flick it.
 */
const HEADER_TOGGLE_DISTANCE = 15

/**
 * Whether the header bar should be tucked away: scrolling the screen down
 * hides it, scrolling back up (or reaching the top) brings it back.
 *
 * Screens scroll their own containers, not the page, and scroll events don't
 * bubble, so this listens on the document in the capture phase and keeps to
 * scrolls inside the screen host — a drawer or modal scrolling is ignored.
 */
function useHeaderHidden(activeScreenId: string | null, bar: RefObject<HTMLElement | null>, enabled: boolean): boolean {
    const [hidden, setHidden] = useState(false)
    // Distance scrolled so far in the current direction: positive down, negative up.
    const travel = useRef(0)

    // A new screen starts with its header showing.
    useEffect(() => setHidden(false), [activeScreenId])

    useEffect(() => {
        if (!enabled) return

        const lastTop = new WeakMap<Element, number>()

        function onScroll(event: Event) {
            const target = event.target

            if (!(target instanceof Element) || !target.closest(".wb-screen-host")) return

            const top = target.scrollTop
            const delta = top - (lastTop.get(target) ?? top)
            lastTop.set(target, top)

            if (top <= 0) {
                travel.current = 0
                setHidden(false)
                return
            }

            if (delta === 0) return

            const overflow = target.scrollHeight - target.clientHeight

            // An upward move that ends at the very bottom isn't the user: it's
            // the browser pulling the scroll back in after hiding the header
            // made the screen taller, or iOS settling a bounce off the end.
            // A real scroll up leaves the bottom.
            if (delta < 0 && top >= overflow - 1) {
                travel.current = 0
                return
            }

            // A change of direction starts the count over.
            travel.current = Math.sign(delta) === Math.sign(travel.current) ? travel.current + delta : delta

            // Only hide if the screen would still scroll without the header.
            // Otherwise hiding it makes everything fit, the scroll snaps back
            // to the top, the header returns, and it loops.
            const headerHeight = bar.current?.offsetHeight ?? 0

            if (travel.current >= HEADER_TOGGLE_DISTANCE && overflow > headerHeight) setHidden(true)
            else if (travel.current <= -HEADER_TOGGLE_DISTANCE) setHidden(false)
        }

        document.addEventListener("scroll", onScroll, { capture: true, passive: true })

        return () => document.removeEventListener("scroll", onScroll, { capture: true })
    }, [bar, enabled])

    return enabled && hidden
}

/**
 * One shell for both layouts. Each region swaps in place rather than the two
 * being separate trees, so the screen keeps its spot — crossing the breakpoint
 * (a window resized, a tablet turned) doesn't remount whatever is open.
 */
function Layout({ mobile, variant = "modern", sidebars = 2, hideHeaderOnScroll = true }: LayoutProps) {
    const workbench = useWorkbench()
    const { AppMenu, BottomNav, IconBar, Sidebar, ScreenHost, ModalHost, DrawerHost, StatusBar, ToastHost } =
        useWorkbenchComponents()
    const [headerSlot, setHeaderSlot] = useState<HTMLDivElement | null>(null)
    const headerBar = useRef<HTMLDivElement>(null)
    const headerHidden = useHeaderHidden(workbench.activeScreenId, headerBar, mobile && hideHeaderOnScroll)

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
            >
                {mobile ? (
                    // The screen fills the slot through <ScreenHeader>; the menu button is the shell's.
                    <header className="wb-mobile-header" data-hidden={headerHidden || undefined}>
                        <div className="wb-mobile-header-bar" ref={headerBar}>
                            <div className="wb-screen-header" ref={setHeaderSlot} />
                            <div className="wb-mobile-header-menu">
                                <AppMenu />
                            </div>
                        </div>
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
