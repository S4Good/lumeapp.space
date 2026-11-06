/* Topic state belongs to this visit; location and preferences are not stored. */
(() => {
  const drawer = document.getElementById("weather-drawer");
  const cockpit = drawer?.querySelector(".cockpit-top-left");
  const weather = cockpit?.querySelector(".weather-widget");
  const warnings = cockpit?.querySelector(".lume-dwd-panel");
  const water = document.getElementById("elbe-val")?.closest(".metric-box");
  const warningMetric = document.getElementById("dwd-val")?.closest(".metric-box");
  const roadsMetric = document.getElementById("corr-val")?.closest(".metric-box");
  if (!drawer || !cockpit || !window.lumeSetWeatherOpen) return;

  if (roadsMetric) {
    const overview = document.createElement("section");
    overview.className = "lume-road-overview";
    overview.setAttribute("aria-label", "Städtische Verkehrsmeldungen");
    roadsMetric.querySelector(".m-label").textContent = "Verkehr · Dresden";
    document.getElementById("lume-today-label")?.remove();
    overview.append(roadsMetric);
    document.querySelector(".nearby-panel")?.prepend(overview);
  }

  const paths = {
    roads: '<path d="M8 3 5 21M16 3l3 18M12 4v3m0 4v3m0 4v2"/>',
    weather: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"/>',
    water: '<path d="M3 16c2-3 4 3 6 0s4 3 6 0 4 3 6 0M3 21c2-3 4 3 6 0s4 3 6 0 4 3 6 0M12 2c-2 3-4 5-4 7a4 4 0 0 0 8 0c0-2-2-4-4-7Z"/>'
  };
  const state = { roads: true, weather: false, water: false };
  const toolbar = document.createElement("div");
  toolbar.className = "lume-topics";
  toolbar.setAttribute("role", "group");
  toolbar.setAttribute("aria-label", "Kartenthemen und Stadtdaten");
  const buttons = {};
  for (const [id, label, help] of [
    ["roads", "Verkehr", "Verkehrsmeldungen auf der Karte ein- oder ausblenden"],
    ["weather", "Wetter", "Wetter und amtliche DWD-Warnungen ein- oder ausblenden"],
    ["water", "Pegel", "Elbe-Pegel ein- oder ausblenden"]
  ]) {
    const button = document.createElement("button");
    button.type = "button";
    button.title = help;
    button.setAttribute("aria-label", help);
    button.setAttribute("aria-controls", id === "roads" ? "map" : "weather-drawer");
    button.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + paths[id] + '</svg><span>' + label + '</span>';
    button.addEventListener("click", event => {
      if (id !== "roads") window.lumeDrawerReturnButton = button;
      state[id] = !state[id];
      if (id === "roads" && !state.roads) window.lumeClearRoadworkSelection?.();
      render();
      if (id !== "roads" && state[id] && event.detail === 0) {
        window.lumeSetWeatherOpen(true, true);
      }
    });
    buttons[id] = button;
    toolbar.append(button);
  }
  document.body.append(toolbar);
  window.lumeDrawerReturnButton = buttons.water;

  function syncMap() {
    if (!map) return;
    const visibility = state.roads ? "visible" : "none";
    for (const id of ["roadworks-visible", "roadworks-hit", "roadworks-symbols",
      "selected-roadwork-glow", "selected-roadwork-outline", "selected-roadwork-core"]) {
      if (map.getLayer(id) && map.getLayoutProperty(id, "visibility") !== visibility) {
        map.setLayoutProperty(id, "visibility", visibility);
      }
    }
  }
  window.lumeSyncTopicMap = syncMap;
  window.lumeIsRoadsVisible = () => map ? state.roads : true;

  function render() {
    for (const id of Object.keys(buttons)) {
      buttons[id].setAttribute("aria-pressed", String(state[id]));
    }
    if (weather) weather.hidden = !state.weather;
    if (warnings) warnings.hidden = !state.weather;
    if (warningMetric) warningMetric.hidden = !state.weather;
    if (water) water.hidden = !state.water;
    const waterStatus = cockpit.querySelector(".brand-row");
    if (waterStatus) waterStatus.hidden = !state.water;
    cockpit.classList.toggle("lume-water-only", state.water && !state.weather);
    const title = drawer.querySelector(".sidebar-heading strong");
    if (title) title.textContent = state.weather && state.water
      ? "Wetter & Elbe-Pegel" : state.weather ? "Wetter & Warnungen" : "Elbe-Pegel Dresden";
    window.lumeSetWeatherOpen(state.weather || state.water);
    syncMap();
  }

  window.addEventListener("lume-drawer-state", event => {
    if (!event.detail.open) {
      state.weather = state.water = false;
      buttons.weather.setAttribute("aria-pressed", "false");
      buttons.water.setAttribute("aria-pressed", "false");
    } else if (!state.weather && !state.water) {
      // Existing Elbe shortcut opens the actual water section.
      state.water = true;
      render();
    }
  });

  const selectRoadwork = window.lumeSelectRoadwork;
  if (selectRoadwork) window.lumeSelectRoadwork = feature => {
    const found = selectRoadwork(feature);
    if (found && map) { state.roads = true; render(); }
    return found;
  };
  document.querySelector(".filter-dock .dock-btn")?.addEventListener("click", () => {
    window.lumeDrawerReturnButton = buttons.water;
    state.water = true;
    render();
  });
  document.addEventListener("keydown", event => {
    if (event.key !== "Escape" || drawer.hidden ||
        document.querySelector("dialog[open]")) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    window.lumeSetWeatherOpen(false);
    window.lumeDrawerReturnButton.focus({ preventScroll: true });
  }, true);
  if (map) {
    map.on("styledata", syncMap);
    map.on("sourcedata", syncMap);
  } else {
    state.roads = false;
    buttons.roads.disabled = true;
    buttons.roads.title = "Karte nicht verfügbar; Meldungen bleiben über die Ortssuche erreichbar.";
  }
  render();
})();
