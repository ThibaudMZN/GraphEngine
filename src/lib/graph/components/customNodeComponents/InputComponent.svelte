<script lang="ts">
  import { graphStore, type NodeId, type NodeInstance } from "../../GraphStore";

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
</script>

<select onchange={() => updateParameter()} bind:value>
  <option value="ArrowRight">⇨</option>
  <option value="ArrowLeft">⇦</option>
  <option value="ArrowUp">⇧</option>
  <option value="ArrowDown">⇩</option>
</select>

<style>
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
