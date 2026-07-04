(function () {
  const template = (window.SukiTemplate = window.SukiTemplate || {});
  const utils = template.utils;

  function renderMissingSubdomain(state) {
    document.getElementById("content").innerHTML = `
      <div class="card">
        <h2>这片星空暂时无人驻留</h2>
        <p style="color:var(--text-light)">
          你访问的主播主页尚未创建，或链接有误。
        </p>
        <p style="margin-top:1rem">
          <a href="https://suki.live" style="color:var(--accent)">返回首页</a> ·
          <a href="https://github.com/vtuber-toolkit/suki-live" target="_blank" style="color:var(--accent)">申请创建主页</a>
        </p>
      </div>`;
  }

  function renderLoadError(state, type) {
    const messages = {
      "missing-info": "文件 <code>info.json</code> 未找到。",
      "missing-playlist": "文件 <code>playlist.json</code> 未找到。",
      "missing-custom": "已启用自定义页面，但 <code>custom.html</code> 未找到。",
    };

    document.getElementById("content").innerHTML = `
      <div class="card">
        <h2>加载失败</h2>
        <p style="color:var(--text-light)">
          ${messages[type] || "页面所需文件未找到或格式不正确。"}<br/>
          主播 <code>${state.id}</code> 的配置可能尚未完成。
        </p>
        <p style="margin-top:1rem">
          <a href="https://suki.live" style="color:var(--accent)">返回首页</a> ·
          <a href="https://github.com/vtuber-toolkit/suki-live" target="_blank" style="color:var(--accent)">查看注册指南</a>
        </p>
      </div>`;
  }

  function updateSectionNavVisibility() {
    const navEl = document.getElementById("main-nav");
    if (!navEl) return;

    const sectionCount = document.querySelectorAll(".section-anchor").length;
    if (sectionCount >= 2) {
      navEl.style.display = "flex";
      setTimeout(() => template.playlist.initNavScrollSpy(), 100);
    } else {
      navEl.style.display = "none";
    }
  }

  function renderDefaultTemplate(state, info, playlist) {
    state.info = info;
    state.playlistData = {
      ...playlist,
      items: Array.isArray(playlist?.items) ? playlist.items : [],
    };

    document.title = `${info.name} · suki.live`;
    document.getElementById("page-title").textContent = `${info.name} · suki.live`;
    document.getElementById("name").textContent = info.name;
    document.getElementById("tagline").textContent = info.tagline || "";

    const avatarEl = document.getElementById("avatar");
    if (avatarEl) {
      avatarEl.src = `${state.base}/avatar.png?t=${Date.now()}`;
      avatarEl.style.display = "";
    }

    const faviconEl = document.querySelector('link[rel="icon"]');
    if (faviconEl) {
      faviconEl.href = `${state.base}/favicon.ico?t=${Date.now()}`;
    }

    const socialEl = document.getElementById("social");
    socialEl.innerHTML = "";
    if (Array.isArray(info.social) && info.social.length) {
      info.social.forEach((item) => {
        if (item.label && item.url) {
          socialEl.innerHTML += `
            <a href="${utils.escapeHtml(item.url)}" target="_blank" rel="noopener">
              ${utils.escapeHtml(item.label)}
            </a>`;
        }
      });
    }

    if (info.anonymail) {
      socialEl.innerHTML += `
        <a href="${utils.escapeHtml(info.anonymail)}" target="_blank" rel="noopener" class="anonymail">
          匿名信
        </a>`;
    }

    let html = "";

    if (info.show_playlist !== false && state.playlistData.items.length) {
      const playlistTitle = utils.escapeHtml(playlist.title || "推荐歌单");
      const playlistDescription = playlist.description
        ? `<p class="playlist-desc">${utils.escapeHtml(playlist.description)}</p>`
        : "";

      html += `
<div class="card section-anchor" id="section-playlist">
  <h2>${playlistTitle}</h2>
  <div class="playlist-filters">
    <div class="search-box">
      <input type="text" id="song-search" class="search-input" placeholder="搜索歌名/歌手/曲风/备注..." oninput="filterSongs()">
      <button class="search-clear" onclick="clearSearch()">✕</button>
    </div>
    <div class="filter-group">
      <select id="filter-language" class="filter-select" onchange="filterSongs()">
        <option value="">全部语言</option>
      </select>
      <select id="filter-genre" class="filter-select" onchange="filterSongs()">
        <option value="">全部曲风</option>
      </select>
      <select id="filter-access" class="filter-select" onchange="filterSongs()">
        <option value="">全部权限</option>
      </select>
    </div>
    <div class="playlist-controls">
      <div class="view-toggle">
        <button class="view-btn" data-view="list" onclick="switchView('list')">列表</button>
        <button class="view-btn active" data-view="grid" onclick="switchView('grid')">卡片</button>
      </div>
      <button class="random-btn" onclick="playRandom()">随机选歌</button>
    </div>
  </div>
  ${playlistDescription}
  <ul class="playlist grid-view" id="playlist-container">
    ${template.playlist.renderPlaylist(state.playlistData.items, "grid")}
  </ul>
  <p id="search-result-tip" class="search-tip" style="display:none;"></p>
</div>`;
    }

    if (info.bio) {
      html += `
<div class="card section-anchor" id="section-bio">
  <h2>关于我</h2>
  <div class="bio" id="bio-content">加载中…</div>
</div>`;
    }

    document.getElementById("content").innerHTML = html;

    if (state.playlistData.items.length && document.getElementById("playlist-container")) {
      template.playlist.populateFilterOptions(state.playlistData.items);
      template.playlist.bindPlaylistInteractions();
      template.playlist.restorePlaylistView();
    }

    updateSectionNavVisibility();
  }

  async function renderBio(state) {
    if (!state.info?.bio) return;

    try {
      const markdown = await template.loaders.loadBioMarkdown(state);
      const html = typeof marked === "undefined" ? markdown : marked.parse(markdown);
      const safeHtml = utils.sanitizeRenderedHtml(html);
      document.getElementById("bio-content").innerHTML = `<div class="bio-content">${safeHtml}</div>`;
    } catch (error) {
      const bioCard = document.getElementById("section-bio");
      if (bioCard) bioCard.remove();
      updateSectionNavVisibility();
    }
  }

  template.render = {
    renderBio,
    renderDefaultTemplate,
    renderLoadError,
    renderMissingSubdomain,
    updateSectionNavVisibility,
  };
})();
