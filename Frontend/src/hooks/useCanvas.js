import { useEffect, useRef, useCallback } from "react";

const useCanvas = (socket, roomId) => {
  const canvasRef = useRef(null);
  const previewCanvasRef = useRef(null);
  const workspaceRef = useRef(null); // The single wrapper for EVERYTHING
  const gridRef = useRef(null); // The background dot grid

  const isDrawing = useRef(false);
  const currentStroke = useRef([]);
  const strokesRef = useRef([]); // Track all strokes for JSON Export
  const startPos = useRef({ x: 0, y: 0 });

  const tool = useRef("draw");
  const color = useRef("#000000");
  const size = useRef(4);
  const shapeType = useRef("rect");

  const scale = useRef(1);
  const offset = useRef({ x: 0, y: 0 });
  const isPanning = useRef(false);
  const lastPanPos = useRef({ x: 0, y: 0 });

  // ── Transform & Grid Sync ──────────────────────────────
  const applyTransform = useCallback(() => {
    if (workspaceRef.current) {
      workspaceRef.current.style.transform = `translate(${offset.current.x}px, ${offset.current.y}px) scale(${scale.current})`;
      workspaceRef.current.style.transformOrigin = "0 0";
    }
    // Makes the background dots pan and zoom infinitely!
    if (gridRef.current) {
      gridRef.current.style.backgroundPosition = `${offset.current.x}px ${offset.current.y}px`;
      gridRef.current.style.backgroundSize = `${24 * scale.current}px ${24 * scale.current}px`;
    }
  }, []);

  // ── FIXED COORDINATE MATH ──────────────────────────────
  const getPos = (e, canvas) => {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    // Because the canvas is inside the transformed workspaceRef, 
    // rect already accounts for the scale and pan! We just map the visual size.
    const x = (clientX - rect.left) * (canvas.width / rect.width);
    const y = (clientY - rect.top) * (canvas.height / rect.height);
    return { x, y };
  };

  const drawShapeOnCtx = (ctx, stroke) => {
    const { shapeType, x1, y1, x2, y2, color, size } = stroke;
    ctx.beginPath(); ctx.strokeStyle = color; ctx.lineWidth = size; ctx.lineCap = "round";
    if (shapeType === "rect") { ctx.strokeRect(x1, y1, x2 - x1, y2 - y1); } 
    else if (shapeType === "circle") {
      const rx = Math.abs(x2 - x1) / 2; const ry = Math.abs(y2 - y1) / 2;
      ctx.ellipse(x1 + (x2 - x1) / 2, y1 + (y2 - y1) / 2, rx, ry, 0, 0, 2 * Math.PI); ctx.stroke();
    } 
    else if (shapeType === "line") { ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); } 
    else if (shapeType === "arrow") {
      const headLen = 15; const angle = Math.atan2(y2 - y1, x2 - x1);
      ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
      ctx.lineTo(x2 - headLen * Math.cos(angle - Math.PI / 6), y2 - headLen * Math.sin(angle - Math.PI / 6));
      ctx.moveTo(x2, y2); ctx.lineTo(x2 - headLen * Math.cos(angle + Math.PI / 6), y2 - headLen * Math.sin(angle + Math.PI / 6));
      ctx.stroke();
    }
  };

  const drawPreview = (x2, y2) => {
    const preview = previewCanvasRef.current;
    if (!preview) return;
    const ctx = preview.getContext("2d");
    ctx.clearRect(0, 0, preview.width, preview.height);
    drawShapeOnCtx(ctx, { shapeType: shapeType.current, x1: startPos.current.x, y1: startPos.current.y, x2, y2, color: color.current, size: size.current });
  };

  const replayStrokes = useCallback((strokes) => {
    strokesRef.current = strokes; // Save for Export
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    strokes.forEach((stroke) => {
      if (stroke.type === "draw" || stroke.type === "erase") {
        if (!stroke.points || stroke.points.length < 2) return;
        ctx.beginPath(); ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
        stroke.points.forEach((p) => ctx.lineTo(p.x, p.y));
        ctx.strokeStyle = stroke.type === "erase" ? "#ffffff" : stroke.color;
        ctx.lineWidth = stroke.size; ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.stroke();
      } else if (stroke.type === "shape") {
        drawShapeOnCtx(ctx, stroke);
      }
    });
  }, []);

  const drawStroke = useCallback((stroke) => { 
    strokesRef.current.push(stroke); // Add to export list
    replayStrokes(strokesRef.current); 
  }, [replayStrokes]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !socket) return;
    const ctx = canvas.getContext("2d");
    let lastCursorEmit = 0;

    const startDrawing = (e) => {
      if (e.button === 1 || e.button === 2) return;
      if (tool.current === "text" || tool.current === "image") return;

      const pos = getPos(e, canvas);
      isDrawing.current = true;
      startPos.current = pos;

      if (tool.current === "draw" || tool.current === "erase") {
        currentStroke.current = [pos];
        ctx.beginPath(); ctx.moveTo(pos.x, pos.y);
      }
    };

    const draw = (e) => {
      if (!canvas) return;
      const pos = getPos(e, canvas);
      const now = Date.now();
      if (now - lastCursorEmit > 30) {
        socket.emit("cursor-move", { roomId, x: pos.x, y: pos.y });
        lastCursorEmit = now;
      }

      if (!isDrawing.current) return;

      if (tool.current === "draw" || tool.current === "erase") {
        currentStroke.current.push(pos);
        ctx.lineTo(pos.x, pos.y);
        ctx.strokeStyle = tool.current === "erase" ? "#ffffff" : color.current;
        ctx.lineWidth = size.current; ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.stroke();
      } else if (tool.current === "shape") {
        drawPreview(pos.x, pos.y);
      }
    };

    const stopDrawing = (e) => {
      if (!isDrawing.current) return;
      isDrawing.current = false;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const pos = getPos(e, canvas);

      let finalStroke = null;
      if (tool.current === "draw" || tool.current === "erase") {
        if (currentStroke.current.length < 2) return;
        finalStroke = { type: tool.current, points: currentStroke.current, color: color.current, size: size.current };
        currentStroke.current = [];
      } else if (tool.current === "shape") {
        const preview = previewCanvasRef.current;
        if (preview) preview.getContext("2d").clearRect(0, 0, preview.width, preview.height);
        finalStroke = { type: "shape", shapeType: shapeType.current, x1: startPos.current.x, y1: startPos.current.y, x2: pos.x, y2: pos.y, color: color.current, size: size.current };
        drawShapeOnCtx(ctx, finalStroke);
      }

      if (finalStroke) {
        strokesRef.current.push(finalStroke);
        socket.emit("draw-stroke", { roomId, stroke: finalStroke });
      }
    };

    const handlePanStart = (e) => {
      if (e.button === 1 || e.button === 2) { e.preventDefault(); isPanning.current = true; lastPanPos.current = { x: e.clientX, y: e.clientY }; }
    };
    const handlePanMove = (e) => {
      if (!isPanning.current) return;
      offset.current.x += e.clientX - lastPanPos.current.x;
      offset.current.y += e.clientY - lastPanPos.current.y;
      lastPanPos.current = { x: e.clientX, y: e.clientY };
      applyTransform();
    };
    const handlePanEnd = (e) => { if (e.button === 1 || e.button === 2) isPanning.current = false; };

    // PERFECT ZOOM MATH
    const handleWheel = (e) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      e.preventDefault();
      const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
      const newScale = Math.min(Math.max(scale.current * zoomFactor, 0.1), 8);
      
      const mouseX = e.clientX;
      const mouseY = e.clientY;
      offset.current.x = mouseX - ((mouseX - offset.current.x) / scale.current) * newScale;
      offset.current.y = mouseY - ((mouseY - offset.current.y) / scale.current) * newScale;
      scale.current = newScale;
      
      applyTransform();
    };

    canvas.addEventListener("mousedown", startDrawing);
    window.addEventListener("mousemove", draw);
    window.addEventListener("mouseup", stopDrawing);
    window.addEventListener("mousedown", handlePanStart);
    window.addEventListener("mousemove", handlePanMove);
    window.addEventListener("mouseup", handlePanEnd);
    canvas.addEventListener("wheel", handleWheel, { passive: false });
    canvas.addEventListener("contextmenu", (e) => e.preventDefault());

    return () => {
      canvas.removeEventListener("mousedown", startDrawing);
      window.removeEventListener("mousemove", draw);
      window.removeEventListener("mouseup", stopDrawing);
      window.removeEventListener("mousedown", handlePanStart);
      window.removeEventListener("mousemove", handlePanMove);
      window.removeEventListener("mouseup", handlePanEnd);
      canvas.removeEventListener("wheel", handleWheel);
    };
  }, [socket, roomId, applyTransform]);

  return {
    canvasRef, previewCanvasRef, workspaceRef, gridRef, strokesRef,
    replayStrokes, drawStroke, scale, offset,
    setTool: (t) => { tool.current = t; },
    setColor: (c) => { color.current = c; },
    setSize: (s) => { size.current = s; },
    setShapeType: (s) => { shapeType.current = s; },
    resetZoom: () => { scale.current = 1; offset.current = { x: 0, y: 0 }; applyTransform(); },
  };
};

export default useCanvas;