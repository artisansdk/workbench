import { expect, test } from "bun:test"
import { Plugin } from "../src/Plugin"
import { Workbench } from "../src/Workbench"

class Screens extends Plugin {
    readonly id = "screens"

    override register(workbench: Workbench) {
        workbench.screen({ id: "one", component: () => null })
        workbench.screen({ id: "two", component: () => null })
        workbench.activity({ id: "one", label: "One", icon: null, activates: { screen: "one" } })
        workbench.activity({ id: "two", label: "Two", icon: null, activates: { screen: "two" } })
    }
}

function bench(): Workbench {
    const workbench = new Workbench()
    workbench.use(new Screens())
    workbench.boot()
    workbench.activate("one")

    return workbench
}

test("a screen guard holds a switch until it lets it through", () => {
    const workbench = bench()
    let proceed: (() => void) | null = null

    workbench.guardScreen((next) => { proceed = next })
    workbench.activate("two")

    expect(workbench.activeScreenId).toBe("one")

    proceed!()

    expect(workbench.activeScreenId).toBe("two")
})

test("staying on the guarded screen isn't leaving it", () => {
    const workbench = bench()
    let asked = false

    workbench.guardScreen(() => { asked = true })
    workbench.activate("one")

    expect(asked).toBe(false)
})

test("a cleared guard lets switches through", () => {
    const workbench = bench()

    workbench.guardScreen(() => {})
    workbench.guardScreen(null)
    workbench.activate("two")

    expect(workbench.activeScreenId).toBe("two")
})
