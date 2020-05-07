Flotilla
====

This is a naval battle game where two players take turns firing at grid coordinates in an attempt to sink the fleet of their opponent.

The top-most grid displays your ships and the bottom grid shows where you have shot at your opponent. A hit is represented by 
a red square and a miss is represented by a white square. The number in the square represents the number of turns that have
elapsed since that hit/miss.

For each turn, the play can select an ordinance type from the following options:
* shell - hits anything occupying the 1 grid cell it was fired at 
* missile - hits a 3x3 square centered at the grid cell it was fired at. You only can use this ONE time per game
* drone - provides "intel" ( 5x5 a view of the opponent's grid centered at the position it was fired at.)

After each turn, the ships move according to their speed. The ship speeds are:
* carrier - 1 cell per turn
* destroyer - 2 cells per turn
* submarine - 2 cells per turn
* corvette - 3 cells per turn
* cruiser - 3 cells per turn

When a ship reaches the boundary of the board, it will turn around (1 turn) and continue in the opposite direction.

If you fire upon a cell with multiple ships present, ALL ships in that cell will be hit UNLESS one of those ships is a submarine.
For a submarine to be hit, it must be the only ship in that cell.


TODO:
* include attribution for sprites (https://opengameart.org/content/sea-warfare-set-ships-and-more) maybe
* reset button prior to starting
* limit players
* display grid coordinates
* draw hits

