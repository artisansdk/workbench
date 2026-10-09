import type { Toast as HotToast } from "react-hot-toast"
import { resolveValue, ToastBar, Toaster } from "react-hot-toast"
import type { ToastSpec } from "../../Types"
import { useWorkbench, useWorkbenchComponents } from "../context"
import type { ToastProps } from "../Types"
import { useLayout } from "../useLayout"
import { CloseIcon } from "./AppMenu"

/** Gap between the toasts and the shell's edges. */
const EDGE = 16

/**
 * One notice, drawn by the registry's Toast. Built when react-hot-toast renders
 * it, inside the shell, so the registry (and the app's own Toast) is in reach.
 */
export function ToastContent({ spec, toast }: { spec: ToastSpec; toast: HotToast }) {
    const workbench = useWorkbench()
    const { Toast } = useWorkbenchComponents()
    const { message, onDismiss, ...props } = spec

    return (
        <Toast {...props} onDismiss={onDismiss ?? (() => workbench.dismissToast(toast.id))}>
            {message}
        </Toast>
    )
}

/** A plain notice for apps that don't bring their own Toast. */
export function Toast({ variant = "neutral", icon, action, onDismiss, children }: ToastProps) {
    return (
        <div className="wb-toast" data-variant={variant}>
            {icon}
            <div className="wb-toast-message">{children}</div>
            {action && (
                <button type="button" className="wb-toast-action" onClick={action.onClick}>
                    {action.label}
                </button>
            )}
            <button type="button" className="wb-icon-button" aria-label="Dismiss" onClick={onDismiss}>
                <CloseIcon />
            </button>
        </div>
    )
}

/**
 * Where notices appear. Desktop: the bottom-right corner of the window, fixed
 * there whatever sidebars are open so they never shift sideways. Mobile: the
 * full width, just above the bottom nav.
 *
 * `workbench.toastInset` lifts them clear of something parked at the bottom of
 * the screen (a selection drawer, say).
 */
export function ToastHost() {
    const workbench = useWorkbench()
    const mobile = useLayout() === "mobile"
    const position = mobile ? "bottom-center" : "bottom-right"
    const inset = workbench.toastInset > 0 ? workbench.toastInset : EDGE
    const containerStyle = mobile
        ? // Inside the shell, so the nav's own height is readable rather than guessed.
          { bottom: `calc(var(--wb-bottom-nav-height) + ${inset}px)`, left: EDGE, right: EDGE }
        : { bottom: Math.max(EDGE, workbench.toastInset), right: EDGE }

    return (
        // Above the modals and bottom nav (1000–1001), under the mobile menu (1003+),
        // rather than react-hot-toast's default 9999 over everything.
        <Toaster position={position} gutter={8} containerStyle={{ ...containerStyle, zIndex: 1002 }}>
            {/* The library's bar for its enter/leave animation, stripped of
                its own chrome so only the registry's Toast shows inside it. */}
            {(t) => (
                <ToastBar
                    toast={t}
                    position={position}
                    style={{
                        padding: 0,
                        background: "none",
                        boxShadow: "none",
                        maxWidth: "none",
                        width: mobile ? "100%" : "24rem",
                        ...(!t.visible && {
                            animation: "wb-toast-exit 0.4s forwards cubic-bezier(0.06, 0.71, 0.55, 1)",
                        }),
                    }}
                >
                    {() => resolveValue(t.message, t)}
                </ToastBar>
            )}
        </Toaster>
    )
}
