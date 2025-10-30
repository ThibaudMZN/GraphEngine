import {
  GRAPH_NODE_HEIGHT,
  GRAPH_NODE_WIDTH,
  type GraphNode,
  type GraphState,
  type NodeId,
} from "./GraphStore";

function computeNodeLevels(state: GraphState): Record<NodeId, number> {
  const indegree = new Map<NodeId, number>();
  const adj = new Map<NodeId, NodeId[]>();

  // initialize
  for (const id in state.nodes) {
    indegree.set(id, 0);
    adj.set(id, []);
  }

  // build graph
  for (const conn of state.connections) {
    adj.get(conn.from.id)?.push(conn.to.id);
    indegree.set(conn.to.id, (indegree.get(conn.to.id) || 0) + 1);
  }

  // BFS / Kahn’s algorithm
  const queue: NodeId[] = [];
  const levels: Record<NodeId, number> = {};

  for (const [id, deg] of indegree) {
    if (deg === 0) {
      queue.push(id);
      levels[id] = 0;
    }
  }

  while (queue.length > 0) {
    const node = queue.shift()!;
    const lvl = levels[node] || 0;

    for (const neighbor of adj.get(node) || []) {
      indegree.set(neighbor, indegree.get(neighbor)! - 1);
      if (indegree.get(neighbor)! === 0) {
        queue.push(neighbor);
        levels[neighbor] = lvl + 1;
      }
    }
  }

  return levels;
}

export function cleanLayout(state: GraphState): GraphState {
  const levels = computeNodeLevels(state);

  // group by level
  const groups: Record<number, NodeId[]> = {};
  for (const id in levels) {
    const lvl = levels[id];
    if (!groups[lvl]) groups[lvl] = [];
    groups[lvl].push(id);
  }

  const spacingX = GRAPH_NODE_WIDTH * 1.3;
  const spacingY = GRAPH_NODE_HEIGHT * 2;

  const newNodes: Record<NodeId, GraphNode> = {};

  for (const [lvl, ids] of Object.entries(groups)) {
    ids.forEach((id, index) => {
      const node = state.nodes[id];
      newNodes[id] = {
        ...node,
        position: {
          x: GRAPH_NODE_WIDTH / 2 + 10 + Number(lvl) * spacingX,
          y: GRAPH_NODE_HEIGHT / 2 + 10 + index * spacingY,
        },
      };
    });
  }

  return {
    ...state,
    nodes: {
      ...state.nodes,
      ...newNodes,
    },
  };
}
