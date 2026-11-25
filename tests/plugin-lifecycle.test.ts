import { expect, test } from "bun:test"
import { Bus } from "../src/EventBus"
import SideBarClose from "../src/Events/SideBarClose"
import { Plugin } from "../src/Plugin"
import { Workbench } from "../src/Workbench"

test("runtime toggles remove active contributions and restart listeners once", async () => {
    const phases: string[] = []
    let received = 0
    const closed: string[] = []

    class Home extends Plugin {
        readonly id = "home"
        override readonly required = true

        override register(workbench: Workbench) {
            workbench.screen({ id: "home", component: () => null })
            workbench.activity({ id: "home", label: "Home", icon: null, activates: { screen: "home" } })
        }
    }

    class Optional extends Plugin {
        readonly id = "optional"

        override register(workbench: Workbench) {
            phases.push("register")
            workbench.screen({ id: "screen", component: () => null })
            workbench.modal({ id: "modal", component: () => null })
            workbench.drawer({ id: "drawer", label: "Drawer", component: () => null })
            workbench.tool({ id: "tool", label: "Tool", icon: null, component: () => null })
            workbench.activity({ id: "optional", label: "Optional", icon: null, activates: { screen: "screen" } })
            workbench.on("ping", () => { received++ })
            return () => { phases.push("unregister") }
        }

        override boot() {
            phases.push("boot")
            return () => { phases.push("stop") }
        }
    }

    const workbench = new Workbench(new Bus()).use(new Home()).use(new Optional()).boot()
    workbench.events.listen(SideBarClose, (event) => { closed.push(event.options.target ?? "primary") })

    for (let cycle = 0; cycle < 2; cycle++) {
        workbench.enable("optional")
        expect(phases.slice(-2)).toEqual(["register", "boot"])
        workbench.activate("optional").openModal("modal").openDrawer("drawer")
        workbench.focusedTool.primary = "tool"
        workbench.guardScreen(() => { throw new Error("Removed screen's guard was called") })

        await workbench.events.dispatch("ping")
        expect(received).toBe(cycle + 1)

        workbench.disable("optional").disable("optional")
        expect(phases.slice(-2)).toEqual(["stop", "unregister"])
        expect(workbench.activeScreenId).toBe("home")
        expect(workbench.activeModalId).toBeNull()
        expect(workbench.activeDrawerId).toBeNull()
        expect(workbench.focusedTool.primary).toBeNull()
        expect(workbench.toolsFor("primary")).toEqual([])
        expect(workbench.getScreen("screen")).toBeUndefined()
        expect(workbench.getModal("modal")).toBeUndefined()
        expect(workbench.getDrawer("drawer")).toBeUndefined()
        expect(workbench.activityItems().map((item) => item.id)).toEqual(["home"])

        // A different target exercises clearing the removed screen's guard.
        workbench.activeScreenId = null
        workbench.activate("home")
        await workbench.events.dispatch("ping")
        expect(received).toBe(cycle + 1)
    }

    expect(phases).toEqual(["register", "boot", "stop", "unregister", "register", "boot", "stop", "unregister"])
    expect(closed).toEqual(["primary", "primary"])
    expect(() => workbench.disable("home")).toThrow("required")
    expect(workbench.getScreen("home")).toBeDefined()
})

test("disabling the only screen leaves no stale selection when re-enabled", () => {
    class Only extends Plugin {
        readonly id = "only"

        override register(workbench: Workbench) {
            workbench.screen({ id: "only", component: () => null })
        }
    }

    const workbench = new Workbench().use(new Only()).boot()
    workbench.activeScreenId = "only"
    workbench.disable("only").enable("only")
    expect(workbench.activeScreenId).toBeNull()
    expect(workbench.getScreen("only")).toBeDefined()
})
