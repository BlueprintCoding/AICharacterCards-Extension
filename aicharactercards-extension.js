// File: aicharactercards-extension.js
import {
    POPUP_RESULT,
    POPUP_TYPE,
    callGenericPopup
} from "../../../popup.js"
import { extension_settings, getContext } from '../../../extensions.js';

const { eventSource, event_types } = SillyTavern.getContext();

let context = null;

function ensureContext() {
    if (!context) {
        context = getContext();
    }
}

const MODULE_NAME = 'aiCharacterCards';
const defaultSettings = {
    showNewCardsPopup: false,    // Changed from true to false
    lastFetchedData: null,      // Store last fetched data
    lastFetchedDate: null       // Store last fetch timestamp
};

function getSettings() {
    if (!extension_settings[MODULE_NAME]) {
        extension_settings[MODULE_NAME] = structuredClone(defaultSettings);
    }
    for (const key in defaultSettings) {
        if (extension_settings[MODULE_NAME][key] === undefined) {
            extension_settings[MODULE_NAME][key] = defaultSettings[key];
        }
    }
    return extension_settings[MODULE_NAME];
}

let aiccData = null;

async function fetchAICCSummary(forcePopup = false) {
    try {
        const res = await fetch('https://aicharactercards.com/wp-json/aicc/v1/daily-summary/');
        const json = await res.json();
        if (json.success && json.data) {
            ensureContext(); // Make sure context is initialized
            const settings = getSettings();
            const previousData = settings.lastFetchedData; // Get from settings, not memory
            aiccData = json.data;
            
            //console.log('[AICC] Fetched data. Previous generated_at:', previousData?.generated_at, 'New generated_at:', aiccData.generated_at);
            
            // Check settings before showing popup
            const shouldShow = settings.showNewCardsPopup && 
                ((previousData && shouldShowNewCardsPopup(previousData, aiccData)) || forcePopup);
            
            if (shouldShow) {
                console.log('[AICC] Showing popup - data changed!');
                await showNewCardsAvailablePopup();
            }
            
            // Persist the new data and timestamp
            settings.lastFetchedData = json.data;
            settings.lastFetchedDate = new Date().toISOString();
            context.saveSettingsDebounced();
            
            // Refresh the settings drawer to show new data
            refreshSettingsDrawer();
        }
    } catch (err) {
        console.error('Failed to fetch AICC Summary:', err);
    }
}

function shouldShowNewCardsPopup(oldData, newData) {
    // Don't show popup on first load
    if (!oldData) return false;
    
    // Simply check if the generated_at timestamp changed
    return oldData.generated_at !== newData.generated_at;
}

async function showNewCardsAvailablePopup() {
    const container = document.createElement('div');
    container.className = 'aicc-popup-container';
    
    const title = document.createElement('h3');
    title.className = 'aicc-popup-title';
    title.textContent = 'New AI Character Cards Available!';
    container.appendChild(title);
    
    // New cards section
    const newCardsDiv = document.createElement('div');
    newCardsDiv.className = 'aicc-section';
    
    const newCardsTitle = document.createElement('h4');
    newCardsTitle.className = 'aicc-section-title';
    newCardsTitle.textContent = '📅 Latest Cards';
    newCardsDiv.appendChild(newCardsTitle);
    
    // Banner for new cards
    const newCardsBanner = document.createElement('a');
    newCardsBanner.href = 'https://aicharactercards.com/recent-cards';
    newCardsBanner.target = '_blank';
    newCardsBanner.className = 'aicc-banner';
    
    const maxCards = Math.min(aiccData.cards.length, 6);
    aiccData.cards.slice(0, maxCards).forEach((card, index) => {
        const img = document.createElement('img');
        img.src = card.thumbnail;
        img.alt = card.title;
        newCardsBanner.appendChild(img);
    });
    
    newCardsDiv.appendChild(newCardsBanner);
    
    const newCardsSummary = document.createElement('p');
    newCardsSummary.className = 'aicc-summary';
    newCardsSummary.textContent = aiccData.summary;
    newCardsDiv.appendChild(newCardsSummary);
    
    const seeNewCardsBtn = document.createElement('a');
    seeNewCardsBtn.href = 'https://aicharactercards.com/recent-cards';
    seeNewCardsBtn.target = '_blank';
    seeNewCardsBtn.className = 'aicc-button';
    seeNewCardsBtn.textContent = 'See Latest Cards';
    newCardsDiv.appendChild(seeNewCardsBtn);
    
    container.appendChild(newCardsDiv);
    
    // Trending cards section
    if (aiccData.trending_summary && aiccData.trending_cards && aiccData.trending_cards.length > 0) {
        const separator = document.createElement('hr');
        separator.className = 'aicc-separator';
        container.appendChild(separator);
        
        const trendingDiv = document.createElement('div');
        trendingDiv.className = 'aicc-section';
        
        const trendingTitle = document.createElement('h4');
        trendingTitle.className = 'aicc-section-title';
        trendingTitle.textContent = '🔥 Trending Cards';
        trendingDiv.appendChild(trendingTitle);
        
        // Banner for trending cards
        const trendingBanner = document.createElement('a');
        trendingBanner.href = 'https://aicharactercards.com/recent-cards#trending';
        trendingBanner.target = '_blank';
        trendingBanner.className = 'aicc-banner';
        
        const maxTrending = Math.min(aiccData.trending_cards.length, 6);
        aiccData.trending_cards.slice(0, maxTrending).forEach((card, index) => {
            const img = document.createElement('img');
            img.src = card.thumbnail;
            img.alt = card.title;
            trendingBanner.appendChild(img);
        });
        
        trendingDiv.appendChild(trendingBanner);
        
        const trendingSummary = document.createElement('p');
        trendingSummary.className = 'aicc-summary';
        trendingSummary.textContent = aiccData.trending_summary;
        trendingDiv.appendChild(trendingSummary);
        
        const seeTrendingBtn = document.createElement('a');
        seeTrendingBtn.href = 'https://aicharactercards.com/recent-cards#trending';
        seeTrendingBtn.target = '_blank';
        seeTrendingBtn.className = 'aicc-button';
        seeTrendingBtn.textContent = 'See Trending Cards';
        trendingDiv.appendChild(seeTrendingBtn);
        
        container.appendChild(trendingDiv);
    }
    
    // const footnote = document.createElement('p');
    // footnote.className = 'aicc-footnote';
    // footnote.textContent = 'Check the AICC Daily Summary in Extension Settings for more details.';
    // container.appendChild(footnote);
    
    await callGenericPopup(container, POPUP_TYPE.TEXT, 'AICC Daily Update', { okButton: 'Got it!' });
}

function buildAICCSettingsHTML() {
    const container = document.createElement('div');
    container.classList.add('aicc-summary-box');

    // Load from settings if aiccData is not in memory yet
    if (!aiccData) {
        aiccData = getSettings().lastFetchedData;
    }

    if (!aiccData) {
        container.textContent = 'No summary data loaded.';
        return container;
    }

    // New cards section
    const newCardsSection = document.createElement('div');
    newCardsSection.style.marginBottom = '1.5em';
    
    const newCardsTitle = document.createElement('h4');
    newCardsTitle.textContent = '📅 Latest Cards';
    newCardsSection.appendChild(newCardsTitle);

    const cardBanner = document.createElement('a');
    cardBanner.href = 'https://aicharactercards.com/recent-cards';
    cardBanner.target = '_blank';
    cardBanner.className = 'aicc-banner';
    cardBanner.style.justifyContent = 'flex-start';

    const maxCards = Math.min(aiccData.cards.length, 6);
    aiccData.cards.slice(0, maxCards).forEach((card, index) => {
        const img = document.createElement('img');
        img.src = card.thumbnail;
        img.alt = card.title;
        cardBanner.appendChild(img);
    });

    newCardsSection.appendChild(cardBanner);

    const summaryText = document.createElement('p');
    summaryText.textContent = aiccData.summary;
    newCardsSection.appendChild(summaryText);

    const seeCardsBtn = document.createElement('a');
    seeCardsBtn.href = 'https://aicharactercards.com/recent-cards';
    seeCardsBtn.target = '_blank';
    seeCardsBtn.className = 'aicc-button';
    seeCardsBtn.textContent = 'See Latest Cards';
    seeCardsBtn.style.display = 'inline-block';
    seeCardsBtn.style.textAlign = 'center';
    seeCardsBtn.style.textDecoration = 'none';
    newCardsSection.appendChild(seeCardsBtn);

    container.appendChild(newCardsSection);

    // Trending cards section
    if (aiccData.trending_summary && aiccData.trending_cards && aiccData.trending_cards.length > 0) {
        const separator = document.createElement('hr');
        separator.className = 'aicc-separator';
        container.appendChild(separator);

        const trendingSection = document.createElement('div');
        
        const trendingTitle = document.createElement('h4');
        trendingTitle.textContent = '🔥 Trending Cards';
        trendingSection.appendChild(trendingTitle);

        const trendingBanner = document.createElement('a');
        trendingBanner.href = 'https://aicharactercards.com/recent-cards#trending';
        trendingBanner.target = '_blank';
        trendingBanner.className = 'aicc-banner';
        trendingBanner.style.justifyContent = 'flex-start';

        const maxTrending = Math.min(aiccData.trending_cards.length, 6);
        aiccData.trending_cards.slice(0, maxTrending).forEach((card, index) => {
            const img = document.createElement('img');
            img.src = card.thumbnail;
            img.alt = card.title;
            trendingBanner.appendChild(img);
        });

        trendingSection.appendChild(trendingBanner);

        const trendingSummaryText = document.createElement('p');
        trendingSummaryText.textContent = aiccData.trending_summary;
        trendingSection.appendChild(trendingSummaryText);

        const seeTrendingBtn = document.createElement('a');
        seeTrendingBtn.href = 'https://aicharactercards.com/recent-cards#trending';
        seeTrendingBtn.target = '_blank';
        seeTrendingBtn.className = 'aicc-button';
        seeTrendingBtn.textContent = 'See Trending Cards';
        seeTrendingBtn.style.display = 'inline-block';
        seeTrendingBtn.style.textAlign = 'center';
        seeTrendingBtn.style.textDecoration = 'none';
        trendingSection.appendChild(seeTrendingBtn);

        container.appendChild(trendingSection);
    }

    return container;
}

function refreshSettingsDrawer() {
    const existingDrawer = document.querySelector('#aicc-settings-drawer');
    if (existingDrawer) {
        const content = existingDrawer.querySelector('.inline-drawer-content');
        if (content) {
            // Re-build the settings content while preserving the checkbox state
            const settingsDiv = content.querySelector('#aicc-settings-controls');
            if (settingsDiv) {
                // Remove old summary, keep settings controls
                const oldSummary = content.querySelector('.aicc-summary-box');
                if (oldSummary) oldSummary.remove();
                
                const hr = content.querySelector('hr');
                if (hr) hr.remove();
                
                // Add fresh data
                const newHr = document.createElement('hr');
                content.appendChild(newHr);
                content.appendChild(buildAICCSettingsHTML());
            }
        }
    }
}

function setupAICCSummaryDrawer() {
    const settingsDrawer = document.createElement('div');
    settingsDrawer.id = 'aicc-settings-drawer';
    settingsDrawer.className = 'inline-drawer';

    settingsDrawer.innerHTML = `
        <div class="inline-drawer-toggle inline-drawer-header">
            <b>AICC New Cards Daily Summary</b>
            <div class="inline-drawer-icon fa-solid interactable up fa-circle-chevron-up" tabindex="0"></div>
        </div>
        <div class="inline-drawer-content"></div>
    `;

    const content = settingsDrawer.querySelector('.inline-drawer-content');
    
    // Add settings controls
    const settingsDiv = document.createElement('div');
    settingsDiv.id = 'aicc-settings-controls';
    settingsDiv.style.marginBottom = '1em';
    
    const checkboxLabel = document.createElement('label');
    checkboxLabel.style.display = 'flex';
    checkboxLabel.style.alignItems = 'center';
    checkboxLabel.style.gap = '8px';
    checkboxLabel.style.marginBottom = '8px';
    
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.id = 'aicc--showNewCardsPopup';
    checkbox.checked = getSettings().showNewCardsPopup;
    checkbox.addEventListener('change', (e) => {
        getSettings().showNewCardsPopup = e.target.checked;
        ensureContext();
        context.saveSettingsDebounced();
    });
    
    const checkboxText = document.createElement('span');
    checkboxText.textContent = 'Show popup when new cards are available';
    
    checkboxLabel.appendChild(checkbox);
    checkboxLabel.appendChild(checkboxText);
    settingsDiv.appendChild(checkboxLabel);
    
    // Add manual refresh button
    const refreshBtn = document.createElement('button');
    refreshBtn.className = 'aicc-button';
    refreshBtn.textContent = 'Refresh Now';
    refreshBtn.style.marginTop = '-2px';
    refreshBtn.style.padding = '2px 6px';
    refreshBtn.style.fontSize = '10px';
    refreshBtn.addEventListener('click', async () => {
        refreshBtn.disabled = true;
        refreshBtn.textContent = 'Refreshing...';
        try {
            await fetchAICCSummary();
            refreshBtn.textContent = 'Refreshed!';
            setTimeout(() => {
                refreshBtn.textContent = 'Refresh Now';
                refreshBtn.disabled = false;
            }, 1500);
        } catch (err) {
            refreshBtn.textContent = 'Failed';
            setTimeout(() => {
                refreshBtn.textContent = 'Refresh Now';
                refreshBtn.disabled = false;
            }, 1500);
        }
    });
    settingsDiv.appendChild(refreshBtn);
    
    const hr = document.createElement('hr');
    settingsDiv.appendChild(hr);
    
    content.appendChild(settingsDiv);
    content.appendChild(buildAICCSettingsHTML());

    document.querySelector('#extensions_settings').appendChild(settingsDrawer);
}

// (async () => {
//     await fetchAICCSummary();
//     setupAICCSummaryDrawer();
// })();

eventSource.on(event_types.APP_READY, async () => {
    ensureContext();
    // Load persisted data first
    const settings = getSettings();
    if (settings.lastFetchedData) {
        aiccData = settings.lastFetchedData;
    }
    
    // Fetch fresh data (will compare and popup if changed)
    await fetchAICCSummary();
    setupAICCSummaryDrawer();
    
    // Register console command for manual sync
    window.aiccForceSync = async () => {
        console.log('AICC: Forcing sync...');
        await fetchAICCSummary(true);
        console.log('AICC: Sync complete');
    };
    console.log('AICC Extension loaded. Use aiccForceSync() to manually check for new cards.');
});