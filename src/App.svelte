<script lang="ts">
  import Highlight from "svelte-highlight";
  import "svelte-highlight/styles/github-dark-dimmed.css";
  import javascript from "svelte-highlight/languages/javascript";
  import GraphEditor from "./lib/graph/components/GraphEditor.svelte";
  import { generatedCodeStore, graphStore } from "./lib/graph/GraphStore";
  import { NodeColors, Nodes } from "./lib/graph/Nodes";
  import CanvasView from "./lib/engine/components/CanvasView.svelte";

  let graphEditorElement: GraphEditor | undefined = $state();
</script>

<main>
  <div class="toolbar">
    <img
      id="dummy-img"
      src="data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw=="
    />
    <button onclick={() => graphStore.cleanGraph()}>Clean</button>
    {#each Object.entries(Nodes) as [id, node]}
      <div
        class="draggable-node"
        draggable="true"
        style="background: {NodeColors[node.category]}"
        ondragstart={(e) => {
          e.dataTransfer.setData("application/node-type", id);
          const dragImg = document.getElementById("dummy-img");
          e.dataTransfer?.setDragImage(dragImg, 0, 0);
        }}
        ondragend={(e) => graphEditorElement?.triggerDragEnd(e)}
      >
        <span>{node.name}</span>
      </div>
    {/each}
  </div>
  <GraphEditor bind:this={graphEditorElement} />
  <aside>
    <Highlight language={javascript} code={$generatedCodeStore} />
  </aside>
  <CanvasView />
</main>

<style>
  #dummy-img {
    position: absolute;
    top: 0;
    left: 0;
  }
  main {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100vh;
    overflow: hidden;
    gap: 2rem;
  }

  .toolbar {
    padding: 1rem;
    border: 1px solid white;
    display: flex;
    flex-direction: column;
    gap: 1rem;
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
</style>
