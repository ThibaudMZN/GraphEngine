import { createConnectionResolver } from "../../src/lib/graph/ConnectionResolver";
import { aGraph } from "../builders/GraphBuilder";
import { aNode } from "../builders/NodeBuilder";
import { aConnection } from "../builders/ConnectionBuilder";

describe("ConnectionResolver", () => {
  describe("when using flow", () => {
    it("stops if no node is connected", () => {
      const resolver = createConnectionResolver(
        aGraph()
          .withNodes([aNode().withType("OnStart").build()])
          .build(),
        "scene",
      );

      const result = resolver.flow("ID_1", "flow");
      expect(result).toBe("");
    });

    it("connects code to next flow", () => {
      const firstNode = aNode().withType("OnStart").build();
      const secondNode = aNode().withType("EndGame").build();

      const resolver = createConnectionResolver(
        aGraph()
          .withNodes([firstNode, secondNode])
          .withConnections([
            aConnection()
              .startingFrom({ id: "0", name: "flow" })
              .goingTo({ id: "1", name: "flow" })
              .build(),
          ])
          .build(),
        "scene",
      );

      const result = resolver.flow("0", "flow");
      expect(result).toContain("game.end();");
    });

    it("can connect multiple node recursively", () => {
      const firstNode = aNode().withType("OnStart").build();
      const secondNode = aNode().withType("If").build();
      const thirdNode = aNode().withType("EndGame").build();

      const resolver = createConnectionResolver(
        aGraph()
          .withNodes([firstNode, secondNode, thirdNode])
          .withConnections([
            aConnection()
              .startingFrom({ id: "0", name: "flow" })
              .goingTo({ id: "1", name: "flow" })
              .build(),
            aConnection()
              .startingFrom({ id: "1", name: "true" })
              .goingTo({ id: "2", name: "flow" })
              .build(),
          ])
          .build(),
        "scene",
      );

      const result = resolver.flow("0", "flow");
      expect(result).toMatch(
        /if \(undefined\) {\s*game.end\(\);\s*} else {\s*}/gm,
      );
    });
  });

  describe("when getting expression for a socket", () => {
    it("should check if a parameter holds this value", () => {
      const firstNode = aNode()
        .withType("Constant")
        .withParameters({ value: 42 })
        .build();

      const resolver = createConnectionResolver(
        aGraph().withNodes([firstNode]).build(),
        "scene",
      );

      const result = resolver.getExpressionForSocket("0", "value");
      expect(result).toBe(42);
    });

    it("should evaluate its output if needed", () => {
      const firstNode = aNode()
        .withType("Input")
        .withParameters({ key: "aKey", type: "aTypeOfKeyPress" })
        .build();

      const resolver = createConnectionResolver(
        aGraph().withNodes([firstNode]).build(),
        "scene",
      );

      const result = resolver.getExpressionForSocket("0", "value");
      expect(result).toBe('ctx.input["pressed"]["aKey"]');
    });

    it("should return undefined if both fails", () => {
      const firstNode = aNode()
        .withType("Constant")
        .withParameters({ value: 42 })
        .build();

      const resolver = createConnectionResolver(
        aGraph().withNodes([firstNode]).build(),
        "scene",
      );

      const result = resolver.getExpressionForSocket("0", "anUnknownSocket");
      expect(result).toBeUndefined();
    });

    it("should propagate backwards if socket comes from previous node", () => {
      const firstNode = aNode()
        .withType("Operator")
        .withParameters({ operator: "+" })
        .build();
      const secondNode = aNode()
        .withType("Constant")
        .withParameters({ value: 42 })
        .build();
      const thirdNode = aNode()
        .withType("Constant")
        .withParameters({ value: 79 })
        .build();

      const resolver = createConnectionResolver(
        aGraph()
          .withNodes([firstNode, secondNode, thirdNode])
          .withConnections([
            aConnection()
              .startingFrom({ id: "1", name: "value" })
              .goingTo({ id: "0", name: "A" })
              .build(),
            aConnection()
              .startingFrom({ id: "2", name: "value" })
              .goingTo({ id: "0", name: "B" })
              .build(),
          ])
          .build(),
        "scene",
      );

      const result = resolver.getExpressionForSocket("0", "result");
      expect(result).toBe("42 + 79");
    });

    it("should not get block in an infinite recursion loop", () => {
      const firstNode = aNode()
        .withType("Operator")
        .withParameters({ operator: "+" })
        .build();

      const resolver = createConnectionResolver(
        aGraph().withNodes([firstNode]).build(),
        "scene",
      );

      const result = resolver.getExpressionForSocket("0", "result");
      expect(result).toBe(undefined);
    });
  });
});
