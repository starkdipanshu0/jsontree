import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../store/index';
import type { JsonState, TreeModel, TreeNode, TreeEdge, JsonValue } from './type';

const initialState: JsonState = {
    jsonText: '{\n  "name": "Example",\n  "children": []\n}',
    parseError: null,
    tree: { nodes: [], edges: [], rootId: undefined },
    parsing: false,
    lastParsedAt: null,
};

// deterministic id from path
const idFromPath = (path: string) => path.replace(/\s+/g, '').replace(/[^a-zA-Z0-9_\-\[\]\.]/g, '_') || 'root';

function convertToTreeModel(parsed: JsonValue): TreeModel {
    const nodes: TreeNode[] = [];
    const edges: TreeEdge[] = [];

    function labelFromPath(path: string) {
        if (path === 'root') return 'root';
        // take last segment after dot or bracket
        const m = path.match(/(?:\.([^\.\[]+)|\[([0-9]+)\])$/);
        if (m) return m[1] ?? m[2] ?? path;
        const parts = path.split('.');
        return parts[parts.length - 1];
    }

    function walk(value: any, path: string) {
        const nodeId = idFromPath(path);
        const node: TreeNode = {
            id: nodeId,
            path,
            label: labelFromPath(path),
            type: 'unknown',
        } as TreeNode;

        if (value === null) {
            node.type = 'null';
            node.valuePreview = 'null';
        } else if (Array.isArray(value)) {
            node.type = 'array';
            node.valuePreview = `Array(${value.length})`;
        } else if (typeof value === 'object') {
            node.type = 'object';
            node.valuePreview = 'Object';
        } else if (typeof value === 'string') {
            node.type = 'string';
            node.valuePreview = value.length > 80 ? value.slice(0, 80) + '…' : value;
        } else if (typeof value === 'number') {
            node.type = 'number';
            node.valuePreview = String(value);
        } else if (typeof value === 'boolean') {
            node.type = 'boolean';
            node.valuePreview = String(value);
        }

        nodes.push(node);

        if (node.type === 'object') {
            const entries = Object.entries(value || {});
            for (const [key, child] of entries) {
                const childPath = `${path}.${key}`;
                const childId = idFromPath(childPath);
                edges.push({ id: `${nodeId}->${childId}`, source: nodeId, target: childId, label: key });
                walk(child, childPath);
            }
        } else if (node.type === 'array') {
            for (let i = 0; i < (value || []).length; i++) {
                const child = value[i];
                const childPath = `${path}[${i}]`;
                const childId = idFromPath(childPath);
                edges.push({ id: `${nodeId}->${childId}`, source: nodeId, target: childId, label: String(i) });
                walk(child, childPath);
            }
        }
    }

    walk(parsed, 'root');

    return { nodes, edges, rootId: nodes.length ? nodes[0].id : undefined };
}

export const parseJson = createAsyncThunk<TreeModel, void, { state: RootState }>('json/parseJson', async (_, { getState, rejectWithValue }) => {
    const state = getState();
    const text = state.jsonTree.jsonText;
    try {
        const parsed = JSON.parse(text) as JsonValue;
        const model = convertToTreeModel(parsed);
        return model;
    } catch (err: any) {
        return rejectWithValue(err?.message ?? String(err));
    }
});

const slice = createSlice({
    name: 'json',
    initialState,
    reducers: {
        setJsonText(state, action: PayloadAction<string>) {
            state.jsonText = action.payload;
        },
        clearJson(state) {
            state.jsonText = '';
            state.parseError = null;
            state.tree = { nodes: [], edges: [], rootId: undefined };
        },
        setTree(state, action: PayloadAction<TreeModel>) {
            state.tree = action.payload;
            state.parseError = null;
            state.lastParsedAt = Date.now();
        },
        setParseError(state, action: PayloadAction<string | null>) {
            state.parseError = action.payload;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(parseJson.pending, (state) => {
                state.parsing = true;
                state.parseError = null;
            })
            .addCase(parseJson.fulfilled, (state, action) => {
                state.parsing = false;
                state.tree = action.payload;
                state.lastParsedAt = Date.now();
                state.parseError = null;
            })
            .addCase(parseJson.rejected, (state, action) => {
                state.parsing = false;
                state.parseError = (action.payload as string) || action.error.message || 'Unknown parse error';
            });
    },
});

export const { setJsonText, clearJson, setTree, setParseError } = slice.actions;
export default slice.reducer;

// selectors
export const selectJsonText = (s: RootState) => s.jsonTree.jsonText;
export const selectParseError = (s: RootState) => s.jsonTree.parseError;
export const selectTreeModel = (s: RootState) => s.jsonTree.tree;
export const selectParsing = (s: RootState) => s.jsonTree.parsing;
