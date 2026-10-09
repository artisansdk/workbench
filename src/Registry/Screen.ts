import type { Screen as ScreenItem } from "../Types"
import Contribution from "./Contribution"

export default class Screen extends Contribution<ScreenItem> {
    constructor() {
        super({
            type: "Screen",
            getId: (screen) => screen.id,
        })
    }
}
