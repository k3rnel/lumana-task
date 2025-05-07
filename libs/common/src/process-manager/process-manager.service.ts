import { Injectable } from "@nestjs/common";
import { randomUUID } from "crypto";

export type ProcessStatus = "pending" | "processing" | "done" | "failed";

export interface ProcessInfo {
    readonly id: string;
    readonly status: ProcessStatus;
    readonly metadata?: Record<string, string>;
    readonly error?: string;
    readonly startedAt: Date;
    readonly updatedAt: Date;
}

interface InternalProcess extends ProcessInfo {
    status: ProcessStatus;
    metadata?: Record<string, string>;
    error?: string;
    startedAt: Date;
    updatedAt: Date;
}

// Simple process manager to create processes based on downloadable files.
@Injectable()
export class ProcessManager {
    private readonly processes: Map<string, InternalProcess> = new Map();

    public create(): string {
        const id = randomUUID();
        const now = new Date();

        this.processes.set(id, {
            id,
            status: "pending",
            startedAt: now,
            updatedAt: now,
        });

        return id;
    }

    public get(id: string): ProcessInfo | undefined {
        const proc = this.processes.get(id);

        if (!proc) return undefined;

        return { ...proc };
    }

    public fail(id: string, error: string): void {
        this.update(id, { status: "failed", error });
    }

    public complete(id: string, metadata: Record<string, string>): void {
        this.update(id, { status: "done", metadata });
    }

    public markProcessing(id: string): void {
        this.update(id, { status: "processing" });
    }

    public list(): ProcessInfo[] {
        return Array.from(this.processes.values()).map((proc) => ({ ...proc }));
    }

    public cleanupOlderThan(ms: number): void {
        const now = Date.now();
        for (const [id, proc] of this.processes.entries()) {
            if (now - proc.updatedAt.getTime() > ms) {
                this.processes.delete(id);
            }
        }
    }

    private update(id: string, update: Partial<InternalProcess>): void {
        const proc = this.processes.get(id);

        if (!proc) {
            return;
        }

        if (update.status) {
            proc.status = update.status;
        }
        if (update.error !== undefined) {
            proc.error = update.error;
        }
        if (update.metadata !== undefined) {
            proc.metadata = update.metadata;
        }

        proc.updatedAt = new Date();
    }
}
