const { spawn } = require('child_process');
const express = require('express');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;
const stockfishPath = process.env.STOCKFISH_PATH || 'C:/Users/user/OneDrive/Documents/chess2/stockfish.exe';

function createStockfish() {
    try {
        const engine = spawn(stockfishPath);
        engine.stdout.on('data', (data) => console.log(`Stockfish: ${data.toString().trim()}`));
        return engine;
    } catch (error) {
        console.error("⚠️ Failed to start Stockfish:", error);
        return null;
    }
}

let stockfishMove = createStockfish(); // For generating moves
let stockfishEval = createStockfish(); // For continuous evaluation
let stockfishBestMove = createStockfish(); // For best move hints

function sendToStockfish(command, engineInstance = stockfishMove) {
    console.log(`> Sending to Stockfish: ${command}`);
    engineInstance.stdin.write(`${command}\n`);
}

app.use(express.json());
app.use(cors());

app.get('/start', (req, res) => {
    sendToStockfish('uci');
    sendToStockfish('setoption name UCI_LimitStrength value false', stockfishMove);
    sendToStockfish('setoption name UCI_LimitStrength value false', stockfishEval);
    sendToStockfish('ucinewgame');
    sendToStockfish('stop', stockfishEval);
    res.send('Stockfish initialized');
});

app.post('/move', (req, res) => {
    const fen = req.body.fen || 'startpos';
    console.log("Evaluating FEN:", fen);
    const level = req.body.level ?? 20;
    const depth = req.body.depth ?? 20;
    const time = req.body.time ?? 2000;

    console.log(`Bot Settings: Level=${level}, Depth=${depth}, Time=${time}ms`);

    if (stockfishMove) {
        try {
            stockfishMove.kill();
        } catch (error) {
            console.error('Failed to kill move engine:', error);
        }
    }
    stockfishMove = createStockfish();

    const moveTimeout = setTimeout(() => {
        console.error("❌ Stockfish did not return a move.");
        if (!res.headersSent) res.status(500).json({ error: "Stockfish did not respond." });
    }, time + 1000);

    let outputBuffer = "";
    const onData = (data) => {
        outputBuffer += data.toString();
        console.log(`Move engine output chunk: ${data.toString().trim()}`);
        if (outputBuffer.includes('bestmove')) {
            clearTimeout(moveTimeout);
            stockfishMove.stdout.removeListener('data', onData);
            const bestMove = outputBuffer.split('bestmove ')[1].split(' ')[0];
            console.log(`Extracted bestMove: ${bestMove}`);
            if (!res.headersSent) res.json({ bestMove });
        }
    };

    stockfishMove.stdout.on('data', onData);

    setTimeout(() => {
        sendToStockfish(`setoption name Skill Level value ${level}`, stockfishMove);
        sendToStockfish(`position fen ${fen}`, stockfishMove);
        sendToStockfish(`go depth ${depth} movetime ${time}`, stockfishMove);
    }, 500);
});

app.post('/evaluate', (req, res) => {
    const fen = req.body.fen || 'startpos';
    console.log(`Evaluating FEN: ${fen}`);

    sendToStockfish('stop', stockfishEval);
    sendToStockfish(`position fen ${fen}`, stockfishEval);
    sendToStockfish(`go depth 20 movetime 1000`, stockfishEval);

    let latestEval = null;
    let evalLabel = "";
    const onData = (data) => {
        let output = data.toString();
        console.log(`Stockfish Eval Chunk: ${output.trim()}`);
        const match = output.match(/score (cp|mate) (-?\d+)/);
        if (match) {
            const type = match[1];
            const value = parseInt(match[2]);
            if (type === "cp") {
                latestEval = Math.max(-10, Math.min(10, value / 100));
            } else if (type === "mate") {
                latestEval = value > 0 ? 1 : -1;
                evalLabel = `M${Math.abs(value)}`;
            }
        }
    };

    stockfishEval.stdout.on('data', onData);
    setTimeout(() => {
        stockfishEval.stdout.removeListener('data', onData);
        if (latestEval !== null) {
            res.json({ evaluation: latestEval, evalLabel });
        } else {
            res.status(500).json({ error: "No evaluation received." });
        }
    }, 1200);
});


app.post('/bestmove', (req, res) => {
    const { fen } = req.body;
    if (!fen) {
        return res.status(400).json({ error: 'FEN is required' });
    }

    console.log(`Received FEN: ${fen}`);

    // ✅ Reset Stockfish for a new game before setting the position
    sendToStockfish('ucinewgame', stockfishBestMove);
    sendToStockfish('uci', stockfishBestMove); // Ensure UCI mode
    sendToStockfish(`position fen ${fen}`, stockfishBestMove);
    sendToStockfish('go depth 10', stockfishBestMove);

    let outputBuffer = "";
    const onData = (data) => {
        const output = data.toString();
        outputBuffer += output;
        console.log(`Bestmove output: ${output.trim()}`);

        if (outputBuffer.includes('bestmove')) {
            stockfishBestMove.stdout.removeListener('data', onData);

            // ✅ Extract best move safely
            const bestMove = outputBuffer.split('bestmove ')[1]?.split(' ')[0];

            if (!bestMove || bestMove.length < 4) {  // Castling moves may be 5 characters
                return res.status(500).json({ error: "Invalid best move format" });
            }

            console.log(`Parsed bestMove: ${bestMove}`);
            res.json({ bestMove });
        }
    };

    stockfishBestMove.stdout.on('data', onData);

    // ✅ Prevent hanging if Stockfish doesn't respond
    setTimeout(() => {
        if (!res.headersSent) {
            stockfishBestMove.stdout.removeListener('data', onData);
            console.log(`Timeout triggered. Buffer: ${outputBuffer}`);
            res.status(500).json({ error: 'Could not determine best move' });
        }
    }, 5000); // Adjust timeout as needed
});


app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
    sendToStockfish('uci', stockfishMove);
    sendToStockfish('setoption name UCI_LimitStrength value true', stockfishMove);
    sendToStockfish('ucinewgame', stockfishMove);
    sendToStockfish('uci', stockfishEval);
    sendToStockfish('setoption name UCI_LimitStrength value true', stockfishEval);
    sendToStockfish('ucinewgame', stockfishEval);
});

process.on('exit', () => {
    if (stockfishMove) {
        try {
            stockfishMove.kill();
        } catch (error) {
            console.error('Failed to kill Stockfish move engine on exit:', error);
        }
    }
    if (stockfishEval) {
        try {
            stockfishEval.kill();
        } catch (error) {
            console.error('Failed to kill Stockfish eval engine on exit:', error);
        }
    }
    if (stockfishBestMove) {
        try {
            stockfishBestMove.kill();
        } catch (error) {
            console.error('Failed to kill Stockfish bestmove engine on exit:', error);
        }
    }
});