import {type Node, Nodes} from "./NodeTypes";
import type {GraphState, NodeId} from "./GraphStore";

export type ConnectionResolver = {
    flow: (id: NodeId, node: Node, outputName: string) => string;
};

export function createConnectionResolver(
    graph: GraphState,
    visited = new Set<string>()
): ConnectionResolver {
    return {
        flow(id, _node, outputName) {
            const conn = graph.connections.find(
                (c) => c.from.id === id && c.from.name === outputName
            );
            if (!conn) return '';

            const nextNode = Object.entries(graph.nodes).find(([_id, _node]) => _id === conn.to.id);
            if (!nextNode || visited.has(nextNode[0])) return '';

            visited.add(nextNode[0]);
            const def = Nodes[nextNode[1].type];
            if (!def) return `// Unknown node type: ${nextNode[1].type}\n`;

            return def.code(nextNode[0], def, createConnectionResolver(graph, visited));
        },
    };
}
