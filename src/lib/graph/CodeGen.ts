import { createConnectionResolver } from "./ConnectionResolver";
import type { GraphState } from "./GraphStore";
import { Nodes } from "./Nodes";
import { minify } from "terser";

export async function generateCode(
  graphs: Record<string, GraphState>,
): Promise<string> {
  let initCode = "";
  let updateCode = "";
  let collisionCode = "";

  for (const graphId in graphs) {
    const graph = graphs[graphId];

    const resolver = createConnectionResolver(graph, graphId);

    for (const [id, node] of Object.entries(graph.nodes)) {
      const type = Nodes[node.type];
      if (!type) continue;

      if (node.type === "OnStart") {
        initCode += type.code(id, node, resolver, graphId) + "\n";
      } else if (node.type === "OnUpdate") {
        updateCode += type.code(id, node, resolver, graphId) + "\n";
      } else if (node.type === "OnCollision") {
        collisionCode += type.code(id, node, resolver, graphId) + "\n";
      }
    }
  }

  const source = `
    // --- Generated Game Script ---
    let ctx = { objects: {} };

    ${initCode}
    ${updateCode}
    ${collisionCode}

    exports.init = function(context) {
      ctx = context;
      ${Object.values(graphs)
        .flatMap((g) => Object.entries(g.nodes))
        .filter(([_id, node]) => node.type === "OnStart")
        .map(([id]) => `__onStart_${id}(ctx);`)
        .join("\n")}
    }
    
    exports.update = function(context, delta) {
      ctx = context;
      ${Object.values(graphs)
        .flatMap((g) => Object.entries(g.nodes))
        .filter(([_id, node]) => node.type === "OnUpdate")
        .map(([id]) => `__onUpdate_${id}(ctx, delta);`)
        .join("\n")}
    }
    
    exports.onCollision = function(ctx, self, other) {
      ${Object.values(graphs)
        .flatMap((g) => Object.entries(g.nodes))
        .filter(([_id, node]) => node.type === "OnCollision")
        .map(([id]) => `__onCollision_${id}(ctx, self, other);`)
        .join("\n")}
    };
  `;

  const cleaned = await minify(source, {
    compress: {
      dead_code: true,
      unused: true,
      conditionals: true,
      evaluate: true,
      sequences: false,
      booleans: false,
    },
    format: {
      beautify: true, // keeps it readable
    },
  });
  return cleaned.code || "";
}
