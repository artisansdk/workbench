import type { Hotkey as HotkeyItem } from "../Types"
import Contribution from "./Contribution"

export default class Hotkey extends Contribution<HotkeyItem> {
    constructor() {
        super({
            type: "Hotkey",
            getId: (hotkey) => hotkey.id,
        })
    }
}
