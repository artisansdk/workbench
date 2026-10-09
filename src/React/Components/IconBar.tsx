import type { ActivityItem } from "../../Types"
import type { Workbench } from "../../Workbench"
import { useWorkbench, useWorkbenchComponents } from "../context"

/**
 * Only modes show as active: the screen or drawer an activity switches to. An
 * activity that just opens a tool panel (settings, a debug console) or a modal
 * isn't a place you're "in", so it gets hover feedback only.
 */
export function isActivityActive(workbench: Workbench, item: ActivityItem): boolean {
    if (item.activates?.screen) {
        return item.activates.screen === workbench.activeScreenId
    }

    if (item.activates?.drawer) {
        return item.activates.drawer === workbench.activeDrawerId
    }

    return false
}

export function IconBar() {
    const workbench = useWorkbench()
    const { IconBarButton: Button } = useWorkbenchComponents()
    const items = workbench.activityItems()
    const top = items.filter((item) => (item.placement ?? "top") === "top")
    const bottom = items.filter((item) => item.placement === "bottom")

    return (
        <nav className="wb-icon-bar" aria-label="Workbench">
            {top.map((item) => (
                <Button key={item.id} item={item} active={isActivityActive(workbench, item)} />
            ))}
            <div className="wb-icon-bar-spacer" />
            {bottom.map((item) => (
                <Button key={item.id} item={item} active={isActivityActive(workbench, item)} />
            ))}
        </nav>
    )
}
