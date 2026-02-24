import { useEffect, useRef, useCallback } from "react";

const useCanvas = (socket, roomId) => {
  const canvasRef = useRef(null);
  const previewCanvasRef = useRef(null);
  const isDrawing = useRef(false);
  const currentStroke = useRef([]);
  const startPos = useRef({ x: 0, y: 0 });

  const tool = useRef("draw");
  const color = useRef("#000000");
  const size = useRef(4);
  const shapeType = useRef("rect");

  const scale = useRef(1);
  const offset = useRef({ x: 0, y: 0 });
  const isPanning = useRef(false);
  const lastPanPos = useRef({ x: 0, y: 0 });

  // ── Transform ──────────────────────────────────────────
  const applyTransform = useCallback(() => {
    const canvas = canvasRef.current;
    const preview = previewCanvasRef.current;
    if (!canvas) return;
    // Use CSS transform — canvas coordinate space stays unchanged
    // Drawing positions are already in canvas-space (pre-transform)
    const transform = `translate(${offset.current.x}px, ${offset.current.y}px) scale(${scale.current})`;
    canvas.style.transform = transform;
    canvas.style.transformOrigin = "0 0";
    if (preview) {
      preview.style.transform = transform;
      preview.style.transformOrigin = "0 0";
    }
  }, []);

  // Convert screen pos → canvas coordinate space
  const screenToCanvas = (clientX, clientY, canvas) => {
    const rect = canvas.getBoundingClientRect();
    // rect already reflects the CSS transform
    const x = (clientX - rect.left) / scale.current;
    const y = (clientY - rect.top) / scale.current;
    return { x, y };
  };

  const getPos = (e, canvas) => {
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return screenToCanvas(clientX, clientY, canvas);
  };

  // ── Shape helpers ──────────────────────────────────────
  const drawShapeOnCtx = (ctx, stroke) => {
    const { shapeType, x1, y1, x2, y2, color, size } = stroke;
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = size;
    ctx.lineCap = "round";

    if (shapeType === "rect") {
      ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);
    } else if (shapeType === "circle") {
      const rx = Math.abs(x2 - x1) / 2;
      const ry = Math.abs(y2 - y1) / 2;
      ctx.ellipse(x1 + (x2 - x1) / 2, y1 + (y2 - y1) / 2, rx, ry, 0, 0, 2 * Math.PI);
      ctx.stroke();
    } else if (shapeType === "line") {
      ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    } else if (shapeType === "arrow") {
      const headLen = 15;
      const angle = Math.atan2(y2 - y1, x2 - x1);
      ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
      ctx.lineTo(x2 - headLen * Math.cos(angle - Math.PI / 6), y2 - headLen * Math.sin(angle - Math.PI / 6));
      ctx.moveTo(x2, y2);
      ctx.lineTo(x2 - headLen * Math.cos(angle + Math.PI / 6), y2 - headLen * Math.sin(angle + Math.PI / 6));
      ctx.stroke();
    }
  };

  const drawPreview = (x2, y2) => {
    const preview = previewCanvasRef.current;
    if (!preview) return;
    const ctx = preview.getContext("2d");
    ctx.clearRect(0, 0, preview.width, preview.height);
    drawShapeOnCtx(ctx, {
      shapeType: shapeType.current,
      x1: startPos.current.x, y1: startPos.current.y,
      x2, y2,
      color: color.current, size: size.current,
    });
  };

  // ── Replay all strokes (used on room-state + undo) ─────
  const replayStrokes = useCallback((strokes) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    strokes.forEach((stroke) => {
      if (stroke.type === "draw" || stroke.type === "erase") {
        if (!stroke.points || stroke.points.length < 2) return;
        ctx.beginPath();
        ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
        stroke.points.forEach((p) => ctx.lineTo(p.x, p.y));
        ctx.strokeStyle = stroke.type === "erase" ? "#ffffff" : stroke.color;
        ctx.lineWidth = stroke.size;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.stroke();
      } else if (stroke.type === "shape") {
        drawShapeOnCtx(ctx, stroke);
      }
    });
  }, []);

  // ── Draw a single incoming stroke (from another user) ──
  // FIXED: does NOT clear canvas — appends only
  const drawStroke = useCallback((stroke) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    if (stroke.type === "draw" || stroke.type === "erase") {
      if (!stroke.points || stroke.points.length < 2) return;
      ctx.beginPath();
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      stroke.points.forEach((p) => ctx.lineTo(p.x, p.y));
      ctx.strokeStyle = stroke.type === "erase" ? "#ffffff" : stroke.color;
      ctx.lineWidth = stroke.size;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.stroke();
    } else if (stroke.type === "shape") {
      drawShapeOnCtx(ctx, stroke);
    }
  }, []);

  // ── Thumbnail ──────────────────────────────────────────
  const generateThumbnail = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const thumb = document.createElement("canvas");
    thumb.width = 400; thumb.height = 225;
    const ctx = thumb.getContext("2d");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, 400, 225);
    ctx.drawImage(canvas, 0, 0, canvas.width, canvas.height, 0, 0, 400, 225);
    return thumb.toDataURL("image/jpeg", 0.6);
  }, []);

  // ── Main effect ────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !socket) return;
    const ctx = canvas.getContext("2d");
    let lastCursorEmit = 0;
    let thumbnailTimer = null;

    const scheduleThumbnail = () => {
      clearTimeout(thumbnailTimer);
      thumbnailTimer = setTimeout(() => {
        const thumb = generateThumbnail();
        if (thumb) socket.emit("save-thumbnail", { roomId, thumbnail: thumb });
      }, 3000);
    };

    const startDrawing = (e) => {
      if (e.button === 1 || e.button === 2) return;
      if (tool.current === "text") return;

      const pos = getPos(e, canvas);
      isDrawing.current = true;
      startPos.current = pos;

      if (tool.current === "draw" || tool.current === "erase") {
        currentStroke.current = [pos];
        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y);
      }
    };

    const draw = (e) => {
      const canvas = canvasRef.current;
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
        ctx.lineWidth = size.current;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.stroke();
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

      if (tool.current === "draw" || tool.current === "erase") {
        if (currentStroke.current.length < 2) return;
        socket.emit("draw-stroke", {
          roomId,
          stroke: { type: tool.current, points: currentStroke.current, color: color.current, size: size.current },
        });
        currentStroke.current = [];
        scheduleThumbnail();
      } else if (tool.current === "shape") {
        const preview = previewCanvasRef.current;
        if (preview) preview.getContext("2d").clearRect(0, 0, preview.width, preview.height);
        const stroke = {
          type: "shape", shapeType: shapeType.current,
          x1: startPos.current.x, y1: startPos.current.y,
          x2: pos.x, y2: pos.y,
          color: color.current, size: size.current,
        };
        drawShapeOnCtx(ctx, stroke);
        socket.emit("draw-stroke", { roomId, stroke });
        scheduleThumbnail();
      }
    };

    // Middle/right mouse → pan
    const handlePanStart = (e) => {
      if (e.button === 1 || e.button === 2) {
        e.preventDefault();
        isPanning.current = true;
        lastPanPos.current = { x: e.clientX, y: e.clientY };
      }
    };
    const handlePanMove = (e) => {
      if (!isPanning.current) return;
      offset.current.x += e.clientX - lastPanPos.current.x;
      offset.current.y += e.clientY - lastPanPos.current.y;
      lastPanPos.current = { x: e.clientX, y: e.clientY };
      applyTransform();
    };
    const handlePanEnd = (e) => {
      if (e.button === 1 || e.button === 2) isPanning.current = false;
    };

    // Ctrl+Scroll → zoom centered on cursor
    const handleWheel = (e) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      e.preventDefault();

      const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
      const newScale = Math.min(Math.max(scale.current * zoomFactor, 0.1), 8);

      // Zoom toward mouse position in screen space
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left - offset.current.x;
      const mouseY = e.clientY - rect.top - offset.current.y;

      offset.current.x -= mouseX * (newScale / scale.current - 1);
      offset.current.y -= mouseY * (newScale / scale.current - 1);
      scale.current = newScale;
      applyTransform();
    };

    // Pinch zoom
    let lastPinchDist = null;
    const handleTouchStart = (e) => {
      if (e.touches.length === 2) {
        lastPinchDist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
      } else {
        startDrawing(e);
      }
    };
    const handleTouchMove = (e) => {
      if (e.touches.length === 2 && lastPinchDist !== null) {
        const dist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        const delta = dist / lastPinchDist;
        scale.current = Math.min(Math.max(scale.current * delta, 0.1), 8);
        lastPinchDist = dist;
        applyTransform();
      } else {
        draw(e);
      }
    };
    const handleTouchEnd = (e) => {
      lastPinchDist = null;
      stopDrawing(e);
    };

    canvas.addEventListener("mousedown", startDrawing);
    window.addEventListener("mousemove", draw);
    window.addEventListener("mouseup", stopDrawing);
    window.addEventListener("mousedown", handlePanStart);
    window.addEventListener("mousemove", handlePanMove);
    window.addEventListener("mouseup", handlePanEnd);
    canvas.addEventListener("wheel", handleWheel, { passive: false });
    canvas.addEventListener("touchstart", handleTouchStart, { passive: true });
    canvas.addEventListener("touchmove", handleTouchMove, { passive: true });
    canvas.addEventListener("touchend", handleTouchEnd);
    canvas.addEventListener("contextmenu", (e) => e.preventDefault());

    return () => {
      canvas.removeEventListener("mousedown", startDrawing);
      window.removeEventListener("mousemove", draw);
      window.removeEventListener("mouseup", stopDrawing);
      window.removeEventListener("mousedown", handlePanStart);
      window.removeEventListener("mousemove", handlePanMove);
      window.removeEventListener("mouseup", handlePanEnd);
      canvas.removeEventListener("wheel", handleWheel);
      canvas.removeEventListener("touchstart", handleTouchStart);
      canvas.removeEventListener("touchmove", handleTouchMove);
      canvas.removeEventListener("touchend", handleTouchEnd);
      clearTimeout(thumbnailTimer);
    };
  }, [socket, roomId, applyTransform, generateThumbnail]);

  return {
    canvasRef, previewCanvasRef,
    replayStrokes, drawStroke, generateThumbnail,
    scale, offset,
    setTool: (t) => { tool.current = t; },
    setColor: (c) => { color.current = c; },
    setSize: (s) => { size.current = s; },
    setShapeType: (s) => { shapeType.current = s; },
    resetZoom: () => {
      scale.current = 1;
      offset.current = { x: 0, y: 0 };
      applyTransform();
    },
  };
};

export default useCanvas;