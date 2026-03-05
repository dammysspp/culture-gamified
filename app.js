// ============================================
// STATE & NAVIGATION
// ============================================
let curScr = 'boot';
let isTrns = false;

function go(toScr) {
    if (isTrns || curScr === toScr) return;
    isTrns = true;

    // Update navigation active states
    const tabs = document.querySelectorAll('.nav-tab');
    if (tabs.length > 0) {
        tabs.forEach(b => b.classList.remove('active'));
        if (toScr === 'lobby') tabs[0]?.classList.add('active');
        if (toScr === 'heroes') tabs[1]?.classList.add('active');
        if (toScr === 'games') tabs[2]?.classList.add('active');
        if (toScr === 'community') tabs[3]?.classList.add('active');
    }

    const curtain = document.getElementById('curtain');
    curtain.classList.add('go');

    setTimeout(() => {
        document.getElementById(curScr)?.classList.remove('on');
        document.getElementById(toScr)?.classList.add('on');
        curScr = toScr;

        if (toScr === 'heroes') {
            setTimeout(initHeroes, 50);
        }
        if (toScr === 'community') {
            startChatSim();
        }
    }, 450);

    setTimeout(() => {
        curtain.classList.remove('go');
        isTrns = false;
    }, 900);
}
window.go = go;

// ============================================
// BOOT SEQUENCE
// ============================================
function initBoot() {
    const fill = document.getElementById('boot-fill');
    const pct = document.getElementById('boot-pct');
    if (!fill || !pct) return;
    let p = 0;

    const interval = setInterval(() => {
        p += Math.floor(Math.random() * 8) + 1;
        if (p > 100) p = 100;
        fill.style.width = p + '%';
        pct.innerText = p + '%';
        if (p === 100) {
            clearInterval(interval);
            setTimeout(() => go('title'), 500);
        }
    }, 80);
}

// ============================================
// HERO CAROUSEL LOGIC
// ============================================
function scrollHeroes(dir) {
    const scroll = document.getElementById('heroScroll');
    if (!scroll) return;
    // Fluid movement based on card width
    const card = scroll.querySelector('.rc-card');
    const step = card ? card.offsetWidth + 32 : window.innerWidth * 0.3;
    scroll.scrollBy({ left: dir * step, behavior: 'smooth' });
}
window.scrollHeroes = scrollHeroes;

function checkHeroScroll() {
    const scroll = document.getElementById('heroScroll');
    const cards = document.querySelectorAll('.rc-card');
    if (!scroll || cards.length === 0) return;

    const center = scroll.getBoundingClientRect().left + scroll.offsetWidth / 2;
    cards.forEach(c => {
        const r = c.getBoundingClientRect();
        const cCenter = r.left + r.width / 2;
        const dist = Math.abs(cCenter - center);

        // Thresh for "centering"
        if (dist < r.width * 0.5) {
            c.classList.add('center');
        } else {
            c.classList.remove('center');
        }
    });

    // Handle arrows visibility (optional polish)
}
window.checkHeroScroll = checkHeroScroll;

function initHeroes() {
    checkHeroScroll();
}

function selectHero(card) {
    const name = card.getAttribute('data-name');
    const hClass = card.getAttribute('data-class');
    const img = card.getAttribute('data-img');

    document.getElementById('lobby-hero-name').innerText = name;
    document.getElementById('lobby-hero-class').innerText = hClass;
    document.getElementById('lobby-hero-img').src = img;

    go('lobby');
}
window.selectHero = selectHero;

// ============================================
// MANCALA GAME ENGINE (Oware / Ayo)
// ============================================
let mState = [];
let mTurn = 0; // 0 for P1 (bottom), 1 for P2 (top)

function openMancala(variant) {
    document.getElementById('mancala-header-title').innerText = "Playing: " + variant;
    go('play-mancala');
    initMancala();
}
window.openMancala = openMancala;

function initMancala() {
    // 0-5 P1 pits, 6 P1 store, 7-12 P2 pits, 13 P2 store
    mState = [4, 4, 4, 4, 4, 4, 0, 4, 4, 4, 4, 4, 4, 0];
    mTurn = 0;
    renderMancala();
}
window.initMancala = initMancala;

function renderMancala() {
    document.getElementById('m-store-0').innerText = mState[6];
    document.getElementById('m-store-1').innerText = mState[13];

    for (let i = 0; i < 14; i++) {
        if (i === 6 || i === 13) continue;
        renderPit(i, mState[i]);
    }

    const mStat = document.getElementById('mancala-status');
    if (mStat) {
        mStat.innerText = mTurn === 0 ? "Your Turn" : "Opponent Turn";
        mStat.style.color = mTurn === 0 ? "var(--cyan)" : "var(--hot)";
    }
}

function renderPit(idx, count) {
    const p = document.querySelector(`.m-pit[onclick="mancalaClick(${idx})"]`);
    if (!p) return;
    p.innerHTML = '';
    for (let i = 0; i < count; i++) {
        const s = document.createElement('div');
        s.className = 'm-seed';
        // Randomly scatter seeds slightly for realistic feel
        s.style.transform = `translate(${Math.random() * 10 - 5}px, ${Math.random() * 10 - 5}px)`;
        p.appendChild(s);
    }
}

function mancalaClick(idx) {
    if (isTrns) return;
    // Restrict turns
    if (mTurn === 0 && (idx < 0 || idx > 5)) return;
    if (mTurn === 1 && (idx < 7 || idx > 12)) return;

    let seeds = mState[idx];
    if (seeds === 0) return;

    mState[idx] = 0;
    let curr = idx;

    while (seeds > 0) {
        curr = (curr + 1) % 14;
        // Skip opponent's store
        if (mTurn === 0 && curr === 13) continue;
        if (mTurn === 1 && curr === 6) continue;

        mState[curr]++;
        seeds--;
    }

    // Capture logic
    if (mState[curr] === 1) {
        if (mTurn === 0 && curr >= 0 && curr <= 5) {
            let opp = 12 - curr;
            if (mState[opp] > 0) {
                mState[6] += mState[curr] + mState[opp];
                mState[curr] = 0;
                mState[opp] = 0;
            }
        } else if (mTurn === 1 && curr >= 7 && curr <= 12) {
            let opp = 12 - curr;
            if (mState[opp] > 0) {
                mState[13] += mState[curr] + mState[opp];
                mState[curr] = 0;
                mState[opp] = 0;
            }
        }
    }

    // Extra turn if ending in your store
    if ((mTurn === 0 && curr !== 6) || (mTurn === 1 && curr !== 13)) {
        mTurn = 1 - mTurn;
    }

    // Check game end
    let p1Empty = mState.slice(0, 6).every(s => s === 0);
    let p2Empty = mState.slice(7, 13).every(s => s === 0);

    if (p1Empty || p2Empty) {
        // Collect remaining
        for (let i = 0; i < 6; i++) { mState[6] += mState[i]; mState[i] = 0; }
        for (let i = 7; i < 13; i++) { mState[13] += mState[i]; mState[i] = 0; }
        renderMancala();
        const winText = mState[6] > mState[13] ? "You Won!" : (mState[13] > mState[6] ? "Opponent Won!" : "It's a Draw!");
        document.getElementById('mancala-status').innerText = winText;
        return;
    }

    renderMancala();
}
window.mancalaClick = mancalaClick;

// ============================================
// LUDO MOCK Logic
// ============================================
function openLudo() {
    go('play-ludo');
    const stat = document.getElementById('ludo-status');
    if (stat) stat.innerText = "Match in Progress...";
}
window.openLudo = openLudo;

// ============================================
// COMMUNITY CHAT Logic
// ============================================
const botNames = ["Kwame", "Prya", "Mateo", "Sita", "Ali", "Yara"];
const botMessages = [
    "Just finished a round of Oware. It's truly a test of patience!",
    "Ludo always brings back childhood memories.",
    "Did you know Senet was played in ancient Egypt to represent the journey of the soul?",
    "I'm looking for a clan to join for cultural research.",
    "Anyone want to trade some cultural insights?",
    "The new hero designs are absolutely stunning!",
    "I just learned about the Yoruba origin of Ayo. Fascinating!"
];

function startChatSim() {
    // Prevent multiple intervals
    if (window.chatInterval) clearInterval(window.chatInterval);
    window.chatInterval = setInterval(() => {
        if (curScr === 'community') {
            const name = botNames[Math.floor(Math.random() * botNames.length)];
            const msg = botMessages[Math.floor(Math.random() * botMessages.length)];
            addChatPost(name, msg, true);
        }
    }, 8000);
}

function addChatPost(name, text, isBot) {
    const feed = document.getElementById('chat-feed');
    if (!feed) return;

    const post = document.createElement('div');
    post.className = 'chat-post';
    const avQuery = name === "You" ? "young explorer" : name.toLowerCase();

    post.innerHTML = `
        <img src="https://image.pollinations.ai/prompt/avatar%20portrait%20${avQuery}?width=100" class="cp-av">
        <div class="cp-body">
            <div class="cp-head"><span class="cp-name">${name}</span> <span class="cp-time">Just now</span></div>
            <div class="cp-text">${text}</div>
        </div>
    `;
    feed.prepend(post);
    // Limit posts
    if (feed.children.length > 20) feed.removeChild(feed.lastChild);
}

function sendChat() {
    const input = document.getElementById('chat-input');
    if (!input || !input.value.trim()) return;
    addChatPost("You", input.value, false);
    input.value = '';
}
window.sendChat = sendChat;

// ============================================
// PARTICLES & INITIALIZATION
// ============================================
function spawnEmbers() {
    const c = document.getElementById('embers');
    if (!c) return;
    c.innerHTML = '';
    for (let i = 0; i < 30; i++) {
        const p = document.createElement('div');
        p.className = 'ember';
        p.style.left = Math.random() * 100 + 'vw';
        p.style.setProperty('--d', (4 + Math.random() * 6) + 's');
        p.style.setProperty('--del', (Math.random() * 5) + 's');
        c.appendChild(p);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    spawnEmbers();
    setTimeout(initBoot, 500);

    // Initial check for hero cards
    setTimeout(checkHeroScroll, 1000);

    // Keyboard support
    document.addEventListener('keydown', (e) => {
        if (curScr === 'title') go('lobby');
        if (curScr === 'heroes') {
            if (e.key === 'ArrowRight') scrollHeroes(1);
            if (e.key === 'ArrowLeft') scrollHeroes(-1);
        }
    });

    // Chat enter key
    document.getElementById('chat-input')?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendChat();
    });
});
