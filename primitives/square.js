function Square(scene, xMin, yMin, xMax, yMax) {
    CGFobject.call(this, scene);

    this.xMin = xMin;
    this.xMax = xMax;
    this.yMin = yMin;
    this.yMax = yMax;

    this.initBuffers();
}

Square.prototype = Object.create(CGFobject.prototype);
Square.prototype.constructor = Square;

Square.prototype.initBuffers = function() {
    this.vertices = [
        this.minX, this.maxY, 0,
        this.maxX, this.maxY, 0,
        this.minX, this.minY, 0,
        this.maxX, this.minY, 0
    ];

    this.indices = [
        0, 1, 2,
        3, 2, 1
    ];

    this.primitiveType = this.scene.gl.TRIANGLES;
    this.initGLBuffers();
};
