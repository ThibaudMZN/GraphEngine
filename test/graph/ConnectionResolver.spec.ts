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
});
