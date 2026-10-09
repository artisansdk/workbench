import { Drawer as VaulDrawer } from "vaul"
import { useWorkbench } from "../context"

export function DrawerHost() {
    const workbench = useWorkbench()
    const drawer = workbench.activeDrawerId ? workbench.getDrawer(workbench.activeDrawerId) : undefined

    if (!drawer) {
        return null
    }

    const DrawerComponent = drawer.component

    return (
        <VaulDrawer.Root open onOpenChange={(open) => !open && workbench.closeDrawer()}>
            <VaulDrawer.Portal>
                <VaulDrawer.Overlay className="wb-drawer-overlay" />
                <VaulDrawer.Content className="wb-drawer" aria-describedby={undefined}>
                    <VaulDrawer.Handle className="wb-drawer-handle" />
                    <VaulDrawer.Title className="wb-drawer-title">{drawer.label}</VaulDrawer.Title>
                    <DrawerComponent
                        emit={(event, payload) => workbench.emit(event, payload)}
                        close={() => workbench.closeDrawer()}
                    />
                </VaulDrawer.Content>
            </VaulDrawer.Portal>
        </VaulDrawer.Root>
    )
}
