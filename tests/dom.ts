import { Window } from "happy-dom"

const window = new Window()

Object.defineProperties(globalThis, {
    window: { configurable: true, value: window },
    document: { configurable: true, value: window.document },
    navigator: { configurable: true, value: window.navigator },
    HTMLElement: { configurable: true, value: window.HTMLElement },
    Element: { configurable: true, value: window.Element },
    Node: { configurable: true, value: window.Node },
    MutationObserver: { configurable: true, value: window.MutationObserver },
    getComputedStyle: { configurable: true, value: window.getComputedStyle.bind(window) },
    requestAnimationFrame: { configurable: true, value: window.requestAnimationFrame.bind(window) },
    cancelAnimationFrame: { configurable: true, value: window.cancelAnimationFrame.bind(window) },
    NodeFilter: { configurable: true, value: window.NodeFilter },
    IS_REACT_ACT_ENVIRONMENT: { configurable: true, value: true },
})

// happy-dom's KeyboardEvent lacks getModifierState, which tinykeys requires to treat an event as a keypress.
const modifiers: Record<string, "shiftKey" | "ctrlKey" | "altKey" | "metaKey"> = { Shift: "shiftKey", Control: "ctrlKey", Alt: "altKey", Meta: "metaKey" }
;(window.KeyboardEvent.prototype as unknown as KeyboardEvent).getModifierState ??= function (this: KeyboardEvent, key: string) {
    return Boolean(modifiers[key] && this[modifiers[key]])
}
