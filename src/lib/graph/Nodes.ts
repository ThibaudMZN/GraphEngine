import type { NodeId } from "./GraphStore";
import type { ConnectionResolver } from "./ConnectionResolver";

export type Socket = { name: string; type: SocketType };
export type SocketType = "flow" | "string" | "number" | "boolean";

export type NodeType =
  | "OnStart"
  | "OnUpdate"
  | "If"
  | "Input"
  | "Constant"
  | "Move"
  | "Position"
  | "Rotate";
export type NodeCategory = "Event" | "Action" | "Logic" | "Data";
export type Node = {
  name: string;
  category: NodeCategory;
  outputs?: Socket[];
  inputs?: Socket[];
  code: (id: NodeId, node: Node, connections: ConnectionResolver) => string;
  parameters?: Record<string, any>;
};
export const Nodes: Record<NodeType, Node> = {
  OnStart: {
    name: "On start",
    category: "Event",
    outputs: [{ name: "flow", type: "flow" }],
    code: (id, node, connections) => {
      const flow = connections.flow(id, node, "flow");
      return `function __onStart_${id}(ctx) {\n${flow}\n}`;
    },
  },
  OnUpdate: {
    name: "On update",
    category: "Event",
    outputs: [{ name: "flow", type: "flow" }],
    code: (id, node, connections) => {
      const flow = connections.flow(id, node, "flow");
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
      // const cond = node.params?.condition ?? "true";
      // const cond = 'ctx.input.keys["ArrowRight"]';
      const flowTrue = connections.flow(id, node, "true");
      const flowFalse = connections.flow(id, node, "false");
      return `
        if (${cond}) {
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
    parameters: { x: "ctx.objects['player'].x", y: "ctx.objects['player'].y" },
    outputs: [
      { name: "x", type: "number" },
      { name: "y", type: "number" },
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
    code: (id, node, connections) => {
      const flowNext = connections.flow(id, node, "flow");
      const dx = connections.getExpressionForSocket(id, "dx") || 0;
      const dy = connections.getExpressionForSocket(id, "dy") || 0;
      const target = JSON.stringify("player");
      return `
                ctx.objects[${target}].x += ${dx};
                ctx.objects[${target}].y += ${dy};
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
    code: (id, node, connections) => {
      const flowNext = connections.flow(id, node, "flow");
      const angle = parseInt(connections.getExpressionForSocket(id, "angle"));
      const target = JSON.stringify("player");
      return `
                ctx.objects[${target}].rotation += ${angle};
                ${flowNext}
            `;
    },
  },
} as const;

type Color = `#${string}`;
export const SocketColors: Record<SocketType, Color> = {
  flow: "#50ff50",
  number: "#ff5050",
  string: "#5050ff",
  boolean: "#ffff50",
};
export const NodeColors: Record<NodeCategory, Color> = {
  Action: "#ff5050",
  Event: "#50ff50",
  Logic: "#5050ff",
  Data: "#ff0050",
};
