(function () {
  const template = (window.SukiTemplate = window.SukiTemplate || {});

  function extractBiliMid(url) {
    if (!url) return null;
    const cleanUrl = url.trim();

    const patterns = [/space\.bilibili\.com\/(\d+)/, /bilibili\.com\/space\/(\d+)/, /mid[=:](\d+)/];
    for (const pattern of patterns) {
      const match = cleanUrl.match(pattern);
      if (match?.[1]) return match[1];
    }

    return null;
  }

  function fetchBiliStats(mid) {
    const statsEl = document.getElementById("bili-stats");
    if (!mid || !statsEl) {
      if (statsEl) statsEl.style.display = "none";
      return;
    }

    const workerProxy = "https://suki-live.sunnycherry2023.workers.dev/?url=";
    const fmt = (num) => (num != null ? Number(num).toLocaleString("zh-CN") : "-");

    fetch(`${workerProxy}${encodeURIComponent(`https://api.bilibili.com/x/relation/stat?vmid=${mid}`)}`)
      .then(async (response) => {
        if (!response.ok) throw new Error("Failed");
        return JSON.parse(await response.text());
      })
      .then((payload) => {
        const data = payload?.data;
        if (!data) {
          statsEl.style.display = "none";
          return;
        }

        statsEl.style.display = "flex";

        if (data.follower !== undefined) {
          document.getElementById("stat-follower").textContent = fmt(data.follower);
          document.getElementById("stat-follower").classList.remove("loading");
        }

        if (data.following !== undefined) {
          document.getElementById("stat-following").textContent = fmt(data.following);
          document.getElementById("stat-following").classList.remove("loading");
        }
      })
      .catch((error) => {
        console.warn("B站数据获取失败:", error);
        statsEl.style.display = "none";
      });
  }

  function initBiliStatsFromInfo(info) {
    const statsEl = document.getElementById("bili-stats");
    if (statsEl) statsEl.style.display = "none";

    if (!info?.social || !Array.isArray(info.social)) return;

    const biliLink = info.social.find(
      (item) => item.label?.toLowerCase().includes("b站") || item.label?.toLowerCase().includes("bilibili")
    );

    if (!biliLink?.url) {
      if (statsEl) statsEl.style.display = "none";
      return;
    }

    const mid = extractBiliMid(biliLink.url);
    if (!mid) {
      console.warn("无法从链接提取 B站 UID:", biliLink.url);
      if (statsEl) statsEl.style.display = "none";
      return;
    }

    if (statsEl) statsEl.style.display = "flex";
    setTimeout(() => fetchBiliStats(mid), 300);
  }

  function tryInitBiliStatsForCustom(info) {
    if (info?.social && document.getElementById("bili-stats")) {
      setTimeout(() => initBiliStatsFromInfo(info), 500);
    }
  }

  template.bili = {
    extractBiliMid,
    fetchBiliStats,
    initBiliStatsFromInfo,
    tryInitBiliStatsForCustom,
  };
})();
