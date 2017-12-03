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

    this.initializeBoard();

    var NBALLS = Math.pow(dim, 2);
    this.balls = [];
    var aux = dim / 2;
    this.getPrologRequest('display', this.handleReply);
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

    request.onload = onSuccess || function(data) {
        this.handleReply(data.target.response, request.requestString);
    };
    request.onerror = onError || function() {
        console.log('Error waiting for response');
    };

    request.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8');
    request.send();
}

Shiftago.prototype.handleReply = function(data) {
    this.answer = data.target.response;
    console.log(this.answer);
    //this.updateBoard(data.target.response);
}

Shiftago.prototype.initializeBoard = function() {
    var materials = ['saphire', 'ruby', 'obsidian', 'emerald'];

    this.createPlayerPieces('P1', materials[0]);
    this.createPlayerPieces('P2', materials[1]);
    this.createPlayerPieces('P3', materials[2]);
    this.createPlayerPieces('P4', materials[3]);
}

Shiftago.prototype.createPlayerPieces = function(Player, Material) {
    var texture = 'null';
    var pos = 0;
    var vec1;
    var vec2;
    if (Player == 'P1') {
        vec1 = [-6.5, 1, pos];
        vec2 = [-5.5, 1, pos];
    } else if (Player == 'P2') {
        vec1 = [6.5, 1, pos];
        vec2 = [5.5, 1, pos];
    } else if (Player == 'P3') {
        vec1 = [pos, 1, 6.5];
        vec2 = [pos, 1, 5.5];
    } else if (Player == 'P4') {
        vec1 = [pos, 1, -6.5];
        vec2 = [pos, 1, -5.5];
    }

    for (var i = 0; i < 12; i++) {
        if (Player == 'P1' || Player == 'P2') {
            vec1[2] = i - 5.5;
        } else if (Player == 'P3' || Player == 'P4') {
            vec1[0] = i - 5.5;
        }
        var node = new MyGraphNode(this.graph, Player + i);
        node.textureID = texture;
        node.materialID = Material;
        mat4.translate(node.transformMatrix, node.transformMatrix, vec1);
        node.addLeaf(new MyLeaf(this.graph));
        this.addChild(node.nodeID);
        this.graph.nodes[node.nodeID] = node;
    }
    for (var i = 12; i < 22; i++) {
        if (Player == 'P1' || Player == 'P2') {
            vec2[2] = i - 12 - 4.5;
        } else if (Player == 'P3' || Player == 'P4') {
            vec2[0] = i - 12 - 4.5;
        }
        var node = new MyGraphNode(this.graph, Player + i);
        node.materialID = Material;
        node.textureID = texture;
        mat4.translate(node.transformMatrix, node.transformMatrix, vec2);
        node.addLeaf(new MyLeaf(this.graph));
        this.addChild(node.nodeID);
        this.graph.nodes[node.nodeID] = node;
    }
}
