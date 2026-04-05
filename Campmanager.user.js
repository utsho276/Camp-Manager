// ==UserScript==
// @name         Camp Manager
// @namespace    http://tampermonkey.net/
// @version      4.2
// @description  
// @author       Your Name (Modified by AI)
// @match        https://www.microworkers.com/jobs.php*
// @match        https://ttv.microworkers.com/dotask/info/*
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_addStyle
// ==/UserScript==

(function() {
    'use strict';

    // --- ডিফল্ট ক্যাম্পেইন কনফিগারেশন ---
    const initialCampaigns = [
        {
            id: "1470_pc",
            name: "TTV-Data Entry - PC required. Not for mobile phones. (E766-1470)",
            enabled: true,
            clickDelay: 3000,
            blockedURLs: ["https://ttv.microworkers.com/dotask/info/eb9be554bf04_HG"]
        },
        {
            id: "1033",
            name: "TTV-Data Entry from images (E502-1033)",
            enabled: true,
            clickDelay: 3000,
            blockedURLs: [
                "https://ttv.microworkers.com/dotask/info/41eb9e466f01_HG",
                "https://ttv.microworkers.com/dotask/info/a9fb3abe9b35_HG",
                "https://ttv.microworkers.com/dotask/info/2b74a2f425bf_HG"
            ]
        },
        {
            id: "1891",
            name: "TTV-Data Entry from images (E1096-1891)",
            enabled: true,
            clickDelay: 3000,
            blockedURLs: [
                "https://ttv.microworkers.com/dotask/info/53717a422e98_HG",
                "https://ttv.microworkers.com/dotask/info/435985405069_HG",
                "https://ttv.microworkers.com/dotask/info/d84266cd43f3_HG",
                "https://ttv.microworkers.com/dotask/info/7efc3c994c22_HG"
            ]
        },
        {
            id: "970",
            name: "TTV-Data Entry from images (E471-970)",
            enabled: true,
            clickDelay: 3000,
            blockedURLs: [
                "https://ttv.microworkers.com/dotask/info/65a68221e936_HG",
                "https://ttv.microworkers.com/dotask/info/a47267f5d0af_HG",
                "https://ttv.microworkers.com/dotask/info/c380d4c8cce3_HG"
            ]
        }
    ];

    let campaigns = [];
    let isPanelMinimized = false;
    let isMasterSwitchOn = true;
    let panelPosition = null;
    let currentTheme = 'dark';

    // --- ডেটা সেভ এবং লোড করার ফাংশন ---
    async function saveData() {
        await GM_setValue('microworkers_campaigns_data_v4', JSON.stringify(campaigns));
        await GM_setValue('microworkers_panel_minimized_v4', isPanelMinimized);
        await GM_setValue('microworkers_master_switch_v4', isMasterSwitchOn);
        await GM_setValue('microworkers_current_theme_v4', currentTheme);
    }

    async function loadData() {
        const savedCampaigns = JSON.parse(await GM_getValue('microworkers_campaigns_data_v4', '[]'));
        isPanelMinimized = await GM_getValue('microworkers_panel_minimized_v4', false);
        isMasterSwitchOn = await GM_getValue('microworkers_master_switch_v4', true);
        currentTheme = await GM_getValue('microworkers_current_theme_v4', 'dark');
        const savedPosition = await GM_getValue('microworkers_panel_position_v4', null);
        if (savedPosition) panelPosition = JSON.parse(savedPosition);

        campaigns = initialCampaigns.map(initial => {
            const saved = savedCampaigns.find(s => s.id === initial.id);
            return saved ? { ...initial, ...saved } : initial;
        });
        await saveData();
    }

    // --- ক্যাম্পেইন লিংক ক্লিক করার ফাংশন (আপনার আসল স্ক্রিপ্টের মতো) ---
    function clickCampaignLink() {
        if (!isMasterSwitchOn) {
            console.log("Master switch is off. Scanner paused.");
            return;
        }

        const links = document.querySelectorAll('a');

        for (const campaign of campaigns) {
            if (!campaign.enabled) continue;

            for (const link of links) {
                if (link.href.startsWith("https://ttv.microworkers.com/dotask/info/") &&
                    link.textContent.trim() === campaign.name) {

                    if (campaign.blockedURLs.includes(link.href)) {
                        console.log(`[${campaign.id}] Blocked campaign found. Not clicking: ${link.href}`);
                        continue;
                    }

                    console.log(`[${campaign.id}] Matching campaign found. Clicking after ${campaign.clickDelay/1000} seconds: ${link.href}`);

                    setTimeout(() => {
                        link.click();
                    }, campaign.clickDelay);

                    return;
                }
            }
        }
    }

    // --- ইউজার ইন্টারফেস (UI) তৈরি করার ফাংশন ---
    function createManagerUI() {
        const container = document.createElement('div');
        container.id = 'mw-campaign-manager';
        if (panelPosition) {
            container.style.top = panelPosition.top;
            container.style.left = panelPosition.left;
        }
        document.body.appendChild(container);
        renderUI();
    }

    function renderUI() {
        const container = document.getElementById('mw-campaign-manager');
        container.className = currentTheme === 'light' ? 'light-theme' : '';
        container.innerHTML = '';

        const masterSwitchHTML = `
            <label class="master-switch-label" title="সম্পূর্ণ স্ক্যানার চালু বা বন্ধ করুন">
                Scanner:
                <label class="switch small-switch">
                    <input type="checkbox" id="master-switch" ${isMasterSwitchOn ? 'checked' : ''}>
                    <span class="slider round"></span>
                </label>
            </label>
        `;

        let campaignsHTML = campaigns.map((campaign, index) => `
            <div class="campaign-item">
                <div class="campaign-header">
                    <label class="switch">
                        <input type="checkbox" class="campaign-toggle" data-index="${index}" ${campaign.enabled ? 'checked' : ''}>
                        <span class="slider round"></span>
                    </label>
                    <span class="campaign-name">${campaign.id}</span>
                </div>
                <div class="block-section">
                    <div class="block-list">
                        <ul>
                            ${campaign.blockedURLs.map((url, urlIndex) => `
                                <li>
                                    <span title="${url}">${url.split('/').pop()}</span>
                                    <button class="remove-block" title="এই URLটি আনব্লক করুন" data-index="${index}" data-url-index="${urlIndex}">×</button>
                                </li>
                            `).join('') || '<li class="no-blocks">কোনো URL ব্লক করা নেই</li>'}
                        </ul>
                    </div>
                    <div class="add-block">
                        <input type="text" id="block-input-${index}" placeholder="URL পেস্ট করে ব্লক করুন">
                        <button class="add-block-btn" data-index="${index}">Add</button>
                    </div>
                </div>
            </div>
        `).join('');

        container.innerHTML = `
            <div class="manager-header" title="Drag to move">
                <span>Camp Manager</span>
                <div class="header-controls">
                    <button id="theme-toggle" title="Change Theme">${currentTheme === 'light' ? '🌙' : '☀️'}</button>
                    ${masterSwitchHTML}
                    <button id="toggle-panel" title="${isPanelMinimized ? 'Expand' : 'Collapse'}"> ${isPanelMinimized ? '▲' : '▼'} </button>
                </div>
            </div>
            <div class="manager-body" style="${isPanelMinimized ? 'display: none;' : ''}">
                ${campaignsHTML}
            </div>
        `;
        addEventListeners();
    }

    // --- UI-এর জন্য ইভেন্ট হ্যান্ডলার ---
    function addEventListeners() {
        document.getElementById('theme-toggle').addEventListener('click', () => {
            currentTheme = currentTheme === 'light' ? 'dark' : 'light';
            saveData();
            renderUI();
        });

        document.getElementById('toggle-panel').addEventListener('click', () => {
            isPanelMinimized = !isPanelMinimized;
            saveData();
            renderUI();
        });

        document.getElementById('master-switch').addEventListener('change', (e) => {
            isMasterSwitchOn = e.target.checked;
            saveData();
            console.log(`Master Scanner is now ${isMasterSwitchOn ? 'ON' : 'OFF'}`);
        });

        document.querySelectorAll('.campaign-toggle').forEach(toggle => {
            toggle.addEventListener('change', async (e) => {
                campaigns[e.target.dataset.index].enabled = e.target.checked;
                await saveData();
            });
        });

        document.querySelectorAll('.add-block-btn').forEach(button => {
            button.addEventListener('click', async (e) => {
                const index = e.target.dataset.index;
                const input = document.getElementById(`block-input-${index}`);
                const url = input.value.trim();
                if (url && !campaigns[index].blockedURLs.includes(url)) {
                    campaigns[index].blockedURLs.push(url);
                    await saveData();
                    renderUI();
                }
            });
        });

        document.querySelectorAll('.remove-block').forEach(button => {
            button.addEventListener('click', async (e) => {
                const index = e.currentTarget.dataset.index;
                const urlIndex = e.currentTarget.dataset.urlIndex;
                campaigns[index].blockedURLs.splice(urlIndex, 1);
                await saveData();
                renderUI();
            });
        });

        // Drag functionality - আগের সিম্পল সিস্টেম কিন্তু উন্নত
        const header = document.querySelector('.manager-header');
        const panel = document.getElementById('mw-campaign-manager');
        let isDragging = false;
        let offsetX, offsetY;

        // Mouse down event
        header.addEventListener('mousedown', (e) => {
            // চেক করুন যে বাটনে ক্লিক করা হয়নি
            if (e.target.tagName === 'BUTTON' ||
                e.target.tagName === 'INPUT' ||
                e.target.tagName === 'LABEL' ||
                e.target.closest('.header-controls')) {
                return;
            }

            isDragging = true;

            // Panel এর current position পাওয়া
            const rect = panel.getBoundingClientRect();
            offsetX = e.clientX - rect.left;
            offsetY = e.clientY - rect.top;

            // Cursor style
            header.style.cursor = 'grabbing';
            panel.style.transition = 'none'; // Dragging এর সময় transition বন্ধ
        });

        // Mouse move event
        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;

            e.preventDefault();

            // নতুন position calculate করা
            let newLeft = e.clientX - offsetX;
            let newTop = e.clientY - offsetY;

            // Screen boundary check
            const rect = panel.getBoundingClientRect();
            const maxX = window.innerWidth - rect.width;
            const maxY = window.innerHeight - rect.height;

            newLeft = Math.min(Math.max(0, newLeft), maxX);
            newTop = Math.min(Math.max(0, newTop), maxY);

            // Position apply করা
            panel.style.left = `${newLeft}px`;
            panel.style.top = `${newTop}px`;
            panel.style.right = 'auto'; // Right position clear করা
        });

        // Mouse up event
        document.addEventListener('mouseup', async () => {
            if (!isDragging) return;

            isDragging = false;
            header.style.cursor = 'move';
            panel.style.transition = ''; // Transition restore করা

            // Position save করা
            const newPosition = {
                top: panel.style.top,
                left: panel.style.left
            };
            await GM_setValue('microworkers_panel_position_v4', JSON.stringify(newPosition));
        });

        // Mouse leave prevention (dragging চলাকালীন)
        document.addEventListener('mouseleave', () => {
            if (isDragging) {
                isDragging = false;
                header.style.cursor = 'move';
            }
        });
    }

    // --- স্টাইল (CSS) যোগ করার ফাংশন ---
    function addStyles() {
        GM_addStyle(`
            /* --- ডার্ক থিম ভেরিয়েবল --- */
            #mw-campaign-manager {
                --bg-dark: #1a1f2e;
                --bg-light: #232937;
                --text-color: #e8eaed;
                --accent-color: #4a9eff;
                --green-color: #34a853;
                --red-color: #ea4335;
                --grey-color: #9aa0a6;
                --border-color: #3c4043;
                --header-bg: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                --input-bg: #1a1f2e;
                --list-bg: rgba(0,0,0,0.3);
            }

            /* --- লাইট থিম ভেরিয়েবল --- */
            #mw-campaign-manager.light-theme {
                --bg-dark: #f8f9fa;
                --bg-light: #ffffff;
                --text-color: #202124;
                --accent-color: #1a73e8;
                --green-color: #1e8e3e;
                --red-color: #d93025;
                --grey-color: #5f6368;
                --border-color: #dadce0;
                --header-bg: linear-gradient(135deg, #4285f4 0%, #34a853 100%);
                --input-bg: #ffffff;
                --list-bg: #f8f9fa;
            }

            /* --- বেস স্টাইল --- */
            #mw-campaign-manager {
                position: fixed;
                top: 20px;
                right: 20px;
                width: 320px;
                background-color: var(--bg-light);
                border-radius: 12px;
                z-index: 99999;
                font-family: 'Google Sans', 'Segoe UI', Roboto, sans-serif;
                box-shadow: 0 4px 20px rgba(0,0,0,0.15);
                color: var(--text-color);
                overflow: hidden;
                transition: box-shadow 0.3s ease;
                user-select: none;
            }

            #mw-campaign-manager:hover {
                box-shadow: 0 6px 25px rgba(0,0,0,0.2);
            }

            .manager-header {
                padding: 10px 12px;
                background: var(--header-bg);
                color: white;
                cursor: move;
                display: flex;
                justify-content: space-between;
                align-items: center;
                font-size: 14px;
                font-weight: 500;
            }

            .manager-header:active {
                cursor: grabbing;
            }

            .header-controls {
                display: flex;
                align-items: center;
                gap: 8px;
            }

            .header-controls button {
                cursor: pointer;
                background: rgba(255,255,255,0.2);
                border: none;
                color: white;
                font-size: 14px;
                padding: 4px 8px;
                border-radius: 4px;
                transition: background 0.2s;
            }

            .header-controls button:hover {
                background: rgba(255,255,255,0.3);
            }

            #theme-toggle {
                font-size: 16px;
                padding: 2px 6px;
            }

            .manager-body {
                padding: 10px;
                max-height: 60vh;
                overflow-y: auto;
                background-color: var(--bg-dark);
            }

            .manager-body::-webkit-scrollbar {
                width: 6px;
            }

            .manager-body::-webkit-scrollbar-track {
                background: var(--bg-dark);
            }

            .manager-body::-webkit-scrollbar-thumb {
                background: var(--border-color);
                border-radius: 3px;
            }

            .manager-body::-webkit-scrollbar-thumb:hover {
                background: var(--grey-color);
            }

            .campaign-item {
                border: 1px solid var(--border-color);
                border-radius: 8px;
                padding: 12px;
                margin-bottom: 10px;
                background-color: var(--bg-light);
                transition: all 0.2s;
            }

            .campaign-item:hover {
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            }

            .campaign-header {
                display: flex;
                align-items: center;
                margin-bottom: 10px;
            }

            .campaign-name {
                margin-left: 12px;
                font-weight: 600;
                color: var(--accent-color);
                font-size: 14px;
            }

            .block-section {
                padding-left: 44px;
            }

            .block-list ul {
                list-style: none;
                padding: 6px;
                margin: 6px 0;
                max-height: 60px;
                overflow-y: auto;
                background: var(--list-bg);
                border: 1px solid var(--border-color);
                border-radius: 6px;
                font-size: 11px;
            }

            .block-list ul::-webkit-scrollbar {
                width: 4px;
            }

            .block-list ul::-webkit-scrollbar-thumb {
                background: var(--border-color);
                border-radius: 2px;
            }

            .block-list li {
                display: flex;
                justify-content: space-between;
                align-items: center;
                color: var(--grey-color);
                padding: 3px 0;
            }

            .block-list li.no-blocks {
                font-style: italic;
                opacity: 0.7;
            }

            .remove-block {
                background: none;
                border: none;
                cursor: pointer;
                color: var(--red-color);
                font-size: 18px;
                line-height: 1;
                padding: 0 4px;
                opacity: 0.7;
                transition: opacity 0.2s;
            }

            .remove-block:hover {
                opacity: 1;
            }

            .add-block {
                display: flex;
                margin-top: 8px;
                gap: 6px;
            }

            .add-block input {
                flex-grow: 1;
                padding: 6px 8px;
                border: 1px solid var(--border-color);
                border-radius: 4px;
                font-size: 12px;
                background-color: var(--input-bg);
                color: var(--text-color);
                transition: border-color 0.2s;
            }

            .add-block input:focus {
                outline: none;
                border-color: var(--accent-color);
            }

            .add-block-btn {
                padding: 6px 14px;
                background-color: var(--green-color);
                color: white;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-weight: 500;
                font-size: 12px;
                transition: opacity 0.2s;
            }

            .add-block-btn:hover {
                opacity: 0.9;
            }

            .master-switch-label {
                display: flex;
                align-items: center;
                gap: 6px;
                font-size: 12px;
                color: white;
                background: rgba(255,255,255,0.2);
                padding: 2px 8px;
                border-radius: 4px;
            }

            /* --- টগল সুইচ স্টাইল --- */
            .switch {
                position: relative;
                display: inline-block;
                width: 40px;
                height: 22px;
            }

            .switch input {
                opacity: 0;
                width: 0;
                height: 0;
            }

            .slider {
                position: absolute;
                cursor: pointer;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background-color: var(--grey-color);
                transition: .3s;
            }

            .slider.round {
                border-radius: 22px;
            }

            .slider:before {
                position: absolute;
                content: "";
                height: 16px;
                width: 16px;
                left: 3px;
                bottom: 3px;
                background-color: white;
                transition: .3s;
                border-radius: 50%;
            }

            input:checked + .slider {
                background-color: var(--green-color);
            }

            input:checked + .slider:before {
                transform: translateX(18px);
            }

            .small-switch {
                width: 34px;
                height: 20px;
            }

            .small-switch .slider:before {
                height: 14px;
                width: 14px;
                left: 3px;
                bottom: 3px;
            }

            input:checked + .small-switch .slider:before {
                transform: translateX(14px);
            }
        `);
    }

    // --- মেইন স্ক্রিপ্ট শুরু ---
    (async function main() {
        await loadData();
        addStyles();
        createManagerUI();

        // পেজ লোড হওয়ার সাথে সাথে ক্যাম্পেইন লিংক চেক করে ক্লিক করানো হবে
        clickCampaignLink();

        // পেজে নতুন এলিমেন্ট আসলে চেক করার জন্য MutationObserver ব্যবহার করা হয়েছে
        const observer = new MutationObserver(() => {
            clickCampaignLink();
        });

        // ডকুমেন্টে পরিবর্তন ট্র্যাক করা হবে
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    })();

})();
