// ============================================
// STATE & NAVIGATION
// ============================================
let curScr = 'boot';
let isTrns = false;

function go(toScr) {
    if (isTrns || curScr === toScr) return;
    isTrns = true;

    // Play button specific logic for the lobby bottom nav active states
    document.querySelectorAll('.bot-btn').forEach(b => b.classList.remove('active'));
    if (toScr === 'lobby') document.querySelectorAll('.bot-btn')[0].classList.add('active');
    if (toScr === 'heroes') document.querySelectorAll('.bot-btn')[1].classList.add('active');
    if (toScr === 'games') document.querySelectorAll('.bot-btn')[2].classList.add('active');
    if (toScr === 'leaderboard') document.querySelectorAll('.bot-btn')[3].classList.add('active');
    if (toScr === 'settings') document.querySelectorAll('.bot-btn')[4].classList.add('active');

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
