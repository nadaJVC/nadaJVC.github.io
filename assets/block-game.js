(() => {
  const canvas = document.getElementById("block-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const nameInput = document.getElementById("block-name");
  const startButton = document.getElementById("block-start");
  const status = document.getElementById("block-status");
  const daily = document.getElementById("block-daily");
  const alltime = document.getElementById("block-alltime");
  let game = null;
  let raf = 0;

  const today = () => new Date().toISOString().slice(0, 10);
  const read = (key) => {
    try { return JSON.parse(localStorage.getItem(key) || "[]"); } catch { return []; }
  };
  const safe = (value) => String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[char]));
  const renderRanks = () => {
    const row = (items) => items.length ? items.map((item) => `<li>${safe(item.name)} — ${item.score}点</li>`).join("") : "<li>まだ記録がありません</li>";
    const d = read("nadaBlockDaily").filter((item) => item.date === today()).sort((a, b) => b.score - a.score).slice(0, 5);
    const a = read("nadaBlockAll").sort((x, y) => y.score - x.score).slice(0, 5);
    daily.innerHTML = row(d);
    alltime.innerHTML = row(a);
  };
  const finish = (message) => {
    if (!game || !game.active) return;
    game.active = false;
    clearInterval(game.timer);
    const entry = { name: (nameInput.value.trim() || "なだJVC").slice(0, 12), score: game.score, date: today() };
    localStorage.setItem("nadaBlockDaily", JSON.stringify(read("nadaBlockDaily").filter((item) => item.date === entry.date).concat(entry).sort((a, b) => b.score - a.score).slice(0, 10)));
    localStorage.setItem("nadaBlockAll", JSON.stringify(read("nadaBlockAll").concat(entry).sort((a, b) => b.score - a.score).slice(0, 10)));
    renderRanks();
    status.textContent = message || `${entry.name}さんのゲーム終了！ ${entry.score}点`;
    startButton.textContent = "もう一度挑戦";
  };
  const start = () => {
    if (!nameInput.value.trim()) { nameInput.focus(); status.textContent = "ニックネームを入力してください。"; return; }
    if (game) clearInterval(game.timer);
    game = { active: true, score: 0, time: 60, paddle: 230, ball: { x: 260, y: 310, dx: 3, dy: -3 }, bricks: Array.from({ length: 30 }, (_, i) => ({ x: 20 + (i % 10) * 50, y: 35 + Math.floor(i / 10) * 24, active: true })) };
    startButton.textContent = "プレイ中";
    status.textContent = "左右キーまたは画面操作でパドルを動かそう！";
    game.timer = setInterval(() => { game.time -= 1; if (game.time <= 0) finish("時間切れ！"); }, 1000);
  };
  const move = (x) => {
    if (!game || !game.active) { if (nameInput.value.trim()) start(); return; }
    game.paddle = Math.max(0, Math.min(460, x - 30));
  };
  const draw = () => {
    ctx.fillStyle = "#101d3c"; ctx.fillRect(0, 0, 520, 360);
    game?.bricks.forEach((brick, i) => { if (brick.active) { ctx.fillStyle = ["#ff7465", "#ffd84d", "#2879cf"][i % 3]; ctx.fillRect(brick.x, brick.y, 42, 16); } });
    ctx.fillStyle = "#fff"; ctx.fillRect(game?.paddle || 230, 338, 60, 10);
    const ball = game?.ball || { x: 260, y: 310 }; ctx.beginPath(); ctx.arc(ball.x, ball.y, 8, 0, Math.PI * 2); ctx.fill();
    if (game?.active) {
      ball.x += ball.dx; ball.y += ball.dy;
      if (ball.x < 8 || ball.x > 512) ball.dx *= -1;
      if (ball.y < 8) ball.dy = Math.abs(ball.dy);
      if (ball.y > 330 && ball.x > game.paddle && ball.x < game.paddle + 60) ball.dy = -Math.abs(ball.dy);
      if (ball.y > 360) finish("ボールを落としました！");
      game.bricks.forEach((brick) => { if (brick.active && ball.x > brick.x && ball.x < brick.x + 42 && ball.y > brick.y && ball.y < brick.y + 16) { brick.active = false; ball.dy *= -1; game.score += 10; } });
      if (game.bricks.every((brick) => !brick.active)) finish("全ブロッククリア！");
    }
    raf = requestAnimationFrame(draw);
  };
  startButton.addEventListener("click", start);
  canvas.addEventListener("pointerdown", (event) => { const rect = canvas.getBoundingClientRect(); move((event.clientX - rect.left) / rect.width * 520); });
  canvas.addEventListener("pointermove", (event) => { if (event.buttons) { const rect = canvas.getBoundingClientRect(); move((event.clientX - rect.left) / rect.width * 520); } });
  document.addEventListener("keydown", (event) => { if (event.key === "ArrowLeft" && game) game.paddle = Math.max(0, game.paddle - 22); if (event.key === "ArrowRight" && game) game.paddle = Math.min(460, game.paddle + 22); });
  renderRanks(); draw();
})();
