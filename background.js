importScripts('dexie.min.js');

const defaultConfig = {
  key: 'blocking',
  blockSongs: true,
  blockNotifications: true,
  showBlockedSongCount: false,
  showBlockedNotificationCount: false,
  showUserBlockButton: true,
  showDebugInformation: false,
  manualAssignments: { blocked: [] }
};

class ConfigDB {
  constructor() {
    this.db = new Dexie('BlockDB');
    this.db.version(1).stores({
      config: 'key'
    });
    this.initConfig();
  }

  async initConfig() {
    const exist = await this.db.config.get('blocking');

    const merged = exist ? { ...defaultConfig, ...exist } : defaultConfig;
    await this.db.config.put(merged);
  }

  async getConfig() {
    return this.db.config.get('blocking');
  }

  async updateConfig(cfg) {
    await this.db.config.put({ key: 'blocking', ...cfg });
  }

  async resetToDefaults() {
    await this.db.config.put(defaultConfig);
  }
}

const db = new ConfigDB();

chrome.runtime.onMessage.addListener((msg, _, reply) => {
  const handlers = {
    GET_CONFIG: async () => db.getConfig(),
    UPDATE_CONFIG: async () => {
      await db.updateConfig(msg.config);
      return { success: true };
    },
    RESET_CONFIG: async () => {
      await db.resetToDefaults();
      return { success: true, config: await db.getConfig() };
    },
    EXPORT_CONFIG: async () => ({ config: await db.getConfig() }),
    IMPORT_CONFIG: async () => {
      if (!msg.config) throw new Error('No config supplied');
      await db.updateConfig(msg.config);
      return { success: true };
    }
  };
  
  if (handlers[msg.type]) {
    handlers[msg.type]().then(r => reply(r)).catch(e => reply({ error: e.message }));
    return true;
  }
});
