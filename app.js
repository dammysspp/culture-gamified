// ============================================
// STATE
// ============================================
let currentScreenId = 'screen-studio-intro';
let isTransitioning = false;
let currentHeroObj = null;

// ============================================
// PARTICLES SYSTEM
// ============================================
function spawnParticles() {
    const canvas = document.getElementById('particles-canvas');
    if (!canvas) return;
    const count = 25;
    for (let i = 0; i < count; i++) {
        const p = document.createElement('div');
        p.className = 'particle';
        p.style.left = Math.random() * 100 + 'vw';
        p.style.setProperty('--dur', (6 + Math.random() * 10) + 's');
        p.style.setProperty('--delay', (Math.random() * 10) + 's');
        p.style.width = (2 + Math.random() * 3) + 'px';
        p.style.height = p.style.width;
        if (Math.random() > 0.6) {
            p.style.background = '#e87040';
            p.style.boxShadow = '0 0 6px #e87040, 0 0 12px rgba(232,112,64,0.3)';
        }
        canvas.appendChild(p);
    }
}

// ============================================
// TRANSITIONS
// ============================================
function triggerFadeTransition(targetScreenId) {
    if (isTransitioning || currentScreenId === targetScreenId) return;
    isTransitioning = true;

    const overlay = document.getElementById('fade-transition');
    const currScreen = document.getElementById(currentScreenId);
    const nextScreen = document.getElementById(targetScreenId);

    overlay.classList.add('play-fade');

    setTimeout(() => {
        if (currScreen) currScreen.classList.remove('active');
        if (nextScreen) nextScreen.classList.add('active');
        currentScreenId = targetScreenId;

        if (targetScreenId === 'screen-mission-select' && currentHeroObj) {
            populateMissionData();
        }
        if (targetScreenId === 'screen-character-select') {
            setTimeout(initHeroScroll, 100);
        }
    }, 500);

    setTimeout(() => {
        overlay.classList.remove('play-fade');
        isTransitioning = false;
    }, 900);
}

function triggerCinematicDive() {
    if (isTransitioning) return;
    isTransitioning = true;
    const flash = document.getElementById('flash-bang');
    flash.classList.add('boom');
    setTimeout(() => {
        document.getElementById(currentScreenId).classList.remove('active');
        document.getElementById('screen-hud').classList.add('active');
        currentScreenId = 'screen-hud';
        setTimeout(() => {
            flash.classList.remove('boom');
            isTransitioning = false;
        }, 500);
    }, 300);
}

function triggerCinematicAchievement() {
    const ach = document.getElementById('cinematic-achievement');
    ach.classList.remove('pop');
    void ach.offsetWidth;
    ach.classList.add('pop');
    setTimeout(() => ach.classList.remove('pop'), 4000);
}

// ============================================
// CAROUSEL
// ============================================
function scrollCarousel(direction) {
    const list = document.querySelector('.arcane-carousel-container');
    if (!list) return;
    const cardWidth = window.innerWidth * 0.225;
    list.scrollBy({ left: direction * cardWidth, behavior: 'smooth' });
}

let scrollListenerAttached = false;

function initHeroScroll() {
    const list = document.querySelector('.arcane-carousel-container');
    const cards = document.querySelectorAll('.arcane-card');
    if (!list || cards.length === 0) return;

    function updateCardStates() {
        const center = list.getBoundingClientRect().left + list.offsetWidth / 2;

        cards.forEach(card => {
            const rect = card.getBoundingClientRect();
            const cardCenter = rect.left + rect.width / 2;
            const dist = cardCenter - center;
            const threshold = window.innerWidth * 0.11;

            if (Math.abs(dist) < threshold) {
                if (!card.classList.contains('pos-center')) {
                    card.className = 'arcane-card pos-center';
                    currentHeroObj = card;
                }
            } else if (dist < 0) {
                if (!card.classList.contains('pos-left')) card.className = 'arcane-card pos-left';
            } else {
                if (!card.classList.contains('pos-right')) card.className = 'arcane-card pos-right';
            }
        });
    }

    if (!scrollListenerAttached) {
        list.addEventListener('scroll', updateCardStates, { passive: true });

        cards.forEach(card => {
            card.addEventListener('click', (e) => {
                if (e.target.closest('.ac-play-btn')) return;
                if (!card.classList.contains('pos-center')) {
                    card.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
                }
            });
        });
        scrollListenerAttached = true;
    }

    updateCardStates();
}

// Also allow arrow key navigation
document.addEventListener('keydown', (e) => {
    if (currentScreenId === 'screen-character-select') {
        if (e.key === 'ArrowRight') scrollCarousel(1);
        if (e.key === 'ArrowLeft') scrollCarousel(-1);
    }
    // Press any key on splash
    if (currentScreenId === 'screen-splash') {
        triggerFadeTransition('screen-main-menu');
    }
});

// ============================================
// MISSION DATA
// ============================================
function populateMissionData() {
    if (!currentHeroObj) return;
    const title = currentHeroObj.getAttribute('data-m-title');
    const desc = currentHeroObj.getAttribute('data-m-desc');
    const loc = currentHeroObj.getAttribute('data-m-loc');
    const img = currentHeroObj.getAttribute('data-img');

    document.getElementById('dynamic-mission-title').innerText = title;
    document.getElementById('dynamic-mission-desc').innerText = desc;
    document.getElementById('dynamic-mission-loc').innerText = loc;
    document.getElementById('dynamic-mission-map').style.backgroundImage = `url('${img}')`;
}

// ============================================
// STUDIO INTRO SEQUENCE
// ============================================
function playIntro() {
    const card1 = document.getElementById('intro-card-1');
    const card2 = document.getElementById('intro-card-2');

    setTimeout(() => { if (card1) card1.classList.add('show'); }, 600);
    setTimeout(() => { if (card1) card1.classList.remove('show'); }, 3200);
    setTimeout(() => { if (card2) card2.classList.add('show'); }, 4500);
    setTimeout(() => { if (card2) card2.classList.remove('show'); }, 7000);
    setTimeout(() => { triggerFadeTransition('screen-splash'); }, 8200);
}

// ============================================
// INIT
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    spawnParticles();
    if (currentScreenId === 'screen-studio-intro') {
        playIntro();
    }
});
