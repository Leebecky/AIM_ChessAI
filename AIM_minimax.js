var minimaxBase = function(depth, game, isMaximisingPlayer) {

    var possibleGameMoves = game.ugly_moves();
    var currentBestMove = -9999;
    var finalBestMove;

    for(var i = 0; i < possibleGameMoves.length; i++) {
        game.ugly_move(possibleGameMoves[i]);
        var value = minimax(depth - 1, game, !isMaximisingPlayer);
        game.undo();

        if(value >= currentBestMove) {
            currentBestMove = value;
            finalBestMove = possibleGameMoves[i];
        }
    }
    return finalBestMove;
};

var minimax = function (depth, game, isMaximisingPlayer) {
    positionsEvaluated++;
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

    var possibleGameMoves = game.ugly_moves();

    if (isMaximisingPlayer) {
        var currentBestMove = -9999;
        for (var i = 0; i < possibleGameMoves.length; i++) {
            game.ugly_move(possibleGameMoves[i]);
            currentBestMove = Math.max(currentBestMove, minimax(depth - 1, game, !isMaximisingPlayer));
            game.undo();
        }
        return currentBestMove;
    } else {
        var currentBestMove = 9999;
        for (var i = 0; i < possibleGameMoves.length; i++) {
            game.ugly_move(possibleGameMoves[i]);
            currentBestMove = Math.min(currentBestMove, minimax(depth - 1, game, !isMaximisingPlayer));
            game.undo();
        }
        return currentBestMove;
    }
};

var positionCount;
var getBestMove = function (game) {
    if (game.game_over()) {
        alert('Game over');
    }

    positionCount = 0;
    var depth = parseInt($('#search-depth').find(':selected').text());

    var d = new Date().getTime();
    var bestMove = minimaxBase(depth, game, true);
    var d2 = new Date().getTime();
    var moveTime = (d2 - d);
    var positionsPerS = ( positionCount * 1000 / moveTime);

    $('#position-count').text(positionCount);
    $('#time').text(moveTime/1000 + 's');
    $('#positions-per-s').text(positionsPerS);
    return bestMove;
};
