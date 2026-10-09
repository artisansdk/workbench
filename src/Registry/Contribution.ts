export type Options<T> = {
    type: string
    getId: (contribution: T) => string
}

export default class Contribution<T> {
    protected contributions = new Map<string, T>()
    protected sources = new Map<string, Set<string>>()
    protected readonly type: string
    protected readonly getContributionId: (contribution: T) => string

    constructor(options: Options<T>) {
        this.type = options.type
        this.getContributionId = options.getId
    }

    register(contribution: T, source: string) {
        const id = this.getContributionId(contribution)

        if (this.contributions.has(id)) {
            throw new Error(`Duplicate ${this.type} id: ${id}`)
        }

        this.contributions.set(id, contribution)
        this.trackSource(source, id)
    }

    unregisterSource(source: string) {
        const ids = this.sources.get(source)

        if (!ids) {
            return
        }

        for (const id of ids) {
            this.contributions.delete(id)
        }

        this.sources.delete(source)
    }

    get(id: string): T | undefined {
        return this.contributions.get(id)
    }

    all(): T[] {
        return [...this.contributions.values()]
    }

    protected trackSource(source: string, id: string) {
        if (!this.sources.has(source)) {
            this.sources.set(source, new Set())
        }

        this.sources.get(source)?.add(id)
    }
}
