<script lang="ts">
  import {
    GRAPH_NODE_HEIGHT,
    GRAPH_NODE_WIDTH,
    graphStore,
    type NodeId,
    type NodeInstance,
  } from "../../GraphStore";

  type Props = {
    node: NodeInstance;
    id: NodeId;
  };

  let { node, id }: Props = $props();

  let value: number = $state(node.parameters?.value ?? 10);

  const updateParameter = async () => {
    await graphStore.updateParameter(id, "value", value);
  };
  const sizeX = 64;
  const sizeY = 32;
</script>

<foreignObject
  x={node.position.x - sizeX / 2}
  y={node.position.y - sizeY / 2}
  width={sizeX}
  height={sizeY}
>
  <input type="number" onchange={() => updateParameter()} bind:value />
</foreignObject>

<style>
  input {
    width: 100%;
    height: 100%;
    text-align: center;
    padding: 0;
    margin: 0;
    box-sizing: border-box;
  }
</style>
