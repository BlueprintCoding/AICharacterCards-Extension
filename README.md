# AICharacterCards Extension for SillyTavern

The official SillyTavern extension from AI Character Cards that integrates with [aicharactercards.com](https://aicharactercards.com) to keep you updated on the latest and trending AI character cards. More features will be added down the line.

## Features

- 📅 **Daily Summary**: View the latest character cards released on aicharactercards.com
- 🔥 **Trending Cards**: See what's popular in the community
- 🔔 **Optional Notifications**: Get a popup when new cards are available (disabled by default)
- 🖼️ **Visual Previews**: Thumbnail banners showing card artwork
- 💾 **Smart Caching**: Stores data locally to avoid redundant API calls
- 🔄 **Manual Refresh**: Force-check for new cards on demand

## Installation

Clone or download this extension into your SillyTavern `data/{user folder}/extensions/` directory:


```
/sillytavern/
  └── data/
      └── {your user folder}/
          └── extensions/
```
Or use the built in extension installer with the repo url https://github.com/YourUsername/AICharacterCards-Extension.git


## Usage

### Viewing the Daily Summary

1. Open SillyTavern's settings panel (the stacked squares icon)
2. Navigate to the **Extensions** tab
3. Look for the **AICC Daily Summary** section
4. Click to expand and view:
   - Latest character cards with thumbnails
   - AI-generated summary of recent releases
   - Trending cards section
   - Direct links to view cards on aicharactercards.com

### Enabling Notifications

To receive a popup notification when new cards are published:

1. In the **AICC Daily Summary** section
2. Check the box: **"Show popup when new cards are available"**
3. You'll be notified automatically when the daily summary updates

### Manual Refresh

Click the **"Refresh Now"** button in the settings to manually check for new cards.

Alternatively, use the console command:
```javascript
aiccForceSync()
```

## Settings

The extension stores the following settings:

- `showNewCardsPopup` - Whether to display notifications for new cards (default: `false`)
- `lastFetchedData` - Cached summary data from the API
- `lastFetchedDate` - Timestamp of the last successful fetch

Settings are automatically saved and persist between sessions.

## How It Works

1. On SillyTavern startup, the extension fetches the daily summary from aicharactercards.com
2. Data is compared with the previously cached version
3. If new cards are detected and notifications are enabled, a popup is shown
4. The summary is displayed in the Extension Settings panel with clickable links
5. Data is refreshed automatically on app start or manually via the refresh button

## License

This extension is provided as-is for use with SillyTavern. 