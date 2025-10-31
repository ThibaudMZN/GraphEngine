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

<input type="number" onchange={() => updateParameter()} bind:value />

<style>
  input {
    color: var(--alt-text);
    font-size: 12px;
    line-height: 16px;
    border: none;
    box-sizing: border-box;
    background: var(--border);
    border-radius: 4px;
    margin: 0;
    max-height: 16px;
    max-width: 72px;
  }
</style>
