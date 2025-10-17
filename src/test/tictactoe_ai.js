// tictactoe_ai.js
// Deterministic TicTacToe AI with difficulty levels (easy/medium/hard).

/** Helpers **/
const WIN_LINES = [
  [0,1,2],[3,4,5],[6,7,8], // rows
  [0,3,6],[1,4,7],[2,5,8], // cols
  [0,4,8],[2,4,6]          // diags
];

function other(player) { return player === 'X' ? 'O' : 'X'; }

function checkWinner(board) {
  for (const [a,b,c] of WIN_LINES) {
    if (board[a] && board[a] === board[b] && board[b] === board[c]) return board[a];
  }
  if (board.every(cell => cell)) return 'draw';
  return null;
}

function availableMoves(board) {
  const moves = [];
  for (let i=0;i<9;i++) if (!board[i]) moves.push(i);
  return moves;
}

// deterministic tie-breaker: prefer center, then corners, then edges
const PREFERRED_ORDER = [4,0,2,6,8,1,3,5,7];

function orderMoves(moves) {
  return moves.slice().sort((a,b) => PREFERRED_ORDER.indexOf(a) - PREFERRED_ORDER.indexOf(b));
}

function boardKey(board, player) {
  // simple string key for memoization
  return board.map(c => c ? c : '.').join('') + '|' + player;
}

/** Minimax with alpha-beta and memoization **/
function minimax(board, player, maximizingPlayer, memo, alpha, beta) {
  const key = boardKey(board, player);
  if (memo.has(key)) return memo.get(key);

  const winner = checkWinner(board);
  if (winner === maximizingPlayer) return { score: 1, move: null };
  if (winner === other(maximizingPlayer)) return { score: -1, move: null };
  if (winner === 'draw') return { score: 0, move: null };

  const moves = orderMoves(availableMoves(board));
  let bestMove = null;

  if (player === maximizingPlayer) {
    // maximize
    let value = -Infinity;
    for (const m of moves) {
      board[m] = player;
      const res = minimax(board, other(player), maximizingPlayer, memo, alpha, beta);
      board[m] = null;
      if (res.score > value) {
        value = res.score;
        bestMove = m;
      }
      alpha = Math.max(alpha, value);
      if (alpha >= beta) break; // beta cutoff
      if (value === 1) break; // perfect win found
    }
    const out = { score: value, move: bestMove };
    memo.set(key, out);
    return out;
  } else {
    // minimize
    let value = Infinity;
    for (const m of moves) {
      board[m] = player;
      const res = minimax(board, other(player), maximizingPlayer, memo, alpha, beta);
      board[m] = null;
      if (res.score < value) {
        value = res.score;
        bestMove = m;
      }
      beta = Math.min(beta, value);
      if (alpha >= beta) break; // alpha cutoff
      if (value === -1) break; // worst-case for maximizing found
    }
    const out = { score: value, move: bestMove };
    memo.set(key, out);
    return out;
  }
}

/** Quick win/block checks for speed and clarity **/
function immediateWinningMove(board, aiPlayer) {
  for (const m of availableMoves(board)) {
    board[m] = aiPlayer;
    if (checkWinner(board) === aiPlayer) { board[m]=null; return m; }
    board[m] = null;
  }
  return null;
}

function immediateBlockingMove(board, aiPlayer) {
  const p = other(aiPlayer);
  for (const m of availableMoves(board)) {
    board[m] = p;
    if (checkWinner(board) === p) { board[m]=null; return m; }
    board[m] = null;
  }
  return null;
}

/** Public: chooseMove **/
export function chooseMove(origBoard, aiPlayer, options = {}) {
  // Defensive copy
  const board = origBoard.slice();
  const difficulty = options.difficulty || 'hard'; // default deterministic perfect
  const randomness = (typeof options.randomness === 'number') ? options.randomness : 0; // 0..1
  // randomness: probability to pick a non-optimal/random move (used for easier levels)
  // timeLimitMs not implemented here; could be added (iterative deepening) if needed.

  const avail = availableMoves(board);
  if (avail.length === 0) return null;

  // If only 1 move left
  if (avail.length === 1) return avail[0];

  // Quick checks (deterministic)
  const win = immediateWinningMove(board, aiPlayer);
  if (win !== null) return win;
  const block = immediateBlockingMove(board, aiPlayer);
  if (block !== null) return block;

  if (difficulty === 'easy') {
    // easy: often pick heuristic or random
    if (Math.random() < Math.max(0, randomness)) {
      // random deterministic fallback when randomness=0? by default randomness=0 so not used
      // but if randomness>0 and you want determinism, pass a seeded RNG externally.
      return avail[Math.floor(Math.random()*avail.length)];
    }
    // pick best of the preferred order intersecting available
    for (const c of PREFERRED_ORDER) if (avail.includes(c)) return c;
  }

  if (difficulty === 'medium') {
    // Medium: 60% chance to play perfect, 40% to depth-limited mistakes or heuristic
    const rand = Math.random();
    if (rand < Math.max(0, 1 - (options.mistakeRate || 0.4))) {
      // play near-perfect: use minimax but allow depth limit to induce mistakes sometimes
      // implement depth-limited minimax by pretending a draw if depth hits limit.
      // Simpler: run full minimax but occasionally (based on randomness) choose second-best.
      const memo = new Map();
      const res = minimax(board, aiPlayer, aiPlayer, memo, -Infinity, Infinity);
      if (res.move === null) {
        // fallback
        for (const c of PREFERRED_ORDER) if (avail.includes(c)) return c;
        return avail[0];
      }
      // with some chance, pick a suboptimal but reasonable move (like prefer corners/center)
      if (Math.random() < (options.errorBias || 0.15)) {
        // pick another good move from ordered list that isn't the top
        const ordered = orderMoves(avail);
        for (const m of ordered) if (m !== res.move) return m;
      }
      return res.move;
    } else {
      // play heuristic / suboptimal intentionally
      // choose center if free, else corner, else random
      for (const c of [4,0,2,6,8]) if (avail.includes(c)) return c;
      return avail[Math.floor(Math.random()*avail.length)];
    }
  }

  // Hard: perfect play using minimax + alpha-beta + memoization
  const memo = new Map();
  const result = minimax(board, aiPlayer, aiPlayer, memo, -Infinity, Infinity);
  // result.move is best move (may be null in weird edgecases)
  if (result.move !== null) return result.move;

  // Fallback deterministic choice (should not happen)
  for (const c of PREFERRED_ORDER) if (avail.includes(c)) return c;
  return avail[0];
}