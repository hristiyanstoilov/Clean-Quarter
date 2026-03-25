/**
 * Generates a shareable impact card image using the Canvas API
 * and triggers a download.
 *
 * @param {Object} params
 * @param {string} params.username
 * @param {number} params.points
 * @param {number} params.cleanups  - number of approved participations
 * @param {string} params.rank      - Bronze / Silver / Gold
 */
export function generateImpactCard({ username, points, cleanups, rank }) {
  const W = 800;
  const H = 420;

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");

  // Background gradient
  const grad = ctx.createLinearGradient(0, 0, W, H);
  grad.addColorStop(0, "#1a6b3a");
  grad.addColorStop(1, "#0d3320");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // Decorative circle
  ctx.beginPath();
  ctx.arc(W - 80, 80, 160, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(255,255,255,0.05)";
  ctx.fill();

  // App name
  ctx.font = "bold 28px sans-serif";
  ctx.fillStyle = "#a8f0c0";
  ctx.fillText("♻️ Чист Квартал", 48, 64);

  // Username
  ctx.font = "bold 48px sans-serif";
  ctx.fillStyle = "#ffffff";
  ctx.fillText(username || "Потребител", 48, 140);

  // Divider
  ctx.strokeStyle = "rgba(255,255,255,0.2)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(48, 160);
  ctx.lineTo(W - 48, 160);
  ctx.stroke();

  // Stats row
  const stats = [
    { emoji: "⭐", value: String(points), label: "точки" },
    { emoji: "🧹", value: String(cleanups), label: "почиствания" },
    { emoji: "🏅", value: rank, label: "ранг" },
  ];

  stats.forEach((s, i) => {
    const x = 48 + i * 240;
    const y = 230;
    ctx.font = "40px sans-serif";
    ctx.fillText(s.emoji, x, y);
    ctx.font = "bold 44px sans-serif";
    ctx.fillStyle = "#ffd700";
    ctx.fillText(s.value, x + 52, y + 4);
    ctx.font = "18px sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.65)";
    ctx.fillText(s.label, x + 52, y + 28);
  });

  // Footer
  ctx.font = "16px sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.45)";
  ctx.fillText("cleanquarter.netlify.app", 48, H - 28);

  // Download
  const link = document.createElement("a");
  link.download = "impact-card.png";
  link.href = canvas.toDataURL("image/png");
  link.click();
}
