import prettier from "prettier/standalone";
import parserBabel from "prettier/plugins/babel";
import parserEstree from "prettier/plugins/estree";
import { createConnectionResolver } from "./ConnectionResolver";
import type { GraphState } from "./GraphStore";
import { Nodes } from "./NodeTypes";
import { minify } from "terser";

export async function generateCode(graph: GraphState): Promise<string> {
  const resolver = createConnectionResolver(graph);

  let initCode = "";
  let updateCode = "";

  for (const [id, node] of Object.entries(graph.nodes)) {
    const type = Nodes[node.type];
    if (!type) continue;

    if (node.type === "OnStart") {
      initCode += type.code(id, type, resolver) + "\n";
    } else if (node.type === "OnUpdate") {
      updateCode += type.code(id, type, resolver) + "\n";
    }
  }

  const source = `
    // --- Generated Game Script ---
    let ctx = { objects: {} };

    ${initCode}
    ${updateCode}

    export function init(context) {
      ctx = context;
      ${Object.entries(graph.nodes)
        .filter(([_id, node]) => node.type === "OnStart")
        .map(([id]) => `__onStart_${id}(ctx);`)
        .join("\n")}
    }
    
    export function update(context, delta) {
      ctx = context;
      ${Object.entries(graph.nodes)
        .filter(([_id, node]) => node.type === "OnUpdate")
        .map(([id]) => `__onUpdate_${id}(ctx, delta);`)
        .join("\n")}
    }
  `;
  const formatted = await formatCode(source);
  const cleaned = await minify(formatted, {
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

async function formatCode(code: string): Promise<string> {
  try {
    return prettier.format(code, {
      parser: "babel",
      plugins: [parserEstree, parserBabel],
      semi: true,
      singleQuote: true,
      trailingComma: "es5",
      tabWidth: 2,
    });
  } catch (err) {
    console.error("Prettier formatting failed:", err);
    return code;
  }
}
