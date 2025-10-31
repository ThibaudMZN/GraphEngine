<script lang="ts">
  import { graphStore, type NodeId, type Vector2 } from "../GraphStore";
  import NodeComponent from "./NodeComponent.svelte";
  import ConnectionLine from "./ConnectionLine.svelte";
  import { SocketColors, type SocketType } from "../Nodes";

  let selectedNodeId: NodeId | undefined = $state();
  let selectedNodeOffset: Vector2 | undefined = $state();
  let svgElement: SVGSVGElement | undefined = $state();

  type ConnectionDetails = {
    startPosition: Vector2;
    endPosition: Vector2;
    connectionType: SocketType;
    connectionName: string;
    id: NodeId;
  };
  let selectedConnection: ConnectionDetails | undefined = $state();

  let isDraggingNewNode: boolean = $state(false);

  const svgProjection = (x: number, y: number): Vector2 => {
    if (!svgElement) return { x: 0, y: 0 };
    const pt = svgElement.createSVGPoint();
    pt.x = x;
    pt.y = y;
    const svgCoords = pt.matrixTransform(svgElement.getScreenCTM()?.inverse());
    return { x: svgCoords.x, y: svgCoords.y };
  };

  const handleMouseDown = (
    selectedNode: NodeId,
    details: { mousePosition: Vector2; nodePosition: Vector2 },
  ) => {
    selectedNodeId = selectedNode;
    const mouseProjection = svgProjection(
      details.mousePosition.x,
      details.mousePosition.y,
    );
    const dx = mouseProjection.x - details.nodePosition.x;
    const dy = mouseProjection.y - details.nodePosition.y;
    selectedNodeOffset = { x: dx, y: dy };
  };

  const handleMouseUp = (e: MouseEvent) => {
    if (selectedConnection) {
      const elements = document.elementsFromPoint(e.clientX, e.clientY);
      const ports = elements.filter((el) => el.classList.contains("port"));
      if (ports[0]) {
        //TODO: We should check if port types match and also make sure we only do In/Out Connection
        //TODO: We should always create connection with From(Output)-To(Input)
        //TODO: We should prevent connection if port is already connected (Single connection for now)

        const target = ports[0] as HTMLElement;
        const targetId = target.dataset.nodeId;
        const targetName = target.dataset.portName;
        if (targetId && targetName)
          graphStore.addConnection(
            {
              id: selectedConnection.id,
              name: selectedConnection.connectionName,
            },
            { id: targetId, name: targetName },
            selectedConnection.connectionType,
          );
      }
    }

    selectedNodeId = undefined;
    selectedNodeOffset = undefined;
    selectedConnection = undefined;
    isDraggingNewNode = false;
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (selectedNodeId && selectedNodeOffset) {
      const { x, y } = svgProjection(
        e.clientX - selectedNodeOffset.x,
        e.clientY - selectedNodeOffset.y,
      );
      graphStore.setNodePosition(selectedNodeId, { x, y });
    }
    if (selectedConnection) {
      selectedConnection.endPosition = svgProjection(e.clientX, e.clientY);
    }
  };

  const handleConnectionClick = (
    initialPosition: Vector2,
    id: NodeId,
    connectionType: SocketType,
    connectionName: string,
  ) => {
    selectedConnection = {
      startPosition: initialPosition,
      endPosition: initialPosition,
      connectionType,
      connectionName,
      id,
    };
  };

  const handleDragover = (e: DragEvent) => {
    const nodeType = e.dataTransfer?.getData("application/node-type");
    if (nodeType) {
      if (isDraggingNewNode) {
        handleMouseMove(e);
      } else {
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer!.dropEffect = "move";

        document.dispatchEvent(new DragEvent("dragend"));
        isDraggingNewNode = true;

        const position = svgProjection(e.clientX, e.clientY);
        selectedNodeId = graphStore.addNode(nodeType, position);
        selectedNodeOffset = { x: 0, y: 0 };
      }
    }
  };

  export const triggerDragEnd = (e: MouseEvent) => handleMouseUp(e);
</script>

<svelte:window onmouseup={handleMouseUp} onmousemove={handleMouseMove} />
<svg
  xmlns="http://www.w3.org/2000/svg"
  width="800"
  height="800"
  role="graphics-document"
  bind:this={svgElement}
  ondragover={handleDragover}
>
  {#each $graphStore.connections as connection (`${connection.from.id}-${connection.to.id}-${connection.from.name}-${connection.to.name}`)}
    <ConnectionLine {connection} />
  {/each}
  {#each Object.entries($graphStore.nodes) as [id, node] (id)}
    <NodeComponent {node} {id} {handleMouseDown} {handleConnectionClick} />
  {/each}
  {#if selectedConnection}
    {@const x1 = selectedConnection.startPosition.x}
    {@const y1 = selectedConnection.startPosition.y}
    {@const x2 = selectedConnection.endPosition.x}
    {@const y2 = selectedConnection.endPosition.y}
    {@const dx = Math.abs(x2 - x1) * 0.5}
    {@const multiplier = x1 < x2 ? 1 : -1}
    {@const cx1 = x1 + multiplier * dx}
    {@const cy1 = y1}
    {@const cx2 = x2 - multiplier * dx}
    {@const cy2 = y2}
    {@const path = `M ${x1} ${y1} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${x2} ${y2}`}
    <path
      d={path}
      fill="none"
      stroke={SocketColors[selectedConnection.connectionType]}
      stroke-width="2"
      stroke-linecap="round"
    />
  {/if}
</svg>

<style>
  svg {
    border: 1px solid white;
  }
</style>
