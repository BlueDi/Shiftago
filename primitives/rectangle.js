/**
 * Rectangle
 * @param scene CGFscene where the Rectangle will be displayed
 * @param minX x coordinate of the left top vertex
 * @param maxY y coordinate of the left top vertex
 * @param maxX x coordinate of the right bottom vertex
 * @param minY y coordinate of the right bottom vertex
 * @constructor
 */
function Rectangle(scene, minX, maxY, maxX, minY) {
    CGFobject.call(this, scene);

    this.minX = minX;
    this.maxX = maxX;
    this.minY = minY;
    this.maxY = maxY;

    this.minS = 0;
    this.maxS = 1;
    this.minT = 0;
    this.maxT = 1;

    this.initBuffers();
};

Rectangle.prototype = Object.create(CGFobject.prototype);
Rectangle.prototype.constructor = Rectangle;

/**
 * Updates the Rectangle length factors
 * @param lengthS s domain length factor
 * @param lengthT t domain length factor
 */
Rectangle.prototype.updateTextureCoords = function(lengthS, lengthT) {
    for (var i = 0; i < this.texCoords.length; i += 2) {
        this.texCoords[i] = this.originalTexCoords[i] / lengthS;
        this.texCoords[i + 1] = this.originalTexCoords[i + 1] / lengthT;
    }

    this.updateTexCoordsGLBuffers();
};

/**
 * Initializes the Rectangle buffers (vertices, indices, normals and texCoords)
 */
Rectangle.prototype.initBuffers = function() {
    this.vertices = [
        this.minX, this.maxY, 0, //0
        this.minX, this.minY, 0, //1
        this.maxX, this.minY, 0, //2
        this.maxX, this.maxY, 0 //3
    ];

    this.indices = [
        0, 1, 2,
        2, 3, 0
    ];

    this.normals = [
        0, 0, 1,
        0, 0, 1,
        0, 0, 1,
        0, 0, 1
    ];

    this.largura = this.maxX - this.minX;
    this.altura = this.maxY - this.minY;

    this.originalTexCoords = [
        this.minS, this.altura * this.maxT,
        this.minS, this.minT,
        this.largura * this.maxS, this.minT,
        this.largura * this.maxS, this.altura * this.maxT
    ];

    this.texCoords = this.originalTexCoords.slice();

    this.primitiveType = this.scene.gl.TRIANGLES;
    this.initGLBuffers();
}
