class BlockManager {
  constructor() {
    this.config = null;
    this.observeDomChanges();
    this.loadConfig();
  }

  async loadConfig() {
    try {
      const cfg = await chrome.runtime.sendMessage({ type: 'GET_CONFIG' });
      if (cfg && !cfg.error) {
        this.config = cfg;
        const jsonScript = document.createElement('script');
        jsonScript.id = '__sunoBlockConfig';
        jsonScript.type = 'application/json';
        jsonScript.textContent = JSON.stringify(cfg);
        document.head.appendChild(jsonScript);

        const injectScript = document.createElement('script');
        injectScript.src = chrome.runtime.getURL('inject.js');
        document.head.appendChild(injectScript);
      }
    } catch {}
  }

  observeDomChanges() {
    const obs = new MutationObserver(() => {
      clearTimeout(window.__sunoProcessTimeout);
      window.__sunoProcessTimeout = setTimeout(() => this.processElements(), 300);
    });
    obs.observe(document.body, { childList: true, subtree: true });

    if (document.readyState !== 'loading') {
      this.processElements();
    } else {
      window.addEventListener('DOMContentLoaded', () => this.processElements());
    }
  }

  processElements() {
    if (!this.config || this.config.showUserBlockButton === false) {
      return;
    }

    const links = document.querySelectorAll(
      'a[href^="/@"], .react-aria-GridList a[href^="/@"]'
    );

    links.forEach(link => {
      if (link.dataset.sunoProcessed) return;

      // Skip injecting if the anchor <a> has an <img> as an *immediate* child (only).
      // If there's an <img> nested deeper, we still allow injection.
      const hasImmediateImgChild = Array.from(link.children)
        .some(child => child.tagName === 'IMG');
      
      if (hasImmediateImgChild) {
        return;
      }

      link.dataset.sunoProcessed = 'true';
      const handle = this.getUsernameFromUrl(link.href);
      if (handle) {
        this.injectBlockButton(link, handle);
      }
    });
  }

  injectBlockButton(el, handle) {
    const btn = document.createElement('span');
    btn.className = 'suno-block-btn';
    btn.textContent = ' 🔇';
    btn.style.cursor = 'pointer';
    
    if (el.tagName === 'A') {
      el.insertAdjacentElement('afterend', btn);
    } else {
      el.appendChild(btn);
    }
    
    btn.onclick = () => this.showBlockMenu(btn, handle);
  }

  showBlockMenu(anchor, handle) {
    const menu = document.createElement('div');
    menu.style.cssText = `
      position: absolute; background: #333; color: #fff; padding: 4px;
      border-radius: 4px; z-index: 999999; box-shadow: 0 2px 8px rgba(0,0,0,0.4);
    `;

    chrome.runtime.sendMessage({ type: 'GET_CONFIG' }, config => {
      const isBlocked = config.manualAssignments.blocked
        .map(u => u.toLowerCase())
        .includes(handle.toLowerCase());

      const item = document.createElement('div');
      item.textContent = isBlocked ? 'Unblock User' : 'Block User';
      item.style.padding = '2px 0';
      item.style.cursor = 'pointer';
      item.onmouseenter = () => (item.style.background = '#666');
      item.onmouseleave = () => (item.style.background = 'none');
      item.onclick = () => this.toggleBlock(handle, isBlocked, menu);

      menu.appendChild(item);
      document.body.appendChild(menu);

      const rect = anchor.getBoundingClientRect();
      menu.style.top = `${rect.bottom + window.scrollY + 4}px`;
      menu.style.left = `${rect.left + window.scrollX}px`;

      const clickHandler = e => {
        if (!menu.contains(e.target)) {
          menu.remove();
          document.removeEventListener('mousedown', clickHandler);
        }
      };
      document.addEventListener('mousedown', clickHandler);
    });
  }

  toggleBlock(handle, isBlocked, menu) {
    chrome.runtime.sendMessage({ type: 'GET_CONFIG' }, config => {
      const blocked = config.manualAssignments.blocked
        .filter(u => u.toLowerCase() !== handle.toLowerCase());

      if (!isBlocked) {
        blocked.push(handle.toLowerCase());
      }

      chrome.runtime.sendMessage({
        type: 'UPDATE_CONFIG',
        config: { ...config, manualAssignments: { blocked } }
      }, () => menu.remove());
    });
  }

  getUsernameFromUrl(url) {
    const m = url.match(/@([^/?]+)/);
    return m?.[1];
  }
}

new BlockManager();
