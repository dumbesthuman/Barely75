document.addEventListener("DOMContentLoaded", function () {
  const extensionAPI = typeof browser !== "undefined" ? browser : chrome;
  const resultDiv = document.getElementById("result");
  const loadingDiv = document.getElementById("loading");
  const historyDiv = document.getElementById("history");
  const totalCountEl = document.getElementById("totalCount");
  const safeCountEl = document.getElementById("safeCount");
  const phishCountEl = document.getElementById("phishCount");

  function updateCounters(items) {
    const total = items.length;
    const safe = items.filter((entry) => !entry.isPhishing).length;
    const phishing = total - safe;
    totalCountEl.textContent = String(total);
    safeCountEl.textContent = String(safe);
    phishCountEl.textContent = String(phishing);
  }

  function domainFromUrl(url) {
    try {
      return new URL(url).hostname;
    } catch (error) {
      return "Unknown domain";
    }
  }

  function clearElement(el) {
    while (el.firstChild) {
      el.removeChild(el.firstChild);
    }
  }

  function getSafeReasons(response, url) {
    const reasons = [];

    if (response.aiPhishing === false) {
      reasons.push("AI model did not flag this page as phishing.");
    } else if (response.aiCheckError) {
      reasons.push("AI check was unavailable, fallback checks kept this page in low risk.");
    }

    if (response.chainPhishing === false) {
      reasons.push("Blockchain reports do not currently mark this URL as phishing.");
    }

    if (url.startsWith("https://")) {
      reasons.push("This page is using HTTPS encryption.");
    }

    if (!reasons.length) {
      reasons.push("No phishing indicators were triggered in the current checks.");
    }

    return reasons;
  }

  function createWhySafePanel(response, url) {
    const panel = document.createElement("div");
    panel.className = "why-safe-panel";

    const title = document.createElement("div");
    title.className = "why-safe-title";
    title.textContent = "Why Safe";
    panel.appendChild(title);

    const list = document.createElement("ul");
    list.className = "why-safe-list";

    getSafeReasons(response, url).forEach((reason) => {
      const item = document.createElement("li");
      item.textContent = reason;
      list.appendChild(item);
    });

    panel.appendChild(list);
    return panel;
  }

  function renderCurrentError(errorMessage) {
    clearElement(resultDiv);
    const wrapper = document.createElement("div");
    wrapper.className = "status-card error";

    const title = document.createElement("div");
    title.className = "status-title";
    title.textContent = "Unable to check this page";
    wrapper.appendChild(title);

    const details = document.createElement("small");
    details.className = "status-url";
    details.textContent = String(errorMessage || "Unknown error");
    wrapper.appendChild(details);

    const meta = document.createElement("div");
    meta.className = "status-meta";

    const tag = document.createElement("span");
    tag.className = "risk-tag";
    tag.textContent = "Unverified";
    meta.appendChild(tag);

    const value = document.createElement("span");
    value.className = "risk-value";
    value.textContent = "Risk score unavailable";
    meta.appendChild(value);

    wrapper.appendChild(meta);

    resultDiv.appendChild(wrapper);
  }

  function renderCurrentStatus(response) {
    clearElement(resultDiv);
    const verdict = response.isPhishing ? "Phishing" : "Safe";
    const verdictClass = response.isPhishing ? "phishing" : "safe";
    const riskScore = response.isPhishing ? 92 : 14;

    const wrapper = document.createElement("div");
    wrapper.className = `status-card ${verdictClass}`;

    const strong = document.createElement("strong");
    strong.className = "status-title";
    strong.textContent = verdict;
    wrapper.appendChild(strong);

    const urlText = document.createElement("small");
    urlText.className = "status-url";
    const url = String(response.url || "");
    urlText.textContent = `${domainFromUrl(url)} - ${url}`;
    wrapper.appendChild(urlText);

    const meter = document.createElement("div");
    meter.className = "risk-meter";
    const fill = document.createElement("div");
    fill.className = "risk-fill";
    fill.style.width = `${riskScore}%`;
    meter.appendChild(fill);
    wrapper.appendChild(meter);

    const meta = document.createElement("div");
    meta.className = "status-meta";

    const tag = document.createElement("span");
    tag.className = "risk-tag";
    tag.textContent = response.isPhishing ? "High Risk" : "Low Risk";
    meta.appendChild(tag);

    const value = document.createElement("span");
    value.className = "risk-value";
    value.textContent = `Risk score: ${riskScore}/100`;
    meta.appendChild(value);

    wrapper.appendChild(meta);

    if (!response.isPhishing) {
      wrapper.appendChild(createWhySafePanel(response, url));
    }

    resultDiv.appendChild(wrapper);
  }

  function createHistoryEntry(entry) {
    const el = document.createElement("div");
    el.className = `history-entry ${entry.isPhishing ? "phishing" : "safe"}`;

    const topRow = document.createElement("div");
    topRow.className = "history-top";
    const verdict = document.createElement("strong");
    verdict.className = "history-label";
    verdict.textContent = entry.isPhishing ? "Phishing" : "Safe";
    topRow.appendChild(verdict);

    const reportLink = document.createElement("a");
    reportLink.className = "report-link";
    reportLink.target = "_blank";
    reportLink.rel = "noopener noreferrer";
    reportLink.textContent = "Report";
    reportLink.href =
      "https://safebrowsing.google.com/safebrowsing/report_phish/?url=" +
      encodeURIComponent(String(entry.url || ""));
    topRow.appendChild(reportLink);

    const urlDiv = document.createElement("div");
    urlDiv.className = "url";
    urlDiv.textContent = String(entry.url || "");

    const timeDiv = document.createElement("div");
    timeDiv.className = "time";
    timeDiv.textContent = `Scanned at: ${String(entry.timestamp || "")}`;

    el.appendChild(topRow);
    el.appendChild(urlDiv);
    el.appendChild(timeDiv);
    return el;
  }

  // Show loading state
  loadingDiv.style.display = "block";

  // Get current status from background script
  extensionAPI.runtime.sendMessage({ action: "getCurrentStatus" }, (response) => {
    loadingDiv.style.display = "none";
    
    if (response?.error) {
      renderCurrentError(response.error);
      return;
    }

    renderCurrentStatus(response || {});
  });

  // Load scan history
  function loadHistory() {
    extensionAPI.runtime.sendMessage({ action: "getHistory" }, (history) => {
      clearElement(historyDiv);
      const items = history || [];
      updateCounters(items);
      if (!items.length) {
        const empty = document.createElement("p");
        empty.className = "empty-history";
        empty.textContent = "No scans yet. Visit a website to start detection.";
        historyDiv.appendChild(empty);
        return;
      }

      items.forEach((entry) => {
        historyDiv.appendChild(createHistoryEntry(entry));
      });
    });
  }

  // Initial history load
  loadHistory();

  // Refresh history every 5 seconds
  setInterval(loadHistory, 5000);
});
