import { createContext, type ReactNode, useContext, useMemo } from "react"
import type { Workbench } from "../Workbench"
import { mergeComponents } from "./DefaultComponents"
import type { CustomComponents, WorkbenchComponents } from "./Types"

type ContextValue = {
    workbench: Workbench
    components: WorkbenchComponents
}

const WorkbenchContext = createContext<ContextValue | null>(null)

export function useWorkbench(): Workbench {
    const context = useContext(WorkbenchContext)

    if (!context) {
        throw new Error("useWorkbench must be used within a <WorkbenchRoot> (or <Shell>).")
    }

    return context.workbench
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

    return <WorkbenchContext.Provider value={{ workbench, components: merged }}>{children}</WorkbenchContext.Provider>
}
