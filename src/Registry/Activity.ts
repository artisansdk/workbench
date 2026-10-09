import type { ActivityItem } from "../Types"
import Contribution from "./Contribution"

export default class Activity extends Contribution<ActivityItem> {
    constructor() {
        super({
            type: "Activity Item",
            getId: (item) => item.id,
        })
    }

    override all(): ActivityItem[] {
        const byOrder = (left: ActivityItem, right: ActivityItem) => (left.order ?? 0) - (right.order ?? 0)
        const items = super.all()
        const top = items.filter((item) => (item.placement ?? "top") === "top").sort(byOrder)
        const bottom = items.filter((item) => item.placement === "bottom").sort(byOrder)

        return [...top, ...bottom]
    }
}
