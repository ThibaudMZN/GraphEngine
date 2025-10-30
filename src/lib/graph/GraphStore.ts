import { writable, derived, get } from "svelte/store";
import { type InOutType, type NodeTypes } from "./NodeTypes";
import { generateCode } from "./CodeGen";

export type NodeId = string;
export type Vector2 = { x: number; y: number };

export type GraphNode = {
  type: NodeTypes;
  position: Vector2;
};

type ConnectionPoint = {
  id: NodeId;
  name: string;
};

export const GRAPH_NODE_WIDTH = 120;
export const GRAPH_NODE_HEIGHT = 40;

export type Connection = {
  from: ConnectionPoint;
  to: ConnectionPoint;
  type: InOutType;
};

export type GraphState = {
  nodes: Record<NodeId, GraphNode>;
  connections: Connection[];
};

const id1 = "1";
const id2 = "2";
const id3 = "3";
const id4 = "4";
const { subscribe, update } = writable<GraphState>({
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
      position: { x: 240, y: 180 },
    },
  },
  connections: [
    {
      from: { id: id1, name: "flow" },
      to: { id: id2, name: "flow" },
      type: "flow",
    },
  ],
});

export const graphStore = {
  subscribe,
  setNodePosition: (id: NodeId, position: Vector2) => {
    update((actual) => {
      actual.nodes[id].position = position;
      return actual;
    });
  },
  addNode: (type: NodeTypes, position: Vector2) => {
    const ids = Object.keys(get(graphStore).nodes).map((s) => parseInt(s));
    const newId = Math.max(...ids) + 1;
    update((actual) => {
      actual.nodes[newId] = { type, position };
      return actual;
    });
    return newId.toString() as NodeId;
  },
  addConnection: (
    from: ConnectionPoint,
    to: ConnectionPoint,
    type: InOutType,
  ) => {
    update((actual) => {
      actual.connections = [...actual.connections, { from, to, type }];
      return actual;
    });
  },
  deleteConnection: (connection: Connection) => {
    update((actual) => {
      const index = actual.connections.findIndex((c) => c === connection);
      actual.connections.splice(index, 1);
      return actual;
    });
  },
};

// export const generatedCodeStore = derived(graphStore, ($graph) => generateCode($graph));

export const generatedCodeStore = derived(
  graphStore,
  ($graph, set) => {
    set("");
    Promise.resolve(generateCode($graph)).then((value) => {
      set(value);
    });
  },
  "",
);
