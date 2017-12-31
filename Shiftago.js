/**
 * Shiftago
 * @param graph
 * @param nodeID Name of the node
 * @param selectable If it will be affected by the shaders
 * @param dim Length of the side of the board
 * @constructor
 */
function Shiftago(graph, nodeID, selectable, dim) {
    this.graph = graph;
    this.nodeID = nodeID;
    this.selectable = selectable;
    this.dim = dim;

    // IDs of child nodes.
    this.children = [];

    // IDs of leaf nodes.
    this.leaves = [];

    // The material ID.
    this.materialID = null;

    // The texture ID.
    this.textureID = null;

    // The animation ID.
    this.animationID = [];
    this.actualAnimation = -1;
    this.animationSpeed = 15;

    this.transformMatrix = mat4.create();
    mat4.identity(this.transformMatrix);

    this.time = 0;
    this.waitingFor;

    this.camera = [];
    this.environment = ['In a Ship'];
    this.restart = function() {
        this.getPrologRequest('display');
        this.resetBoard();
        this.init();
    };
    this.undo = function() {
        this.player.pop()
        var undoPlayer = this.player.slice(-1).pop();
        this.board.pop();
        var board = this.board.slice(-1).pop();
        this.getPrologRequest('update-' + board);
        this.applyUndo();
        this.playerCounter[undoPlayer.substring(1)]--;
    };
    this.gameMode = [];
    this.numberOfPlayers = [];
    this.difficulty = ['easy'];

    this.materials = {
        p1: 'saphire',
        p2: 'ruby',
        p3: 'obsidian',
        p4: 'emerald',
        board: 'wood'
    };

    this.init();
    this.allPieces = [];
    this.initializeBoard();

    this.NBALLS = Math.pow(dim, 2);
    this.balls = [];
    for (var i = 0; i < dim; i++) {
        this.balls[i] = new Array(dim);
    }
}

Shiftago.prototype.constructor = Shiftago;

function PlayerPiece(graph) {
    this.object = new Sphere(graph.scene, 0.5, 20, 20);
}

function BoardTile(graph) {
    this.object = new Cylinder(graph.scene, 0.24, 0.4, 0.5, 2, 20, 1, 0);
}

/**
 * Adds the reference (ID) of another node to this node's children array.
 */
Shiftago.prototype.addChild = function(nodeID) {
    this.children.push(nodeID);
};

/**
 * Adds a leaf to this node's leaves array.
 */
Shiftago.prototype.addLeaf = function(leaf) {
    this.leaves.push(leaf);
};

Shiftago.prototype.init = function() {
    this.response;
    this.board = [];
    this.turn = [];
    this.player = ['p1'];
    this.playerCounter = [-1, -1, -1, -1, -1];
    this.winner = 'none';
    this.nomoves = 'false';
}

Shiftago.prototype.updateCamera = function() {
    var init = mat4.create();
    if (this.camera == 'default') {
        mat4.translate(this.graph.initialTransforms, init, [-10, -10, -10]);
    } else if (this.camera == 'topdown') {
        mat4.rotate(this.graph.initialTransforms, init, -Math.PI / 3, [0, 0, 1]);
        mat4.rotate(this.graph.initialTransforms, this.graph.initialTransforms, -Math.PI / 7, [0, 1, 0]);
        mat4.rotate(this.graph.initialTransforms, this.graph.initialTransforms, Math.PI / 5, [1, 0, 0]);
        mat4.translate(this.graph.initialTransforms, this.graph.initialTransforms, [-2.5, -40, 0]);
    }
}

Shiftago.prototype.selectGameLight = function() {
    var lights = this.graph.scene.lightValues;
    lights['Main'] = true;
    for (var i = 1; i <= 4; i++) {
        lights['Player ' + i] = false;
    }
}

Shiftago.prototype.selectPlayerLights = function() {
    var lights = this.graph.scene.lightValues;
    lights['Main'] = false;
    for (var i = 1; i <= 4; i++) {
        if (i <= this.numberOfPlayers) {
            lights['Player ' + i] = true;
        } else {
            lights['Player ' + i] = false;
        }
    }
}

Shiftago.prototype.alternateDifficultyLight = function() {
    this.graph.scene.lightValues['Difficulty'] = !this.graph.scene.lightValues['Difficulty'];
}

Shiftago.prototype.getPrologRequest = function(requestString, onSuccess, onError, port) {
    var requestPort = port || 8081
    var request = new XMLHttpRequest();
    request.open('GET', 'http://localhost:' + requestPort + '/' + requestString, true);

    request.board = this;
    request.requestString = requestString;

    request.onload = onSuccess || function(data) {
        request.board.handleReply(data.target.response, request.requestString);
    };
    request.onerror = onError || function() {
        console.log('Error waiting for response');
    };

    request.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8');
    request.send();
}

Shiftago.prototype.handleReply = function(response, requestString) {
    if (requestString == 'winner') {
        this.winner = response;
        if (this.winner != 'none') {
            console.log('The winner is', this.winner);
        }
    } else if (requestString == 'display') {
        this.board.push(response);
    } else if (requestString.substring(0, 5) == 'place') {
        this.board.push(response);
    } else if (requestString.substring(0, 5) == 'hturn' || requestString.substring(0, 5) == 'cturn') {
        var cleanResponse = response.split('-');
        var player = cleanResponse[0];
        var side = cleanResponse[1];
        var position = parseInt(cleanResponse[2]);
        this.playerCounter[player.substring(1)]++;
        var nodeID = player + this.playerCounter[player.substring(1)];
        var line = this.getLineElements(nodeID, side, position);
        if (line.length < this.dim) {
            this.insertPiece(nodeID, player, side, position);
            this.updateLine(line, side, position);
            this.getPrologRequest('place-' + this.player.slice(-1).pop() + '-' + side + '-' + position);
        }
    } else if (requestString.substring(0, 13) == 'switch_player') {
        this.player.push(response);
    } else if (requestString == 'nomoves') {
        this.nomoves = response;
        if (response == 'true') {
            console.log('No more moves available');
        }
    }
    this.response = response;
}

Shiftago.prototype.insertPiece = function(nodeID, player, side, position) {
    var node = this.graph.nodes[nodeID];
    var vec = [0, 0, 0];
    var piecePosition = node.vec[node.vec.length - 1];
    if (side == 'top') {
        positionAbs = [-3, 1, 4 - position];
        vec = [-3 - piecePosition[0], 0, 4 - position - piecePosition[2]];
    } else if (side == 'bottom') {
        positionAbs = [3, 1, 4 - position];
        vec = [3 - piecePosition[0], 0, 4 - position - piecePosition[2]];
    } else if (side == 'left') {
        positionAbs = [-4 + position, 1, 3];
        vec = [position - 4 - piecePosition[0], 0, 3 - piecePosition[2]];
    } else if (side == 'right') {
        positionAbs = [-4 + position, 1, -3];
        vec = [position - 4 - piecePosition[0], 0, -3 - piecePosition[2]];
    }
    node.vec.push(positionAbs);
    this.turn.push([nodeID]);
    this.graph.animations[nodeID] = new BezierAnimation(this.animationSpeed, [
        [0, 0, 0],
        [0, 4, 0],
        [vec[0], 4, vec[2]],
        vec
    ]);
    this.waitingFor = this.graph.animations[nodeID];
    node.animationID.push(nodeID);
    node.actualAnimation = 0;
    this.graph.animations[node.animationID[0]].stop = false;
}

Shiftago.prototype.updateLine = function(line, side, position) {
    this.sortLine(line, side);
    this.pushLine(line, side, position);
}

Shiftago.prototype.getLineElements = function(nodeName, side, position) {
    var line = [];
    for (var i = 1; i <= this.numberOfPlayers; i++) {
        var player = 'p' + i;
        for (var j = 0; j <= this.playerCounter[player.substring(1)]; j++) {
            var nodeID = player + j;
            var node = this.graph.nodes[nodeID];
            var vec = node.vec[node.vec.length - 1];

            if (side == 'top' || side == 'bottom') {
                if (nodeName != nodeID && vec[2] == 4 - position) {
                    line.push(node);
                }
            } else if (side == 'left' || side == 'right') {
                if (nodeName != nodeID && vec[0] == position - 4) {
                    line.push(node);
                }
            }
        }
    }
    return line;
}

Shiftago.prototype.sortLine = function(line, side) {
    if (side == 'top') {
        line.sort(function(a, b) {
            var vecA = a.vec[a.vec.length - 1];
            var vecB = b.vec[b.vec.length - 1];
            return vecA[0] - vecB[0];
        });
    } else if (side == 'bottom') {
        line.sort(function(a, b) {
            var vecA = a.vec[a.vec.length - 1];
            var vecB = b.vec[b.vec.length - 1];
            return vecB[0] - vecA[0];
        });
    } else if (side == 'left') {
        line.sort(function(a, b) {
            var vecA = a.vec[a.vec.length - 1];
            var vecB = b.vec[b.vec.length - 1];
            return vecB[2] - vecA[2];
        });
    } else if (side == 'right') {
        line.sort(function(a, b) {
            var vecA = a.vec[a.vec.length - 1];
            var vecB = b.vec[b.vec.length - 1];
            return vecA[2] - vecB[2];
        });
    }
}

Shiftago.prototype.pushLine = function(line, side, position) {
    for (var counter = 0; counter < line.length; counter++) {
        if (line[counter] != null) {
            var node = line[counter];
            var position = node.vec[node.vec.length - 1];
            var newposition = [position[0], position[1], position[2]];
            if (side == 'top' && position[0] == counter - Math.ceil(this.dim / 2) + 1) {
                newposition[0]++;
            } else if (side == 'bottom' && position[0] == this.dim - counter - Math.floor(this.dim / 2) - 1) {
                newposition[0]--;
            } else if (side == 'left' && position[2] == Math.ceil(this.dim / 2) - counter - 1) {
                newposition[2]--;
            } else if (side == 'right' && position[2] == counter - this.dim + Math.floor(this.dim / 2) + 1) {
                newposition[2]++;
            } else {
                break;
            }
            this.turn[this.turn.length - 1].push(node.nodeID);
            var matI = mat4.create();
            mat4.translate(node.transformMatrix, matI, newposition);
            node.vec.push(newposition);
        }
    }
}

Shiftago.prototype.initializeBoard = function() {
    this.getPrologRequest('display');

    this.createBoardPieces(this.materials['board']);

    this.createPlayerPieces('p1', this.materials['p1']);
    this.createPlayerPieces('p2', this.materials['p2']);
    this.createPlayerPieces('p3', this.materials['p3']);
    this.createPlayerPieces('p4', this.materials['p4']);
}

Shiftago.prototype.createBoardPieces = function(Material) {
    var texture = 'null';
    for (var i = 0; i < this.dim; i++) {
        for (var j = 0; j < this.dim; j++) {
            this.addTile('t' + (this.dim * i + j), Material, texture, [-3 + j, 0.5, -3 + i]);
        }
    }
}

Shiftago.prototype.addTile = function(nodeID, Material, Texture, Vector) {
    var node = new MyGraphNode(this.graph, nodeID);
    node.materialID = Material;
    node.textureID = Texture;
    mat4.translate(node.transformMatrix, node.transformMatrix, Vector);
    mat4.rotate(node.transformMatrix, node.transformMatrix, -Math.PI / 2, [1, 0, 0]);
    node.vec = Vector;
    node.addLeaf(new BoardTile(this.graph));
    this.addChild(node.nodeID);
    this.graph.nodes[node.nodeID] = node;
}

Shiftago.prototype.createPlayerPieces = function(Player, Material) {
    var texture = 'null';
    var pos = 0;
    var vec1;
    var vec2;
    var vec3;
    var vec4;
    if (Player == 'p1') {
        vec1 = [-5.5, 1, pos];
        vec2 = [-6.5, 1, pos];
        vec3 = [-7.5, 1, pos];
        vec4 = [-8.5, 1, pos];
    } else if (Player == 'p2') {
        vec1 = [5.5, 1, pos];
        vec2 = [6.5, 1, pos];
        vec3 = [7.5, 1, pos];
        vec4 = [8.5, 1, pos];
    } else if (Player == 'p3') {
        vec1 = [pos, 1, 5.5];
        vec2 = [pos, 1, 6.5];
        vec3 = [pos, 1, 7.5];
        vec4 = [pos, 1, 8.5];
    } else if (Player == 'p4') {
        vec1 = [pos, 1, -5.5];
        vec2 = [pos, 1, -6.5];
        vec3 = [pos, 1, -7.5];
        vec4 = [pos, 1, -8.5];
    }

    for (var i = 0; i < 10; i++) {
        var vec;
        if (Player == 'p1' || Player == 'p2') {
            vec = [vec1[0], vec1[1], i - 4.5];
        } else if (Player == 'p3' || Player == 'p4') {
            vec = [i - 4.5, vec1[1], vec1[2]];
        }
        this.addBall(Player + i, Material, texture, vec);
    }
    for (var i = 10; i < 22; i++) {
        var vec;
        if (Player == 'p1' || Player == 'p2') {
            vec = [vec2[0], vec2[1], i - 10 - 5.5];
        } else if (Player == 'p3' || Player == 'p4') {
            vec = [i - 10 - 5.5, vec2[1], vec2[2]];
        }
        this.addBall(Player + i, Material, texture, vec);
    }
    for (var i = 22; i < 36; i++) {
        var vec;
        if (Player == 'p1' || Player == 'p2') {
            vec = [vec3[0], vec3[1], i - 22 - 6.5];
        } else if (Player == 'p3' || Player == 'p4') {
            vec = [i - 22 - 6.5, vec3[1], vec3[2]];
        }
        this.addBall(Player + i, Material, texture, vec);
    }
    for (var i = 36; i < 52; i++) {
        var vec;
        if (Player == 'p1' || Player == 'p2') {
            vec = [vec4[0], vec4[1], i - 36 - 7.5];
        } else if (Player == 'p3' || Player == 'p4') {
            vec = [i - 36 - 7.5, vec4[1], vec4[2]];
        }
        this.addBall(Player + i, Material, texture, vec);
    }
}

Shiftago.prototype.addBall = function(nodeID, Material, Texture, Vector) {
    var node = new MyGraphNode(this.graph, nodeID);
    node.materialID = Material;
    node.textureID = Texture;
    mat4.translate(node.transformMatrix, node.transformMatrix, Vector);
    node.vec = [Vector];
    node.addLeaf(new PlayerPiece(this.graph));
    this.addChild(node.nodeID);
    this.graph.nodes[node.nodeID] = node;
    this.allPieces.push(node);
}

Shiftago.prototype.resetBoard = function() {
    for (var i = 0; i <= Math.max(...this.playerCounter); i++) {
        for (var player = 0; player < this.numberOfPlayers; player++) {
            var n = player * 52 + i;
            var node = this.allPieces[n];
            var vec = node.vec[0];

            delete this.graph.animations[node.nodeID];
            this.waitingFor = null;
            node.animationID.pop();
            node.actualAnimation = -1;

            var init = mat4.create();
            mat4.translate(node.transformMatrix, init, vec);
            node.vec = [vec];
        }
    }
}

Shiftago.prototype.applyUndo = function() {
    var turnToUndo = this.turn.pop();
    for (var i = 0; i < turnToUndo.length; i++) {
        var node = this.graph.nodes[turnToUndo[i]];
        node.vec.pop();
        var vec = node.vec[node.vec.length - 1];

        delete this.graph.animations[node.nodeID];
        this.waitingFor = null;
        node.animationID.pop();
        node.actualAnimation = -1;

        var init = mat4.create();
        mat4.translate(node.transformMatrix, init, vec);
    }
}

Shiftago.prototype.update = function(currTime, side, position) {
    if (this.waitingFor != null && this.waitingFor.state != 'end') {
        return;
    }

    if (this.winner == 'none' && this.nomoves == 'false') {
        if (this.time == 0) {
            this.time = currTime;
        } else if (currTime - this.time > 1000) {
            this.time = currTime;
            if (this.gameMode == 'Human vs Human' || (this.gameMode == 'Human vs Computer' && this.player.slice(-1).pop() == 'p1')) {
                this.getPrologRequest('hturn' + '-' + this.player.slice(-1).pop() + '-' + side + '-' + position);
            } else {
                this.getPrologRequest('cturn' + '-' + this.player.slice(-1).pop() + '-' + this.numberOfPlayers + '-' + this.difficulty);
            }
            this.getPrologRequest('winner');
            this.getPrologRequest('nomoves');
            this.getPrologRequest('switch_player-' + this.player.slice(-1).pop() + '-' + this.numberOfPlayers);
        }
    }
}

Shiftago.prototype.updateEnvironment = function() {
    if (this.environment == 'Simple') {
        this.textureID = 'null';
        this.materialID = 'null';
        for (var i = 0; i < this.allPieces.length; i++) {
            this.allPieces[i].textureID = 'null';
        }
    } else if (this.environment == 'Fur') {
        this.textureID = 'fluffy';
        this.materialID = 'obsidian';
        for (var i = 0; i < this.allPieces.length; i++) {
            this.allPieces[i].textureID = 'fluffy';
        }
    } else if (this.environment == 'Midnight Desert') {
        this.textureID = 'sand';
        this.materialID = 'saphire';
        for (var i = 0; i < this.allPieces.length; i++) {
            this.allPieces[i].textureID = 'sand';
        }
    } else if (this.environment == 'Polka Dot') {
        this.textureID = 'polkadot';
        this.materialID = 'pearl';
        for (var i = 0; i < this.allPieces.length; i++) {
            this.allPieces[i].textureID = 'stripes';
        }
    } else if (this.environment == 'In a Ship') {
        this.textureID = 'wood';
        this.materialID = 'wood';
        for (var i = 0; i < this.allPieces.length; i++) {
            this.allPieces[i].textureID = 'jewel';
        }
    } else {
        this.textureID == null;
    }
}
