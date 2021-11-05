
//? Instantiate the chessboard + configuration
var config = {
    draggable: true,
    position: 'start',
    onDragStart: onDragStart,
    onDrop: onDrop,
    onSnapEnd: onSnapEnd,
    showErrors: true
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
    // var playerColour = ($("#playerColour").is(":checked")) ? "B" : "W";
    var minimax = (playerColour == "W") ? true : false;

    var startContemplate = new Date().getTime();
    var bestMove = minimaxAiMove(chessGame, true);
    var endContemplate = new Date().getTime();

    chessGame.ugly_move(bestMove);
    chessBoard.position(chessGame.fen());

    $("#moveEvaluation").text(positionsEvaluated);
    positionsEvaluated = 0;

    $("#timeEvaluation").text((endContemplate - startContemplate) + "s");
    updateGameStatus();
}
function minimaxAiMove(game, maximisingPlayer) {

    var depth = $("#depth").val();
    var availableMoves = game.ugly_moves();
    var moveScore = -9999;
    var bestMove;

    for (let i = 0; i < availableMoves.length; i++) {

        positionsEvaluated++;
        game.ugly_move(availableMoves[i]);
        var currentMoveValue = minimaxAlgorithm(game, (depth - 1), -10000, 10000, !maximisingPlayer);
        // var currentMoveValue = -evaluateBoard(game);
        game.undo();

        //Check value of move (if black therefore negative is better)
        if (currentMoveValue >= moveScore) {
            moveScore = currentMoveValue;
            bestMove = availableMoves[i];
        }
    }
    console.log(moveScore);

    $("#boardScore").text(moveScore);
    return bestMove;
}

//? Minimax algorithm implementation with Alpha-Beta pruning
function minimaxAlgorithm(game, depth, alpha, beta, maximisingPlayer) {
    positionsEvaluated++;

    //Exit the loop when depth = 0 (meaning all branches and levels have been evaluated)
    if (depth == 0) {
        // return -evaluateBoard(game);
        return (playerColour == "W") ? -evaluateBoard(game) : evaluateBoard(game);
    }
    var futureMoves = game.ugly_moves();

    if (maximisingPlayer) { //Evaluate Black (when AI = black) [Evaluate AI Moves]
        var score = -9999;

        for (let i = 0; i < futureMoves.length; i++) {

            game.ugly_move(futureMoves[i]);
            score = Math.max(score, minimaxAlgorithm(game, (depth - 1), alpha, beta, !maximisingPlayer));
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
            score = Math.min(score, minimaxAlgorithm(game, (depth - 1), alpha, beta, !maximisingPlayer));
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

    window.setTimeout(opponentMove, 250);

}

//? Actions after piece is placed
function onSnapEnd() {
    //Refresh the UI
    chessBoard.position(chessGame.fen());
}

//? Checks the game status
function updateGameStatus() {

    gameStatus = "playing";

    if (chessGame.in_checkmate()) {
        alert("Checkmate! Game has ended");
    } else if (chessGame.in_stalemate()) {
        alert("Stalemate! Game has ended");
    } else if (chessGame.in_draw()) {
        alert("Draw! Game has ended");
    }
}