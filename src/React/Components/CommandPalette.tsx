import { type KeyboardEvent, useMemo, useState } from "react"
import type { ModalProps } from "../../Types"
import { useWorkbench } from "../context"

function matches(command: { label: string; keywords?: string[] }, query: string): boolean {
    if (!query) {
        return true
    }

    const needle = query.toLowerCase()

    return (
        command.label.toLowerCase().includes(needle) ||
        (command.keywords ?? []).some((keyword) => keyword.toLowerCase().includes(needle))
    )
}

export default function CommandPalette({ close }: ModalProps) {
    const workbench = useWorkbench()
    const [query, setQuery] = useState("")
    const [selected, setSelected] = useState(0)

    const commands = useMemo(
        () => workbench.commands().filter((command) => matches(command, query)),
        [workbench, query],
    )

    function run(id: string) {
        // Close the palette before running the command — it's the active modal right
        // now, so closing after would wipe out any modal the command itself opens.
        close()
        workbench.runCommand(id)
    }

    function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
        if (event.key === "ArrowDown" || (event.ctrlKey && (event.key === "n" || event.key === "j"))) {
            event.preventDefault()
            setSelected((index) => Math.min(index + 1, commands.length - 1))
        } else if (event.key === "ArrowUp" || (event.ctrlKey && (event.key === "p" || event.key === "k"))) {
            event.preventDefault()
            setSelected((index) => Math.max(index - 1, 0))
        } else if (event.key === "Enter") {
            event.preventDefault()
            const command = commands[selected]
            if (command) {
                run(command.id)
            }
        } else if (event.key === "Escape") {
            close()
        }
    }

    return (
        <div className="wb-command-palette">
            <input
                type="text"
                autoFocus
                placeholder="Type a command..."
                className="wb-command-palette-input"
                value={query}
                onChange={(event) => {
                    setQuery(event.target.value)
                    setSelected(0)
                }}
                onKeyDown={onKeyDown}
            />

            {commands.length === 0 ? (
                <p className="wb-command-palette-empty">No matching commands.</p>
            ) : (
                <ul className="wb-command-palette-list">
                    {commands.map((command, index) => (
                        <li
                            key={command.id}
                            data-selected={index === selected || undefined}
                            className="wb-command-palette-item"
                            onMouseEnter={() => setSelected(index)}
                            onClick={() => run(command.id)}
                        >
                            {command.icon}
                            <span>{command.label}</span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    )
}
