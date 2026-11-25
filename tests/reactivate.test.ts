import { expect, test } from "bun:test"
import SideBarOpen from "../src/Events/SideBarOpen"
import SideBarToggle from "../src/Events/SideBarToggle"
import { Plugin } from "../src/Plugin"
import { Workbench } from "../src/Workbench"

class Binders extends Plugin {
    readonly id = "binders"

    override register(workbench: Workbench) {
        workbench.screen({ id: "collection", component: () => null })
        workbench.tool({ id: "binders", label: "Binders", icon: null, component: () => null })
        workbench.tool({ id: "theme", label: "Theme", icon: null, component: () => null })
        workbench.modal({ id: "picker", component: () => null, sheet: true })
        workbench.activity({
            id: "collection",
            label: "Collection",
            icon: null,
            activates: { screen: "collection", tool: "binders" },
            reactivates: { toggleTool: "binders" },
            reactivatesOnMobile: { modal: "picker" },
        })
    }
}

function bench() {
    const workbench = new Workbench().use(new Binders()).boot()
    workbench.activate("collection")

    const events = { opened: 0, toggled: 0 }
    workbench.events.listen(SideBarOpen, () => { events.opened++ })
    workbench.events.listen(SideBarToggle, () => { events.toggled++ })

    return { workbench, events }
}

test("pressing again toggles the sidebar when its tool is showing", () => {
    const { workbench, events } = bench()

    workbench.reactivate("collection")

    expect(events).toEqual({ opened: 0, toggled: 1 })
    expect(workbench.activeModalId).toBeNull()
})

test("pressing again brings the tool back when another took its sidebar", () => {
    const { workbench, events } = bench()

    workbench.focusedTool.primary = "theme"
    workbench.reactivate("collection")

    expect(events).toEqual({ opened: 1, toggled: 0 })
    expect(workbench.focusedTool.primary).toBe("binders")
})

test("on mobile, pressing again uses the mobile target", () => {
    const { workbench, events } = bench()

    workbench.reactivate("collection", true)

    expect(workbench.activeModalId).toBe("picker")
    expect(events).toEqual({ opened: 0, toggled: 0 })
})

class Placed extends Plugin {
    readonly id = "placed"

    override register(workbench: Workbench) {
        workbench.activity({ id: "first", label: "First", icon: null, order: -100, onMobile: { placement: "bottom", order: 200 } })
        workbench.activity({ id: "second", label: "Second", icon: null })
        workbench.activity({ id: "account", label: "Account", icon: null, placement: "bottom", order: 100 })
    }
}

const places = (items: { id: string; placement?: string }[]) => items.map((item) => `${item.placement ?? "top"}:${item.id}`)

test("an activity can sit somewhere else on mobile", () => {
    const workbench = new Workbench().use(new Placed()).boot()

    expect(places(workbench.activityItems())).toEqual(["top:first", "top:second", "bottom:account"])
    expect(places(workbench.activityItems(true))).toEqual(["top:second", "bottom:account", "bottom:first"])
})

test("only first-party plugins can reach the app menu, on mobile too", () => {
    class Sneaky extends Plugin {
        readonly id = "sneaky"

        override register(workbench: Workbench) {
            workbench.activity({ id: "sneaky", label: "Sneaky", icon: null, onMobile: { placement: "bottom" } })
        }
    }

    expect(() => new Workbench().use(new Sneaky(), "third-party").boot()).toThrow("first-party")
})
