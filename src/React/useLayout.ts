import { createContext, useCallback, useContext, useSyncExternalStore } from "react"

export type Layout = "desktop" | "mobile"

/** The layout the Shell resolved; set by <Shell>. */
export const LayoutContext = createContext<Layout>("desktop")

/**
 * Which layout the shell is in, for a screen or component whose shape differs
 * between the two — a sheet instead of a popover, touch-sized rows.
 */
export function useLayout(): Layout {
    return useContext(LayoutContext)
}

/** Whether a media query matches, kept current as the window changes. */
export function useMediaQuery(query: string): boolean {
    const subscribe = useCallback(
        (onChange: () => void) => {
            const list = window.matchMedia(query)
            list.addEventListener("change", onChange)
            return () => list.removeEventListener("change", onChange)
        },
        [query],
    )

    return useSyncExternalStore(subscribe, () => window.matchMedia(query).matches)
}
