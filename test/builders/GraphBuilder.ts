import {
  Connection,
  GraphState,
  NodeInstance,
} from "../../src/lib/graph/GraphStore";

class GraphBuilder {
  private nodes: Record<string, NodeInstance>;
  private connections: Connection[];

  constructor() {
    this.nodes = {};
    this.connections = [];
  }

  withNodes(nodes: NodeInstance[]) {
    this.nodes = Object.fromEntries(nodes.map((n, idx) => [idx.toString(), n]));
    return this;
  }

  withConnections(connections: Connection[]) {
    this.connections = connections;
    return this;
  }

  build(): GraphState {
    return {
      nodes: this.nodes,
      connections: this.connections,
      selectedNodes: new Set(),
    };
  }
}

export const aGraph = () => new GraphBuilder();
