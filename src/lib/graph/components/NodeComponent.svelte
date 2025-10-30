<script lang="ts">
  import {
    GRAPH_NODE_HEIGHT,
    GRAPH_NODE_WIDTH,
    type GraphNode,
    graphStore,
    type NodeId,
    type Vector2,
  } from "../GraphStore";
  import { Nodes, type Node, InOutColor, type InOutType } from "../NodeTypes";

  type Props = {
    node: GraphNode;
    id: NodeId;
    handleMouseDown: (
      id: NodeId,
      details: { mousePosition: Vector2; nodePosition: Vector2 },
    ) => void;
    handleConnectionClick: (
      initialPosition: Vector2,
      nodeId: NodeId,
      connectionType: InOutType,
      connectionName: string,
    ) => void;
  };

  let { node, id, handleMouseDown, handleConnectionClick }: Props = $props();

  const nodeDetails: Node = Nodes[node.type];
  const width = GRAPH_NODE_WIDTH;
  const height = GRAPH_NODE_HEIGHT;
</script>

<rect
  x={node.position.x - width / 2}
  y={node.position.y - height / 2}
  {width}
  {height}
  fill="black"
  stroke="white"
  role="button"
  tabindex="0"
  rx="4"
  aria-label={nodeDetails.name}
  onmousedown={(e) =>
    handleMouseDown(id, {
      mousePosition: { x: e.clientX, y: e.clientY },
      nodePosition: { x: node.position.x, y: node.position.y },
    })}
  ondblclick={() => graphStore.deleteNode(id)}
/>
<text
  x={node.position.x}
  y={node.position.y}
  text-anchor="middle"
  dominant-baseline="central"
  fill="white"
>
  {nodeDetails.name}
</text>
{#each nodeDetails.inputs as input, index}
  {@const count = nodeDetails.inputs?.length || 0}
  {@const spacing = count > 1 ? height / (count - 1) : 0}
  {@const cy =
    count === 1
      ? node.position.y
      : node.position.y - height / 2 + index * spacing}
  {@const cx = node.position.x - width / 2}
  <circle
    class="port input-port"
    data-node-id={id}
    data-port-name={input.name}
    {cx}
    {cy}
    r={4}
    fill={InOutColor[input.type]}
    role="button"
    tabindex="0"
    onmousedown={() =>
      handleConnectionClick({ x: cx, y: cy }, id, input.type, input.name)}
  />
{/each}
{#each nodeDetails.outputs as output, index}
  {@const count = nodeDetails.outputs?.length || 0}
  {@const spacing = count > 1 ? height / (count - 1) : 0}
  {@const cy =
    count === 1
      ? node.position.y
      : node.position.y - height / 2 + index * spacing}
  {@const cx = node.position.x + width / 2}
  <circle
    class="port output-port"
    data-node-id={id}
    data-port-name={output.name}
    {cx}
    {cy}
    r={4}
    fill={InOutColor[output.type]}
    role="button"
    tabindex="0"
    onmousedown={() =>
      handleConnectionClick({ x: cx, y: cy }, id, output.type, output.name)}
  />
{/each}

<style>
  circle {
    cursor: pointer;
  }

  rect {
    cursor: pointer;
  }

  text {
    pointer-events: none;
    user-select: none;
  }
</style>
