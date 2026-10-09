import type { Modal as ModalItem } from "../Types"
import Contribution from "./Contribution"

export default class Modal extends Contribution<ModalItem> {
    constructor() {
        super({
            type: "Modal",
            getId: (modal) => modal.id,
        })
    }
}
