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
    for (var i = -aux; i < aux; i++) {
        for (var j = -aux; j < aux; j++) {
            //Criar um no na posiçao certa e com uma bola
            var node = new MyGraphNode(graph, "" + i + j);
            node.materialID = "null";
            node.textureID = "null";
            mat4.translate(node.transformMatrix, node.transformMatrix, [i, 1, j]);
            node.addLeaf(new MyLeaf(graph));
            this.addChild(node.nodeID);
            graph.nodes[node.nodeID] = node;
            console.log(node);
        }
    }
    console.log(graph.nodes);

    this.getPrologRequest("display", this.handleReply);
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
        console.log("Error waiting for response");
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

}
