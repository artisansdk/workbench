import { useEffect } from "react"
import { type KeybindingsMap, tinykeys } from "tinykeys"
import { useWorkbench } from "./context"

// Renders nothing — just keeps a global tinykeys() binding in sync with
// whatever's currently registered. tinykeys ignores keydowns targeting
// inputs/textareas/contenteditable by default (unless the combo is the
// event's own target), so a bare "k" hotkey won't hijack normal typing.
export function useHotkeys(): void {
    const workbench = useWorkbench()
    // The user's keybindings layered over the registered ones.
    const hotkeys = workbench.effectiveHotkeys()
    const signature = hotkeys.map((hotkey) => `${hotkey.id}:${hotkey.keys}`).join("|")

    useEffect(() => {
        const bindings: KeybindingsMap = {}

        for (const hotkey of hotkeys) {
            bindings[hotkey.keys] = (event) => {
                event.preventDefault()
                workbench.runHotkey(hotkey.id)
            }
        }

        return tinykeys(window, bindings)
        // signature (not hotkeys/workbench) is the real dependency — hotkeys is a
        // fresh array every render, and rebinding only when the set actually
        // changes (by id+keys) is the point.
    }, [signature])
}
