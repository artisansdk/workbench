import { createContext, type RefObject, useContext, useEffect, useRef, useState } from "react"

/** The mobile header bar, for triggers that need to measure it. */
export const HeaderBar = createContext<RefObject<HTMLElement | null>>({ current: null })

/**
 * How far the screen has to scroll in one direction before the header
 * follows — either way, so a gesture's opening jitter or a bounce at the
 * ends of a list doesn't flick it.
 */
const HEADER_TOGGLE_DISTANCE = 15

/**
 * A header trigger: hides the bar while the screen scrolls down, brings it
 * back on a scroll up or at the top. Pass it as is to follow any container a
 * screen scrolls — `workbench.header(useScrollingHeader)` — or name the ones
 * that count with a selector: `workbench.header(() => useScrollingHeader(".feed"))`.
 *
 * Screens scroll their own containers, not the page, and scroll events don't
 * bubble, so this listens on the document in the capture phase and keeps to
 * scrolls inside the screen host — a drawer or modal scrolling is ignored.
 */
export function useScrollingHeader(selector?: string): boolean {
    const bar = useContext(HeaderBar)
    // Starts showing: the shell runs a trigger afresh on every screen.
    const [hidden, setHidden] = useState(false)
    // Distance scrolled so far in the current direction: positive down, negative up.
    const travel = useRef(0)

    useEffect(() => {
        const lastTop = new WeakMap<Element, number>()

        function onScroll(event: Event) {
            const target = event.target

            if (!(target instanceof Element) || !target.closest(".wb-screen-host")) return
            if (selector && !target.matches(selector)) return

            const top = target.scrollTop
            const delta = top - (lastTop.get(target) ?? top)
            lastTop.set(target, top)

            if (top <= 0) {
                travel.current = 0
                setHidden(false)
                return
            }

            if (delta === 0) return

            // An upward move that ends at the very bottom is iOS settling a
            // bounce off the end, not the user. A real scroll up leaves the bottom.
            if (delta < 0 && top >= target.scrollHeight - target.clientHeight - 1) {
                travel.current = 0
                return
            }

            // A change of direction starts the count over.
            travel.current = Math.sign(delta) === Math.sign(travel.current) ? travel.current + delta : delta

            if (travel.current >= HEADER_TOGGLE_DISTANCE) {
                // Only for a container that runs up under the bar. One that
                // starts below it (under rows a screen keeps fixed at its top)
                // would gain nothing — hiding would just open a gap.
                const barBottom = bar.current?.getBoundingClientRect().bottom ?? 0

                if (target.getBoundingClientRect().top < barBottom) setHidden(true)
            } else if (travel.current <= -HEADER_TOGGLE_DISTANCE) {
                setHidden(false)
            }
        }

        document.addEventListener("scroll", onScroll, { capture: true, passive: true })

        return () => document.removeEventListener("scroll", onScroll, { capture: true })
    }, [bar, selector])

    return !hidden
}
