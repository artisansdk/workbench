import type { Tool as ToolItem } from "../Types"
import Contribution from "./Contribution"

export default class Tool extends Contribution<ToolItem> {
    constructor() {
        super({
            type: "Tool",
            getId: (tool) => tool.id,
        })
    }
}
