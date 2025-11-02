import type { NodeId, NodeInstance } from "./GraphStore";
import type { ConnectionResolver } from "./ConnectionResolver";

export type Socket = { name: string; type: SocketType };
export type SocketType = "flow" | "string" | "number" | "boolean";

export type NodeType =
  | "OnStart"
  | "OnUpdate"
  | "If"
  | "Comparator"
  | "Operator"
  | "Input"
  | "Constant"
  | "Move"
  | "Position"
  | "Screen"
  | "Rotate";
export const NodeCategories = ["Event", "Logic", "Action", "Data"] as const;
export type NodeCategory = (typeof NodeCategories)[number];
export type Node = {
  name: string;
  category: NodeCategory;
  outputs?: Socket[];
  inputs?: Socket[];
  code: (
    id: NodeId,
    node: NodeInstance,
    connections: ConnectionResolver,
  ) => string;
  evaluateOutput?: (
    id: NodeId,
    node: NodeInstance,
    connections: ConnectionResolver,
  ) => string;
  parameters?: Record<string, any>;
};
export const Nodes: Record<NodeType, Node> = {
  OnStart: {
    name: "On start",
    category: "Event",
    outputs: [{ name: "flow", type: "flow" }],
    code: (id, node, connections) => {
      const flow = connections.flow(id, "flow");
      return `function __onStart_${id}(ctx) {\n${flow}\n}`;
    },
  },
  OnUpdate: {
    name: "On update",
    category: "Event",
    outputs: [{ name: "flow", type: "flow" }],
    code: (id, node, connections) => {
      const flow = connections.flow(id, "flow");
      return `function __onUpdate_${id}(ctx) {\n${flow}\n}`;
    },
  },
  If: {
    name: "If",
    category: "Logic",
    inputs: [
      { name: "flow", type: "flow" },
      { name: "condition", type: "boolean" },
    ],
    outputs: [
      { name: "true", type: "flow" },
      { name: "false", type: "flow" },
    ],
    code: (id, node, connections) => {
      const cond = connections.getExpressionForSocket(id, "condition");
      const flowTrue = connections.flow(id, "true");
      const flowFalse = connections.flow(id, "false");
      return `
        if (${cond}) {
          ${flowTrue}
        } else {
          ${flowFalse}
        }
      `;
    },
  },
  Comparator: {
    name: "Comparator",
    category: "Logic",
    inputs: [
      { name: "flow", type: "flow" },
      { name: "A", type: "number" },
      { name: "B", type: "number" },
    ],
    outputs: [
      { name: "true", type: "flow" },
      { name: "false", type: "flow" },
    ],
    parameters: { comparator: ">" },
    code: (id, node, connections) => {
      const a = connections.getExpressionForSocket(id, "A");
      const b = connections.getExpressionForSocket(id, "B");
      const comparator = node.parameters?.comparator;
      if (!comparator) return "";
      const flowTrue = connections.flow(id, "true");
      const flowFalse = connections.flow(id, "false");
      return `
        if (${a} ${comparator} ${b}) {
          ${flowTrue}
        } else {
          ${flowFalse}
        }
      `;
    },
  },
  Constant: {
    name: "Constant",
    category: "Data",
    parameters: { value: 10 },
    outputs: [{ name: "value", type: "number" }],
    code: () => "",
  },
  Input: {
    name: "Input",
    category: "Data",
    parameters: { value: 'ctx.input.keys["ArrowRight"]' },
    outputs: [{ name: "value", type: "boolean" }],
    code: () => "",
  },
  Position: {
    name: "Position",
    category: "Data",
    parameters: { x: 'ctx.objects["player"].x', y: 'ctx.objects["player"].y' },
    outputs: [
      { name: "x", type: "number" },
      { name: "y", type: "number" },
    ],
    code: () => "",
  },
  Operator: {
    name: "Operator",
    category: "Data",
    inputs: [
      { name: "A", type: "number" },
      { name: "B", type: "number" },
    ],
    outputs: [{ name: "result", type: "number" }],
    parameters: { operator: "+" },
    code: () => "",
    evaluateOutput: (id, node, connections) => {
      const a = connections.getExpressionForSocket(id, "A");
      const b = connections.getExpressionForSocket(id, "B");
      const operator = node.parameters?.operator;
      if (!operator) return "";
      return `${a} ${operator} ${b}`;
    },
  },
  Screen: {
    name: "Screen",
    category: "Data",
    parameters: {
      width: 'ctx.constants["screen"].width',
      height: 'ctx.constants["screen"].height',
    },
    outputs: [
      { name: "width", type: "number" },
      { name: "height", type: "number" },
    ],
    code: () => "",
  },
  Move: {
    name: "Move",
    category: "Action",
    inputs: [
      { name: "flow", type: "flow" },
      { name: "dx", type: "number" },
      { name: "dy", type: "number" },
    ],
    outputs: [{ name: "flow", type: "flow" }],
    parameters: {
      mode: "delta",
    },
    code: (id, node, connections) => {
      const flowNext = connections.flow(id, "flow");
      const dx = connections.getExpressionForSocket(id, "dx") || 0;
      const dy = connections.getExpressionForSocket(id, "dy") || 0;
      const target = JSON.stringify("player");
      const operator = node.parameters?.mode === "delta" ? "+=" : "=";
      return `
                ctx.objects[${target}].x ${operator} ${dx};
                ctx.objects[${target}].y ${operator} ${dy};
                ${flowNext}
            `;
    },
  },
  Rotate: {
    name: "Rotate",
    category: "Action",
    inputs: [
      { name: "flow", type: "flow" },
      { name: "angle", type: "number" },
    ],
    outputs: [{ name: "flow", type: "flow" }],
    parameters: {
      mode: "delta",
    },
    code: (id, node, connections) => {
      const flowNext = connections.flow(id, "flow");
      const angle = connections.getExpressionForSocket(id, "angle") || 0;
      const target = JSON.stringify("player");
      const operator = node.parameters?.mode === "delta" ? "+=" : "=";
      return `
                ctx.objects[${target}].rotation ${operator} ${angle};
                ${flowNext}
            `;
    },
  },
} as const;

type Color = `#${string}`;
export const SocketColors: Record<SocketType, Color> = {
  flow: "#60a5fa",
  number: "#f87171",
  string: "#facc15",
  boolean: "#c084fc",
};
export const NodeColors: Record<NodeCategory, Color> = {
  Action: "#facc15",
  Event: "#60a5fa",
  Logic: "#c084fc",
  Data: "#4ade80",
};
export const NodeHeaderColors: Record<NodeCategory, Color> = {
  Action: "#ca8a04",
  Event: "#2563eb",
  Logic: "#9333ea",
  Data: "#16a34a",
};
export const NodeIcons: Record<NodeCategory, string> = {
  Event: "flashlight-line",
  Logic: "cpu-line",
  Action: "play-circle-line",
  Data: "nft-line",
};
