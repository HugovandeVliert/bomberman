class Game {
    constructor(height, width) {
        this.players = {};
        this.playerCount = 0;
        this.grid = [height];
        for (var i = 0; i < height; i++) {
            this.grid[i] = [width];
        }
        for (var i = 0; i < height; i++) {
            for (var j = 0; j < width; j++) {
                var cell = new Cell(j * 50, i * 50);
                if (i % 2 && j % 2) {
                    cell.solid = true;
                }
                this.grid[i][j] = cell;
            }
        }
    }

    addPlayer(id) {
        if (this.playerCount == 1) {
            var cell = this.grid[this.grid.length - 1][this.grid[this.grid.length - 1].length - 1];
            var emoji = '👹';
        } else if (this.playerCount == 2) {
            var cell = this.grid[0][this.grid[0].length - 1];
            var emoji = '🤡';
        } else if (this.playerCount == 3) {
            var cell = this.grid[this.grid.length - 1][0];
            var emoji = '😈';
        } else {
            var cell = this.grid[0][0];
            var emoji = '🤖';
        }
        var newPlayer = new Player(emoji);
        cell.player = newPlayer;
        this.players[id] = newPlayer;
        this.playerCount++;
    }

    update() {
        for (var i = 0; i < this.grid.length; i++) {
            for (var j = 0; j < this.grid[i].length; j++) {
                var cell = this.grid[i][j];
                cell.update();

                if (cell.player) {
                    var player = cell.player;
                    if (player.droppedBomb) {
                        var cells = [cell];
                        var count = 1;
                        while (count <= player.bombRange) {
                            var leftCell = this.calculatePosition(i, j, 'left', count);
                            if (leftCell && !leftCell.solid) {
                                cells.push(leftCell);
                            }
                            var upCell = this.calculatePosition(i, j, 'up', count);
                            if (upCell && !upCell.solid) {
                                cells.push(upCell);
                            }
                            var rightCell = this.calculatePosition(i, j, 'right', count);
                            if (rightCell && !rightCell.solid) {
                                cells.push(rightCell);
                            }
                            var downCell = this.calculatePosition(i, j, 'down', count);
                            if (downCell && !downCell.solid) {
                                cells.push(downCell);
                            }
                            count++;
                        }
                        cell.bomb = new Bomb(cells);
                        player.droppedBomb = false;
                    }

                    if (player.nextMove != null); {
                        var newCell = this.calculatePosition(i, j, player.nextMove, 1);
                        player.nextMove = null;
                        if (newCell == null || newCell.solid || newCell.bomb != null) {
                            return;
                        }
                        newCell.player = player;
                        cell.player = null;
                    }
                }
            }
        }
    }

    calculatePosition(i, j, direction, amount) {
        var newLocation = null;
        switch (direction) {
            case 'left':
                if (j - amount > 0) {
                    newLocation = this.grid[i][j - amount];
                }
                break;
            case 'up':
                if (i - amount > 0) {
                    newLocation = this.grid[i - amount][j];
                }
                break;
            case 'right':
                if (j + amount < this.grid[i].length - 1) {
                    newLocation = this.grid[i][j + amount];
                }
                break;
            case 'down':
                if (i + amount < this.grid.length - 1) {
                    newLocation = this.grid[i + amount][j];
                }
                break;
            default:
                break;
        }
        return newLocation;
    }
}

class Cell {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.solid = false;
        this.exploding = false;
        this.explodingFadeTime = 0;
        this.player = null;
        this.item = null;
        this.bomb = null;
    }

    update() {
        if (this.player && this.item) {
            this.player.consume(this.item);
            this.item = null;
        }
        if (this.bomb) {
            this.bomb.update();
        }
        if (this.exploding) {
            this.explodingFadeTime--;
            if (this.explodingFadeTime == 0) {
                this.exploding = false;
            }
        }
    }

    explode() {
        if (this.bomb) {
            this.bomb.explode();
            this.bomb = null;
        }
        if (this.player) {
            this.player.die();
        }
        if (this.item == 'crate') {
            this.item = 'bomb-amount-increase';
        } else {
            this.item = null;
        }
        this.exploding = true;
        this.explodingFadeTime = 3;
    }

    toJSON() {
        return {
            x: this.x,
            y: this.y,
            solid: this.solid,
            exploding: this.exploding,
            player: this.player ? this.player.emoji : null,
            item: this.item,
            bomb: this.bomb ? true : false,
        }
    }
}

class Bomb {
    constructor(range) {
        this.range = range;
        this.detonationTime = 5;
        this.detonated = false;
    }

    update() {
        if (this.detonationTime == 0) {
            this.explode();
        }
        this.detonationTime--;
    }

    explode() {
        if (!this.detonated) {
            this.detonated = true;
            this.range.forEach(function (cell) {
                cell.explode();
            });
        }
    }
}

class Player {
    constructor(emoji) {
        this.emoji = emoji;
        this.timeUntilMove = 10;
        this.speed = 1;
        this.bombAmount = 1;
        this.bombRange = 1;
        this.nextMove = null;
        this.droppedBomb = false;
    }

    update() {
        this.timeUntilMove--;
    }

    consume(item) {
        if (item == 'speed-boost') {
            this.speed++;
        } else if (item == 'bomb-amount-increase') {
            this.bombAmount++;
        } else if (item == 'bomb-range-increase') {
            this.bombRange++;
        }
    }

    die() {
        this.emoji = '☠️';
        this.speed = 0;
    }
}

module.exports = Game;
