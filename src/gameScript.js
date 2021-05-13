const vscode = acquireVsCodeApi();
var gameArr = [0, 0, 0, 0, 0, 0, 0, 0, 0];
var moves = 0;
var blocked = 0;

function restart() {
    blocked = 0;
    gameArr = [0, 0, 0, 0, 0, 0, 0, 0, 0];
    var moves = 0;
    for (var i = 0; i < 9; i++) {
        document.getElementById(`x${i}`).style.visibility = "hidden";
        document.getElementById(`o${i}`).style.visibility = "hidden";
    }
    vscode.postMessage({
        command: 'info',
        text: `Your move again X`
    })
}

function reset(winner) {
    console.log(`${winner} wins`);
    var winPerson = (winner != 2) ? ((winner == 1) ? "You win" : "No one wins") : "Bot wins";
    vscode.postMessage({
        command: 'info',
        text: `${winPerson} this game`
    })
    blocked = 1;
    vscode.postMessage({
        command: 'play-again',
        text: 'Play again?'
    })
}

function checkWin() {
    for (var i = 0; i <= 6; i += 3) {
        if ((gameArr[i] == gameArr[i + 1]) && (gameArr[i + 1] == gameArr[i + 2]) && (gameArr[i] == 1)) {
            reset(1);
            return 1;
        }
    }
    for (var i = 0; i <= 2; i++) {
        if ((gameArr[i] == gameArr[i + 3]) && (gameArr[i + 3] == gameArr[i + 6]) && (gameArr[i] == 1)) {
            reset(1);
            return 1;
        }
    }
    if ((gameArr[0] == gameArr[4]) && (gameArr[4] == gameArr[8]) && (gameArr[0] == 1)) {
        reset(1);
        return 1;
    }
    else if ((gameArr[2] == gameArr[4]) && (gameArr[4] == gameArr[6]) && (gameArr[2] == 1)) {
        reset(1);
        return 1;
    }

    for (var i = 0; i <= 6; i += 3) {
        if ((gameArr[i] == gameArr[i + 1]) && (gameArr[i + 1] == gameArr[i + 2]) && (gameArr[i] == 2)) {
            reset(2);
            return 1;
        }
    }
    for (var i = 0; i <= 2; i++) {
        if ((gameArr[i] == gameArr[i + 3]) && (gameArr[i + 3] == gameArr[i + 6]) && (gameArr[i] == 2)) {
            reset(2);
            return 1;
        }
    }
    if ((gameArr[0] == gameArr[4]) && (gameArr[4] == gameArr[8]) && (gameArr[0] == 2)) {
        reset(2);
        return 1;
    }
    else if ((gameArr[2] == gameArr[4]) && (gameArr[4] == gameArr[6]) && (gameArr[2] == 2)) {
        reset(2);
        return 1;
    }
    return 0;
}

function userMove(event) {
    var id = event.target.id;
    var box = id[1];
    if (blocked) {
        return;
    }
    if (gameArr[parseInt(box)] == 0) {
        document.getElementById(`x${box}`).style.visibility = "visible";
        gameArr[box] = 1;
        moves++;
        if (checkWin() == 1) {
            return;
        }
        else {
            if (moves == 9) {
                console.log("Game over");
                reset(0);
            }
            var move = -1;
            while (move == -1) {
                move = Math.floor(Math.random() * 8);
                if (gameArr[move] == 0) {
                    break;
                }
                else {
                    move = -1;
                }
            }
            moves++;
            gameArr[move] = 2;
            document.getElementById(`o${move}`).style.visibility = "visible";
            checkWin();
        }
    }
}
// x=1, o=2, blank = 0
for (var i = 0; i < 9; i++) {
    document.getElementById(`z${i}`).addEventListener("click", userMove);
}

window.addEventListener('message', event => {
    const message = event.data; // The JSON data our extension sent
    switch (message.command) {
        case 'restart':
            restart();
            break;
    }
});