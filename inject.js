(function() {
  if (!window.fetch || window.__sunoBlockFetchPatched) return;
  window.__sunoBlockFetchPatched = true;

  const originalFetch = window.fetch;
  const cfgTag = document.getElementById('__sunoBlockConfig');
  const cfg = cfgTag ? JSON.parse(cfgTag.textContent || '{}') : {};
  const blocked = (cfg.manualAssignments?.blocked || []).map(u => u.toLowerCase());

  const isUserBlocked = (item) => {
    if (cfg.showDebugInformation) {
      console.log('[SUNO BLOCK] Checking if user is blocked:', item);
    }

    if (!item) return false;
    if (item.clip_schema && item.clip_schema.handle) {
      if (cfg.showDebugInformation) {
        console.log('[SUNO BLOCK] Using clip_scheme.handle instead of item.handle with handle :', item.clip_schema.handle);
      }
      item.handle = item.clip_schema.handle;
    }

    const handle = item.handle?.toLowerCase();
    const userId = item.user_id?.toLowerCase();
    return (handle && blocked.includes(handle)) || (userId && blocked.includes(userId));
  };

  window.fetch = async function(...args) {
    const url = typeof args[0] === 'string' ? args[0] : args[0]?.url;

    if (cfg.showDebugInformation) {
      console.log('[SUNO BLOCK] fetch request to:', url);
    }

    const resp = await originalFetch(...args);

    if (cfg.blockNotifications && /notification\/v2/i.test(url)) {
      if (cfg.showDebugInformation) {
        console.log('[SUNO BLOCK] notifications feed intercepted');
      }
      const clone = resp.clone();
      try {
        const data = await clone.json();
        if (!data?.notifications) return resp;

        let originalCount = data.notifications.length;
        let removed = 0;
        data.notifications = data.notifications.filter(n => {
          const users = n.user_profiles || [];
          const isBlocked = users.some(u =>
            (u.handle && blocked.includes(u.handle.toLowerCase())) ||
            (u.user_id && blocked.includes(u.user_id.toLowerCase()))
          );
          if (isBlocked) removed++;
          return !isBlocked;
        });

        if (cfg.showDebugInformation) {
            console.log(`[SUNO BLOCK] Notifications: ${originalCount} items originally, ${removed} blocked.`);
        }

        if (removed > 0 && cfg.showBlockedNotificationCount) {
          data.notifications.unshift({
            id: 'synthetic-blocked-summary',
            priority: 0,
            updated_at: new Date().toISOString(),
            is_read: true,
            notification_type: 'clip_like',
            user_profiles: [],
            total_users: 0,
            content_id: 'synthetic-blocked-summary-' + Math.random().toString(36).slice(2),
            content_title: `System Notice: ${removed} notification(s) BLOCKED`,
            content_image_url: ''
          });
          if (cfg.showDebugInformation) {
            console.log(`[SUNO BLOCK] Added notification block summary.`);
          }
        }

        return new Response(JSON.stringify(data), resp);
      } catch(e) {
         if (cfg.showDebugInformation) {
           console.error('[SUNO BLOCK] Error processing notifications feed:', e);
         }
      }
    }

    if (cfg.blockSongs && /discover/i.test(url)) {
      if (cfg.showDebugInformation) {
        console.log('[SUNO BLOCK] songs feed intercepted');
      }

      const clone = resp.clone();
      try {
        const data = await clone.json();
        if (!data?.sections) return resp;

        if (cfg.showDebugInformation) {
          console.log(`[SUNO BLOCK] Processing ${data.sections.length} sections in songs feed.`);
        }

        data.sections.forEach((section, sectionIndex) => {
          if (!section || !Array.isArray(section.items) || section.items.length === 0) {
            if (cfg.showDebugInformation) {
              console.log(`[SUNO BLOCK] Section ${sectionIndex} ('${section?.title}') has no items or invalid format, skipping.`);
            }
            return;
          }


          const firstItem = section.items[0];
          const isNestedStructure = firstItem && Array.isArray(firstItem.items); 

          if (isNestedStructure) {
            // --- Nested Structure (section -> items -> items) ---
            if (cfg.showDebugInformation) {
              console.log(`[SUNO BLOCK] Section ${sectionIndex} ('${section.title}'): Detected NESTED structure.`);
            }
            section.items.forEach((subSection, subSectionIndex) => {
              if (!subSection || !Array.isArray(subSection.items)) {
                 if (cfg.showDebugInformation) {
                   console.log(`[SUNO BLOCK]   Sub-section ${subSectionIndex} ('${subSection?.title}') has no inner items, skipping.`);
                 }
                 return; 
              }

              const originalCount = subSection.items.length;
              let removedCount = 0;
              const originalItems = [...subSection.items]; 

              subSection.items = subSection.items.filter(item => {
                const isBlocked = isUserBlocked(item);
                if (isBlocked) removedCount++;
                return !isBlocked;
              });

              if (cfg.showDebugInformation) {
                console.log(`[SUNO BLOCK]   Sub-section ${subSectionIndex} ('${subSection.title}'): ${originalCount} items originally, ${removedCount} blocked.`);
                if (removedCount > 0) {
                   const blockedHandles = originalItems.filter(isUserBlocked).map(i => i.handle || i.user_id);
                   console.log(`[SUNO BLOCK]     Blocked handles/ids in this sub-section: ${blockedHandles.join(', ')}`);
                }
              }

              if (removedCount > 0 && cfg.showBlockedSongCount) {
                subSection.title += ` (${removedCount} BLOCKED)`;
                if (cfg.showDebugInformation) {
                   console.log(`[SUNO BLOCK]   Updated sub-section title for '${subSection.title}'.`);
                }
              }
            });

          } else {
            if (cfg.showDebugInformation) {
               console.log(`[SUNO BLOCK] Section ${sectionIndex} ('${section.title}'): Detected FLAT structure.`);
            }
            const originalCount = section.items.length;
            let removedCount = 0;
            const originalItems = [...section.items]; 

            section.items = section.items.filter(item => {
              const isBlocked = isUserBlocked(item);
              if (isBlocked) removedCount++;
              return !isBlocked;
            });

            if (cfg.showDebugInformation) {
               console.log(`[SUNO BLOCK]   Section ${sectionIndex} ('${section.title}'): ${originalCount} items originally, ${removedCount} blocked.`);
               if (removedCount > 0) {
                   const blockedHandles = originalItems.filter(isUserBlocked).map(i => i.handle || i.user_id);
                   console.log(`[SUNO BLOCK]     Blocked handles/ids in this section: ${blockedHandles.join(', ')}`);
               }
            }

            if (removedCount > 0 && cfg.showBlockedSongCount) {
              section.title += ` (${removedCount} BLOCKED)`;
               if (cfg.showDebugInformation) {
                   console.log(`[SUNO BLOCK]   Updated section title for '${section.title}'.`);
                }
            }
          }
        }); 

        return new Response(JSON.stringify(data), resp);
      } catch (e) {
        if (cfg.showDebugInformation) {
          console.error('[SUNO BLOCK] Error processing songs feed:', e);
        }
        return resp;
      }
    } 

    return resp; 
  }; 
})();