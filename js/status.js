// 页面展示的服务器地址（友好名称）
const DISPLAY_HOST = 'clementlb.top';
// 真实查询的服务器地址（FRP 穿透后的原始地址）
const SERVER_HOST = 'frp-gap.com';
const SERVER_PORT = 31043;

async function fetchStatus() {
  const card = document.getElementById('statusCard');
  const detail = document.getElementById('statusDetail');
  const playerList = document.getElementById('playerList');
  if (!card) return;

  // Reset UI
  card.className = 'status-card';
  card.setAttribute('aria-busy', 'true');
  card.innerHTML = `
    <div class="status-loading">
      <div class="bear-loader">
        <div class="bear-loader-emoji" aria-hidden="true">🐻</div>
        <div class="loader-paws" aria-hidden="true"><span>🐾</span><span>🐾</span><span>🐾</span></div>
      </div>
      <p class="loading-text">小熊正在查看服务器…</p>
    </div>`;
  if (detail) detail.style.display = 'none';
  if (playerList) playerList.style.display = 'none';

  try {
    const url = `https://api.mcsrvstat.us/3/${SERVER_HOST}:${SERVER_PORT}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();

    if (!data || !data.online) {
      card.className = 'status-card offline';
      card.setAttribute('aria-busy', 'false');
      card.innerHTML = `
        <div class="status-result">
          <div class="status-icon" aria-hidden="true">🔴</div>
          <div class="status-text offline-text">服务器离线</div>
          <div class="status-players">服务器当前未运行或无法连接</div>
        </div>`;
      if (detail) detail.style.display = 'none';
      if (playerList) playerList.style.display = 'none';
      return;
    }

    // Server is online
    card.className = 'status-card online';
    card.setAttribute('aria-busy', 'false');
    const playersOnline = data.players?.online ?? 0;
    const playersMax = data.players?.max ?? 0;
    card.innerHTML = `
      <div class="status-result">
        <div class="status-icon" aria-hidden="true">🟢</div>
        <div class="status-text online-text">服务器在线</div>
        <div class="status-players">${playersOnline} / ${playersMax} 名玩家在线</div>
      </div>`;

    if (detail) detail.style.display = 'block';

    // MOTD - clean HTML tags & section sign
    let motd = '';
    if (data.motd) {
      if (Array.isArray(data.motd.clean) && data.motd.clean.length) {
        motd = data.motd.clean.join('\n');
      } else if (Array.isArray(data.motd.raw) && data.motd.raw.length) {
        motd = data.motd.raw.join('\n');
      }
    }
    motd = motd.replace(/§[0-9a-fk-or]/gi, '').trim() || '-';

    setText('detailName', data.hostname || data.ip || DISPLAY_HOST);
    setText('detailVersion', data.version?.name || data.version || '-');
    setText('detailPlayers', String(playersOnline));
    setText('detailMaxPlayers', String(playersMax));
    setText('detailMotd', motd);
    setText('detailSoftware', data.software || '-');

    // Player list
    const grid = document.getElementById('playerGrid');
    if (Array.isArray(data.players?.list) && data.players.list.length > 0 && playerList && grid) {
      playerList.style.display = 'block';
      grid.innerHTML = data.players.list.map(name =>
        `<span class="player-tag"><span aria-hidden="true">👤</span> ${escapeHtml(String(name))}</span>`
      ).join('');
    } else if (playerList) {
      playerList.style.display = 'none';
    }
  } catch (err) {
    card.className = 'status-card offline';
    card.setAttribute('aria-busy', 'false');
    card.innerHTML = `
      <div class="status-result">
        <div class="status-icon" aria-hidden="true">⚠️</div>
        <div class="status-text offline-text">查询失败</div>
        <div class="status-players">无法连接到状态查询服务，请稍后重试</div>
      </div>`;
    if (detail) detail.style.display = 'none';
    if (playerList) playerList.style.display = 'none';
    console.error('Status fetch error:', err);
  }
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Auto-fetch on load
fetchStatus();
