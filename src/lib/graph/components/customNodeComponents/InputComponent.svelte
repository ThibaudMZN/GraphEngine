<script lang="ts">
  import { graphStore, type NodeId, type NodeInstance } from "../../GraphStore";

  type Props = {
    node: NodeInstance;
    id: NodeId;
  };

  let { node, id }: Props = $props();

  let value: string = $state(node.parameters?.key ?? "ArrowRight");
  let type: string = $state(node.parameters?.type ?? "hold");

  const updateParameter = async () => {
    await graphStore.updateParameter(id, "key", value);
  };
  const updateType = async () => {
    await graphStore.updateParameter(id, "type", type);
  };
</script>

<div>
  <select onchange={() => updateParameter()} bind:value>
    <option value="ArrowRight">⇨</option>
    <option value="ArrowLeft">⇦</option>
    <option value="ArrowUp">⇧</option>
    <option value="ArrowDown">⇩</option>
  </select>
  <select onchange={() => updateType()} bind:value={type}>
    <option value="hold">Hold</option>
    <option value="once">Once</option>
  </select>
</div>

<style>
  div {
    display: flex;
    gap: 8px;
  }

  select {
    color: var(--alt-text);
    font-size: 10px;
    line-height: 16px;
    border: none;
    background: var(--border);
    border-radius: 4px;
    margin: 0;
    max-height: 16px;
    font-family: "Open Sans", sans-serif;
  }
</style>
