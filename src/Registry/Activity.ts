import type { ActivityItem } from "../Types"
import Contribution from "./Contribution"

function arrange(items: ActivityItem[]): ActivityItem[] {
    const byOrder = (left: ActivityItem, right: ActivityItem) => (left.order ?? 0) - (right.order ?? 0)
    const top = items.filter((item) => (item.placement ?? "top") === "top").sort(byOrder)
    const bottom = items.filter((item) => item.placement === "bottom").sort(byOrder)

    return [...top, ...bottom]
}

export default class Activity extends Contribution<ActivityItem> {
    constructor() {
        super({
            type: "Activity Item",
            getId: (item) => item.id,
        })
    }

    override all(): ActivityItem[] {
        return arrange(super.all())
    }

    /** All of them, each as it sits on the mobile shell. */
    onMobile(): ActivityItem[] {
        return arrange(super.all().map((item) => ({ ...item, ...item.onMobile })))
    }
}
