/**
 * Triangle
 * @param scene CGFscene where the Triangle will be displayed
 * @param x1 x coordinate of the first triangle vertex
 * @param y1 y coordinate of the first triangle vertex
 * @param z1 z coordinate of the first triangle vertex
 * @param x2 x coordinate of the second triangle vertex
 * @param y2 y coordinate of the second triangle vertex
 * @param z3 z coordinate of the second triangle vertex
 * @param x3 x coordinate of the third triangle vertex
 * @param y3 y coordinate of the third triangle vertex
 * @param z3 z coordinate of the third triangle vertex
 * @constructor
 */
function Triangle(scene, x1, y1, z1, x2, y2, z2, x3, y3, z3) {
    CGFobject.call(this, scene);

    this.x1 = x1;
    this.x2 = x2;
    this.x3 = x3;

    this.y1 = y1;
    this.y2 = y2;
    this.y3 = y3;

    this.z1 = z1;
    this.z2 = z2;
    this.z3 = z3;

    this.v1 = vec3.fromValues(x1, y1, z1); // A
    this.v2 = vec3.fromValues(x2, y2, z2); // B
    this.v3 = vec3.fromValues(x3, y3, z3); // C

    this.initBuffers();
};

Triangle.prototype = Object.create(CGFobject.prototype);
Triangle.prototype.constructor = Triangle;

/**
 * Updates the Triangle texture factors
 * @param lengthS s domain length factor
 * @param lengthT t domain length factor
 */
Triangle.prototype.updateTextureCoords = function(lengthS, lengthT) {
    for (var i = 0; i < this.texCoords.length; i += 2) {
        this.texCoords[i] = this.originalTexCoords[i] / lengthS;
        this.texCoords[i + 1] = this.originalTexCoords[i + 1] / lengthT;
    }

    this.updateTexCoordsGLBuffers();
};

/**
 * Initializes the Triangle buffers (vertices, indices, normals and texCoords)
 */
Triangle.prototype.initBuffers = function() {
    this.vertices = [
        this.v1[0], this.v1[1], this.v1[2],
        this.v2[0], this.v2[1], this.v2[2],
        this.v3[0], this.v3[1], this.v3[2]
    ];

    this.indices = [0, 1, 2];

    var AB = vec3.create();
    vec3.sub(AB, this.v2, this.v1);
    var AC = vec3.create();
    vec3.sub(AC, this.v3, this.v1);
    var BC = vec3.create();
    vec3.sub(BC, this.v3, this.v2);

    var N = vec3.create();
    vec3.cross(N, AB, BC);
    vec3.normalize(N, N);
    this.normals = [
        N[0], N[1], N[2],
        N[0], N[1], N[2],
        N[0], N[1], N[2],
    ];

    var tC = (vec3.sqrLen(AB) + vec3.sqrLen(AC) - vec3.sqrLen(BC)) / (2 * vec3.length(AB));
    var sC = Math.sqrt(vec3.sqrLen(AC) - Math.pow(tC, 2));
    this.originalTexCoords = [
        0, 0,
        vec3.length(AB), 0,
        sC, tC
    ];

    this.texCoords = this.originalTexCoords.slice();

    this.primitiveType = this.scene.gl.TRIANGLES;
    this.initGLBuffers();
}
