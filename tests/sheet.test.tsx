import "./dom"
import { afterEach, beforeEach, expect, test } from "bun:test"
import { act, useEffect } from "react"
import { createRoot, type Root } from "react-dom/client"
import { Plugin } from "../src/Plugin"
import type { ModalProps } from "../src/Types"
import { ModalHost } from "../src/React/Components/ModalHost"
import { WorkbenchRoot } from "../src/React/context"
import { Workbench } from "../src/Workbench"

let asked = 0

function Guarded({ guard }: ModalProps) {
    useEffect(() => {
        guard(() => { asked++ })
        return () => guard(null)
    }, [guard])

    return <p>Guarded</p>
}

class Sheets extends Plugin {
    readonly id = "sheets"

    override register(workbench: Workbench) {
        workbench.modal({ id: "sheet", component: () => <p>Sheet</p>, sheet: true, label: "Sheet" })
        workbench.modal({ id: "framed", component: () => <p>Framed</p> })
        workbench.modal({ id: "guarded", component: Guarded })
        workbench.modal({ id: "guarded-sheet", component: Guarded, sheet: true, label: "Guarded" })
    }
}

let container: HTMLDivElement
let root: Root

beforeEach(() => {
    container = document.createElement("div")
    document.body.append(container)
    root = createRoot(container)
})

afterEach(async () => {
    await act(async () => root.unmount())
    container.remove()
})

// Radix's own tap-off misses a tap straight after a react-aria press inside the
// sheet (the press stops the pointerdown it resets on), so the overlay's click
// has to close the sheet by itself.
test("clicking a sheet's overlay closes it", async () => {
    const workbench = new Workbench().use(new Sheets()).boot()

    await act(async () => {
        root.render(
            <WorkbenchRoot workbench={workbench}>
                <ModalHost mobile />
            </WorkbenchRoot>,
        )
        workbench.openModal("sheet")
    })
    await act(async () => {})

    const overlay = container.querySelector(".wb-drawer-overlay") as HTMLElement
    expect(overlay).not.toBeNull()

    await act(async () => {
        overlay.dispatchEvent(new window.MouseEvent("click", { bubbles: true }))
        await new Promise((resolve) => setTimeout(resolve, 600))
    })

    expect(workbench.activeModalId).toBeNull()
})

async function open(id: string, mobile: boolean) {
    const workbench = new Workbench().use(new Sheets()).boot()

    await act(async () => {
        root.render(
            <WorkbenchRoot workbench={workbench}>
                <ModalHost mobile={mobile} />
            </WorkbenchRoot>,
        )
        workbench.openModal(id)
    })
    await act(async () => {})

    return workbench
}

function pressEscape() {
    document.body.dispatchEvent(new window.KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true }) as never)
}

const closing = () => container.querySelector(".wb-modal-backdrop")?.hasAttribute("data-closing")

test("Escape closes a framed modal, playing its exit", async () => {
    await open("framed", false)

    await act(async () => pressEscape())

    expect(closing()).toBe(true)
})

test("Escape leaves a framed modal alone when something on top stops the key", async () => {
    await open("framed", false)
    const stop = (event: Event) => event.stopPropagation()
    document.body.addEventListener("keydown", stop)

    await act(async () => pressEscape())
    document.body.removeEventListener("keydown", stop)

    expect(closing()).toBe(false)
})

test("Escape asks a framed modal's guard rather than closing it", async () => {
    asked = 0
    await open("guarded", false)

    await act(async () => pressEscape())

    expect(asked).toBe(1)
    expect(closing()).toBe(false)
})

test("Escape closes a sheet", async () => {
    const workbench = await open("sheet", true)

    await act(async () => pressEscape())
    await act(async () => { await new Promise((resolve) => setTimeout(resolve, 600)) })

    expect(workbench.activeModalId).toBeNull()
})

test("Escape asks a sheet's guard rather than closing it", async () => {
    asked = 0
    const workbench = await open("guarded-sheet", true)

    await act(async () => pressEscape())
    await act(async () => { await new Promise((resolve) => setTimeout(resolve, 600)) })

    expect(asked).toBe(1)
    expect(workbench.activeModalId).toBe("guarded-sheet")
})
