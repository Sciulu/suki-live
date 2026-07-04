(function () {
  const template = (window.SukiTemplate = window.SukiTemplate || {});

  function setupHeaderBackground(info) {
    if (info.show_header_bg !== true) return;

    const applyHeaderBg = (url) => {
      document.documentElement.style.setProperty("--header-bg", `url(${url})`);
      const headerEl = document.querySelector(".header");
      if (headerEl) {
        headerEl.style.textShadow = "0 1px 4px rgba(0,0,0,0.25)";
        headerEl.style.color = "var(--text)";
      }
    };

    const checkImage = (url) =>
      fetch(url, { method: "HEAD" })
        .then((response) => (response.ok ? url : null))
        .catch(() => null);

    const loadHeaderBg = () => {
      const isMobile = window.innerWidth <= 640;
      const mobileUrl = `/head_bg_mobile.png?t=${Date.now()}`;
      const desktopUrl = `/head_bg.png?t=${Date.now()}`;

      if (isMobile) {
        checkImage(mobileUrl)
          .then((found) => (found ? found : checkImage(desktopUrl)))
          .then((found) => {
            if (typeof found === "string") applyHeaderBg(found);
          });
      } else {
        checkImage(desktopUrl).then((found) => {
          if (found) applyHeaderBg(found);
        });
      }
    };

    loadHeaderBg();

    let resizeTimer;
    window.addEventListener("resize", () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(loadHeaderBg, 250);
    });
  }

  function setupBodyBackground(info) {
    if (info.show_body_bg !== true) return;

    const getBgUrl = (isMobile) => {
      const mobileUrl = `/body_bg_mobile.png?t=${Date.now()}`;
      const desktopUrl = `/body_bg.png?t=${Date.now()}`;
      return isMobile ? mobileUrl : desktopUrl;
    };

    const applyBg = (url) => {
      document.body.classList.add("has-body-bg");
      document.documentElement.style.setProperty("--body-bg", `url(${url})`);
      document.documentElement.style.setProperty("--body-bg-size", "cover");
      document.documentElement.style.setProperty("--body-bg-position", "center");
    };

    const checkAndApply = (isMobile) => {
      const preferredUrl = getBgUrl(isMobile);
      const fallbackUrl = `/body_bg.png?t=${Date.now()}`;

      fetch(preferredUrl, { method: "HEAD" })
        .then((response) => {
          if (response.ok) {
            applyBg(preferredUrl);
            return null;
          }

          if (isMobile) {
            return fetch(fallbackUrl, { method: "HEAD" });
          }

          return null;
        })
        .then((response) => {
          if (response?.ok) {
            applyBg(fallbackUrl);
          }
        })
        .catch(() => {
          console.log("Body background not found");
        });
    };

    checkAndApply(window.innerWidth <= 640);

    let resizeTimer;
    window.addEventListener("resize", () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        checkAndApply(window.innerWidth <= 640);
      }, 250);
    });
  }

  template.backgrounds = {
    setupBodyBackground,
    setupHeaderBackground,
  };
})();
