import { type MouseEvent as ReactMouseEvent, useCallback, useEffect, useRef, useState } from "react"
import { Drawer as VaulDrawer } from "vaul"
import type { Modal } from "../../Types"
import { useWorkbench } from "../context"
import { CloseIcon } from "./AppMenu"
import type { ModalHostProps } from "./Types"

/** vaul's exit animation; the sheet unmounts once it's done. */
const SHEET_EXIT_MS = 500

type Guard = (() => void) | null

/**
 * The modal's `guard`: a handler the content sets to step in front of
 * dismissals the user starts. Kept in a ref so calling it never waits on a
 * render; `guarded` is state because the sheet's swipe has to be switched off.
 */
function useGuard() {
    const handler = useRef<Guard>(null)
    const [guarded, setGuarded] = useState(false)

    // Stable, so content can set it from an effect without re-running it.
    const guard = useCallback((next: Guard) => {
        handler.current = next
        setGuarded(next !== null)
    }, [])

    return { handler, guarded, guard }
}

function ModalSheet({ modal }: { modal: Modal }) {
    const workbench = useWorkbench()
    const [open, setOpen] = useState(true)
    const { handler, guarded, guard } = useGuard()
    // Portaled in here rather than <body>, so the sheet keeps the shell's --wb-* variables.
    const [host, setHost] = useState<HTMLDivElement | null>(null)
    const ModalComponent = modal.component

    // Closing from code (the modal's own close) slides out like a swipe does,
    // then leaves the modal. Timed here: vaul's onAnimationEnd only fires for
    // closes vaul started itself.
    useEffect(() => {
        if (open) return

        const timer = setTimeout(() => workbench.closeModal(), SHEET_EXIT_MS)
        return () => clearTimeout(timer)
    }, [open, workbench])

    return (
        <div ref={setHost}>
            {host && (
                // Guarded, vaul's own dismissals are off; tapping off asks the guard instead.
                <VaulDrawer.Root open={open} onOpenChange={setOpen} dismissible={!guarded}>
                    <VaulDrawer.Portal container={host}>
                        <VaulDrawer.Overlay
                            className="wb-drawer-overlay wb-modal-sheet-overlay"
                            onClick={() => handler.current?.()}
                        />
                        <VaulDrawer.Content className="wb-drawer wb-modal-sheet" aria-describedby={undefined}>
                            <VaulDrawer.Handle className="wb-drawer-handle" />
                            <VaulDrawer.Title className="wb-drawer-title">{modal.label ?? modal.id}</VaulDrawer.Title>
                            <ModalComponent
                                emit={(event, payload) => workbench.emit(event, payload)}
                                close={() => setOpen(false)}
                                guard={guard}
                            />
                        </VaulDrawer.Content>
                    </VaulDrawer.Portal>
                </VaulDrawer.Root>
            )}
        </div>
    )
}

/**
 * A modal in the host's own frame. Every close plays the exit first and
 * leaves once it's over; a dismissal the user starts (backdrop, ✕) goes
 * through the content's guard, if it has set one.
 */
function FramedModal({ modal }: { modal: Modal }) {
    const workbench = useWorkbench()
    const [closing, setClosing] = useState(false)
    const { handler, guard } = useGuard()
    const ModalComponent = modal.component
    const close = () => setClosing(true)
    const dismiss = () => (handler.current ? handler.current() : close())

    function stop(event: ReactMouseEvent) {
        event.stopPropagation()
    }

    return (
        <div
            className="wb-modal-backdrop"
            data-closing={closing || undefined}
            onClick={dismiss}
            // The backdrop's own fade decides when the exit is over; the modal's bubbles up and is ignored.
            onAnimationEnd={(event) => closing && event.target === event.currentTarget && workbench.closeModal()}
        >
            <div
                className="wb-modal"
                role="dialog"
                aria-modal="true"
                aria-label={modal.label ?? modal.id}
                onClick={stop}
            >
                {/* Escape and tapping off aren't reliable on a phone, so every modal gets a visible way out. */}
                <button type="button" className="wb-icon-button wb-modal-close" aria-label="Close" onClick={dismiss}>
                    <CloseIcon />
                </button>
                <div className="wb-modal-body">
                    <ModalComponent
                        emit={(event, payload) => workbench.emit(event, payload)}
                        close={close}
                        guard={guard}
                    />
                </div>
            </div>
        </div>
    )
}

export function ModalHost({ mobile = false }: ModalHostProps) {
    const workbench = useWorkbench()
    const modal = workbench.activeModalId ? workbench.getModal(workbench.activeModalId) : undefined

    if (!modal) {
        return null
    }

    // Keyed so opening another modal starts its own entrance rather than reusing this one's state.
    return mobile && modal.sheet ? (
        <ModalSheet key={modal.id} modal={modal} />
    ) : (
        <FramedModal key={modal.id} modal={modal} />
    )
}
