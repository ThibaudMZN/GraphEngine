<script lang="ts">
  import {
    type Connection,
    GRAPH_NODE_HEIGHT,
    GRAPH_NODE_WIDTH,
    type NodeInstance,
    graphStore,
  } from "../GraphStore";
  import { SocketColors, Nodes } from "../Nodes";

  let { connection }: { connection: Connection } = $props();

  const stroke = SocketColors[connection.type];

  type BezierPoints = {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    cx1: number;
    cy1: number;
    cx2: number;
    cy2: number;
  };

  const getInputOutputPoint = (
    node: NodeInstance,
    socket: "inputs" | "outputs",
  ) => {
    const targetSocket = socket === "outputs" ? "from" : "to";
    const nodeDetails = Nodes[node.type];
    const count = nodeDetails[socket]?.length || 0;
    const spacing = count > 1 ? GRAPH_NODE_HEIGHT / (count - 1) : 0;
    const index =
      nodeDetails[socket]?.findIndex(
        (i) => i.name === connection[targetSocket].name,
      ) || 0;
    return count === 1
      ? node.position.y
      : node.position.y - GRAPH_NODE_HEIGHT / 2 + index * spacing;
  };

  let points: BezierPoints = $derived.by(() => {
    const from = $graphStore.nodes[connection.from.id];
    const to = $graphStore.nodes[connection.to.id];

    // Let's assume "from" is always an output, and "to" always an input
    const x1 = from.position.x + GRAPH_NODE_WIDTH / 2;
    const x2 = to.position.x - GRAPH_NODE_WIDTH / 2;

    const y1 = getInputOutputPoint(from, "outputs");
    const y2 = getInputOutputPoint(to, "inputs");

    const dx = Math.abs(x2 - x1) * 0.5;
    const multiplier = x1 < x2 ? 1 : -1;
    const cx1 = x1 + multiplier * dx;
    const cy1 = y1;
    const cx2 = x2 - multiplier * dx;
    const cy2 = y2;

    return { x1, y1, x2, y2, cx1, cy1, cx2, cy2 };
  });

  let path = $derived(
    `M ${points.x1} ${points.y1} C ${points.cx1} ${points.cy1}, ${points.cx2} ${points.cy2}, ${points.x2} ${points.y2}`,
  );
</script>

<!--<filter id="glow">-->
<!--    <feDropShadow dx="0" dy="0" stdDeviation="2" flood-color={stroke} />-->
<!--</filter>-->
<!--      filter="url(#glow)"-->
<path
  d={path}
  fill="none"
  {stroke}
  stroke-width="2"
  stroke-linecap="round"
  ondblclick={async () => await graphStore.deleteConnection(connection)}
/>
