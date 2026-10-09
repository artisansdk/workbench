import type { StatusBarSection } from "../../Types"
import { useWorkbench } from "../context"

const sections: StatusBarSection[] = ["left", "center", "right"]

export function StatusBar() {
    const workbench = useWorkbench()

    if (!workbench.statusBarVisible) {
        return null
    }

    return (
        <div className="wb-status-bar">
            {sections.map((section) => (
                <div key={section} className={`wb-status-bar-section wb-status-bar-${section}`}>
                    {workbench.statusBarItems(section).map((item) => {
                        const Item = item.component

                        return (
                            <div key={item.id} className="wb-status-bar-item">
                                <Item emit={(event, payload) => workbench.emit(event, payload)} />
                            </div>
                        )
                    })}
                </div>
            ))}
        </div>
    )
}
