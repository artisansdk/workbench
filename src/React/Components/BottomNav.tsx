import { useEffect, useState } from "react"
import { useWorkbench, useWorkbenchComponents } from "../context"
import { isActivityActive } from "./IconBar"

const MAX_VISIBLE = 4

function ToolsIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            width="20"
            height="20"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
        >
            <path d="M15.6 10H18.4C18.9601 10 19.2401 10 19.454 9.89101C19.6422 9.79513 19.7951 9.64215 19.891 9.45399C20 9.24008 20 8.96005 20 8.4V5.6C20 5.03995 20 4.75992 19.891 4.54601C19.7951 4.35785 19.6422 4.20487 19.454 4.10899C19.2401 4 18.9601 4 18.4 4H15.6C15.0399 4 14.7599 4 14.546 4.10899C14.3578 4.20487 14.2049 4.35785 14.109 4.54601C14 4.75992 14 5.03995 14 5.6V8.4C14 8.96005 14 9.24008 14.109 9.45399C14.2049 9.64215 14.3578 9.79513 14.546 9.89101C14.7599 10 15.0399 10 15.6 10ZM5.6 10H8.4C8.96005 10 9.24008 10 9.45399 9.89101C9.64215 9.79513 9.79513 9.64215 9.89101 9.45399C10 9.24008 10 8.96005 10 8.4V5.6C10 5.03995 10 4.75992 9.89101 4.54601C9.79513 4.35785 9.64215 4.20487 9.45399 4.10899C9.24008 4 8.96005 4 8.4 4H5.6C5.03995 4 4.75992 4 4.54601 4.10899C4.35785 4.20487 4.20487 4.35785 4.10899 4.54601C4 4.75992 4 5.03995 4 5.6V8.4C4 8.96005 4 9.24008 4.10899 9.45399C4.20487 9.64215 4.35785 9.79513 4.54601 9.89101C4.75992 10 5.03995 10 5.6 10ZM5.6 20H8.4C8.96005 20 9.24008 20 9.45399 19.891C9.64215 19.7951 9.79513 19.6422 9.89101 19.454C10 19.2401 10 18.9601 10 18.4V15.6C10 15.0399 10 14.7599 9.89101 14.546C9.79513 14.3578 9.64215 14.2049 9.45399 14.109C9.24008 14 8.96005 14 8.4 14H5.6C5.03995 14 4.75992 14 4.54601 14.109C4.35785 14.2049 4.20487 14.3578 4.10899 14.546C4 14.7599 4 15.0399 4 15.6V18.4C4 18.9601 4 19.2401 4.10899 19.454C4.20487 19.6422 4.35785 19.7951 4.54601 19.891C4.75992 20 5.03995 20 5.6 20Z" />
            {/* Its own path so it can turn into an x while the sheet is open. */}
            <path className="wb-bottom-nav-plus" d="M17 14V20M14 17H20" />
        </svg>
    )
}

/**
 * Eats the click that ends the current press. If the press turns into a
 * scroll instead, no click comes, so the next press clears it rather than
 * letting it eat a click that's meant to land.
 */
function swallowNextClick() {
    function swallow(event: MouseEvent) {
        event.stopPropagation()
        event.preventDefault()
        clear()
    }

    function clear() {
        document.removeEventListener("click", swallow, true)
        document.removeEventListener("pointerdown", clear, true)
    }

    document.addEventListener("click", swallow, true)
    // Deferred, or the very press that called this would clear it.
    setTimeout(() => document.addEventListener("pointerdown", clear, true))
}

// A plain <nav> rather than a vaul drawer: vaul (1.1.2) doesn't pass `modal`
// through to its Radix dialog, so an always-open drawer is always modal — it
// traps focus, pulling it back from any input on the screen, and hides the
// rest of the app from screen readers.
export function BottomNav() {
    const workbench = useWorkbench()
    const { IconBarButton: Button } = useWorkbenchComponents()
    const [expanded, setExpanded] = useState(false)
    const [nav, setNav] = useState<HTMLElement | null>(null)
    const items = workbench.activityItems().filter((item) => (item.placement ?? "top") === "top")
    const overflows = items.length > MAX_VISIBLE
    const pinned = overflows ? items.slice(0, MAX_VISIBLE) : items
    const extra = overflows ? items.slice(MAX_VISIBLE) : []
    // Tools stands in for whichever extra item is active, since that item is
    // hidden while collapsed. Open, it's a close button and the item shows itself.
    const toolsActive = !expanded && extra.some((item) => isActivityActive(workbench, item))
    const toolsLabel = expanded ? "Close" : "Tools"

    // No backdrop, so the screen still scrolls while open. A press outside the
    // nav only closes it, though: it's stopped before the screen hears it, so
    // tapping a card to dismiss the nav doesn't also open that card.
    useEffect(() => {
        if (!expanded || !nav) return

        function collapse(event: PointerEvent) {
            if (nav!.contains(event.target as Node)) return

            // Capture phase on the document runs ahead of React's own listeners,
            // which is what react-aria's press handling hangs off.
            event.stopPropagation()
            swallowNextClick()
            setExpanded(false)
        }

        document.addEventListener("pointerdown", collapse, true)

        return () => document.removeEventListener("pointerdown", collapse, true)
    }, [expanded, nav])

    // The slot holds the bar's height in the layout; the nav slides up out of
    // it to show the extra items. Any click bubbling up from an item collapses
    // it — picking one is done with it.
    return (
        <div className="wb-bottom-nav-slot">
            <nav
                ref={setNav}
                className="wb-bottom-nav"
                aria-label="Workbench"
                data-expanded={expanded || undefined}
                onClick={() => setExpanded(false)}
            >
                <div className="wb-bottom-nav-body">
                    <div className="wb-bottom-nav-row">
                        {pinned.map((item) => (
                            <Button
                                key={item.id}
                                item={item}
                                active={isActivityActive(workbench, item)}
                                tooltip={false}
                            />
                        ))}
                        {overflows && (
                            <button
                                type="button"
                                className="wb-icon-button"
                                aria-label={toolsLabel}
                                aria-expanded={expanded}
                                data-active={toolsActive || undefined}
                                onClick={(event) => {
                                    event.stopPropagation()
                                    setExpanded((open) => !open)
                                }}
                            >
                                <ToolsIcon />
                                <span className="wb-icon-button-label">{toolsLabel}</span>
                            </button>
                        )}
                    </div>
                    {overflows && (
                        <div className="wb-bottom-nav-extra" inert={!expanded}>
                            {extra.map((item) => (
                                <Button
                                    key={item.id}
                                    item={item}
                                    active={isActivityActive(workbench, item)}
                                    tooltip={false}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </nav>
        </div>
    )
}
