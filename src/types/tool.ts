export type ToolInput = { name: string; description: string; url: string; iconUrl: string; version: number };
export type ExternalTool = ToolInput & { id: string; createdAt: string; updatedAt: string };
