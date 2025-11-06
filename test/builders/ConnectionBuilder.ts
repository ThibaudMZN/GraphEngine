import { Connection, ConnectionPoint } from "../../src/lib/graph/GraphStore";
import { SocketType } from "../../src/lib/graph/Nodes";

class ConnectionBuilder {
  private type: SocketType;
  private from: ConnectionPoint;
  private to: ConnectionPoint;

  constructor() {}

  startingFrom(connection: ConnectionPoint) {
    this.from = connection;
    return this;
  }

  goingTo(connection: ConnectionPoint) {
    this.to = connection;
    return this;
  }

  build(): Connection {
    return {
      type: this.type,
      from: this.from,
      to: this.to,
    };
  }
}

export const aConnection = () => new ConnectionBuilder();
