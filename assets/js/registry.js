(function () {
  const REGISTRY_URL = "/u/registry.json";
  const FALLBACK_AVATAR =
    "data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2264%22 height=%2264%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%23cbd5e1%22 stroke-width=%221%22%3E%3Ccircle cx=%2212%22 cy=%2212%22 r=%2210%22/%3E%3Cpath d=%22M12 16v-4M12 8h.01%22/%3E%3C/svg%3E";

  function escapeHtml(str) {
    if (!str) return "";
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function getStatusLabel(status) {
    if (status === "active") return "活跃";
    if (status === "inactive") return "停播";
    if (status === "memorial") return "纪念";
    return "封禁";
  }

  function sortVtubers(vtubers) {
    const statusOrder = {
      active: 0,
      inactive: 1,
      memorial: 2,
      banned: 3,
    };

    return [...vtubers].sort((left, right) => {
      const statusDiff = (statusOrder[left.status] ?? 99) - (statusOrder[right.status] ?? 99);
      if (statusDiff !== 0) return statusDiff;

      return (left.name || "").localeCompare(right.name || "", "zh-CN");
    });
  }

  function renderEmptyState(title, description) {
    return [
      '<div class="empty-state">',
      `  <h3>${escapeHtml(title)}</h3>`,
      `  <p>${escapeHtml(description)}</p>`,
      "</div>",
    ].join("\n");
  }

  function renderVtubers(vtubers) {
    const container = document.getElementById("vtuber-list");
    if (!container) return;

    if (!vtubers.length) {
      container.innerHTML = renderEmptyState("没有找到匹配的主播", "请尝试其他关键词，或返回首页查看注册说明。");
      return;
    }

    container.innerHTML = vtubers
      .map((vtuber) => {
        const avatarUrl = `https://${vtuber.id}.suki.live/avatar.png`;
        const statusLabel = getStatusLabel(vtuber.status);
        const statusClass = `status-${vtuber.status}`;
        const registrationMeta = vtuber.registered_at ? `<span>· 注册于 ${escapeHtml(vtuber.registered_at)}</span>` : "";

        return [
          `<a href="https://${vtuber.id}.suki.live" class="vtuber-card" target="_blank" rel="noopener">`,
          `  <img class="vtuber-avatar" src="${avatarUrl}" alt="${escapeHtml(vtuber.name)}" onerror="this.src='${FALLBACK_AVATAR}';this.onerror=null" />`,
          '  <div class="vtuber-info">',
          `    <div class="vtuber-name">${escapeHtml(vtuber.name)}</div>`,
          `    <div class="vtuber-tagline">${escapeHtml(vtuber.tagline || "暂无签名")}</div>`,
          '    <div class="vtuber-meta">',
          `      <span class="status-badge ${statusClass}">${statusLabel}</span>`,
          `      ${registrationMeta}`,
          "    </div>",
          "  </div>",
          "</a>",
        ].join("\n");
      })
      .join("\n");
  }

  function bootstrapRegistry() {
    const searchInput = document.getElementById("search-input");
    const totalCount = document.getElementById("total-count");
    const activeCount = document.getElementById("active-count");
    const updatedDate = document.getElementById("updated-date");
    const container = document.getElementById("vtuber-list");

    if (!searchInput || !totalCount || !activeCount || !updatedDate || !container) {
      return;
    }

    fetch(REGISTRY_URL)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to load registry.");
        }
        return response.json();
      })
      .then((data) => {
        const vtubers = sortVtubers(Array.isArray(data.vtubers) ? data.vtubers : []);

        totalCount.textContent = String(vtubers.length);
        activeCount.textContent = String(vtubers.filter((item) => item.status === "active").length);
        updatedDate.textContent = data.updated_at ? String(data.updated_at).slice(5) : "-";

        renderVtubers(vtubers);

        searchInput.addEventListener("input", (event) => {
          const keyword = event.target.value.toLowerCase().trim();
          const filtered = vtubers.filter((item) => {
            const haystacks = [item.name, item.tagline, item.id]
              .filter(Boolean)
              .map((value) => value.toLowerCase());
            return haystacks.some((value) => value.includes(keyword));
          });

          renderVtubers(filtered);
        });
      })
      .catch((error) => {
        console.error(error);
        container.innerHTML = [
          '<div class="empty-state">',
          "  <h3>名录暂时无法加载</h3>",
          "  <p>请稍后重试，或直接返回首页查看注册说明。</p>",
          '  <p style="margin-top: 0.8rem;"><a href="/" style="color: var(--text);">返回首页</a></p>',
          "</div>",
        ].join("\n");
      });
  }

  window.addEventListener("DOMContentLoaded", bootstrapRegistry);
})();
