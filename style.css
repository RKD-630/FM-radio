:root {
    --primary-color: #6366f1;
    --secondary-color: #a855f7;
    --accent-color: #f43f5e;
    --bg-color: #0c0e14;
    --glass-bg: rgba(255, 255, 255, 0.05);
    --glass-border: rgba(255, 255, 255, 0.1);
    --text-primary: #ffffff;
    --text-secondary: #94a3b8;
    --card-hover: rgba(255, 255, 255, 0.08);
    --transition: cubic-bezier(0.4, 0, 0.2, 1) 0.3s;
}

[data-theme="light"] {
    --bg-color: #f3f4f6;
    --glass-bg: rgba(255, 255, 255, 0.7);
    --glass-border: rgba(0, 0, 0, 0.08);
    --text-primary: #111827;
    --text-secondary: #4b5563;
    --card-hover: rgba(0, 0, 0, 0.04);
}

* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
    font-family: 'Inter', sans-serif;
}

body {
    background-color: var(--bg-color);
    color: var(--text-primary);
    overflow-x: hidden;
    min-height: 100vh;
}

.app-container {
    padding: clamp(1rem, 5vw, 2rem);
    max-width: 1400px;
    margin: 0 auto;
    position: relative;
    padding-bottom: 10rem; /* Space for player */
    width: 100%;
    overflow-x: hidden;
}

/* Background Blobs */
.blob {
    position: fixed;
    width: 500px;
    height: 500px;
    background: radial-gradient(circle, var(--primary-color) 0%, transparent 70%);
    filter: blur(80px);
    opacity: 0.15;
    z-index: -1;
    pointer-events: none;
}

.blob-1 { top: -100px; right: -100px; }
.blob-2 { bottom: -100px; left: -100px; background: radial-gradient(circle, var(--secondary-color) 0%, transparent 70%); }

.glass {
    background: var(--glass-bg);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 1px solid var(--glass-border);
    border-radius: 1.5rem;
}


/* Main Tabs */
.main-tabs {
    display: flex;
    gap: 1rem;
    padding: 0.5rem;
    margin-bottom: 2rem;
    width: fit-content;
}

.tab-btn {
    background: transparent;
    border: none;
    color: var(--text-secondary);
    padding: 0.75rem 1.5rem;
    border-radius: 1rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    font-weight: 600;
    font-size: 0.95rem;
    transition: var(--transition);
}

.tab-btn i {
    width: 18px;
    height: 18px;
}

.tab-btn:hover {
    color: var(--text-primary);
    background: var(--card-hover);
}

.tab-btn.active {
    background: var(--primary-color);
    color: white;
    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
}

/* Header */
header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
    gap: 1.5rem;
    flex-wrap: wrap; /* Added for mobile */
}

.theme-btn {
    padding: 0.75rem;
    border-radius: 50%;
    background: var(--glass-bg);
    border: 1px solid var(--glass-border);
}

[data-theme="light"] h1 {
    background: linear-gradient(to right, #1e293b, #64748b);
    -webkit-background-clip: text;
    background-clip: text;
}

[data-theme="light"] .blob {
    opacity: 0.1;
}

.logo {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    font-family: 'Outfit', sans-serif;
    font-weight: 700;
    font-size: 1.5rem;
    color: var(--text-primary);
}

.logo i {
    color: var(--primary-color);
}

.search-bar {
    flex: 1;
    max-width: 600px;
    display: flex;
    gap: 0.75rem;
    background: var(--glass-bg);
    padding: 0.5rem;
    border-radius: 1rem;
    border: 1px solid var(--glass-border);
}

.search-bar input {
    flex: 1;
    background: transparent;
    border: none;
    padding: 0.75rem 1rem;
    color: var(--text-primary);
    font-size: 0.95rem;
    outline: none;
}

#scan-btn {
    background: var(--primary-color);
    color: white;
    border: none;
    padding: 0.75rem 1.5rem;
    border-radius: 0.75rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-weight: 600;
    transition: var(--transition);
}

#scan-btn:hover {
    background: var(--secondary-color);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
}

.scanner-actions {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    margin-top: 1.5rem;
}

.divider {
    display: flex;
    align-items: center;
    gap: 1rem;
    color: var(--text-secondary);
    font-size: 0.8rem;
    font-weight: 700;
}

.divider::before, .divider::after {
    content: "";
    flex: 1;
    height: 1px;
    background: var(--glass-border);
}

.scanner-auto-actions {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.spin {
    animation: spin 2s linear infinite;
}

@keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
}

.scanner-layout .form-column {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
}

.india-btn {
    background: var(--accent-color);
    color: white;
    border: none;
    padding: 0.75rem 1.5rem;
    border-radius: 0.75rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-weight: 600;
    transition: var(--transition);
}

.india-btn:hover {
    filter: brightness(1.2);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(244, 63, 94, 0.3);
}

.accent-btn {
    background: var(--accent-color);
    color: white;
    border: none;
    padding: 0.75rem 1.5rem;
    border-radius: 0.75rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-weight: 600;
    transition: var(--transition);
}

.accent-btn:hover {
    filter: brightness(1.2);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(244, 63, 94, 0.3);
}

/* Category Nav */
.category-nav {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem 1.5rem;
    margin-bottom: 2rem;
    overflow-x: auto;
    white-space: nowrap;
    scrollbar-width: none; /* Hide scrollbar for clean look */
}

.cat-scroll {
    display: flex;
    gap: 0.75rem;
}

.category-nav::-webkit-scrollbar {
    display: none;
}

.nav-label {
    font-size: 0.8rem;
    font-weight: 800;
    color: var(--secondary-color);
    text-transform: uppercase;
    letter-spacing: 0.1em;
    flex-shrink: 0;
}

.cat-btn {
    background: transparent;
    border: 1px solid var(--glass-border);
    color: var(--text-secondary);
    padding: 0.5rem 1rem;
    border-radius: 2rem;
    cursor: pointer;
    font-size: 0.75rem;
    font-weight: 600;
    transition: var(--transition);
}

.cat-btn:hover {
    border-color: #e88e07;
    color: #e88e07;
}

.cat-btn.active {
    background: #66e359;
    border-color: #e88e07;
    color: #030b2e;
}

/* Hero Section */
.hero-section {
    margin-bottom: 3rem;
}

.now-playing-card {
    padding: 2.5rem;
    display: flex;
    gap: 3rem;
    align-items: center;
    animation: fadeIn 0.8s ease-out;
}

.station-visual {
    position: relative;
    width: 220px;
    height: 220px;
    flex-shrink: 0;
}

.station-visual img {
    width: 100%;
    max-width: 220px;
    height: auto;
    aspect-ratio: 1/1;
    object-fit: cover;
    border-radius: 2rem;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
    position: relative;
    z-index: 1;
}

/* Colorful Equalizer */
.banner-right {
    margin-left: auto;
    padding-right: 2rem;
}

.equalizer-container {
    height: 200px;
    display: flex;
    align-items: center;
}

.colorful-equalizer {
    display: flex;
    align-items: flex-end;
    gap: 8px;
    opacity: 0.6;
    transition: var(--transition);
    height: 100%;
}

.playing .colorful-equalizer {
    opacity: 1;
}

.eq-bar {
    width: 18px;
    height: 20%;
    border-radius: 6px;
    background: linear-gradient(to top, var(--primary-color), var(--secondary-color), var(--accent-color));
    transition: 0.2s ease;
}

.playing .eq-bar {
    animation: eq-bounce 1s infinite alternate ease-in-out;
}

@keyframes eq-bounce {
    0% { height: 30%; transform: scaleY(1); filter: hue-rotate(0deg); }
    50% { height: 90%; transform: scaleY(1.1); filter: hue-rotate(90deg); }
    100% { height: 60%; transform: scaleY(1); filter: hue-rotate(180deg); }
}

.eq-bar:nth-child(1) { animation-delay: -0.1s; background: #6366f1; }
.eq-bar:nth-child(2) { animation-delay: -0.3s; background: #8b5cf6; }
.eq-bar:nth-child(3) { animation-delay: -0.5s; background: #a855f7; }
.eq-bar:nth-child(4) { animation-delay: -0.7s; background: #d946ef; }
.eq-bar:nth-child(5) { animation-delay: -0.9s; background: #d946ef; }
.eq-bar:nth-child(6) { animation-delay: -0.2s; background: #ec4899; }
.eq-bar:nth-child(7) { animation-delay: -0.4s; background: #f43f5e; }
.eq-bar:nth-child(8) { animation-delay: -0.6s; background: #fb7185; }
.eq-bar:nth-child(9) { animation-delay: -0.8s; background: #6366f1; }
.eq-bar:nth-child(10) { animation-delay: -0.3s; background: #a855f7; }
.eq-bar:nth-child(11) { animation-delay: -0.5s; background: #f43f5e; }
.eq-bar:nth-child(12) { animation-delay: -0.7s; background: #d946ef; }
.eq-bar:nth-child(13) { animation-delay: -0.9s; background: #d946ef; }

/* Legacy visualizer (small) */
.visualizer {
    position: absolute;
    bottom: 12px;
    right: 12px;
    display: flex;
    align-items: flex-end;
    gap: 3px;
    height: 40px;
    background: rgba(0, 0, 0, 0.4);
    padding: 6px;
    border-radius: 8px;
    backdrop-filter: blur(4px);
}

.bar {
    width: 4px;
    background: var(--primary-color);
    border-radius: 2px;
    height: 05%;
}

.playing .bar {
    animation: bounce 0.6s infinite alternate;
}

.bar:nth-child(2) { animation-delay: -0.1s; }
.bar:nth-child(3) { animation-delay: -0.2s; }
.bar:nth-child(4) { animation-delay: -0.3s; }
.bar:nth-child(5) { animation-delay: -0.4s; }

@keyframes bounce {
    from { height: 10%; }
    to { height: 100%; }
}

.station-details {
    flex: 1;
}

.status-badge {
    display: inline-block;
    padding: 0.4rem 1rem;
    background: rgba(99, 102, 241, 0.2);
    color: var(--primary-color);
    border-radius: 2rem;
    font-size: 0.8rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 1rem;
}

h1 {
    font-family: 'Outfit', sans-serif;
    font-size: clamp(1.5rem, 8vw, 2.5rem);
    margin-bottom: 0.5rem;
    background: linear-gradient(to right, #fff, #94a3b8);
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
}

#current-station-meta {
    color: var(--text-secondary);
    font-size: 1.1rem;
    margin-bottom: 2rem;
}

.secondary-btn {
    background: var(--glass-bg);
    color: white;
    border: 1px solid var(--glass-border);
    padding: 0.8rem 1.5rem;
    border-radius: 0.8rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.6rem;
    font-weight: 500;
    transition: var(--transition);
}

.secondary-btn:hover {
    background: var(--card-hover);
    border-color: var(--primary-color);
}

/* Content Grid */
.content-grid {
    display: grid;
    grid-template-columns: 1fr 380px;
    gap: 2.5rem;
}

.section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
}

.section-header h2 {
    font-family: 'Outfit', sans-serif;
    font-size: 1.4rem;
}

#results-count {
    font-size: 0.85rem;
    color: var(--text-secondary);
}

.stations-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

/* Station Item Card */
.station-item {
    display: flex;
    align-items: center;
    padding: 1rem;
    background: var(--glass-bg);
    border: 1px solid var(--glass-border);
    border-radius: 1rem;
    cursor: pointer;
    transition: var(--transition);
    gap: 1.25rem;
}

.station-item:hover {
    background: var(--card-hover);
    border-color: var(--primary-color);
    transform: translateX(8px);
}

.station-item.active {
    background: rgba(99, 102, 241, 0.1);
    border-color: var(--primary-color);
}

.list-img {
    width: 60px;
    height: 60px;
    border-radius: 0.75rem;
    object-fit: cover;
}

.item-info {
    flex: 1;
}

.item-info h4 {
    font-size: 1rem;
    margin-bottom: 0.25rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.item-info p {
    font-size: 0.85rem;
    color: var(--text-secondary);
}

.item-actions {
    display: flex;
    gap: 0.5rem;
    opacity: 0;
    transition: 0.2s;
}

.station-item:hover .item-actions {
    opacity: 1;
}

.icon-btn {
    background: transparent;
    border: none;
    color: var(--text-secondary);
    cursor: pointer;
    padding: 0.5rem;
    border-radius: 0.5rem;
    transition: 0.2s;
}

.icon-btn:hover {
    color: var(--primary-color);
    background: rgba(255, 255, 255, 0.1);
}

/* Playlist Column */
.empty-state {
    text-align: center;
    padding: 3rem;
    color: var(--text-secondary);
    background: var(--glass-bg);
    border-radius: 1.5rem;
    border: 1px dashed var(--glass-border);
}

.empty-state i {
    width: 48px;
    height: 48px;
    margin-bottom: 1rem;
    opacity: 0.5;
}

/* Player Bar Controls */
.player-controls {
    position: fixed;
    bottom: 2rem;
    left: 2rem;
    right: 2rem;
    height: auto;
    min-height: 90px;
    padding: 0.5rem 2rem;
    display: grid;
    grid-template-columns: minmax(150px, 300px) 1fr minmax(100px, 300px);
    align-items: center;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
    z-index: 1000;
}

.player-info {
    display: flex;
    align-items: center;
    gap: 1rem;
}

#player-mini-img {
    width: 54px;
    height: 54px;
    border-radius: 0.75rem;
    object-fit: cover;
}

.player-text {
    flex: 1;
    min-width: 0; /* Crucial for ellipsis in flex */
}

.player-text h4 {
    font-size: 1.95rem;
    margin-bottom: 0.150rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.player-text p {
    font-size: 0.8rem;
    color: #f1fc0f;
    white-space: ellipsis;
    overflow: auto;
    text-overflow: ellipsis;
}

/* Mobile Support Fixes */
@media (max-width: 768px) {
    .app-container {
        padding: 0.5rem;
        padding-bottom: 12rem;
        overflow-x: hidden;
        width: 100%;
    }

    header {
        flex-direction: row;
        justify-content: space-between;
        align-items: center;
        gap: 1rem;
    }
    
    .logo { font-size: 1.3rem; }

    .search-bar {
        order: 3;
        width: 100%;
        margin-top: 0.5rem;
        flex-wrap: wrap; 
        gap: 0.5rem;
        background: var(--glass-bg);
        padding: 0.25rem;
    }
    
    .search-bar input { 
        min-width: 100%; /* Force input to take full width on mobile */
        margin-bottom: 0.25rem;
    }
    
    #scan-btn, #scan-india-btn {
        flex: 1; /* Make buttons share the second line */
        justify-content: center;
        padding: 0.6rem 1rem;
        font-size: 0.85rem;
    }

    .main-tabs {
        width: 100%;
        overflow-x: auto;
        padding-bottom: 0.5rem;
        scrollbar-width: none;
        display: flex;
        justify-content: flex-start;
    }
    
    .main-tabs::-webkit-scrollbar { display: none; }

    .category-nav {
        margin-bottom: 1.5rem;
        width: 100%;
        overflow-x: auto;
    }

    .now-playing-card {
        flex-direction: column;
        padding: 1.5rem;
        gap: 1.5rem;
        text-align: center;
    }

    .station-visual {
        width: 150px;
        height: 150px;
    }

    h1 { font-size: 1.6rem; }

    .player-controls {
        bottom: 0;
        left: 0;
        right: 0;
        border-radius: 1.5rem 1.5rem 0 0;
        grid-template-columns: 1fr auto;
        padding: 1rem 1.25rem;
        height: auto;
        gap: 0.75rem;
        width: 100%;
        box-shadow: 0 -10px 30px rgba(0, 0, 0, 0.3);
    }

    .player-info {
        display: flex; 
        max-width: 50%;
        min-width: 0;
    }

    @media (max-width: 400px) {
        .tab-btn span { display: none; }
        .tab-btn { padding: 0.75rem; }
        .logo span { display: none; }
        .player-text { display: none; }
    }
    
    #player-mini-img { width: 44px; height: 44px; }
    .player-text h4 { font-size: 0.85rem; }
    
    .main-controls { 
        gap: 0.5rem; 
        grid-column: 1 / -1; 
        justify-content: space-around; 
        width: 100%; 
        padding-top: 0.5rem;
    }
    
    .player-mini-img { max-width: 40px; height: 40px; }
    
    .control-btn i {
        width: 20px;
        height: 20px;
    }

    .volume-controls { display: none; }

    .scanner-container {
        padding: 1.5rem;
    }

    .tuner-column {
        padding: 1.5rem;
        gap: 1rem;
    }

    #freq-value {
        font-size: 3.5rem;
    }

    .scanner-header {
        margin-bottom: 1.5rem;
    }

    .form-column {
        padding: 1.5rem;
    }
}

.main-controls {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 2rem;
}

.control-btn {
    background: transparent;
    border: none;
    color: var(--text-primary);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: var(--transition);
}

.control-btn:hover:not(:disabled) {
    color: var(--primary-color);
    transform: scale(1.1);
}

.play-btn {
    width: 60px;
    height: 60px;
    background: var(--text-primary);
    color: var(--bg-color);
    border-radius: 50%;
    box-shadow: 0 4px 15px rgba(255, 255, 255, 0.1);
}

.play-btn:hover {
    background: var(--primary-color) !important;
    color: white !important;
}

.volume-controls {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    gap: 1rem;
}

.volume-slider-container {
    width: 120px;
    display: flex;
    align-items: center;
}

input[type="range"] {
    -webkit-appearance: none;
    appearance: none;
    width: 100%;
    height: 4px;
    background: var(--glass-border);
    border-radius: 2px;
    cursor: pointer;
}

input[type="range"]::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 12px;
    height: 12px;
    background: var(--primary-color);
    border-radius: 50%;
    cursor: pointer;
    box-shadow: 0 0 10px rgba(99, 102, 241, 0.5);
}

/* Animations */
@keyframes fadeIn {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
}

/* Loader */
.loader-container {
    display: flex;
    justify-content: center;
    padding: 2rem;
}

.loader {
    width: 30px;
    height: 30px;
    border: 3px solid var(--glass-border);
    border-top-color: var(--primary-color);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
}

@keyframes spin {
    to { transform: rotate(360deg); }
}

/* Responsive adjustment */
@media (max-width: 1100px) {
    .content-grid {
        grid-template-columns: 1fr;
    }
}


/* Scanner Section */
.scanner-container {
    padding: 3rem;
    margin-bottom: 2rem;
    animation: fadeIn 0.6s ease-out;
}

.scanner-header {
    margin-bottom: 3rem;
}

.scanner-header h2 {
    font-size: 2rem;
    margin-bottom: 0.5rem;
    font-family: 'Outfit', sans-serif;
}

.scanner-header p {
    color: var(--text-secondary);
}

.scanner-layout {
    display: grid;
    grid-template-columns: 1fr 400px;
    gap: 4rem;
    align-items: start;
}

.tuner-column {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2rem;
    background: rgba(0, 0, 0, 0.2);
    padding: 3rem;
    border-radius: 2rem;
    border: 1px solid var(--glass-border);
}

.frequency-display {
    display: flex;
    align-items: baseline;
    gap: 0.5rem;
}

#freq-value {
    font-size: 5rem;
    font-weight: 800;
    font-family: 'Outfit', sans-serif;
    color: var(--primary-color);
    text-shadow: 0 0 30px rgba(99, 102, 241, 0.3);
}

.frequency-display .unit {
    font-size: 1.5rem;
    color: var(--text-secondary);
    font-weight: 600;
}

.dial-container {
    width: 100%;
}

#freq-slider {
    width: 100%;
    height: 12px;
    background: linear-gradient(to right, var(--primary-color), var(--secondary-color), var(--accent-color));
    border-radius: 6px;
    -webkit-appearance: none;
    appearance: none;
    outline: none;
}

#freq-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 24px;
    height: 24px;
    background: white;
    border: 4px solid var(--primary-color);
    border-radius: 50%;
    box-shadow: 0 0 20px rgba(99, 102, 241, 0.5);
    cursor: pointer;
}

.scanner-visual {
    width: 100%;
    height: 100px;
    background: #000;
    border-radius: 1rem;
    position: relative;
    overflow: hidden;
    border: 2px solid var(--glass-border);
}

.scan-line {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: repeating-linear-gradient(
        90deg,
        transparent,
        transparent 10px,
        rgba(99, 102, 241, 0.05) 10px,
        rgba(99, 102, 241, 0.05) 20px
    );
}

.scan-line::after {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, var(--primary-color), transparent);
    animation: scanMove 2s infinite linear;
    opacity: 0.3;
}

@keyframes scanMove {
    from { left: -100%; }
    to { left: 100%; }
}

.signal-bars {
    position: absolute;
    bottom: 15px;
    right: 20px;
    display: flex;
    gap: 4px;
    align-items: flex-end;
}

.signal-bars span {
    width: 6px;
    background: var(--primary-color);
    border-radius: 3px;
    transition: height 0.3s ease;
}

.signal-bars span:nth-child(1) { height: 10px; }
.signal-bars span:nth-child(2) { height: 20px; }
.signal-bars span:nth-child(3) { height: 30px; }
.signal-bars span:nth-child(4) { height: 45px; }
.signal-bars span:nth-child(5) { height: 60px; opacity: 0.3; }

.form-column {
    padding: 2.5rem;
}

.form-column h3 {
    font-size: 1.25rem;
    margin-bottom: 2rem;
    font-family: 'Outfit', sans-serif;
}

.input-group {
    margin-bottom: 1.5rem;
}

.input-group label {
    display: block;
    font-size: 0.85rem;
    color: var(--text-secondary);
    margin-bottom: 0.5rem;
}

.input-group input {
    width: 100%;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid var(--glass-border);
    padding: 0.75rem 1rem;
    border-radius: 0.75rem;
    color: white;
    outline: none;
    transition: var(--transition);
}

.input-group input:focus {
    border-color: var(--primary-color);
    background: rgba(255, 255, 255, 0.1);
}

/* Single Column Grid for Playlist View */
.content-grid-single {
    max-width: 900px;
    margin: 0 auto;
    padding-bottom: 4rem;
}

/* Quick Playlist Sidebar */
.desktop-playlist {
    background: rgba(0, 0, 0, 0.1);
    padding: 1.5rem;
    border-radius: 1.5rem;
    border: 1px solid var(--glass-border);
    max-height: calc(100vh - 400px);
    overflow-y: auto;
}

@media (max-width: 1100px) {
    .scanner-layout {
        grid-template-columns: 1fr;
    }
}
