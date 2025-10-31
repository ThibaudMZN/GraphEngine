import { createConnectionResolver } from "./ConnectionResolver";
import type { GraphState } from "./GraphStore";
import { Nodes } from "./Nodes";
import { minify } from "terser";

export async function generateCode(graph: GraphState): Promise<string> {
  const resolver = createConnectionResolver(graph);

  let initCode = "";
  let updateCode = "";

  for (const [id, node] of Object.entries(graph.nodes)) {
    const type = Nodes[node.type];
    if (!type) continue;

    if (node.type === "OnStart") {
      initCode += type.code(id, node, resolver) + "\n";
    } else if (node.type === "OnUpdate") {
      updateCode += type.code(id, node, resolver) + "\n";
    }
  }

  const source = `
    // --- Generated Game Script ---
    let ctx = { objects: {} };

    ${initCode}
    ${updateCode}

    exports.init = function(context) {
      ctx = context;
      ${Object.entries(graph.nodes)
        .filter(([_id, node]) => node.type === "OnStart")
        .map(([id]) => `__onStart_${id}(ctx);`)
        .join("\n")}
    }
    
    exports.update = function(context, delta) {
      ctx = context;
      ${Object.entries(graph.nodes)
        .filter(([_id, node]) => node.type === "OnUpdate")
        .map(([id]) => `__onUpdate_${id}(ctx, delta);`)
        .join("\n")}
    }
  `;

  const cleaned = await minify(source, {
    compress: {
      dead_code: true,
      unused: true,
      conditionals: true,
      evaluate: true,
      sequences: false,
    },
    format: {
      beautify: true, // keeps it readable
    },
  });
  return cleaned.code || "";
}
