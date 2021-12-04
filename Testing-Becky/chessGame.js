//? Retrieve Scripts
$.getScript("../AIM_piece_square.js", function () {
    console.log("Script loaded but not necessarily executed.");
});

//? Stockfish
var stockfish = new Worker('js/stockfish.js');
var mode = "human";
var startTest;

function get_moves() {
    var moves = '';
    var history = chessGame.history({ verbose: true });

    for (var i = 0; i < history.length; ++i) {
        var move = history[i];
        moves += ' ' + move.from + move.to + (move.promotion ? move.promotion : '');
    }

    return moves;
}

// var gamesToTest = 2;
function testing() {
    startTest = new Date().getTime();
    mode = "ai";
    // var difficulty = $("#stockfish").val();
    // var testingResults = $("#testingResults");
    // testingResults.text(testingResults.text() + difficulty + "\n");

    // while (gamesToTest != 0) {
    aiMove();

    // if (chessGame.game_over()) {
    // testingReset(stockfishIsWhite);
    // gamesToTest--;
    // }
    // }
}

//? Reset Game during Testing
function testingReset(stockfishIsWhite, gamesToGo) {

    gameStatus = "waiting";
    // $("#playerColour").prop('disabled', false);
    if (gamesToGo > 0) {
        stockfish.postMessage("ucinewgame");
        chessGame.reset();
        chessGame = new Chess();
        // chessBoard.start();

        boardScore = 0
        $("#boardScore").text(boardScore);
        // $("#playerColour").click();

        if (stockfishIsWhite) {
            window.setTimeout(aiMove, 500);
        } else {
            window.setTimeout(opponentMove, 500);
        }

        // if (stockfishIsWhite) {
        // stockfishIsWhite = !stockfishIsWhite;
        // }
        // gamesToTest--;
        // window.setTimeout(aiMove, 500);
    }

}

function contactStockfish() {
    $("#testingResults").text("Stockfish wins: NA out of " + gamesTested);
    window.setTimeout(function () {
        stockfish.postMessage("uci");
        stockfish.postMessage("isready");
        stockfish.postMessage('setoption name skill level value ' + $("#stockfish").val());
        stockfish.postMessage("ucinewgame");
        // stockfish.postMessage("position startpos");
        // stockfish.postMessage("go depth 5");
    }, 500);

}
function aiMove() {
    var difficulty = $("#stockfish").val();
    var stockfishDepth = $("#stockfishDepth").val();

    window.setTimeout(function () {
        stockfish.postMessage('setoption name skill level value ' + difficulty);
        stockfish.postMessage("position startpos moves" + get_moves());
        // stockfish.postMessage("position fen " + chessBoard.fen());
        stockfish.postMessage("go depth " + stockfishDepth);
    }, 600);
}

stockfish.onmessage = function (event) {
    console.log(event.data);

    var eventStr = event.data;
    var match = eventStr.match(/^bestmove ([a-h][1-8])([a-h][1-8])([qrbn])?/);

    if (match) {
        console.log(match);
        var move = chessGame.move({
            from: match[1],
            to: match[2],
            promotion: match[3]
        });

        chessBoard.position(chessGame.fen());
        var reset = updateGameStatus();

        if (reset == "" && mode == "ai") {
            window.setTimeout(opponentMove, 500);
        }
    }

    // window.setTimeout(stockfishMove(event.data), 500);
    // window.setTimeout(opponentMove, 500);   
}

//? Instantiate the chessboard + configuration
var config = {
    draggable: true,
    position: 'start',
    onDragStart: onDragStart,
    onDrop: onDrop,
    onSnapEnd: onSnapEnd,
    showErrors: true,
    moveSpeed: "fast"
}

var gameStatus = "waiting";
var positionsEvaluated = 0;
var chessGame = new Chess();
var chessBoard = ChessBoard('chessboard', config);
var playerColour = "W";

//? Game Options
function updateGameOptions() {
    // Piece colours can only be changed before the game starts
    playerColour = ($("#playerColour").is(":checked")) ? "B" : "W";

    if (gameStatus != "playing" && gameStatus != "ended") {
        if (playerColour == "B" && chessBoard.orientation() == "white") {
            chessBoard.orientation("black");
            window.setTimeout(opponentMove, 250);
            $("#playerColour").prop('disabled', true);
        } else if (playerColour == "W" && chessBoard.orientation() == "black") {
            chessBoard.orientation("white");
        }
    }
}

//? Reset Game
function resetGame() {
    gameStatus = "waiting";
    $("#playerColour").prop('disabled', false);
    chessBoard.start();
    chessGame = new Chess();

    boardScore = 0
    $("#boardScore").text(boardScore);

    if (playerColour != "W") {
        $("#playerColour").click();
    }

}

//? Board Evaluation
function evaluateBoard(game) {
    var rowNames = ["a", "b", "c", "d", "e", "f", "g", "h"];
    var boardScore = 0;

    //^ Loop through board squares
    for (let x = 0; x < 8; x++) { //rows
        for (let y = 1; y <= 8; y++) { //columns
            var currentPiece = game.get(rowNames[x] + y);
            if (currentPiece != null) {
                //Game piece values
                boardScore += calculatePieceValue(currentPiece);
            }
        }

    }

    //evaluation needs to be inversed because black reads as min

    // var aiScore = (playerColour == "W") ? -boardScore : boardScore;
    // console.log(aiScore);
    return boardScore;
}

//? Returns the value of an individual piece
function calculatePieceValue(piece) {
    var pieceValue;

    //values for white
    switch (piece.type) {
        case "r":
            pieceValue = 50;
            break;

        case "b": case "n":
            pieceValue = 30;
            break;

        case "p":
            pieceValue = 10;
            break;

        case "q":
            pieceValue = 90;
            break;

        case "k":
            pieceValue = 900;
            break;
    }

    return pieceValue = (piece.color == "b") ? -pieceValue : pieceValue;
}

//* AI ALGORITHM PROCESSING
function opponentMove() {
    var aiColour = $("#stockfishColour").text();
    // var playerColour = ($("#playerColour").is(":checked")) ? "B" : "W";
    // var minimax = (aiColour == "White") ? true : false;
    // var minimax = (playerColour == "W") ? true : false;

    var startContemplate = new Date().getTime();
    var bestMove = minimaxAiMove(chessGame, true);
    var endContemplate = new Date().getTime();

    chessGame.ugly_move(bestMove);
    chessBoard.position(chessGame.fen());

    $("#moveEvaluation").text(positionsEvaluated);
    positionsEvaluated = 0;

    $("#timeEvaluation").text((endContemplate - startContemplate) + "s");
    var reset = updateGameStatus();
    console.log(bestMove);

    if (reset == "" && mode == "ai") {

        window.setTimeout(aiMove, 500);
    }
}
function minimaxAiMove(game, maximisingPlayer) {

    var depth = $("#depth").val();
    var availableMoves = game.ugly_moves();
    var moveScore = -9999;
    var bestMove;
    var alphaBetaActivated = $("#alphaBeta").is(":checked");
    var minimaxActivated = $("#minimax").is(":checked");

    if (!(alphaBetaActivated && minimaxActivated)) {
        bestMove = availableMoves[Math.floor(Math.random() * availableMoves.length)];
    }

    for (let i = 0; i < availableMoves.length; i++) {

        positionsEvaluated++;
        game.ugly_move(availableMoves[i]);

        //* Using alpha-beta
        if (alphaBetaActivated) {
            var currentMoveValue = alphaBetaOptimised(game, (depth - 1), -10000, 10000, !maximisingPlayer);
        } else if (minimaxActivated) {
            //TODO Change to minimax function name
            var currentMoveValue = alphaBetaOptimised(game, (depth - 1), -10000, 10000, !maximisingPlayer);
        }

        // var currentMoveValue = -evaluateBoard(game);
        game.undo();

        //Check value of move (if black therefore negative is better)
        if (currentMoveValue >= moveScore) {
            moveScore = currentMoveValue;
            bestMove = availableMoves[i];
        }
    }
    // console.log(moveScore);

    $("#boardScore").text(moveScore);
    return bestMove;
}

//? Minimax algorithm implementation with Alpha-Beta pruning
function alphaBetaOptimised(game, depth, alpha, beta, maximisingPlayer) {
    positionsEvaluated++;
    var aiColour = $("#stockfishColour").text();
    var usePieceSquares = $("#pieceSquare").is(":checked");

    //Exit the loop when depth = 0 (meaning all branches and levels have been evaluated)
    if (depth == 0) {
        if (mode == "ai") {
            if (usePieceSquares) {
                return (aiColour == "White") ? -evaluate_board(chessGame.board()) : evaluate_board(chessGame.board());
            }
            return (aiColour == "White") ? -evaluateBoard(game) : evaluateBoard(game);
        } else {
            if (usePieceSquares) {
                return (playerColour == "W") ? -evaluate_board(chessGame.board()) : evaluate_board(chessGame.board());
            }
            return (playerColour == "W") ? -evaluateBoard(game) : evaluateBoard(game);
        }
    }

    var futureMoves = game.ugly_moves();

    if (maximisingPlayer) { //Evaluate Black (when AI = black) [Evaluate AI Moves]
        var score = -9999;

        for (let i = 0; i < futureMoves.length; i++) {

            game.ugly_move(futureMoves[i]);
            score = Math.max(score, alphaBetaOptimised(game, (depth - 1), alpha, beta, !maximisingPlayer));
            game.undo();

            alpha = Math.max(alpha, score);
            if (beta <= alpha) {
                return score;
            }

        }
        return score;
    } else { // Evaluate White (when AI = Black) [Evaluate Player moves]
        var score = 9999;

        for (let i = 0; i < futureMoves.length; i++) {

            game.ugly_move(futureMoves[i]);
            score = Math.min(score, alphaBetaOptimised(game, (depth - 1), alpha, beta, !maximisingPlayer));
            game.undo();

            beta = Math.min(beta, score);
            if (beta <= alpha) {
                {
                    return score;
                }
            }
        }
        return score;
    }

}


//* CHESSBOARD FUNCTIONS
function onDragStart(source, piece, position, orientation) {

    //Only pick the colour that is in play
    if ((chessGame.turn() == "w" && piece.search(/^b/) != "-1") || (chessGame.turn() == "b" && piece.search(/^w/) != "-1")) {
        return false;
    }

    //If game has ended do not allow pieces to be picked
    if (chessGame.game_over()) {
        gameStatus = "ended";
        return false;
    }

}

function onDrop(source, target) {
    //Check if move is valid when piece is dropped
    var moveMade = chessGame.move({
        from: source,
        to: target,
        promotion: "q" //set to promote to Queen by default for simplicity
    });

    if (moveMade == null) { return false; }

    //Disable the checkbox during gameplay
    $("#playerColour").prop('disabled', true);

    //Update game status
    updateGameStatus();
    if ($("#activateAi").is(":checked")) {

        window.setTimeout(aiMove, 250);
    } else {

        window.setTimeout(opponentMove, 250);
    }

}

//? Actions after piece is placed
function onSnapEnd() {
    //Refresh the UI
    chessBoard.position(chessGame.fen());
}

//? Update the total test counter
function updateTestCount() {
    gamesTested = $("#gameTest").val();
    $("#testingResults").text("Stockfish wins: NA out of " + gamesTested);
}

//? Checks the game status
var stockWon = 0;
var apuAiBlack = 0;
var apuAiWhite = 0;
var gamesTested = $("#gameTest").val();
function updateGameStatus() {
    // console.log(chessGame.turn())
    gameStatus = "playing";

    if (mode == "human") {
        if (chessGame.in_checkmate()) {
            alert("Checkmate! Game has ended");
        } else if (chessGame.in_stalemate()) {
            alert("Stalemate! Game has ended");
        } else if (chessGame.in_draw()) {
            alert("Draw! Game has ended");
        }
    }

    if (mode == "ai") {
        if (chessGame.game_over()) {
            var loser;

            if (chessGame.in_checkmate() == true && chessGame.turn() == "b") {
                loser = "black";
            } else if (chessGame.in_checkmate() == true && chessGame.turn() == "w") {
                loser = "white";
            }

            var stockfishIsWhite = ($("#stockfishColour").text() == "White") ? true : false;
            var gamesLeft = $("#gameTest").val();
            // alert(loser);
            console.log(chessGame.turn());

            //Stockfish wins
            if (loser == "black" && stockfishIsWhite) {
                stockWon = stockWon + 1;
            } else if (loser == "white" && !stockfishIsWhite) {
                stockWon = stockWon + 1;
            } else { //Apu AI wins
                if (stockfishIsWhite) {
                    apuAiBlack = apuAiBlack + 1;
                } else {
                    apuAiWhite = apuAiWhite + 1;
                }
            }

            if (gamesLeft > 0) {
                testingReset(!stockfishIsWhite, gamesLeft - 1);
                (stockfishIsWhite) ? $("#stockfishColour").text("Black") : $("#stockfishColour").text("White");
                $("#gameTest").val(gamesLeft - 1);
                $("#testingResults").text("Stockfish wins: " + stockWon + " out of " + gamesTested);
                $("#testingResultsApuAi").text("APU AI wins: Black = " + apuAiBlack + " | White = " + apuAiWhite);
                $("#testingTime").html($("#testingTime").text() + "<br>Game " + gamesLeft + ": " + (new Date().getTime() - startTest) + "s");

                startTest = new Date().getTime();
                // console.log(gamesToTest);
            }
            // gamesToTest--;

            return "testingReset";
        }
    }
    return "";
}