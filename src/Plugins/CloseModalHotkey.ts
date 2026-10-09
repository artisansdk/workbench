import { Plugin } from "../Plugin"
import type { Workbench } from "../Workbench"

export type CloseModalHotkeyPluginOptions = {
    /** default "Escape". Pass null to skip registering the hotkey entirely. */
    hotkey?: string | null
}

// Opt-in, same as any other first-party plugin — .use() it from your own
// bootstrap. Core-only (no React import needed): closing a modal is just
// workbench.closeModal(), which is a no-op when nothing's open.
export default class CloseModalHotkeyPlugin extends Plugin {
    readonly id = "$workbench:close-modal-hotkey"

    protected hotkeyKeys: string | null

    constructor(options: CloseModalHotkeyPluginOptions = {}) {
        super()
        this.hotkeyKeys = options.hotkey === undefined ? "Escape" : options.hotkey
    }

    override register(workbench: Workbench) {
        if (!this.hotkeyKeys) {
            return
        }

        workbench.hotkey({
            id: "$workbench:close-modal",
            keys: this.hotkeyKeys,
            run: () => workbench.closeModal(),
        })
    }
}
