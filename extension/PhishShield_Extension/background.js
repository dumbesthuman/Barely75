// Store information about each tab's state
const tabStates = new Map(); // { tabId: { domain: string, previousUrl: string } }
const MAX_HISTORY_ITEMS = 10; // Maximum number of scan history items to keep

const extensionAPI = typeof browser !== "undefined" ? browser : chrome;
const lastScanByTab = new Map(); // { tabId: lastScannedUrl }

// Blockchain settings (fill in your deployed address)
const PHISHING_REGISTRY_ADDRESS = "0x9E02EFB0D734f38756F7cc03E20FA13c7D073f2f";
const SEPOLIA_RPC_URLS = [
  "https://ethereum-sepolia-rpc.publicnode.com",
  "https://rpc.sepolia.org",
  "https://rpc2.sepolia.org"
];

const PHISHING_REGISTRY_ABI = [
  "function reportURL(bytes32 urlHash) external",
  "function isPhishing(bytes32 urlHash) external view returns (bool)",
  "function getReportCount(bytes32 urlHash) external view returns (uint256)"
];

const SEPOLIA_CHAIN_ID_HEX = "0xaa36a7";
const SEPOLIA_PARAMS = {
  chainId: "0xaa36a7",
  chainName: "Sepolia",
  nativeCurrency: { name: "Sepolia ETH", symbol: "SEP", decimals: 18 },
  rpcUrls: ["https://rpc.sepolia.org"],
  blockExplorerUrls: ["https://sepolia.etherscan.io"]
};

let readProvider = null;
let writeProvider = null;
let signer = null;
let registryRead = null;
let registryWrite = null;
let activeReadRpc = null;

function withTimeout(promise, ms, label) {
  let timeoutId = null;
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`${label} timed out after ${ms}ms`));
    }, ms);
  });

  return Promise.race([
    promise.finally(() => clearTimeout(timeoutId)),
    timeoutPromise
  ]);
}

async function createWorkingReadProvider() {
  let lastError = null;

  for (const rpcUrl of SEPOLIA_RPC_URLS) {
    try {
      const candidate = new ethers.JsonRpcProvider(rpcUrl);
      await withTimeout(candidate.getNetwork(), 4500, `RPC probe ${rpcUrl}`);
      activeReadRpc = rpcUrl;
      return candidate;
    } catch (err) {
      lastError = err;
      console.warn("Sepolia RPC probe failed:", rpcUrl, err.message || err);
    }
  }

  throw new Error(
    `All Sepolia RPC endpoints failed${lastError ? `: ${lastError.message || lastError}` : ""}`
  );
}

function buildReportTxData(rawUrl) {
  if (!isEthersAvailable()) {
    throw new Error("ethers.js not loaded");
  }
  const selector = ethers.id("reportURL(bytes32)").slice(0, 10);
  const urlHash = hashUrl(rawUrl);
  return {
    urlHash,
    data: selector + urlHash.slice(2)
  };
}

function normalizeUrl(rawUrl) {
  try {
    const u = new URL(rawUrl);
    const host = u.hostname.toLowerCase();
    const path = (u.pathname || "/").replace(/\/+$/, "") || "/";
    return host + path;
  } catch (e) {
    return String(rawUrl || "").trim().toLowerCase();
  }
}

function isEthersAvailable() {
  return typeof ethers !== "undefined";
}

function hashUrl(rawUrl) {
  if (!isEthersAvailable()) {
    throw new Error("ethers.js not loaded. Add libs/ethers.umd.min.js");
  }
  const normalized = normalizeUrl(rawUrl);
  return ethers.keccak256(ethers.toUtf8Bytes(normalized));
}

async function initReadContract() {
  if (registryRead) return;
  if (!isEthersAvailable()) {
    throw new Error("ethers.js not loaded");
  }
  if (!PHISHING_REGISTRY_ADDRESS || PHISHING_REGISTRY_ADDRESS.includes("PASTE_")) {
    throw new Error("Set PHISHING_REGISTRY_ADDRESS in background.js");
  }

  readProvider = await createWorkingReadProvider();
  registryRead = new ethers.Contract(
    PHISHING_REGISTRY_ADDRESS,
    PHISHING_REGISTRY_ABI,
    readProvider
  );
}

async function connectMetaMask() {
  if (typeof window === "undefined" || !window.ethereum) {
    throw new Error("MetaMask provider is not available in background context");
  }
  if (!isEthersAvailable()) {
    throw new Error("ethers.js not loaded");
  }

  writeProvider = new ethers.BrowserProvider(window.ethereum);
  await window.ethereum.request({ method: "eth_requestAccounts" });

  const chainIdHex = (typeof SEPOLIA_CHAIN_ID_HEX === "string" && SEPOLIA_CHAIN_ID_HEX) ? SEPOLIA_CHAIN_ID_HEX : "0xaa36a7";
  const chainParams = (typeof SEPOLIA_PARAMS === "object" && SEPOLIA_PARAMS)
    ? SEPOLIA_PARAMS
    : {
        chainId: "0xaa36a7",
        chainName: "Sepolia",
        nativeCurrency: { name: "Sepolia ETH", symbol: "SEP", decimals: 18 },
        rpcUrls: ["https://ethereum-sepolia-rpc.publicnode.com"],
        blockExplorerUrls: ["https://sepolia.etherscan.io"]
      };

  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: chainIdHex }]
    });
  } catch (switchError) {
    if (switchError && switchError.code === 4902) {
      await window.ethereum.request({
        method: "wallet_addEthereumChain",
        params: [chainParams]
      });
    } else {
      throw switchError;
    }
  }

  signer = await writeProvider.getSigner();
  registryWrite = new ethers.Contract(
    PHISHING_REGISTRY_ADDRESS,
    PHISHING_REGISTRY_ABI,
    signer
  );
}

async function isPhishingOnChain(url) {
  try {
    await initReadContract();
    const urlHash = hashUrl(url);
    return await withTimeout(registryRead.isPhishing(urlHash), 5000, "isPhishing on-chain call");
  } catch (error) {
    console.warn("On-chain phishing check failed:", error.message || error);
    // Reset read provider so next call can retry with another RPC endpoint.
    readProvider = null;
    registryRead = null;
    activeReadRpc = null;
    return false;
  }
}

async function reportURLOnChain(url) {
  if (!registryWrite) {
    await connectMetaMask();
  }
  const urlHash = hashUrl(url);
  const tx = await registryWrite.reportURL(urlHash);
  await tx.wait();
  return tx.hash;
}

function isSupportedPage(url) {
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.protocol === "http:" || parsedUrl.protocol === "https:";
  } catch (e) {
    return false;
  }
}

function executeTabScript(tabId, code) {
  return new Promise((resolve, reject) => {
    try {
      extensionAPI.tabs.executeScript(tabId, { code }, () => {
        const lastError = extensionAPI.runtime && extensionAPI.runtime.lastError;
        if (lastError) {
          reject(new Error(lastError.message));
          return;
        }
        resolve();
      });
    } catch (error) {
      reject(error);
    }
  });
}

// Get the domain name from a URL
function getDomain(url) {
  try {
    return new URL(url).hostname;
  } catch (e) {
    return url;
  }
}

// Save the scan result to browser's local storage
function storeScanHistory(result) {
  chrome.storage.local.get(["scanHistory"], (res) => {
    const history = res.scanHistory || [];
    history.unshift({
      url: result.url,
      isPhishing: result.isPhishing,
      timestamp: new Date().toLocaleString(),
      reported: false
    });
    
    // Keep only the last 10 items
    if (history.length > MAX_HISTORY_ITEMS) {
      history.pop();
    }
    
    chrome.storage.local.set({ scanHistory: history });
  });
}

// Show a warning or safe popup on the webpage
function injectPopup(tabId, url, isPhishing, isSamePage = false) {
  if (!isSupportedPage(url)) {
    return;
  }

  const hostname = new URL(url).hostname;

  if (isPhishing) {
    // Create and show phishing warning popup
    const popupHTML = `
      <style>
        #phishing-warning-popup.phishshield-alert {
          position: fixed;
          top: 18px;
          right: 18px;
          width: min(420px, calc(100vw - 28px));
          color: #fff;
          z-index: 2147483646;
          border-radius: 14px;
          border: 1px solid rgba(255, 205, 205, 0.35);
          background: linear-gradient(140deg, #6b0f1a, #ad1d2d 55%, #cf2f37);
          box-shadow: 0 20px 40px rgba(61, 10, 20, 0.45);
          font-family: "Segoe UI", Roboto, Arial, sans-serif;
          overflow: hidden;
          animation: phishShieldSlideIn 220ms ease-out;
        }
        #phishing-warning-popup .ps-head {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 10px;
          padding: 14px 14px 10px;
          background: rgba(0, 0, 0, 0.15);
        }
        #phishing-warning-popup .ps-title {
          margin: 0;
          font-size: 16px;
          letter-spacing: 0.02em;
        }
        #phishing-warning-popup .ps-chip {
          margin-top: 5px;
          display: inline-block;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          padding: 3px 8px;
          border-radius: 999px;
          border: 1px solid rgba(255, 255, 255, 0.34);
          background: rgba(255, 255, 255, 0.13);
        }
        #phishing-warning-popup .ps-body {
          padding: 12px 14px 14px;
        }
        #phishing-warning-popup .ps-text {
          margin: 0;
          line-height: 1.45;
          color: rgba(255, 255, 255, 0.94);
          font-size: 13px;
        }
        #phishing-warning-popup .ps-domain {
          margin-top: 10px;
          font-size: 12px;
          font-weight: 700;
          color: #ffe7e7;
          word-break: break-all;
        }
        #phishing-warning-popup .ps-actions {
          margin-top: 14px;
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        #phishing-warning-popup .ps-btn {
          border: 0;
          cursor: pointer;
          padding: 8px 12px;
          border-radius: 9px;
          font-size: 12px;
          font-weight: 700;
        }
        #phishing-warning-popup .ps-btn.primary {
          background: #fff;
          color: #a61b29;
        }
        #phishing-warning-popup .ps-btn.ghost {
          border: 1px solid rgba(255, 255, 255, 0.35);
          background: rgba(255, 255, 255, 0.08);
          color: #fff;
        }
        #phishing-warning-popup #close-popup-btn {
          border: 0;
          color: #fff;
          cursor: pointer;
          width: 30px;
          height: 30px;
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.16);
          font-size: 18px;
          line-height: 1;
        }
        @keyframes phishShieldSlideIn {
          from { opacity: 0; transform: translateY(-8px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      </style>
      <div id="phishing-warning-popup" class="phishshield-alert" role="alert" aria-live="assertive">
        <div class="ps-head">
          <div>
            <h3 class="ps-title">Potential Phishing Detected</h3>
            <span class="ps-chip">High Risk</span>
          </div>
          <button id="close-popup-btn" aria-label="Close warning">×</button>
        </div>
        <div class="ps-body">
          <p class="ps-text">This page matched phishing indicators. Do not enter passwords or payment details until verified.</p>
          <div class="ps-domain">${hostname}</div>
          <div class="ps-actions">
            <button id="close-tab-btn" class="ps-btn primary">Close Tab</button>
            <button id="report-btn" class="ps-btn ghost">Report Site</button>
          </div>
        </div>
      </div>
    `;

    const script = `
      (() => {
        const html = ${JSON.stringify(popupHTML)};
        const existingPopup = document.getElementById('phishing-warning-popup');
        if (existingPopup) existingPopup.remove();

        if (!document.body) return;

        const popup = document.createElement('div');
        popup.innerHTML = html;
        document.body.appendChild(popup);

        const closePopupBtn = document.getElementById('close-popup-btn');
        if (closePopupBtn) {
          closePopupBtn.addEventListener('click', () => {
            popup.remove();
          });
        }

        const closeTabBtn = document.getElementById('close-tab-btn');
        if (closeTabBtn) {
          closeTabBtn.addEventListener('click', () => {
            (typeof browser !== 'undefined' ? browser : chrome).runtime.sendMessage({ action: 'closeTab' });
          });
        }

        const reportBtn = document.getElementById('report-btn');
        if (reportBtn) {
          reportBtn.addEventListener('click', async () => {
            reportBtn.disabled = true;
            reportBtn.textContent = 'Reporting...';

            try {
              const api = (typeof browser !== 'undefined' ? browser : chrome);
              const payload = await api.runtime.sendMessage({
                action: 'getReportPayload',
                url: window.location.href
              });

              if (!payload || !payload.ok) {
                throw new Error((payload && payload.error) || 'Failed to build transaction payload');
              }

              const chainIdHex = '0xaa36a7';
              const chainParams = {
                chainId: '0xaa36a7',
                chainName: 'Sepolia',
                nativeCurrency: { name: 'Sepolia ETH', symbol: 'SEP', decimals: 18 },
                rpcUrls: ['https://ethereum-sepolia-rpc.publicnode.com'],
                blockExplorerUrls: ['https://sepolia.etherscan.io']
              };
              const registryAddress = '0x9E02EFB0D734f38756F7cc03E20FA13c7D073f2f';

              const bridgeRequestId = 'phishshield_' + Date.now() + '_' + Math.random().toString(16).slice(2);
              const txHash = await new Promise((resolve, reject) => {
                let settled = false;
                const timeoutId = setTimeout(() => {
                  if (settled) return;
                  settled = true;
                  window.removeEventListener('message', onBridgeMessage);
                  reject(new Error('MetaMask bridge timed out'));
                }, 45000);

                const onBridgeMessage = (event) => {
                  if (event.source !== window) return;
                  const msg = event.data || {};
                  if (msg.type !== 'PHISHSHIELD_MM_RESPONSE' || msg.requestId !== bridgeRequestId) {
                    return;
                  }

                  if (settled) return;
                  settled = true;
                  clearTimeout(timeoutId);
                  window.removeEventListener('message', onBridgeMessage);

                  if (msg.ok) {
                    resolve(msg.txHash);
                  } else {
                    reject(new Error(msg.error || 'Unknown MetaMask bridge error'));
                  }
                };

                window.addEventListener('message', onBridgeMessage);

                const bridgeScript = document.createElement('script');
                const requestIdLiteral = JSON.stringify(bridgeRequestId);
                const txDataLiteral = JSON.stringify(payload.data);
                bridgeScript.textContent = [
                  '(async () => {',
                  '  const requestId = ' + requestIdLiteral + ';',
                  '  try {',
                  '    const provider = window.ethereum;',
                  "    if (!provider || typeof provider.request !== 'function') {",
                  "      throw new Error('MetaMask provider not available on this webpage context');",
                  '    }',
                  "    const accounts = await provider.request({ method: 'eth_requestAccounts' });",
                  '    const from = Array.isArray(accounts) && accounts.length ? accounts[0] : null;',
                  "    if (!from) throw new Error('No wallet account selected in MetaMask');",
                  '    try {',
                  '      await provider.request({',
                  "        method: 'wallet_switchEthereumChain',",
                  '        params: [{ chainId: ' + JSON.stringify(chainIdHex) + ' }]',
                  '      });',
                  '    } catch (switchError) {',
                  '      if (switchError && switchError.code === 4902) {',
                  '        await provider.request({',
                  "          method: 'wallet_addEthereumChain',",
                  '          params: [' + JSON.stringify(chainParams) + ']',
                  '        });',
                  '      } else {',
                  '        throw switchError;',
                  '      }',
                  '    }',
                  '    const txHash = await provider.request({',
                  "      method: 'eth_sendTransaction',",
                  '      params: [{ from, to: ' + JSON.stringify(registryAddress) + ', data: ' + txDataLiteral + ' }]',
                  '    });',
                  "    window.postMessage({ type: 'PHISHSHIELD_MM_RESPONSE', requestId, ok: true, txHash }, '*');",
                  '  } catch (error) {',
                  "    window.postMessage({ type: 'PHISHSHIELD_MM_RESPONSE', requestId, ok: false, error: (error && error.message) ? error.message : String(error) }, '*');",
                  '  }',
                  '})();'
                ].join('\\n');

                (document.documentElement || document.head || document.body).appendChild(bridgeScript);
                bridgeScript.remove();
              });

              if (txHash) {
                reportBtn.textContent = 'Reported on-chain';
                reportBtn.title = txHash;
              } else {
                reportBtn.disabled = false;
                reportBtn.textContent = 'Report Site';
                alert('On-chain report failed: No transaction hash returned');
              }
            } catch (err) {
              reportBtn.disabled = false;
              reportBtn.textContent = 'Report Site';
              alert('On-chain report failed: ' + (err && err.message ? err.message : err));
            }
          });
        }
      })();
    `;

    executeTabScript(tabId, script).catch((error) => {
      console.error('Failed to inject phishing popup:', error);
    });
  } else if (isSamePage) {
    // Create and show same page indicator
    const samePageHTML = `
      <style>
        #same-page-indicator.ps-mini-note {
          position: fixed;
          top: 18px;
          right: 18px;
          z-index: 2147483645;
          border-radius: 12px;
          border: 1px solid rgba(192, 230, 255, 0.6);
          background: linear-gradient(120deg, #0f4a79, #1f79bb);
          color: #fff;
          font-family: "Segoe UI", Roboto, Arial, sans-serif;
          box-shadow: 0 12px 24px rgba(20, 84, 133, 0.35);
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 9px 11px;
          animation: phishShieldSlideIn 180ms ease-out, phishShieldFadeOut 5s forwards;
        }
        #same-page-indicator .mini-tag {
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          opacity: 0.92;
        }
        #same-page-indicator #close-samepage-btn {
          margin-left: 4px;
          border: 0;
          color: #fff;
          background: rgba(255, 255, 255, 0.16);
          width: 24px;
          height: 24px;
          border-radius: 7px;
          cursor: pointer;
          line-height: 1;
        }
        @keyframes phishShieldFadeOut {
          0% { opacity: 1; }
          80% { opacity: 1; }
          100% { opacity: 0; }
        }
      </style>
      <div id="same-page-indicator" class="ps-mini-note" role="status" aria-live="polite">
        <span>↻</span>
        <span class="mini-tag">Same Domain Checked</span>
        <button id="close-samepage-btn" aria-label="Close status">×</button>
      </div>
    `;

    const script = `
      (() => {
        const html = ${JSON.stringify(samePageHTML)};
        const existingPopup = document.getElementById('phishing-warning-popup');
        const existingTick = document.getElementById('safe-url-indicator');
        const existingSamePage = document.getElementById('same-page-indicator');
        if (existingPopup) existingPopup.remove();
        if (existingTick) existingTick.remove();
        if (existingSamePage) existingSamePage.remove();

        if (!document.body) return;

        const indicator = document.createElement('div');
        indicator.innerHTML = html;
        document.body.appendChild(indicator);

        const closeSamePageBtn = document.getElementById('close-samepage-btn');
        if (closeSamePageBtn) {
          closeSamePageBtn.addEventListener('click', () => {
            indicator.remove();
          });
        }

        setTimeout(() => {
          indicator.remove();
        }, 5000);
      })();
    `;

    executeTabScript(tabId, script).catch((error) => {
      console.error('Failed to inject same-page indicator:', error);
    });
  } else {
    // Create and show safe URL indicator
    const tickHTML = `
      <style>
        #safe-url-indicator.ps-safe-note {
          position: fixed;
          top: 18px;
          right: 18px;
          z-index: 2147483645;
          width: min(320px, calc(100vw - 28px));
          border-radius: 12px;
          border: 1px solid #9fd9c2;
          background: linear-gradient(125deg, #0e724d, #1da36f);
          color: #fff;
          box-shadow: 0 14px 30px rgba(15, 110, 73, 0.3);
          font-family: "Segoe UI", Roboto, Arial, sans-serif;
          animation: phishShieldSlideIn 180ms ease-out, phishShieldFadeOut 5s forwards;
          overflow: hidden;
        }
        #safe-url-indicator .safe-wrap {
          padding: 10px 11px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
        }
        #safe-url-indicator .safe-label {
          display: flex;
          align-items: center;
          gap: 7px;
          font-weight: 700;
          font-size: 13px;
        }
        #safe-url-indicator .safe-actions {
          display: flex;
          align-items: center;
          gap: 5px;
        }
        #safe-url-indicator .safe-btn {
          border: 0;
          cursor: pointer;
          border-radius: 7px;
          font-size: 11px;
          font-weight: 700;
          padding: 5px 8px;
          color: #0f6a48;
          background: #fff;
        }
        #safe-url-indicator #close-tick-btn {
          border: 0;
          color: #fff;
          background: rgba(255, 255, 255, 0.16);
          width: 24px;
          height: 24px;
          border-radius: 7px;
          cursor: pointer;
          line-height: 1;
        }
      </style>
      <div id="safe-url-indicator" class="ps-safe-note" role="status" aria-live="polite">
        <div class="safe-wrap">
          <div class="safe-label"><span>✓</span><span>No phishing signals found</span></div>
          <div class="safe-actions">
            <button id="report-safe-btn" class="safe-btn">Report</button>
            <button id="close-tick-btn" aria-label="Close status">×</button>
          </div>
        </div>
      </div>
    `;

    const script = `
      (() => {
        const html = ${JSON.stringify(tickHTML)};
        const existingPopup = document.getElementById('phishing-warning-popup');
        const existingTick = document.getElementById('safe-url-indicator');
        const existingSamePage = document.getElementById('same-page-indicator');
        if (existingPopup) existingPopup.remove();
        if (existingTick) existingTick.remove();
        if (existingSamePage) existingSamePage.remove();

        if (!document.body) return;

        const tick = document.createElement('div');
        tick.innerHTML = html;
        document.body.appendChild(tick);

        const closeTickBtn = document.getElementById('close-tick-btn');
        if (closeTickBtn) {
          closeTickBtn.addEventListener('click', () => {
            tick.remove();
          });
        }

        const reportSafeBtn = document.getElementById('report-safe-btn');
        if (reportSafeBtn) {
          reportSafeBtn.addEventListener('click', () => {
            window.open('https://safebrowsing.google.com/safebrowsing/report_phish/?url=' + encodeURIComponent(window.location.href), '_blank');
          });
        }

        setTimeout(() => {
          tick.remove();
        }, 5000);
      })();
    `;

    executeTabScript(tabId, script).catch((error) => {
      console.error('Failed to inject safe indicator:', error);
    });
  }
}

// Main function to check if a URL is phishing
async function checkForPhishing(url, tabId, isReload = false) {
  try {
    if (!isSupportedPage(url)) {
      return {
        url,
        isPhishing: false,
        skipped: true,
        timestamp: new Date().toLocaleString()
      };
    }

    const domain = getDomain(url);
    const tabState = tabStates.get(tabId);
    
    // ===================================================
    // SAME DOMAIN CHECK LOGIC
    // ===================================================
    // Get the most recent scan from history
    const history = await new Promise((resolve) => {
      chrome.storage.local.get(["scanHistory"], (res) => {
        resolve(res.scanHistory || []);
      });
    });

    // If we have scan history
    if (history.length > 0) {
      // Get the domain from the most recent scan
      const mostRecentDomain = getDomain(history[0].url);
      
      // If the current domain matches the most recently scanned domain
      if (mostRecentDomain === domain) {
        const chainPhishing = await isPhishingOnChain(url);
        const finalCachedDecision = Boolean(history[0].isPhishing) || chainPhishing;

        // If this is a reload, show the same indicator as before
        if (isReload) {
          injectPopup(tabId, url, finalCachedDecision, false);
        }
        
        // Update tab state
        tabStates.set(tabId, {
          domain: domain,
          previousUrl: url
        });
        
        return {
          ...history[0],
          isPhishing: finalCachedDecision,
          chainPhishing
        };
      }
    }
    // ===================================================

    // List of trusted websites that we don't need to check
    const trustedDomains = [
      'google.com',
      'openai.com',
      'chatgpt.com',
      'chat.openai.com',
      'microsoft.com',
      'github.com',
      'stackoverflow.com',
      'linkedin.com',
      'facebook.com',
      'twitter.com',
      'youtube.com',
      'amazon.com',
      'netflix.com',
      'spotify.com',
      'reddit.com',
      'wikipedia.org',
      'medium.com',
      'quora.com',
      'dropbox.com',
      'slack.com',
      'discord.com',
      'zoom.us',
      'mozilla.org',
      'apple.com',
      'adobe.com',
      'cloudflare.com'
    ];

    // If domain is trusted, mark it as safe
    const isTrusted = trustedDomains.some(trustedDomain => domain.includes(trustedDomain));
    const chainPhishingTrusted = await isPhishingOnChain(url);
    if (isTrusted && !chainPhishingTrusted) {
      const result = {
        url,
        isPhishing: false,
        aiPhishing: false,
        chainPhishing: false,
        timestamp: new Date().toLocaleString()
      };
      
      // Save result and show safe indicator
      storeScanHistory(result);
      injectPopup(tabId, url, false, false);
      
      return result;
    }

    // Check URL using ML model, but do not fail the whole scan if API is unavailable.
    let aiPhishing = false;
    let aiCheckError = null;
    try {
      const response = await fetch("https://phishshield-11y5.onrender.com/predict_url", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: url }),
      });

      if (!response.ok) {
        throw new Error(`Status ${response.status}`);
      }

      const data = await response.json();
      aiPhishing = data.prediction === 0;
    } catch (modelError) {
      aiCheckError = modelError;
      console.warn("AI phishing check failed, continuing with on-chain fallback:", modelError.message || modelError);
    }

    const chainPhishing = await isPhishingOnChain(url);

    let reportTxHash = null;
    if (aiPhishing) {
      try {
        reportTxHash = await reportURLOnChain(url);
      } catch (reportError) {
        console.warn("On-chain report failed:", reportError.message || reportError);
      }
    }

    const isPhishing = aiPhishing || chainPhishing;

    // Update tab information
    tabStates.set(tabId, {
      domain: domain,
      previousUrl: url
    });
    
    // Create result object
    const result = {
      url,
      isPhishing,
      aiPhishing,
      chainPhishing,
      aiCheckError: aiCheckError ? (aiCheckError.message || String(aiCheckError)) : null,
      reportTxHash,
      timestamp: new Date().toLocaleString()
    };

    // Save result and show appropriate popup
    storeScanHistory(result);
    injectPopup(tabId, url, isPhishing, false);

    return result;
  } catch (error) {
    console.error("Scan error:", error);
    const fallbackResult = {
      url,
      isPhishing: false,
      aiPhishing: false,
      chainPhishing: false,
      error: error.message,
      timestamp: new Date().toLocaleString()
    };

    // Keep UI responsive even when scan flow throws unexpectedly.
    try {
      storeScanHistory(fallbackResult);
      injectPopup(tabId, url, false, false);
    } catch (uiError) {
      console.error("Fallback popup inject failed:", uiError);
    }

    return fallbackResult;
  }
}

// Function to limit how often we check URLs
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Create a debounced version of checkForPhishing
const debouncedCheck = debounce(checkForPhishing, 500);

function scheduleScan(url, tabId, isReload = false) {
  if (!isSupportedPage(url)) return;

  const previous = lastScanByTab.get(tabId);
  if (previous === url && !isReload) {
    return;
  }

  lastScanByTab.set(tabId, url);
  debouncedCheck(url, tabId, isReload);
}

// Watch for when user navigates to a new page
chrome.webNavigation.onCommitted.addListener((details) => {
  if (details.frameId === 0) { // Only check main page, not iframes
    const isReload = details.transitionType === 'reload';
    scheduleScan(details.url, details.tabId, isReload);
  }
});

// Extra trigger for pages that don't reliably fire committed-based checks.
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab && tab.url) {
    const isReload = Boolean(changeInfo.url === undefined);
    scheduleScan(tab.url, tabId, isReload);
  }
});

// Watch for when user switches to a different tab
chrome.tabs.onActivated.addListener((activeInfo) => {
  chrome.tabs.get(activeInfo.tabId, (tab) => {
    if (tab.url) {
      scheduleScan(tab.url, activeInfo.tabId, false);
    }
  });
});

// Clean up when a tab is closed
chrome.tabs.onRemoved.addListener((tabId) => {
  tabStates.delete(tabId);
  lastScanByTab.delete(tabId);
});

// Handle messages from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getCurrentStatus") {
    // Send current URL status to popup
    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
      const url = tabs[0].url;
      const result = await checkForPhishing(url, tabs[0].id, false);
      sendResponse(result);
    });
    return true;
  } else if (request.action === "getHistory") {
    // Send scan history to popup
    chrome.storage.local.get(["scanHistory"], (res) => {
      sendResponse(res.scanHistory || []);
    });
    return true;
  } else if (request.action === "connectWallet") {
    (async () => {
      try {
        await connectMetaMask();
        sendResponse({ ok: true });
      } catch (error) {
        sendResponse({ ok: false, error: error.message });
      }
    })();
    return true;
  } else if (request.action === "getReportPayload") {
    (async () => {
      try {
        if (!request.url) {
          throw new Error("Missing URL for on-chain report payload");
        }
        const payload = buildReportTxData(request.url);
        sendResponse({ ok: true, ...payload });
      } catch (error) {
        sendResponse({ ok: false, error: error.message || String(error) });
      }
    })();
    return true;
  } else if (request.action === "reportOnChain") {
    (async () => {
      try {
        if (!request.url) {
          throw new Error("Missing URL for on-chain report");
        }
        const txHash = await reportURLOnChain(request.url);
        sendResponse({ ok: true, txHash });
      } catch (error) {
        sendResponse({ ok: false, error: error.message || String(error) });
      }
    })();
    return true;
  } else if (request.action === "closeTab") {
    if (sender && sender.tab && typeof sender.tab.id === "number") {
      chrome.tabs.remove(sender.tab.id);
    }
  }
});

// Clean up tab states every 30 minutes
setInterval(() => {
  tabStates.clear();
}, 30 * 60 * 1000);

// Log when the extension starts
console.log("Phishing Detector background script started"); 