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

  let value: string = $state(
    node.parameters?.value
      ? node.parameters?.value.replace('ctx.input.keys["', "").replace('"]', "")
      : "ArrowRight",
  );

  const updateParameter = async () => {
    await graphStore.updateParameter(id, "value", `ctx.input.keys["${value}"]`);
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
  <select onchange={() => updateParameter()} bind:value>
    <option value="ArrowRight">⇨</option>
    <option value="ArrowLeft">⇦</option>
    <option value="ArrowUp">⇧</option>
    <option value="ArrowDown">⇩</option>
  </select>
</foreignObject>

<style>
  select {
    width: 100%;
    height: 100%;
    text-align: center;
  }
</style>
