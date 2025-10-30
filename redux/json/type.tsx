export type JsonValue = null | boolean | number | string | JsonObject | JsonValue[];
export interface JsonObject { [key: string]: JsonValue }

export type NodeType = 'object' | 'array' | 'string' | 'number' | 'boolean' | 'null' | 'unknown';

export type TreeNode = {
    id: string; // deterministic path-based id (e.g. root, root.users[0].name)
    label: string;
    path: string; // canonical path like root.users[0].name
    type: NodeType;
    valuePreview?: string;
    collapsed?: boolean;
};

export type TreeEdge = {
    id: string;
    source: string;
    target: string;
    label?: string; // key or index
};

export type TreeModel = {
    nodes: TreeNode[];
    edges: TreeEdge[];
    rootId?: string;
};

export type JsonState = {
    jsonText: string;
    parseError?: string | null;
    tree: TreeModel;
    parsing: boolean;
    lastParsedAt?: number | null;
};
