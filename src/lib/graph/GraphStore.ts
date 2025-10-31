import { writable, derived, get } from "svelte/store";
import { type SocketType, type NodeType, Nodes } from "./Nodes";
import { generateCode } from "./CodeGen";
import { cleanLayout } from "./GraphCleaner";

export const GRAPH_NODE_WIDTH = 120;
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
};

const id1 = "1";
const id2 = "2";
const id3 = "3";
const id4 = "4";
const id5 = "5";
const id6 = "6";
const defaultGraph = {
  nodes: {
    [id1]: {
      type: "OnStart",
      position: { x: 80, y: 30 },
    },
    [id2]: {
      type: "Move",
      position: { x: 240, y: 60 },
    },
    [id3]: {
      type: "OnUpdate",
      position: { x: 80, y: 180 },
    },
    [id4]: {
      type: "Move",
      position: { x: 400, y: 240 },
    },
    [id5]: {
      type: "If",
      position: { x: 240, y: 240 },
    },
    [id6]: {
      type: "Constant",
      position: { x: 70, y: 90 },
    },
  },
  connections: [
    {
      from: { id: id1, name: "flow" },
      to: { id: id2, name: "flow" },
      type: "flow",
    },
    {
      from: { id: id3, name: "flow" },
      to: { id: id5, name: "flow" },
      type: "flow",
    },
    {
      from: { id: id5, name: "true" },
      to: { id: id4, name: "flow" },
      type: "flow",
    },
    {
      from: { id: id6, name: "value" },
      to: { id: id2, name: "dx" },
      type: "number",
    },
    {
      from: { id: id6, name: "value" },
      to: { id: id2, name: "dy" },
      type: "number",
    },
  ],
};

const savedGraphString = localStorage.getItem("graph");
const { subscribe, update } = writable<GraphState>(
  savedGraphString ? JSON.parse(savedGraphString) : defaultGraph,
);

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
  addNode: (type: NodeType, position: Vector2) => {
    const ids = Object.keys(get(graphStore).nodes).map((s) => parseInt(s));
    const newId = Math.max(...ids) + 1;
    const defaultParameters = Nodes[type].parameters;
    update((actual) => {
      actual.nodes[newId] = {
        type,
        position,
        ...(defaultParameters && { parameters: defaultParameters }),
      };
      return actual;
    });
    return newId.toString() as NodeId;
  },
  deleteNode: (id: string) => {
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
  cleanGraph: () => {
    update((actual) => {
      return cleanLayout(actual);
    });
  },
};
graphStore.subscribe((g) => {
  localStorage.setItem("graph", JSON.stringify(g));
});

const unsubscribe = graphStore.subscribe(async (g) => {
  await updateGeneratedCode();
  unsubscribe();
});

export const generatedCodeStore = {
  subscribe: generatedCodeSubscribe,
};
