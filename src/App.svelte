<script lang="ts">
  import "svelte-highlight/styles/github-dark-dimmed.css";
  import GraphEditor from "./lib/graph/components/GraphEditor.svelte";
  import { generatedCodeStore, graphStore } from "./lib/graph/GraphStore";
  import { NodeColors, Nodes } from "./lib/graph/Nodes";
  import CanvasView from "./lib/engine/components/CanvasView.svelte";

  let graphEditorElement: GraphEditor | undefined = $state();
</script>

<main>
  <div class="toolbar">
    <!-- svelte-ignore a11y_missing_attribute -->
    <img
      id="dummy-img"
      src="data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw=="
    />
    <button onclick={() => graphStore.cleanGraph()}>Clean</button>
    {#each Object.entries(Nodes) as [id, node]}
      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <div
        class="draggable-node"
        draggable="true"
        style="background: {NodeColors[node.category]}"
        ondragstart={(e) => {
          e.dataTransfer?.setData("application/node-type", id);
          const dragImg = document.getElementById("dummy-img");
          if (dragImg) e.dataTransfer?.setDragImage(dragImg, 0, 0);
        }}
        ondragend={(e) => graphEditorElement?.triggerDragEnd(e)}
      >
        <span>{node.name}</span>
      </div>
    {/each}
  </div>
  <div class="editor">
    <GraphEditor bind:this={graphEditorElement} />
    <CanvasView />
  </div>
  <!--<aside>
  </aside>-->
</main>

<style>
  #dummy-img {
    position: absolute;
    top: 0;
    left: 0;
  }

  main {
    display: flex;
    flex-direction: column;
    height: 100vh;
    overflow: hidden;
  }

  .toolbar {
    padding: 1rem;
    border: 1px solid white;
    display: flex;
    flex-direction: row;
    gap: 1rem;
    box-sizing: border-box;
  }

  .draggable-node {
    padding: 0.25rem;
    text-align: center;
    color: black;
    font-size: 0.875rem;
  }

  .draggable-node span {
    pointer-events: none;
    user-select: none;
  }

  .editor {
    display: grid;
    grid-template-columns: 1fr 1fr;
    height: 100%;
    position: relative;
  }
</style>
