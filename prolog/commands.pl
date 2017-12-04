:- dynamic board/1.

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
	asserta(current_board(Board)),
	display_board(Board).
parse_input(cturnp12, NewBoard):-
	current_board(Board),
	length(Board, BoardSize),
	process_turn('cc', 2, 'hard', p1, Board, BoardSize, Cardinal, Position),
	place_piece(Board, p1, Cardinal, Position, NewBoard),
	asserta(current_board(NewBoard)).
parse_input(cturnp22, NewBoard):-
	current_board(Board),
	length(Board, BoardSize),
	process_turn('cc', 2, 'hard', p2, Board, BoardSize, Cardinal, Position),
	place_piece(Board, p2, Cardinal, Position, NewBoard),
	asserta(current_board(NewBoard)).
parse_input(cturnp13, NewBoard):-
	current_board(Board),
	length(Board, BoardSize),
	process_turn('cc', 3, 'hard', p1, Board, BoardSize, Cardinal, Position),
	place_piece(Board, p1, Cardinal, Position, NewBoard),
	asserta(current_board(NewBoard)).
parse_input(cturnp23, NewBoard):-
	current_board(Board),
	length(Board, BoardSize),
	process_turn('cc', 3, 'hard', p2, Board, BoardSize, Cardinal, Position),
	place_piece(Board, p2, Cardinal, Position, NewBoard),
	asserta(current_board(NewBoard)).
parse_input(cturnp33, NewBoard):-
	current_board(Board),
	length(Board, BoardSize),
	process_turn('cc', 3, 'hard', p3, Board, BoardSize, Cardinal, Position),
	place_piece(Board, p3, Cardinal, Position, NewBoard),
	asserta(current_board(NewBoard)).
parse_input(cturnp14, NewBoard):-
	current_board(Board),
	length(Board, BoardSize),
	process_turn('cc', 4, 'hard', p1, Board, BoardSize, Cardinal, Position),
	place_piece(Board, p1, Cardinal, Position, NewBoard),
	asserta(current_board(NewBoard)).
parse_input(cturnp24, NewBoard):-
	current_board(Board),
	length(Board, BoardSize),
	process_turn('cc', 4, 'hard', p2, Board, BoardSize, Cardinal, Position),
	place_piece(Board, p2, Cardinal, Position, NewBoard),
	asserta(current_board(NewBoard)).
parse_input(cturnp34, NewBoard):-
	current_board(Board),
	length(Board, BoardSize),
	process_turn('cc', 4, 'hard', p3, Board, BoardSize, Cardinal, Position),
	place_piece(Board, p3, Cardinal, Position, NewBoard),
	asserta(current_board(NewBoard)).
parse_input(cturnp44, NewBoard):-
	current_board(Board),
	length(Board, BoardSize),
	process_turn('cc', 4, 'hard', p4, Board, BoardSize, Cardinal, Position),
	place_piece(Board, p4, Cardinal, Position, NewBoard),
	asserta(current_board(NewBoard)).
parse_input(winner, Winner):-
	current_board(Board),
	winner(Board, Winner).
parse_input(nomoves, Has):-
	current_board(Board),
	((check_no_moves(Board), Has = 'true'); Has = 'false').
parse_input(switch_playerp12, Player):-
	switch_player(p1, Player, 2).
parse_input(switch_playerp22, Player):-
	switch_player(p2, Player, 2).
parse_input(switch_playerp13, Player):-
	switch_player(p1, Player, 3).
parse_input(switch_playerp23, Player):-
	switch_player(p2, Player, 3).
parse_input(switch_playerp33, Player):-
	switch_player(p3, Player, 3).
parse_input(switch_playerp14, Player):-
	switch_player(p1, Player, 4).
parse_input(switch_playerp24, Player):-
	switch_player(p2, Player, 4).
parse_input(switch_playerp34, Player):-
	switch_player(p3, Player, 4).
parse_input(switch_playerp44, Player):-
	switch_player(p4, Player, 4).
