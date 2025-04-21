# Suno-Block-User Chrome Extension

## Features
- Block User Songs (On Suno Home Page) 
- Block User Notifications (But Not Comments)

## How To Install
1. **Download** [`Suno‑Block‑User_1.0.zip`](./Suno‑Block‑User_1.0.zip).
2. **Extract** the ZIP file. This creates a folder with the same name. Remember where this folder is.
3. In Chrome, open the Extensions menu (or go to `chrome://extensions`) and switch **Developer mode** **ON** (top‑right toggle).
4. Click **Load unpacked** in the top left. Choose the folder you just extracted.
5. The *Suno‑Block‑User* icon should now appear; pin or enable the Extension if you want.

## How To Use
- Click Extension Icon for the menu
- Users can be added to list in the popup menu
- Users can also be blocked with the mute icon next to their name (this button can be disabled in settings)

## Why Build This?
I don't personally need to block users on Suno. I wanted a small test project to compare AIs and asked Suno Discord what feature is missing from the Suno website. (All the AIs did well. DeepSeek was first to working code. Still way too much human debugging dealing with Suno website code.) 

## Is this Extension allowed?
I believe it's allowed. The Suno ToS prohibits "data mining, robots, scraping, or similar data gathering or extraction methods" and there is no official Suno API. This extension doesn't automate, scrape, or access anything. It just sits passively background and removes some songs and notifications from the web page, when the user themselves loads the page.

## Why use the Dexie.js library?
Because this Extension was extracted from a more complicated project and I didn't bother to remove it.