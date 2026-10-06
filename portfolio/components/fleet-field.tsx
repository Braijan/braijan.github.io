"use client";

import { useEffect, useRef } from "react";

type Agent = {
  x: number;
  y: number;
  heading: number;
  speed: number;
  trail: { x: number; y: number }[];
};

type Spark = { x: number; y: number; nx: number; ny: number; life: number };

const VIEW = 320;
const CENTER = VIEW / 2;
const SAND = "227, 207, 169";
const EMBER = "224, 128, 96";
const TRAIL = 14;

/**
 * A simulated fleet drifting through the rings the agents are allowed in. Any agent
 * that wanders onto the secrets boundary is turned back, and the wall flashes.
 * Drawn in the same 320-unit space as the ring SVG it sits on.
 */
export function FleetField({
  inner,
  outer,
  count = 42,
  onBlock,
}: {
  inner: number;
  outer: number;
  count?: number;
  onBlock?: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const onBlockRef = useRef(onBlock);
  useEffect(() => {
    onBlockRef.current = onBlock;
  }, [onBlock]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    let visible = false;
    let scale = 1;

    const agents: Agent[] = Array.from({ length: count }, () => {
      const r = inner + 8 + Math.random() * (outer - inner - 16);
      const a = Math.random() * Math.PI * 2;
      return {
        x: CENTER + Math.cos(a) * r,
        y: CENTER + Math.sin(a) * r,
        heading: Math.random() * Math.PI * 2,
        speed: 0.28 + Math.random() * 0.32,
        trail: [],
      };
    });
    const sparks: Spark[] = [];

    function resize() {
      if (!canvas || !ctx) return;
      const size = canvas.getBoundingClientRect().width;
      if (!size) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(size * dpr);
      canvas.height = Math.round(size * dpr);
      scale = (size * dpr) / VIEW;
      ctx.setTransform(scale, 0, 0, scale, 0, 0);
      if (reduce) draw();
    }

    function step() {
      for (const ag of agents) {
        ag.heading += (Math.random() - 0.5) * 0.22;
        // A gentle pull inward, so the fleet keeps testing the boundary.
        const dxc = CENTER - ag.x;
        const dyc = CENTER - ag.y;
        const toCenter = Math.atan2(dyc, dxc);
        let diff = toCenter - ag.heading;
        diff = Math.atan2(Math.sin(diff), Math.cos(diff));
        ag.heading += diff * 0.004;

        let nx = ag.x + Math.cos(ag.heading) * ag.speed;
        let ny = ag.y + Math.sin(ag.heading) * ag.speed;
        const dx = nx - CENTER;
        const dy = ny - CENTER;
        const d = Math.hypot(dx, dy);
        const ux = dx / d;
        const uy = dy / d;

        if (d < inner + 2) {
          // Turned away at the wall: reflect off the circle and flash.
          const vx = Math.cos(ag.heading);
          const vy = Math.sin(ag.heading);
          const dot = vx * ux + vy * uy;
          ag.heading = Math.atan2(vy - 2 * dot * uy, vx - 2 * dot * ux);
          nx = CENTER + ux * (inner + 2.5);
          ny = CENTER + uy * (inner + 2.5);
          sparks.push({ x: CENTER + ux * inner, y: CENTER + uy * inner, nx: ux, ny: uy, life: 1 });
          onBlockRef.current?.();
        } else if (d > outer - 2) {
          const vx = Math.cos(ag.heading);
          const vy = Math.sin(ag.heading);
          const dot = vx * ux + vy * uy;
          ag.heading = Math.atan2(vy - 2 * dot * uy, vx - 2 * dot * ux);
          nx = CENTER + ux * (outer - 2.5);
          ny = CENTER + uy * (outer - 2.5);
        }

        ag.trail.push({ x: ag.x, y: ag.y });
        if (ag.trail.length > TRAIL) ag.trail.shift();
        ag.x = nx;
        ag.y = ny;
      }

      for (let i = sparks.length - 1; i >= 0; i--) {
        sparks[i].life -= 0.022;
        if (sparks[i].life <= 0) sparks.splice(i, 1);
      }
    }

    function draw() {
      if (!ctx) return;
      ctx.clearRect(0, 0, VIEW, VIEW);

      ctx.lineCap = "round";
      for (const ag of agents) {
        if (ag.trail.length > 1) {
          for (let i = 1; i < ag.trail.length; i++) {
            const a = (i / ag.trail.length) * 0.28;
            ctx.strokeStyle = `rgba(${SAND}, ${a.toFixed(3)})`;
            ctx.lineWidth = 0.8;
            ctx.beginPath();
            ctx.moveTo(ag.trail[i - 1].x, ag.trail[i - 1].y);
            ctx.lineTo(ag.trail[i].x, ag.trail[i].y);
            ctx.stroke();
          }
        }
        ctx.fillStyle = `rgba(${SAND}, 0.95)`;
        ctx.beginPath();
        ctx.arc(ag.x, ag.y, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }

      for (const s of sparks) {
        const spread = (1 - s.life) * 14;
        // A short arc of wall lighting up where the agent struck it.
        const angle = Math.atan2(s.ny, s.nx);
        ctx.strokeStyle = `rgba(${EMBER}, ${(s.life * 0.9).toFixed(3)})`;
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.arc(CENTER, CENTER, inner, angle - 0.18 - (1 - s.life) * 0.1, angle + 0.18 + (1 - s.life) * 0.1);
        ctx.stroke();
        ctx.fillStyle = `rgba(${EMBER}, ${(s.life * 0.35).toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(s.x, s.y, 2 + spread * 0.6, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    function loop() {
      if (visible && !document.hidden) {
        step();
        draw();
      }
      raf = requestAnimationFrame(loop);
    }

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
    });
    io.observe(canvas);
    if (!reduce) raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
    };
  }, [inner, outer, count]);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 h-full w-full"
      aria-hidden="true"
    />
  );
}
