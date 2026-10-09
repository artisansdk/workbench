export type Options = {
    target: "primary" | "secondary"
    /**
     * A screen opening its own panel beside itself, rather than someone
     * asking to see the tool. Where there's no room beside the screen (the
     * mobile shell) the tool is only focused, not opened over the screen.
     */
    beside: boolean
}

export default class SideBarOpen {
    constructor(public options: Partial<Options> = { target: "primary" }) {
        //
    }
}
