import { writable, get } from "svelte/store";
import { type SocketType, type NodeType, Nodes } from "./Nodes";
import { generateCode } from "./CodeGen";
import { cleanLayout } from "./GraphCleaner";
import { tick } from "svelte";

export const GRAPH_NODE_WIDTH = 224;
export const GRAPH_NODE_HEADER_HEIGHT = 40;
export const GRAPH_NODE_SOCKET_HEIGHT = 16;
export const GRAPH_NODE_HEIGHT = 40;

export type NodeId = string;
export type Vector2 = { x: number; y: number };

export type NodeInstance = {
  type: NodeType;
  position: Vector2;
  parameters?: Record<string, any>;
};

type ConnectionPoint = {
  id: NodeId;
  name: string;
};

export type Connection = {
  from: ConnectionPoint;
  to: ConnectionPoint;
  type: SocketType;
};

export type GraphState = {
  nodes: Record<NodeId, NodeInstance>;
  connections: Connection[];
  selectedNodes: Set<NodeId>;
};

const defaultGraph = {
  nodes: {},
  connections: [],
  selectedNodes: new Set<NodeId>(),
};

const loadGraph = (): GraphState => {
  const savedGraphString = localStorage.getItem("graph");
  if (!savedGraphString) return defaultGraph as GraphState;
  else {
    let g: GraphState = JSON.parse(savedGraphString);
    return {
      ...g,
      selectedNodes: new Set<NodeId>(g.selectedNodes),
    };
  }
};
const graph = loadGraph();
const { subscribe, update } = writable<GraphState>(graph);

const { subscribe: generatedCodeSubscribe, set: generatedCodeSet } =
  writable<string>("");
const updateGeneratedCode = async () =>
  generatedCodeSet(await generateCode(get(graphStore)));

export const graphStore = {
  subscribe,
  setNodePosition: (id: NodeId, position: Vector2) => {
    update((actual) => {
      actual.nodes[id].position = position;
      return actual;
    });
  },
  addNode: async (type: NodeType, position: Vector2) => {
    const ids = Object.keys(get(graphStore).nodes).map((s) => parseInt(s));
    const newId = ids.length ? Math.max(...ids) + 1 : 1;
    const defaultParameters = Nodes[type].parameters;
    update((actual) => {
      actual.nodes[newId] = {
        type,
        position,
        ...(defaultParameters && { parameters: defaultParameters }),
      };
      return actual;
    });
    await updateGeneratedCode();

    return newId.toString() as NodeId;
  },
  deleteNode: async (id: string) => {
    update((actual) => {
      const allConnections = actual.connections.filter(
        (c) => c.from.id === id || c.to.id === id,
      );
      for (const connection of allConnections) {
        graphStore.deleteConnection(connection);
      }
      delete actual.nodes[id];
      return actual;
    });

    await updateGeneratedCode();
  },
  addConnection: async (
    from: ConnectionPoint,
    to: ConnectionPoint,
    type: SocketType,
  ) => {
    update((actual) => {
      actual.connections = [...actual.connections, { from, to, type }];
      return actual;
    });

    await updateGeneratedCode();
  },
  deleteConnection: async (connection: Connection) => {
    update((actual) => {
      const index = actual.connections.findIndex((c) => c === connection);
      actual.connections.splice(index, 1);
      return actual;
    });

    await updateGeneratedCode();
  },
  updateParameter: async (id: NodeId, key: string, value: any) => {
    update((actual) => {
      if (!actual.nodes[id].parameters)
        throw new Error(`Cannot set parameter ${key} for node ${id}`);
      actual.nodes[id].parameters[key] = value;
      return actual;
    });

    await updateGeneratedCode();
  },
  cleanGraph: () => {
    update((actual) => {
      return cleanLayout(actual);
    });
  },
  selectNodes: (nodes: NodeId[]) => {
    update((actual) => {
      actual.selectedNodes = new Set(nodes);
      return actual;
    });
  },
  toggleNodeSelection: (id: NodeId) => {
    update((actual) => {
      if (actual.selectedNodes.has(id)) actual.selectedNodes.delete(id);
      else actual.selectedNodes.add(id);
      return actual;
    });
  },
  selectAll: () => {
    update((actual) => {
      actual.selectedNodes = new Set(Object.keys(actual.nodes));
      return actual;
    });
  },
  deleteSelectedNodes: async () => {
    const currentGraph = get(graphStore);
    if (currentGraph.selectedNodes.size === 0) return;

    const promises = [...currentGraph.selectedNodes].map((id: NodeId) =>
      graphStore.deleteNode(id),
    );
    await Promise.all(promises);

    await updateGeneratedCode();
  },
};
graphStore.subscribe((g) => {
  const serialized = {
    ...g,
    selectedNodes: [...g.selectedNodes],
  };
  localStorage.setItem("graph", JSON.stringify(serialized));
});

const unsubscribe = graphStore.subscribe(async (g) => {
  await updateGeneratedCode();
  unsubscribe();
});

export const generatedCodeStore = {
  subscribe: generatedCodeSubscribe,
};

export type Clipboard = {
  nodes: Record<NodeId, NodeInstance>;
  connections: Connection[];
};

export const copySelectedNodes = () => {
  const g = get(graphStore);
  const selected = [...g.selectedNodes];
  if (!selected.length) return;

  const nodes: Record<NodeId, NodeInstance> = Object.fromEntries(
    selected.map((id: NodeId) => [id as NodeId, structuredClone(g.nodes[id])]),
  );

  const connections = g.connections.filter(
    (c) => selected.includes(c.from.id) && selected.includes(c.to.id),
  );

  return { nodes, connections } as Clipboard;
};

export const pasteNodes = async (clipboard: Clipboard, center: Vector2) => {
  if (!clipboard) return;
  if (Object.keys(clipboard.nodes).length === 0) return;

  const oldToNewIds: Record<NodeId, NodeId> = {};

  const size = Object.keys(clipboard.nodes).length;
  const oldNodesAcc = Object.values(clipboard.nodes).reduce(
    (acc, v) => {
      return { x: acc.x + v.position.x, y: acc.y + v.position.y };
    },
    { x: 0, y: 0 },
  );
  const oldNodesCenter = { x: oldNodesAcc.x / size, y: oldNodesAcc.y / size };

  for (const oldId in clipboard.nodes) {
    const node = clipboard.nodes[oldId];
    const dx = node.position.x - oldNodesCenter.x;
    const dy = node.position.y - oldNodesCenter.y;
    const newId = await graphStore.addNode(node.type, {
      x: center.x + dx,
      y: center.y + dy,
    });
    await tick();
    if (node.parameters) {
      for (const [key, value] of Object.entries(node.parameters)) {
        await graphStore.updateParameter(newId, key, value);
      }
    }
    oldToNewIds[oldId] = newId;
  }

  for (const conn of clipboard.connections) {
    await graphStore.addConnection(
      {
        id: oldToNewIds[conn.from.id],
        name: conn.from.name,
      },
      {
        id: oldToNewIds[conn.to.id],
        name: conn.to.name,
      },
      conn.type,
    );
  }

  graphStore.selectNodes(Object.values(oldToNewIds));
};
