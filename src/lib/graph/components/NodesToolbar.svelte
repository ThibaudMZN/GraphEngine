<script lang="ts">
  import { graphStore } from "../GraphStore";
  import {
    type NodeCategory,
    NodeColors,
    NodeIcons,
    Nodes,
    type NodeType,
  } from "../Nodes";
  import GraphEditor from "./GraphEditor.svelte";

  interface Props {
    graphEditorElement: GraphEditor | undefined;
  }

  let { graphEditorElement } = $props();
</script>

<div class="toolbar">
  <!-- svelte-ignore a11y_missing_attribute -->
  <img
    id="dummy-img"
    src="data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw=="
  />
  <!--  <button onclick={() => graphStore.cleanGraph()}>Clean</button>-->
  {#each Object.entries(Nodes) as [id, node]}
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
      class="draggable-node"
      draggable="true"
      style="color: {NodeColors[node.category]}; font-size: 18px"
      ondragstart={(e) => {
        e.dataTransfer?.setData("application/node-type", id);
        const dragImg = document.getElementById("dummy-img");
        if (dragImg) e.dataTransfer?.setDragImage(dragImg, 0, 0);
      }}
      ondragend={(e) => graphEditorElement?.triggerDragEnd(e)}
      title={node.name}
    >
      <i class="ri-{NodeIcons[node.category]}"></i>
    </div>
  {/each}
</div>

<style lang="scss">
  #dummy-img {
    position: absolute;
    top: 0;
    left: 0;
  }

  .toolbar {
    padding: 16px;
    display: flex;
    flex-direction: column;
    width: 80px;
    gap: 8px;
    box-sizing: border-box;
    background: var(--background);
    border-right: 1px solid var(--border);

    .draggable-node {
      padding: 16px;
      text-align: center;
      cursor: move;
      display: flex;
      align-items: center;
      justify-content: center;
      max-height: 12px;
      border-radius: 8px;

      &:hover {
        background: var(--border);
      }
    }
  }
</style>
