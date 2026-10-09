import { createContext, type ReactNode, useContext } from "react"
import { createPortal } from "react-dom"

/**
 * Where a screen's header content goes. `undefined` (no provider) means the
 * layout has no header bar, so the content renders where the screen put it;
 * `null` means the bar exists but hasn't mounted its slot yet.
 */
export const ScreenHeaderSlot = createContext<HTMLElement | null | undefined>(undefined)

/**
 * Whether this layout has a header bar for `<ScreenHeader>` to fill (mobile).
 * For a screen whose controls want a different shape there — a compact row,
 * a sheet instead of a popover — than they have inline on desktop.
 */
export function useHasScreenHeader(): boolean {
    return useContext(ScreenHeaderSlot) !== undefined
}

export type ScreenHeaderProps = {
    children?: ReactNode
}

/**
 * A screen's own controls (search, filters, sort) for the shell's header bar.
 * The screen decides what goes in it and keeps the state; the shell decides
 * where it sits. On desktop it renders in place, so a screen lays out its
 * toolbar as it always has.
 *
 * In the header bar each child is a row: the first sits beside the menu
 * button, the rest run full width beneath it.
 */
export function ScreenHeader({ children }: ScreenHeaderProps) {
    const slot = useContext(ScreenHeaderSlot)

    if (slot === undefined) {
        return <>{children}</>
    }

    return slot ? createPortal(children, slot) : null
}
