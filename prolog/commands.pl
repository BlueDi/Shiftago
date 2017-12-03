parse_input(shiftagoPL, 'CC'):-
	write('ok'),
	board(Board),
	play(Board, 'cc', 2, 'hard', Winner, p1).
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
	display_board(Board).
