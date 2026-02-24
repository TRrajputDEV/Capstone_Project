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

  const getPos = (e, canvas) => {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: clientX - rect.left, y: clientY - rect.top };
  };

  // ── Replay all strokes ──────────────────────────────────
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
        img.onload = () => {
          ctx.drawImage(img, stroke.imgX, stroke.imgY, stroke.imgWidth, stroke.imgHeight);
        };
        img.src = stroke.imageData;
      }
    });
  }, []);

  // ── Draw a single stroke ────────────────────────────────
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
      img.onload = () => {
        ctx.drawImage(img, stroke.imgX, stroke.imgY, stroke.imgWidth, stroke.imgHeight);
      };
      img.src = stroke.imageData;
    }
  }, []);

  // ── Shape drawing helper ────────────────────────────────
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
      const cx = x1 + (x2 - x1) / 2;
      const cy = y1 + (y2 - y1) / 2;
      ctx.ellipse(cx, cy, rx, ry, 0, 0, 2 * Math.PI);
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
      ctx.lineTo(
        x2 - headLen * Math.cos(angle - Math.PI / 6),
        y2 - headLen * Math.sin(angle - Math.PI / 6)
      );
      ctx.moveTo(x2, y2);
      ctx.lineTo(
        x2 - headLen * Math.cos(angle + Math.PI / 6),
        y2 - headLen * Math.sin(angle + Math.PI / 6)
      );
      ctx.stroke();
    }
  };

  // ── Preview shape on overlay canvas ────────────────────
  const drawPreview = (x2, y2) => {
    const preview = previewCanvasRef.current;
    if (!preview) return;
    const ctx = preview.getContext("2d");
    ctx.clearRect(0, 0, preview.width, preview.height);

    drawShapeOnCtx(ctx, {
      shapeType: shapeType.current,
      x1: startPos.current.x,
      y1: startPos.current.y,
      x2, y2,
      color: color.current,
      size: size.current,
    });
  };

  // ── Main event setup ────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !socket) return;
    const ctx = canvas.getContext("2d");
    let lastCursorEmit = 0;

    const startDrawing = (e) => {
      const pos = getPos(e, canvas);
      isDrawing.current = true;
      startPos.current = pos;

      if (tool.current === "draw" || tool.current === "erase") {
        currentStroke.current = [pos];
        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y);
      } else if (tool.current === "text") {
        // Prompt for text inline
        const text = window.prompt("Enter text:");
        if (!text?.trim()) { isDrawing.current = false; return; }

        ctx.font = `${fontSize.current}px sans-serif`;
        ctx.fillStyle = color.current;
        ctx.fillText(text, pos.x, pos.y);

        const stroke = {
          type: "text",
          text,
          x: pos.x,
          y: pos.y,
          color: color.current,
          fontSize: fontSize.current,
        };
        socket.emit("draw-stroke", { roomId, stroke });
        isDrawing.current = false;
      }
    };

    const draw = (e) => {
      const pos = getPos(e, canvas);

      // Throttled cursor emit
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
        ? getPos({ clientX: e.changedTouches[0].clientX, clientY: e.changedTouches[0].clientY }, canvas)
        : getPos(e, canvas);

      if (tool.current === "draw" || tool.current === "erase") {
        if (currentStroke.current.length < 2) return;
        const stroke = {
          type: tool.current,
          points: currentStroke.current,
          color: color.current,
          size: size.current,
        };
        socket.emit("draw-stroke", { roomId, stroke });
        currentStroke.current = [];
      } else if (tool.current === "shape") {
        // Clear preview
        const preview = previewCanvasRef.current;
        if (preview) {
          const pCtx = preview.getContext("2d");
          pCtx.clearRect(0, 0, preview.width, preview.height);
        }

        const stroke = {
          type: "shape",
          shapeType: shapeType.current,
          x1: startPos.current.x,
          y1: startPos.current.y,
          x2: pos.x,
          y2: pos.y,
          color: color.current,
          size: size.current,
        };

        drawShapeOnCtx(ctx, stroke);
        socket.emit("draw-stroke", { roomId, stroke });
      }
    };

    canvas.addEventListener("mousedown", startDrawing);
    canvas.addEventListener("mousemove", draw);
    canvas.addEventListener("mouseup", stopDrawing);
    canvas.addEventListener("mouseleave", stopDrawing);
    canvas.addEventListener("touchstart", startDrawing, { passive: true });
    canvas.addEventListener("touchmove", draw, { passive: true });
    canvas.addEventListener("touchend", stopDrawing);

    return () => {
      canvas.removeEventListener("mousedown", startDrawing);
      canvas.removeEventListener("mousemove", draw);
      canvas.removeEventListener("mouseup", stopDrawing);
      canvas.removeEventListener("mouseleave", stopDrawing);
      canvas.removeEventListener("touchstart", startDrawing);
      canvas.removeEventListener("touchmove", draw);
      canvas.removeEventListener("touchend", stopDrawing);
    };
  }, [socket, roomId]);

  return {
    canvasRef,
    previewCanvasRef,
    replayStrokes,
    drawStroke,
    setTool: (t) => { tool.current = t; },
    setColor: (c) => { color.current = c; },
    setSize: (s) => { size.current = s; },
    setShapeType: (s) => { shapeType.current = s; },
    setFontSize: (s) => { fontSize.current = s; },
  };
};

export default useCanvas;