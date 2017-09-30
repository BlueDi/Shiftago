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
    /**
     * Calculo de coordenadas de mapeamento de texturas em triângulos - Alexandre Valle de Carvalho
     */

    var c = Math.sqrt(Math.pow(this.x2 - this.x1, 2) + Math.pow(this.y2 - this.y1, 2) + Math.pow(this.z2 - this.z1, 2));
    var a = Math.sqrt(Math.pow(this.x3 - this.x2, 2) + Math.pow(this.y3 - this.y2, 2) + Math.pow(this.z3 - this.z2, 2));
    var b = Math.sqrt(Math.pow(this.x1 - this.x3, 2) + Math.pow(this.y1 - this.y3, 2) + Math.pow(this.z1 - this.z3, 2));
    var cosBeta = (Math.pow(a, 2) - Math.pow(b, 2) + Math.pow(c, 2)) / (2 * a * c);
    var sinBeta = Math.sqrt(1 - Math.pow(cosBeta, 2));

    this.texCoords = [
        0, 0,
        1, 0,
        (c - a * cosBeta) / lengthS, a * sinBeta / lengthT
    ];

    this.updateTexCoordsGLBuffers();
};

/**
 * Initializes the Triangle buffers (vertices, indices, normals and textureCoords)
 */
Triangle.prototype.initBuffers = function() {
    this.vertices = [
        this.x1, this.y1, this.z1,
        this.x2, this.y2, this.z2,
        this.x3, this.y3, this.z3
    ];

    this.indices = [0, 1, 2];

    var vector1 = [
        this.x1 - this.x2,
        this.y1 - this.y2,
        this.z1 - this.z2
    ];

    var vector2 = [
        this.x1 - this.x3,
        this.y1 - this.y3,
        this.z1 - this.z3
    ];
    //Creates a new instance of a vec3
    var normal = vec3.create();
    //Generates the cross product of two vec3s
    vec3.cross(normal, vector1, vector2);

    this.normals = [
        normal[0], normal[1], normal[2],
        normal[0], normal[1], normal[2],
        normal[0], normal[1], normal[2]
    ];

    //factors lengthS = 1, lengthT = 1
    this.updateTextureCoords(1, 1);

    this.primitiveType = this.scene.gl.TRIANGLES;
    this.initGLBuffers();
}
