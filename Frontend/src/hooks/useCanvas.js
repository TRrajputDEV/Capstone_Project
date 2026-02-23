import { useEffect, useRef, useCallback } from "react";

const useCanvas = (socket, roomId) => {
  const canvasRef = useRef(null);
  const isDrawing = useRef(false);
  const currentStroke = useRef([]);
  const tool = useRef("draw");
  const color = useRef("#000000");
  const size = useRef(4);

  const getPos = (e, canvas) => {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };

  const replayStrokes = useCallback((strokes) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    strokes.forEach((stroke) => {
      if (!stroke.points || stroke.points.length < 2) return;
      ctx.beginPath();
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      stroke.points.forEach((p) => ctx.lineTo(p.x, p.y));
      ctx.strokeStyle = stroke.type === "erase" ? "#ffffff" : stroke.color;
      ctx.lineWidth = stroke.size;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.stroke();
    });
  }, []);

  const drawStroke = useCallback((stroke) => {
    const canvas = canvasRef.current;
    if (!canvas || !stroke.points || stroke.points.length < 2) return;
    const ctx = canvas.getContext("2d");
    ctx.beginPath();
    ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
    stroke.points.forEach((p) => ctx.lineTo(p.x, p.y));
    ctx.strokeStyle = stroke.type === "erase" ? "#ffffff" : stroke.color;
    ctx.lineWidth = stroke.size;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !socket) return;

    const ctx = canvas.getContext("2d");

    // Throttle cursor emit
    let lastCursorEmit = 0;

    const startDrawing = (e) => {
      isDrawing.current = true;
      currentStroke.current = [];
      const pos = getPos(e, canvas);
      currentStroke.current.push(pos);
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
    };

    const draw = (e) => {
      const pos = getPos(e, canvas);

      // Emit cursor position throttled to every 30ms
      const now = Date.now();
      if (now - lastCursorEmit > 30) {
        socket.emit("cursor-move", { roomId, x: pos.x, y: pos.y });
        lastCursorEmit = now;
      }

      if (!isDrawing.current) return;

      currentStroke.current.push(pos);
      ctx.lineTo(pos.x, pos.y);
      ctx.strokeStyle = tool.current === "erase" ? "#ffffff" : color.current;
      ctx.lineWidth = size.current;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.stroke();
    };

    const stopDrawing = () => {
      if (!isDrawing.current) return;
      isDrawing.current = false;

      if (currentStroke.current.length < 2) return;

      const stroke = {
        type: tool.current,
        points: currentStroke.current,
        color: color.current,
        size: size.current,
      };

      console.log("[Canvas] Emitting stroke, points:", stroke.points.length);
      socket.emit("draw-stroke", { roomId, stroke });
      currentStroke.current = [];
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
    replayStrokes,
    drawStroke,
    setTool: (t) => { tool.current = t; },
    setColor: (c) => { color.current = c; },
    setSize: (s) => { size.current = s; },
  };
};

export default useCanvas;