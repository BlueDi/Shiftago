/**
 * Cylinder
 * @param scene CGFscene where the Cylinder will be displayed
 * @param height Cylinder height
 * @param base radius of the bottom base of the cylinder, placed on the (0, 0, 0) point
 * @param top radius of the top base of the cylinder
 * @param slices ammount of slices the Cylinder will be divided into along its perimeter
 * @param stacks ammount of stacks the Cylinder will be divided along its height
 * @param hasTop if the Cylinder has a base on top or not
 * @param hasBase if the Cylinder has a base on top or not
 * @constructor
 */
function Cylinder(scene, height, base, top, stacks, slices, hasTop, hasBase) {
    CGFobject.call(this, scene);

    this.base = base;
    this.top = top;
    this.height = height;
    this.stacks = stacks;
    this.slices = slices;
    this.hasTop = hasTop;
    this.hasBase = hasBase;

    this.initBuffers();
};

Cylinder.prototype = Object.create(CGFobject.prototype);
Cylinder.prototype.constructor = Cylinder;

/**
 * Initializes the Cylinder buffers (vertices, indices, normals and texCoords)
 */
Cylinder.prototype.initBuffers = function() {
    this.vertices = [];
    this.normals = [];
    this.indices = [];
    this.originalTexCoords = [];

    //vertices and normals
    var step = this.height / this.stacks;
    var deltaRadius = (this.top - this.base);
    var delta = 2 * Math.PI / this.slices;

    for (var i = 0; i <= this.stacks; i++) {
        var radPercent = i / this.stacks;
        var radius = radPercent * deltaRadius + this.base;

        for (var j = 0; j < this.slices; j++) {
            var angle = j * delta;
            this.vertices.push(radius * Math.cos(angle), radius * Math.sin(angle), i * step);
            this.normals.push(Math.cos(angle), Math.sin(angle), 0);
            this.originalTexCoords.push(j / this.slices, i / this.stacks);
        }
    }

    //indices
    var currentSlice = 1;
    for (var i = 0; i < this.slices * this.stacks; i++) {
        if (currentSlice == this.slices) {
            this.indices.push(i, i - this.slices + 1, i + this.slices);
            this.indices.push(i + this.slices, i - this.slices + 1, i + 1);
            currentSlice = 1;
        } else {
            this.indices.push(i, i + 1, i + this.slices);
            if (i != this.slices * this.stacks - 1)
                this.indices.push(i + this.slices, i + 1, i + 1 + this.slices);
            currentSlice++;
        }
    }

    //Base & Top
    this.vertices.push(0, 0, 0); //base center
    this.vertices.push(0, 0, this.height); //top center
    var baseCenter = (this.vertices.length / 3) - 2;
    var topCenter = (this.vertices.length / 3) - 1;
    for (var i = 0; i < this.slices; i++) {
        this.normals.push(0, 0, -1);
        this.normals.push(0, 0, 1);
    }

    currentSlice = 1;
    for (var j = 0; j < this.slices; j++) {
        if (currentSlice == this.slices) {
            if (this.hasBase)
                this.indices.push(baseCenter, 0, this.slices - 1);

            if (this.hasTop)
                this.indices.push(j + this.stacks * this.slices, j + this.stacks * this.slices - this.slices + 1, topCenter);
        } else {
            if (this.hasBase)
                this.indices.push(baseCenter, j + 1, j);

            if (this.hasTop)
                this.indices.push(j + this.stacks * this.slices, j + this.stacks * this.slices + 1, topCenter);
        }
        currentSlice++;
        this.originalTexCoords.push(10, 0);
    }

    this.texCoords = this.originalTexCoords.slice();

    this.primitiveType = this.scene.gl.TRIANGLES;
    this.initGLBuffers();
}
