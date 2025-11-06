import { writable, get, derived, type Subscriber } from "svelte/store";
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

export type ConnectionPoint = {
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

const { subscribe: generatedCodeSubscribe, set: generatedCodeSet } =
  writable<string>("");
const updateGeneratedCode = async () =>
  generatedCodeSet(await generateCode(get(projetStore).scenes));

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

type ProjectState = {
  scenes: Record<string, GraphState>;
  activeSceneId: string;
};

const defaultProjectState: ProjectState = {
  scenes: {
    player: defaultGraph,
  },
  activeSceneId: "player",
};
const loadProjectState = () => {
  const savedProjectState = localStorage.getItem("graphs");
  if (!savedProjectState) return defaultProjectState;
  else {
    let g: ProjectState = JSON.parse(savedProjectState);
    return {
      activeSceneId: g.activeSceneId,
      scenes: Object.fromEntries(
        Object.entries(g.scenes).map(([k, v]) => [
          k,
          {
            ...v,
            selectedNodes: new Set<NodeId>(v.selectedNodes),
          },
        ]),
      ),
    };
  }
};
const { subscribe, update, set } = writable<ProjectState>(loadProjectState());
export const projetStore = { subscribe, update, set };

projetStore.subscribe((g) => {
  const serialized = {
    ...g,
    scenes: Object.fromEntries(
      Object.entries(g.scenes).map(([k, v]) => [
        k,
        {
          ...v,
          selectedNodes: [...v.selectedNodes],
        },
      ]),
    ),
  };
  localStorage.setItem("graphs", JSON.stringify(serialized));
});

export const graphStore = {
  subscribe: (cb: Subscriber<GraphState>) =>
    derived(projetStore, ($p) => $p.scenes[$p.activeSceneId]).subscribe(cb),
  setNodePosition: (id: NodeId, position: Vector2) => {
    update((actual) => {
      actual.scenes[actual.activeSceneId].nodes[id].position = position;
      return actual;
    });
  },
  addNode: async (type: NodeType, position: Vector2) => {
    const actual = get(projetStore);
    const ids = Object.values(actual.scenes)
      .flatMap((s) => Object.keys(s.nodes))
      .map((i) => parseInt(i));
    const newId = ids.length ? Math.max(...ids) + 1 : 1;
    const defaultParameters = Nodes[type].parameters;
    update((actual) => {
      actual.scenes[actual.activeSceneId].nodes[newId] = {
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
      const allConnections = actual.scenes[
        actual.activeSceneId
      ].connections.filter((c) => c.from.id === id || c.to.id === id);
      for (const connection of allConnections) {
        graphStore.deleteConnection(connection);
      }
      delete actual.scenes[actual.activeSceneId].nodes[id];
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
      actual.scenes[actual.activeSceneId].connections = [
        ...actual.scenes[actual.activeSceneId].connections,
        { from, to, type },
      ];
      return actual;
    });

    await updateGeneratedCode();
  },
  deleteConnection: async (connection: Connection) => {
    update((actual) => {
      const index = actual.scenes[actual.activeSceneId].connections.findIndex(
        (c) => c === connection,
      );
      actual.scenes[actual.activeSceneId].connections.splice(index, 1);
      return actual;
    });

    await updateGeneratedCode();
  },
  updateParameter: async (id: NodeId, key: string, value: any) => {
    update((actual) => {
      if (!actual.scenes[actual.activeSceneId].nodes[id].parameters)
        throw new Error(`Cannot set parameter ${key} for node ${id}`);
      // @ts-ignore
      actual.scenes[actual.activeSceneId].nodes[id].parameters[key] = value;
      return actual;
    });

    await updateGeneratedCode();
  },
  cleanGraph: () => {
    update((actual) => {
      actual.scenes[actual.activeSceneId] = cleanLayout(
        actual.scenes[actual.activeSceneId],
      );
      return actual;
    });
  },
  selectNodes: (nodes: NodeId[]) => {
    update((actual) => {
      actual.scenes[actual.activeSceneId].selectedNodes = new Set(nodes);
      return actual;
    });
  },
  toggleNodeSelection: (id: NodeId) => {
    update((actual) => {
      if (actual.scenes[actual.activeSceneId].selectedNodes.has(id))
        actual.scenes[actual.activeSceneId].selectedNodes.delete(id);
      else actual.scenes[actual.activeSceneId].selectedNodes.add(id);
      return actual;
    });
  },
  selectAll: () => {
    update((actual) => {
      actual.scenes[actual.activeSceneId].selectedNodes = new Set(
        Object.keys(actual.scenes[actual.activeSceneId].nodes),
      );
      return actual;
    });
  },
  deleteSelectedNodes: async () => {
    const actual = get(projetStore);
    const currentGraph = actual.scenes[actual.activeSceneId];
    if (currentGraph.selectedNodes.size === 0) return;

    const promises = [...currentGraph.selectedNodes].map((id: NodeId) =>
      graphStore.deleteNode(id),
    );
    await Promise.all(promises);

    await updateGeneratedCode();
  },
};

projetStore.subscribe(async () => {
  await updateGeneratedCode();
});
