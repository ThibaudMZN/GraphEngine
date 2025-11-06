import { NodeInstance } from "../../src/lib/graph/GraphStore";
import { NodeType } from "../../src/lib/graph/Nodes";

class NodeBuilder {
  private type: NodeType;
  private parameters?: Record<string, any>;

  constructor() {}

  withType(type: NodeType) {
    this.type = type;
    return this;
  }

  withParameters(parameters: Record<string, any>) {
    this.parameters = parameters;
    return this;
  }

  build(): NodeInstance {
    return {
      type: this.type,
      position: { x: 0, y: 0 },
      parameters: this.parameters,
    };
  }
}

export const aNode = () => new NodeBuilder();
