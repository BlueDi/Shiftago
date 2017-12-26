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

    this.transformMatrix = mat4.create();
    mat4.identity(this.transformMatrix);

    this.time = 0;

    this.materials = {
        p1: 'saphire',
        p2: 'ruby',
        p3: 'obsidian',
        p4: 'emerald'
    };
    this.response;
    this.board;
    this.gameMode = this.graph.gameMode;
    this.numberOfPlayers = this.graph.numberOfPlayers;
    this.difficulty = this.graph.difficulty;
    this.player = 'p1';
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

function MyLeaf(graph) {
    this.object = new Sphere(graph.scene, 0.5, 20, 20);
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
    } else if (requestString == 'display' || requestString.substring(0, 5) == 'cturn' || requestString.substring(0, 5) == 'hturn') {
        this.board = response;
        this.updateBoard();
    } else if (requestString.substring(0, 13) == 'switch_player') {
        this.player = response;
    } else if (requestString == 'nomoves') {
        this.nomoves = response;
    }
    this.response = response;
}

Shiftago.prototype.initializeBoard = function() {
    this.getPrologRequest('display');

    this.createPlayerPieces('p1', this.materials['p1']);
    this.createPlayerPieces('p2', this.materials['p2']);
    this.createPlayerPieces('p3', this.materials['p3']);
    this.createPlayerPieces('p4', this.materials['p4']);
}

Shiftago.prototype.createPlayerPieces = function(Player, Material) {
    var texture = 'null';
    var pos = 0;
    var vec1;
    var vec2;
    var vec3;
    var vec4;
    if (Player == 'p1') {
        vec2 = [-5.5, 1, pos];
        vec1 = [-6.5, 1, pos];
        vec3 = [-7.5, 1, pos];
        vec4 = [-8.5, 1, pos];
    } else if (Player == 'p2') {
        vec2 = [5.5, 1, pos];
        vec1 = [6.5, 1, pos];
        vec3 = [7.5, 1, pos];
        vec4 = [8.5, 1, pos];
    } else if (Player == 'p3') {
        vec2 = [pos, 1, 5.5];
        vec1 = [pos, 1, 6.5];
        vec3 = [pos, 1, 7.5];
        vec4 = [pos, 1, 8.5];
    } else if (Player == 'p4') {
        vec2 = [pos, 1, -5.5];
        vec1 = [pos, 1, -6.5];
        vec3 = [pos, 1, -7.5];
        vec4 = [pos, 1, -8.5];
    }

    for (var i = 0; i < 12; i++) {
        if (Player == 'p1' || Player == 'p2') {
            vec1[2] = i - 5.5;
        } else if (Player == 'p3' || Player == 'p4') {
            vec1[0] = i - 5.5;
        }
        this.addBall(Player + i, Material, texture, vec1);
    }
    for (var i = 12; i < 22; i++) {
        if (Player == 'p1' || Player == 'p2') {
            vec2[2] = i - 12 - 4.5;
        } else if (Player == 'p3' || Player == 'p4') {
            vec2[0] = i - 12 - 4.5;
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
    node.addLeaf(new MyLeaf(this.graph));
    this.addChild(node.nodeID);
    this.graph.nodes[node.nodeID] = node;
}

Shiftago.prototype.update = function(currTime, environment, side, position) {
    this.numberOfPlayers = this.graph.numberOfPlayers;
    this.difficulty = this.graph.difficulty;
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

    this.updateEnvironment(environment);
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
                        mat4.translate(node.transformMatrix, matI, [i - 3, 1, -j + 3]);
                    } else {
                        mat4.translate(node.transformMatrix, matI, [i - 3, 20, -j + 3]);
                    }
                }
            }
        }
    }
}

Shiftago.prototype.updateEnvironment = function(environment) {
    if (environment == 'simple') {
        this.textureID = 'null';
        this.materialID = 'null';
    } else if (environment == 'furr') {
        this.textureID = 'fluffy';
        this.materialID = 'obsidian';
    } else if (environment == 'blue') {
        this.textureID = 'rust';
        this.materialID = 'saphire';
    } else if (environment == 'polka dot') {
        this.textureID = 'polkadot';
        this.materialID = 'pearl';
    } else {
        this.textureID == null;
    }
}
