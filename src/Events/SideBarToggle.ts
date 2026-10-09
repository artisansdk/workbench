export type Options = {
    target: "primary" | "secondary"
}

export default class SideBarToggle {
    constructor(public options: Partial<Options> = { target: "primary" }) {
        //
    }
}
