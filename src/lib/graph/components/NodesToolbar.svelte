<script lang="ts">
  import { slide } from "svelte/transition";
  import {
    NodeCategories,
    type NodeCategory,
    NodeColors,
    NodeHeaderColors,
    NodeIcons,
    Nodes,
  } from "../Nodes";
  import GraphEditor from "./GraphEditor.svelte";

  interface Props {
    graphEditorElement: GraphEditor | undefined;
  }

  let { graphEditorElement }: Props = $props();
  let openedCategory: NodeCategory | undefined = $state();
</script>

<!--<svelte:window onclick={(e) => console.log(e.currentTarget)} />-->
<div class="toolbar">
  <!-- svelte-ignore a11y_missing_attribute -->
  <img
    id="dummy-img"
    src="data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw=="
  />
  {#each NodeCategories as category}
    {@const active = openedCategory === category}
    <div class="side-menu-container">
      <button
        title={category}
        onclick={() => {
          if (openedCategory !== category) openedCategory = category;
          else openedCategory = undefined;
        }}
        class:active
      >
        <i
          class="ri-{NodeIcons[category]}"
          style="color: {NodeColors[category]}; font-size: 24px"
        ></i>
      </button>
      {#if active}
        <div
          class="floating-menu-container"
          transition:slide={{ axis: "x", duration: 100 }}
        >
          <span><b>{category}</b></span>
          <div class="node-container">
            {#each Object.entries(Nodes).filter(([type, node]) => node.category === category) as [id, node] (id)}
              <!-- svelte-ignore a11y_no_static_element_interactions -->
              <div
                class="draggable-node"
                draggable="true"
                style="background: {NodeHeaderColors[node.category]};"
                ondragstart={(e) => {
                  e.dataTransfer?.setData("application/node-type", id);
                  const dragImg = document.getElementById("dummy-img");
                  if (dragImg) e.dataTransfer?.setDragImage(dragImg, 0, 0);
                  setTimeout(() => {
                    openedCategory = undefined;
                  }, 200);
                }}
                ondragend={(e) => graphEditorElement?.triggerDragEnd(e)}
              >
                <span>{node.name}</span>
              </div>
            {/each}
          </div>
        </div>
      {/if}
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
    gap: 24px;
    box-sizing: border-box;
    background: var(--background);
    border-right: 1px solid var(--border);

    .side-menu-container {
      position: relative;

      button {
        padding: 12px;
        background: none;
        outline: none;
        border: none;
        border-radius: 8px;
        cursor: pointer;

        &:hover {
          background: #111827;
        }

        &.active {
          background: var(--border);
        }
      }

      .floating-menu-container {
        position: absolute;
        top: 0;
        right: -24px;
        padding: 8px 16px;
        background: var(--background);
        border: 1px solid var(--border);
        transform: translateX(100%);
        z-index: 1;
        border-radius: 8px;
        white-space: nowrap;
        display: flex;
        flex-direction: column;
        gap: 8px;

        .node-container {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
      }
    }

    .draggable-node {
      padding: 4px 8px;
      width: fit-content;
      font-size: 12px;
      line-height: 16px;
      font-weight: 600;
      cursor: move;
      border-radius: 8px;
    }
  }
</style>
