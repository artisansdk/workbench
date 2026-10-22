import { useEffect, useState } from "react"
import { Drawer as VaulDrawer } from "vaul"
import SideBarClose from "../../Events/SideBarClose"
import SideBarOpen from "../../Events/SideBarOpen"
import SideBarToggle from "../../Events/SideBarToggle"

import { useWorkbenchComponents, useWorkbench } from "../context"
import type { Target } from "./Sidebar"

/**
 * A sidebar on the mobile shell: there's no room to show it beside the screen,
 * so its tool opens as a bottom sheet instead. What opens it is the screen's
 * business, same as on desktop — the shell adds no trigger of its own.
 *
 * Opening the sidebar opens the sheet. The exception is an open marked
 * `beside`: a screen putting its panel next to itself as it mounts, which on
 * desktop is a panel beside it but here would be a sheet covering it — so
 * that only focuses the tool.
 */
export function SidebarSheet({ target }: { target: Target }) {
    const workbench = useWorkbench()
    const { ToolPane: Pane } = useWorkbenchComponents()
    // Capture focus with each sidebar event, including requests to stay beside a screen.
    const [toolId, setToolId] = useState(() => workbench.focusedTool[target])
    const [open, setOpen] = useState(false)
    // Portaled in here rather than <body>, so the sheet keeps the shell's --wb-* variables.
    const [host, setHost] = useState<HTMLDivElement | null>(null)
    const tool = toolId ? workbench.getTool(toolId) : undefined

    useEffect(() => {
        const ours = (event: { options: { target?: Target } }) => (event.options.target ?? "primary") === target

        const unlisteners = [
            workbench.events.listen(SideBarOpen, (event: SideBarOpen) => {
                if (!ours(event)) return
                setToolId(workbench.focusedTool[target])
                if (!event.options.beside) setOpen(true)
            }),
            workbench.events.listen(SideBarClose, (event: SideBarClose) => {
                if (!ours(event)) return
                setToolId(workbench.focusedTool[target])
                setOpen(false)
            }),
            workbench.events.listen(SideBarToggle, (event: SideBarToggle) => {
                if (!ours(event)) return
                setToolId(workbench.focusedTool[target])
                setOpen((was) => !was)
            }),
        ]

        return () =>
            unlisteners.forEach((fn) => {
                fn()
            })
    }, [workbench, target])

    if (!tool) {
        return null
    }

    return (
        <div ref={setHost}>
            {host && (
                <VaulDrawer.Root open={open} onOpenChange={setOpen}>
                    <VaulDrawer.Portal container={host}>
                        <VaulDrawer.Overlay className="wb-drawer-overlay wb-modal-sheet-overlay" />
                        <VaulDrawer.Content
                            className="wb-drawer wb-modal-sheet wb-sidebar-sheet"
                            aria-describedby={undefined}
                        >
                            <VaulDrawer.Handle className="wb-drawer-handle" />
                            <VaulDrawer.Title className="wb-drawer-title">{tool.label}</VaulDrawer.Title>
                            <Pane tool={tool} focused />
                        </VaulDrawer.Content>
                    </VaulDrawer.Portal>
                </VaulDrawer.Root>
            )}
        </div>
    )
}
