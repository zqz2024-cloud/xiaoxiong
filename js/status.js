// 页面展示的服务器地址（友好名称）
const DISPLAY_HOST = 'clementlb.top';
// 真实查询的服务器地址
const SERVER_HOST = 'frp-dry.com';
const SERVER_PORT = 57535;

async function fetchStatus() {
  const card = document.getElementById('statusCard');
  const detail = document.getElementById('statusDetail');
  const playerList = document.getElementById('playerList');
  const statusLoading = document.getElementById('statusLoading');
  const statusResult = document.getElementById('statusResult');
  if (!card) return;

  // Reset UI
  card.className = 'status-card';
  card.setAttribute('aria-busy', 'true');
  if (statusLoading) statusLoading.style.display = 'flex';
  if (statusResult) statusResult.style.display = 'none';
  if (detail) detail.style.display = 'none';
  if (playerList) playerList.style.display = 'none';
  resetMetrics();

  try {
    const url = `https://api.mcsrvstat.us/3/${SERVER_HOST}:${SERVER_PORT}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    console.log('mcsrvstat response:', data);

    if (!data || !data.online) {
      card.className = 'status-card offline';
      card.setAttribute('aria-busy', 'false');
      if (statusLoading) statusLoading.style.display = 'none';
      if (statusResult) {
        statusResult.style.display = 'block';
        document.getElementById('statusIcon').textContent = '🔴';
        document.getElementById('statusText').textContent = '服务器离线';
        document.getElementById('statusText').className = 'status-text offline-text';
        document.getElementById('statusPlayers').textContent = '服务器当前未运行或无法连接';
      }
      updateMetrics({ status: '离线', players: '-', ping: '-', version: '-' });
      if (detail) detail.style.display = 'none';
      if (playerList) playerList.style.display = 'none';
      return;
    }

    // Server is online
    card.className = 'status-card online';
    card.setAttribute('aria-busy', 'false');
    const playersOnline = data.players?.online ?? 0;
    const playersMax = data.players?.max ?? 0;
    if (statusLoading) statusLoading.style.display = 'none';
    if (statusResult) {
      statusResult.style.display = 'block';
      document.getElementById('statusIcon').textContent = '🟢';
      document.getElementById('statusText').textContent = '服务器在线';
      document.getElementById('statusText').className = 'status-text online-text';
      document.getElementById('statusPlayers').textContent = `${playersOnline} / ${playersMax} 名玩家在线`;
    }

    updateMetrics({
      status: '在线',
      players: `${playersOnline}/${playersMax}`,
      ping: data.debug?.ping ? `${data.debug.ping}ms` : '-',
      version: data.version?.name || data.version || '-'
    });

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
    if (statusLoading) statusLoading.style.display = 'none';
    if (statusResult) {
      statusResult.style.display = 'block';
      document.getElementById('statusIcon').textContent = '⚠️';
      document.getElementById('statusText').textContent = '查询失败';
      document.getElementById('statusText').className = 'status-text offline-text';
      document.getElementById('statusPlayers').textContent = '无法连接到状态查询服务，请稍后重试';
    }
    updateMetrics({ status: '查询失败', players: '-', ping: '-', version: '-' });
    if (detail) detail.style.display = 'none';
    if (playerList) playerList.style.display = 'none';
    console.error('Status fetch error:', err);
  }
}

function updateMetrics({ status, players, ping, version }) {
  const map = {
    metricStatus: status,
    metricPlayers: players,
    metricPing: ping,
    metricVersion: version
  };
  Object.entries(map).forEach(([id, value]) => setText(id, value));
}

function resetMetrics() {
  updateMetrics({ status: '查询中…', players: '-', ping: '-', version: '-' });
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
