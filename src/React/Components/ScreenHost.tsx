import { Panel } from "react-resizable-panels"
import { useWorkbench } from "../context"

export function ScreenHost() {
    const workbench = useWorkbench()
    const screen = workbench.activeScreenId ? workbench.getScreen(workbench.activeScreenId) : undefined
    const ScreenComponent = screen?.component

    return (
        <Panel id="wb-screen" className="wb-screen-host" minSize={200}>
            {ScreenComponent && <ScreenComponent />}
        </Panel>
    )
}
