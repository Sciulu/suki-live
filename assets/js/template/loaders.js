(function () {
  const template = (window.SukiTemplate = window.SukiTemplate || {});

  async function fetchJson(url, type) {
    const response = await fetch(url);
    if (!response.ok) throw { type };
    return response.json();
  }

  async function checkFile(url) {
    const response = await fetch(url, { method: "HEAD" }).catch(() => null);
    return Boolean(response && response.ok);
  }

  async function loadPageData(state) {
    const info = await fetchJson(`${state.base}/info.json?t=${Date.now()}`, "missing-info");

    if (info.use_custom_page === true) {
      const customUrl = `${state.base}/custom.html`;
      const exists = await checkFile(`${customUrl}?t=${Date.now()}`);
      if (!exists) throw { type: "missing-custom" };
      window.location.href = customUrl;
      return null;
    }

    if (info.show_playlist === false) {
      return { info, playlist: { items: [] } };
    }

    const playlist = await fetchJson(`${state.base}/playlist.json?t=${Date.now()}`, "missing-playlist");
    return { info, playlist };
  }

  async function loadBioMarkdown(state) {
    const response = await fetch(`${state.base}/bio.md?t=${Date.now()}`);
    if (!response.ok) throw { type: "missing-bio" };
    return response.text();
  }

  template.loaders = {
    checkFile,
    loadPageData,
    loadBioMarkdown,
  };
})();
