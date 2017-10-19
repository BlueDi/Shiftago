/**
 * Patch
 * @param scene CGFscene where the Patch will be displayed
 * @param divisionsU divisions across U
 * @param divisionsV divisions across V
 * @param vertexes list of vertexes
 * @constructor
 */
function Patch(scene, uDivs, vDivs, vertexes) {
    CGFobject.call(this, scene);

    this.scene = scene;
    this.uDivs = uDivs;
    this.vDivs = vDivs;
    this.uDegree = vertexes.length - 1;
    this.vDegree = vertexes[0].length - 1;
    this.vertexes = vertexes;

    this.initBuffers();
};

Patch.prototype = Object.create(CGFnurbsObject.prototype);
Patch.prototype.constructor = Patch;

/**
 * Auxiliar function to calculate the number of knots
 */
Patch.prototype.getKnotsVector = function(degree) {
    var v = new Array();

    for (var i = 0; i <= degree; i++) {
        v.push(0);
    }

    for (var i = 0; i <= degree; i++) {
        v.push(1);
    }

    return v;
}

/**
 * Initializes the Patch
 */
Patch.prototype.initBuffers = function() {
    var knots1 = this.getKnotsVector(this.uDegree);
    var knots2 = this.getKnotsVector(this.vDegree);
    var nurbsSurface = new CGFnurbsSurface(this.uDegree, this.vDegree, knots1, knots2, this.vertexes);

    getSurfacePoint = function(u, v) {
        return nurbsSurface.getPoint(u, v);
    };

    this.object = new CGFnurbsObject(this.scene, getSurfacePoint, this.uDivs, this.vDivs);
}
