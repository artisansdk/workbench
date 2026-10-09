import type { StatusBarItem } from "../Types"
import Contribution from "./Contribution"

export default class StatusBar extends Contribution<StatusBarItem> {
    constructor() {
        super({
            type: "Status Bar Item",
            getId: (item) => item.id,
        })
    }
}
