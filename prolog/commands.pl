:- dynamic current_board/1.

parse_input(shiftagoPL, 'CC'):-
	write('ok'),
	board(Board),
	play(Board, 'cc', 2, 'hard', _, p1).
parse_input(shiftago, 'CC'):-
	display_board(Board),

	nl, write('Player '), write(Player), format("'s turn", []), nl,
	length(Board, BoardSize),

	process_turn(GameMode, NPlayers, Difficulty, Player, Board, BoardSize, Cardinal, Position),

	write(Player), write(' placing at '), write(Cardinal), write(', '), write(Position), nl,
	place_piece(Board, Player, Cardinal, Position, NewBoard),

	/* check end condition */
	winner(NewBoard, TempWinner),
	nl, write('Winner = '), write(TempWinner), nl, nl,
	((TempWinner \= 'none'; check_no_moves(NewBoard)) ->
		(
			Winner = TempWinner,
			write('------- GAME OVER -------'), nl, nl,
			display_board(NewBoard),
			nl, write('------- GAME OVER -------')
		);
		(switch_player(Player, NewPlayer, NPlayers), play(NewBoard, GameMode, NPlayers, Difficulty, Winner, NewPlayer))
	).
parse_input(display, Board):-
	board(Board),
	asserta(current_board(Board)),
	display_board(Board).

parse_input(Update, Board):-
	Update = update-Board,
	asserta(current_board(Board)),
	display_board(Board).

parse_input(PlayerTurn, PieceToPlace):-
	PlayerTurn = hturn-Player-Cardinal-Position,
	current_board(Board),
	length(Board, BoardSize),
	get_move(Player, Board, BoardSize, Cardinal, Position),
	PieceToPlace = Player-Cardinal-Position.

parse_input(ComputerTurn, PieceToPlace):-
	ComputerTurn = cturn-Player-NPlayers-Difficulty,
	current_board(Board),
	length(Board, BoardSize),
	process_turn('cc', NPlayers, Difficulty, Player, Board, BoardSize, Cardinal, Position),
	PieceToPlace = Player-Cardinal-Position.

parse_input(PlacePiece, NewBoard):-
	PlacePiece = place-Player-Cardinal-Position,
	current_board(Board),
	place_piece(Board, Player, Cardinal, Position, NewBoard),
	asserta(current_board(NewBoard)).

parse_input(winner, Winner):-
	current_board(Board),
	winner(Board, Winner).
parse_input(nomoves, Has):-
	current_board(Board),
	((check_no_moves(Board), Has = 'true'); Has = 'false').

parse_input(SwitchPlayer, NextPlayer):-
	SwitchPlayer = switch_player-Player-NPlayers,
	switch_player(Player, NextPlayer, NPlayers).
