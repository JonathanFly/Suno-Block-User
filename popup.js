let extensionConfig = null;

const tabBlockedBtn = document.getElementById('tab-blocked');
const tabSettingsBtn = document.getElementById('tab-settings');

const blockedTab = document.getElementById('blocked-tab');
const settingsTab = document.getElementById('settings-tab');

const blockedUsersTextarea = document.getElementById('blocked-users-textarea');

const checkBlockSongs                  = document.getElementById('check-block-songs');
const checkBlockNotifications          = document.getElementById('check-block-notifications');
const checkShowBlockedSongCount        = document.getElementById('check-show-blocked-song-count');
const checkShowBlockedNotificationCount= document.getElementById('check-show-blocked-notification-count');
const checkShowUserBlockButton         = document.getElementById('check-show-user-block-button');
const checkShowDebugInformation        = document.getElementById('check-show-debug-information');

const saveButton = document.getElementById('save-button');

/**
 * Switches the visible tab in the popup.
 * @param {'blocked'|'settings'} tabName
 */
function switchTab(tabName) {
  if (tabName === 'blocked') {
    blockedTab.style.display = 'block';
    settingsTab.style.display = 'none';
    tabBlockedBtn.classList.add('active');
    tabSettingsBtn.classList.remove('active');
  } else {
    blockedTab.style.display = 'none';
    settingsTab.style.display = 'block';
    tabBlockedBtn.classList.remove('active');
    tabSettingsBtn.classList.add('active');
  }
}

function loadConfigIntoUI(cfg) {
  blockedUsersTextarea.value = cfg.manualAssignments.blocked.join('\n');

  checkBlockSongs.checked                   = !!cfg.blockSongs;
  checkBlockNotifications.checked           = !!cfg.blockNotifications;
  checkShowBlockedSongCount.checked         = !!cfg.showBlockedSongCount;
  checkShowBlockedNotificationCount.checked = !!cfg.showBlockedNotificationCount;
  checkShowUserBlockButton.checked          = !!cfg.showUserBlockButton;
  checkShowDebugInformation.checked         = !!cfg.showDebugInformation;
}

chrome.runtime.sendMessage({ type: 'GET_CONFIG' }, (cfg) => {
  if (cfg && !cfg.error) {
    extensionConfig = cfg;
    loadConfigIntoUI(extensionConfig);
  } else {
    console.error('Could not load config:', cfg?.error);
  }
});


function saveConfig() {
  if (!extensionConfig) return;
  
  const lines = blockedUsersTextarea.value
    .split('\n')
    .map(u => u.trim())
    .filter(u => u !== '');

  extensionConfig.manualAssignments.blocked = lines;

  extensionConfig.blockSongs                  = checkBlockSongs.checked;
  extensionConfig.blockNotifications          = checkBlockNotifications.checked;
  extensionConfig.showBlockedSongCount        = checkShowBlockedSongCount.checked;
  extensionConfig.showBlockedNotificationCount= checkShowBlockedNotificationCount.checked;
  extensionConfig.showUserBlockButton         = checkShowUserBlockButton.checked;
  extensionConfig.showDebugInformation        = checkShowDebugInformation.checked;

  chrome.runtime.sendMessage({
    type: 'UPDATE_CONFIG',
    config: extensionConfig
  }, (response) => {
    if (response && response.success) {
      console.log('Config saved successfully.');


      chrome.tabs.query({ url: "*://suno.com/*", currentWindow: true }, (tabs) => {
        const activeSunoTab = tabs.find(t => t.active);
        if (activeSunoTab) {
          chrome.tabs.reload(activeSunoTab.id);
        } else if (tabs.length > 0) {

          chrome.tabs.reload(tabs[0].id);
        }
      });
    } else {
      console.error('Failed to save config:', response?.error);

    }
  });
}


tabBlockedBtn.addEventListener('click', () => switchTab('blocked'));
tabSettingsBtn.addEventListener('click', () => switchTab('settings'));


saveButton.addEventListener('click', saveConfig);
