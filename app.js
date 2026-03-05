let currentScreenId = 'screen-studio-intro';
let isTransitioning = false;
let currentHeroObj = null;

// Unified Clean/Cinematic Fade Transition
function triggerFadeTransition(targetScreenId) {
    if (isTransitioning || currentScreenId === targetScreenId) return;
    isTransitioning = true;

    const transitionOverlay = document.getElementById('fade-transition');
    const currentScreen = document.getElementById(currentScreenId);
    const targetScreen = document.getElementById(targetScreenId);

    transitionOverlay.classList.add('play-fade');

    setTimeout(() => {
        if (currentScreen) currentScreen.classList.remove('active');
        if (targetScreen) targetScreen.classList.add('active');
        currentScreenId = targetScreenId;

        if (targetScreenId === 'screen-mission-select' && currentHeroObj) {
            populateMissionData();
        }

        // Initialize scroll listener when entering character-select
        if (targetScreenId === 'screen-character-select') {
            // slight delay to let DOM render sizes
            setTimeout(initHeroScroll, 50);
        }

    }, 400);

    setTimeout(() => {
        transitionOverlay.classList.remove('play-fade');
        isTransitioning = false;
    }, 800);
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
        }, 400);

    }, 300);
}

function triggerCinematicAchievement() {
    const ach = document.getElementById('cinematic-achievement');
    ach.classList.remove('pop');
    void ach.offsetWidth; // force reflow
    ach.classList.add('pop');

    setTimeout(() => {
        ach.classList.remove('pop');
    }, 4000);
}

function scrollCarousel(direction) {
    const list = document.querySelector('.arcane-carousel-container');
    if (!list) return;

    // Smooth scroll by approximately one card width (20vw card + 3vw gap)
    const cardWidth = window.innerWidth * 0.23;
    list.scrollBy({ left: direction * cardWidth, behavior: 'smooth' });
}

// ==========================================
// SCROLLABLE CAROUSEL LOGIC
// ==========================================

function initHeroScroll() {
    const list = document.querySelector('.arcane-carousel-container');
    const cards = document.querySelectorAll('.arcane-card');

    if (!list || cards.length === 0) return;

    function updateCardTransforms() {
        // Calculate center of the viewport
        const centerPoint = list.getBoundingClientRect().left + (list.offsetWidth / 2);

        cards.forEach((card) => {
            const cardRect = card.getBoundingClientRect();
            const cardCenter = cardRect.left + (cardRect.width / 2);
            // Distance from card center to container center
            const dist = cardCenter - centerPoint;

            // Check threshold (10vw roughly translates to half a card width)
            if (Math.abs(dist) < window.innerWidth * 0.1) {
                if (!card.classList.contains('pos-center')) {
                    card.className = 'arcane-card pos-center';
                    currentHeroObj = card;
                }
            } else if (dist < 0) {
                card.className = 'arcane-card pos-left';
            } else {
                card.className = 'arcane-card pos-right';
            }
        });
    }

    list.addEventListener('scroll', updateCardTransforms);

    // Support clicking a card to snap exactly to it
    cards.forEach(card => {
        card.addEventListener('click', (e) => {
            if (!card.classList.contains('pos-center')) {
                // Ignore the button click which goes to mission select
                if (e.target.classList.contains('ac-play-btn')) return;

                // Snap card to center
                card.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
            }
        });
    });

    // Force an initial update
    updateCardTransforms();
}

function populateMissionData() {
    if (!currentHeroObj) return;

    const title = currentHeroObj.getAttribute('data-m-title');
    const desc = currentHeroObj.getAttribute('data-m-desc');
    const loc = currentHeroObj.getAttribute('data-m-loc');
    const img = currentHeroObj.getAttribute('data-img');

    document.getElementById('dynamic-mission-title').innerText = title;
    document.getElementById('dynamic-mission-desc').innerText = desc;
    document.getElementById('dynamic-mission-loc').innerText = loc;

    const mapArea = document.getElementById('dynamic-mission-map');
    mapArea.style.backgroundImage = `url('${img}')`;
}

function playIntroSequence() {
    const text1 = document.getElementById('intro-text-1');
    const text2 = document.getElementById('intro-text-2');

    // First company presentation
    setTimeout(() => {
        if (text1) text1.classList.add('show');
    }, 500);

    setTimeout(() => {
        if (text1) text1.classList.remove('show');
    }, 3000);

    // Second company presentation
    setTimeout(() => {
        if (text2) text2.classList.add('show');
    }, 4500);

    setTimeout(() => {
        if (text2) text2.classList.remove('show');
    }, 7000);

    // Transition to Splash Screen
    setTimeout(() => {
        triggerFadeTransition('screen-splash');
    }, 8500);
}

document.addEventListener('DOMContentLoaded', () => {
    initHeroScroll();

    // if starting on the intro screen (default behavior)
    if (currentScreenId === 'screen-studio-intro') {
        playIntroSequence();
    }
});
