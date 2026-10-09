import type { Workbench } from "./Workbench"

export type Cleanup = () => void

export abstract class Plugin {
    abstract readonly id: string
    readonly required: boolean = false

    register(_workbench: Workbench): void | Cleanup {}

    boot(_workbench: Workbench): void | Cleanup {}
}
