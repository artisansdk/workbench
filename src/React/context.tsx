import { createContext, type ReactNode, useContext, useLayoutEffect, useMemo, useRef } from "react"
import { useSnapshot } from "valtio"
import type { Workbench } from "../Workbench"
import { mergeComponents } from "./DefaultComponents"
import type { CustomComponents, WorkbenchComponents } from "./Types"

type ContextValue = {
    workbench: Workbench
    components: WorkbenchComponents
}

const WorkbenchContext = createContext<ContextValue | null>(null)
const TRACKING = Symbol("workbench tracking")

/**
 * Tracks render reads; commands and reads after rendering use the live instance.
 * The returned object is stable per instance, so it's safe as an effect dependency.
 */
export function useWorkbench(): Workbench {
    const context = useContext(WorkbenchContext)

    if (!context) {
        throw new Error("useWorkbench must be used within a <WorkbenchRoot> (or <Shell>).")
    }

    const { workbench } = context
    // Share Workbench's Valtio entrypoint so linked packages use the same proxy registry.
    const snapshot = useSnapshot(workbench)
    // An unread snapshot subscribes to everything; this constant key keeps command-only callers selective.
    Reflect.get(snapshot, TRACKING)

    const state = useRef({ snapshot, rendering: true })
    state.current.snapshot = snapshot
    state.current.rendering = true
    useLayoutEffect(() => {
        state.current.rendering = false
    })

    return useMemo(
        () =>
            new Proxy(workbench, {
                get(target, property) {
                    const { rendering, snapshot } = state.current
                    return Reflect.get(rendering ? snapshot : target, property)
                },
            }),
        [workbench],
    )
}

export function useWorkbenchComponents(): WorkbenchComponents {
    const context = useContext(WorkbenchContext)

    if (!context) {
        throw new Error("useWorkbenchComponents must be used within a <WorkbenchRoot> (or <Shell>).")
    }

    return context.components
}

export type WorkbenchRootProps = {
    workbench: Workbench
    components?: CustomComponents
    children?: ReactNode
}

export function WorkbenchRoot({ workbench, components, children }: WorkbenchRootProps) {
    const merged = useMemo(() => mergeComponents(components), [components])
    const value = useMemo(() => ({ workbench, components: merged }), [workbench, merged])

    return <WorkbenchContext.Provider value={value}>{children}</WorkbenchContext.Provider>
}
