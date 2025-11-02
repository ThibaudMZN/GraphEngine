import { type Node, Nodes } from "./Nodes";
import type { GraphState, NodeId } from "./GraphStore";

export type ConnectionResolver = {
  flow: (id: NodeId, outputName: string) => string;
  getExpressionForSocket: (id: NodeId, socketName: string) => string;
};

export function createConnectionResolver(
  graph: GraphState,
  visited = new Set<string>(),
): ConnectionResolver {
  return {
    flow(id, outputName) {
      const conn = graph.connections.find(
        (c) => c.from.id === id && c.from.name === outputName,
      );
      if (!conn) return "";

      const nextNode = Object.entries(graph.nodes).find(
        ([_id, _node]) => _id === conn.to.id,
      );
      if (!nextNode || visited.has(nextNode[0])) return "";

      visited.add(nextNode[0]);
      const def = Nodes[nextNode[1].type];
      if (!def) return `// Unknown node type: ${nextNode[1].type}\n`;

      return def.code(
        nextNode[0],
        nextNode[1],
        createConnectionResolver(graph, visited),
      );
    },
    getExpressionForSocket(id, socketName) {
      const conn = graph.connections.find(
        (c) => c.to.id === id && c.to.name === socketName,
      );
      if (!conn) {
        const node = graph.nodes[id];
        const nodeDetails = Nodes[node.type];
        if (nodeDetails.evaluateOutput) {
          //TODO: We hit a "too much recursion" here if the socket is not connected
          return nodeDetails.evaluateOutput(
            id,
            node,
            createConnectionResolver(graph),
          );
        }
        return node.parameters?.[socketName] ?? undefined;
      }
      return createConnectionResolver(graph).getExpressionForSocket(
        conn.from.id,
        conn.from.name,
      );
    },
  };
}
