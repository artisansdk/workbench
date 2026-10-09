import type { ActivityItem } from "../../Types"
import { useWorkbench } from "../context"

export type Props = {
    item: ActivityItem
    active: boolean
    tooltip?: boolean
}

export function IconBarButton({ item, active, tooltip = true }: Props) {
    const workbench = useWorkbench()

    return (
        <button
            type="button"
            onClick={() => (active ? workbench.reactivate(item.id) : workbench.activate(item.id))}
            aria-label={item.label}
            data-tooltip={tooltip ? item.label : undefined}
            data-tooltip-place={tooltip ? (workbench.primarySide === "right" ? "left" : "right") : undefined}
            data-active={active || undefined}
            className="wb-icon-button"
        >
            {item.icon}
            <span className="wb-icon-button-label">{item.label}</span>
        </button>
    )
}
