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
    this.environment = [];
    this.repair = function() {
        this.updateBoard();
    };
    this.gameMode = [];
    this.numberOfPlayers = [];
    this.difficulty = [];

    this.materials = {
        p1: 'saphire',
        p2: 'ruby',
        p3: 'obsidian',
        p4: 'emerald',
        board: 'wood'
    };
    this.response;
    this.board;
    this.player = 'p1';
    this.playerCounter = {
        p1: -1,
        p2: -1,
        p3: -1,
        p4: -1
    };
    this.winner = 'none';
    this.nomoves = 'false';

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
        this.board = response;
        this.updateBoard();
    } else if (requestString.substring(0, 5) == 'place') {
        this.board = response;
        this.updateBoard();
    } else if (requestString.substring(0, 5) == 'hturn' || requestString.substring(0, 5) == 'cturn') {
        var cleanResponse = response.split('-');
        var player = cleanResponse[0];
        var side = cleanResponse[1];
        var position = cleanResponse[2];
        this.playerCounter[player]++;
        var nodeID = player + this.playerCounter[player];
        var line = this.getLineElements(nodeID, side, position);
        if (line.length < this.dim) {
            this.insertPiece(nodeID, player, side, position);
            this.updateLine(line, side, position);
            this.getPrologRequest('place-' + this.player.slice(-1).pop() + '-' + side + '-' + position);
        }
    } else if (requestString.substring(0, 13) == 'switch_player') {
        this.player = response;
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
    var n = this.playerCounter[player];
    if (n >= 10 && n < 22) {
        n -= 12;
    } else if (n >= 22 && n < 36) {
        n -= 26;
    } else if (n >= 36) {
        n -= 42;
    }
    var vec = [0, 0, 0];
    if (player == 'p1' || player == 'p2') {
        if (side == 'top') {
            node.position = [1, position];
            vec = [-3 - node.vec[0], 0, -position - n + 13 - node.vec[2]];
        } else if (side == 'bottom') {
            node.position = [this.dim, position];
            vec = [3 - node.vec[0], 0, -position - n + 13 - node.vec[2]];
        } else if (side == 'left') {
            node.position = [position, 1];
            vec = [position - 4 - node.vec[0], 0, -n + 12 - node.vec[2]];
        } else if (side == 'right') {
            node.position = [position, this.dim];
            vec = [position - 4 - node.vec[0], 0, -n + 6 - node.vec[2]];
        }
    } else if (player == 'p3' || player == 'p4') {
        if (side == 'top') {
            node.position = [1, position];
            vec = [-n + 6 - node.vec[0], 0, -position + 4 - node.vec[2]];
        } else if (side == 'bottom') {
            node.position = [this.dim, position];
            vec = [-n + 12 - node.vec[0], 0, -position + 4 - node.vec[2]];
        } else if (side == 'left') {
            node.position = [position, 1];
            vec = [position - n + 5 - node.vec[0], 0, 3 - node.vec[2]];
        } else if (side == 'right') {
            node.position = [position, this.dim];
            vec = [position - n + 5 - node.vec[0], 0, -3 - node.vec[2]];
        }
    }
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
        for (var j = 0; j <= this.playerCounter[player]; j++) {
            var nodeID = player + j;
            var node = this.graph.nodes[nodeID];

            if (side == 'top' || side == 'bottom') {
                if (nodeName != nodeID && node.position[1] == position) {
                    line.push(node);
                }
            } else if (side == 'left' || side == 'right') {
                if (nodeName != nodeID && node.position[0] == position) {
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
            return a.position[0] - b.position[0];
        });
    } else if (side == 'bottom') {
        line.sort(function(a, b) {
            return b.position[0] - a.position[0];
        });
    } else if (side == 'left') {
        line.sort(function(a, b) {
            return a.position[1] - b.position[1];
        });
    } else if (side == 'right') {
        line.sort(function(a, b) {
            return b.position[1] - a.position[1];
        });
    }
}

Shiftago.prototype.pushLine = function(line, side, position) {
    for (var counter = 0; counter < line.length; counter++) {
        if (line[counter] != null) {
            var node = line[counter];
            if (side == 'top' && node.position[0] == counter + 1) {
                node.position[0]++;
                var matI = mat4.create();
                mat4.translate(node.transformMatrix, matI, [node.position[0] - 4, 1, -node.position[1] + 4]);
            } else if (side == 'bottom' && node.position[0] == this.dim - counter) {
                node.position[0]--;
                var matI = mat4.create();
                mat4.translate(node.transformMatrix, matI, [node.position[0] - 4, 1, -node.position[1] + 4]);
            } else if (side == 'left' && node.position[1] == counter + 1) {
                node.position[1]++;
                var matI = mat4.create();
                mat4.translate(node.transformMatrix, matI, [node.position[0] - 4, 1, -node.position[1] + 4]);
            } else if (side == 'right' && node.position[1] == this.dim - counter) {
                node.position[1]--;
                var matI = mat4.create();
                mat4.translate(node.transformMatrix, matI, [node.position[0] - 4, 1, -node.position[1] + 4]);
            } else {
                break;
            }
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
        if (Player == 'p1' || Player == 'p2') {
            vec1[2] = i - 4.5;
        } else if (Player == 'p3' || Player == 'p4') {
            vec1[0] = i - 4.5;
        }
        this.addBall(Player + i, Material, texture, vec1);
    }
    for (var i = 10; i < 22; i++) {
        if (Player == 'p1' || Player == 'p2') {
            vec2[2] = i - 10 - 5.5;
        } else if (Player == 'p3' || Player == 'p4') {
            vec2[0] = i - 10 - 5.5;
        }
        this.addBall(Player + i, Material, texture, vec2);
    }
    for (var i = 22; i < 36; i++) {
        if (Player == 'p1' || Player == 'p2') {
            vec3[2] = i - 22 - 6.5;
        } else if (Player == 'p3' || Player == 'p4') {
            vec3[0] = i - 22 - 6.5;
        }
        this.addBall(Player + i, Material, texture, vec3);
    }
    for (var i = 36; i < 52; i++) {
        if (Player == 'p1' || Player == 'p2') {
            vec4[2] = i - 36 - 7.5;
        } else if (Player == 'p3' || Player == 'p4') {
            vec4[0] = i - 36 - 7.5;
        }
        this.addBall(Player + i, Material, texture, vec4);
    }
}

Shiftago.prototype.addBall = function(nodeID, Material, Texture, Vector) {
    var node = new MyGraphNode(this.graph, nodeID);
    node.materialID = Material;
    node.textureID = Texture;
    mat4.translate(node.transformMatrix, node.transformMatrix, Vector);
    node.vec = Vector;
    node.addLeaf(new PlayerPiece(this.graph));
    this.addChild(node.nodeID);
    this.graph.nodes[node.nodeID] = node;
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
            if (typeof this.board !== 'undefined') {
                this.updateBoard();
            }
            if (this.gameMode == 'Human vs Human' || (this.gameMode == 'Human vs Computer' && this.player == 'p1')) {
                this.getPrologRequest('hturn' + '-' + this.player + '-' + this.numberOfPlayers + '-' + side + '-' + position);
            } else {
                this.getPrologRequest('cturn' + '-' + this.player + '-' + this.numberOfPlayers + '-' + this.difficulty);
            }
            this.getPrologRequest('winner');
            this.getPrologRequest('nomoves');
            this.getPrologRequest('switch_player-' + this.player + '-' + this.numberOfPlayers);
        }
    }

    this.updateEnvironment();
}

Shiftago.prototype.updateBoard = function() {
    var cleanResponse = this.board.replace(/[\[\]]+/g, '').split(',');
    var aux = 0;
    for (var i = 0; i < this.dim; i++) {
        for (var j = 0; j < this.dim; j++) {
            aux = this.dim * i + j;
            var piece = cleanResponse[aux];
            if (piece != 'e') {
                for (var k = 1; k <= 4; k++) {
                    var tempPlayer = 'p' + k;
                    var nodeID = tempPlayer + aux;
                    var node = this.graph.nodes[nodeID];
                    var matI = mat4.create();
                    if (tempPlayer == piece) {
                        //mat4.translate(node.transformMatrix, matI, [i - 3, 1, -j + 3]);
                    } else {
                        //mat4.translate(node.transformMatrix, matI, [i - 3, 20, -j + 3]);
                    }
                }
            }
        }
    }
}

Shiftago.prototype.updateEnvironment = function() {
    if (this.environment == 'simple') {
        this.textureID = 'null';
        this.materialID = 'null';
    } else if (this.environment == 'furr') {
        this.textureID = 'fluffy';
        this.materialID = 'obsidian';
    } else if (this.environment == 'blue') {
        this.textureID = 'rust';
        this.materialID = 'saphire';
    } else if (this.environment == 'polka dot') {
        this.textureID = 'polkadot';
        this.materialID = 'pearl';
    } else if (this.environment == 'wood') {
        this.textureID = 'wood';
        this.materialID = 'wood';
    } else {
        this.textureID == null;
    }
}
