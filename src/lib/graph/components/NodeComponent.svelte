<script lang="ts">
  import {
    GRAPH_NODE_WIDTH,
    type NodeInstance,
    type NodeId,
    type Vector2,
    GRAPH_NODE_HEADER_HEIGHT,
    GRAPH_NODE_SOCKET_HEIGHT,
    graphStore,
  } from "../GraphStore";
  import {
    Nodes,
    type Node,
    SocketColors,
    type SocketType,
    type NodeType,
    NodeHeaderColors,
    NodeIcons,
    type Socket,
  } from "../Nodes";
  import type { Component } from "svelte";
  import InputComponent from "./customNodeComponents/InputComponent.svelte";
  import ConstantComponent from "./customNodeComponents/ConstantComponent.svelte";
  import ComparatorComponent from "./customNodeComponents/ComparatorComponent.svelte";
  import OperatorComponent from "./customNodeComponents/OperatorComponent.svelte";
  import DeltaOrAbsoluteComponent from "./customNodeComponents/DeltaOrAbsoluteComponent.svelte";
  import TimerComponent from "./customNodeComponents/TimerComponent.svelte";
  import TextComponent from "./customNodeComponents/TextComponent.svelte";

  type Props = {
    node: NodeInstance;
    id: NodeId;
    handleMouseDown: (
      id: NodeId,
      details: { mousePosition: Vector2; nodePosition: Vector2 },
    ) => void;
    handleConnectionClick: (
      initialPosition: Vector2,
      nodeId: NodeId,
      connectionType: SocketType,
      connectionName: string,
      connectionDirection: "input" | "output",
    ) => void;
  };

  let { node, id, handleMouseDown, handleConnectionClick }: Props = $props();

  type CustomComponent = {
    component: Component<any>;
    position: Vector2;
  };
  const customComponent: Partial<Record<NodeType, CustomComponent>> = {
    Input: {
      component: InputComponent,
      position: { x: 1, y: 1 },
    },
    Constant: { component: ConstantComponent, position: { x: 1, y: 1 } },
    Comparator: { component: ComparatorComponent, position: { x: 2, y: 3 } },
    Operator: { component: OperatorComponent, position: { x: 2, y: 2 } },
    Move: { component: DeltaOrAbsoluteComponent, position: { x: 2, y: 2 } },
    Velocity: { component: DeltaOrAbsoluteComponent, position: { x: 2, y: 2 } },
    Rotate: { component: DeltaOrAbsoluteComponent, position: { x: 2, y: 2 } },
    Timer: { component: TimerComponent, position: { x: 2, y: 2 } },
    Text: { component: TextComponent, position: { x: 2, y: 2 } },
  } as const;

  const nodeDetails: Node = Nodes[node.type];
  const width = GRAPH_NODE_WIDTH;

  const nbSockets = Math.max(
    nodeDetails.inputs?.length || 0,
    nodeDetails.outputs?.length || 0,
  );
  const socketsHeight =
    nbSockets * GRAPH_NODE_SOCKET_HEIGHT +
    32 +
    (nbSockets > 1 ? (nbSockets - 1) * 24 : 0);
  const height = GRAPH_NODE_HEADER_HEIGHT + socketsHeight;

  const handleLocalConnectionClick = (
    e: MouseEvent & {
      currentTarget: EventTarget & HTMLDivElement;
    },
    socket: Socket,
    direction: "input" | "output",
  ) => {
    e.preventDefault();
    e.stopPropagation();
    const pos = e.currentTarget.getBoundingClientRect();
    const x = pos.x + pos.width / 2;
    const y = pos.y + pos.height / 2;
    handleConnectionClick({ x, y }, id, socket.type, socket.name, direction);
  };

  const capitalizeFirstLetter = (str: string) =>
    String(str).charAt(0).toUpperCase() + String(str).slice(1);

  const nbRows = Math.max(
    nodeDetails.inputs?.length || 0,
    nodeDetails.outputs?.length || 0,
  );
</script>

<g {id}>
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <foreignObject
    x={node.position.x - width / 2}
    y={node.position.y - height / 2}
    {width}
    {height}
    onmousedown={(e) =>
      handleMouseDown(id, {
        mousePosition: { x: e.clientX, y: e.clientY },
        nodePosition: { x: node.position.x, y: node.position.y },
      })}
    onclick={(e) => {
      if (e.button === 0 && e.shiftKey) {
        graphStore.toggleNodeSelection(id);
      }
    }}
  >
    <div
      class="node-container"
      class:selected={$graphStore.selectedNodes.has(id)}
    >
      <div
        class="node-header"
        style="background: {NodeHeaderColors[nodeDetails.category]};"
      >
        <span>{nodeDetails.name}</span>
        <i class="ri-{NodeIcons[nodeDetails.category]}"></i>
      </div>
      <div
        class="node-sockets-container"
        style="grid-template-rows: repeat({nbRows}, auto);"
      >
        {#each nodeDetails.inputs as input, index (index)}
          <div class="node-socket input" style="grid-row: {index + 1}">
            <div
              class="socket input-socket"
              style="background: {SocketColors[input.type]}"
              data-node-id={id}
              data-port-name={input.name}
              data-port-direction="input"
              data-port-type={input.type}
              onmousedown={(e) => {
                if (e.button === 0)
                  handleLocalConnectionClick(e, input, "input");
              }}
            ></div>
            <span>{capitalizeFirstLetter(input.name)}</span>
          </div>
        {/each}
        {#each nodeDetails.outputs as output, index (index)}
          <div class="node-socket output" style="grid-row: {index + 1}">
            <span>{capitalizeFirstLetter(output.name)}</span>
            <div
              class="socket output-socket"
              style="background: {SocketColors[output.type]}"
              data-node-id={id}
              data-port-name={output.name}
              data-port-direction="output"
              data-port-type={output.type}
              onmousedown={(e) =>
                handleLocalConnectionClick(e, output, "output")}
            ></div>
          </div>
        {/each}
        {#if customComponent[node.type]}
          {@const details = customComponent[node.type]}
          {#if details}
            {@const CustomComponent = details.component}
            {@const position = details.position}
            {@const onRightSide = position.x === 2 ? "justify-self: end;" : ""}
            <div
              style="grid-row: {position.y}; grid-column: {position.x}; display: flex; {onRightSide}"
            >
              <CustomComponent {node} {id} />
            </div>
          {/if}
        {/if}
      </div>
    </div>
  </foreignObject>
</g>

<style lang="scss">
  .node-container {
    width: 100%;
    height: 100%;
    border-radius: 8px;
    border: 1px solid var(--border);
    box-sizing: border-box;
    background: var(--background);
    overflow: hidden;
    cursor: pointer;

    &.selected {
      border: 1px solid var(--alt-text);
    }

    .node-header {
      padding: 8px 16px;
      display: flex;
      flex-direction: row;
      justify-content: space-between;
      align-items: center;

      span {
        font-size: 14px;
        line-height: 20px;
        font-weight: bold;
        user-select: none;
      }
    }

    .node-sockets-container {
      display: grid;
      grid-template-columns: 1fr 1fr;
      padding: 16px;
      row-gap: 24px;
      box-sizing: border-box;

      .node-socket.input {
        grid-column: 1;
        justify-self: start;
      }

      .node-socket.output {
        grid-column: 2;
        justify-self: end;
      }

      .node-socket {
        display: flex;
        flex-direction: row;
        gap: 8px;
        align-items: center;

        .socket {
          width: 12px;
          height: 12px;
          border-radius: 100%;
          border: 1px solid var(--border);
          transition: transform 0.1s ease-out;

          &:hover {
            transform: scale(1.3);
          }
        }

        span {
          color: var(--alt-text);
          font-size: 12px;
          line-height: 16px;
        }
      }
    }
  }
</style>
