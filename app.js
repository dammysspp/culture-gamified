// ============================================
// STATE & NAVIGATION
// ============================================
let curScr = 'boot';
let isTrns = false;

function go(toScr) {
    if (isTrns || curScr === toScr) return;
    isTrns = true;

    // Play button specific logic for the lobby bottom nav active states
    const tabs = document.querySelectorAll('.nav-tab');
    if (tabs.length > 0) {
        tabs.forEach(b => b.classList.remove('active'));
        if (toScr === 'lobby' && tabs[0]) tabs[0].classList.add('active');
        if (toScr === 'heroes' && tabs[1]) tabs[1].classList.add('active');
        if (toScr === 'games' && tabs[2]) tabs[2].classList.add('active');
        if (toScr === 'leaderboard' && tabs[3]) tabs[3].classList.add('active');
        if (toScr === 'settings' && tabs[4]) tabs[4].classList.add('active');
    }

    const curtain = document.getElementById('curtain');
    curtain.classList.add('go');

    setTimeout(() => {
        document.getElementById(curScr).classList.remove('on');
        document.getElementById(toScr).classList.add('on');
        curScr = toScr;

        if (toScr === 'heroes') {
            setTimeout(initHeroes, 50);
        }
    }, 450);

    setTimeout(() => {
        curtain.classList.remove('go');
        isTrns = false;
    }, 900);
}
// Attach to window so onclick works in HTML
window.go = go;

// ============================================
// BOOT SEQUENCE (Call of Duty / Blood Strike style)
// ============================================
function initBoot() {
    const fill = document.getElementById('boot-fill');
    const pct = document.getElementById('boot-pct');
    let p = 0;

    const interval = setInterval(() => {
        // Randomize loading speed chunks to make it look real
        p += Math.floor(Math.random() * 8) + 1;
        if (p > 100) p = 100;

        fill.style.width = p + '%';
        pct.innerText = p + '%';

        if (p === 100) {
            clearInterval(interval);
            setTimeout(() => {
                go('title');
            }, 500);
        }
    }, 80); // Speed of loading bar
}

// ============================================
// HERO CAROUSEL LOGIC
// ============================================
function scrollHeroes(dir) {
    const scroll = document.getElementById('heroScroll');
    if (!scroll) return;
    const cw = window.innerWidth * 0.205; // card width + gap approx
    scroll.scrollBy({ left: dir * cw, behavior: 'smooth' });
}
window.scrollHeroes = scrollHeroes;

let heroScrollBound = false;
function initHeroes() {
    const scroll = document.getElementById('heroScroll');
    const cards = document.querySelectorAll('.hero-card');
    if (!scroll || cards.length === 0) return;

    function update() {
        const center = scroll.getBoundingClientRect().left + scroll.offsetWidth / 2;
        cards.forEach(c => {
            const r = c.getBoundingClientRect();
            const cCenter = r.left + r.width / 2;
            const dist = Math.abs(cCenter - center);
            const thresh = window.innerWidth * 0.1;

            if (dist < thresh) {
                if (!c.classList.contains('center')) c.classList.add('center');
            } else {
                c.classList.remove('center');
            }
        });
    }

    if (!heroScrollBound) {
        scroll.addEventListener('scroll', update, { passive: true });
        cards.forEach(c => c.addEventListener('click', (e) => {
            if (e.target.closest('.hc-select')) return; // handled by selectHero
            if (!c.classList.contains('center')) {
                c.scrollIntoView({ behavior: 'smooth', inline: 'center' });
            }
        }));
        heroScrollBound = true;
    }
    update();
}

function selectHero(card) {
    const name = card.getAttribute('data-name');
    const hClass = card.getAttribute('data-class');
    const img = card.getAttribute('data-img');

    // Update the Lobby display with the selected hero
    document.getElementById('lobby-hero-name').innerText = name;
    document.getElementById('lobby-hero-class').innerText = hClass;
    document.getElementById('lobby-hero-img').src = img;

    go('lobby');
}
window.selectHero = selectHero;

// ============================================
// PARTICLES & UI INIT
// ============================================
function spawnEmbers() {
    const c = document.getElementById('embers');
    if (!c) return;
    const cnt = 40;
    for (let i = 0; i < cnt; i++) {
        const p = document.createElement('div');
        p.className = 'ember';
        p.style.left = Math.random() * 100 + 'vw';
        p.style.setProperty('--d', (4 + Math.random() * 8) + 's');
        p.style.setProperty('--del', (Math.random() * 5) + 's');
        const s = (1 + Math.random() * 3) + 'px';
        p.style.width = s; p.style.height = s;
        if (Math.random() > 0.5) p.style.background = '#ff3e5e'; // Adding some red embers
        c.appendChild(p);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    spawnEmbers();
    if (curScr === 'boot') {
        setTimeout(initBoot, 1000);
    }

    // Leaderboard Tabs
    document.querySelectorAll('.lb-tab').forEach(t => {
        t.addEventListener('click', () => {
            document.querySelectorAll('.lb-tab').forEach(x => x.classList.remove('on'));
            t.classList.add('on');
        });
    });

    // Settings Toggles
    document.querySelectorAll('.tog').forEach(t => {
        t.addEventListener('click', () => t.classList.toggle('on'));
    });
});

// Keyboard
document.addEventListener('keydown', (e) => {
    if (curScr === 'title') {
        go('lobby');
    }
    if (curScr === 'heroes') {
        if (e.key === 'ArrowRight') scrollHeroes(1);
        if (e.key === 'ArrowLeft') scrollHeroes(-1);
    }
});

// ============================================
// MANCALA LOGIC
// ============================================
let mState = [];
let mTurn = 0; // 0 for P1 (bottom), 1 for P2 (top)

function openMancala() {
    go('play-mancala');
    initMancala();
}
window.openMancala = openMancala;

function initMancala() {
    mState = [4, 4, 4, 4, 4, 4, 0, 4, 4, 4, 4, 4, 4, 0]; // 0-5 P1 pits, 6 P1 store, 7-12 P2 pits, 13 P2 store
    mTurn = 0;
    renderMancala();
}
window.initMancala = initMancala;

function renderMancala() {
    document.getElementById('m-store-0').innerHTML = mState[6]; // P1 store
    document.getElementById('m-store-1').innerHTML = mState[13]; // P2 store
    document.getElementById('m-score-0').innerText = mState[6];
    document.getElementById('m-score-1').innerText = mState[13];

    for (let i = 0; i < 6; i++) {
        renderPit(i, mState[i]); // P1
        renderPit(7 + i, mState[7 + i]); // P2
    }

    const mStat = document.getElementById('mancala-status');
    mStat.innerText = `Player ${mTurn + 1} Turn`;
    mStat.style.color = mTurn === 0 ? 'var(--cyan)' : 'var(--hot)';
}

function renderPit(idx, count) {
    const p = document.querySelector(`.m-pit[onclick="mancalaClick(${idx})"]`);
    if (!p) return;
    p.innerHTML = '';
    for (let i = 0; i < count; i++) {
        const s = document.createElement('div');
        s.className = 'm-seed';
        p.appendChild(s);
    }
}

function mancalaClick(idx) {
    if (mTurn === 0 && (idx < 0 || idx > 5)) return;
    if (mTurn === 1 && (idx < 7 || idx > 12)) return;

    let seeds = mState[idx];
    if (seeds === 0) return;

    mState[idx] = 0;
    let curr = idx;

    while (seeds > 0) {
        curr = (curr + 1) % 14;

        if (mTurn === 0 && curr === 13) continue;
        if (mTurn === 1 && curr === 6) continue;

        mState[curr]++;
        seeds--;
    }

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

    if ((mTurn === 0 && curr !== 6) || (mTurn === 1 && curr !== 13)) {
        mTurn = 1 - mTurn;
    }

    let p1Empty = true; for (let i = 0; i < 6; i++) { if (mState[i] > 0) p1Empty = false; }
    let p2Empty = true; for (let i = 7; i < 13; i++) { if (mState[i] > 0) p2Empty = false; }

    if (p1Empty || p2Empty) {
        for (let i = 0; i < 6; i++) { mState[6] += mState[i]; mState[i] = 0; }
        for (let i = 7; i < 13; i++) { mState[13] += mState[i]; mState[i] = 0; }
        renderMancala();
        document.getElementById('mancala-status').innerText = mState[6] > mState[13] ? "Player 1 Wins!" : (mState[13] > mState[6] ? "Player 2 Wins!" : "Draw!");
        return;
    }

    renderMancala();
}
window.mancalaClick = mancalaClick;
