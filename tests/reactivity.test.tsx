import "./dom"
import { afterEach, beforeEach, expect, test } from "bun:test"
import { act } from "react"
import { createRoot, type Root } from "react-dom/client"
import { proxy } from "valtio/vanilla"
import { Plugin } from "../src/Plugin"
import CommandPalette from "../src/React/Components/CommandPalette"
import { IconBarButton } from "../src/React/Components/IconBarButton"
import { ModalHost } from "../src/React/Components/ModalHost"
import { useWorkbench, WorkbenchRoot } from "../src/React/context"
import { useHotkeys } from "../src/React/useHotkeys"
import { Workbench } from "../src/Workbench"

class Modals extends Plugin {
    readonly id = "modals"

    override register(workbench: Workbench) {
        workbench.modal({ id: "first", component: () => <p>First modal</p> })
        workbench.modal({ id: "second", component: () => <p>Second modal</p> })
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

test.each([false, true])("modal updates only render its readers (consumer proxy: %s)", async (wrapped) => {
    const instance = new Workbench().use(new Modals()).boot()
    const workbench = wrapped ? proxy(instance) : instance
    const renders = { modal: 0, screen: 0, commands: 0 }
    let observedModal = null as string | null

    function CustomModalHost() {
        const workbench = useWorkbench()
        renders.modal++
        return <output data-modal>{workbench.activeModalId ?? "none"}</output>
    }

    function Screen() {
        const workbench = useWorkbench()
        renders.screen++
        return <output data-screen>{workbench.activeScreenId ?? "none"}</output>
    }

    function Commands() {
        const workbench = useWorkbench()
        renders.commands++
        return (
            <>
                <button data-open onClick={() => workbench.openModal("first")}>Open</button>
                <button data-read onClick={() => { observedModal = workbench.activeModalId }}>Read</button>
                <button data-close onClick={() => workbench.closeModal()}>Close</button>
            </>
        )
    }

    await act(async () => root.render(
        <WorkbenchRoot workbench={workbench}>
            <CustomModalHost />
            <Screen />
            <Commands />
            <ModalHost />
        </WorkbenchRoot>,
    ))
    const initial = { ...renders }
    expect(container.querySelector('[role="dialog"]')).toBeNull()

    await act(async () => container.querySelector<HTMLButtonElement>("[data-open]")!.click())
    expect(instance.activeModalId).toBe("first")
    expect(container.querySelector('[role="dialog"]')?.textContent).toContain("First modal")
    expect(container.querySelector("[data-modal]")?.textContent).toBe("first")
    expect(renders.modal).toBeGreaterThan(initial.modal)
    expect(renders.screen).toBe(initial.screen)
    expect(renders.commands).toBe(initial.commands)

    const afterOpen = renders.modal
    await act(async () => { workbench.openModal("first") })
    expect(renders.modal).toBe(afterOpen)

    await act(async () => { workbench.openModal("second") })
    expect(container.querySelector('[role="dialog"]')?.textContent).toContain("Second modal")
    await act(async () => container.querySelector<HTMLButtonElement>("[data-read]")!.click())
    expect(observedModal).toBe("second")
    expect(renders.commands).toBe(initial.commands)

    await act(async () => container.querySelector<HTMLButtonElement>("[data-close]")!.click())
    expect(container.querySelector('[role="dialog"]')).toBeNull()
    expect(container.querySelector("[data-modal]")?.textContent).toBe("none")

    const afterClose = renders.modal
    await act(async () => { workbench.activeScreenId = "home" })
    expect(container.querySelector("[data-screen]")?.textContent).toBe("home")
    expect(renders.screen).toBeGreaterThan(initial.screen)
    expect(renders.modal).toBe(afterClose)
    expect(renders.commands).toBe(initial.commands)

    await act(async () => { workbench.activeModalId = "first" })
    expect(container.querySelector('[role="dialog"]')?.textContent).toContain("First modal")
})

test("nested state subscriptions and separate workbenches remain isolated", async () => {
    const first = new Workbench()
    const second = new Workbench()
    const renders = { primary: 0, secondary: 0, other: 0 }

    function Focus({ target, id }: { target: "primary" | "secondary"; id: keyof typeof renders }) {
        const workbench = useWorkbench()
        renders[id]++
        return <output data-focus={id}>{workbench.focusedTool[target] ?? "none"}</output>
    }

    await act(async () => root.render(
        <>
            <WorkbenchRoot workbench={first}>
                <Focus target="primary" id="primary" />
                <Focus target="secondary" id="secondary" />
            </WorkbenchRoot>
            <WorkbenchRoot workbench={second}>
                <Focus target="primary" id="other" />
            </WorkbenchRoot>
        </>,
    ))
    const initial = { ...renders }

    await act(async () => { first.focusedTool.primary = "tools" })
    expect(container.querySelector('[data-focus="primary"]')?.textContent).toBe("tools")
    expect(renders.primary).toBeGreaterThan(initial.primary)
    expect(renders.secondary).toBe(initial.secondary)
    expect(renders.other).toBe(initial.other)
})

test("an activity's button follows its label as it changes", async () => {
    const workbench = new Workbench().use(new Modals()).boot()
    const item = { id: "named", label: "Before", icon: null }

    await act(async () => {
        root.render(
            <WorkbenchRoot workbench={workbench}>
                <IconBarButton item={item} active={false} />
            </WorkbenchRoot>,
        )
    })

    const button = () => container.querySelector("button")!

    expect(button().getAttribute("aria-label")).toBe("Before")

    await act(async () => { workbench.setActivityLabel("named", "After") })

    expect(button().getAttribute("aria-label")).toBe("After")
    expect(button().textContent).toBe("After")
})

test("mounted contribution readers, palette, and hotkeys follow runtime plugin toggles", async () => {
    let runs = 0
    class FeatureEvent {}

    class Feature extends Plugin {
        readonly id = "feature"

        override register(workbench: Workbench) {
            workbench.activity({ id: "feature", label: "Feature", icon: null })
            workbench.tool({ id: "feature", label: "Feature", icon: null, component: () => null })
            workbench.statusBarItem({ id: "feature", section: "left", component: () => null })
            workbench.command({ id: "feature", label: "Feature command", run: () => { runs++ } })
            workbench.hotkey({ id: "feature", keys: "x", run: () => { runs++ } })
            workbench.event(FeatureEvent)
        }
    }

    const workbench = new Workbench().use(new Feature()).boot().disable("feature")

    function Contributions() {
        const workbench = useWorkbench()
        useHotkeys()
        return <>
            <output data-activities>{workbench.activityItems().length}</output>
            <output data-tools>{workbench.toolsFor("primary").length}</output>
            <output data-status>{workbench.statusBarItems("left").length}</output>
            <output data-events>{workbench.registeredEvents().includes(FeatureEvent) ? 1 : 0}</output>
        </>
    }

    await act(async () => root.render(
        <WorkbenchRoot workbench={workbench}>
            <Contributions />
            <CommandPalette close={() => {}} emit={() => {}} guard={() => {}} />
        </WorkbenchRoot>,
    ))

    for (const enabled of [false, true, false, true, false]) {
        await act(async () => {
            if (enabled) workbench.enable("feature")
            else workbench.disable("feature")
        })

        for (const name of ["activities", "tools", "status", "events"]) {
            expect(container.querySelector(`[data-${name}]`)?.textContent).toBe(enabled ? "1" : "0")
        }
        expect(container.querySelector(".wb-command-palette-list")?.textContent ?? "").toBe(enabled ? "Feature command" : "")

        const before = runs
        await act(async () => {
            window.dispatchEvent(new window.KeyboardEvent("keydown", { key: "x", code: "KeyX", bubbles: true }))
        })
        expect(runs).toBe(before + (enabled ? 1 : 0))
    }
})
