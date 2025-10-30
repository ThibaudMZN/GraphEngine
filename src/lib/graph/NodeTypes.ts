import type { NodeId } from "./GraphStore";
import type { ConnectionResolver } from "./ConnectionResolver";

export type InOutType = "flow" | "string" | "number";

type ParameterType = "number";

export type Node = {
  category: "Event" | "Action" | "Logic" | "Data";
  name: string;
  outputs?: { name: string; type: InOutType }[];
  inputs?: { name: string; type: InOutType }[];
  code: (id: NodeId, node: Node, connections: ConnectionResolver) => string;
  parameters?: Record<string, any>; //TODO: Parameters needs to be on the NodeInstance, not here. This should just be a list of name and type of parameters
};

export const Nodes: Record<string, Node> = {
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
    inputs: [{ name: "flow", type: "flow" }],
    outputs: [
      { name: "true", type: "flow" },
      { name: "false", type: "flow" },
    ],
    code: (id, node, connections) => {
      // const cond = node.params?.condition ?? "true";
      const cond = 'ctx.input.keys["ArrowRight"]';
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
      const dx = parseInt(connections.getExpressionForSocket(id, "dx")) || 0;
      const dy = parseInt(connections.getExpressionForSocket(id, "dy")) || 0;
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
      const target = JSON.stringify("dummy");
      return `
                ctx.objects[${target}].rotation += ${angle};
                ${flowNext}
            `;
    },
  },
} as const;

export type NodeTypes = keyof typeof Nodes;

type Color = `#${string}`;

export const InOutColor: Record<InOutType, Color> = {
  flow: "#50ff50",
  number: "#ff5050",
  string: "#5050ff",
};

export const NodeColor: Record<Node["category"], Color> = {
  Action: "#ff5050",
  Event: "#50ff50",
  Logic: "#5050ff",
  Data: "#ff0050",
};
