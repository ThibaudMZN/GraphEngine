<script lang="ts">
  import "svelte-highlight/styles/github-dark-dimmed.css";
  import GraphEditor from "./lib/graph/components/GraphEditor.svelte";
  import CanvasView from "./lib/engine/components/CanvasView.svelte";
  import NodesToolbar from "./lib/graph/components/NodesToolbar.svelte";
  import Header from "./lib/components/Header.svelte";

  let graphEditorElement: GraphEditor | undefined = $state();
</script>

<Header />
<main>
  <NodesToolbar {graphEditorElement} />
  <div class="editor">
    <GraphEditor bind:this={graphEditorElement} />
    <CanvasView />
  </div>
</main>

<style lang="scss">
  main {
    display: flex;
    flex-direction: row;
    overflow: hidden;
    height: calc(100vh - 60px);
  }

  .editor {
    display: grid;
    grid-template-columns: 1fr 1fr;
    height: 100%;
    width: 100%;
    position: relative;
  }
</style>
