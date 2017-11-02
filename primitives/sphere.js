/**
 * Sphere
 * @param scene CGFscene where the Rectangle will be displayed
 * @param radius Sphere radius
 * @param slices number of slices the sphere will be divided into along its perimeter
 * @param stacks number of stacks the sphere will be divided into along its height
 * @constructor
 */
function Sphere(scene, radius, slices, stacks) {
    CGFobject.call(this, scene);

    this.radius = radius;
    this.slices = slices;
    this.stacks = stacks;

    this.initBuffers();
};

Sphere.prototype = Object.create(CGFobject.prototype);
Sphere.prototype.constructor = Sphere;

/**
 * Initializes the Sphere buffers (vertices, indices, normals, and texCoords)
 */
Sphere.prototype.initBuffers = function() {
    this.indices = [];
    this.vertices = [];
    this.normals = [];
    this.originalTexCoords = [];

    for (var i = 0; i <= this.stacks; i++) {
        var verticalAngle = Math.PI / this.stacks * i;
        var cosVertical = Math.cos(verticalAngle);
        var sinVertical = Math.sin(verticalAngle);

        for (var j = 0; j <= this.slices; j++) {
            var horizontalAngle = Math.PI * 2 / this.slices * j;
            var cosH = Math.cos(horizontalAngle);
            var sinH = Math.sin(horizontalAngle);

            this.vertices.push(this.radius * sinVertical * cosH, this.radius * sinVertical * sinH, this.radius * cosVertical);
            this.normals.push(sinVertical * cosH, sinVertical * sinH, cosVertical);
            this.originalTexCoords.push(j / this.slices, i / this.stacks);
        }
    }

    for (var i = 0; i < this.stacks; i++) {
        for (var j = 0; j < this.slices; j++) {
            this.indices.push((i * (this.slices + 1)) + j, (i * (this.slices + 1)) + j + this.slices + 1, (i * (this.slices + 1)) + j + 1);
            this.indices.push((i * (this.slices + 1)) + j + this.slices + 1, (i * (this.slices + 1)) + j + this.slices + 2, (i * (this.slices + 1)) + j + 1);
        }
    }

    this.texCoords = this.originalTexCoords.slice();

    this.primitiveType = this.scene.gl.TRIANGLES;
    this.initGLBuffers();
}
