"use client";

import { useEffect, useRef } from "react";

type Props = {
  src: string;
  /** Horizontal focal point of the source image, 0 to 1, used when cropping to cover. */
  focusX?: number;
  focusY?: number;
  /** Fade toward the left edge, for when the portrait sits beside text. */
  fadeLeft?: boolean;
  className?: string;
  label: string;
};

type Particle = {
  hx: number;
  hy: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  a: number;
  phase: number;
};

const SAND = "227, 207, 169";
const EMBER = "224, 128, 96";
const BUCKETS = 10;

/**
 * The portrait rebuilt as a field of particles sampled from the photo. Each one is
 * sprung to its place in the face; the cursor pushes them away and they settle back.
 */
export function ParticlePortrait({
  src,
  focusX = 0.5,
  focusY = 0.5,
  fadeLeft = false,
  className = "",
  label,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let particles: Particle[] = [];
    let width = 0;
    let height = 0;
    let dpr = 1;
    let raf = 0;
    let visible = true;
    let start = performance.now();
    const pointer = { x: -9999, y: -9999, active: false };

    const image = new Image();
    image.decoding = "async";
    image.src = src;

    function build() {
      if (!canvas || !ctx || !image.complete || !image.naturalWidth) return;
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      if (!width || !height) return;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Spacing scales with the canvas so the particle count stays sane on any screen.
      const spacing = Math.max(4.5, Math.min(width, height) / 120);
      const cols = Math.floor(width / spacing);
      const rows = Math.floor(height / spacing);

      // Draw the photo, cropped to cover, into a grid-sized offscreen canvas and read it back.
      const sample = document.createElement("canvas");
      sample.width = cols;
      sample.height = rows;
      const sctx = sample.getContext("2d", { willReadFrequently: true });
      if (!sctx) return;
      const scale = Math.max(cols / image.naturalWidth, rows / image.naturalHeight);
      const dw = image.naturalWidth * scale;
      const dh = image.naturalHeight * scale;
      const dx = (cols - dw) * focusX;
      const dy = (rows - dh) * focusY;
      sctx.drawImage(image, dx, dy, dw, dh);
      const data = sctx.getImageData(0, 0, cols, rows).data;

      // Luminance grid, then an unsharp mask so the features read crisply as dots.
      const base = new Float32Array(cols * rows);
      for (let j = 0; j < cols * rows; j++) {
        const i = j * 4;
        base[j] = (0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]) / 255;
      }
      const at = (c: number, r: number) =>
        base[Math.min(rows - 1, Math.max(0, r)) * cols + Math.min(cols - 1, Math.max(0, c))];

      const next: Particle[] = [];
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          let blur = 0;
          for (let oy = -1; oy <= 1; oy++) {
            for (let ox = -1; ox <= 1; ox++) blur += at(col + ox, row + oy);
          }
          blur /= 9;
          const center = at(col, row);
          const lum = Math.min(1, Math.max(0, center + (center - blur) * 1.6));
          // Lift the midtones and drop the near-black background entirely.
          const v = Math.pow(Math.max(0, (lum - 0.1) / 0.9), 1.25);
          if (v < 0.06) continue;

          const hx = col * spacing + spacing / 2;
          const hy = row * spacing + spacing / 2;

          // Fade into the page: toward the bottom always, toward the left beside text.
          let fade = Math.min(1, (1 - hy / height) / 0.28);
          if (fadeLeft && width >= 640) fade *= Math.min(1, (hx / width) / 0.32);
          const a = v * Math.max(0, fade);
          if (a < 0.04) continue;

          const angle = Math.random() * Math.PI * 2;
          const dist = Math.max(width, height) * (0.4 + Math.random() * 0.6);
          next.push({
            hx,
            hy,
            x: reduce ? hx : width / 2 + Math.cos(angle) * dist,
            y: reduce ? hy : height / 2 + Math.sin(angle) * dist,
            vx: 0,
            vy: 0,
            r: spacing * (0.16 + 0.42 * v),
            a,
            phase: Math.random() * Math.PI * 2,
          });
        }
      }
      particles = next;
      start = performance.now();
      if (reduce) draw(0);
    }

    function draw(t: number) {
      if (!ctx) return;
      ctx.clearRect(0, 0, width, height);
      const paths: Path2D[] = Array.from({ length: BUCKETS }, () => new Path2D());
      const hot = new Path2D();
      const radius = Math.max(70, Math.min(width, height) * 0.16);
      const radius2 = radius * radius;

      for (const p of particles) {
        if (!reduce) {
          // Assemble over the first two seconds, then breathe.
          const settle = Math.min(1, (t - start) / 1400);
          const k = 0.022 + 0.05 * settle;
          const drift = Math.sin(t / 1400 + p.phase) * 0.35;
          let fx = (p.hx + drift - p.x) * k;
          let fy = (p.hy + Math.cos(t / 1700 + p.phase) * 0.35 - p.y) * k;

          if (pointer.active) {
            const dx = p.x - pointer.x;
            const dy = p.y - pointer.y;
            const d2 = dx * dx + dy * dy;
            if (d2 < radius2 && d2 > 0.01) {
              const d = Math.sqrt(d2);
              const force = (1 - d / radius) * 2.4;
              fx += (dx / d) * force;
              fy += (dy / d) * force;
            }
          }

          p.vx = (p.vx + fx) * 0.86;
          p.vy = (p.vy + fy) * 0.86;
          p.x += p.vx;
          p.y += p.vy;
        }

        // Only the cursor's disturbance glows; the opening assembly stays in sand.
        const displaced = Math.abs(p.x - p.hx) + Math.abs(p.y - p.hy);
        if (displaced > 14 && !reduce && t - start > 2600) {
          hot.moveTo(p.x + p.r, p.y);
          hot.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        } else {
          const b = Math.min(BUCKETS - 1, Math.floor(p.a * BUCKETS));
          paths[b].moveTo(p.x + p.r, p.y);
          paths[b].arc(p.x, p.y, p.r, 0, Math.PI * 2);
        }
      }

      for (let b = 0; b < BUCKETS; b++) {
        ctx.fillStyle = `rgba(${SAND}, ${((b + 0.5) / BUCKETS).toFixed(3)})`;
        ctx.fill(paths[b]);
      }
      ctx.fillStyle = `rgba(${EMBER}, 0.75)`;
      ctx.fill(hot);
    }

    function loop(t: number) {
      if (visible && !document.hidden) draw(t);
      raf = requestAnimationFrame(loop);
    }

    function toLocal(clientX: number, clientY: number) {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      pointer.x = clientX - rect.left;
      pointer.y = clientY - rect.top;
      pointer.active = true;
    }

    const onMove = (e: PointerEvent) => toLocal(e.clientX, e.clientY);
    const onLeave = () => {
      pointer.active = false;
    };
    // A finger lifting should let the face settle; a mouse keeps pushing until it leaves.
    const onUp = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") pointer.active = false;
    };

    let started = false;
    const onReady = () => {
      build();
      if (!reduce && !started) {
        started = true;
        raf = requestAnimationFrame(loop);
      }
    };
    image.onload = onReady;
    if (image.complete && image.naturalWidth) onReady();

    let resizeTimer = 0;
    const ro = new ResizeObserver(() => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(build, 120);
    });
    ro.observe(canvas);

    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
    });
    io.observe(canvas);

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onMove, { passive: true });
    window.addEventListener("pointerup", onUp, { passive: true });
    window.addEventListener("pointercancel", onUp, { passive: true });
    document.addEventListener("pointerleave", onLeave);
    window.addEventListener("blur", onLeave);

    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(resizeTimer);
      ro.disconnect();
      io.disconnect();
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      document.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("blur", onLeave);
      image.onload = null;
    };
  }, [src, focusX, focusY, fadeLeft]);

  return <canvas ref={canvasRef} className={className} role="img" aria-label={label} />;
}
