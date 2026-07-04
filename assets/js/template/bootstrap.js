(function () {
  const template = (window.SukiTemplate = window.SukiTemplate || {});

  async function bootstrap() {
    const id = template.utils.getVtuberId();
    template.state = {
      id,
      base: id ? "." : null,
      playlistData: null,
      currentRandomSong: null,
      info: null,
    };

    if (!id) {
      template.render.renderMissingSubdomain(template.state);
      return;
    }

    try {
      const payload = await template.loaders.loadPageData(template.state);
      if (!payload) return;

      template.render.renderDefaultTemplate(template.state, payload.info, payload.playlist);
      await template.render.renderBio(template.state);
      template.bili.initBiliStatsFromInfo(payload.info);
      template.backgrounds.setupHeaderBackground(payload.info);
      template.backgrounds.setupBodyBackground(payload.info);
    } catch (error) {
      console.error("Load error:", error);
      template.render.renderLoadError(template.state, error?.type);
    }
  }

  document.addEventListener("DOMContentLoaded", bootstrap);
})();
