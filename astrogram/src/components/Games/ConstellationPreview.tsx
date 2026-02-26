import React, { useEffect, useRef } from 'react';
import { type Constellation } from '../../data/constellations';

// Inline mulberry32 PRNG (same as ConstellationGame.tsx)
function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function drawPreview(
  canvas: HTMLCanvasElement,
  constellation: Constellation,
  rotationDeg: number,
  showNorthArrow: boolean,
  showAllNames: boolean,
) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const W = canvas.width;
  const H = canvas.height;
  const cx = W / 2;
  const cy = H / 2;
  const scale = Math.min(W, H) * 0.38;

  ctx.fillStyle = '#060a18';
  ctx.fillRect(0, 0, W, H);

  // Seeded background stars (same seed logic as game)
  const rand = mulberry32(
    constellation.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0),
  );
  for (let i = 0; i < 160; i++) {
    const bx = rand() * W;
    const by = rand() * H;
    const br = rand() * 1.2 + 0.2;
    ctx.beginPath();
    ctx.arc(bx, by, br, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(200,220,255,${rand() * 0.5 + 0.1})`;
    ctx.fill();
  }

  const rotRad = (rotationDeg * Math.PI) / 180;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rotRad);

  const project = (x: number, y: number) => ({ px: x * scale, py: -y * scale });

  // Lines
  ctx.strokeStyle = 'rgba(99,179,237,0.45)';
  ctx.lineWidth = 1.5;
  for (const line of constellation.lines) {
    const a = constellation.stars[line.from];
    const b = constellation.stars[line.to];
    const { px: ax, py: ay } = project(a.x, a.y);
    const { px: bx, py: by } = project(b.x, b.y);
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.lineTo(bx, by);
    ctx.stroke();
  }

  // Stars + labels
  for (const star of constellation.stars) {
    const { px, py } = project(star.x, star.y);
    const r = Math.max(1.5, 5.5 - star.magnitude * 0.7);
    const grd = ctx.createRadialGradient(px, py, 0, px, py, r * 2.5);
    grd.addColorStop(0, 'rgba(255,255,255,0.95)');
    grd.addColorStop(0.4, 'rgba(200,235,255,0.6)');
    grd.addColorStop(1, 'rgba(120,180,255,0)');
    ctx.beginPath();
    ctx.arc(px, py, r * 2.5, 0, Math.PI * 2);
    ctx.fillStyle = grd;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(px, py, r, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.fill();

    const showName = showAllNames ? !!star.name : star.name && star.magnitude <= 2.5;
    if (showName) {
      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(-rotRad); // keep label upright
      ctx.font = `${Math.max(9, W * 0.028)}px sans-serif`;
      ctx.fillStyle = 'rgba(180,220,255,0.85)';
      ctx.fillText(star.name!, r + 3, 4);
      ctx.restore();
    }
  }

  ctx.restore();

  // North arrow — always points up in viewport, showing where True North is
  if (showNorthArrow) {
    const arrowLen = Math.min(W, H) * 0.18;
    const tipX = cx;
    const tipY = cy - Math.min(W, H) * 0.42;

    ctx.save();
    ctx.strokeStyle = '#34d399';
    ctx.fillStyle = '#34d399';
    ctx.lineWidth = 2;

    // Arrow shaft
    ctx.beginPath();
    ctx.moveTo(tipX, tipY + arrowLen);
    ctx.lineTo(tipX, tipY + 6);
    ctx.stroke();

    // Arrowhead
    ctx.beginPath();
    ctx.moveTo(tipX, tipY);
    ctx.lineTo(tipX - 6, tipY + 10);
    ctx.lineTo(tipX + 6, tipY + 10);
    ctx.closePath();
    ctx.fill();

    // "N" label
    ctx.font = `bold ${Math.max(10, W * 0.032)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('N', tipX, tipY - 4);
    ctx.textAlign = 'start';
    ctx.restore();
  }
}

interface ConstellationPreviewProps {
  constellation: Constellation;
  rotation?: number;
  size?: number;
  showNorthArrow?: boolean;
  showAllNames?: boolean;
  className?: string;
}

const ConstellationPreview: React.FC<ConstellationPreviewProps> = ({
  constellation,
  rotation = 0,
  size = 300,
  showNorthArrow = false,
  showAllNames = false,
  className,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = size;
    canvas.height = size;
    drawPreview(canvas, constellation, rotation, showNorthArrow, showAllNames);
  }, [constellation, rotation, size, showNorthArrow, showAllNames]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ width: size, height: size }}
    />
  );
};

export default ConstellationPreview;
