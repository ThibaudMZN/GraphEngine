import type { NodeId, NodeInstance } from "./GraphStore";
import type { ConnectionResolver } from "./ConnectionResolver";

export type Socket = { name: string; type: SocketType };
export type SocketType = "flow" | "string" | "number" | "boolean";

export type NodeType =
  | "OnStart"
  | "OnUpdate"
  | "OnCollision"
  | "EndGame"
  | "If"
  | "Comparator"
  | "Timer"
  | "Operator"
  | "Input"
  | "Constant"
  | "Move"
  | "Position"
  | "Velocity"
  | "Size"
  | "Screen"
  | "Rotate"
  | "Text";
export const NodeCategories = [
  "Event",
  "Logic",
  "Action",
  "Data",
  "UI",
] as const;
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
      return `function __onUpdate_${id}(ctx, delta) {\n${flow}\n}`;
    },
  },
  OnCollision: {
    name: "On collision",
    category: "Event",
    outputs: [{ name: "flow", type: "flow" }],
    parameters: { with: "wall" },
    code: (id, node, connections) => {
      const flow = connections.flow(id, "flow");
      const other = node.parameters?.with;
      if (!other) return "";
      return `
          function __onCollision_${id}(ctx, self, other) {
            if(self === 'player' && other === "${other}") {
                ${flow}
            }
          }
      `;
    },
  },
  EndGame: {
    name: "End game",
    category: "Event",
    inputs: [{ name: "flow", type: "flow" }],
    code: (id, node, connections) => {
      return `
              game.end();
            `;
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
    parameters: { key: "ArrowRight", type: "hold" },
    outputs: [{ name: "value", type: "boolean" }],
    code: () => "",
    evaluateOutput: (id, node, connections) => {
      const key = node.parameters?.key;
      const type = node.parameters?.type;
      if (!key || !type) return "";
      const targetCtx = type === "hold" ? "keys" : "pressed";
      return `ctx.input["${targetCtx}"]["${key}"]`;
    },
  },
  Position: {
    name: "Position",
    category: "Data",
    parameters: {
      x: 'ctx.objects["player"].position.x',
      y: 'ctx.objects["player"].position.y',
    },
    outputs: [
      { name: "x", type: "number" },
      { name: "y", type: "number" },
    ],
    code: () => "",
  },
  Size: {
    name: "Size",
    category: "Data",
    parameters: {
      width: 'ctx.objects["player"].size.width',
      height: 'ctx.objects["player"].size.height',
      halfWidth: 'ctx.objects["player"].size.width / 2',
      halfHeight: 'ctx.objects["player"].size.height / 2',
    },
    outputs: [
      { name: "width", type: "number" },
      { name: "height", type: "number" },
      { name: "halfWidth", type: "number" },
      { name: "halfHeight", type: "number" },
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
      width: "ctx.constants.screen.width",
      height: "ctx.constants.screen.height",
      halfWidth: "ctx.constants.screen.width / 2",
      halfHeight: "ctx.constants.screen.height / 2",
    },
    outputs: [
      { name: "width", type: "number" },
      { name: "height", type: "number" },
      { name: "halfWidth", type: "number" },
      { name: "halfHeight", type: "number" },
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
      const dx = connections.getExpressionForSocket(id, "dx");
      const dy = connections.getExpressionForSocket(id, "dy");
      const target = JSON.stringify("player");
      const operator = node.parameters?.mode === "delta" ? "+=" : "=";

      return `
                ${dx !== undefined ? `ctx.objects[${target}].position.x ${operator} ${dx};` : ""}
                ${dy !== undefined ? `ctx.objects[${target}].position.y ${operator} ${dy};` : ""}
                ${flowNext}
            `;
    },
  },
  Velocity: {
    name: "Velocity",
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
      const dx = connections.getExpressionForSocket(id, "dx");
      const dy = connections.getExpressionForSocket(id, "dy");
      const target = JSON.stringify("player");
      const operator = node.parameters?.mode === "delta" ? "+=" : "=";

      return `
                ${dx !== undefined ? `ctx.objects[${target}].velocity.x ${operator} ${dx};` : ""}
                ${dy !== undefined ? `ctx.objects[${target}].velocity.y ${operator} ${dy};` : ""}
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
  Timer: {
    name: "Timer",
    category: "Logic",
    inputs: [
      { name: "flow", type: "flow" },
      { name: "duration", type: "number" },
    ],
    outputs: [{ name: "done", type: "flow" }],
    parameters: { repeat: false },
    code: (id, node, connections) => {
      const duration = connections.getExpressionForSocket(id, "duration");
      const flowNext = connections.flow(id, "done");
      const repeat = node.parameters?.repeat;

      const key = `__timer_${id}`;

      return `
      if (!ctx.timers["${key}"]) {
        ctx.timers["${key}"] = { elapsed: 0, active: true };
      }
      if(ctx.timers["${key}"].active) {
        ctx.timers["${key}"].elapsed += delta;
        if (ctx.timers["${key}"].elapsed >= ${duration}) {
          ctx.timers["${key}"].elapsed = 0;
          ${repeat ? "" : `ctx.timers["${key}"].active = false;`}
          ${flowNext}
        }
      }
    `;
    },
  },
  Text: {
    name: "Text",
    category: "UI",
    parameters: {
      text: "Hello world",
      size: 48,
      color: "white",
    },
    inputs: [
      { name: "flow", type: "flow" },
      { name: "x", type: "number" },
      { name: "y", type: "number" },
      { name: "size", type: "number" },
    ],
    outputs: [{ name: "flow", type: "flow" }],
    code: (id, node, connections) => {
      const x = connections.getExpressionForSocket(id, "x");
      const y = connections.getExpressionForSocket(id, "y");
      const size = connections.getExpressionForSocket(id, "size");
      const flow = connections.flow(id, "flow");

      if (!node.parameters || !x || !y || !size) return "";
      const { text, color } = node.parameters;
      return `
        ctx.texts[${id}] = {
            value: "${text}",
            x: ${x},
            y: ${y},
            size: ${size},
            color: "${color}",
          };
        ${flow}
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
  UI: "#f87171",
};
export const NodeHeaderColors: Record<NodeCategory, Color> = {
  Action: "#ca8a04",
  Event: "#2563eb",
  Logic: "#9333ea",
  Data: "#16a34a",
  UI: "#dc2626",
};
export const NodeIcons: Record<NodeCategory, string> = {
  Event: "flashlight-line",
  Logic: "cpu-line",
  Action: "play-circle-line",
  Data: "nft-line",
  UI: "palette-line",
};
