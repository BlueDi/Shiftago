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
    this.animationSpeed = 10;

    this.transformMatrix = mat4.create();
    mat4.identity(this.transformMatrix);

    this.time = 0;

    this.gameMode = [];
    this.numberOfPlayers = [];
    this.difficulty = [];
    this.environment = [];

    this.materials = {
        p1: 'saphire',
        p2: 'ruby',
        p3: 'obsidian',
        p4: 'emerald'
    };
    this.response;
    this.board;
    this.player = 'p1';
    this.playerCounter = [-1, -1, -1, -1];
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
        var n;
        if (player == 'p1') {
            this.playerCounter[0]++;
            n = this.playerCounter[0];
        } else if (player == 'p2') {
            this.playerCounter[1]++;
            n = this.playerCounter[1];
        } else if (player == 'p3') {
            this.playerCounter[2]++;
            n = this.playerCounter[2];
        } else if (player == 'p4') {
            this.playerCounter[3]++;
            n = this.playerCounter[3];
        }
        var nodeID = player + n;
        var node = this.graph.nodes[nodeID];
        var x = n;
        if (n >= 10 && n < 22) {
            x -= 12;
        } else if (n >= 22 && n < 36) {
            x -= 26;
        } else if (n >= 36) {
            x -= 42;
        }
        var vec = [0, 0, 0];

        if (player == 'p1' || player == 'p2') {
            if (side == 'top') {
                vec = [-3 - node.vec[0], 0, -position - x + 13 - node.vec[2]];
            } else if (side == 'bottom') {
                vec = [3 - node.vec[0], 0, -position - x + 13 - node.vec[2]];
            } else if (side == 'left') {
                vec = [position - 4 - node.vec[0], 0, -x + 12 - node.vec[2]];
            } else if (side == 'right') {
                vec = [position - 4 - node.vec[0], 0, -x + 6 - node.vec[2]];
            }
        } else if (player == 'p3' || player == 'p4') {
            if (side == 'top') {
                vec = [-x + 6 - node.vec[0], 0, -position + 4 - node.vec[2]];
            } else if (side == 'bottom') {
                vec = [-x + 12 - node.vec[0], 0, -position + 4 - node.vec[2]];
            } else if (side == 'left') {
                vec = [position - x + 5 - node.vec[0], 0, 3 - node.vec[2]];
            } else if (side == 'right') {
                vec = [position - x + 5 - node.vec[0], 0, -3 - node.vec[2]];
            }
        }
        console.log(nodeID, node.vec, vec);
        this.graph.animations[nodeID] = new LinearAnimation(this.animationSpeed, [
            [0, 0, 0],
            vec
        ]);
        this.graph.nodes[nodeID].animationID.push(nodeID);
        this.graph.nodes[nodeID].actualAnimation = 0;
        this.graph.animations[this.graph.nodes[nodeID].animationID[0]].stop = false;

        this.getPrologRequest('place-' + this.player + '-' + side + '-' + position);
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
    node.addLeaf(new MyLeaf(this.graph));
    this.addChild(node.nodeID);
    this.graph.nodes[node.nodeID] = node;
}

Shiftago.prototype.update = function(currTime, side, position) {
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
    } else {
        this.textureID == null;
    }
}
