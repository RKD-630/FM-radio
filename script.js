// Configuration
const API_BASE = 'https://de1.api.radio-browser.info/json';
const DEFAULT_LIMIT = 50;

// State
let currentStations = [];
let currentPlaylist = JSON.parse(localStorage.getItem('fm_playlist')) || [];
let currentStationIndex = -1;
let currentMode = 'Global'; // 'Global' or 'India'
let isMuted = false;
let lastVolume = 80;

// DOM Elements
const audioPlayer = document.getElementById('audio-player');
const stationsGrid = document.getElementById('stations-grid');
const playlistList = document.getElementById('playlist-list');
const searchInput = document.getElementById('station-search');
const scanBtn = document.getElementById('scan-btn');
const scanIndiaBtn = document.getElementById('scan-india-btn');
const categoriesBar = document.getElementById('categories-bar');
const modeLabel = document.getElementById('current-mode-label');
const indiaOnlyCats = document.querySelector('.india-only-cats');
const catButtons = document.querySelectorAll('.cat-btn');
const playPauseBtn = document.getElementById('play-pause-btn');
const playIcon = document.getElementById('play-icon');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const muteBtn = document.getElementById('mute-btn');
const volumeIcon = document.getElementById('volume-icon');
const volumeSlider = document.getElementById('volume-slider');
const playerStatus = document.getElementById('player-status');
const currentStationName = document.getElementById('current-station-name');
const currentStationMeta = document.getElementById('current-station-meta');
const currentStationImg = document.getElementById('current-station-info-img');
const playerMiniImg = document.getElementById('player-mini-img');
const playerMiniName = document.getElementById('player-mini-name');
const playerMiniMeta = document.getElementById('player-mini-meta');
const addToPlaylistBtn = document.getElementById('add-to-playlist-btn');
const resultsCount = document.getElementById('results-count');
const mainLoader = document.getElementById('main-loader');
const nowPlayingCard = document.querySelector('.now-playing-card');
const themeToggle = document.getElementById('theme-toggle');
const themeIcon = document.getElementById('theme-icon');

// New UI Elements
const mainTabs = document.querySelectorAll('.tab-btn');
const views = {
    discovery: document.getElementById('discovery-view'),
    playlist: document.getElementById('playlist-view'),
    scanner: document.getElementById('scanner-view')
};
const quickPlaylistList = document.getElementById('quick-playlist-list');
const fullPlaylistList = document.getElementById('full-playlist-list');

// Scanner Elements
const freqSlider = document.getElementById('freq-slider');
const freqValue = document.getElementById('freq-value');
const scanLine = document.getElementById('scan-line');
const customNameInput = document.getElementById('custom-name');
const customUrlInput = document.getElementById('custom-url');
const customIconInput = document.getElementById('custom-icon');
const addCustomBtn = document.getElementById('add-custom-btn');
const autoScanBtn = document.getElementById('auto-scan-btn');
const saveAllBtn = document.getElementById('save-all-btn');
const signalBars = document.querySelectorAll('.signal-bars span');

let discoveredFrequencies = [];

// Initialize
function init() {
    setupEventListeners();
    
    // Default setting: Indian FM
    currentMode = 'India';
    if (modeLabel) modeLabel.textContent = 'India Categories:';
    if (indiaOnlyCats) indiaOnlyCats.style.display = 'contents';
    
    // Fetch Indian stations by default
    fetchStations('', 'India');
    updateActiveCat('All');
    
    renderPlaylist();
    updateVolume(80);
    loadTheme();
    
    // Restore last played station
    try {
        const lastStation = JSON.parse(localStorage.getItem('fm_current_station'));
        if (lastStation) {
            updatePlayerUI(lastStation);
            audioPlayer.src = lastStation.url_resolved || lastStation.url;
            // Optionally try to auto-play (might be blocked by browser policy)
            // audioPlayer.play().catch(e => console.log('Autoplay blocked'));
        }
    } catch (e) {}
    
    // Auto-adjusting helper for mobile
    window.addEventListener('resize', () => {
        if (window.lucide) lucide.createIcons();
    });

    // Request wake lock for mobile if available to prevent background sleep
    if ('wakeLock' in navigator) {
        let wakeLock = null;
        const requestWakeLock = async () => {
            try {
                wakeLock = await navigator.wakeLock.request('screen');
            } catch (err) {
                console.warn(`${err.name}, ${err.message}`);
            }
        };
        
        document.addEventListener('visibilitychange', async () => {
            if (wakeLock !== null && document.visibilityState === 'visible') {
                await requestWakeLock();
            }
        });
        
        // requestWakeLock(); // Can only be requested after user interaction
    }
}

function setupEventListeners() {
    scanBtn.addEventListener('click', () => {
        const query = searchInput.value.trim();
        currentMode = 'Global';
        modeLabel.textContent = 'Global Categories:';
        indiaOnlyCats.style.display = 'none';
        fetchStations(query);
        updateActiveCat('All');
        switchView('discovery');
    });

    scanIndiaBtn.addEventListener('click', () => {
        searchInput.value = '';
        currentMode = 'India';
        modeLabel.textContent = 'India Categories:';
        indiaOnlyCats.style.display = 'contents';
        fetchStations('', 'India');
        updateActiveCat('All');
        switchView('discovery');
    });

    catButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const tag = btn.dataset.tag;
            const country = currentMode === 'India' ? 'India' : '';
            fetchStations('', country, tag);
            updateActiveCat(btn.textContent);
            switchView('discovery');
        });
    });

    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            fetchStations(searchInput.value.trim());
            switchView('discovery');
        }
    });

    themeToggle.addEventListener('click', toggleTheme);

    playPauseBtn.addEventListener('click', togglePlay);
    
    prevBtn.addEventListener('click', playPrevious);
    nextBtn.addEventListener('click', playNext);

    muteBtn.addEventListener('click', toggleMute);
    
    volumeSlider.addEventListener('input', (e) => {
        updateVolume(e.target.value);
    });

    addToPlaylistBtn.addEventListener('click', () => {
        if (currentStationIndex >= 0 && currentStations[currentStationIndex]) {
            addToPlaylist(currentStations[currentStationIndex]);
        }
    });

    // Tab Switching
    mainTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const target = tab.dataset.tab;
            switchView(target);
        });
    });

    // Scanner Logic
    if (freqSlider) {
        freqSlider.addEventListener('input', (e) => {
            const val = parseFloat(e.target.value).toFixed(1);
            freqValue.textContent = val;
            updateSignalStrength(val);
        });
    }

    if (addCustomBtn) {
        addCustomBtn.addEventListener('click', addCustomStation);
    }

    if (autoScanBtn) {
        autoScanBtn.addEventListener('click', startAutoScan);
    }

    if (saveAllBtn) {
        saveAllBtn.addEventListener('click', saveAllDiscovered);
    }

    // Audio Player Events
    audioPlayer.onplay = () => {
        playIcon.setAttribute('data-lucide', 'pause');
        lucide.createIcons();
        playerStatus.textContent = 'Playing';
        if (nowPlayingCard) nowPlayingCard.classList.add('playing');
        
        // Assert playing state for OS
        if ('mediaSession' in navigator) {
            navigator.mediaSession.playbackState = 'playing';
        }
    };

    let reconnectAttempts = 0;

    audioPlayer.onplaying = () => {
        reconnectAttempts = 0; // Reset on successful play
        if (nowPlayingCard) nowPlayingCard.classList.add('playing');
        playerStatus.textContent = 'Playing';
        playerStatus.style.color = ''; // Reset color
        
        // Re-assert Media Session when it actually starts playing
        if ('mediaSession' in navigator && audioPlayer.src && !audioPlayer.paused) {
            navigator.mediaSession.playbackState = 'playing';
        }
    };

    audioPlayer.onpause = () => {
        playIcon.setAttribute('data-lucide', 'play');
        lucide.createIcons();
        playerStatus.textContent = 'Paused';
        if (nowPlayingCard) nowPlayingCard.classList.remove('playing');
        if ('mediaSession' in navigator) {
            navigator.mediaSession.playbackState = 'paused';
        }
    };

    audioPlayer.onwaiting = () => {
        playerStatus.textContent = 'Buffering...';
    };

    audioPlayer.onerror = (e) => {
        console.error('Audio playback error:', e);
        // Only try to reconnect if not paused by user
        if (!audioPlayer.paused) {
            reconnectAttempts++;
            playerStatus.textContent = `Reconnecting (${reconnectAttempts})...`;
            playerStatus.style.color = 'var(--accent-color)';
            
            // Wait slightly longer each time, up to 10 seconds
            const delay = Math.min(reconnectAttempts * 2000, 10000);
            
            setTimeout(() => {
                if (!audioPlayer.paused) {
                    audioPlayer.load();
                    audioPlayer.play().catch(err => console.log('Reconnect failed', err));
                }
            }, delay);
        } else {
            playerStatus.textContent = 'Paused';
        }
    };
    
    audioPlayer.onended = () => {
        // Live streams normally don't end; if they do, it's often a disconnect
        if (!audioPlayer.paused) {
            reconnectAttempts++;
            playerStatus.textContent = `Retrying Stream (${reconnectAttempts})...`;
            setTimeout(() => {
                if (!audioPlayer.paused) {
                    audioPlayer.load();
                    audioPlayer.play().catch(err => console.log('Retry failed', err));
                }
            }, 3000);
        }
    };

    audioPlayer.onloadstart = () => {
        playerStatus.textContent = 'Loading...';
    };

    // Robust background playback
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            // Ensure audio doesn't pause when hidden
            if (!audioPlayer.paused) {
                if ('mediaSession' in navigator) {
                    navigator.mediaSession.playbackState = 'playing';
                }
            }
        }
    });

    // Periodically re-assert playback state for mobile background
    setInterval(() => {
        if (!audioPlayer.paused && 'mediaSession' in navigator) {
            navigator.mediaSession.playbackState = 'playing';
        }
    }, 20000); // Every 20 seconds
}

// API Functions
async function fetchStations(query = '', country = '', tag = '') {
    mainLoader.style.display = 'flex';
    stationsGrid.innerHTML = '';
    
    let url = `${API_BASE}/stations/search?limit=${DEFAULT_LIMIT}&order=clickcount&reverse=true&hidebroken=true`;
    if (country) {
        url += `&country=${encodeURIComponent(country)}`;
    }
    if (tag) {
        url += `&tag=${encodeURIComponent(tag)}`;
    }
    if (query) {
        url += `&name=${encodeURIComponent(query)}`;
    }

    try {
        const response = await fetch(url);
        currentStations = await response.json();
        renderStations();
        resultsCount.textContent = `${currentStations.length} stations found`;
    } catch (error) {
        console.error('Failed to fetch stations:', error);
        stationsGrid.innerHTML = '<p class="error">Failed to load stations. Please check your internet connection.</p>';
    } finally {
        mainLoader.style.display = 'none';
    }
}

// Render Functions
function renderStations() {
    if (currentStations.length === 0) {
        stationsGrid.innerHTML = '<div class="empty-state"><p>No stations found for this search.</p></div>';
        return;
    }

    stationsGrid.innerHTML = currentStations.map((station, index) => `
        <div class="station-item" onclick="playStation(${index}, 'search', this)">
            <img src="${station.favicon || 'https://via.placeholder.com/60?text=FM'}" 
                 class="list-img" 
                 loading="lazy"
                 onerror="this.onerror=null; this.src='https://via.placeholder.com/60?text=FM';">
            <div class="item-info">
                <h4>${station.name}</h4>
                <p>${station.country} • ${station.tags ? station.tags.split(',').slice(0, 2).join(', ') : 'Radio'}</p>
            </div>
            <div class="item-actions">
                <button class="icon-btn" onclick="event.stopPropagation(); addToPlaylistById('${station.stationuuid}')">
                    <i data-lucide="plus-circle"></i>
                </button>
            </div>
        </div>
    `).join('');
    lucide.createIcons();
}

function renderPlaylist() {
    const playlistHTML = currentPlaylist.length === 0 
        ? `<div class="empty-state"><i data-lucide="list-music"></i><p>No stations saved yet</p></div>`
        : currentPlaylist.map((station, index) => `
            <div class="station-item" onclick="playStation(${index}, 'playlist', this)">
                <img src="${station.favicon || 'https://via.placeholder.com/60?text=FM'}" 
                     class="list-img" 
                     loading="lazy"
                     onerror="this.onerror=null; this.src='https://via.placeholder.com/60?text=FM';">
                <div class="item-info">
                    <h4>${station.name}</h4>
                    <p>${station.country || 'Custom Station'}</p>
                </div>
                <div class="item-actions">
                    <button class="icon-btn" onclick="event.stopPropagation(); removeFromPlaylist(${index})">
                        <i data-lucide="trash-2"></i>
                    </button>
                </div>
            </div>
        `).join('');

    if (quickPlaylistList) quickPlaylistList.innerHTML = playlistHTML;
    if (fullPlaylistList) fullPlaylistList.innerHTML = playlistHTML;
    
    lucide.createIcons();
}

function switchView(target) {
    // Update Tabs
    mainTabs.forEach(tab => {
        if (tab.dataset.tab === target) {
            tab.classList.add('active');
        } else {
            tab.classList.remove('active');
        }
    });

    // Update Views
    Object.keys(views).forEach(key => {
        if (key === target) {
            views[key].style.display = 'block';
        } else {
            views[key].style.display = 'none';
        }
    });
}

function updateSignalStrength(freq) {
    // Simulate signal strength based on frequency (just for UI)
    const seed = Math.sin(freq * 10);
    signalBars.forEach((bar, i) => {
        const height = 10 + (i * 10) + (seed * 5);
        bar.style.height = `${Math.max(5, height)}px`;
        bar.style.opacity = seed > 0.5 ? '1' : '0.4';
    });
}

function addCustomStation() {
    const name = customNameInput.value.trim();
    const url = customUrlInput.value.trim();
    const icon = customIconInput.value.trim();
    const freq = freqValue.textContent;

    if (!name || !url) {
        alert('Please provide at least a name and a stream URL.');
        return;
    }

    const newStation = {
        stationuuid: 'custom-' + Date.now(),
        name: `${name} (${freq} MHz)`,
        url: url,
        url_resolved: url,
        favicon: icon || 'https://via.placeholder.com/200?text=FM',
        country: 'Custom',
        tags: 'FM, Manual'
    };

    addToPlaylist(newStation);
    alert('Station added to your playlist!');
    
    // Clear inputs
    customNameInput.value = '';
    customUrlInput.value = '';
    customIconInput.value = '';
}

function startAutoScan() {
    autoScanBtn.disabled = true;
    autoScanBtn.innerHTML = '<i class="spin" data-lucide="refresh-cw"></i> Scanning...';
    lucide.createIcons();
    discoveredFrequencies = [];
    saveAllBtn.style.display = 'none';
    
    let currentFreq = 87.5;
    const interval = setInterval(() => {
        currentFreq = +(currentFreq + 0.5).toFixed(1);
        freqSlider.value = currentFreq;
        freqValue.textContent = currentFreq;
        updateSignalStrength(currentFreq);
        
        // Simulate finding "active" frequencies
        if (Math.random() > 0.7) {
            discoveredFrequencies.push(currentFreq);
            // Flash frequency display on find
            freqValue.style.color = 'var(--accent-color)';
            setTimeout(() => { freqValue.style.color = 'var(--text-primary)'; }, 200);
        }
        
        if (currentFreq >= 108) {
            clearInterval(interval);
            autoScanBtn.disabled = false;
            autoScanBtn.innerHTML = '<i data-lucide="zap"></i> Auto Scan Frequencies';
            lucide.createIcons();
            
            if (discoveredFrequencies.length > 0) {
                saveAllBtn.style.display = 'flex';
                saveAllBtn.textContent = `Save ${discoveredFrequencies.length} Frequencies`;
                alert(`Scan complete! Found ${discoveredFrequencies.length} active frequencies.`);
            } else {
                alert('Scan complete. No active frequencies found.');
            }
        }
    }, 100);
}

function saveAllDiscovered() {
    if (discoveredFrequencies.length === 0) return;
    
    discoveredFrequencies.forEach(freq => {
        const newStation = {
            stationuuid: 'auto-' + freq + '-' + Date.now(),
            name: `FM Station ${freq}`,
            url: `https://icecast.radio-browser.info/fm/${freq}`, // Placeholder URL
            url_resolved: `https://icecast.radio-browser.info/fm/${freq}`,
            favicon: 'https://via.placeholder.com/200?text=FM',
            country: 'Local Scan',
            tags: 'FM, Scanned'
        };
        currentPlaylist.push(newStation);
    });
    
    savePlaylist();
    renderPlaylist();
    saveAllBtn.style.display = 'none';
    alert(`${discoveredFrequencies.length} stations added to your playlist!`);
}

// Playback Logic
function playStation(index, source = 'search', element = null) {
    let station;
    if (source === 'search') {
        station = currentStations[index];
        currentStationIndex = index;
    } else {
        station = currentPlaylist[index];
    }

    if (!station) return;

    const targetUrl = station.url_resolved || station.url;

    // Prevent restarting the audio if the identical station is clicked again
    // This allows the song to continue playing uninterrupted.
    if (audioPlayer.src === targetUrl || audioPlayer.src.includes(targetUrl)) {
        // If the player is in an error state or wasn't fully loaded, reload it.
        if (audioPlayer.error || audioPlayer.readyState === 0) {
            audioPlayer.load();
        }
        
        if (audioPlayer.paused) {
            audioPlayer.play().catch(e => console.warn('Auto-play failed', e));
        }
        
        // Highlight active item again
        const items = document.querySelectorAll('.station-item');
        items.forEach(item => item.classList.remove('active'));
        if (element) element.classList.add('active');
        
        return;
    }

    // Update Player UI
    updatePlayerUI(station);
    
    // Save to local storage for persistence across reloads
    localStorage.setItem('fm_current_station', JSON.stringify(station));

    // Load and Play
    audioPlayer.src = targetUrl;
    audioPlayer.play().catch(e => {
        console.warn('Auto-play failed, user interaction required.', e);
        playerStatus.textContent = 'Click Play to start';
    });

    // Background Audio Support (Media Session)
    if ('mediaSession' in navigator) {
        navigator.mediaSession.metadata = new MediaMetadata({
            title: station.name,
            artist: station.country || 'FM Radio',
            album: station.tags || 'Internet Radio',
            artwork: [
                { src: station.favicon || 'https://via.placeholder.com/200?text=FM', sizes: '200x200', type: 'image/png' }
            ]
        });

        navigator.mediaSession.setActionHandler('play', () => audioPlayer.play());
        navigator.mediaSession.setActionHandler('pause', () => audioPlayer.pause());
        navigator.mediaSession.setActionHandler('previoustrack', () => playPrevious());
        navigator.mediaSession.setActionHandler('nexttrack', () => playNext());
        
        navigator.mediaSession.playbackState = 'playing';
    }

    // Add active class
    const items = document.querySelectorAll('.station-item');
    items.forEach(item => item.classList.remove('active'));
    
    if (element) {
        element.classList.add('active');
    }
}

function updatePlayerUI(station) {
    const name = station.name || 'Unknown Station';
    const country = station.country || 'Global';
    const tags = station.tags ? station.tags.split(',').slice(0, 2).join(', ') : 'Radio';
    const img = station.favicon || 'https://via.placeholder.com/200?text=Global+FM';

    currentStationName.textContent = name;
    currentStationMeta.textContent = `${country} • ${tags}`;
    currentStationImg.src = img;
    
    playerMiniName.textContent = name;
    playerMiniMeta.textContent = country;
    playerMiniImg.src = img;
    playerMiniImg.onerror = () => { playerMiniImg.src = 'https://via.placeholder.com/48?text=FM'; };
    
    playerStatus.textContent = 'Loading...';
}

function togglePlay() {
    if (!audioPlayer.src) {
        alert("Please select a radio station first!");
        return;
    }
    
    // If stream ended/errored previously, reload before trying to play again
    if (audioPlayer.error || audioPlayer.readyState === 0) {
        audioPlayer.load();
    }

    if (audioPlayer.paused) {
        audioPlayer.play().catch(e => console.error('Play intercepted or failed:', e));
    } else {
        audioPlayer.pause();
    }
    // Double check icon (already handled by event listeners, but for responsiveness)
    setTimeout(() => {
        const iconName = audioPlayer.paused ? 'play' : 'pause';
        playIcon.setAttribute('data-lucide', iconName);
        lucide.createIcons();
    }, 50);
}

function playNext() {
    if (currentStations.length === 0) return;
    currentStationIndex = (currentStationIndex + 1) % currentStations.length;
    playStation(currentStationIndex, 'search');
}

function playPrevious() {
    if (currentStations.length === 0) return;
    currentStationIndex = (currentStationIndex - 1 + currentStations.length) % currentStations.length;
    playStation(currentStationIndex, 'search');
}

// Volume Controls
function updateVolume(value) {
    const volume = value / 100;
    audioPlayer.volume = volume;
    volumeSlider.value = value;
    
    if (volume === 0) {
        volumeIcon.setAttribute('data-lucide', 'volume-x');
    } else if (volume < 0.5) {
        volumeIcon.setAttribute('data-lucide', 'volume-1');
    } else {
        volumeIcon.setAttribute('data-lucide', 'volume-2');
    }
    lucide.createIcons();
    
    if (volume > 0) {
        lastVolume = value;
        isMuted = false;
    }
}

function toggleMute() {
    if (isMuted) {
        updateVolume(lastVolume);
    } else {
        lastVolume = volumeSlider.value;
        updateVolume(0);
        isMuted = true;
    }
}

// Playlist Logic
function addToPlaylist(station) {
    if (currentPlaylist.some(s => s.stationuuid === station.stationuuid)) {
        alert('Station already in playlist!');
        return;
    }
    currentPlaylist.push(station);
    savePlaylist();
    renderPlaylist();
}

function addToPlaylistById(uuid) {
    const station = currentStations.find(s => s.stationuuid === uuid);
    if (station) {
        addToPlaylist(station);
    }
}

function removeFromPlaylist(index) {
    currentPlaylist.splice(index, 1);
    savePlaylist();
    renderPlaylist();
}

function savePlaylist() {
    localStorage.setItem('fm_playlist', JSON.stringify(currentPlaylist));
}

function updateActiveCat(label) {
    catButtons.forEach(btn => {
        if (btn.textContent === label) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
}

// Theme Functions
function toggleTheme() {
    const isLight = document.body.getAttribute('data-theme') === 'light';
    const newTheme = isLight ? 'dark' : 'light';
    setTheme(newTheme);
}

function setTheme(theme) {
    document.body.setAttribute('data-theme', theme);
    localStorage.setItem('fm_theme', theme);
    
    if (theme === 'light') {
        themeIcon.setAttribute('data-lucide', 'sun');
    } else {
        themeIcon.setAttribute('data-lucide', 'moon');
    }
    lucide.createIcons();
}

function loadTheme() {
    const savedTheme = localStorage.getItem('fm_theme') || 'dark';
    setTheme(savedTheme);
}

// Start App
init();
