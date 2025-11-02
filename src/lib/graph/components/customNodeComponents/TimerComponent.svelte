<script lang="ts">
  import { graphStore, type NodeId, type NodeInstance } from "../../GraphStore";

  type Props = {
    node: NodeInstance;
    id: NodeId;
  };

  let { node, id }: Props = $props();

  let value: boolean = $state(node.parameters?.repeat ?? false);

  const updateParameter = async () => {
    await graphStore.updateParameter(id, "repeat", value);
  };
</script>

<div>
  <input
    type="checkbox"
    id="{id}-repeat-parameter"
    name="repeat"
    bind:checked={value}
    onchange={updateParameter}
  />
  <label for="{id}-repeat-parameter">Repeat</label>
</div>

<style>
  div {
    color: var(--alt-text);
    font-size: 10px;
    line-height: 16px;
    border: none;
    border-radius: 4px;
    margin: 0;
    max-height: 16px;
    font-family: "Open Sans", sans-serif;
    display: flex;
    align-items: center;
    gap: 8px;

    input[type="checkbox"] {
      -webkit-appearance: none;
      appearance: none;
      background: none;
      margin: 0;
      border: 1px solid var(--border);
      width: 12px;
      height: 12px;
      border-radius: 2px;
      cursor: pointer;

      &:checked {
        background: var(--purple);
        border: 1px solid transparent;

        &:before {
          content: "";
          display: flex;
          width: 3px;
          height: 6px;
          border-bottom: 1px solid white;
          border-right: 1px solid white;
          transform: translate(3px, 0px) rotate(45deg);
        }
      }
    }

    label {
      cursor: pointer;
    }
  }
</style>
