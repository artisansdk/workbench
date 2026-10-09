import { Plugin } from "../../../Plugin"
import type { Workbench } from "../../../Workbench"
import CommandPalette from "../../Components/CommandPalette"
import OpenCommandPalette from "./Events/OpenCommandPalette"

/** Reserved modal id for the command palette — sourced here since CommandPalettePlugin owns it. */
export const COMMAND_PALETTE_MODAL_ID = "$workbench:command-palette"

export type Options = {
    /** tinykeys syntax; default "$mod+k". Pass null to skip registering a hotkey entirely
     *  (e.g. to trigger the palette some other way — it's still openable via
     *  workbench.openModal(COMMAND_PALETTE_MODAL_ID) either way). */
    hotkey?: string | null
}

// Opt-in, same as any other first-party plugin — .use() it from your own
// bootstrap alongside Settings/etc. Not auto-registered by core Workbench,
// which stays React-agnostic.
export default class CommandPalettePlugin extends Plugin {
    readonly id = "$workbench:command-palette"

    protected hotkeyKeys: string | null

    constructor(options: Options = {}) {
        super()
        this.hotkeyKeys = options.hotkey === undefined ? "$mod+k" : options.hotkey
    }

    override register(workbench: Workbench) {
        workbench.modal({
            id: COMMAND_PALETTE_MODAL_ID,
            component: CommandPalette,
        })

        workbench.event(OpenCommandPalette)

        workbench.on(OpenCommandPalette, () => {
            workbench.openModal(COMMAND_PALETTE_MODAL_ID)
        })

        if (this.hotkeyKeys) {
            workbench.hotkey({
                id: "$workbench:open-command-palette",
                keys: this.hotkeyKeys,
                event: new OpenCommandPalette(),
            })
        }
    }
}
