import type { ActivityItem } from "../../Types"
import { useWorkbench } from "../context"
import { useLayout } from "../useLayout"

export type Props = {
    item: ActivityItem
    active: boolean
    tooltip?: boolean
}

export function IconBarButton({ item, active, tooltip = true }: Props) {
    const workbench = useWorkbench()
    const mobile = useLayout() === "mobile"
    const label = workbench.activityLabels[item.id] ?? item.label

    return (
        <button
            type="button"
            onClick={() => (active ? workbench.reactivate(item.id, mobile) : workbench.activate(item.id))}
            aria-label={label}
            data-tooltip={tooltip ? label : undefined}
            data-tooltip-place={tooltip ? (workbench.primarySide === "right" ? "left" : "right") : undefined}
            data-active={active || undefined}
            className="wb-icon-button"
        >
            {item.icon}
            <span className="wb-icon-button-label">{label}</span>
        </button>
    )
}
