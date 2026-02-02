
export type AmanMode = "ALIGN" | "MODEL" | "ACT" | "NAVIGATE";

export interface Message {
    role: "user" | "assistant";
    content: string;
    mode?: AmanMode;
    timestamp: number;
}

export interface CommandResponse {
    mode: AmanMode;
    response: string;
}

export interface Session {
    id: string;
    title: string;
    mode: AmanMode; // The mode the session was last in
    messages: Message[];
    timestamp: number; // Last activity
}
