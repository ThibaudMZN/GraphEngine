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
    ) => void;
  };

  let { node, id, handleMouseDown, handleConnectionClick }: Props = $props();

  const customComponent: Partial<Record<NodeType, Component<any>>> = {
    Input: InputComponent,
    Constant: ConstantComponent,
    Comparator: ComparatorComponent,
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
  ) => {
    e.preventDefault();
    e.stopPropagation();
    const pos = e.currentTarget.getBoundingClientRect();
    const x = pos.x + pos.width / 2;
    const y = pos.y + pos.height / 2;
    handleConnectionClick({ x, y }, id, socket.type, socket.name);
  };

  const capitalizeFirstLetter = (str: string) =>
    String(str).charAt(0).toUpperCase() + String(str).slice(1);
</script>

<g {id}>
  <!-- svelte-ignore a11y_no_static_element_interactions -->
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
    ondblclick={async () => await graphStore.deleteNode(id)}
  >
    <div class="node-container">
      <div
        class="node-header"
        style="background: {NodeHeaderColors[nodeDetails.category]};"
      >
        <span>{nodeDetails.name}</span>
        <i class="ri-{NodeIcons[nodeDetails.category]}"></i>
      </div>
      <div class="node-sockets-container">
        <!-- TODO: We still need to find a way to instantiate custom components (for Input, Constant and Comparator) -->
        {#each nodeDetails.inputs as input, index (index)}
          <div class="node-socket-line">
            <div class="node-socket">
              <div
                class="socket input-socket"
                style="background: {SocketColors[input.type]}"
                data-node-id={id}
                data-port-name={input.name}
                data-port-type="input"
                onmousedown={(e) => handleLocalConnectionClick(e, input)}
              ></div>
              <span>{capitalizeFirstLetter(input.name)}</span>
            </div>
            {#if nodeDetails.outputs && nodeDetails.outputs[index]}
              {@const output = nodeDetails.outputs[index]}
              <div class="node-socket">
                <span>{capitalizeFirstLetter(output.name)}</span>
                <div
                  class="socket output-socket"
                  style="background: {SocketColors[output.type]}"
                  data-node-id={id}
                  data-port-name={output.name}
                  data-port-type="output"
                  onmousedown={(e) => handleLocalConnectionClick(e, output)}
                ></div>
              </div>
            {:else if customComponent[node.type]}
              {@const CustomComponent = customComponent[node.type]}
              <CustomComponent {node} {id} />
            {/if}
          </div>
        {/each}
        {#if nodeDetails.outputs && nodeDetails.outputs.length > (nodeDetails.inputs?.length || 0)}
          {@const nbToRemove = nodeDetails.inputs?.length || 0}
          {@const remainingOutputs = nodeDetails.outputs.slice(
            nbToRemove,
            nodeDetails.outputs.length - nbToRemove,
          )}
          {#each remainingOutputs as output, index (index)}
            <div
              class="node-socket-line"
              class:right-align={!customComponent[node.type]}
            >
              {#if customComponent[node.type]}
                {@const CustomComponent = customComponent[node.type]}
                <CustomComponent {node} {id} />
              {/if}
              <div class="node-socket">
                <span>{capitalizeFirstLetter(output.name)}</span>
                <div
                  class="socket output-socket"
                  style="background: {SocketColors[output.type]}"
                  data-node-id={id}
                  data-port-name={output.name}
                  data-port-type="output"
                  onmousedown={(e) => handleLocalConnectionClick(e, output)}
                ></div>
              </div>
            </div>
          {/each}
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
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 24px;
      box-sizing: border-box;

      .node-socket-line {
        display: flex;
        justify-content: space-between;

        &.right-align {
          justify-content: flex-end;
        }
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
