import { useCallback, useEffect, useRef, useState } from "react"
import { Panel, usePanelRef } from "react-resizable-panels"
import SideBarClose from "../../Events/SideBarClose"
import SideBarOpen from "../../Events/SideBarOpen"
import SideBarToggle from "../../Events/SideBarToggle"

import { useWorkbench, useWorkbenchComponents } from "../context"

export type Target = "primary" | "secondary"

export type Props = {
    target: Target
}

const MIN_SIZE = 180
const DEFAULT_SIZE = 260

export function Sidebar({ target }: Props) {
    const workbench = useWorkbench()
    const { ToolPane: Pane } = useWorkbenchComponents()
    const tools = workbench.toolsFor(target)

    // Held in state, not read straight off the workbench: `focusedTool` is a
    // plain field, so a view revealing its own tool (deck stats, say) mutates
    // it without React hearing about it, and the sidebar would expand showing
    // whichever tool it last rendered — usually none at all. The sidebar
    // events below are exactly the moments it changes.
    const [activeToolId, setActiveToolId] = useState(() => workbench.focusedTool[target])
    const activeTool = activeToolId ? workbench.getTool(activeToolId) : undefined
    const panelRef = usePanelRef()

    // Starts closed, at zero width, rather than mounting open and collapsing
    // in an effect: a Sidebar can mount into a Group that already exists (the
    // shell switching back from mobile), and the Group only learns about a new
    // panel in its own effect, which runs after this component's — so an
    // imperative collapse() there throws. open() resizes to `width` anyway.
    //
    // Unless a tool is already focused here: switching from mobile, the tool
    // that was a sheet button there should be open here.
    const startOpen = useRef(workbench.focusedTool[target] !== null).current

    /**
     * The width the sidebar was last at while open — every drag, keystroke and
     * double-click reset writes it, so it is whatever the user last chose.
     * Collapsing reports a zero width, which is a state rather than a choice
     * and so isn't recorded.
     */
    const width = useRef(DEFAULT_SIZE)

    // Reopening restores that width rather than a fixed default; until the
    // sidebar has been sized at all, it is DEFAULT_SIZE — the same width
    // double-clicking the separator resets to. An already-open sidebar is left
    // exactly as it is, since "open" is not a request to resize.
    const open = useCallback(() => {
        const panel = panelRef.current

        if (!panel?.isCollapsed()) return

        panel.expand()
        panel.resize(width.current)
    }, [panelRef])

    useEffect(() => {
        const unlisteners = [
            workbench.events.listen(SideBarOpen, (event: SideBarOpen) => {
                if ((event.options.target ?? "primary") === target) {
                    setActiveToolId(workbench.focusedTool[target])
                    open()
                }
            }),
            workbench.events.listen(SideBarClose, (event: SideBarClose) => {
                if ((event.options.target ?? "primary") === target) {
                    setActiveToolId(workbench.focusedTool[target])
                    panelRef.current?.collapse()
                }
            }),
            workbench.events.listen(SideBarToggle, (event: SideBarToggle) => {
                if ((event.options.target ?? "primary") === target) {
                    setActiveToolId(workbench.focusedTool[target])

                    if (panelRef.current?.isCollapsed()) {
                        open()
                    } else {
                        panelRef.current?.collapse()
                    }
                }
            }),
        ]

        return () => unlisteners.forEach((fn) => fn())
    }, [workbench, target, panelRef, open])

    if (tools.length === 0) {
        return null
    }

    return (
        <Panel
            panelRef={panelRef}
            id={`wb-sidebar-${target}`}
            className={`wb-sidebar wb-sidebar-${target}`}
            aria-label={`${target} sidebar`}
            defaultSize={startOpen ? DEFAULT_SIZE : 0}
            minSize={MIN_SIZE}
            collapsedSize={0}
            collapsible
            onResize={(size) => {
                if (size.inPixels > 0) width.current = size.inPixels
            }}
        >
            {activeTool && <Pane tool={activeTool} focused />}
        </Panel>
    )
}
