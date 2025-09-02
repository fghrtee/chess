
let WIDTH = 800;
let HEIGHT = 800;
let SQUARE_SIZE;
let BOARD_SIZE;   // don’t assign yet, computeLayout() will fill it
let BOARD_X;
let BOARD_Y;

// ADD THESE NEAR TOP (with your other layout globals)
let boardBuffer = null;         // p5.Graphics buffer for the board (cached)
let pieceCache = {};            // pre-rasterized piece images (key -> p5.Image)
let lastSquareSize = 0;         // used to detect size change
let isRenderingLocked = false;  // when true we call noLoop() to save CPU
const DEFAULT_ANIM_MS = 300;    // default animation duration (ms) for piece moves

let historyScroll = 0;
let lastRenderedMoveIdx = 0;
let evalBarX;
let evalBarY;
let modalOpenFrame = 0;

let EVAL_BAR_WIDTH;
let EVAL_BAR_HEIGHT;
let EVAL_BAR_GAP;

let HISTORY_PANEL_WIDTH;
let HISTORY_PANEL_HEIGHT;
let historyX;
let historyY;

let PANEL_GAP   = 20;    // same gap you use between eval-bar & board
let PANEL_MAX_W = 200;   // max panel width

// to hold the “Play” and “Custom” button bounds
let menuPlayX, menuPlayY, menuBtnW, menuBtnH;
let menuCustomX, menuCustomY;

let markedSquares = [];  // stores strings like "e4", "d5", etc.
let canvasParent;
let cnv;
let prevBoardSize = 0;
// Arrow-drawing state
let arrows = [];          // final arrows
let arrowStart = null;    // chess‐square string, e.g. "e4"
let arrowEnd = null;      // likewise
let drawingArrow = false;
// Arrow-drawing state
let rightMouseDown = false;// tracks right-button state
let bestMoveReady = false;
// Add these global variables
let nextFetchTime = 0;
const holdTime = 3000; // 3 seconds hold time
const BG_COLOR = [20,20,20];
const HIGHLIGHT_COLOR = [140, 190, 80, 120];
const MOVE_CIRCLE_COLOR = [100, 100, 100, 50];
const LAST_MOVE_COLOR = [255, 215, 0, 150];
const BUTTON_COLOR = [150, 150, 150]; // Base button color
const BUTTON_HOVER = [180, 180, 180];
let backButton;
let chess = new Chess();
let playerColor = "w"; // Default: white
let checkedSquare = null;
let captureEffects = []; // array to hold all active capture animations

let gameStateMessage = "";
let currentEval = 5; // Initialize globally
let targetEval = 5;
let evalLabel = "5.0";
let showBestMove = false;
let bestMove = null;
let toggleButton;
let squareSize = 50;
let boardX = 100;
let boardY = 100;
let lastBestMoveFetch = 0;
const bestMoveFetchInterval = 1000;
let modalOpenTime = 0;

  // If your history panel is a fixed width:
// Add slider variables
let sliderX = WIDTH / 2 - 100;
let sliderY = 100
let sliderWidth = 200;
let sliderHeight = 20;
let sliderPos = 1; // Initial level (1-20)
let draggingSlider = false;

let gameOver = false;
let gameResultText = "";
let showModal = false;
let moveAnimations = [];
let PIECES = {};
let draggingPiece = null;
let selectedSquare = null;
let legalMoves = [];
let lastMove = null;
let botThinking = false;
let movingPieces = {};
let moveAnimation = null;
const ANIMATION_DURATION = 10;
let stockfishLevel = 20; // Default Stockfish level
let gameMode = "menu"; // "menu", "play", or "custom"
let whitePieceBar = ["wP", "wR", "wN", "wB", "wQ", "wK"];
let blackPieceBar = ["bP", "bR", "bN", "bB", "bQ", "bK"];
let moveHistory = [];
let redoStack = [];
let undoStack = [];
let evalInterval; // Declare without initialization, will hold the interval ID
let pendingPromotion = null; // Stores the move awaiting promotion choice
let promotionOptions = ["Q", "R", "B", "N"]; // Promotion choices
let mouseDown = false;
let mouseDownPos = null;
const DRAG_THRESHOLD = 5;
// Globals (somewhere at top of your sketch)
let lastFetchedFEN = null;
let modalVisible    = false;
// modal dimensions (you can tweak these)
const MODAL_W = 0.5;    // fraction of canvas width
const MODAL_H = 0.6;    // fraction of canvas height
const MODAL_RX = 10;    // corner radius
let currentSet      = 'cburnett';   // default
const pieceSets     = ['kosal','alpha','cburnett','leipzig','merida'];
let easing = 0.05;
let gameSettings = {
    animationDuration: ANIMATION_DURATION,
    showEvalBar: true,
    botLevel: stockfishLevel,
    botDepth: 10,
    botTime: 1000,
    undoEnabled: true,
    redoEnabled: true
};
let boardImage;
const boardThemes = {
    blue:    'assets/Boards/blue.png',
    brown:  'assets/Boards/brown.png',
    green:   'assets/Boards/green.png',
    grey:    'assets/Boards/grey.jpg',
    // …add your filenames here
  };
  let currentBoard = 'brown'; // default
  let showPieceDropdown = false;
let showBoardDropdown = false;

// Global variables for button properties
let backButtonX, backButtonY, backButtonWidth, backButtonHeight;
let bestMoveButtonX, bestMoveButtonY, bestMoveButtonWidth, bestMoveButtonHeight;
let moveSound, captureSound;
function loadPieceSet(setName) {
    const base = `assets/Pieces/${setName}`;
    let types = ['P','R','N','B','Q','K'];
    for (let t of types) {
      PIECES[t]      = loadImage(`${base}/w${t}.svg`);
      PIECES[t.toLowerCase()] = loadImage(`${base}/b${t}.svg`);
    }
    currentSet = setName;
  }

function preload() {
    const base = 'assets/Pieces/kosal';
    let pieceTypes = ['P', 'R', 'N', 'B', 'Q', 'K'];
    for (let type of pieceTypes) {
        PIECES[type] = loadImage(`${base}/w${type}.svg`);
        PIECES[type.toLowerCase()] = loadImage(`${base}/b${type}.svg`);
    }
    loadPieceSet(currentSet);
  // load your default board
  boardImage = loadImage(boardThemes[currentBoard]);
  soundFormats('mp3', 'ogg');  // optional: allows fallback
  moveSound    = loadSound('assets/Sounds/Move.ogg');
  captureSound = loadSound('assets/Sounds/Capture.ogg');
  }

  function loadBoard(name) {
    currentBoard = name;
    boardImage    = loadImage(boardThemes[name]);
  }
  
function quantizeEval(eval_white) {
    if (Math.abs(eval_white) > 1000) {
        // Mate or extreme advantage
        return eval_white > 0 ? 10 : 0;
    } else {
        // Map centipawn evaluation to 0-10 using a logistic function
        const k = 0.1; // Sensitivity factor (adjustable)
        const scaled = 5 + 5 * (2 / (1 + Math.exp(-k * eval_white)) - 1);
        return Math.max(0, Math.min(10, scaled));
    }
}

  // Define getCurrentFEN if not already present
function getCurrentFEN() {
    return chess.fen();
}

function computeLayout() {
  // Panel widths as fixed % of window width
  const panelW = width * 0.04;
  const gap    = width * 0.02;      // small gap between panels and board
  const usedW  = panelW * 2 + gap * 2;

  // available width for the board (ensure a sane minimum)
  const availW = max(120, width - usedW);

  // Board is square, fitting in remaining width and most of the height.
  // Clamp to a sensible max (1000) so huge displays don't kill FPS.
  BOARD_SIZE = min(availW, windowWidth * 0.75, windowHeight * 0.8, 550);

  // Final guard if something odd happens
  if (!isFinite(BOARD_SIZE) || BOARD_SIZE <= 0) {
    BOARD_SIZE = min(600, floor(min(windowWidth, windowHeight) * 0.6));
  }

  SQUARE_SIZE = BOARD_SIZE / 8;

  // 🟢 Always center the board perfectly
  BOARD_X = (width  - BOARD_SIZE) / 2;
  BOARD_Y = (height - BOARD_SIZE) / 2 + 20;

  // Left panel (eval bar) sticks to left side of board
  evalBarX = BOARD_X - panelW - gap;
  evalBarY = BOARD_Y;
  EVAL_BAR_WIDTH  = panelW;
  EVAL_BAR_HEIGHT = BOARD_SIZE;

  // Right panel (move history) sticks to right side of board
  historyX = BOARD_X + BOARD_SIZE + gap;
  historyY = BOARD_Y;
  HISTORY_PANEL_WIDTH  = panelW;
  HISTORY_PANEL_HEIGHT = BOARD_SIZE;

  // If the square size changed, rebuild caches (size must be valid)
  const size = max(16, floor(SQUARE_SIZE));
  if (!isFinite(size) || size <= 0) return;

  if (size !== lastSquareSize) {
    cachePiecesAtSize(size);
    createBoardBuffer();
  }

  // Wake up draw loop after layout change
  kickRender();
}


// ---------- safer cachePiecesAtSize ----------
function cachePiecesAtSize(size) {
  if (lastSquareSize === size) return;  // nothing to do
  if (!isFinite(size) || size <= 0) return;

  // Ensure all piece images are loaded and have non-zero dimensions
  for (let k in PIECES) {
    const img = PIECES[k];
if (!img || img.width === 0 || img.height === 0) {
  console.warn(`cachePiecesAtSize: piece "${k}" not ready (w/h = ${img?.width}/${img?.height}). Retry after load.`);
  lastSquareSize = 0; // force future reattempt
  // schedule a retry (small delay avoids tight loop)
  setTimeout(() => { computeLayout(); }, 200);
  return;
}
  }

  // Build caches
  pieceCache = {};
  for (let k in PIECES) {
    let g = createGraphics(size, size);
    g.noSmooth();
    g.imageMode(CENTER);
    g.clear();
    g.image(PIECES[k], size/2, size/2, size, size);
    pieceCache[k] = g.get(0, 0, size, size);
    g.remove();
  }

  lastSquareSize = size;
  console.log('cachePiecesAtSize: cached pieces for size', size);
}

function createBoardBuffer() {
  if (!boardImage) return;
  const s = max(32, floor(BOARD_SIZE));
  if (boardBuffer) boardBuffer.remove();    // free old buffer
  boardBuffer = createGraphics(s, s);
  boardBuffer.noSmooth();
  boardBuffer.imageMode(CORNER);
  boardBuffer.clear();
  boardBuffer.image(boardImage, 0, 0, s, s);
}

// Decide whether to stop the draw loop to save CPU when idle
function updateLoopState() {
  // any active animations or interactive flags should keep the loop on
  const anyAnimating = (
    moveAnimation ||
    (moveAnimations && moveAnimations.length) ||
    draggingPiece ||
    captureEffects && captureEffects.length ||
    showModal ||
    modalVisible ||
    (bestMoveReady && showBestMove) ||
    (gameMode === "menu") // keep menu animated (if you want)
  );
  if (anyAnimating) {
    if (isRenderingLocked) {
      loop();
      isRenderingLocked = false;
    }
  } else {
    if (!isRenderingLocked) {
      noLoop(); // stop continuous drawing until something changes
      isRenderingLocked = true;
    }
  }
}

// Call this whenever user input or animation starts
function kickRender() {
  if (isRenderingLocked) {
    loop();
    isRenderingLocked = false;
  }
}
function computeBoardSize() {
  // pick smaller side of window so board stays square
  const avail = Math.min(windowWidth, windowHeight);

  // scale but clamp to max 800px (for example)
  BOARD_SIZE = Math.min(avail * 0.8, 800);
}


function handleEvaluationResponse(response) {
    console.log(`Evaluation response: ${JSON.stringify(response)}`);
    
    if (chess.game_over()) {
        // Lock eval and label based on result
        gameOver = true; // ✅ Freeze future updates
        if (chess.in_checkmate()) {
            if (chess.turn() === 'w') {
                evalLabel = '0-1';  // Black delivered mate
                targetEval = 0;
            } else {
                evalLabel = '1-0';  // White delivered mate
                targetEval = 10;
            }
        } else {
            evalLabel = '½-½';  // Draw (stalemate, repetition, etc.)
            targetEval = 5;
        }
        showModal = true;
        return;
    }


    if (!response || response.evaluation === undefined) {
        targetEval = 5;
        evalLabel = "0.0";
    } else {
        let eval_white;
        if (response.evalLabel) {
            if (response.evalLabel && (response.evalLabel.startsWith("M") || response.evalLabel.startsWith("-M"))) {
                evalLabel = response.evalLabel;
            
                // Mate evaluation is always from the perspective of the player to move
                let mateScore = response.evalLabel.startsWith("-") ? -10000 : 10000;
            
                // 👇 Do not invert based on `chess.turn()` — we’re already in the right perspective
                eval_white = mateScore;
            }
            
        }
         else {
            eval_white = chess.turn() === 'w' ? response.evaluation : -response.evaluation;
            evalLabel = eval_white > 0 ? '+' + eval_white.toFixed(1) : eval_white.toFixed(1);
        }

        targetEval = quantizeEval(eval_white);
    }
}

// function drawEvalBar() {
//     // Smoothly transition the current evaluation toward the target
//     currentEval = lerp(currentEval, targetEval, 0.05);

//     push(); // Save drawing state
//     const barX = evalBarX;
//     const barY = BOARD_Y;
//     const barWidth = EVAL_BAR_WIDTH;
//     const barHeight = BOARD_SIZE;

//     // Draw the background of the eval bar
//     stroke(0);
//     strokeWeight(1);
//     fill(200);
//     rect(evalBarX, BOARD_Y, barWidth, barHeight);

//     // Calculate where the white and black fills meet.
//     // (currentEval is scaled 0 to 10 with 5 as neutral.)
//     let meetingY = map(currentEval, 0, 10, barHeight, 0);

//     // Draw Black fill (for black's advantage) from the top down to meetingY
//     fill(0);
//     noStroke();
//     rect(evalBarX, BOARD_Y, barWidth, meetingY);

//     // Draw White fill (for white's advantage) from meetingY to the bottom
//     fill(255);
//     rect(evalBarX, BOARD_Y + meetingY, barWidth, barHeight - meetingY);

//     // Draw a midline at the center of the bar
//     stroke(0);
//     strokeWeight(1);
//     line(evalBarX, BOARD_Y + barHeight / 2, evalBarX + barWidth, BOARD_Y + barHeight / 2);

//     // --- New Evaluation Text Drawing Chunk ---

//     // Strip any leading '+' or '-' from evalLabel for display.
//     let displayText = evalLabel.replace(/^[+-]/, '');

//     // Determine text position and color.
//     let textX = evalBarX + barWidth / 2;
//     let textY;
//     let textColor;

//     if (evalLabel === "1-0") {
//         textY = BOARD_Y + barHeight - 10;
//         textColor = color(0); // Black text for white win
//     } else if (evalLabel === "0-1") {
//         textY = BOARD_Y + 10;
//         textColor = color(255); // White text for black win
//     } else if (evalLabel === "½-½") {
//         textY = BOARD_Y + barHeight / 2;
//         textColor = color(100); // Gray text for draw
//     } else if (evalLabel.indexOf("M") !== -1) {
//         if (evalLabel.startsWith("-")) {
//             textY = BOARD_Y + 10;
//             textColor = color(255);
//         } else {
//             textY = BOARD_Y + barHeight - 10;
//             textColor = color(0);
//         }
//     } else if (currentEval >= 5) {
//         textY = BOARD_Y + barHeight - 10;
//         textColor = color(0, 0, 0);
//     } else {
//         textY = BOARD_Y + 10;
//         textColor = color(255, 255, 255);
//     }
    

//     // Draw the evaluation text centered in the eval bar
//     noStroke();
//     fill(textColor);
//     textAlign(CENTER, CENTER);
//     textSize(13);
//     text(displayText, textX, textY);

//     pop(); // Restore drawing state
// }

  function handleMove(from, to) {
    let move = chess.move({ from, to });  // ✅ Let chess.js handle promotion correctly
 // Prevent auto-queen promotion
 updateGameState(); // Only update board & evaluation after move is done
 getStockfishEvaluation().then(handleEvaluationResponse); // 🔥 call immediately

    if (!move) return; // Invalid move

    if (move.flags.includes("p")) { // Check if it's a promotion
        pendingPromotion = { from, to };
        return; // Stop execution so menu appears
    }

}


  // Update getStockfishEvaluation to use the FEN argument
  function getStockfishEvaluation(fen = chess.fen()) {
    if (gameMode !== "play" || chess.game_over()) {
        console.log("Evaluation skipped: Not in play mode or game over");
        return Promise.resolve({ evaluation: 0, evalLabel: "0.0" }); // Default neutral
    }
    console.log("Sending FEN for evaluation:", fen);
    return fetch("http://localhost:3000/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fen: fen })
    })
    .then(response => {
        if (!response.ok) throw new Error(`Server error: ${response.status}`);
        return response.json();
    })
    .then(data => {
        console.log("Evaluation response:", data);
        if (data.evaluation === undefined) {
            console.warn("No evaluation in response, defaulting to neutral");
            return { evaluation: 0, evalLabel: "0.0" };
        }
        return data; // Return valid data
    })
    .catch(error => {
        console.error("Error fetching evaluation:", error);
        return { evaluation: 0, evalLabel: "0.0" }; // Fallback on error
    });
}


// Mapping Stockfish levels to depth and thinking time
const levelSettings = {
    1: { elo: 800, depth: 1, time: 500 },
    2: { elo: 1300, depth: 2, time: 800 },
    3: { elo: 1400, depth: 3, time: 1000 },
    4: { elo: 1500, depth: 4, time: 1200 },
    5: { elo: 1600, depth: 5, time: 1500 },
    6: { elo: 1700, depth: 6, time: 1800 },
    7: { elo: 1800, depth: 7, time: 2000 },
    8: { elo: 1900, depth: 8, time: 2500 },
    9: { elo: 2000, depth: 9, time: 3000 },
    10: { elo: 2100, depth: 10, time: 3500 },
    11: { elo: 2200, depth: 11, time: 4000 },
    12: { elo: 2300, depth: 12, time: 4500 },
    13: { elo: 2400, depth: 13, time: 5000 },
    14: { elo: 2500, depth: 14, time: 5500 },
    15: { elo: 2600, depth: 15, time: 6000 },
    16: { elo: 2700, depth: 16, time: 6500 },
    17: { elo: 2800, depth: 17, time: 7000 },
    18: { elo: 2900, depth: 18, time: 7500 },
    19: { elo: 3000, depth: 19, time: 8000 },
    20: { elo: 3500, depth: 20, time: 9000 }
};

// Start game with selected bot settings
function startGame() {
    // Use sliderPos (rounded) to set the Stockfish level
    stockfishLevel = Math.round(sliderPos);
    console.log(`Starting game with Stockfish Level: ${stockfishLevel}`);

    
    gameMode = "play";
    modalVisible = false;
    setupPlayMode(); // Initialize play mode
}

function setup() {
  pixelDensity(2);
  frameRate(60);
  noSmooth();
  imageMode(CENTER);

  canvasParent = document.getElementById('board-container') || document.body;

  computeBoardSize();

  cnv = createCanvas(BOARD_SIZE, BOARD_SIZE + 60);
  cnv.parent(canvasParent);
  // disable right click only on the chess board canvas
  cnv.elt.addEventListener("contextmenu", (e) => e.preventDefault());

  computeLayout();
  loop();
  updateLoopState();
}

  function updateButtonsVisibility() {
    if (gameMode === "play") {
      backButton.show();
      toggleButton.show();
    } else {
      backButton.hide();
      toggleButton.hide();
    }
  }
  
  
// Update toggleBestMove to force initial fetch
function toggleBestMove() {
    showBestMove = !showBestMove;
    toggleButton.html(showBestMove ? "Show Best: On" : "Show Best: Off");
    if (showBestMove) {
        if (chess.turn() === "w") {
            fetchBestMove(true).then(() => {
                if (!window.bestMoveInterval) {
                    window.bestMoveInterval = setInterval(() => {
                        if (gameMode === "play" && showBestMove && chess.turn() === "w") {
                            fetchBestMove(); // No force, respects hold time
                        }
                    }, bestMoveFetchInterval);
                }
            });
        }
    } else {
        if (window.bestMoveInterval) {
            clearInterval(window.bestMoveInterval);
            window.bestMoveInterval = null;
        }
    }
}
  

// Modify fetchBestMove to accept forceFetch and respect hold time
function fetchBestMove(forceFetch = false) {
    const currentTime = Date.now();
    if (!forceFetch && currentTime < nextFetchTime) {
        return Promise.resolve(); // Skip fetch if within hold time
    }
    bestMoveReady = false;
    return new Promise((resolve, reject) => {
        if (gameMode !== "play" || chess.game_over()) {
            resolve();
            return;
        }
        fetch('http://localhost:3000/move', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fen: chess.fen(), level: stockfishLevel, depth: 10, time: 1000 })
        })
        .then(response => response.json())
        .then(data => {
            if (data.bestMove && typeof data.bestMove === 'string') {
                bestMove = { from: data.bestMove.slice(0, 2), to: data.bestMove.slice(2, 4) };
                bestMoveReady = true;
                console.log("Best move updated:", bestMove);
                nextFetchTime = Date.now() + holdTime; // Set next fetch time
            }
            resolve();
        })
        .catch(error => {
            console.error("Fetch error:", error);
            reject(error);
        });
    });
}
function drawBestMove() {

}
function updateHistoryPanel() {
    const historyContainer = document.getElementById("history-container");
    if (!historyContainer) return;
  
    // Append only the new moves since lastRenderedMoveIdx
    for (let idx = lastRenderedMoveIdx; idx < moveHistory.length; idx++) {
      const move = moveHistory[idx];
      const moveNumber = Math.floor(idx / 2) + 1;
      const san = move.san ?? "[?]";
  
      if (idx % 2 === 0) {
        // White’s move: create a new div
        const div = document.createElement("div");
        div.className = "move-entry";
        div.textContent = `${moveNumber}. ${san}`;
        historyContainer.appendChild(div);
      } else {
        // Black’s move: append to the last white div
        const lastDiv = historyContainer.lastElementChild;
        if (lastDiv) lastDiv.textContent += ` ${san}`;
      }
    }
  
    // Highlight the very last move
    const entries = historyContainer.querySelectorAll(".move-entry");
    if (entries.length) {
      // remove prior highlights
      entries.forEach(d => d.classList.remove("current-move"));
      // add to the last div
      entries[entries.length - 1].classList.add("current-move");
      // auto‑scroll
      historyContainer.scrollTop = historyContainer.scrollHeight;
    }
  
    // update our pointer
    lastRenderedMoveIdx = moveHistory.length;
    const history = document.getElementById('history-container');
    history.scrollTop = history.scrollHeight;
  }
  // Function to copy the entire PGN to the clipboard
// Function to copy the PGN
function copyEntirePGN() {
    const pgn = generatePGN();
    navigator.clipboard.writeText(pgn)
      .then(() => {
        alert("PGN copied to clipboard!");
      })
      .catch(err => {
        console.error("Clipboard error:", err);
        alert("Failed to copy PGN. Clipboard access may not be allowed.");
      });
  }
  
  function generatePGN() {
    let pgn = '[Event "Chess Game"]\n[Site "Local"]\n[Date "2025.04.22"]\n[Round "?"]\n[White "Player 1"]\n[Black "Player 2"]\n[Result "*"]\n\n';
  
    moveHistory.forEach((move, idx) => {
      const moveNumber = Math.floor(idx / 2) + 1;
      const san = move.san ?? "[?]";
      if (idx % 2 === 0) {
        pgn += `${moveNumber}. ${san} `;
      } else {
        pgn += `${san} `;
      }
    });
  
    // Optionally include the result of the game
    pgn += '*'; // You can adjust this based on the game outcome
    console.log("Move history:", moveHistory);

    return pgn;
  }
  
  function validatePGN(pgn) {
    // Simple check: does it contain at least one move like "1. e4"?
    return /\d+\.\s*\S+/.test(pgn);
  }

// replace your renderHistoryPanel with this:
// Updated renderHistoryPanel: clip icon in top-right, text starts below to avoid overlap
function renderHistoryPanel() {
    // panel dimensions
    const hw = min(PANEL_MAX_W, floor(BOARD_SIZE * 0.3));
    const lineHeight = 20;
    // icon sizing & padding
    const iconSize = 20;
    const iconPadding = 8;
    const textTopOffset = iconSize + iconPadding * 2;
  
    // decide panel position
    let hx, hy, hh;
    if (BOARD_X + BOARD_SIZE + PANEL_GAP + hw <= width) {
      hx = BOARD_X + BOARD_SIZE + PANEL_GAP;
      hy = BOARD_Y;
      hh = BOARD_SIZE;
    } else {
      hx = BOARD_X;
      hy = BOARD_Y + BOARD_SIZE + PANEL_GAP;
      hh = min(floor(BOARD_SIZE * 0.4), height - hy - PANEL_GAP);
    }
  
    // draw panel background
    fill(44);
    stroke(100);
    strokeWeight(1);
    rect(hx, hy, hw, hh, 8);
  
    // draw clip icon
    fill(200);
    noStroke();
    textSize(iconSize);
    textAlign(RIGHT, TOP);
    const iconX = hx + hw - iconPadding;
    const iconY = hy + iconPadding;
    text("📌", iconX, iconY);
    // store clickable area
    renderHistoryPanel.pinArea = { x: iconX - iconSize, y: iconY, w: iconSize, h: iconSize };
  
    // draw move text below icon
    noStroke();
    fill(234);
    textSize(14);
    textAlign(LEFT, TOP);
  
    const fullMoves = Math.ceil(moveHistory.length / 2);
    const maxLines = floor((hh - textTopOffset) / lineHeight);
    const startFull = max(1, fullMoves - maxLines + 1);
  
    for (let m = startFull; m <= fullMoves; m++) {
      const wi = 2 * (m - 1), bi = wi + 1;
      const wSAN = moveHistory[wi]?.san || "...";
      const bSAN = moveHistory[bi]?.san || "";
      const line = `${m}. ${wSAN}` + (bSAN ? ` ${bSAN}` : "");
      text(line, hx + iconPadding, hy + textTopOffset + (m - startFull) * lineHeight);
    }
  
    // highlight last move
    if (fullMoves >= startFull) {
      const ly = hy + textTopOffset + (fullMoves - startFull) * lineHeight;
      fill(255, 215, 0, 60);
      noStroke();
      rect(hx + 4, ly, hw - 8, lineHeight - 2, 4);
    }
  }
  

// call this whenever you push a new move onto moveHistory:
function onNewMove() {
  // auto-scroll to bottom:
  historyScroll = Math.max(0, Math.ceil(moveHistory.length/2) - Math.floor((height-100)/20));
}

// capture wheel events to scroll when over the panel:
function mouseWheel(event) {
  const hx = width - 220, hy = 60, hw = 200, hh = height - 100;
  if (mouseX >= hx && mouseX <= hx+hw && mouseY >= hy && mouseY <= hy+hh) {
    // scroll up/down one full-move
    historyScroll -= event.delta > 0 ? 1 : -1;
    // prevent page scroll
    return false;
  }
}
  function handleModalClick() {
  const ddW = 140, ddH = 30;
  const mW = width * MODAL_W;
  const mH = height * MODAL_H;
  const mX = (width - mW) / 2;
  const mY = (height - mH) / 2;
  const startX = mX + 20;

  // Close button (top-right of modal)
  const closeSize = 24;
  const closeX = mX + mW - closeSize - 10;
  const closeY = mY + 10;
  if (mouseX > closeX && mouseX < closeX + closeSize &&
      mouseY > closeY && mouseY < closeY + closeSize) {
    modalVisible = false;
    return;
  }

  // Piece dropdown box
  let psY = mY + 70;
  let pieceBoxY = psY + 30;
  if (mouseX > startX && mouseX < startX + ddW &&
      mouseY > pieceBoxY && mouseY < pieceBoxY + ddH) {
    showPieceDropdown = !showPieceDropdown;
    showBoardDropdown = false;
    return;
  }

  // Piece dropdown options
  if (showPieceDropdown) {
    for (let i = 0; i < pieceSets.length; i++) {
      let itemY = pieceBoxY + (i + 1) * ddH;
      if (mouseX > startX && mouseX < startX + ddW &&
          mouseY > itemY && mouseY < itemY + ddH) {
        currentSet = pieceSets[i];
        loadPieceSet(currentSet);
        showPieceDropdown = false;
        return;
      }
    }
  }

  // Board dropdown box
  let btY = psY + 140;
  let boardBoxY = btY + 30;
  let boardKeys = Object.keys(boardThemes);
  if (mouseX > startX && mouseX < startX + ddW &&
      mouseY > boardBoxY && mouseY < boardBoxY + ddH) {
    showBoardDropdown = !showBoardDropdown;
    showPieceDropdown = false;
    return;
  }

  // Board dropdown options
  if (showBoardDropdown) {
    for (let i = 0; i < boardKeys.length; i++) {
      let itemY = boardBoxY + (i + 1) * ddH;
      if (mouseX > startX && mouseX < startX + ddW &&
          mouseY > itemY && mouseY < itemY + ddH) {
        currentBoard = boardKeys[i];
        boardImage = loadImage(boardThemes[currentBoard]);
        showBoardDropdown = false;
        return;
      }
    }
  }
}

  
function playBotMove() {
    botThinking = true;
    const botConfig = levelSettings[stockfishLevel];
    console.log("Sending FEN:", chess.fen());
    fetch('http://localhost:3000/move', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fen: chess.fen(), level: stockfishLevel, depth: botConfig.depth, time: botConfig.time })
    })
    .then(response => response.json())
    .then(data => {
        if (!data.bestMove || typeof data.bestMove !== 'string') {
            console.error("No valid move received:", data.bestMove);
           // gameStateMessage = "Error: Bot failed to provide a move.";
            botThinking = false;
            return;
        }
        let bestMove = data.bestMove.trim();
        console.log("Trimmed bestMove:", JSON.stringify(bestMove), "length:", bestMove.length);

        let move;
        if (bestMove.length === 5) {
            move = { from: bestMove.slice(0, 2), to: bestMove.slice(2, 4), promotion: bestMove[4] };
            console.log("Bot move (promotion):", move);
        } else if (bestMove.length === 4) {
            move = { from: bestMove.slice(0, 2), to: bestMove.slice(2, 4) };
            console.log("Bot move:", move);
        } else {
            console.error("Invalid move length:", bestMove);
            gameStateMessage = "Error: Invalid bot move.";
            botThinking = false;
            return;
        }

        let piece = chess.get(move.from);
        if (!piece) {
            console.error("No piece on the 'from' square:", move.from);
            gameStateMessage = "Error: Invalid bot move (no piece).";
            botThinking = false;
            return;
        }
        let pieceKey = piece.color === "w" ? piece.type.toUpperCase() : piece.type.toLowerCase();

        let [fromRow, fromCol] = chessToGrid(move.from);
        let [toRow, toCol] = chessToGrid(move.to);

        let fromX = BOARD_X + fromCol * SQUARE_SIZE + SQUARE_SIZE / 2;
        let fromY = BOARD_Y + fromRow * SQUARE_SIZE + SQUARE_SIZE / 2;
        let toX = BOARD_X + toCol * SQUARE_SIZE + SQUARE_SIZE / 2;
        let toY = BOARD_Y + toRow * SQUARE_SIZE + SQUARE_SIZE / 2;

        moveAnimation = {
            fromX: fromX,
            fromY: fromY,
            toX: toX,
            toY: toY,
            piece: pieceKey,
            progress: 0,
            move: move
        };

        botThinking = false;
    })
    .catch(error =>{
        console.error("Error fetching best move:", error.message);
        gameStateMessage = `Error: ${error.message}`;
    });
}
function selectPromotion(pieceType) {
    if (!pendingPromotion) return;

    let { from, to } = pendingPromotion;
    pendingPromotion = null; // ✅ Clear state before applying move

    chess.move({ from, to, promotion: pieceType }); // Apply promotion
    updateGameState();
    
    console.log("Promotion selected:", pieceType); // ✅ Debugging
}


function squareToPos(square) {
    let col = square.charCodeAt(0) - 'a'.charCodeAt(0);
    let row = 8 - parseInt(square[1]); // Convert chess notation row to board index
    let x = BOARD_X + col * SQUARE_SIZE + SQUARE_SIZE / 2;
    let y = BOARD_Y + row * SQUARE_SIZE + SQUARE_SIZE / 2;
    return { x, y };
}


function drawPromotionOptions() {
    let pieceColor = chess.get(pendingPromotion.from).color; // "w" or "b"
    let [toRow, toCol] = chessToGrid(pendingPromotion.to);
    let targetX = BOARD_X + toCol * SQUARE_SIZE; // X position of the target square
    let targetY = BOARD_Y + toRow * SQUARE_SIZE; // Y position of the target square

    // Calculate the total height and width of the promotion menu
    const optionHeight = SQUARE_SIZE; 
    const menuHeight = promotionOptions.length * optionHeight; 
    const menuWidth = SQUARE_SIZE; 

    // Ensure the menu stays within the board boundaries
    let baseX = targetX; // Align menu with the target square horizontally
    let baseY;

    if (pieceColor === "w") {
        baseY = targetY - menuHeight; // Place menu above for White
        if (baseY < BOARD_Y) baseY = BOARD_Y; // Prevents overflow at the top
    } else {
        baseY = targetY + optionHeight; // Place menu below for Black
        if (baseY + menuHeight > BOARD_Y + BOARD_SIZE) {
            baseY = BOARD_Y + BOARD_SIZE - menuHeight; // Prevents overflow at the bottom
        }
    }

    // Draw background box for the promotion menu
    fill(0, 0, 0, 180); 
    noStroke();
    rect(baseX - 5, baseY - 5, menuWidth + 10, menuHeight + 10, 10);

    // Draw promotion options
    for (let i = 0; i < promotionOptions.length; i++) {
        let option = promotionOptions[i];
        let pieceKey = pieceColor === "w" ? option : option.toLowerCase();
        let y = baseY + i * optionHeight;

        // Highlight if mouse is over
        fill(mouseX > baseX && mouseX < baseX + menuWidth && 
             mouseY > y && mouseY < y + optionHeight ? BUTTON_HOVER : BUTTON_COLOR);
        rect(baseX, y, menuWidth, optionHeight);

        // Draw the piece
        image(PIECES[pieceKey], baseX + menuWidth / 2, y + optionHeight / 2, SQUARE_SIZE * 0.8, SQUARE_SIZE * 0.8);
    }
}

function draw() {
  background(BG_COLOR[0], BG_COLOR[1], BG_COLOR[2]);

  if (gameMode === "menu") {
    drawMenu();
    return;
  }

  if (gameMode === "play") {
    //renderHistoryPanel();
    drawBoard();
    drawMarkedSquares();
    drawPieces();
    drawArrows();
    updateMovingPieces();
    //drawEvalBar();
    displayGameState();
  } else if (gameMode === "custom") {
    drawBoard();
    drawPieces();
    displayGameState();
    drawCustomButtons();
  }

  if (showModal) {
    drawGameOverModal();
  }

  // --- Multiple move animations ---
  for (let anim of moveAnimations) {
    let { fromX, fromY, toX, toY, piece, progress } = anim;
    let easedProgress = easeInOutQuad(progress);
    let x = lerp(fromX, toX, easedProgress);
    let y = lerp(fromY, toY, easedProgress);
    image(PIECES[piece], x, y, SQUARE_SIZE, SQUARE_SIZE);

    // ⏱ advance progress by real time
    anim.progress += deltaTime / DEFAULT_ANIM_MS;
  }

  // --- Single active moveAnimation ---
  if (moveAnimation) {
    let { fromX, fromY, toX, toY, piece, progress } = moveAnimation;
    let easedProgress = easeInOutQuad(progress);
    let x = lerp(fromX, toX, easedProgress);
    let y = lerp(fromY, toY, easedProgress);
    image(PIECES[piece], x, y, SQUARE_SIZE, SQUARE_SIZE);

    // ⏱ advance progress by real time
    moveAnimation.progress += deltaTime / DEFAULT_ANIM_MS;

    if (moveAnimation.progress >= 1) {
      const { move } = moveAnimation;

      if (moveAnimation.isRedo) {
        chess.move(move);
        moveHistory.push(move);
      } else if (!moveAnimation.isUndoRedo) {
        const captured = chess.get(move.to);

        if (captured) {
          captureEffects.push({
            square: move.to,
            startFrame: frameCount,   // you can later swap this to millis()
            type: random(["explosion"])
          });
        }

        const sanMove = chess.move(move);
        if (captured) {
          captureSound.play();
        } else {
          moveSound.play();
        }
        moveHistory.push({ ...move, san: sanMove.san });
        redoStack = [];
      }

      lastMove = move;
      updateHistoryPanel();
      moveAnimation = null;
      updateGameState();

      if (gameMode === "play") {
        getStockfishEvaluation().then(handleEvaluationResponse);
      }
    }
  }

  if (draggingPiece) {
    let pieceKey = draggingPiece.piece;
    image(PIECES[pieceKey], draggingPiece.x, draggingPiece.y, SQUARE_SIZE * 1.2, SQUARE_SIZE * 1.2);
  }

  if (pendingPromotion) {
    drawPromotionOptions();
  }

  // --- FPS Counter ---
  textAlign(CENTER, TOP);
  textSize(20);
  stroke(0);
  strokeWeight(4);
  fill(255);
  text("FPS: " + floor(frameRate()), width / 2, 10);
}

function mouseWheel(event) {
    const linesVisible = Math.floor(BOARD_SIZE / 24);
    const maxScroll = Math.max(0, Math.ceil(moveHistory.length / 2) - linesVisible);

    historyScroll += event.delta > 0 ? 1 : -1;
    historyScroll = constrain(historyScroll, 0, maxScroll);
}

// function drawCaptureEffects() {
//     const DURATION = 30;

//     for (let i = captureEffects.length - 1; i >= 0; i--) {
//         const effect = captureEffects[i];
//         const elapsed = frameCount - effect.startFrame;
//         if (elapsed > DURATION) {
//             captureEffects.splice(i, 1);
//             continue;
//         }

//         const [row, col] = chessToGrid(effect.square);
//         const x = BOARD_X + col * SQUARE_SIZE + SQUARE_SIZE / 2;
//         const y = BOARD_Y + row * SQUARE_SIZE + SQUARE_SIZE / 2;
//         const progress = elapsed / DURATION;

//         push();
//         translate(x, y);



//             const ringRadius = SQUARE_SIZE * progress * 1.5;
//             const alpha = map(elapsed, 0, DURATION, 255, 0);
//             noFill();
//             stroke(255, 100, 0, alpha);
//             strokeWeight(3);
//             ellipse(0, 0, ringRadius, ringRadius);

//             for (let j = 0; j < 8; j++) {
//                 const angle = TWO_PI * j / 8 + frameCount * 0.05;
//                 const px = cos(angle) * ringRadius * 0.4 * (1 - progress);
//                 const py = sin(angle) * ringRadius * 0.4 * (1 - progress);
//                 fill(255, random(100, 200), 0, alpha);
//                 noStroke();
//                 ellipse(px, py, 6 - progress * 5);
//             }


//         pop();
//     }
// }

function drawGameOverModal() {
    const modalW = 300;
    const modalH = 200;
    const x = width / 2 - modalW / 2;
    const y = height / 2 - modalH / 2;

    push();

    // Background fade
    fill(0, 0, 0, 160);
    rect(0, 0, width, height);

    // Modal box
    fill(250);
    stroke(0);
    strokeWeight(2);
    rect(x, y, modalW, modalH, 20);

    // Determine icon
    let icon = "🤝";
    if (gameResultText === "win") icon = "🏆";
    else if (gameResultText === "loss") icon = "💀";

    // Icon animation pulse
    let scale = 1 + 0.1 * sin(frameCount * 0.2);
    textSize(64 * scale);
    textAlign(CENTER, CENTER);
    noStroke();
    text(icon, width / 2, y + 60);

    // Button
    const btnW = 140;
    const btnH = 40;
    const btnX = width / 2 - btnW / 2;
    const btnY = y + modalH - 60;

    fill(mouseX > btnX && mouseX < btnX + btnW && mouseY > btnY && mouseY < btnY + btnH ? 200 : 180);
    rect(btnX, btnY, btnW, btnH, 10);

    fill(0);
    textSize(20);
    text("Play Again", width / 2, btnY + btnH / 2);

    pop();
}

function drawArcadeEnemyTargets() {
    if (!selectedSquare || !legalMoves.length) return;

    for (let move of legalMoves) {
        
        let targetPiece = chess.get(move.to);
        if (targetPiece && targetPiece.color !== chess.get(selectedSquare).color) {
            let [toRow, toCol] = chessToGrid(move.to);
            let x = BOARD_X + toCol * SQUARE_SIZE;
            let y = BOARD_Y + toRow * SQUARE_SIZE;

            let pulse = sin(frameCount * 0.25) * 0.5 + 1.5;
            let glowThickness = 5 + 2 * sin(frameCount * 0.2);

            push();

            // Outer electric pulse
            noFill();
            stroke(255, 30, 30, 100); // Red aura
            strokeWeight(glowThickness);
            rect(x - 4 * pulse, y - 4 * pulse, SQUARE_SIZE + 8 * pulse, SQUARE_SIZE + 8 * pulse, 12);

            // Core red stroke
            stroke(255, 0, 0);
            strokeWeight(3);
            rect(x + 2, y + 2, SQUARE_SIZE - 4, SQUARE_SIZE - 4, 8);

            // Neon frame
            stroke(255, 80, 80, 200);
            strokeWeight(1.5);
            rect(x + 5, y + 5, SQUARE_SIZE - 10, SQUARE_SIZE - 10, 6);

            pop();
        }
    }
}



function resetGame() {
    chess = new Chess();
    gameMode = "play";
    gameStateMessage = "";
    targetEval = 0;
    evalLabel = "";
    showBestMove = false;
    toggleButton.html("Show Best: Off");
    bestMove = null;
}

function goToMenu() {
    console.log("Returning to menu...");
    gameMode = "menu";
    updateButtonsVisibility(); // Hide the play mode buttons
      // 1) Clear and hide move history
    moveHistory = [];
    lastRenderedMoveIdx = 0;
    const historyContainer = document.getElementById("history-container");
    if (historyContainer) {
        historyContainer.innerHTML = "";
        historyContainer.style.display = "none";
    }
    // Reset your game state as needed
    chess = new Chess();
    botThinking = false;
    moveAnimation = null;
    draggingPiece = null;
    selectedSquare = null;
    legalMoves = [];
    lastMove = null;
    movingPieces = {};
    gameStateMessage = "";
    currentEval = 5;
    targetEval = 5;
    evalLabel = "5.0";
    if (evalInterval) clearInterval(evalInterval);
    evalInterval = null;

    gameContainer.style.display = "none";
    background(BG_COLOR[0], BG_COLOR[1], BG_COLOR[2]);
    sliderPos = 1;
    drawMenu();
}

// At the top of your sketch, declare these globals once:

// …later, your drawMenu() becomes:
function drawMenu() {
    background(BG_COLOR);
  
    const w = width;
    const h = height;
  
    // — your title, slider, etc. — 
  
    // —— Buttons ——  
    // Compute width/height/positions responsively
    const btnW = constrain(w * 0.7, 150, 250);      // e.g. same as sliderW
    const btnH = w < 400 ? 40 : 60;                 // responsive height
    const btnX = (w - btnW) / 2;                    // center horizontally
    const playY = h * 0.5;                          // example vertical
    const customY = playY + btnH + 20;              // spaced below
  
    // ── STORE these values into your globals ──
    menuPlayX   = btnX;
    menuPlayY   = playY;
    menuBtnW    = btnW;
    menuBtnH    = btnH;
    menuCustomX = btnX;
    menuCustomY = customY;
  
    // Draw "Play Mode" button
    const playHovered = !modalVisible &&
        mouseX > menuPlayX && mouseX < menuPlayX + menuBtnW &&
        mouseY > menuPlayY && mouseY < menuPlayY + menuBtnH;
    fill(playHovered ? BUTTON_HOVER : BUTTON_COLOR);

    rect(menuPlayX, menuPlayY, menuBtnW, menuBtnH, 10);
    fill(255);
    textAlign(CENTER, CENTER);
    textSize(24);
    text("Play Mode", menuPlayX + menuBtnW/2, menuPlayY + menuBtnH/2);
  
    // Draw "Custom Mode" button
    const customHovered = !modalVisible &&
        mouseX > menuCustomX && mouseX < menuCustomX + menuBtnW &&
        mouseY > menuCustomY && mouseY < menuCustomY + menuBtnH;
    fill(customHovered ? BUTTON_HOVER : BUTTON_COLOR);

    rect(menuCustomX, menuCustomY, menuBtnW, menuBtnH, 10);
    fill(255);
    text("Custom Mode", menuCustomX + menuBtnW/2, menuCustomY + menuBtnH/2);
  
    // —— Gear Icon for settings (top-right corner) ——
    const gearSize = 40,
          gearX    = w - gearSize - 20,
          gearY    = 20;

    // hover tint
    const gearHovered = !modalVisible &&
        mouseX > gearX && mouseX < gearX + gearSize &&
        mouseY > gearY && mouseY < gearY + gearSize;
    fill(gearHovered ? color(255, 100, 100) : 200);

    ellipse(gearX + gearSize/2, gearY + gearSize/2, gearSize);
    fill(0);
    textSize(24);
    textAlign(CENTER, CENTER);
    text("⚙️", gearX + gearSize/2, gearY + gearSize/2);

    // Store gear click area
    if (!window.modalClickAreas) {
        window.modalClickAreas = {};
    }
    window.modalClickAreas.gear = {x: gearX, y: gearY, w: gearSize, h: gearSize};
  
    // === ENHANCED MODAL ===
    if (modalVisible) {
        const mW = w * MODAL_W, mH = h * MODAL_H;
        const mX = (w - mW) / 2, mY = (h - mH) / 2;
        const ddW = 180, ddH = 35;
        const pad = 30;
        const startX = mX + pad;
        const sectionGap = 50;
        
        // Modal backdrop (solid, not transparent)
        fill(0, 0, 0, 180);
        rect(0, 0, w, h);
        
        // Modal background (solid)
        fill(45, 45, 45);
        stroke(100, 100, 100);
        strokeWeight(2);
        rect(mX, mY, mW, mH, 12);
        
        // Modal header
        fill(255, 255, 255);
        textSize(24);
        textAlign(CENTER, CENTER);
        text("Settings", mX + mW/2, mY + 35);
        
        // Close button (X)
        let closeSize = 30;
        let closeX = mX + mW - closeSize - 15;
        let closeY = mY + 15;
        fill(200, 60, 60);
        stroke(255);
        strokeWeight(2);
        rect(closeX, closeY, closeSize, closeSize, 6);
        fill(255);
        textSize(18);
        textAlign(CENTER, CENTER);
        text("✕", closeX + closeSize/2, closeY + closeSize/2);
        
        // Store click areas for mouse handling
        window.modalClickAreas.close = {x: closeX, y: closeY, w: closeSize, h: closeSize};

        let currentY = mY + 80; // Starting Y position after header
        
        // === PIECE SET SECTION ===
        push();
            // Section title
            fill(255, 255, 255);
            textSize(18);
            textAlign(LEFT, CENTER);
            text("Piece Set:", startX, currentY);
            
            currentY += 35; // Space after title
            
            // Main dropdown button with enhanced styling
            let isHoveringPiece = mouseX >= startX && mouseX <= startX + ddW && 
                                 mouseY >= currentY && mouseY <= currentY + ddH;
            
            // Store click area for piece dropdown button
            window.modalClickAreas.pieceButton = {x: startX, y: currentY, w: ddW, h: ddH};
            
            // Dropdown button background with gradient effect
            if (isHoveringPiece) {
                fill(120, 120, 120);
            } else {
                fill(90, 90, 90);
            }
            stroke(180, 180, 180);
            strokeWeight(1);
            rect(startX, currentY, ddW, ddH, 8);
            
            // Dropdown button text
            fill(255, 255, 255);
            textSize(16);
            textAlign(LEFT, CENTER);
            text(currentSet, startX + 15, currentY + ddH/2);
            
            // Dropdown arrow
            fill(200, 200, 200);
            triangle(startX + ddW - 25, currentY + ddH/2 - 5,
                     startX + ddW - 25, currentY + ddH/2 + 5,
                     startX + ddW - 15, currentY + ddH/2);
            
            currentY += ddH; // Move past the main button
            
            // Dropdown list with improved styling
            if (showPieceDropdown) {
                // Store click areas for dropdown items
                window.modalClickAreas.pieceItems = [];
                
                // Semi-transparent overlay behind dropdown
                fill(20, 20, 20, 200);
                rect(startX - 5, currentY, ddW + 10, pieceSets.length * ddH + 10, 8);
                
                for (let i = 0; i < pieceSets.length; i++) {
                    let itemY = currentY + 5 + i * ddH;
                    let isSelected = pieceSets[i] === currentSet;
                    let isHovering = mouseX >= startX && mouseX <= startX + ddW && 
                                    mouseY >= itemY && mouseY <= itemY + ddH;
                    
                    // Store click area for this item
                    window.modalClickAreas.pieceItems.push({
                        x: startX, y: itemY, w: ddW, h: ddH, value: pieceSets[i]
                    });
                    
                    // Item background
                    if (isSelected) {
                        fill(60, 120, 180); // Selected item - blue
                        stroke(100, 150, 200);
                    } else if (isHovering) {
                        fill(100, 100, 100); // Hovered item
                        stroke(140, 140, 140);
                    } else {
                        fill(70, 70, 70); // Default item
                        stroke(100, 100, 100);
                    }
                    strokeWeight(1);
                    rect(startX, itemY, ddW, ddH, 6);
                    
                    // Item text
                    fill(isSelected ? 255 : 220);
                    textAlign(LEFT, CENTER);
                    textSize(15);
                    text(pieceSets[i], startX + 15, itemY + ddH/2);
                }
                currentY += pieceSets.length * ddH + 10; // Account for dropdown height + padding
            }
        pop();
        
        // Add section gap
        currentY += sectionGap;
        
        // === BOARD THEME SECTION ===
        let boardKeys = Object.keys(boardThemes);
        push();
            // Section title
            fill(255, 255, 255);
            textSize(18);
            textAlign(LEFT, CENTER);
            text("Board Theme:", startX, currentY);
            
            currentY += 35; // Space after title
            
            // Main dropdown button with enhanced styling
            let isHoveringBoard = mouseX >= startX && mouseX <= startX + ddW && 
                                 mouseY >= currentY && mouseY <= currentY + ddH;
            
            // Store click area for board dropdown button
            window.modalClickAreas.boardButton = {x: startX, y: currentY, w: ddW, h: ddH};
            
            // Dropdown button background
            if (isHoveringBoard) {
                fill(120, 120, 120);
            } else {
                fill(90, 90, 90);
            }
            stroke(180, 180, 180);
            strokeWeight(1);
            rect(startX, currentY, ddW, ddH, 8);
            
            // Dropdown button text
            fill(255, 255, 255);
            textSize(16);
            textAlign(LEFT, CENTER);
            text(currentBoard, startX + 15, currentY + ddH/2);
            
            // Dropdown arrow
            fill(200, 200, 200);
            triangle(startX + ddW - 25, currentY + ddH/2 - 5,
                     startX + ddW - 25, currentY + ddH/2 + 5,
                     startX + ddW - 15, currentY + ddH/2);
            
            currentY += ddH; // Move past the main button
            
            // Dropdown list with improved styling
            if (showBoardDropdown) {
                // Store click areas for dropdown items
                window.modalClickAreas.boardItems = [];
                
                // Semi-transparent overlay behind dropdown
                fill(20, 20, 20, 200);
                rect(startX - 5, currentY, ddW + 10, boardKeys.length * ddH + 10, 8);
                
                for (let i = 0; i < boardKeys.length; i++) {
                    let itemY = currentY + 5 + i * ddH;
                    let isSelected = boardKeys[i] === currentBoard;
                    let isHovering = mouseX >= startX && mouseX <= startX + ddW && 
                                    mouseY >= itemY && mouseY <= itemY + ddH;
                    
                    // Store click area for this item
                    window.modalClickAreas.boardItems.push({
                        x: startX, y: itemY, w: ddW, h: ddH, value: boardKeys[i]
                    });
                    
                    // Item background
                    if (isSelected) {
                        fill(60, 120, 180); // Selected item - blue
                        stroke(100, 150, 200);
                    } else if (isHovering) {
                        fill(100, 100, 100); // Hovered item
                        stroke(140, 140, 140);
                    } else {
                        fill(70, 70, 70); // Default item
                        stroke(100, 100, 100);
                    }
                    strokeWeight(1);
                    rect(startX, itemY, ddW, ddH, 6);
                    
                    // Item text
                    fill(isSelected ? 255 : 220);
                    textAlign(LEFT, CENTER);
                    textSize(15);
                    text(boardKeys[i], startX + 15, itemY + ddH/2);
                }
            }
        pop();
        
        // === BACK BUTTON ===
        let backButtonW = 100, backButtonH = 40;
        let backX = mX + mW - backButtonW - pad;
        let backY = mY + mH - backButtonH - 20;
        
        // Store click area for back button
        window.modalClickAreas.backButton = {x: backX, y: backY, w: backButtonW, h: backButtonH};
        
        let isHoveringBack = mouseX >= backX && mouseX <= backX + backButtonW && 
                            mouseY >= backY && mouseY <= backY + backButtonH;
        
        // Back button styling
        if (isHoveringBack) {
            fill(80, 140, 80);
            stroke(120, 180, 120);
        } else {
            fill(60, 120, 60);
            stroke(100, 160, 100);
        }
        strokeWeight(2);
        rect(backX, backY, backButtonW, backButtonH, 8);
        
        fill(255);
        textAlign(CENTER, CENTER);
        textSize(16);
        text("Back", backX + backButtonW/2, backY + backButtonH/2);
    }
}

// === CLICK HANDLER FUNCTION ===
// Add this function to handle modal clicks - call it from your mousePressed() function
function handleModalClick() {
  if (!window.modalClickAreas) return false;
  
  // Check close button
  let close = window.modalClickAreas.close;
  if (close && mouseX >= close.x && mouseX <= close.x + close.w && 
      mouseY >= close.y && mouseY <= close.y + close.h) {
    modalVisible = false;
    showPieceDropdown = false;
    showBoardDropdown = false;
    return true;
  }
  
  // Check back button
  let back = window.modalClickAreas.backButton;
  if (back && mouseX >= back.x && mouseX <= back.x + back.w && 
      mouseY >= back.y && mouseY <= back.y + back.h) {
    modalVisible = false;
    showPieceDropdown = false;
    showBoardDropdown = false;
    return true;
  }
  
  // Check piece dropdown button
  let pieceBtn = window.modalClickAreas.pieceButton;
  if (pieceBtn && mouseX >= pieceBtn.x && mouseX <= pieceBtn.x + pieceBtn.w && 
      mouseY >= pieceBtn.y && mouseY <= pieceBtn.y + pieceBtn.h) {
    showPieceDropdown = !showPieceDropdown;
    showBoardDropdown = false;
    return true;
  }
  
  // Check piece dropdown items
  if (showPieceDropdown && window.modalClickAreas.pieceItems) {
    for (let item of window.modalClickAreas.pieceItems) {
      if (mouseX >= item.x && mouseX <= item.x + item.w && 
          mouseY >= item.y && mouseY <= item.y + item.h) {
        currentSet = item.value;
        loadPieceSet(currentSet); // Make sure to load the new piece set
        showPieceDropdown = false;
        return true;
      }
    }
  }
  
  // Check board dropdown button
  let boardBtn = window.modalClickAreas.boardButton;
  if (boardBtn && mouseX >= boardBtn.x && mouseX <= boardBtn.x + boardBtn.w && 
      mouseY >= boardBtn.y && mouseY <= boardBtn.y + boardBtn.h) {
    showBoardDropdown = !showBoardDropdown;
    showPieceDropdown = false;
    return true;
  }
  
  // Check board dropdown items
  if (showBoardDropdown && window.modalClickAreas.boardItems) {
    for (let item of window.modalClickAreas.boardItems) {
      if (mouseX >= item.x && mouseX <= item.x + item.w && 
          mouseY >= item.y && mouseY <= item.y + item.h) {
        currentBoard = item.value;
        if (typeof boardThemes !== 'undefined' && boardThemes[currentBoard]) {
          boardImage = loadImage(boardThemes[currentBoard]);
        }
        showBoardDropdown = false;
        return true;
      }
    }
  }
  
  return false;
}

function isClickInsideModal() {
  if (!modalVisible) return false;
  
  // Define modal bounds
  const mW = width * MODAL_W;
  const mH = height * MODAL_H;
  const mX = (width - mW) / 2;
  const mY = (height - mH) / 2;
  
  // Check if click is inside modal area
  return (mouseX >= mX && mouseX <= mX + mW && 
          mouseY >= mY && mouseY <= mY + mH);
}

function handleGearClick() {
  const gearSize = 40;
  const gearX = width - gearSize - 20;
  const gearY = 20;

  if (
    gameMode === "menu" &&
    mouseX >= gearX && mouseX <= gearX + gearSize &&
    mouseY >= gearY && mouseY <= gearY + gearSize
  ) {
    // Open modal
    modalVisible = true;
    showPieceDropdown = false;
    showBoardDropdown = false;

    // IMPORTANT: record when/frame it opened so mouseReleased & mousePressed guards work
    modalOpenTime = millis();    // used by mouseReleased to ignore the opening release
    modalOpenFrame = frameCount; // used by mousePressed to require a couple frames before modal clicks

    // Prevent treating this same press as a drag/hold interaction
    mouseDown = false;
    mouseDownPos = null;

    return true;
  }
  return false;
}



function handleGameInteractions() {
  // Menu button checks
  if (gameMode === "menu") {
    if (mouseX >= menuPlayX && mouseX <= menuPlayX + menuBtnW &&
        mouseY >= menuPlayY && mouseY <= menuPlayY + menuBtnH) {
      startGame();
      return;
    }
    if (mouseX >= menuCustomX && mouseX <= menuCustomX + menuBtnW &&
        mouseY >= menuCustomY && mouseY <= menuCustomY + menuBtnH) {
      console.log("Switched to Custom Mode");
      gameMode = "custom";
      chess = new Chess();
      botThinking = false;
      moveAnimation = null;
      draggingPiece = null;
      selectedSquare = null;
      legalMoves = [];
      lastMove = null;
      movingPieces = {};
      gameStateMessage = "";
      currentEval = 0;
      targetEval = 0;
      evalLabel = "";
      if (evalInterval) clearInterval(evalInterval);
      return;
    }
    if (mouseX > sliderX && mouseX < sliderX + sliderWidth &&
        mouseY > sliderY - sliderHeight && mouseY < sliderY + sliderHeight) {
      draggingSlider = true;
      updateSlider();
      return;
    }
  }

  // Check for pin click (history panel)
  const pin = renderHistoryPanel.pinArea;
  if (pin &&
      mouseX >= pin.x && mouseX <= pin.x + pin.w &&
      mouseY >= pin.y && mouseY <= pin.y + pin.h) {
    copyPGNThroughCurrentMove();
    return false;
  }

  let col = Math.floor((mouseX - BOARD_X) / SQUARE_SIZE);
  let row = Math.floor((mouseY - BOARD_Y) / SQUARE_SIZE);

  if (showModal) {
    let modalW = 280;
    let modalH = 180;
    let x = width / 2 - modalW / 2;
    let y = height / 2 - modalH / 2;
    let btnW = 120;
    let btnH = 40;
    let btnX = width / 2 - btnW / 2;
    let btnY = y + modalH - 60;

    if (mouseX > btnX && mouseX < btnX + btnW &&
        mouseY > btnY && mouseY < btnY + btnH) {
      restartGame();
      return;
    }
  }

  if (gameOver) return;

  // Handle promotion selection
  if (pendingPromotion) {
    let pieceColor = chess.get(pendingPromotion.from).color;
    let [toRow, toCol] = chessToGrid(pendingPromotion.to);
    let targetX = BOARD_X + toCol * SQUARE_SIZE;
    let targetY = BOARD_Y + toRow * SQUARE_SIZE;
    let optionHeight = SQUARE_SIZE;
    let menuHeight = promotionOptions.length * optionHeight;
    let baseX = targetX;
    let baseY;

    if (pieceColor === "w") {
      baseY = targetY - menuHeight;
      if (baseY < BOARD_Y) baseY = BOARD_Y;
    } else {
      baseY = targetY + optionHeight;
      if (baseY + menuHeight > BOARD_Y + BOARD_SIZE) {
        baseY = BOARD_Y + BOARD_SIZE - menuHeight;
      }
    }

    for (let i = 0; i < promotionOptions.length; i++) {
      let y = baseY + i * optionHeight;
      if (mouseX > baseX && mouseX < baseX + SQUARE_SIZE &&
          mouseY > y && mouseY < y + optionHeight) {
        let promotionPiece = promotionOptions[i].toLowerCase();
        console.log("Promotion option clicked:", promotionPiece);

        let move = {
          from: pendingPromotion.from,
          to: pendingPromotion.to,
          promotion: promotionPiece
        };
        chess.move(move);
        lastMove = move;
        selectedSquare = null;
        legalMoves = [];
        pendingPromotion = null;
        updateGameState();
        return;
      }
    }
    console.log("No valid promotion option clicked");
    return;
  }

  if (mouseButton === RIGHT) {
    const col = floor((mouseX - BOARD_X) / SQUARE_SIZE);
    const row = floor((mouseY - BOARD_Y) / SQUARE_SIZE);
    if (col >= 0 && col < 8 && row >= 0 && row < 8) {
      arrowStart = gridToChess(row, col);
      drawingArrow = false;
      mouseDownPos = { x: mouseX, y: mouseY };
    }
    return false;
  }

  // Handle click-to-move in play mode
  if (gameMode === "play" && chess.turn() === "w" && row >= 0 && row < 8 && col >= 0 && col < 8) {
    const square = gridToChess(row, col);
    const piece = chess.get(square);
    console.log("▶️ Play-mode click:", {
      row, col, square, piece,
      selectedSquare,
      legalMoves
    });

    if (piece && piece.color === "w" && !chess.game_over()) {
      if (selectedSquare && legalMoves.length > 0) {
        let possibleMoves = legalMoves.filter(m => m.to === square);
        if (possibleMoves.length > 0) {
          let move = possibleMoves[0];
          if (move.flags.includes("p")) {
            pendingPromotion = { from: selectedSquare, to: square };
            console.log("Promotion move selected, awaiting choice");
            selectedSquare = null;
            legalMoves = [];
            return;
          } else {
            let [fromRow, fromCol] = chessToGrid(move.from);
            let [toRow, toCol] = chessToGrid(move.to);
            let fromX = BOARD_X + fromCol * SQUARE_SIZE + SQUARE_SIZE / 2;
            let fromY = BOARD_Y + fromRow * SQUARE_SIZE + SQUARE_SIZE / 2;
            let toX = BOARD_X + toCol * SQUARE_SIZE + SQUARE_SIZE / 2;
            let toY = BOARD_Y + toRow * SQUARE_SIZE + SQUARE_SIZE / 2;
            let piece = chess.get(move.from);
            let pieceKey = piece.color === "w" ? piece.type.toUpperCase() : piece.type.toLowerCase();

            moveAnimation = {
              fromX,
              fromY,
              toX,
              toY,
              piece: pieceKey,
              progress: 0,
              move: move,
              isPlayerMove: true
            };
            selectedSquare = null;
            legalMoves = [];
            console.log("Player click-to-move:", move.from, "to", move.to);
            return;
          }
        } else {
          selectedSquare = null;
          legalMoves = [];
        }
      }

      if (piece && piece.color === "w") {
        selectedSquare = square;
        legalMoves = chess.moves({ square: square, verbose: true });
        console.log("Selected piece on:", square, "Legal moves:", legalMoves);
      } else {
        selectedSquare = null;
        legalMoves = [];
      }
    }
  }

  // Custom mode logic
  if (gameMode === "custom") {
    let barY = BOARD_Y + BOARD_SIZE + 10;
    if (mouseY > barY && mouseY < barY + SQUARE_SIZE * 0.8 && mouseX < BOARD_X + BOARD_SIZE / 2 - 5) {
      let index = floor((mouseX - BOARD_X) / (SQUARE_SIZE * 0.8));
      if (index >= 0 && index < whitePieceBar.length) {
        draggingPiece = {
          piece: whitePieceBar[index],
          x: mouseX,
          y: mouseY,
          fromBar: true
        };
      }
    } else if (mouseY > barY && mouseY < barY + SQUARE_SIZE * 0.8 && mouseX > BOARD_X + BOARD_SIZE / 2 + 5) {
      let index = floor((mouseX - (BOARD_X + BOARD_SIZE / 2 + 5)) / (SQUARE_SIZE * 0.8));
      if (index >= 0 && index < blackPieceBar.length) {
        draggingPiece = {
          piece: blackPieceBar[index],
          x: mouseX,
          y: mouseY,
          fromBar: true
        };
      }
    }
  }
}
  

function setupPlayMode() {
    console.log("Initializing Play Mode with current position:", chess.fen());
    if (showBestMove) {
        fetchBestMove().then(() => {
            lastFetchedFEN = chess.fen();
            console.log("Initial best move fetched in setup:", bestMove);
        });
    }
    gameMode = "play";

    // 1. Show the history panel
    const historyContainer = document.getElementById("history-container");
    if (historyContainer) {
      historyContainer.style.display = "block";
    }
  
    // 2. Reset our render pointer and do an initial (empty) draw
    lastRenderedMoveIdx = 0;
    updateHistoryPanel();
    stockfishLevel = stockfishLevel || 1;
    botThinking = false;
    selectedSquare = null;
    legalMoves = [];
    lastMove = null;
    movingPieces = {};
    currentEval = 5;
    targetEval = 5;
    evalLabel = "5.0";
    //resizeCanvasToFit();

    if (!backButton) {
        backButton = createButton("Back");
        backButton.id('back-button')
                  .position(10, 10)
                  .mousePressed(goToMenu)
                  .style('z-index', '1');
      }
      if (!toggleButton) {
        toggleButton = createButton("Show Best: Off");
        toggleButton.id('best-move-button')
                    .position(100, 10)
                    .mousePressed(toggleBestMove)
                    .style('z-index', '1');
      }

    updateButtonsVisibility(); // Show buttons because gameMode is "play".

    // Clear any existing interval
    if (evalInterval) clearInterval(evalInterval);

    const EVAL_INTERVAL_DURATION = 1000; // 1 second, adjust as needed

    evalInterval = setInterval(() => {
        try {
            console.log("Evaluation interval triggered at:", new Date().toLocaleTimeString());
            const fen = chess.fen();
            console.log("Sending FEN for evaluation:", fen);
            getStockfishEvaluation(fen).then(handleEvaluationResponse);
        } catch (error) {
            console.error("Error in evaluation interval:", error);
        }
    }, EVAL_INTERVAL_DURATION);
    console.log("New evalInterval set:", evalInterval);
}
function drawPieceBars() {
    // Draw labels for clarity
    textSize(16);
    fill(0);
    textAlign(CENTER, CENTER);
    text("White Pieces", BOARD_X + (BOARD_SIZE / 4), BOARD_Y + BOARD_SIZE + 10 - 10);
    text("Black Pieces", BOARD_X + (3 * BOARD_SIZE / 4), BOARD_Y + BOARD_SIZE + 10 - 10);

    // White pieces bar on left
    fill(255);
    rect(BOARD_X, BOARD_Y + BOARD_SIZE + 10, BOARD_SIZE / 2 - 5, SQUARE_SIZE * 0.8, 5);
    for (let i = 0; i < whitePieceBar.length; i++) {
        let x = BOARD_X + i * SQUARE_SIZE * 0.8 + SQUARE_SIZE * 0.4;
        let y = BOARD_Y + BOARD_SIZE + 10 + SQUARE_SIZE * 0.4;
        image(PIECES[whitePieceBar[i]], x, y, SQUARE_SIZE * 0.6, SQUARE_SIZE * 0.6);
    }

    // Black pieces bar on right
    fill(220);
    rect(BOARD_X + BOARD_SIZE / 2 + 5, BOARD_Y + BOARD_SIZE + 10, BOARD_SIZE / 2 - 5, SQUARE_SIZE * 0.8, 5);
    for (let i = 0; i < blackPieceBar.length; i++) {
        let x = BOARD_X + BOARD_SIZE / 2 + 5 + i * SQUARE_SIZE * 0.8 + SQUARE_SIZE * 0.4;
        let y = BOARD_Y + BOARD_SIZE + 10 + SQUARE_SIZE * 0.4;
        image(PIECES[blackPieceBar[i]], x, y, SQUARE_SIZE * 0.6, SQUARE_SIZE * 0.6);
    }
}

function drawCustomButtons() {
    // Back Button (top left)
    let backButtonX = 10;
    let backButtonY = 10;
    let backButtonWidth = 100;
    let backButtonHeight = 30;
    fill(mouseX > backButtonX && mouseX < backButtonX + backButtonWidth &&
         mouseY > backButtonY && mouseY < backButtonY + backButtonHeight ? BUTTON_HOVER : BUTTON_COLOR);
    rect(backButtonX, backButtonY, backButtonWidth, backButtonHeight, 5);

    // Play Button (top right)
    let playButtonX = WIDTH - 110;
    let playButtonY = 10;
    let playButtonWidth = 100;
    let playButtonHeight = 30;
    fill(mouseX > playButtonX && mouseX < playButtonX + playButtonWidth &&
         mouseY > playButtonY && mouseY < playButtonY + playButtonHeight ? BUTTON_HOVER : BUTTON_COLOR);
    rect(playButtonX, playButtonY, playButtonWidth, playButtonHeight, 5);

    fill(0);
    textSize(16);
    textAlign(CENTER, CENTER);
    text("Back", backButtonX + backButtonWidth / 2, backButtonY + backButtonHeight / 2);
    text("Play", playButtonX + playButtonWidth / 2, playButtonY + playButtonHeight / 2);
}
function debugGridOverlay() {
  stroke(255, 0, 0);
  noFill();
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      rect(
        BOARD_X + c * SQUARE_SIZE,
        BOARD_Y + r * SQUARE_SIZE,
        SQUARE_SIZE,
        SQUARE_SIZE
      );
    }
  }
}


  
function drawBoard() {
    //const boardOffsetX = 218; Try adjusting this
    //const boardOffsetY = 218; Try adjusting this
  // 1) draw your custom board
  imageMode(CORNER);
  image(boardBuffer, BOARD_X, BOARD_Y, BOARD_SIZE, BOARD_SIZE);

  // 2) last‐move highlight (exactly as you had it)
  if (lastMove && gameMode === "play") {
    let [fr, fc] = chessToGrid(lastMove.from);
    let [tr, tc] = chessToGrid(lastMove.to);
    fill(LAST_MOVE_COLOR);
    noStroke();
    rect(BOARD_X + fc * SQUARE_SIZE,
         BOARD_Y + fr * SQUARE_SIZE,
         SQUARE_SIZE, SQUARE_SIZE);
    rect(BOARD_X + tc * SQUARE_SIZE,
         BOARD_Y + tr * SQUARE_SIZE,
         SQUARE_SIZE, SQUARE_SIZE);
  }

  // 3) selected‐square + legal‐move circles
  if (selectedSquare && gameMode === "play") {
    let [sr, sc] = chessToGrid(selectedSquare);
    let sx = BOARD_X + sc * SQUARE_SIZE;
    let sy = BOARD_Y + sr * SQUARE_SIZE;
    let pulse = sin(frameCount * 0.1) * 0.2 + 0.8;
    fill(HIGHLIGHT_COLOR[0],
         HIGHLIGHT_COLOR[1],
         HIGHLIGHT_COLOR[2],
         HIGHLIGHT_COLOR[3] * pulse);
    noStroke();
    rect(sx, sy, SQUARE_SIZE, SQUARE_SIZE);

    for (let move of legalMoves) {
      let [mr, mc] = chessToGrid(move.to);
      let mx = BOARD_X + mc * SQUARE_SIZE + SQUARE_SIZE/2;
      let my = BOARD_Y + mr * SQUARE_SIZE + SQUARE_SIZE/2;
      let circlePulse = sin(frameCount * 0.15) * 0.1 + 0.9;
      fill(MOVE_CIRCLE_COLOR[0],
           MOVE_CIRCLE_COLOR[1],
           MOVE_CIRCLE_COLOR[2],
           MOVE_CIRCLE_COLOR[3] * circlePulse);
      circle(mx, my, (SQUARE_SIZE/4) * circlePulse);
    }
  }
  imageMode(CENTER);
}

// Draws an L-shaped arrow from (x,y) by vector (dx,dy)
// Above drawArrows():
/**
 * Draw a clean L-shaped arrow (for knight moves) in p5.js
 *
 * @param x      – start x
 * @param y      – start y
 * @param dx     – total delta x to end
 * @param dy     – total delta y to end
 * @param shaftW – shaft width
 * @param headL  – length of arrowhead
 */

// drawLArrow: starts from closest side (horizontal or vertical), with manual start offset
function drawLArrow(x, y, dx, dy, shaftW, headL) {
    const absDx = abs(dx);
    const absDy = abs(dy);
    const startOffset = 24;  // pixels to nudge the first leg toward the target (slightly more forward)
    const horizontalFirst = absDx > absDy;
  
    if (horizontalFirst) {
      // Horizontal leg first
      const len1 = absDx - headL * 1.2;
      const angH = dx >= 0 ? 0 : PI;
      const cx = x + dx;
      const cy = y;
  
      // Horizontal shaft with offset
      push();
        translate(
          x + (dx >= 0 ? startOffset : -startOffset),
          y
        );
        rotate(angH);
        noStroke(); fill(255, 0, 0, 120);
        rect(0, -shaftW/2, len1, shaftW);
      pop();
  
      // Vertical leg + head (unchanged)
      const len2 = absDy;
      const angV = dy >= 0 ? HALF_PI : -HALF_PI;
      push();
        translate(cx, cy);
        rotate(angV);
        noStroke(); fill(255, 0, 0, 120); strokeJoin(ROUND);
        beginShape();
          vertex(-shaftW * 0.5, -shaftW/2);
          vertex(len2 - headL, -shaftW/2);
          vertex(len2 - headL, -shaftW * 1.2);
          vertex(len2, 0);
          vertex(len2 - headL, shaftW * 1.2);
          vertex(len2 - headL, shaftW/2);
          vertex(-shaftW * 0.5, shaftW/2);
        endShape(CLOSE);
      pop();
  
    } else {
      // Vertical leg first
      const len1 = absDy - headL * 1.2;
      const angV = dy >= 0 ? HALF_PI : -HALF_PI;
      const cx = x;
      const cy = y + dy;
  
      // Vertical shaft with offset
      push();
        translate(
          x,
          y + (dy >= 0 ? startOffset : -startOffset)
        );
        rotate(angV);
        noStroke(); fill(255, 0, 0, 120);
        rect(0, -shaftW/2, len1, shaftW);
      pop();
  
      // Horizontal leg + head (unchanged)
      const len2 = absDx;
      const angH = dx >= 0 ? 0 : PI;
      push();
        translate(cx, cy);
        rotate(angH);
        noStroke(); fill(255, 0, 0, 120); strokeJoin(ROUND);
        beginShape();
          vertex(-shaftW * 0.5, -shaftW/2);
          vertex(len2 - headL, -shaftW/2);
          vertex(len2 - headL, -shaftW * 1.2);
          vertex(len2, 0);
          vertex(len2 - headL, shaftW * 1.2);
          vertex(len2 - headL, shaftW/2);
          vertex(-shaftW * 0.5, shaftW/2);
        endShape(CLOSE);
      pop();
    }
  }
  
  function drawArrows() {
    // Draw all committed + live arrow
    let all = arrows
        .concat(drawingArrow && arrowEnd && arrowStart
            ? [{ from: arrowStart, to: arrowEnd }]
            : [])
        .concat(showBestMove && bestMove?.from && bestMove?.to && chess.turn() === "w" && bestMoveReady
            ? [{ from: bestMove.from, to: bestMove.to }]
            : []);
  
    for (let a of all) {
      let p1 = squareToPos(a.from),
          p2 = squareToPos(a.to),
          dx = p2.x - p1.x,
          dy = p2.y - p1.y,
          len = sqrt(dx*dx + dy*dy);
      if (len < 1) continue;
  
      let shaftW = SQUARE_SIZE * 0.2,
          headL  = SQUARE_SIZE * 0.4;
  
      // Detect knight’s L-jump
      let [r1, c1] = chessToGrid(a.from),
          [r2, c2] = chessToGrid(a.to),
          dr = r2 - r1, dc = c2 - c1;
  
      if ((abs(dr) == 2 && abs(dc) == 1) || (abs(dr) == 1 && abs(dc) == 2)) {
        // L-shaped arrow (unchanged)
        drawLArrow(p1.x, p1.y, dx, dy, shaftW, headL);
  
      } else {
        // —— straight arrow, only this block is tweaked —— 
  
        // 1) same direction & length
        const angle = atan2(dy, dx);
  
        // 2) offset start by startOffset pixels along the direction
        const startOffset = 26;            // match your L-arrow offset
        const ux = dx / len, uy = dy / len; // unit vector
        const sx = p1.x + ux * startOffset;
        const sy = p1.y + uy * startOffset;
  
        // 3) shorten the shaft so the tip still hits p2
        const lenAdj = len - startOffset;
  
        // 4) draw exactly as before, but from (sx,sy) and length lenAdj
        push();
          translate(sx, sy);
          rotate(angle);
          noStroke();
          fill(255, 0, 0, 120);
          strokeJoin(ROUND);
  
          beginShape();
            vertex(-shaftW * 0.5,        -shaftW/2);
            vertex(lenAdj - headL,       -shaftW/2);
            vertex(lenAdj - headL,       -shaftW * 1.2);
            vertex(lenAdj,                0);           // tip still lands on p2
            vertex(lenAdj - headL,        shaftW * 1.2);
            vertex(lenAdj - headL,        shaftW/2);
            vertex(-shaftW * 0.5,         shaftW/2);
          endShape(CLOSE);
        pop();
        // —— end of straight-arrow tweak —— 
      }
    }
  }
  
function drawPieces() {
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        let square = gridToChess(row, col);
        let piece  = chess.get(square);
  
        // Don’t draw the piece if it’s mid-drag, mid-animation, or movingPieces is handling it
        if (
          piece &&
          (!draggingPiece || draggingPiece.square !== square) &&
          (!moveAnimation || moveAnimation.move.from !== square) &&
          !movingPieces[square]
        ) {
          // ← restore this!
          let pieceKey = piece.color === "w"
                       ? piece.type.toUpperCase()
                       : piece.type.toLowerCase();
  
          let x = BOARD_X + col * SQUARE_SIZE + SQUARE_SIZE / 2;
          let y = BOARD_Y + row * SQUARE_SIZE + SQUARE_SIZE / 2;
  
          drawingContext.shadowOffsetX = 3;
          drawingContext.shadowOffsetY = 3;
          drawingContext.shadowBlur    = 8;
          drawingContext.shadowColor   = "rgba(0, 0, 0, 0.3)";
  
          image(PIECES[pieceKey], x, y, SQUARE_SIZE, SQUARE_SIZE);
  
          resetShadow();
        }
      }
    }
  }
  
  

function displayGameState() {
    fill(0);
    textSize(24);
    textAlign(CENTER, CENTER);
    let modeMessage = gameMode === "custom" ? "Custom Mode: Drag pieces to add/remove. " : "";
    text(`${modeMessage}${gameStateMessage}`, WIDTH / 2, HEIGHT - 30);
}

function updateGameState() {
    
    if (gameMode === "play") {
        if (chess.in_checkmate()) {
            showModal = true;
            gameResultText = chess.turn() === "w" ? "loss" : "win"; // It's their turn *after* getting mated
            checkedSquare = null;
        } else if (chess.in_stalemate() || chess.in_draw()) {
            showModal = true;
            gameResultText = "draw";
            checkedSquare = null;
        }
         else {
            let fenParts = chess.fen().split(" ");
            let halfMoveClock = parseInt(fenParts[3]);
            if (halfMoveClock >= 50 || chess.in_draw()) {
                gameStateMessage = "";
                checkedSquare = null;
            } else if (chess.in_check()) {
                let kingSquare = null;
                for (let row = 0; row < 8; row++) {
                    for (let col = 0; col < 8; col++) {
                        let square = gridToChess(row, col);
                        let piece = chess.get(square);
                        if (piece && piece.type === "k" && piece.color === chess.turn()) {
                            kingSquare = square;
                        }
                    }
                }                
                console.log("King in check at:", kingSquare); // 👈 Add this
                checkedSquare = kingSquare;
                gameStateMessage = ""; // hide "Check!" text
            } else {
                gameStateMessage = "";
                checkedSquare = null;
            }
        }
        
    getStockfishEvaluation().then(() => drawEvalBar(currentEval, targetEval));
    // Update best move if toggle is on
    if (showBestMove && chess.turn() === "w") {
        bestMoveReady = false; // Reset flag
        fetchBestMove(); // Trigger fetch for new best move
        const currentTime = Date.now();
        const currentFEN = chess.fen();
        if (currentFEN !== lastFetchedFEN && currentTime - lastBestMoveFetch >= bestMoveFetchInterval) {
            fetchBestMove().then(() => {
                lastFetchedFEN = currentFEN;
                lastBestMoveFetch = currentTime;
                console.log("Updated bestMove after game state change:", bestMove);
            });
        }
    }
}
}

function doubleClicked() {
    let col = Math.floor((mouseX - BOARD_X) / SQUARE_SIZE);
    let row = Math.floor((mouseY - BOARD_Y) / SQUARE_SIZE);

    // Only handle double-click in Custom Mode on the board
    if (gameMode === "custom" && row >= 0 && row < 8 && col >= 0 && col < 8) {
        let square = gridToChess(row, col);
        let piece = chess.get(square);
        if (piece) {
            chess.remove(square);
            console.log(`Piece removed from ${square} with double-click`);
            console.log("Current FEN after removal:", chess.fen());
        }
    }
}
function drawCheckedKing() {
    if (!checkedSquare) return;
    console.log("Checked square:", checkedSquare); // 👈 log this
    const [row, col] = chessToGrid(checkedSquare);
    const x = BOARD_X + col * SQUARE_SIZE;
    const y = BOARD_Y + row * SQUARE_SIZE;
    const pulse = sin(frameCount * 0.2) * 0.5 + 1.5;

    push();
    stroke(255, 50, 50, 180);
    strokeWeight(4 + sin(frameCount * 0.2) * 2);
    noFill();
    rect(x - 4 * pulse, y - 4 * pulse, SQUARE_SIZE + 8 * pulse, SQUARE_SIZE + 8 * pulse, 10);
    pop();
}

function updateSlider() {
    // Constrain mouseX to slider bounds and map to integer level 1-20
    let sliderX = WIDTH / 2 - 100; // Match drawMenu()
    sliderPos = Math.round(map(constrain(mouseX, sliderX, sliderX + sliderWidth), sliderX, sliderX + sliderWidth, 1, 20));
}

function restartGame() {
    // 1) reset the Chess.js board
    chess.reset();
  
    // 2) clear all game-over flags
    gameOver       = false;
    showModal      = false;
    gameResultText = "";
  
    // 3) clear your move history array & UI panel
    moveHistory       = [];
    lastRenderedMoveIdx = 0;
    const histDiv = document.getElementById("history-container");
    if (histDiv) {
      histDiv.innerHTML = "";
      histDiv.style.display = "none";
    }
  
    // 4) if you added reviewMoves, clear those too:
    if (typeof reviewMoves !== "undefined") {
      reviewMoves   = [];
      reviewIndex   = 0;
      reviewChess   = null;
      showReviewButton = false;
    }
  
    // 5) reset any UI state
    selectedSquare = null;
    legalMoves     = [];
    moveAnimation  = null;
    draggingPiece  = null;
    botThinking    = false;
  
    // 6) reset evaluation bar if you like
    currentEval = targetEval = 5;
    evalLabel   = "5.0";
  
    // 7) restart the per-second eval loop if needed
    if (evalInterval) clearInterval(evalInterval);
    setupPlayMode();  // if you want to immediately go back into play mode
  }
  
function copyPGNThroughCurrentMove() {
    // don’t copy if no moves yet
    if (moveHistory.length === 0) {
      return alert("No moves to copy yet.");
    }
  
    // build PGN header…
    let pgn = '[Event "Chess Game"]\n'
            + '[Site "Local"]\n'
            + '[Date "2025.04.22"]\n'
            + '[Round "?"]\n'
            + '[White "Player 1"]\n'
            + '[Black "Player 2"]\n'
            + '[Result "*"]\n\n';
  
    // include only the moves that *have* been played
    for (let idx = 0; idx < moveHistory.length; idx++) {
      const move = moveHistory[idx];
      const moveNumber = Math.floor(idx / 2) + 1;
      if (idx % 2 === 0) pgn += `${moveNumber}. ${move.san} `;
      else               pgn += `${move.san} `;
    }
  
    pgn += '*';
  
    navigator.clipboard.writeText(pgn)
      .then(() => alert("PGN up to current move copied!"))
      .catch(() => alert("Failed to copy PGN."));
  }
  
function mousePressed() {
 console.log("CLICK @", mouseX, mouseY, "mode=", gameMode);
  
  // Handle modal interactions first - but ONLY after it's been open for at least 2 frames
  if (modalVisible && frameCount > modalOpenFrame + 1) {
    let modalHandled = handleModalClick();
    
    // If click was inside modal area, block all other processing
    if (isClickInsideModal() || modalHandled) {
      return; // Stop all further processing
    }
    
    // If click was outside modal, close it and continue
    modalVisible = false;
    showPieceDropdown = false;
    showBoardDropdown = false;
  }
  // Check for gear icon click to open modal (only when modal is closed)
  if (!modalVisible && handleGearClick()) {
    return;
  }
  mouseDown = true;
  mouseDownPos = { x: mouseX, y: mouseY };
  if (mouseButton === LEFT) {
    const col = floor((mouseX - BOARD_X) / SQUARE_SIZE);
    const row = floor((mouseY - BOARD_Y) / SQUARE_SIZE);
    if (col >= 0 && col < 8 && row >= 0 && row < 8) {
      markedSquares = [];
      arrows = [];
    }
  }
  // Menu button checks
  if (gameMode === "menu") {
    if (mouseX >= menuPlayX && mouseX <= menuPlayX + menuBtnW &&
        mouseY >= menuPlayY && mouseY <= menuPlayY + menuBtnH) {
      modalVisible = false; // Close the modal if open
      startGame();
      return;
    }
    if (mouseX >= menuCustomX && mouseX <= menuCustomX + menuBtnW &&
        mouseY >= menuCustomY && mouseY <= menuCustomY + menuBtnH) {
      modalVisible = false;
      console.log("Switched to Custom Mode");
      gameMode = "custom";
      chess = new Chess();
      botThinking = false;
      moveAnimation = null;
      draggingPiece = null;
      selectedSquare = null;
      legalMoves = [];
      lastMove = null;
      movingPieces = {};
      gameStateMessage = "";
      currentEval = 0;
      targetEval = 0;
      evalLabel = "";
      if (evalInterval) clearInterval(evalInterval);
      return;
    }
    if (mouseX > sliderX && mouseX < sliderX + sliderWidth &&
        mouseY > sliderY - sliderHeight && mouseY < sliderY + sliderHeight) {
      draggingSlider = true;
      updateSlider();
      return; // Prevent further processing
    }
  }
  // Check for pin click (history panel)
  const pin = renderHistoryPanel.pinArea;
  if (pin &&
      mouseX >= pin.x && mouseX <= pin.x + pin.w &&
      mouseY >= pin.y && mouseY <= pin.y + pin.h) {
    copyPGNThroughCurrentMove();
    return false; // Consume the click
  }
  let col = Math.floor((mouseX - BOARD_X) / SQUARE_SIZE);
  let row = Math.floor((mouseY - BOARD_Y) / SQUARE_SIZE);
  if (showModal) {
    let modalW = 280;
    let modalH = 180;
    let x = width / 2 - modalW / 2;
    let y = height / 2 - modalH / 2;
    let btnW = 120;
    let btnH = 40;
    let btnX = width / 2 - btnW / 2;
    let btnY = y + modalH - 60;
    if (mouseX > btnX && mouseX < btnX + btnW &&
        mouseY > btnY && mouseY < btnY + btnH) {
      restartGame();
      return;
    }
  }
  if (gameOver) return;
  // Handle promotion selection
  if (pendingPromotion) {
    let pieceColor = chess.get(pendingPromotion.from).color;
    let [toRow, toCol] = chessToGrid(pendingPromotion.to);
    let targetX = BOARD_X + toCol * SQUARE_SIZE;
    let targetY = BOARD_Y + toRow * SQUARE_SIZE;
    let optionHeight = SQUARE_SIZE;
    let menuHeight = promotionOptions.length * optionHeight;
    let baseX = targetX;
    let baseY;
    if (pieceColor === "w") {
      baseY = targetY - menuHeight;
      if (baseY < BOARD_Y) baseY = BOARD_Y;
    } else {
      baseY = targetY + optionHeight;
      if (baseY + menuHeight > BOARD_Y + BOARD_SIZE) {
        baseY = BOARD_Y + BOARD_SIZE - menuHeight;
      }
    }
    for (let i = 0; i < promotionOptions.length; i++) {
      let y = baseY + i * optionHeight;
      if (mouseX > baseX && mouseX < baseX + SQUARE_SIZE &&
          mouseY > y && mouseY < y + optionHeight) {
        let promotionPiece = promotionOptions[i].toLowerCase();
        console.log("Promotion option clicked:", promotionPiece);
        let move = {
          from: pendingPromotion.from,
          to: pendingPromotion.to,
          promotion: promotionPiece
        };
        chess.move(move);
        lastMove = move;
        selectedSquare = null;
        legalMoves = [];
        pendingPromotion = null;
        updateGameState();
        return;
      }
    }
    console.log("No valid promotion option clicked");
    return; // Block further processing during promotion
  }
  if (mouseButton === RIGHT) {
    rightMouseDown = true;
    const col = floor((mouseX - BOARD_X) / SQUARE_SIZE);
    const row = floor((mouseY - BOARD_Y) / SQUARE_SIZE);
    if (col >= 0 && col < 8 && row >= 0 && row < 8) {
      arrowStart = gridToChess(row, col);
      drawingArrow = false;
      mouseDownPos = { x: mouseX, y: mouseY };
    }
    return false; // Suppress context menu
  }
  // Handle click-to-move in play mode
// Handle click-to-move in play mode
if (gameMode === "play" && chess.turn() === "w" && row >= 0 && row < 8 && col >= 0 && col < 8) {
  const square = gridToChess(row, col);
  const piece = chess.get(square);

  // --- CASE 1: Selecting a piece ---
  if (!selectedSquare) {
    if (piece && piece.color === "w" && !chess.game_over()) {
      selectedSquare = square;
      legalMoves = chess.moves({ square: square, verbose: true });
      console.log("Selected piece on:", square, "Legal moves:", legalMoves);
    }
    return;
  }

  // --- CASE 2: Clicking a destination ---
  let possibleMoves = legalMoves.filter(m => m.to === square);
  if (possibleMoves.length > 0) {
    let move = possibleMoves[0];
    if (move.flags.includes("p")) {
      pendingPromotion = { from: selectedSquare, to: square };
      console.log("Promotion move selected, awaiting choice");
    } else {
      let [fromRow, fromCol] = chessToGrid(move.from);
      let [toRow, toCol] = chessToGrid(move.to);
      let fromX = BOARD_X + fromCol * SQUARE_SIZE + SQUARE_SIZE / 2;
      let fromY = BOARD_Y + fromRow * SQUARE_SIZE + SQUARE_SIZE / 2;
      let toX   = BOARD_X + toCol * SQUARE_SIZE + SQUARE_SIZE / 2;
      let toY   = BOARD_Y + toRow * SQUARE_SIZE + SQUARE_SIZE / 2;
      let pieceKey = chess.get(move.from).color === "w"
        ? chess.get(move.from).type.toUpperCase()
        : chess.get(move.from).type.toLowerCase();

      moveAnimation = {
        fromX, fromY, toX, toY,
        piece: pieceKey,
        progress: 0,
        move,
        isPlayerMove: true
      };
      console.log("Player click-to-move:", move.from, "to", move.to);
    }
    selectedSquare = null;
    legalMoves = [];
    return;
  }

  // --- CASE 3: Clicked somewhere invalid → reset selection
  selectedSquare = null;
  legalMoves = [];
}
  // Custom mode logic
  if (gameMode === "custom") {
    modalVisible = false;
    showPieceDropdown = false;
    showBoardDropdown = false;
    let barY = BOARD_Y + BOARD_SIZE + 10;
    if (mouseY > barY && mouseY < barY + SQUARE_SIZE * 0.8 && mouseX < BOARD_X + BOARD_SIZE / 2 - 5) {
      let index = floor((mouseX - BOARD_X) / (SQUARE_SIZE * 0.8));
      if (index >= 0 && index < whitePieceBar.length) {
        draggingPiece = {
          piece: whitePieceBar[index],
          x: mouseX,
          y: mouseY,
          fromBar: true
        };
      }
    } else if (mouseY > barY && mouseY < barY + SQUARE_SIZE * 0.8 && mouseX > BOARD_X + BOARD_SIZE / 2 + 5) {
      let index = floor((mouseX - (BOARD_X + BOARD_SIZE / 2 + 5)) / (SQUARE_SIZE * 0.8));
      if (index >= 0 && index < blackPieceBar.length) {
        draggingPiece = {
          piece: blackPieceBar[index],
          x: mouseX,
          y: mouseY,
          fromBar: true
        };
      }
    }
  }
}

function drawMarkedSquares() {
  for (let square of markedSquares) {
    let [row, col] = chessToGrid(square);
    let x = BOARD_X + col * SQUARE_SIZE;
    let y = BOARD_Y + row * SQUARE_SIZE;

    noStroke();
    fill(255, 0, 0, 100);       // semi-transparent red
    rect(x, y, SQUARE_SIZE, SQUARE_SIZE);
  }
}

function mouseDragged() {
    if (gameMode === "menu" && draggingSlider) {
        updateSlider();
    }
    if (mouseButton===RIGHT && mouseDownPos) {
        if (dist(mouseX, mouseY, mouseDownPos.x, mouseDownPos.y) > DRAG_THRESHOLD) {
          drawingArrow = true;
        }
      }

      if (rightMouseDown && arrowStart) {
    let sq = pixelToSquare(mouseX, mouseY);
    if (sq) {
      arrowEnd = sq;
      drawingArrow = true;
    }
  }
    // if right-button held and we’ve moved past threshold, start/update arrow
    if (rightMouseDown && !draggingPiece && mouseDownPos) {
        let d = dist(mouseX, mouseY, mouseDownPos.x, mouseDownPos.y);
        if (d > DRAG_THRESHOLD) {
            drawingArrow = true;
            // update arrowEnd to the square currently under mouse
            let col = floor((mouseX - BOARD_X) / SQUARE_SIZE);
            let row = floor((mouseY - BOARD_Y) / SQUARE_SIZE);
            if (col >= 0 && col < 8 && row >= 0 && row < 8) {
                arrowEnd = gridToChess(row, col);
            }
        }
    }
    if (gameMode === "menu" && draggingSlider) {
        updateSlider();
      }
    if (draggingPiece) {
        draggingPiece.x = mouseX;
        draggingPiece.y = mouseY;
    } else if (mouseButton === LEFT && mouseDown && mouseDownPos) {
        let distMoved = dist(mouseX, mouseY, mouseDownPos.x, mouseDownPos.y);
        if (distMoved > DRAG_THRESHOLD) {
            let col = Math.floor((mouseDownPos.x - BOARD_X) / SQUARE_SIZE);
            let row = Math.floor((mouseDownPos.y - BOARD_Y) / SQUARE_SIZE);
            if (row >= 0 && row < 8 && col >= 0 && col < 8) {
                let square = gridToChess(row, col);
                let piece = chess.get(square);
                if (piece && (gameMode === "custom" || (gameMode === "play" && piece.color === "w"))) {
                    draggingPiece = {
                        square: square,
                        piece: piece.color === "w" ? piece.type.toUpperCase() : piece.type.toLowerCase(),
                        x: mouseX,
                        y: mouseY,
                        startX: BOARD_X + col * SQUARE_SIZE + SQUARE_SIZE / 2,
                        startY: BOARD_Y + row * SQUARE_SIZE + SQUARE_SIZE / 2
                    };
                    // For Custom mode, remove the piece immediately so it can be repositioned.
                    if (gameMode === "custom") {
                        chess.remove(square);
                    }
                    // In Play mode, record selection and legal moves without removing the piece.
                    if (gameMode === "play") {
                        selectedSquare = square;
                        legalMoves = chess.moves({ square: square, verbose: true });
                    }
                    console.log("Dragging piece from:", square);
                }
            }
        }
    }
}

function mouseReleased() {
  // If the modal is open, handle modal-related clicks first
  if (modalVisible) {
    // Skip the first mouse release after opening the modal
    if (modalOpenTime) {
      modalOpenTime = 0;
      mouseDown = false;
      mouseDownPos = null;
      return;
    }
    // If clicking on the gear icon again while modal is open, do nothing
    const gearSize = 40;
    const gearX = width - gearSize - 20;
    const gearY = 20;
    if (gameMode === "menu" &&
        mouseX >= gearX && mouseX <= gearX + gearSize &&
        mouseY >= gearY && mouseY <= gearY + gearSize) {
      return;
    }
    // If the release was inside the modal (or handled by it), do nothing
    if (isClickInsideModal() || handleModalRelease()) {
      return;
    }
    // Otherwise (click outside modal) → close the modal
    modalVisible = false;
    showPieceDropdown = false;
    showBoardDropdown = false;
    return;
  }
    // Your existing mouse release logic continues only when modal is closed...
    let backButtonX = 10;
    let backButtonY = 10;
    let backButtonWidth = 100;
    let backButtonHeight = 30;
    let playButtonX = WIDTH - 110;
    let playButtonY = 10;
    let playButtonWidth = 100;
    let playButtonHeight = 30;
    
    if (mouseButton === RIGHT) {
        rightMouseDown = false;
        const col = floor((mouseX - BOARD_X) / SQUARE_SIZE),
              row = floor((mouseY - BOARD_Y) / SQUARE_SIZE);
        if (drawingArrow && arrowStart && row>=0 && row<8 && col>=0 && col<8) {
          // commit arrow
          arrowEnd = gridToChess(row, col);
          arrows.push({ from: arrowStart, to: arrowEnd });
        } else if (!drawingArrow && row>=0 && row<8 && col>=0 && col<8) {
          // pure click → toggle red box
          const sq = gridToChess(row, col),
                idx = markedSquares.indexOf(sq);
          if (idx === -1) markedSquares.push(sq);
          else markedSquares.splice(idx, 1);
        }
        // reset
        drawingArrow = false;
        arrowStart = arrowEnd = null;
        return false;
    }
      
    if (gameMode === "menu" && draggingSlider) {
        draggingSlider = false;
    }
    if (gameMode === "menu") {
        // Use the same sliderY as in drawMenu for consistency
        let sliderYLocal = 100; // same value as used in drawMenu
        if (
            mouseX >= menuPlayX &&
            mouseX <= menuPlayX + menuBtnW &&
            mouseY >= menuPlayY &&
            mouseY <= menuPlayY + menuBtnH
        ) {
            // Update Stockfish level from sliderPos before switching modes
            stockfishLevel = Math.round(sliderPos);
            console.log("Switched to Play Mode with Stockfish Level:", stockfishLevel);
            gameMode = "play";
            setupPlayMode();
        } else if (
            mouseX >= menuCustomX &&
            mouseX <= menuCustomX + menuBtnW &&
            mouseY >= menuCustomY &&
            mouseY <= menuCustomY + menuBtnH
        ) {
            console.log("Switched to Custom Mode");
            gameMode = "custom";
            chess = new Chess(); // Reset board for custom mode
            botThinking = false;
            moveAnimation = null;
            draggingPiece = null;
            selectedSquare = null;
            legalMoves = [];
            lastMove = null;
            movingPieces = {};
            gameStateMessage = "";
            currentEval = 0;
            targetEval = 0;
            evalLabel = "";
            if (evalInterval) clearInterval(evalInterval); // Clear any lingering interval
        }
    } else if (
        gameMode === "play" &&
        !botThinking &&
        mouseX > backButtonX &&
        mouseX < backButtonX + backButtonWidth &&
        mouseY > backButtonY &&
        mouseY < backButtonY + backButtonHeight
    ) {
        goToMenu();
    } else if (gameMode === "custom") {
        if (
            mouseX > backButtonX &&
            mouseX < backButtonX + backButtonWidth &&
            mouseY > backButtonY &&
            mouseY < backButtonY + backButtonHeight
        ) {
            goToMenu();
            console.log("Back to Menu from Custom");
        } else if (
            mouseX > playButtonX &&
            mouseX < playButtonX + playButtonWidth &&
            mouseY > playButtonY &&
            mouseY < playButtonY + playButtonHeight
        ) {
            gameMode = "play";
            setupPlayMode(); // Use the current custom position
            console.log("Started Play Mode from Custom Position:", chess.fen());
        }
    }
    
    if (pendingPromotion) {
        return; // ✅ Block all other actions until promotion is handled
    }
    
    if (draggingPiece) {
        let col = Math.floor((mouseX - BOARD_X) / SQUARE_SIZE);
        let row = Math.floor((mouseY - BOARD_Y) / SQUARE_SIZE);
        let targetSquare =
            row >= 0 && row < 8 && col >= 0 && col < 8 ? gridToChess(row, col) : null;
        if (gameMode === "play" && draggingPiece.square) {
            let move = targetSquare ? legalMoves.find(m => m.to === targetSquare) : null;
            if (move) {
                let piece = chess.get(move.from);
                if (
                    piece.type === "p" &&
                    ((piece.color === "w" && move.to[1] === "8") ||
                        (piece.color === "b" && move.to[1] === "1"))
                ) {
                    pendingPromotion = move;
                    draggingPiece = null;
                    console.log("Pawn promotion detected, awaiting user choice:", move);
                } else {
                    // Compute center of dropped-to square
                    let toX = BOARD_X + col * SQUARE_SIZE + SQUARE_SIZE / 2;
                    let toY = BOARD_Y + row * SQUARE_SIZE + SQUARE_SIZE / 2;
                    
                    // Flashy drop trail (optional wind/light effect at landing point)
                    moveAnimation = {
                        fromX: BOARD_X + col * SQUARE_SIZE + SQUARE_SIZE / 2,
                        fromY: BOARD_Y + row * SQUARE_SIZE + SQUARE_SIZE / 2,
                        toX: BOARD_X + col * SQUARE_SIZE + SQUARE_SIZE / 2,
                        toY: BOARD_Y + row * SQUARE_SIZE + SQUARE_SIZE / 2,
                        piece: draggingPiece.piece,
                        progress: 0,
                        move: move,
                        flashDrop: true  // you can use this flag for special effects
                    };
                    lastMove = move;
                    redoStack = [];
                    selectedSquare = null;
                    legalMoves = [];
                    updateGameState();
                    console.log("Player drag-and-drop move:", move.from, "to", move.to);
                }
                
            } else {
                selectedSquare = null;
                legalMoves = [];
            }
        } else if (gameMode === "custom") {
            if (targetSquare) {
                chess.put(
                    {
                        type: draggingPiece.piece.toLowerCase(),
                        color: draggingPiece.piece === draggingPiece.piece.toUpperCase() ? 'w' : 'b'
                    },
                    targetSquare
                );
                console.log(`Piece placed on ${targetSquare}`);
            }
            console.log("Piece dropped in custom mode");
        }
        draggingPiece = null;
    }
    mouseDown = false;
    mouseDownPos = null;
}

function handleModalRelease() {
    // Handle any special modal release logic here if needed
    // For now, just return false to indicate no special handling
    return false;
}

// Helper function (if not already defined in your mousePressed fix)
function isClickInsideModal() {
    if (!modalVisible) return false;
    
    // Define modal bounds
    const mW = width * MODAL_W;
    const mH = height * MODAL_H;
    const mX = (width - mW) / 2;
    const mY = (height - mH) / 2;
    
    // Check if click is inside modal area
    return (mouseX >= mX && mouseX <= mX + mW && 
            mouseY >= mY && mouseY <= mY + mH);
}


function keyPressed() {
    if (gameMode === "play" && !botThinking && !moveAnimation && !pendingPromotion) {
      if (keyCode === LEFT_ARROW) {
        handleUndo();
      } else if (keyCode === RIGHT_ARROW) {
        handleRedo(); // Ensure you implement this or stub it
      }
    }
  }
  function setupMoveAnimations(move) {
    // King animation (main piece being dragged)
    let [fromRow, fromCol] = chessToGrid(move.from);
    let [toRow, toCol] = chessToGrid(move.to);
    let fromX = BOARD_X + fromCol * SQUARE_SIZE + SQUARE_SIZE / 2;
    let fromY = BOARD_Y + fromRow * SQUARE_SIZE + SQUARE_SIZE / 2;
    let toX = BOARD_X + toCol * SQUARE_SIZE + SQUARE_SIZE / 2;
    let toY = BOARD_Y + toRow * SQUARE_SIZE + SQUARE_SIZE / 2;
    let piece = chess.get(move.from);
    let pieceKey = piece.color === "w" ? piece.type.toUpperCase() : piece.type.toLowerCase();

    let kingAnimation = {
        fromX,
        fromY,
        toX,
        toY,
        piece: pieceKey,
        progress: 0,
        move,
        fromSquare: move.from
    };
    moveAnimations.push(kingAnimation);

    // Check if it’s a castling move
    if (move.flags.includes('k') || move.flags.includes('q')) {
        let rookFrom, rookTo;
        if (move.flags.includes('k')) { // Kingside castling
            rookFrom = move.color === 'w' ? 'h1' : 'h8';
            rookTo = move.color === 'w' ? 'f1' : 'f8';
        } else { // Queenside castling
            rookFrom = move.color === 'w' ? 'a1' : 'a8';
            rookTo = move.color === 'w' ? 'd1' : 'd8';
        }

        // Rook animation
        let [rookFromRow, rookFromCol] = chessToGrid(rookFrom);
        let [rookToRow, rookToCol] = chessToGrid(rookTo);
        let rookFromX = BOARD_X + rookFromCol * SQUARE_SIZE + SQUARE_SIZE / 2;
        let rookFromY = BOARD_Y + rookFromRow * SQUARE_SIZE + SQUARE_SIZE / 2;
        let rookToX = BOARD_X + rookToCol * SQUARE_SIZE + SQUARE_SIZE / 2;
        let rookToY = BOARD_Y + rookToRow * SQUARE_SIZE + SQUARE_SIZE / 2;
        let rookPiece = chess.get(rookFrom);
        let rookPieceKey = rookPiece.color === "w" ? rookPiece.type.toUpperCase() : rookPiece.type.toLowerCase();

        let rookAnimation = {
            fromX: rookFromX,
            fromY: rookFromY,
            toX: rookToX,
            toY: rookToY,
            piece: rookPieceKey,
            progress: 0,
            move,
            fromSquare: rookFrom
        };
        moveAnimations.push(rookAnimation);
    }
}
  function handleUndo() {
    if (moveHistory.length === 0) return; // No moves to undo
    
    // Check the color of the last move
    let lastMove = moveHistory[moveHistory.length - 1];
    let pieceAtFrom = chess.get(lastMove.from);
    let color = pieceAtFrom ? pieceAtFrom.color : null;
    // If the last move was by black (bot), then undo bot’s move first.
    if (color === 'b') {
      let botMove = moveHistory.pop();
      redoStack.push(botMove);
      chess.undo();
    }
    
    // Now, if there is a move (presumably by the player), undo it.
    if (moveHistory.length > 0) {
        let move = moveHistory.pop();
        redoStack.push(move);
        chess.undo(); // Undo the move
        updateGameState(); // Ensure board is correct
        getStockfishEvaluation(); // Get the new correct evaluation
        animateUndo(move);
    }
    
    botThinking = false;
    lastMove = moveHistory.length > 0 ? moveHistory[moveHistory.length - 1] : null;
    updateGameState();
  }
  
  function animateUndo(move) {
    let pieceAtTo = chess.get(move.to); // Get piece after undoing
    let pieceKey = pieceAtTo ? (pieceAtTo.color === "w" ? pieceAtTo.type.toUpperCase() : pieceAtTo.type.toLowerCase()) : null;
    if (!pieceKey) return; // Safety check

    let [fromRow, fromCol] = chessToGrid(move.from);
    let [toRow, toCol] = chessToGrid(move.to);
    let fromX = BOARD_X + fromCol * SQUARE_SIZE + SQUARE_SIZE / 2;
    let fromY = BOARD_Y + fromRow * SQUARE_SIZE + SQUARE_SIZE / 2;
    let toX = BOARD_X + toCol * SQUARE_SIZE + SQUARE_SIZE / 2;
    let toY = BOARD_Y + toRow * SQUARE_SIZE + SQUARE_SIZE / 2;

    moveAnimation = {
        fromX: toX,
        fromY: toY,
        toX: fromX,
        toY: fromY,
        piece: pieceKey,
        progress: 0,
        move: move,
        isUndoRedo: true
    };
}

  function handleRedo() {
    if (redoStack.length === 0) return; // Nothing to redo
  
    // Pop the last undone move from redoStack
    const move = redoStack.pop();
  
    // Determine the piece key (using uppercase for white, lowercase for black)
    const pieceKey = move.color === "w" ? move.piece.toUpperCase() : move.piece.toLowerCase();
  
    // Convert move squares to grid coordinates
    const [fromRow, fromCol] = chessToGrid(move.from);
    const [toRow, toCol] = chessToGrid(move.to);
    const fromX = BOARD_X + fromCol * SQUARE_SIZE + SQUARE_SIZE / 2;
    const fromY = BOARD_Y + fromRow * SQUARE_SIZE + SQUARE_SIZE / 2;
    const toX = BOARD_X + toCol * SQUARE_SIZE + SQUARE_SIZE / 2;
    const toY = BOARD_Y + toRow * SQUARE_SIZE + SQUARE_SIZE / 2;
  
    // Set up redo animation:
    moveAnimation = {
      fromX: fromX,
      fromY: fromY,
      toX: toX,
      toY: toY,
      piece: pieceKey,
      progress: 0,
      move: move,
      isUndoRedo: true,
      isRedo: true  // Mark that this is a redo animation
    };
  }
  
function updateMovingPieces() {
  // Each frame advance by (ms passed / total ms per move)
  const step = deltaTime / DEFAULT_ANIM_MS;

  for (let key in movingPieces) {
    const p = movingPieces[key];
    if (p.progress === undefined) p.progress = 0;

    // Progress advances by time, not frames
    p.progress = Math.min(1, p.progress + step);

    // Smooth easing
    const eased = easeInOutQuad(p.progress);

    // Interpolated position
    p.x = lerp(p.fromX, p.toX, eased);
    p.y = lerp(p.fromY, p.toY, eased);

    // Draw piece (cached raster at SQUARE_SIZE → fast)
    image(PIECES[p.piece], p.x, p.y, SQUARE_SIZE, SQUARE_SIZE);

    // Done? remove
    if (p.progress >= 1) {
      delete movingPieces[key];
    }
  }

  // Bot trigger stays unchanged
  if (
    gameMode === "play" &&
    !chess.game_over() &&
    chess.turn() === "b" &&
    !draggingPiece &&
    !botThinking &&
    !moveAnimation &&
    Object.keys(movingPieces).length === 0
  ) {
    if (redoStack.length === 0) {
      playBotMove();
    }
  }
}

function easeInOutQuad(t) {
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}
// function drawWindEffect(x, y, fromX, fromY, progress) {
//     const numGusts = 5;
//     let dx = x - fromX;
//     let dy = y - fromY;
//     let angle = atan2(dy, dx);
//     let distanceBetweenPoints = dist(x, y, fromX, fromY);

//     push();
//     // Existing wind gusts
//     for (let i = 0; i < numGusts; i++) {
//         let t = i / numGusts;
//         let length = 30 + t * 60;
//         let offset = t * distanceBetweenPoints * 0.8;

//         let gustX = x - cos(angle) * offset + sin(angle + t * 5) * 5;
//         let gustY = y - sin(angle) * offset + cos(angle + t * 5) * 5;

//         stroke(200, 220, 255, 80 * (1 - t) * (1 - progress)); // Soft wind blue
//         strokeWeight(2);
//         noFill();

//         beginShape();
//         for (let j = 0; j < 10; j++) {
//             let windX = gustX + cos(angle) * j * (length / 10);
//             let windY = gustY + sin(angle) * j * (length / 10) + sin(j * 0.8 + frameCount * 0.2) * 2;
//             curveVertex(windX, windY);
//         }
//         endShape();
//     }

//     // New spark trail effect
//     const numSparks = 20; // Number of spark particles
//     for (let i = 0; i < numSparks; i++) {
//         let t = i / numSparks; // Position along the trail (0 to 1)
//         let sparkOffset = t * distanceBetweenPoints * 1.2; // Spread sparks along path
//         let sparkX = x - cos(angle) * sparkOffset + random(-10, 10);
//         let sparkY = y - sin(angle) * sparkOffset + random(-10, 10);
//         let sparkSize = random(5, 10) * (1 - t); // Smaller sparks further back
//         let alpha = map(t, 0, 1, 255, 50) * (1 - progress * 0.5); // Fade out with progress

//         fill(255, random(200, 255), 100, alpha); // Bright yellowish spark
//         noStroke();
//         ellipse(sparkX, sparkY, sparkSize, sparkSize);
//     }
//     pop();
// }

function gridToChess(row, col) {
    return `${String.fromCharCode(97 + col)}${8 - row}`;
}

function chessToGrid(square) {
    let col = square.charCodeAt(0) - 97;
    let row = 8 - parseInt(square[1]);
    return [row, col];
}

// function resizeCanvasToFit() {
//     // make the canvas full-window
//     resizeCanvas(windowWidth, windowHeight);
  
//     // choose board size (e.g. max 600px or 60% of smaller dimension)
//     const boardMax = min(600, floor(min(windowWidth, windowHeight) * 0.6));
//     BOARD_SIZE = boardMax;
//     SQUARE_SIZE = BOARD_SIZE / 8;
  
//     // compute total width of [evalBar + gap + board]
//     const groupWidth = EVAL_BAR_WIDTH + EVAL_BAR_GAP + BOARD_SIZE;
//     // left-edge so group is centered
//     const groupX = (windowWidth - groupWidth) / 2;
  
//     // assign new positions
//     evalBarX = groupX;
//     BOARD_X = groupX + EVAL_BAR_WIDTH + EVAL_BAR_GAP;
//     BOARD_Y = (windowHeight - BOARD_SIZE) / 2;
//   }
  
  

function handleFallbackMove() {
    if (chess.game_over()) return;
    let moves = chess.moves({ verbose: true });
    if (moves.length > 0) {
        let randomMove = moves[Math.floor(Math.random() * moves.length)];
        let [fromRow, fromCol] = chessToGrid(randomMove.from);
        let [toRow, toCol] = chessToGrid(randomMove.to);
        let fromX = BOARD_X + fromCol * SQUARE_SIZE + SQUARE_SIZE / 2;
        let fromY = BOARD_Y + fromRow * SQUARE_SIZE + SQUARE_SIZE / 2;
        let toX = BOARD_X + toCol * SQUARE_SIZE + SQUARE_SIZE / 2;
        let toY = BOARD_Y + toRow * SQUARE_SIZE + SQUARE_SIZE / 2;
        let piece = chess.get(randomMove.from);
        let pieceKey = piece.color === "w" ? piece.type.toUpperCase() : piece.type.toLowerCase();
        moveAnimation = { fromX, fromY, toX, toY, piece: pieceKey, progress: 0, move: randomMove };
        console.log("Bot random move:", randomMove.from, "to", randomMove.to);
    }
}

function windowResized() {
  clearTimeout(window._resizeTimeout);
  window._resizeTimeout = setTimeout(() => {
    computeBoardSize();

    // shrink canvas exactly to board
    resizeCanvas(BOARD_SIZE, BOARD_SIZE);

    computeLayout();
  }, 80);
}

function resetShadow() {
    drawingContext.shadowOffsetX = 0;
    drawingContext.shadowOffsetY = 0;
    drawingContext.shadowBlur = 0;
    drawingContext.shadowColor = "rgba(0, 0, 0, 0)";
}
// at the very end of your setup() (or on window.load)
window.addEventListener('load', () => {
    const mainWrapper = document.querySelector('main');
    const gameContainer = document.getElementById('game-container');
    if (mainWrapper && gameContainer) {
      gameContainer.appendChild(mainWrapper);
    }
    
    // same for the p5 buttons if you want them inside game-container:
    const backBtn = document.getElementById('back-button');
    const bestBtn = document.getElementById('best-move-button');
    if (backBtn)  gameContainer.appendChild(backBtn);
    if (bestBtn) gameContainer.appendChild(bestBtn);
  });
  window.addEventListener('load', () => {
    // 1) Pull the injected <main> into your game-container:
    const mainWrapper = document.querySelector('main');
    const gameContainer = document.getElementById('game-container');
    if (mainWrapper && gameContainer) {
      gameContainer.appendChild(mainWrapper);
    }
  
    // 2) Pull the p5 buttons in, too:
    const backBtn = document.getElementById('back-button');
    const bestBtn = document.getElementById('best-move-button');
    if (backBtn)  gameContainer.appendChild(backBtn);
    if (bestBtn) gameContainer.appendChild(bestBtn);
  });
  window.addEventListener('load', () => {
    const mainWrapper    = document.querySelector('main');
    const gameContainer  = document.getElementById('game-container');
    const historyWrapper = document.getElementById('history-wrapper');
  
    // 1️⃣ Pull the p5 <main> into game-container
    if (mainWrapper && gameContainer) {
        gameContainer.appendChild(mainWrapper);
    }
  
    // 2️⃣ Now also pull the move‐list into that same <main>
    if (mainWrapper && historyWrapper) {
        mainWrapper.appendChild(historyWrapper);
    }
  
    // 3️⃣ And pull in the p5 buttons, if you like
    ['back-button','best-move-button'].forEach(id => {
      const btn = document.getElementById(id);
      if (btn) mainWrapper.appendChild(btn);
    });
  });
  