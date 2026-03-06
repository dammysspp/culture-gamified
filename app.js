// ============================================
// STATE & NAVIGATION
// ============================================
let curScr = 'boot';
let isTrns = false;
const screenToTab = {
    lobby: 'tab-lobby',
    heroes: 'tab-heroes',
    games: 'tab-games',
    community: 'tab-community',
    leaderboard: 'tab-leaderboard'
};

function updateNavUI(toScr) {
    const tabs = document.querySelectorAll('.nav-tab');
    const indicator = document.getElementById('nav-indicator');
    if (tabs.length === 0) return;

    tabs.forEach(b => b.classList.remove('active'));
    const tabId = screenToTab[toScr];
    const targetTab = tabId ? document.getElementById(tabId) : null;

    if (targetTab) {
        targetTab.classList.add('active');
        if (indicator) {
            indicator.style.left = `${targetTab.offsetLeft}px`;
            indicator.style.width = `${targetTab.offsetWidth}px`;
        }
    }
}

function go(toScr) {
    const targetScreen = document.getElementById(toScr);
    if (!targetScreen) {
        showToast('Navigator', `Unable to open "${toScr}" screen.`);
        return;
    }

    if (isTrns || curScr === toScr) return;
    isTrns = true;
    updateNavUI(toScr);

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
        const normDist = Math.min(1, dist / (window.innerWidth * 0.4));

        // Center check
        if (dist < r.width * 0.5) {
            c.classList.add('center');
        } else {
            c.classList.remove('center');
        }

        // Parallax depth effect for card background
        const bg = c.querySelector('.rc-bg');
        if (bg) {
            const moveX = (cCenter - center) * -0.15;
            bg.style.transform = `scale(1.2) translateX(${moveX}px)`;
        }

        // Deep Fluid scaling for focused element
        if (!c.classList.contains('center')) {
            c.style.opacity = 0.4 + (1 - normDist) * 0.6;
            c.style.filter = `blur(${normDist * 5}px) grayscale(${normDist * 100}%)`;
            c.style.transform = `scale(${0.85 + (1 - normDist) * 0.15}) rotateY(${(cCenter - center) * 0.05}deg)`;
        } else {
            c.style.opacity = 1;
            c.style.filter = `blur(0) grayscale(0)`;
            c.style.transform = `scale(1.1) rotateY(0deg)`;
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
let playerXP = 2400;
let questProgress = 0;
let questClaimed = false;

function updateGamificationUI() {
    const xpFill = document.getElementById('xp-fill');
    const xpValue = document.getElementById('xp-value');
    const questFill = document.getElementById('quest-fill');

    const xpTarget = 3000;
    const xpPct = Math.max(0, Math.min(100, (playerXP / xpTarget) * 100));

    if (xpFill) xpFill.style.width = `${xpPct}%`;
    if (xpValue) xpValue.innerText = `${playerXP} / ${xpTarget}`;
    if (questFill) questFill.style.width = `${Math.min(100, questProgress)}%`;
}
window.updateGamificationUI = updateGamificationUI;

function claimQuestReward() {
    if (questClaimed) {
        showToast('Quest Board', 'Daily quest already claimed. New quests refresh tomorrow.');
        return;
    }

    if (questProgress < 100) {
        showToast('Quest Board', 'Complete the daily quest by winning an Oware or Ayo match.');
        return;
    }

    questClaimed = true;
    playerXP += 250;
    updateGamificationUI();
    showToast('Quest Board', 'Quest complete! +250 XP and Bronze Baobab unlocked.');
}
window.claimQuestReward = claimQuestReward;

function openMancala(variant) {
    window.currentMancalaVariant = variant;
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
        mStat.innerText = mTurn === 0 ? "Your Turn" : "Elder AI Thinking...";
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
        const playerWon = mState[6] > mState[13];
        const winText = playerWon ? "You Won!" : (mState[13] > mState[6] ? "Elder AI Won!" : "It's a Draw!");
        document.getElementById('mancala-status').innerText = winText;

        if (playerWon && !questClaimed && ['Oware', 'Ayo'].includes(window.currentMancalaVariant)) {
            questProgress = 100;
            updateGamificationUI();
            showToast('Quest Board', 'Daily quest ready! Return to lobby and claim your reward.');
        }
        return;
    }

    renderMancala();

    // AI Turn Hook
    if (mTurn === 1) {
        // Disable board for player interaction by updating UI state
        document.querySelector('.m-arena').style.pointerEvents = 'none';
        setTimeout(playAI, 1200);
    } else {
        document.querySelector('.m-arena').style.pointerEvents = 'auto';
    }
}
window.mancalaClick = mancalaClick;

function playAI() {
    if (mTurn !== 1) return;

    // Simple AI Strategy
    let validPits = [];
    for (let i = 7; i <= 12; i++) {
        if (mState[i] > 0) validPits.push(i);
    }

    if (validPits.length === 0) return;

    let move = validPits[Math.floor(Math.random() * validPits.length)];

    // Try to find a move that ends in store for an extra turn
    for (let idx of validPits) {
        if ((idx + mState[idx]) % 14 === 13) {
            move = idx;
            break;
        }
    }

    // Animate AI pit selection visually
    const pitElem = document.querySelector(`.m-pit[onclick="mancalaClick(${move})"]`);
    if (pitElem) {
        pitElem.style.transform = "scale(1.1)";
        pitElem.style.background = "rgba(255, 62, 94, 0.4)";
        setTimeout(() => {
            pitElem.style.transform = "scale(1)";
            pitElem.style.background = "";
            mancalaClick(move);
        }, 400);
    } else {
        mancalaClick(move);
    }
}

// ============================================
// LUDO Logic
// ============================================
let ludoTurn = 0;
function openLudo() {
    go('play-ludo');
    ludoTurn = 0;
    const stat = document.getElementById('ludo-status');
    if (stat) stat.innerText = "Match Start: Your Turn! Roll the dice.";
}
window.openLudo = openLudo;

function rollLudoDice() {
    if (ludoTurn !== 0) return;

    const btn = document.getElementById('ludo-roll-btn');
    if (!btn) return;
    const valSpan = document.getElementById('ludo-dice-val');
    btn.classList.add('dice-rolling');
    document.getElementById('ludo-status').innerText = "Rolling...";

    setTimeout(() => {
        btn.classList.remove('dice-rolling');
        const diceVal = Math.floor(Math.random() * 6) + 1;
        valSpan.innerText = ": " + diceVal;

        // Simulate moving the red piece
        const t1 = document.getElementById('ludo-token-1');
        if (t1) {
            let currentPos = parseInt(t1.style.left) || 20;
            let newPos = currentPos + (diceVal * 10); // larger steps for fun
            if (newPos > 85) newPos = 15; // reset
            t1.style.left = newPos + '%';
        }

        document.getElementById('ludo-status').innerText = "Nice! Elder AI's turn...";
        ludoTurn = 1;

        setTimeout(() => {
            const aiDice = Math.floor(Math.random() * 6) + 1;
            valSpan.innerText = ": " + aiDice;
            document.getElementById('ludo-status').innerText = "Elder AI rolled a " + aiDice;

            const t2 = document.getElementById('ludo-token-2');
            if (t2) {
                let currentTop = parseInt(t2.style.top) || 20;
                let newTop = currentTop + (aiDice * 10);
                if (newTop > 85) newTop = 15; // reset
                t2.style.top = newTop + '%';
            }

            setTimeout(() => {
                document.getElementById('ludo-status').innerText = "Your Turn! Roll the dice.";
                ludoTurn = 0;
            }, 1000);
        }, 1500);
    }, 800);
}
window.rollLudoDice = rollLudoDice;

// ============================================
// GO Logic
// ============================================
let goTurn = 0; // 0 for Player (Black), 1 for AI (White)
function openGo() {
    go('play-go');
    const board = document.getElementById('go-board-grid');
    if (!board) return;
    board.innerHTML = '';

    // Create 9x9 grid
    for (let i = 0; i < 81; i++) {
        let cell = document.createElement('div');
        cell.className = 'go-cell';
        cell.style.width = '100%';
        cell.style.height = '100%';
        cell.style.borderRadius = '50%';
        cell.style.cursor = 'pointer';
        cell.style.transition = 'all 0.2s';
        cell.dataset.idx = i;
        cell.onclick = () => placeGoStone(cell);

        // Add subtle hover effect
        cell.onmouseover = function () {
            if (!this.hasChildNodes() && goTurn === 0) {
                this.style.background = 'rgba(0,0,0,0.3)';
            }
        };
        cell.onmouseout = function () {
            if (!this.hasChildNodes()) {
                this.style.background = 'transparent';
            }
        };

        board.appendChild(cell);
    }
    document.getElementById('go-status').innerText = "Your Turn (Black)";
    goTurn = 0;
}
window.openGo = openGo;

function placeGoStone(cell) {
    if (goTurn !== 0 || cell.hasChildNodes()) return;

    let stone = document.createElement('div');
    stone.className = 'go-stone';
    stone.style.width = '80%';
    stone.style.height = '80%';
    stone.style.borderRadius = '50%';
    stone.style.background = 'radial-gradient(circle at 30% 30%, #444, #111)';
    stone.style.boxShadow = '2px 4px 8px rgba(0,0,0,0.5)';

    cell.appendChild(stone);

    document.getElementById('go-status').innerText = "Elder AI is thinking...";
    goTurn = 1;

    setTimeout(() => {
        const board = document.getElementById('go-board-grid');
        const emptyCells = Array.from(board.children).filter(c => !c.hasChildNodes());
        if (emptyCells.length > 0) {
            let aiCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
            let aiStone = document.createElement('div');
            aiStone.className = 'go-stone';
            aiStone.style.width = '80%';
            aiStone.style.height = '80%';
            aiStone.style.borderRadius = '50%';
            aiStone.style.background = 'radial-gradient(circle at 30% 30%, #fff, #bbb)';
            aiStone.style.boxShadow = '2px 4px 8px rgba(0,0,0,0.3)';
            aiCell.appendChild(aiStone);
        }
        document.getElementById('go-status').innerText = "Your Turn (Black)";
        goTurn = 0;
    }, 1200);
}
window.placeGoStone = placeGoStone;

// ============================================
// COMMUNITY CHAT Logic
// ============================================
const botNames = ["Kwame", "Prya", "Mateo", "Sita", "Ali", "Yara"];
const botMessages = [
    "Just finished a round of Oware. It's truly a test of patience!",
    "Ludo always brings back childhood memories. Anyone up for a match?",
    "Did you know Senet was played in ancient Egypt to represent the journey of the soul?",
    "I'm looking for a clan to join for cultural research. Any recommendations?",
    "Anyone want to trade some cultural insights? I'm researching the Ife heads today. So cool!",
    "The new hero designs are absolutely stunning! Moremi is my favorite. ❤️",
    "I just learned about the Yoruba origin of Ayo. Fascinating how it connects us across centuries!",
    "Ludo's layout is actually based on the ancient Indian game of Pachisi. History is wild!",
    "Finally reached Hero Level 25! The journey through the Elders' stories is amazing.",
    "Does anyone else think the lobby music is super relaxing? It's like a warm hug.",
    "Just read the 'Origins of Oware' blog. I didn't know it was that old! Africa has so much history."
];

function startChatSim() {
    if (window.chatInterval) clearInterval(window.chatInterval);
    window.chatInterval = setInterval(() => {
        // Bots talk on their own
        const name = botNames[Math.floor(Math.random() * botNames.length)];
        const msg = botMessages[Math.floor(Math.random() * botMessages.length)];
        addChatPost(name, msg, true);
    }, 12000);
}

function addChatPost(name, text, isBot) {
    const feed = document.getElementById('chat-feed');
    if (!feed) return;

    const post = document.createElement('div');
    post.className = 'chat-post';
    const avQuery = encodeURIComponent(name === "You" ? "young explorer" : name.toLowerCase());
    const likes = isBot ? Math.floor(Math.random() * 12) + 1 : 0;

    post.innerHTML = `
        <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=f5c842&color=000&size=100" class="cp-av">
        <div class="cp-body">
            <div class="cp-head">
                <span class="cp-name">${name}</span> 
                <span class="cp-time">Just now</span>
            </div>
            <div class="cp-text">${text}</div>
            <div class="cp-actions" style="margin-top: 1vh; display: flex; gap: 15px; font-size: 11px; color: var(--muted); font-weight: 700;">
                <span style="cursor:pointer; display:flex; align-items:center; gap:4px; transition: color 0.3s;" onmouseover="this.style.color='#f5c842'" onmouseout="this.style.color=''">
                    <ion-icon name="heart-outline"></ion-icon> ${likes}
                </span>
                <span style="cursor:pointer; display:flex; align-items:center; gap:4px; transition: color 0.3s;" onmouseover="this.style.color='#f5c842'" onmouseout="this.style.color=''">
                    <ion-icon name="chatbubble-outline"></ion-icon> REPLY
                </span>
            </div>
        </div>
    `;
    feed.prepend(post);
    if (feed.children.length > 25) feed.removeChild(feed.lastChild);

    // Notification Logic: Show if NOT in community section
    if (isBot && curScr !== 'community') {
        showToast(name, text);
    }
}

function showToast(user, msg) {
    const toast = document.getElementById('notif-toast');
    const tUser = document.getElementById('nt-user');
    const tMsg = document.getElementById('nt-msg');
    const tAv = document.getElementById('nt-av');

    if (!toast || !tUser || !tMsg || !tAv) return;

    tUser.innerText = user;
    tMsg.innerText = msg;
    tAv.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user)}&background=f5c842&color=000&size=100`;

    toast.classList.add('show');

    if (window.toastTimeout) clearTimeout(window.toastTimeout);
    window.toastTimeout = setTimeout(() => {
        toast.classList.remove('show');
    }, 5000);
}

async function sendChat() {
    const input = document.getElementById('chat-input');
    if (!input || !input.value.trim()) return;

    const userMsg = input.value;
    addChatPost("You", userMsg, false);
    input.value = '';

    // Trigger AI Reply
    const responder = botNames[Math.floor(Math.random() * botNames.length)];
    const prompt = `You are ${responder}, a player in a cultural game called Echoes of Elders. A fellow player says: "${userMsg}". Reply in character as a friendly, culturally aware gamer. Keep it short (max 20 words).`;

    try {
        const encodedPrompt = encodeURIComponent(prompt) + '?seed=' + Math.floor(Math.random() * 1000);
        const response = await fetch(`https://text.pollinations.ai/${encodedPrompt}`);
        const text = await response.text();

        let finalText = text.trim();
        if (finalText.length > 150) {
            finalText = finalText.substring(0, 150) + "..."; // Keep it concise
        }

        // Simulation of "typing..." delay
        setTimeout(() => {
            addChatPost(responder, finalText, true);
        }, 1500 + Math.random() * 1500);
    } catch (e) {
        // Fallback if AI fails (with variety)
        const fallbacks = [
            "That's a very fascinating insight! I'm learning a lot.",
            "Wow, I never actually thought about it from that perspective.",
            "Haha, exactly! We should definitely play a match later and discuss.",
            "I agree completely. Cultural history is so rich and deep."
        ];
        setTimeout(() => {
            const fb = fallbacks[Math.floor(Math.random() * fallbacks.length)];
            addChatPost(responder, fb, true);
        }, 2000);
    }
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
    startChatSim();
    updateGamificationUI();

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

    const heroBg = document.querySelector('.bg-hero');
    document.addEventListener('mousemove', (e) => {
        if (!heroBg) return;
        const x = (e.clientX / window.innerWidth - 0.5) * 8;
        const y = (e.clientY / window.innerHeight - 0.5) * 8;
        heroBg.style.transform = `translate(${x}px, ${y}px) scale(1.06)`;
    });
});


function setRankTab(tab) {
    const explorers = document.getElementById('rank-explorers');
    const matches = document.getElementById('rank-matches');
    const tabs = document.querySelectorAll('[data-rank-tab]');

    tabs.forEach((t) => t.classList.remove('active'));
    const activeTab = document.querySelector(`[data-rank-tab="${tab}"]`);
    if (activeTab) activeTab.classList.add('active');

    if (explorers) explorers.classList.toggle('rank-hidden', tab !== 'explorers');
    if (matches) matches.classList.toggle('rank-hidden', tab !== 'matches');
}
window.setRankTab = setRankTab;

function openBlog(slug) {
    const modal = document.getElementById('blog-modal');
    const title = document.getElementById('blog-title');
    const img = document.getElementById('blog-img');
    const body = document.getElementById('blog-body');

    const posts = {
        'oware': {
            title: 'Origins of Oware',
            img: 'assets/map_story.png',
            content: `
                <p>Oware is a strategy game belonging to the Mancala family of games, played in West Africa and throughout the world. It is considered the national game of Ghana.</p>
                <p>The name Oware literally means "he marries" in Twi. Legend says that a man and a woman played the game endlessly and, in order to be able to stay together and continue playing, they got married.</p>
                <p>Beyond being a simple pastime, Oware was historically used to teach children counting and social values, and was often played under the shade of a large tree where village elders would discuss community matters.</p>
            `
        },
        'ludo': {
            title: 'Ludo: Royal Journey',
            img: 'assets/ludo_story.png',
            content: `
                <p>Ludo's roots trace back to the ancient Indian game of Parchisi, which was played by Mughal emperors on giant courtyard boards where live people were used as pieces!</p>
                <p>The British modified the rules and registered it as "Ludo" in 1896. Since then, it has traveled across the globe, becoming especially beloved in Africa and the Caribbean.</p>
                <p>In our game, Echoes of Elders, Ludo represents the journey of life - full of risks, strategic blocks, and the constant chance of being "sent home" before you reach your goal.</p>
            `
        }
    };

    const post = posts[slug];
    if (post) {
        title.innerText = post.title;
        img.src = post.img;
        body.innerHTML = post.content;
        modal.classList.add('on');
    }
}
window.openBlog = openBlog;

