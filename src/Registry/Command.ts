import type { Command as CommandItem } from "../Types"
import Contribution from "./Contribution"

export default class Command extends Contribution<CommandItem> {
    constructor() {
        super({
            type: "Command",
            getId: (command) => command.id,
        })
    }
}
