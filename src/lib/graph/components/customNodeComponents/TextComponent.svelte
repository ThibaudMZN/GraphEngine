<script lang="ts">
  import { graphStore, type NodeId, type NodeInstance } from "../../GraphStore";

  type Props = {
    node: NodeInstance;
    id: NodeId;
  };

  let { node, id }: Props = $props();

  let value: number = $state(node.parameters?.text ?? "Hello world");

  const updateParameter = async () => {
    await graphStore.updateParameter(id, "text", value);
  };
</script>

<input type="text" onchange={() => updateParameter()} bind:value />

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
    font-family: "Open Sans", sans-serif;
    outline: none;
    text-align: right;
  }
</style>
