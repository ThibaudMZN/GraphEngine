<script lang="ts">
  import { graphStore, type Vector2 } from "../GraphStore";
  import { onMount } from "svelte";
  import { NodeColors, NodeIcons, Nodes, type NodeType } from "../Nodes";

  interface Props {
    position: Vector2;
    closeMenu: () => void;
    svgProjection: (x: number, y: number) => Vector2;
  }

  let { position, closeMenu, svgProjection }: Props = $props();
  let search: string = $state("");
  let inputElement: HTMLInputElement | undefined = $state();
  let results: { id: NodeType; label: string }[] = $derived.by(() => {
    return Object.entries(Nodes)
      .map(([id, node]) => ({
        id: id as NodeType,
        label: node.name,
      }))
      .filter(({ id, label }) =>
        search ? label.toLowerCase().includes(search.toLowerCase()) : true,
      );
  });
  let selected: number = $state(-1);

  $effect(() => {
    search;
    if (!search || results.length === 0) selected = -1;
    else selected = 0;
  });

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.code === "ArrowDown") {
      selected = Math.min(selected + 1, results.length - 1);
    } else if (e.code === "ArrowUp") {
      selected = Math.max(0, selected - 1);
    } else if (e.code === "Enter") {
      addNode(results[selected].id);
    }
  };

  onMount(() => {
    if (inputElement) inputElement.focus();
  });

  const addNode = (node: NodeType) => {
    graphStore.addNode(node, svgProjection(position.x, position.y));
    closeMenu();
  };
</script>

<div
  class="shortcut-menu-container"
  style="top: {Math.round(position.y)}px; left: {Math.round(position.x)}px;"
>
  <input
    type="text"
    bind:value={search}
    onkeydown={handleKeyDown}
    bind:this={inputElement}
  />
  <div class="results">
    {#each results as { id, label }, index (id)}
      {@const category = Nodes[id].category}
      <button
        onclick={() => {
          addNode(id);
        }}
        class:selected={selected === index}
      >
        <i
          class="ri-{NodeIcons[category]}"
          style="color: {NodeColors[category]}; font-size: 14px"
        ></i>
        <span>{label}</span>
      </button>
    {/each}
    {#if results.length === 0}
      <span>No results...</span>
    {/if}
  </div>
</div>

<style lang="scss">
  .shortcut-menu-container {
    position: fixed;
    transform: translateX(-50%);
    border-radius: 8px;
    border: 1px solid var(--border);
    box-sizing: border-box;
    background: var(--background);
    padding: 8px 16px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    font-size: 14px;

    input,
    button {
      border: none;
      background: none;
      font-family: "Open Sans", sans-serif;
      text-align: left;
    }

    input {
      outline: none;
      border-bottom: 1px solid var(--border);
    }

    button {
      display: flex;
      gap: 8px;
      align-items: center;
      cursor: pointer;
      padding: 4px 8px;
      border-radius: 8px;

      &:hover,
      &.selected {
        background: var(--border);
      }
    }

    .results {
      display: flex;
      flex-direction: column;
      gap: 4px;
      max-height: 200px;
      overflow-y: scroll;
    }
  }
</style>
