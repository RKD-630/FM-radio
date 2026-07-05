/* =========================================================
   Audio Cutter Pro — Main Application Logic
   ========================================================= */

let ffmpeg, fetchFile;
let ffmpegLoaded = false;
let ffmpegAvailable = true;
try {
  const FFmpegModule = FFmpeg;
  fetchFile = FFmpegModule.fetchFile;
  ffmpeg = FFmpegModule.createFFmpeg({
    log: false,
    corePath: 'https://unpkg.com/@ffmpeg/core@0.11.0/dist/ffmpeg-core.js'
  });
} catch (e) {
  console.warn('FFmpeg WASM not available (SharedArrayBuffer requires HTTPS with COOP/COEP headers). Export/convert features will be limited.');
  ffmpegAvailable = false;
}

// State
const state = {
  audioBuffer: null,
  originalBuffer: null,
  fileName: '',
  fileFormat: '',
  fileSize: 0,
  duration: 0,
  segments: [],        // [{start, end}]
  activeSegment: -1,
  selection: null,     // {start, end} in seconds
  playhead: 0,         // seconds
  isPlaying: false,
  playbackRate: 1,
  volume: 1,
  fadeIn: 0,
  fadeOut: 0,
  zoom: 1,
  pixelsPerSecond: 100,
  undoStack: [],
  redoStack: [],
  sourceNode: null,
  gainNode: null,
  startTime: 0,
  startOffset: 0,
  animFrame: null,
  exportBitrate: 192,
  exportSampleRate: 44100,
  exportFormat: 'mp3',
  exportChannels: 'stereo',
  loop: false,
  muted: false,
  savedVolume: 1
};

// DOM refs
const $ = id => document.getElementById(id);
const dropzone = $('dropzone');
const fileInput = $('fileInput');
const waveCanvas = $('waveCanvas');
const waveformInner = $('waveformInner');
const waveformScroll = $('waveformScroll');
const playhead = $('playhead');
const ruler = $('ruler');
const segmentsList = $('segmentsList');
const segmentsEmpty = $('segmentsEmpty');
const toast = $('toast');

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

/* ============ Utility ============ */
function formatTime(sec) {
  if (!isFinite(sec) || sec < 0) sec = 0;
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  const ms = Math.floor((sec % 1) * 1000);
  return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}.${String(ms).padStart(3,'0')}`;
}
function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024*1024) return (bytes/1024).toFixed(1) + ' KB';
  return (bytes/1024/1024).toFixed(2) + ' MB';
}
function showToast(msg, type='') {
  toast.textContent = msg;
  toast.className = 'toast show ' + type;
  setTimeout(() => toast.className = 'toast', 2500);
}
function getExtension(name) {
  return (name.split('.').pop() || '').toLowerCase();
}

/* ============ Theme ============ */
$('btnTheme').addEventListener('click', () => {
  const cur = document.body.dataset.theme;
  const next = cur === 'dark' ? 'light' : 'dark';
  document.body.dataset.theme = next;
  $('iconTheme').innerHTML = next === 'dark'
    ? '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>'
    : '<circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>';
  drawWaveform();
  drawRuler();
});

/* ============ File Import ============ */
$('btnPickFile').addEventListener('click', () => fileInput.click());
$('btnImportTop').addEventListener('click', () => fileInput.click());
$('btnNewFile').addEventListener('click', () => {
  stopPlayback();
  state.audioBuffer = null;
  state.originalBuffer = null;
  state.segments = [];
  state.activeSegment = -1;
  state.selection = null;
  state.undoStack = [];
  state.redoStack = [];
  $('infoName').textContent = '—';
  $('infoFormat').textContent = '—';
  $('infoDuration').textContent = '—';
  $('infoSize').textContent = '—';
  ['fileInfoCard','waveformCard','playbackCard','segmentsCard','exportCard'].forEach(id => $(id).classList.add('hidden'));
  $('importCard').scrollIntoView({ behavior: 'smooth' });
  showToast('New project started', 'success');
});
fileInput.addEventListener('change', e => {
  if (e.target.files[0]) handleFile(e.target.files[0]);
});
['dragenter','dragover'].forEach(ev => dropzone.addEventListener(ev, e => {
  e.preventDefault(); dropzone.classList.add('dragover');
}));
['dragleave','drop'].forEach(ev => dropzone.addEventListener(ev, e => {
  e.preventDefault(); dropzone.classList.remove('dragover');
}));
dropzone.addEventListener('drop', e => {
  if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
});

async function handleFile(file) {
  try {
    state.fileName = file.name;
    state.fileSize = file.size;
    state.fileFormat = getExtension(file.name);
    $('infoName').textContent = file.name;
    $('infoFormat').textContent = state.fileFormat.toUpperCase();
    $('infoDuration').textContent = 'Loading...';
    $('infoSize').textContent = formatSize(file.size);
    $('fileInfoCard').classList.remove('hidden');
    $('loadProgress').classList.remove('hidden');
    $('loadProgressText').classList.remove('hidden');
    $('loadProgressText').textContent = 'Reading file...';
    $('loadProgressBar').style.width = '10%';

    const videoExts = ['mp4','mov','mkv','avi','webm','3gp'];
    let audioData;
    if (videoExts.includes(state.fileFormat)) {
      $('loadProgressText').textContent = 'Extracting audio from video (FFmpeg)...';
      $('loadProgressBar').style.width = '30%';
      audioData = await extractAudioFromVideo(file);
    } else {
      audioData = new Uint8Array(await file.arrayBuffer());
    }
    $('loadProgressBar').style.width = '70%';
    $('loadProgressText').textContent = 'Decoding audio...';

    const arrayBuffer = audioData.buffer;
    const decoded = await audioCtx.decodeAudioData(arrayBuffer.slice(0));
    state.originalBuffer = decoded;
    state.audioBuffer = decoded;
    state.duration = decoded.duration;
    state.playhead = 0;
    state.segments = [];
    state.activeSegment = -1;
    state.selection = null;
    state.undoStack = [];
    state.redoStack = [];

    $('infoDuration').textContent = formatTime(decoded.duration);
    $('loadProgressBar').style.width = '100%';
    $('loadProgressText').textContent = 'Ready!';
    setTimeout(() => {
      $('loadProgress').classList.add('hidden');
      $('loadProgressText').classList.add('hidden');
    }, 800);

    ['waveformCard','playbackCard','segmentsCard','exportCard'].forEach(id => $(id).classList.remove('hidden'));
    $('exportName').value = state.fileName.replace(/\.[^.]+$/, '') + '-edited';

    setupCanvas();
    drawWaveform();
    drawRuler();
    renderSegments();
    updateUndoRedo();
    showToast('File loaded successfully', 'success');
  } catch (err) {
    console.error(err);
    showToast('Failed to load file: ' + err.message, 'error');
    $('loadProgress').classList.add('hidden');
    $('loadProgressText').classList.add('hidden');
  }
}

async function extractAudioFromVideo(file) {
  if (!ffmpegAvailable) throw new Error('FFmpeg unavailable — serve via HTTPS to import video files');
  if (!ffmpegLoaded) {
    $('loadProgressText').textContent = 'Loading FFmpeg (first time only)...';
    await ffmpeg.load();
    ffmpegLoaded = true;
  }
  ffmpeg.setProgress(({ ratio }) => {
    if (ratio >= 0) {
      $('loadProgressBar').style.width = (30 + ratio * 40) + '%';
    }
  });
  const inputName = 'input.' + state.fileFormat;
  ffmpeg.FS('writeFile', inputName, await fetchFile(file));
  await ffmpeg.run('-i', inputName, '-vn', '-acodec', 'pcm_s16le', '-ar', '44100', '-ac', '2', 'output.wav');
  const data = ffmpeg.FS('readFile', 'output.wav');
  try { ffmpeg.FS('unlink', inputName); } catch(e){}
  try { ffmpeg.FS('unlink', 'output.wav'); } catch(e){}
  return data;
}

/* ============ Waveform Canvas ============ */
function setupCanvas() {
  const dpr = window.devicePixelRatio || 1;
  const totalWidth = Math.max(waveformScroll.clientWidth, state.duration * state.pixelsPerSecond * state.zoom);
  waveformInner.style.width = totalWidth + 'px';
  waveCanvas.width = totalWidth * dpr;
  waveCanvas.height = 180 * dpr;
  waveCanvas.style.width = totalWidth + 'px';
  waveCanvas.style.height = '180px';
  const ctx = waveCanvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function drawWaveform() {
  if (!state.audioBuffer) return;
  const ctx = waveCanvas.getContext('2d');
  const width = waveCanvas.width / (window.devicePixelRatio || 1);
  const height = 180;
  ctx.clearRect(0, 0, width, height);

  const data = state.audioBuffer.getChannelData(0);
  const samplesPerPixel = Math.max(1, Math.floor(data.length / width));
  const mid = height / 2;

  // Gradient
  const grad = ctx.createLinearGradient(0, 0, 0, height);
  const isDark = document.body.dataset.theme === 'dark';
  grad.addColorStop(0, isDark ? '#22d3ee' : '#0891b2');
  grad.addColorStop(0.5, isDark ? '#6366f1' : '#4f46e5');
  grad.addColorStop(1, isDark ? '#8b5cf6' : '#7c3aed');
  ctx.fillStyle = grad;

  // Draw bars
  const barWidth = 2;
  const gap = 1;
  const step = barWidth + gap;
  for (let x = 0; x < width; x += step) {
    const startSample = Math.floor((x / width) * data.length);
    let min = 1, max = -1;
    const end = Math.min(startSample + samplesPerPixel, data.length);
    for (let i = startSample; i < end; i++) {
      const v = data[i];
      if (v < min) min = v;
      if (v > max) max = v;
    }
    const h = Math.max(1, (max - min) * mid);
    ctx.fillRect(x, mid - h/2, barWidth, h);
  }

  // Draw segment highlights
  ctx.save();
  state.segments.forEach((seg, i) => {
    const x1 = (seg.start / state.duration) * width;
    const x2 = (seg.end / state.duration) * width;
    ctx.fillStyle = i === state.activeSegment ? 'rgba(99,102,241,0.25)' : 'rgba(34,211,238,0.12)';
    ctx.fillRect(x1, 0, x2 - x1, height);
    ctx.strokeStyle = i === state.activeSegment ? '#6366f1' : '#22d3ee';
    ctx.setLineDash([4, 3]);
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x1, 0); ctx.lineTo(x1, height);
    ctx.moveTo(x2, 0); ctx.lineTo(x2, height);
    ctx.stroke();
    ctx.setLineDash([]);
  });
  ctx.restore();

  // Selection highlight
  if (state.selection) {
    const x1 = (state.selection.start / state.duration) * width;
    const x2 = (state.selection.end / state.duration) * width;
    ctx.fillStyle = 'rgba(245, 158, 11, 0.25)';
    ctx.fillRect(x1, 0, x2 - x1, height);
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2;
    ctx.strokeRect(x1, 0, x2 - x1, height);
  }
}

function drawRuler() {
  ruler.innerHTML = '';
  const width = waveformInner.clientWidth;
  const dur = state.duration;
  if (!dur) return;
  // Choose tick interval
  let interval = 1;
  const targetTicks = width / 80;
  const raw = dur / targetTicks;
  const steps = [0.1, 0.25, 0.5, 1, 2, 5, 10, 15, 30, 60];
  for (const s of steps) if (s >= raw) { interval = s; break; }
  for (let t = 0; t <= dur; t += interval) {
    const tick = document.createElement('div');
    tick.className = 'ruler-tick';
    tick.style.left = ((t / dur) * width) + 'px';
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    tick.textContent = `${m}:${String(s).padStart(2,'0')}`;
    ruler.appendChild(tick);
  }
}

function updatePlayhead() {
  if (!state.duration) return;
  const width = waveformInner.clientWidth;
  const x = (state.playhead / state.duration) * width;
  playhead.style.left = x + 'px';
  $('timeCurrent').textContent = formatTime(state.playhead);
  $('timeTotal').textContent = formatTime(state.duration);
}

/* ============ Canvas Interaction ============ */
let isDraggingPlayhead = false;
let selectionStart = null;
let pointerDownTime = null;
let pointerDownX = null;

waveCanvas.addEventListener('pointerdown', e => {
  if (!state.audioBuffer) return;
  const rect = waveCanvas.getBoundingClientRect();
  const x = e.clientX - rect.left + waveformScroll.scrollLeft;
  const width = waveCanvas.clientWidth;
  const time = (x / width) * state.duration;

  pointerDownTime = time;
  pointerDownX = e.clientX;
  selectionStart = null;
});

waveCanvas.addEventListener('pointermove', e => {
  if (!state.audioBuffer || pointerDownTime === null) return;
  const rect = waveCanvas.getBoundingClientRect();
  const x = e.clientX - rect.left + waveformScroll.scrollLeft;
  const width = waveCanvas.clientWidth;
  const time = Math.max(0, Math.min(state.duration, (x / width) * state.duration));

  if (selectionStart === null && Math.abs(e.clientX - pointerDownX) > 5) {
    selectionStart = pointerDownTime;
  }

  if (selectionStart !== null) {
    state.selection = {
      start: Math.min(selectionStart, time),
      end: Math.max(selectionStart, time)
    };
    drawWaveform();
  }
});

window.addEventListener('pointerup', () => {
  if (pointerDownTime !== null && selectionStart === null) {
    state.playhead = Math.max(0, Math.min(state.duration, pointerDownTime));
    state.selection = null;
    updatePlayhead();
    drawWaveform();
  }
  pointerDownTime = null;
  selectionStart = null;
});

/* Pinch zoom */
let initialPinchDist = null;
let initialZoom = 1;
waveCanvas.addEventListener('touchstart', e => {
  if (e.touches.length === 2) {
    e.preventDefault();
    const dx = e.touches[0].clientX - e.touches[1].clientX;
    const dy = e.touches[0].clientY - e.touches[1].clientY;
    initialPinchDist = Math.hypot(dx, dy);
    initialZoom = state.zoom;
  }
}, { passive: false });
waveCanvas.addEventListener('touchmove', e => {
  if (e.touches.length === 2 && initialPinchDist) {
    e.preventDefault();
    const dx = e.touches[0].clientX - e.touches[1].clientX;
    const dy = e.touches[0].clientY - e.touches[1].clientY;
    const dist = Math.hypot(dx, dy);
    const scale = dist / initialPinchDist;
    updateZoom(initialZoom * scale);
  }
}, { passive: false });
waveCanvas.addEventListener('touchend', () => { initialPinchDist = null; });

/* Zoom slider & buttons */
function updateZoom(newZoom) {
  state.zoom = Math.max(1, Math.min(20, newZoom));
  $('zoomSlider').value = state.zoom;
  $('zoomLabel').textContent = state.zoom.toFixed(1) + 'x';
  if (state.audioBuffer) {
    setupCanvas();
    drawWaveform();
    drawRuler();
    updatePlayhead();
  }
}
$('zoomSlider').addEventListener('input', e => updateZoom(parseFloat(e.target.value)));
$('btnZoomOut').addEventListener('click', () => updateZoom(state.zoom - 0.5));
$('btnZoomIn').addEventListener('click', () => updateZoom(state.zoom + 0.5));

window.addEventListener('resize', () => {
  if (state.audioBuffer) {
    setupCanvas();
    drawWaveform();
    drawRuler();
    updatePlayhead();
  }
});

/* ============ Playback ============ */
function stopPlayback() {
  if (state.sourceNode) {
    try { state.sourceNode.stop(); } catch(e){}
    state.sourceNode.disconnect();
    state.sourceNode = null;
  }
  state.isPlaying = false;
  cancelAnimationFrame(state.animFrame);
  updatePlayIcon();
}
function startPlayback(from) {
  if (!state.audioBuffer) return;
  if (audioCtx.state === 'suspended') audioCtx.resume();
  stopPlayback();
  const src = audioCtx.createBufferSource();
  src.buffer = state.audioBuffer;
  src.playbackRate.value = state.playbackRate;
  const gain = audioCtx.createGain();
  gain.gain.value = state.volume;
  src.connect(gain).connect(audioCtx.destination);
  state.sourceNode = src;
  state.gainNode = gain;
  state.startTime = audioCtx.currentTime;
  state.startOffset = from !== undefined ? from : state.playhead;
  src.start(0, state.startOffset);
  state.isPlaying = true;
  updatePlayIcon();
  src.onended = () => {
    if (state.isPlaying) {
      if (state.loop) {
        state.playhead = 0;
        startPlayback(0);
      } else {
        state.playhead = state.duration;
        stopPlayback();
        updatePlayhead();
      }
    }
  };
  tickPlayback();
}
function tickPlayback() {
  if (!state.isPlaying) return;
  const elapsed = (audioCtx.currentTime - state.startTime) * state.playbackRate;
  state.playhead = state.startOffset + elapsed;
  if (state.playhead >= state.duration) {
    state.playhead = state.duration;
    stopPlayback();
  }
  updatePlayhead();
  // Auto-scroll
  const width = waveformInner.clientWidth;
  const scrollWidth = waveformScroll.clientWidth;
  const px = (state.playhead / state.duration) * width;
  if (px > waveformScroll.scrollLeft + scrollWidth - 50) {
    waveformScroll.scrollLeft = px - scrollWidth / 2;
  }
  state.animFrame = requestAnimationFrame(tickPlayback);
}
function updatePlayIcon() {
  $('iconPlay').innerHTML = state.isPlaying
    ? '<rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>'
    : '<polygon points="6 3 20 12 6 21 6 3"/>';
}
function togglePlay() {
  if (!state.audioBuffer) { showToast('Import a file first', 'error'); return; }
  if (state.isPlaying) stopPlayback();
  else startPlayback();
}
$('btnPlay').addEventListener('click', togglePlay);
$('btnBottomPlay').addEventListener('click', togglePlay);
$('btnStop').addEventListener('click', () => { stopPlayback(); state.playhead = 0; updatePlayhead(); });
$('btnSkipBack').addEventListener('click', () => {
  state.playhead = Math.max(0, state.playhead - 5);
  if (state.isPlaying) startPlayback(state.playhead);
  else updatePlayhead();
});
$('btnSkipForward').addEventListener('click', () => {
  state.playhead = Math.min(state.duration, state.playhead + 5);
  if (state.isPlaying) startPlayback(state.playhead);
  else updatePlayhead();
});
$('btnPrev').addEventListener('click', () => {
  if (state.segments.length && state.activeSegment > 0) {
    state.activeSegment--;
    state.playhead = state.segments[state.activeSegment].start;
  } else state.playhead = 0;
  if (state.isPlaying) startPlayback(state.playhead);
  else updatePlayhead();
  renderSegments();
});
$('btnNext').addEventListener('click', () => {
  if (state.segments.length && state.activeSegment < state.segments.length - 1) {
    state.activeSegment++;
    state.playhead = state.segments[state.activeSegment].start;
  } else state.playhead = state.duration;
  if (state.isPlaying) startPlayback(state.playhead);
  else updatePlayhead();
  renderSegments();
});
$('btnLoop').addEventListener('click', () => {
  state.loop = !state.loop;
  $('btnLoop').classList.toggle('active-toggle', state.loop);
  showToast(state.loop ? 'Loop ON' : 'Loop OFF', 'success');
});
$('btnMute').addEventListener('click', () => {
  state.muted = !state.muted;
  if (state.muted) {
    state.savedVolume = state.volume;
    state.volume = 0;
    if (state.gainNode) state.gainNode.gain.value = 0;
  } else {
    state.volume = state.savedVolume;
    if (state.gainNode) state.gainNode.gain.value = state.volume;
  }
  $('btnMute').classList.toggle('active-toggle', state.muted);
  $('iconMute').innerHTML = state.muted
    ? '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/>'
    : '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>';
  showToast(state.muted ? 'Muted' : 'Unmuted', 'success');
});
$('speedSelect').addEventListener('change', e => {
  state.playbackRate = parseFloat(e.target.value);
  if (state.sourceNode) state.sourceNode.playbackRate.value = state.playbackRate;
});

/* ============ Split / Segments ============ */
function pushUndo() {
  state.undoStack.push({
    segments: JSON.parse(JSON.stringify(state.segments)),
    activeSegment: state.activeSegment
  });
  state.redoStack = [];
  if (state.undoStack.length > 50) state.undoStack.shift();
  updateUndoRedo();
}
function updateUndoRedo() {
  $('btnUndo').disabled = state.undoStack.length === 0;
  $('btnRedo').disabled = state.redoStack.length === 0;
}
$('btnUndo').addEventListener('click', () => {
  if (!state.undoStack.length) return;
  state.redoStack.push({
    segments: JSON.parse(JSON.stringify(state.segments)),
    activeSegment: state.activeSegment
  });
  const prev = state.undoStack.pop();
  state.segments = prev.segments;
  state.activeSegment = prev.activeSegment;
  drawWaveform();
  renderSegments();
  updateUndoRedo();
});
$('btnRedo').addEventListener('click', () => {
  if (!state.redoStack.length) return;
  state.undoStack.push({
    segments: JSON.parse(JSON.stringify(state.segments)),
    activeSegment: state.activeSegment
  });
  const next = state.redoStack.pop();
  state.segments = next.segments;
  state.activeSegment = next.activeSegment;
  drawWaveform();
  renderSegments();
  updateUndoRedo();
});

function splitAtPlayhead() {
  if (!state.audioBuffer) { showToast('Import a file first', 'error'); return; }
  const t = state.playhead;
  if (t <= 0.01 || t >= state.duration - 0.01) {
    showToast('Move playhead inside the audio', 'error');
    return;
  }
  pushUndo();
  // If no segments, split the whole audio
  if (state.segments.length === 0) {
    state.segments = [{ start: 0, end: t }, { start: t, end: state.duration }];
  } else {
    // Find segment containing t
    const idx = state.segments.findIndex(s => t > s.start && t < s.end);
    if (idx === -1) { showToast('Playhead is on a split point', 'error'); state.undoStack.pop(); return; }
    const seg = state.segments[idx];
    state.segments.splice(idx, 1, { start: seg.start, end: t }, { start: t, end: seg.end });
  }
  state.activeSegment = state.segments.findIndex(s => t >= s.start && t <= s.end);
  drawWaveform();
  renderSegments();
  showToast('Split at ' + formatTime(t), 'success');
}

function deleteActiveSegment() {
  if (state.selection) {
    $('btnBottomCut').click();
    return;
  }
  if (state.activeSegment < 0 || !state.segments.length) {
    showToast('Select a segment first', 'error');
    return;
  }
  pushUndo();
  state.segments.splice(state.activeSegment, 1);
  if (state.activeSegment >= state.segments.length) state.activeSegment = state.segments.length - 1;
  drawWaveform();
  renderSegments();
  showToast('Segment deleted', 'success');
}

function keepOnlyActive() {
  if (state.activeSegment < 0) { showToast('Select a segment', 'error'); return; }
  pushUndo();
  const seg = state.segments[state.activeSegment];
  state.segments = [seg];
  state.activeSegment = 0;
  drawWaveform();
  renderSegments();
  showToast('Kept only selected segment', 'success');
}

function renderSegments() {
  segmentsList.innerHTML = '';
  if (!state.segments.length) {
    segmentsEmpty.classList.remove('hidden');
    return;
  }
  segmentsEmpty.classList.add('hidden');
  state.segments.forEach((seg, i) => {
    const el = document.createElement('div');
    el.className = 'segment' + (i === state.activeSegment ? ' active' : '');
    el.innerHTML = `
      <div class="segment-num">${i+1}</div>
      <div class="segment-info">
        <div class="time">${formatTime(seg.start)} → ${formatTime(seg.end)}</div>
        <div class="dur">Duration: ${formatTime(seg.end - seg.start)}</div>
      </div>
      <div class="segment-actions">
        <button class="mini-btn" data-act="play" title="Play"><svg viewBox="0 0 24 24" fill="currentColor"><polygon points="6 3 20 12 6 21 6 3"/></svg></button>
        <button class="mini-btn" data-act="keep" title="Keep only"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg></button>
        <button class="mini-btn danger" data-act="del" title="Delete"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6"/></svg></button>
      </div>`;
    el.addEventListener('click', e => {
      if (e.target.closest('[data-act]')) return;
      state.activeSegment = i;
      state.playhead = seg.start;
      updatePlayhead();
      renderSegments();
      drawWaveform();
    });
    el.querySelector('[data-act="play"]').addEventListener('click', e => {
      e.stopPropagation();
      state.activeSegment = i;
      state.playhead = seg.start;
      startPlayback(seg.start);
      setTimeout(stopPlayback, (seg.end - seg.start) * 1000 / state.playbackRate);
      renderSegments();
    });
    el.querySelector('[data-act="del"]').addEventListener('click', e => {
      e.stopPropagation();
      state.activeSegment = i;
      deleteActiveSegment();
    });
    el.querySelector('[data-act="keep"]').addEventListener('click', e => {
      e.stopPropagation();
      state.activeSegment = i;
      keepOnlyActive();
    });
    segmentsList.appendChild(el);
  });
}

$('btnBottomSplit').addEventListener('click', splitAtPlayhead);
$('btnBottomDelete').addEventListener('click', deleteActiveSegment);
$('btnBottomCut').addEventListener('click', () => {
  if (!state.selection) { showToast('Drag on waveform to select', 'error'); return; }
  pushUndo();
  const { start, end } = state.selection;
  // Remove the selected range from segments (or from full audio)
  if (state.segments.length === 0) {
    const newSegs = [];
    if (start > 0.01) newSegs.push({ start: 0, end: start });
    if (end < state.duration - 0.01) newSegs.push({ start: end, end: state.duration });
    state.segments = newSegs;
  } else {
    const newSegs = [];
    state.segments.forEach(s => {
      if (end <= s.start || start >= s.end) { newSegs.push(s); return; }
      if (start > s.start) newSegs.push({ start: s.start, end: Math.min(start, s.end) });
      if (end < s.end) newSegs.push({ start: Math.max(end, s.start), end: s.end });
    });
    state.segments = newSegs;
  }
  state.selection = null;
  state.activeSegment = -1;
  drawWaveform();
  renderSegments();
  showToast('Cut selection removed', 'success');
});
$('btnBottomTrim').addEventListener('click', () => {
  if (!state.selection && state.activeSegment < 0) { 
    showToast('Make a selection (drag) or select a segment first', 'error'); 
    return; 
  }
  pushUndo();
  let start, end;
  if (state.selection) {
    start = state.selection.start;
    end = state.selection.end;
    state.selection = null;
  } else {
    start = state.segments[state.activeSegment].start;
    end = state.segments[state.activeSegment].end;
  }
  state.segments = [{ start, end }];
  state.activeSegment = 0;
  drawWaveform();
  renderSegments();
  showToast('Trimmed to selection', 'success');
});

/* ============ Help Modal ============ */
$('btnHelp').addEventListener('click', () => $('helpModal').classList.add('open'));
$('btnCloseHelp').addEventListener('click', () => $('helpModal').classList.remove('open'));
$('helpModal').addEventListener('click', e => {
  if (e.target === $('helpModal')) $('helpModal').classList.remove('open');
});

/* ============ Volume / Effects Modal ============ */
$('btnBottomVolume').addEventListener('click', () => $('volumeModal').classList.add('open'));
$('btnPlaybackVolume').addEventListener('click', () => $('volumeModal').classList.add('open'));
$('btnCloseVolume').addEventListener('click', () => $('volumeModal').classList.remove('open'));
$('volumeModal').addEventListener('click', e => {
  if (e.target === $('volumeModal')) $('volumeModal').classList.remove('open');
});
$('volumeSlider').addEventListener('input', e => {
  state.volume = parseInt(e.target.value) / 100;
  $('volumeVal').textContent = e.target.value + '%';
  if (state.gainNode) state.gainNode.gain.value = state.volume;
});
$('btnApplyEffects').addEventListener('click', async () => {
  state.fadeIn = parseFloat($('fadeIn').value) || 0;
  state.fadeOut = parseFloat($('fadeOut').value) || 0;
  state.volume = parseInt($('volumeSlider').value) / 100;
  $('volumeModal').classList.remove('open');
  showToast('Effects will apply on export', 'success');
});

/* ============ Export ============ */
document.querySelectorAll('#bitrateChips .chip').forEach(c => c.addEventListener('click', () => {
  document.querySelectorAll('#bitrateChips .chip').forEach(x => x.classList.remove('active'));
  c.classList.add('active');
  state.exportBitrate = parseInt(c.dataset.bitrate);
}));
document.querySelectorAll('#sampleChips .chip').forEach(c => c.addEventListener('click', () => {
  document.querySelectorAll('#sampleChips .chip').forEach(x => x.classList.remove('active'));
  c.classList.add('active');
  state.exportSampleRate = parseInt(c.dataset.sample);
}));
$('exportFormat').addEventListener('change', e => {
  state.exportFormat = e.target.value;
  const lossless = ['wav','flac','au','aiff'];
  const bitrateGroup = $('bitrateGroup');
  if (lossless.includes(e.target.value)) {
    bitrateGroup.style.display = 'none';
  } else {
    bitrateGroup.style.display = '';
  }
});
$('exportChannels').addEventListener('change', e => state.exportChannels = e.target.value);
$('btnExport').addEventListener('click', exportAudio);
$('btnBottomSave').addEventListener('click', exportAudio);
$('btnBottomConvert').addEventListener('click', () => {
  $('exportCard').scrollIntoView({ behavior: 'smooth', block: 'center' });
});

async function exportAudio() {
  if (!state.audioBuffer) { showToast('Import a file first', 'error'); return; }

  $('exportProgress').classList.remove('hidden');
  $('exportProgressText').classList.remove('hidden');
  $('exportProgressText').textContent = 'Preparing audio...';
  $('exportProgressBar').style.width = '10%';

  try {
    const ext = state.exportFormat;

    // Build final buffer from segments (or full audio)
    const mergedBuffer = await buildMergedBuffer();
    $('exportProgressBar').style.width = '30%';
    $('exportProgressText').textContent = 'Encoding to ' + ext.toUpperCase() + '...';

    // Apply volume/fades in offline context
    const processed = await applyEffects(mergedBuffer);
    $('exportProgressBar').style.width = '50%';

    // --- Decide export path ---
    // If FFmpeg is available and loaded (or can load), use it for all formats.
    // Otherwise, use pure-JS fallback for WAV/MP3, and auto-fallback to WAV for other formats.
    let outputBytes, outputExt, outputMime;

    const canUseFFmpeg = await tryLoadFFmpeg();

    if (canUseFFmpeg) {
      // ---- FFmpeg path (works on HTTPS with COOP/COEP) ----
      const result = await exportViaFFmpeg(processed, ext);
      outputBytes = result.data;
      outputExt = ext;
    } else {
      // ---- Pure JS fallback (works everywhere, even file://) ----
      if (ext === 'wav') {
        outputBytes = bufferToWav(processed);
        outputExt = 'wav';
      } else if (ext === 'mp3') {
        $('exportProgressText').textContent = 'Encoding MP3 (pure JS)...';
        outputBytes = await encodeMp3PureJS(processed);
        outputExt = 'mp3';
      } else {
        // For all other formats, fallback to WAV with a notification
        showToast('FFmpeg unavailable — exporting as WAV instead', '');
        outputBytes = bufferToWav(processed);
        outputExt = 'wav';
      }
    }

    $('exportProgressBar').style.width = '100%';
    $('exportProgressText').textContent = 'Final size: ' + formatSize(outputBytes.byteLength || outputBytes.length);

    // MIME type map
    const mimeMap = {
      mp3: 'audio/mpeg', wav: 'audio/wav', wma: 'audio/x-ms-wma',
      ogg: 'audio/ogg', aac: 'audio/aac', au: 'audio/basic',
      flac: 'audio/flac', m4a: 'audio/mp4', mka: 'audio/x-matroska',
      aiff: 'audio/aiff', opus: 'audio/opus'
    };
    outputMime = mimeMap[outputExt] || 'audio/' + outputExt;

    // Download
    const blob = new Blob([outputBytes instanceof Uint8Array ? outputBytes.buffer : outputBytes], { type: outputMime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = ($('exportName').value || 'edited-audio') + '.' + outputExt;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 5000);

    // Save project metadata to IndexedDB
    const fileSize = outputBytes.byteLength || outputBytes.length;
    await saveProjectMeta({
      name: $('exportName').value,
      format: outputExt,
      size: fileSize,
      date: Date.now()
    });

    showToast('Export complete! File downloaded.', 'success');
    setTimeout(() => {
      $('exportProgress').classList.add('hidden');
      $('exportProgressText').classList.add('hidden');
    }, 2500);
    loadProjects();
  } catch (err) {
    console.error(err);
    showToast('Export failed: ' + err.message, 'error');
    $('exportProgress').classList.add('hidden');
    $('exportProgressText').classList.add('hidden');
  }
}

/* Try to load FFmpeg; returns true if available and loaded */
async function tryLoadFFmpeg() {
  if (!ffmpegAvailable) return false;
  if (ffmpegLoaded) return true;
  try {
    await ffmpeg.load();
    ffmpegLoaded = true;
    return true;
  } catch (e) {
    console.warn('FFmpeg load failed:', e);
    ffmpegAvailable = false;
    return false;
  }
}

/* Export via FFmpeg (for all formats) */
async function exportViaFFmpeg(processed, ext) {
  const wavBytes = bufferToWav(processed);
  ffmpeg.setProgress(({ ratio }) => {
    if (ratio >= 0) $('exportProgressBar').style.width = (50 + ratio * 45) + '%';
  });
  ffmpeg.FS('writeFile', 'input.wav', wavBytes);

  let args = ['-i', 'input.wav'];
  if (ext === 'mp3') args = args.concat(['-codec:a', 'libmp3lame', '-b:a', state.exportBitrate + 'k']);
  else if (ext === 'aac') args = args.concat(['-c:a', 'aac', '-b:a', state.exportBitrate + 'k']);
  else if (ext === 'm4a') args = args.concat(['-c:a', 'aac', '-b:a', state.exportBitrate + 'k']);
  else if (ext === 'ogg') args = args.concat(['-c:a', 'libvorbis', '-b:a', state.exportBitrate + 'k']);
  else if (ext === 'opus') args = args.concat(['-c:a', 'libopus', '-b:a', state.exportBitrate + 'k']);
  else if (ext === 'flac') args = args.concat(['-c:a', 'flac']);
  else if (ext === 'wma') args = args.concat(['-c:a', 'wmav2', '-b:a', state.exportBitrate + 'k']);
  else if (ext === 'au') args = args.concat(['-c:a', 'pcm_s16be', '-f', 'au']);
  else if (ext === 'mka') args = args.concat(['-c:a', 'libvorbis', '-b:a', state.exportBitrate + 'k']);
  else if (ext === 'aiff') args = args.concat(['-c:a', 'pcm_s16be']);
  // wav is just copy
  if (state.exportChannels === 'mono') args = args.concat(['-ac', '1']);
  args = args.concat(['-ar', String(state.exportSampleRate), 'output.' + ext]);

  await ffmpeg.run(...args);
  const outData = ffmpeg.FS('readFile', 'output.' + ext);
  try { ffmpeg.FS('unlink', 'input.wav'); } catch(e){}
  try { ffmpeg.FS('unlink', 'output.' + ext); } catch(e){}
  return { data: outData };
}

/* Pure JS MP3 encoder using lamejs */
let lamejsLoaded = false;
async function loadLamejs() {
  if (lamejsLoaded) return;
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/lamejs@1.2.1/lame.min.js';
    script.onload = () => { lamejsLoaded = true; resolve(); };
    script.onerror = () => reject(new Error('Failed to load lamejs encoder'));
    document.head.appendChild(script);
  });
}

async function encodeMp3PureJS(audioBuffer) {
  await loadLamejs();
  const numCh = state.exportChannels === 'mono' ? 1 : audioBuffer.numberOfChannels;
  const sampleRate = audioBuffer.sampleRate;
  const kbps = state.exportBitrate;
  const mp3encoder = new lamejs.Mp3Encoder(numCh, sampleRate, kbps);
  const blockSize = 1152;
  const mp3Data = [];

  // Get channel data as Int16
  const floatToInt16 = (float32) => {
    const int16 = new Int16Array(float32.length);
    for (let i = 0; i < float32.length; i++) {
      const s = Math.max(-1, Math.min(1, float32[i]));
      int16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    return int16;
  };

  const left = floatToInt16(audioBuffer.getChannelData(0));
  const right = numCh > 1 ? floatToInt16(audioBuffer.getChannelData(Math.min(1, audioBuffer.numberOfChannels - 1))) : null;

  const totalBlocks = Math.ceil(left.length / blockSize);
  for (let i = 0; i < left.length; i += blockSize) {
    const leftChunk = left.subarray(i, i + blockSize);
    const rightChunk = right ? right.subarray(i, i + blockSize) : null;
    let mp3buf;
    if (numCh === 1) {
      mp3buf = mp3encoder.encodeBuffer(leftChunk);
    } else {
      mp3buf = mp3encoder.encodeBuffer(leftChunk, rightChunk);
    }
    if (mp3buf.length > 0) mp3Data.push(mp3buf);
    // Update progress
    const progress = 50 + ((i / left.length) * 45);
    $('exportProgressBar').style.width = progress + '%';
  }
  const mp3End = mp3encoder.flush();
  if (mp3End.length > 0) mp3Data.push(mp3End);

  // Merge all chunks
  let totalLen = 0;
  mp3Data.forEach(b => totalLen += b.length);
  const merged = new Uint8Array(totalLen);
  let offset = 0;
  mp3Data.forEach(b => { merged.set(b, offset); offset += b.length; });
  return merged;
}

async function buildMergedBuffer() {
  const sr = state.audioBuffer.sampleRate;
  const channels = state.exportChannels === 'mono' ? 1 : state.audioBuffer.numberOfChannels;
  let totalSamples = 0;
  const ranges = state.segments.length ? state.segments : [{ start: 0, end: state.duration }];
  const rangesSamples = ranges.map(r => ({
    start: Math.floor(r.start * sr),
    end: Math.floor(r.end * sr)
  }));
  rangesSamples.forEach(r => totalSamples += (r.end - r.start));
  const out = audioCtx.createBuffer(channels, totalSamples, sr);
  let offset = 0;
  for (const r of rangesSamples) {
    const len = r.end - r.start;
    for (let c = 0; c < channels; c++) {
      const srcCh = state.audioBuffer.getChannelData(Math.min(c, state.audioBuffer.numberOfChannels - 1));
      const dstCh = out.getChannelData(c);
      dstCh.set(srcCh.subarray(r.start, r.end), offset);
    }
    offset += len;
  }
  return out;
}

async function applyEffects(buffer) {
  const offline = new OfflineAudioContext(buffer.numberOfChannels, buffer.length, buffer.sampleRate);
  const src = offline.createBufferSource();
  src.buffer = buffer;
  const gain = offline.createGain();
  gain.gain.value = state.volume;
  // Fade in
  if (state.fadeIn > 0) {
    gain.gain.setValueAtTime(0, 0);
    gain.gain.linearRampToValueAtTime(state.volume, state.fadeIn);
  }
  // Fade out
  if (state.fadeOut > 0) {
    const end = buffer.duration;
    gain.gain.setValueAtTime(state.volume, Math.max(0, end - state.fadeOut));
    gain.gain.linearRampToValueAtTime(0, end);
  }
  src.connect(gain).connect(offline.destination);
  src.start();
  return await offline.startRendering();
}

/* WAV encoder (PCM 16-bit) */
function bufferToWav(buffer) {
  const numCh = buffer.numberOfChannels;
  const sr = buffer.sampleRate;
  const len = buffer.length;
  const bytesPerSample = 2;
  const blockAlign = numCh * bytesPerSample;
  const byteRate = sr * blockAlign;
  const dataSize = len * blockAlign;
  const buf = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buf);
  const writeStr = (o, s) => { for (let i = 0; i < s.length; i++) view.setUint8(o + i, s.charCodeAt(i)); };
  writeStr(0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeStr(8, 'WAVE');
  writeStr(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numCh, true);
  view.setUint32(24, sr, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true);
  writeStr(36, 'data');
  view.setUint32(40, dataSize, true);
  // Interleave
  const channels = [];
  for (let c = 0; c < numCh; c++) channels.push(buffer.getChannelData(c));
  let offset = 44;
  for (let i = 0; i < len; i++) {
    for (let c = 0; c < numCh; c++) {
      let s = Math.max(-1, Math.min(1, channels[c][i]));
      s = s < 0 ? s * 0x8000 : s * 0x7FFF;
      view.setInt16(offset, s, true);
      offset += 2;
    }
  }
  return new Uint8Array(buf);
}

/* ============ IndexedDB Projects ============ */
const DB_NAME = 'AudioCutterProDB';
const STORE = 'projects';
function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = e => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: 'id', autoIncrement: true });
    };
    req.onsuccess = e => resolve(e.target.result);
    req.onerror = e => reject(e.target.error);
  });
}
async function saveProjectMeta(meta) {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).add(meta);
  } catch(e) { console.warn(e); }
}
async function loadProjects() {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).getAll();
    req.onsuccess = () => {
      const projects = req.result || [];
      const list = $('projectsList');
      const empty = $('projectsEmpty');
      list.innerHTML = '';
      if (!projects.length) { empty.classList.remove('hidden'); return; }
      empty.classList.add('hidden');
      projects.slice().reverse().forEach(p => {
        const el = document.createElement('div');
        el.className = 'segment';
        el.innerHTML = `
          <div class="segment-num">${(p.format || '?').toUpperCase().slice(0,3)}</div>
          <div class="segment-info">
            <div class="time">${p.name || 'Untitled'}</div>
            <div class="dur">${new Date(p.date).toLocaleString()} • ${formatSize(p.size || 0)}</div>
          </div>
          <div class="segment-actions">
            <button class="mini-btn danger" title="Delete"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6"/></svg></button>
          </div>`;
        el.querySelector('.mini-btn').addEventListener('click', async () => {
          const db = await openDB();
          const tx = db.transaction(STORE, 'readwrite');
          tx.objectStore(STORE).delete(p.id);
          tx.oncomplete = () => { loadProjects(); showToast('Project deleted', 'success'); };
        });
        list.appendChild(el);
      });
    };
  } catch(e) { console.warn(e); }
}
loadProjects();

/* ============ Keyboard Shortcuts ============ */
window.addEventListener('keydown', e => {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
  if (e.code === 'Space') { e.preventDefault(); togglePlay(); }
  else if (e.key === 's' || e.key === 'S') { e.preventDefault(); splitAtPlayhead(); }
  else if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); deleteActiveSegment(); }
  else if ((e.ctrlKey || e.metaKey) && e.key === 'z') { e.preventDefault(); $('btnUndo').click(); }
  else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.shiftKey && e.key === 'Z'))) { e.preventDefault(); $('btnRedo').click(); }
  else if (e.key === 'ArrowLeft') { state.playhead = Math.max(0, state.playhead - 0.5); updatePlayhead(); }
  else if (e.key === 'ArrowRight') { state.playhead = Math.min(state.duration, state.playhead + 0.5); updatePlayhead(); }
});

/* ============ PWA Service Worker ============ */
if ('serviceWorker' in navigator) {
  const swCode = `
    const CACHE = 'audiocutter-v1';
    self.addEventListener('install', e => { self.skipWaiting(); });
    self.addEventListener('activate', e => { e.waitUntil(self.clients.claim()); });
    self.addEventListener('fetch', e => {
      if (e.request.method !== 'GET') return;
      e.respondWith(
        caches.open(CACHE).then(cache =>
          cache.match(e.request).then(cached => {
            const fetchPromise = fetch(e.request).then(resp => {
              if (resp && resp.status === 200 && resp.type === 'basic') {
                cache.put(e.request, resp.clone());
              }
              return resp;
            }).catch(() => cached);
            return cached || fetchPromise;
          })
        )
      );
    });
  `;
  const blob = new Blob([swCode], { type: 'application/javascript' });
  const swUrl = URL.createObjectURL(blob);
  navigator.serviceWorker.register(swUrl).catch(() => {});
}

/* Initial setup */
setupCanvas();
drawRuler();
updatePlayhead();