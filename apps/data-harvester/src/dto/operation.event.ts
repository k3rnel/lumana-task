export enum Operation {
    HARVEST = "harvest",
    GET_STATUS = "get_status",
    SEED = "seed",
    SEARCH = "search",
}

export class OperationEvent {
    constructor(
        private operation: Operation,
        private request: Record<string, any>,
        private result: Record<string, any>,
        private timestamp: Date,
    ) {}
}
