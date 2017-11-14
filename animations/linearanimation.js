class LinearAnimation extends Animation {
    constructor(speed, controlPoints) {
        super(speed);

        this.controlPoints = controlPoints;
        this.actualControlPoint = 0;
        this.currentAngle = vec3.fromValues(1, 0, 0);
        this.currentPosition = vec3.clone(this.controlPoints[this.actualControlPoint]);
        this.currentCP = vec3.clone(this.controlPoints[this.actualControlPoint]);
        this.previousCP = vec3.fromValues(0, 0, 0);
        this.state = 1;

        /*
            mat4.translate(this.nodes[nodeID].transformMatrix, this.nodes[nodeID].transformMatrix, [x, y, z]);
            mat4.rotate(this.nodes[nodeID].transformMatrix, this.nodes[nodeID].transformMatrix, angle * DEGREE_TO_RAD, this.axisCoords[axis]);
            mat4.scale(this.nodes[nodeID].transformMatrix, this.nodes[nodeID].transformMatrix, [sx, sy, sz]);
        */
    }

    rotate(currTime) {
        this.currentPosition = vec3.clone(this.controlPoints[this.actualControlPoint]);
        this.initialTime = currTime;
        if (this.actualControlPoint != 0) {
            this.previousCP = vec3.clone(this.controlPoints[this.actualControlPoint--]);
        }

        var dx = this.currentAngle[0] - this.previousCP[0];
        var dy = this.currentAngle[1] - this.previousCP[1];
        var dz = this.currentAngle[2] - this.previousCP[2];
        var dist = Math.sqrt(Math.pow(dx, 2) + Math.pow(dz, 2));

        this.rotAng = Math.acos(dz / dist);
        if (dx < 0) {
            this.rotAng = -this.rotAng;
        }

        var axisvec = vec3.fromValues(0, 1, 0);

        mat4.rotate(this.animationMatrix, this.animationMatrix, this.rotAng, axisvec);
    }

    translate() {
        var nextCP = vec3.clone(this.controlPoints[this.actualControlPoint]);
        var increment = vec3.create();
        var speed = vec3.fromValues(this.velocity, this.velocity, this.velocity);
        vec3.subtract(increment, nextCP, this.currentPosition);
        vec3.multiply(increment, increment, speed);
        console.log(this.currentPosition);
        vec3.add(this.currentPosition, this.currentPosition, increment);
        console.log(increment);
        console.log(this.currentPosition);
        mat4.translate(this.animationMatrix, this.animationMatrix, increment);
    }

    equals(a, b) {
        let a0 = a[0],
            a1 = a[1],
            a2 = a[2];
        let b0 = b[0],
            b1 = b[1],
            b2 = b[2];
        return (Math.abs(a0 - b0) <= 0.01 * Math.max(1.0, Math.abs(a0), Math.abs(b0)) &&
            Math.abs(a1 - b1) <= 0.01 * Math.max(1.0, Math.abs(a1), Math.abs(b1)) &&
            Math.abs(a2 - b2) <= 0.01 * Math.max(1.0, Math.abs(a2), Math.abs(b2)));
    }

    /**
        Atualizar o estado da animacao
    */
    update(currTime) {
        if (this.actualControlPoint < this.controlPoints.length && this.equals(this.currentPosition, this.currentCP)) {
            console.log('...........................................');
            console.log('rotate');
            this.rotate(currTime);
            this.actualControlPoint += 1;
            this.currentCP = vec3.clone(this.controlPoints[this.actualControlPoint]);
        } else if (this.actualControlPoint < this.controlPoints.length && !this.equals(this.currentPosition, this.currentCP)) {
            console.log('...........................................');
            console.log('translate');
            this.translate();
        }
    }

    //var angleBetweenPoints = vec3.angle(this.controlPoints[this.actualControlPoint--], this.controlPoints[this.actualControlPoint]);

    //mat4.rotateY(this.animationMatrix, this.animationMatrix, DEGREE_TO_RAD * 3);
    //mat4.translate(this.animationMatrix, this.animationMatrix, this.controlPoints[this.actualControlPoint] / this.velocity);
};
