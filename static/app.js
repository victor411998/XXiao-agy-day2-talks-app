// BigQuery Release Notes Explorer JS
document.addEventListener('DOMContentLoaded', () => {
    // State Variables
    let allEntries = [];
    let currentDisplayedEntries = [];
    let activeFilter = 'all';
    let searchQuery = '';
    let currentSelectedTweet = null;

    // DOM Elements
    const notesFeed = document.getElementById('notes-feed');
    const loadingState = document.getElementById('loading-state');
    const exportBtn = document.getElementById('export-btn');
    const themeToggleBtn = document.getElementById('theme-toggle-btn');
    const themeIcon = themeToggleBtn ? themeToggleBtn.querySelector('i') : null;
    const errorState = document.getElementById('error-state');
    const emptyState = document.getElementById('empty-state');
    const errorMessage = document.getElementById('error-message');
    const refreshBtn = document.getElementById('refresh-btn');
    const refreshIcon = refreshBtn.querySelector('i');
    const searchInput = document.getElementById('search-input');
    const filterChips = document.querySelectorAll('.filter-chip');
    const retryBtn = document.getElementById('retry-btn');
    
    // Initialize Theme from localStorage
    const savedTheme = localStorage.getItem('theme') || 'dark';
    if (savedTheme === 'light') {
        document.body.classList.add('light-theme');
        if (themeIcon) {
            themeIcon.className = 'fa-solid fa-sun';
        }
    }
    
    // Stats elements
    const statFeatures = document.getElementById('stat-features');
    const statChanges = document.getElementById('stat-changes');
    const statFixes = document.getElementById('stat-fixes');
    const statTotal = document.getElementById('stat-total');

    // Tweet Modal Elements
    const tweetModal = document.getElementById('tweet-modal');
    const tweetTextarea = document.getElementById('tweet-textarea');
    const charCounter = document.getElementById('char-counter');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const cancelTweetBtn = document.getElementById('cancel-tweet-btn');
    const postTweetBtn = document.getElementById('post-tweet-btn');

    // ----------------------------------------------------
    // API Fetch Function
    // ----------------------------------------------------
    async function fetchReleaseNotes(forceRefresh = false) {
        setLoading(true);
        try {
            const url = `/api/releases${forceRefresh ? '?refresh=true' : ''}`;
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Server returned status ${response.status}`);
            }
            const data = await response.json();
            
            if (data.error) {
                throw new Error(data.error);
            }
            
            allEntries = data;
            updateStats();
            filterAndRender();
        } catch (error) {
            console.error('Error fetching release notes:', error);
            setError(error.message || 'An unexpected error occurred while loading release notes.');
        } finally {
            setLoading(false);
        }
    }

    // ----------------------------------------------------
    // State Renderers
    // ----------------------------------------------------
    function setLoading(isLoading) {
        if (isLoading) {
            loadingState.classList.remove('hidden');
            errorState.classList.add('hidden');
            emptyState.classList.add('hidden');
            notesFeed.classList.add('hidden');
            refreshBtn.classList.add('disabled');
            refreshIcon.classList.add('spinning');
        } else {
            loadingState.classList.add('hidden');
            refreshBtn.classList.remove('disabled');
            refreshIcon.classList.remove('spinning');
        }
    }

    function setError(msg) {
        errorMessage.textContent = msg;
        errorState.classList.remove('hidden');
        notesFeed.classList.add('hidden');
        emptyState.classList.add('hidden');
    }

    // ----------------------------------------------------
    // Stats Calculator
    // ----------------------------------------------------
    function updateStats() {
        let featureCount = 0;
        let changeCount = 0;
        let fixCount = 0;
        let totalCount = 0;

        allEntries.forEach(entry => {
            entry.updates.forEach(upd => {
                totalCount++;
                const type = upd.type.toLowerCase();
                if (type.includes('feature')) {
                    featureCount++;
                } else if (type.includes('change')) {
                    changeCount++;
                } else if (type.includes('fix') || type.includes('deprecation') || type.includes('security')) {
                    fixCount++;
                }
            });
        });

        // Animate counter changes
        animateCounter(statFeatures, featureCount);
        animateCounter(statChanges, changeCount);
        animateCounter(statFixes, fixCount);
        animateCounter(statTotal, totalCount);
    }

    function animateCounter(element, targetValue) {
        let start = 0;
        const duration = 800; // ms
        const stepTime = 15; // ms
        const steps = duration / stepTime;
        const increment = targetValue / steps;
        
        const timer = setInterval(() => {
            start += increment;
            if (start >= targetValue) {
                element.textContent = targetValue;
                clearInterval(timer);
            } else {
                element.textContent = Math.floor(start);
            }
        }, stepTime);
    }

    // ----------------------------------------------------
    // Filter and Search Logic
    // ----------------------------------------------------
    function filterAndRender() {
        const query = searchQuery.toLowerCase().trim();
        const filteredEntries = [];

        allEntries.forEach(entry => {
            const matchingUpdates = entry.updates.filter(upd => {
                // Type Filter
                const type = upd.type.toLowerCase();
                if (activeFilter !== 'all') {
                    if (activeFilter === 'Feature' && !type.includes('feature')) return false;
                    if (activeFilter === 'Change' && !type.includes('change')) return false;
                    if (activeFilter === 'Fix' && !(type.includes('fix') || type.includes('deprecation') || type.includes('security'))) return false;
                }

                // Text Search Filter
                if (query) {
                    const matchText = upd.text.toLowerCase();
                    const matchType = upd.type.toLowerCase();
                    const matchDate = entry.date.toLowerCase();
                    return matchText.includes(query) || matchType.includes(query) || matchDate.includes(query);
                }

                return true;
            });

            if (matchingUpdates.length > 0) {
                filteredEntries.push({
                    ...entry,
                    updates: matchingUpdates
                });
            }
        });

        currentDisplayedEntries = filteredEntries;
        renderFeed(filteredEntries);
    }

    // ----------------------------------------------------
    // Render Feed Markup
    // ----------------------------------------------------
    function renderFeed(entries) {
        notesFeed.innerHTML = '';
        
        if (entries.length === 0) {
            emptyState.classList.remove('hidden');
            notesFeed.classList.add('hidden');
            return;
        }

        emptyState.classList.add('hidden');
        notesFeed.classList.remove('hidden');

        entries.forEach((entry, groupIndex) => {
            const groupNode = document.createElement('div');
            groupNode.className = 'release-group';
            groupNode.style.animationDelay = `${groupIndex * 0.05}s`;

            // Date Header
            const dateHeader = document.createElement('div');
            dateHeader.className = 'date-header';
            dateHeader.innerHTML = `
                <div class="date-badge">${entry.date}</div>
                <div class="date-line"></div>
            `;
            groupNode.appendChild(dateHeader);

            // Updates Grid
            const updatesGrid = document.createElement('div');
            updatesGrid.className = 'updates-grid';

            entry.updates.forEach(upd => {
                const typeLower = upd.type.toLowerCase();
                let typeClass = 'type-other';
                let iconClass = 'fa-solid fa-circle-info';
                
                if (typeLower.includes('feature')) {
                    typeClass = 'type-feature';
                    iconClass = 'fa-solid fa-wand-magic-sparkles';
                } else if (typeLower.includes('change')) {
                    typeClass = 'type-change';
                    iconClass = 'fa-solid fa-code-compare';
                } else if (typeLower.includes('fix') || typeLower.includes('deprecation') || typeLower.includes('security')) {
                    typeClass = 'type-fix';
                    iconClass = 'fa-solid fa-bug-slash';
                }

                const card = document.createElement('div');
                card.className = `update-card ${typeClass}`;
                
                card.innerHTML = `
                    <div class="card-header">
                        <span class="type-badge">
                            <i class="${iconClass}"></i>
                            ${upd.type}
                        </span>
                    </div>
                    <div class="update-content">
                        ${upd.html}
                    </div>
                    <div class="card-actions" style="gap: 0.5rem;">
                        <button class="btn btn-secondary btn-sm copy-trigger-btn" title="Copy update to clipboard">
                            <i class="fa-regular fa-copy"></i> Copy
                        </button>
                        <button class="btn btn-secondary btn-sm tweet-trigger-btn" title="Tweet about this update">
                            <i class="fa-brands fa-x-twitter"></i> Share Update
                        </button>
                    </div>
                `;

                // Add Copy Trigger Event
                const copyBtn = card.querySelector('.copy-trigger-btn');
                copyBtn.addEventListener('click', async () => {
                    try {
                        const copyText = `BigQuery Update (${entry.date}) - [${upd.type}] ${upd.text}\nSource: ${entry.link}`;
                        await navigator.clipboard.writeText(copyText);
                        const originalHTML = copyBtn.innerHTML;
                        copyBtn.innerHTML = '<i class="fa-solid fa-check" style="color: var(--color-feature)"></i> Copied!';
                        copyBtn.classList.add('active');
                        setTimeout(() => {
                            copyBtn.innerHTML = originalHTML;
                            copyBtn.classList.remove('active');
                        }, 1500);
                    } catch (err) {
                        console.error('Failed to copy text: ', err);
                    }
                });

                // Add Tweet Trigger Event
                const tweetBtn = card.querySelector('.tweet-trigger-btn');
                tweetBtn.addEventListener('click', () => {
                    openTweetComposer(entry.date, upd, entry.link);
                });

                updatesGrid.appendChild(card);
            });

            groupNode.appendChild(updatesGrid);
            notesFeed.appendChild(groupNode);
        });
    }

    // ----------------------------------------------------
    // Tweet Composer & Modal Handlers
    // ----------------------------------------------------
    function openTweetComposer(date, update, link) {
        currentSelectedTweet = { date, update, link };
        
        // Formulate pre-filled tweet
        // Structure: 📢 BigQuery Update (Date): Type - [Summary/Truncated Text] Link #GoogleCloud #BigQuery
        const prefix = `📢 BigQuery Update (${date}): ${update.type} - `;
        const suffix = `\n\n${link} #GoogleCloud #BigQuery`;
        
        // Calculate max description length
        // Total allowed: 280
        const maxDescLength = 280 - prefix.length - suffix.length - 4; // 4 extra buffer characters
        
        let desc = update.text;
        if (desc.length > maxDescLength) {
            desc = desc.substring(0, maxDescLength - 3) + '...';
        }
        
        const tweetText = `${prefix}${desc}${suffix}`;
        
        tweetTextarea.value = tweetText;
        updateCharCounter();
        
        // Show Modal
        tweetModal.classList.add('show');
        tweetTextarea.focus();
    }

    function closeTweetComposer() {
        tweetModal.classList.remove('show');
        currentSelectedTweet = null;
    }

    function updateCharCounter() {
        const len = tweetTextarea.value.length;
        const remaining = 280 - len;
        charCounter.textContent = remaining;
        
        // Dynamic colors for counter
        charCounter.className = 'char-counter';
        if (remaining <= 20 && remaining > 5) {
            charCounter.classList.add('warning');
        } else if (remaining <= 5) {
            charCounter.classList.add('danger');
        }
        
        // Disable post button if over limit
        if (remaining < 0 || len === 0) {
            postTweetBtn.disabled = true;
            postTweetBtn.style.opacity = 0.5;
        } else {
            postTweetBtn.disabled = false;
            postTweetBtn.style.opacity = 1;
        }
    }

    function handlePostTweet() {
        const tweetText = tweetTextarea.value;
        const twitterIntentUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;
        window.open(twitterIntentUrl, '_blank', 'noopener,noreferrer');
        closeTweetComposer();
    }

    // ----------------------------------------------------
    // Event Listeners
    // ----------------------------------------------------
    refreshBtn.addEventListener('click', () => {
        if (!refreshBtn.classList.contains('disabled')) {
            fetchReleaseNotes(true);
        }
    });

    retryBtn.addEventListener('click', () => {
        fetchReleaseNotes(true);
    });

    searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value;
        filterAndRender();
    });

    filterChips.forEach(chip => {
        chip.addEventListener('click', () => {
            filterChips.forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            activeFilter = chip.getAttribute('data-type');
            filterAndRender();
        });
    });

    // Modal Events
    closeModalBtn.addEventListener('click', closeTweetComposer);
    cancelTweetBtn.addEventListener('click', closeTweetComposer);
    postTweetBtn.addEventListener('click', handlePostTweet);
    tweetTextarea.addEventListener('input', updateCharCounter);
    
    // Close modal when clicking outside content
    tweetModal.addEventListener('click', (e) => {
        if (e.target === tweetModal) {
            closeTweetComposer();
        }
    });

    // ESC key closes modal
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && tweetModal.classList.contains('show')) {
            closeTweetComposer();
        }
    });

    // ----------------------------------------------------
    // Export to CSV Function
    // ----------------------------------------------------
    function exportToCSV(entries) {
        if (!entries || entries.length === 0) {
            alert('No updates available to export.');
            return;
        }

        let csvRows = [];
        // CSV Header
        csvRows.push(['Date', 'Type', 'Description', 'Link'].map(h => `"${h}"`).join(','));

        entries.forEach(entry => {
            entry.updates.forEach(upd => {
                // Escape quotes
                const cleanDesc = upd.text.replace(/"/g, '""');
                const row = [
                    `"${entry.date}"`,
                    `"${upd.type}"`,
                    `"${cleanDesc}"`,
                    `"${entry.link}"`
                ];
                csvRows.push(row.join(','));
            });
        });

        const csvString = csvRows.join('\r\n');
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `bigquery_release_notes_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    // Attach export event
    if (exportBtn) {
        exportBtn.addEventListener('click', () => {
            exportToCSV(currentDisplayedEntries);
        });
    }

    // Theme Toggle Click Handler
    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            const isLight = document.body.classList.toggle('light-theme');
            localStorage.setItem('theme', isLight ? 'light' : 'dark');
            
            if (themeIcon) {
                if (isLight) {
                    themeIcon.className = 'fa-solid fa-sun';
                } else {
                    themeIcon.className = 'fa-solid fa-moon';
                }
            }
        });
    }

    // ----------------------------------------------------
    // Initial Load
    // ----------------------------------------------------
    fetchReleaseNotes(false);
});
