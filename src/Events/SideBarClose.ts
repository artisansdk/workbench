export type Options = {
    target: "primary" | "secondary"
}

export default class SideBarClose {
    constructor(public options: Partial<Options> = { target: "primary" }) {
        //
    }
}
