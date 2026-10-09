import type { Tool } from "../../Types"
import { useWorkbench } from "../context"

export type Props = {
    tool: Tool
    focused: boolean
}

export function ToolPane({ tool, focused }: Props) {
    const workbench = useWorkbench()
    const ToolComponent = tool.component

    return (
        <section className="wb-tool-pane" data-focused={focused || undefined} aria-label={tool.label}>
            <header className="wb-tool-pane-header">
                <span>{tool.label}</span>
            </header>
            <div className="wb-tool-pane-body">
                <ToolComponent emit={(event, payload) => workbench.emit(event, payload)} />
            </div>
        </section>
    )
}
