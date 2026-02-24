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
  const fontSize = useRef(20);

  // Zoom/Pan state
  const scale = useRef(1);
  const offset = useRef({ x: 0, y: 0 });
  const isPanning = useRef(false);
  const lastPanPos = useRef({ x: 0, y: 0 });
  const lastTouches = useRef([]);

  const getTransformedPos = (e, canvas) => {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: (clientX - rect.left - offset.current.x) / scale.current,
      y: (clientY - rect.top - offset.current.y) / scale.current,
    };
  };

  const applyTransform = useCallback(() => {
    const canvas = canvasRef.current;
    const preview = previewCanvasRef.current;
    if (!canvas) return;
    const transform = `scale(${scale.current}) translate(${offset.current.x / scale.current}px, ${offset.current.y / scale.current}px)`;
    canvas.style.transform = transform;
    canvas.style.transformOrigin = "0 0";
    if (preview) {
      preview.style.transform = transform;
      preview.style.transformOrigin = "0 0";
    }
  }, []);

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
      } else if (stroke.type === "text") {
        ctx.font = `${stroke.fontSize || 20}px sans-serif`;
        ctx.fillStyle = stroke.color;
        ctx.fillText(stroke.text, stroke.x, stroke.y);
      } else if (stroke.type === "image") {
        const img = new Image();
        img.onload = () => ctx.drawImage(img, stroke.imgX, stroke.imgY, stroke.imgWidth, stroke.imgHeight);
        img.src = stroke.imageData;
      }
    });
  }, []);

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
    } else if (stroke.type === "text") {
      ctx.font = `${stroke.fontSize || 20}px sans-serif`;
      ctx.fillStyle = stroke.color;
      ctx.fillText(stroke.text, stroke.x, stroke.y);
    } else if (stroke.type === "image") {
      const img = new Image();
      img.onload = () => ctx.drawImage(img, stroke.imgX, stroke.imgY, stroke.imgWidth, stroke.imgHeight);
      img.src = stroke.imageData;
    }
  }, []);

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
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    } else if (shapeType === "arrow") {
      const headLen = 15;
      const angle = Math.atan2(y2 - y1, x2 - x1);
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
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

  // Thumbnail generator
  const generateThumbnail = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const thumb = document.createElement("canvas");
    thumb.width = 400;
    thumb.height = 225;
    const ctx = thumb.getContext("2d");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, 400, 225);
    ctx.drawImage(canvas, 0, 0, canvas.width, canvas.height, 0, 0, 400, 225);
    return thumb.toDataURL("image/jpeg", 0.6);
  }, []);

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
      if (e.button === 1) return; // Middle mouse handled separately
      const pos = getTransformedPos(e, canvas);
      isDrawing.current = true;
      startPos.current = pos;

      if (tool.current === "draw" || tool.current === "erase") {
        currentStroke.current = [pos];
        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y);
      } else if (tool.current === "text") {
        const text = window.prompt("Enter text:");
        if (!text?.trim()) { isDrawing.current = false; return; }
        ctx.font = `${fontSize.current}px sans-serif`;
        ctx.fillStyle = color.current;
        ctx.fillText(text, pos.x, pos.y);
        socket.emit("draw-stroke", { roomId, stroke: { type: "text", text, x: pos.x, y: pos.y, color: color.current, fontSize: fontSize.current } });
        scheduleThumbnail();
        isDrawing.current = false;
      }
    };

    const draw = (e) => {
      const pos = getTransformedPos(e, canvas);
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
      const pos = e.changedTouches
        ? getTransformedPos({ clientX: e.changedTouches[0].clientX, clientY: e.changedTouches[0].clientY }, canvas)
        : getTransformedPos(e, canvas);

      if (tool.current === "draw" || tool.current === "erase") {
        if (currentStroke.current.length < 2) return;
        const stroke = { type: tool.current, points: currentStroke.current, color: color.current, size: size.current };
        socket.emit("draw-stroke", { roomId, stroke });
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

    // Middle mouse pan
    const handleMouseDown = (e) => {
      if (e.button === 1) {
        e.preventDefault();
        isPanning.current = true;
        lastPanPos.current = { x: e.clientX, y: e.clientY };
      }
    };

    const handleMouseMove = (e) => {
      if (isPanning.current) {
        const dx = e.clientX - lastPanPos.current.x;
        const dy = e.clientY - lastPanPos.current.y;
        offset.current.x += dx;
        offset.current.y += dy;
        lastPanPos.current = { x: e.clientX, y: e.clientY };
        applyTransform();
      }
    };

    const handleMouseUp = (e) => {
      if (e.button === 1) isPanning.current = false;
    };

    // Ctrl+Scroll zoom
    const handleWheel = (e) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        const newScale = Math.min(Math.max(scale.current * delta, 0.2), 5);
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        offset.current.x = mouseX - (mouseX - offset.current.x) * (newScale / scale.current);
        offset.current.y = mouseY - (mouseY - offset.current.y) * (newScale / scale.current);
        scale.current = newScale;
        applyTransform();
      }
    };

    // Pinch zoom
    const handleTouchStart = (e) => {
      if (e.touches.length === 2) {
        lastTouches.current = Array.from(e.touches);
      } else {
        startDrawing(e);
      }
    };

    const handleTouchMove = (e) => {
      if (e.touches.length === 2 && lastTouches.current.length === 2) {
        const prevDist = Math.hypot(
          lastTouches.current[0].clientX - lastTouches.current[1].clientX,
          lastTouches.current[0].clientY - lastTouches.current[1].clientY
        );
        const newDist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        const delta = newDist / prevDist;
        scale.current = Math.min(Math.max(scale.current * delta, 0.2), 5);
        lastTouches.current = Array.from(e.touches);
        applyTransform();
      } else {
        draw(e);
      }
    };

    canvas.addEventListener("mousedown", startDrawing);
    canvas.addEventListener("mousemove", draw);
    canvas.addEventListener("mouseup", stopDrawing);
    canvas.addEventListener("mouseleave", stopDrawing);
    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    canvas.addEventListener("wheel", handleWheel, { passive: false });
    canvas.addEventListener("touchstart", handleTouchStart, { passive: true });
    canvas.addEventListener("touchmove", handleTouchMove, { passive: true });
    canvas.addEventListener("touchend", stopDrawing);

    return () => {
      canvas.removeEventListener("mousedown", startDrawing);
      canvas.removeEventListener("mousemove", draw);
      canvas.removeEventListener("mouseup", stopDrawing);
      canvas.removeEventListener("mouseleave", stopDrawing);
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      canvas.removeEventListener("wheel", handleWheel);
      canvas.removeEventListener("touchstart", handleTouchStart);
      canvas.removeEventListener("touchmove", handleTouchMove);
      canvas.removeEventListener("touchend", stopDrawing);
      clearTimeout(thumbnailTimer);
    };
  }, [socket, roomId, applyTransform, generateThumbnail]);

  return {
    canvasRef,
    previewCanvasRef,
    replayStrokes,
    drawStroke,
    generateThumbnail,
    setTool: (t) => { tool.current = t; },
    setColor: (c) => { color.current = c; },
    setSize: (s) => { size.current = s; },
    setShapeType: (s) => { shapeType.current = s; },
    setFontSize: (s) => { fontSize.current = s; },
    resetZoom: () => {
      scale.current = 1;
      offset.current = { x: 0, y: 0 };
      applyTransform();
    },
  };
};

export default useCanvas;