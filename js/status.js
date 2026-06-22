const SERVER_IP = 'clementlb.top';
const SERVER_PORT = 31043;

async function fetchStatus() {
  const card = document.getElementById('statusCard');
  const detail = document.getElementById('statusDetail');
  const playerList = document.getElementById('playerList');

  // Reset UI
  card.className = 'status-card';
  card.innerHTML = '<div class="status-loading"><div class="spinner"></div><p>正在查询服务器状态...</p></div>';
  detail.style.display = 'none';
  playerList.style.display = 'none';

  try {
    const url = `https://api.mcsrvstat.us/3/${SERVER_HOST}:${SERVER_PORT}`;
    const response = await fetch(url);
    const data = await response.json();

    if (!data.online) {
      card.className = 'status-card offline';
      card.innerHTML = `
        <div class="status-result" style="display:block;">
          <div class="status-icon">🔴</div>
          <div class="status-text offline-text">服务器离线</div>
          <div class="status-players">服务器当前未运行或无法连接</div>
        </div>`;
      detail.style.display = 'none';
      playerList.style.display = 'none';
      return;
    }

    // Server is online
    card.className = 'status-card online';
    card.innerHTML = `
      <div class="status-result" style="display:block;">
        <div class="status-icon">🟢</div>
        <div class="status-text online-text">服务器在线</div>
        <div class="status-players">${data.players?.online || 0} / ${data.players?.max || 0} 名玩家在线</div>
      </div>`;

    // Detail
    detail.style.display = 'block';

    // MOTD - clean HTML tags
    let motd = '';
    if (data.motd) {
      if (data.motd.clean) {
        motd = data.motd.clean.join('\n');
      } else if (data.motd.raw) {
        motd = data.motd.raw.join('\n');
      }
    }
    motd = motd.replace(/§[0-9a-fk-or]/gi, '').trim() || '-';

    document.getElementById('detailName').textContent = data.hostname || data.ip || `${SERVER_IP}:${SERVER_PORT}`;
    document.getElementById('detailVersion').textContent = data.version?.name || data.version || '-';
    document.getElementById('detailPlayers').textContent = data.players?.online ?? '-';
    document.getElementById('detailMaxPlayers').textContent = data.players?.max ?? '-';
    document.getElementById('detailMotd').textContent = motd;
    document.getElementById('detailSoftware').textContent = data.software || '-';

    // Player list
    if (data.players?.list && data.players.list.length > 0) {
      playerList.style.display = 'block';
      const grid = document.getElementById('playerGrid');
      grid.innerHTML = data.players.list.map(name =>
        `<span class="player-tag">👤 ${escapeHtml(name)}</span>`
      ).join('');
    } else {
      playerList.style.display = 'none';
    }
  } catch (err) {
    card.className = 'status-card offline';
    card.innerHTML = `
      <div class="status-result" style="display:block;">
        <div class="status-icon">⚠️</div>
        <div class="status-text offline-text">查询失败</div>
        <div class="status-players">无法连接到状态查询服务，请稍后重试</div>
      </div>`;
    detail.style.display = 'none';
    playerList.style.display = 'none';
    console.error('Status fetch error:', err);
  }
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Auto-fetch on load
fetchStatus();