(() => {
  let installPrompt = null;

  window.addEventListener("beforeinstallprompt", event => {
    event.preventDefault();
    installPrompt = event;
  });

  const bar = document.querySelector(".utility-bar");
  if (bar) {
    const button = document.createElement("button");
    button.id = "lume-install";
    button.type = "button";
    button.textContent = "App installieren";
    bar.append(button);

    button.addEventListener("click", async () => {
      if (
        window.matchMedia("(display-mode: standalone)").matches ||
        navigator.standalone
      ) {
        window.alert("Lume ist bereits als Web-App geöffnet.");
        return;
      }
      if (installPrompt) {
        const prompt = installPrompt;
        installPrompt = null;
        try {
          await prompt.prompt();
          await prompt.userChoice;
        } catch {
          window.alert("Bitte die Installationsoption im Browsermenü verwenden.");
        }
        return;
      }
      const appleMobile = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
        (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
      window.alert(appleMobile
        ? "In Safari: Teilen → Zum Home-Bildschirm. " +
          "Falls angeboten: „Als Web-App öffnen“ aktivieren."
        : "Im Browsermenü „App installieren“ oder " +
          "„Zum Dock hinzufügen“ wählen, sofern verfügbar.");
    });
  }

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("/lume-sw.js", {
      scope: "/",
      updateViaCache: "none"
    }).catch(error => {
      console.warn("Lume offline support unavailable:", error.message);
    });
  }
})();
