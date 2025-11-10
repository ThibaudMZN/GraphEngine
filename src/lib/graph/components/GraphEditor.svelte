<script lang="ts">
  import {
    type Connection,
    copySelectedNodes,
    graphStore,
    type NodeId,
    type NodeInstance,
    pasteNodes,
    type Vector2,
  } from "../GraphStore";
  import NodeComponent from "./NodeComponent.svelte";
  import ConnectionLine from "./ConnectionLine.svelte";
  import { type NodeType, SocketColors, type SocketType } from "../Nodes";
  import PanelTitlebar from "../../components/PanelTitlebar.svelte";
  import IconButton from "../../components/IconButton.svelte";
  import { isInside, normalizeRect, type Rect } from "../Geometry";
  import ShortcutMenu from "./ShortcutMenu.svelte";

  const MIN_ZOOM = 0.25;
  const MAX_ZOOM = 2;
  const ZOOM_FACTOR = 1.05;

  let selectedNodeId: NodeId | undefined = $state();
  let selectedNodeOffset: Vector2 | undefined = $state();
  let svgElement: SVGSVGElement | undefined = $state();
  let marquee: Rect | undefined = $state();
  let normalizedMarquee = $derived(
    marquee ? normalizeRect(marquee) : undefined,
  );
  let showShortcutMenu: boolean = $state(false);

  type ConnectionDetails = {
    startPosition: Vector2;
    endPosition: Vector2;
    connectionType: SocketType;
    connectionName: string;
    connectionDirection: "input" | "output";
    id: NodeId;
  };
  let selectedConnection: ConnectionDetails | undefined = $state();

  let isDraggingNewNode: boolean = $state(false);
  let zoom: number = $state(1);
  let pan: Vector2 = $state({ x: 0, y: 0 });
  let isPanning: boolean = $state(false);
  let lastMouse: Vector2 = $state({ x: 0, y: 0 });
  let clipboard:
    | { nodes: Record<NodeId, NodeInstance>; connections: Connection[] }
    | undefined = $state();
  let isPressingCtrl: boolean = $state(false);
  let currentMouse: Vector2 = $state({ x: 0, y: 0 });
  let currentDOMMouse: Vector2 = $state({ x: 0, y: 0 });
  let shortcutMenuPosition: Vector2 = $state({ x: 0, y: 0 });

  $effect(() => {
    zoom;
    pan.x;
    pan.y;
    localStorage.setItem("user-settings", JSON.stringify({ zoom, pan }));
  });

  const settingsStr = localStorage.getItem("user-settings");
  if (settingsStr) {
    const settings = JSON.parse(settingsStr);
    zoom = settings.zoom;
    pan = settings.pan;
  }

  const svgProjection = (x: number, y: number): Vector2 => {
    if (!svgElement) return { x: 0, y: 0 };
    const pt = svgElement.createSVGPoint();
    pt.x = x;
    pt.y = y;

    const svgCTM = svgElement.getScreenCTM()?.inverse();
    if (!svgCTM) return { x: 0, y: 0 };
    const svgPoint = pt.matrixTransform(svgCTM);

    const graphX = (svgPoint.x - pan.x) / zoom;
    const graphY = (svgPoint.y - pan.y) / zoom;

    return { x: graphX, y: graphY };
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

  const handleMouseUp = async (e: MouseEvent) => {
    if (selectedConnection) {
      const elements = document.elementsFromPoint(e.clientX, e.clientY);
      const ports = elements.filter((el) => el.classList.contains("socket"));
      if (ports[0]) {
        const target = ports[0] as HTMLElement;
        const targetId = target.dataset.nodeId;
        const { portName, portType, portDirection } = target.dataset;
        if (targetId && portName && portType && portDirection) {
          const isSameType = selectedConnection.connectionType === portType;
          const isInOut =
            selectedConnection.connectionDirection !== portDirection;
          const isInputWithConnection =
            portDirection === "input" &&
            $graphStore.connections.find(
              (c) => c.to.id === targetId && c.to.name === portName,
            );
          if (isSameType && isInOut && !isInputWithConnection) {
            const a = {
              id: selectedConnection.id,
              name: selectedConnection.connectionName,
            };
            const b = { id: targetId, name: portName };
            const from =
              selectedConnection.connectionDirection === "output" ? a : b;
            const to =
              selectedConnection.connectionDirection === "output" ? b : a;

            const noConnectionFrom =
              $graphStore.connections.find(
                (c) => c.from.id === from.id && c.from.name === from.name,
              ) === undefined;
            const noConnectionTo =
              $graphStore.connections.find(
                (c) => c.to.id === to.id && c.to.name === to.name,
              ) === undefined;
            const canConnect =
              portType === "flow" ? noConnectionFrom && noConnectionTo : true;

            if (canConnect)
              await graphStore.addConnection(
                from,
                to,
                selectedConnection.connectionType,
              );
          }
        }
      }
    }

    if (normalizedMarquee) {
      const selected = Object.entries($graphStore.nodes)
        .filter(([_id, node]) => isInside(node.position, normalizedMarquee))
        .map(([id]) => id);
      graphStore.selectNodes(selected);
    }

    selectedNodeId = undefined;
    selectedNodeOffset = undefined;
    selectedConnection = undefined;
    isDraggingNewNode = false;
    isPanning = false;
    marquee = undefined;
  };

  const gridSize = 20;
  const snapToGrid = (value: number) => Math.round(value / gridSize) * gridSize;

  const handleMouseMove = (e: MouseEvent) => {
    currentMouse = svgProjection(e.clientX, e.clientY);
    currentDOMMouse = { x: e.clientX, y: e.clientY };
    if (isPanning) {
      const dx = e.clientX - lastMouse.x;
      const dy = e.clientY - lastMouse.y;

      pan.x += dx;
      pan.y += dy;

      lastMouse = { x: e.clientX, y: e.clientY };
      return;
    } else if (selectedNodeId && selectedNodeOffset) {
      let { x, y } = svgProjection(e.clientX, e.clientY);
      x -= selectedNodeOffset.x;
      y -= selectedNodeOffset.y;
      const currentPosition = $graphStore.nodes[selectedNodeId].position;
      const delta = { x: currentPosition.x - x, y: currentPosition.y - y };
      if (isPressingCtrl) {
        x = snapToGrid(x);
        y = snapToGrid(y);
        delta.x = snapToGrid(delta.x);
        delta.y = snapToGrid(delta.y);
      }
      graphStore.setNodePosition(selectedNodeId, { x, y });
      if ($graphStore.selectedNodes.size > 0) {
        for (const id of [...$graphStore.selectedNodes]) {
          if (id === selectedNodeId) continue;
          const currentPos = $graphStore.nodes[id]?.position;
          if (currentPos)
            graphStore.setNodePosition(id, {
              x: currentPos.x - delta.x,
              y: currentPos.y - delta.y,
            });
        }
      }
    } else if (selectedConnection) {
      selectedConnection.endPosition = svgProjection(e.clientX, e.clientY);
    } else if (marquee) {
      const { x, y } = svgProjection(e.clientX, e.clientY);
      marquee.w = x - marquee.x;
      marquee.h = y - marquee.y;
    }
  };

  const handleConnectionClick = (
    initialPosition: Vector2,
    id: NodeId,
    connectionType: SocketType,
    connectionName: string,
    connectionDirection: "input" | "output",
  ) => {
    const p = svgProjection(initialPosition.x, initialPosition.y);
    selectedConnection = {
      startPosition: p,
      endPosition: p,
      connectionType,
      connectionName,
      connectionDirection,
      id,
    };
  };

  const handleDragover = async (e: DragEvent) => {
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
        selectedNodeId = await graphStore.addNode(
          nodeType as NodeType,
          position,
        );
        selectedNodeOffset = { x: 0, y: 0 };
      }
    }
  };

  export const triggerDragEnd = (e: MouseEvent) => handleMouseUp(e);

  const applyZoom = (direction: 1 | -1) => {
    const scale = direction > 0 ? ZOOM_FACTOR : 1 / ZOOM_FACTOR;
    zoom *= scale;
    zoom = Math.min(Math.max(zoom, MIN_ZOOM), MAX_ZOOM);
    return scale;
  };

  const handleMouseWheel = (e: WheelEvent) => {
    if (!svgElement) return;
    e.preventDefault();
    const direction = e.deltaY < 0 ? 1 : -1;
    if (
      (zoom === MIN_ZOOM && direction === -1) ||
      (zoom === MAX_ZOOM && direction === 1)
    )
      return;
    const scale = applyZoom(direction);

    const pt = svgElement.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;

    const svgCTM = svgElement.getScreenCTM()?.inverse();
    if (!svgCTM) return { x: 0, y: 0 };
    const cursor = pt.matrixTransform(svgCTM);

    pan.x = cursor.x - scale * (cursor.x - pan.x);
    pan.y = cursor.y - scale * (cursor.y - pan.y);
  };

  const handleLocalMouseDown = (e: MouseEvent) => {
    if (e.button === 1 || e.shiftKey) {
      // middle click or shift + drag
      isPanning = true;
      lastMouse = { x: e.clientX, y: e.clientY };
    } else if (e.button === 0) {
      const elements = document.elementsFromPoint(e.clientX, e.clientY);
      if (elements.length && elements[0].id === "graph-background") {
        const { x, y } = svgProjection(e.clientX, e.clientY);
        marquee = { x, y, w: 0, h: 0 };
      }
    }
  };

  const handleKeyDown = async (e: KeyboardEvent) => {
    if (e.ctrlKey) isPressingCtrl = true;
    if (e.key.toLowerCase() === "a" && e.ctrlKey) graphStore.selectAll();
    if (e.key === "Delete") await graphStore.deleteSelectedNodes();
    if (e.ctrlKey || e.metaKey) {
      if (e.key.toLowerCase() === "c") {
        clipboard = copySelectedNodes();
        e.preventDefault();
      }
      if (e.key.toLowerCase() === "v") {
        if (clipboard) {
          await pasteNodes(clipboard, currentMouse);
          e.preventDefault();
        }
      }
      if (e.code === "Space") {
        shortcutMenuPosition = { x: currentDOMMouse.x, y: currentDOMMouse.y };
        showShortcutMenu = true;
      }
    }
  };

  const handleKeyUp = async (e: KeyboardEvent) => {
    if (e.key === "Control") isPressingCtrl = false;
  };
</script>

<svelte:window
  onmouseup={handleMouseUp}
  onmousemove={handleMouseMove}
  onkeydown={handleKeyDown}
  onkeyup={handleKeyUp}
/>
<div class="graph-container">
  <PanelTitlebar title="Graph Editor">
    <IconButton
      iconName="zoom-out-line"
      label="Zoom out"
      onclick={() => applyZoom(-1)}
    />
    <span class="alt-text">{Math.floor(zoom * 100)}%</span>
    <IconButton
      iconName="zoom-in-line"
      label="Zoom in"
      onclick={() => applyZoom(1)}
    />
    <IconButton
      iconName="fullscreen-line"
      label="Reset zoom"
      onclick={() => {
        zoom = 1;
        pan.x = 0;
        pan.y = 0;
      }}
    />
  </PanelTitlebar>
  <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="800"
    height="800"
    role="graphics-document"
    bind:this={svgElement}
    ondragover={handleDragover}
    onwheel={handleMouseWheel}
    onmousedown={handleLocalMouseDown}
    class:is-panning={isPanning}
  >
    <defs>
      <pattern
        id="grid"
        width={20 * zoom}
        height={20 * zoom}
        patternUnits="userSpaceOnUse"
      >
        <circle cx={zoom} cy={zoom} r={zoom} fill="#374151" />
      </pattern>
    </defs>
    <rect
      width="100%"
      height="100%"
      fill="url(#grid)"
      transform={`translate(${pan.x % (20 * zoom)}, ${pan.y % (20 * zoom)})`}
      id="graph-background"
    />
    <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
      {#each Object.entries($graphStore.nodes) as [id, node] (id)}
        <NodeComponent {node} {id} {handleMouseDown} {handleConnectionClick} />
      {/each}
      {#each $graphStore.connections as connection (`${connection.from.id}-${connection.to.id}-${connection.from.name}-${connection.to.name}`)}
        <ConnectionLine {connection} />
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
      {#if normalizedMarquee}
        <rect
          x={normalizedMarquee.x}
          y={normalizedMarquee.y}
          width={normalizedMarquee.w}
          height={normalizedMarquee.h}
          stroke="#374151"
          stroke-width="2"
          rx="8"
          ry="8"
          fill="#37415122"
        />
      {/if}
    </g>
  </svg>
  {#if showShortcutMenu}
    <ShortcutMenu
      position={shortcutMenuPosition}
      closeMenu={() => (showShortcutMenu = false)}
      {svgProjection}
    />
  {/if}
  <div class="graph-infos">
    <span>Nodes: {Object.keys($graphStore.nodes).length}</span>
    <span>Connections: {$graphStore.connections.length}</span>
  </div>
</div>

<style lang="scss">
  .graph-container {
    display: flex;
    flex-direction: column;
    border-right: 1px solid var(--border);
    position: relative;

    span {
      font-size: 12px;
      line-height: 16px;
    }

    .graph-infos {
      position: absolute;
      bottom: 16px;
      right: 16px;
      border: 1px solid var(--border);
      border-radius: 8px;
      font-size: 14px;
      line-height: 20px;
      color: var(--alt-text);
      padding: 9px 13px;
      background: var(--background);
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
  }

  svg {
    box-sizing: border-box;
    height: 100%;
    width: 100%;
    background: #111827;
  }

  svg.is-panning {
    cursor: grab;
  }
</style>
