import { useState } from "react"
import { Drawer as VaulDrawer } from "vaul"
import { useWorkbench, useWorkbenchComponents } from "../context"
import { isActivityActive } from "./IconBar"

function MenuIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            width="20"
            height="20"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            aria-hidden="true"
        >
            <path d="M4 6h16M4 12h16M4 18h16" />
        </svg>
    )
}

export function CloseIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            width="20"
            height="20"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            aria-hidden="true"
        >
            <path d="M6 6l12 12M18 6L6 18" />
        </svg>
    )
}

export function AppMenu() {
    const workbench = useWorkbench()
    const { IconBarButton: Button } = useWorkbenchComponents()
    const [open, setOpen] = useState(false)
    // The drawer portals in here rather than <body>, so it stays inside the
    // shell and keeps the mobile styles and --wb-* variables scoped to it.
    const [host, setHost] = useState<HTMLDivElement | null>(null)
    const items = workbench.activityItems().filter((item) => item.placement === "bottom")

    if (items.length === 0) {
        return null
    }

    return (
        <div className="wb-app-menu-host" ref={setHost}>
            <button type="button" className="wb-icon-button" aria-label="Menu" onClick={() => setOpen(true)}>
                <MenuIcon />
            </button>
            <VaulDrawer.Root direction="right" open={open} onOpenChange={setOpen}>
                <VaulDrawer.Portal container={host}>
                    <VaulDrawer.Overlay className="wb-drawer-overlay wb-app-menu-overlay" />
                    {/* Any click bubbling up from an item closes it — picking one is done with it. */}
                    <VaulDrawer.Content
                        className="wb-app-menu"
                        aria-describedby={undefined}
                        onClick={() => setOpen(false)}
                    >
                        <VaulDrawer.Title className="wb-drawer-title">Menu</VaulDrawer.Title>
                        <button type="button" className="wb-icon-button wb-app-menu-close" aria-label="Close menu">
                            <CloseIcon />
                        </button>
                        {items.map((item) => (
                            <Button
                                key={item.id}
                                item={item}
                                active={isActivityActive(workbench, item)}
                                tooltip={false}
                            />
                        ))}
                    </VaulDrawer.Content>
                </VaulDrawer.Portal>
            </VaulDrawer.Root>
        </div>
    )
}
