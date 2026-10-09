import type { Drawer as DrawerItem } from "../Types"
import Contribution from "./Contribution"

export default class Drawer extends Contribution<DrawerItem> {
    constructor() {
        super({
            type: "Drawer",
            getId: (drawer) => drawer.id,
        })
    }
}
