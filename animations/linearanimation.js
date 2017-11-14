class LinearAnimation extends Animation {
    constructor(speed, controlPoints) {
        super(speed);

        this.controlPoints = controlPoints;
        this.actualControlPoint = 0;
        this.currentPosition = vec3.clone(this.controlPoints[this.actualControlPoint]);
        this.currentCP = vec3.clone(this.controlPoints[this.actualControlPoint]);
        this.rotAng = 0;

        var initialDirection = vec3.fromValues(1, 0, 0);
        var angleBetweenPoints = this.angle(initialDirection, this.currentCP);
        this.fromYRotation(this.animationMatrix, angleBetweenPoints);
    }

    rotate(currTime) {
        var deltat = (currTime - this.initialTime) / 60;
        var actualVelocity = deltat * this.velocity;

        var tempCP = this.actualControlPoint + 1;
        if (tempCP < this.controlPoints.length) {
            if (this.rotAng > -0.05 && this.rotAng < 0.05) {
                this.currentCP = vec3.clone(this.controlPoints[tempCP]);
                var vec = vec3.fromValues(0, 1, 0);
                this.rotAng = this.angle(this.currentPosition, this.currentCP);

                if (this.rotAng > 0.05 || this.rotAng < -0.05) {
                    this.needsToRotate = true;
                } else {
                    this.actualControlPoint++;
                    this.needsToRotate = false;
                }

                console.log(this.rotAng);
                console.log(this.needsToRotate);

                if (this.needsToRotate) {
                    var vec = vec3.fromValues(0, 1, 0);
                    mat4.rotate(this.animationMatrix, this.animationMatrix, this.rotAng * actualVelocity, vec);
                } else {
                    this.actualControlPoint = tempCP;
                }
            } else {
                console.log('-----------------');
                console.log(this.rotAng);
                if (this.rotAng > 0) {
                    this.rotAng -= actualVelocity;
                } else {
                    this.rotAng += actualVelocity;
                }
                console.log(this.rotAng);

                var vec = vec3.fromValues(0, 1, 0);
                mat4.rotate(this.animationMatrix, this.animationMatrix, this.rotAng * actualVelocity, vec);

                if (this.rotAng > -0.05 && this.rotAng < 0.05) {
                    this.needsToRotate = false;
                }
            }
        } else {
            this.actualControlPoint++;
        }
    }

    angle(a, b) {
        let tempA = vec3.fromValues(a[0], a[1], a[2]);
        let tempB = vec3.fromValues(b[0], b[1], b[2]);
        vec3.normalize(tempA, tempA);
        vec3.normalize(tempB, tempB);
        let cosine = vec3.dot(tempA, tempB);
        if (cosine > 1.0) {
            return 0;
        } else if (cosine < -1.0) {
            return Math.PI;
        } else {
            return Math.acos(cosine);
        }
    }

    fromYRotation(out, rad) {
        let s = Math.sin(rad);
        let c = Math.cos(rad);
        // Perform axis-specific matrix multiplication
        out[0] = c;
        out[1] = 0;
        out[2] = -s;
        out[3] = 0;
        out[4] = 0;
        out[5] = 1;
        out[6] = 0;
        out[7] = 0;
        out[8] = s;
        out[9] = 0;
        out[10] = c;
        out[11] = 0;
        out[12] = 0;
        out[13] = 0;
        out[14] = 0;
        out[15] = 1;
    }

    translate(currTime) {
        var increment = vec3.create();
        var deltat = (currTime - this.initialTime) / 1000;
        var actualVelocity = deltat * this.velocity;

        var speed = vec3.fromValues(actualVelocity, actualVelocity, actualVelocity);
        vec3.subtract(increment, this.currentCP, this.currentPosition);
        vec3.multiply(increment, increment, speed);
        vec3.add(this.currentPosition, this.currentPosition, increment);
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
        if (this.initialTime == 0)
            this.initialTime = currTime;

        if (this.actualControlPoint < this.controlPoints.length) {
            if (this.needsToRotate) {
                console.log('.......... ROTATE ............');
                console.log('rotate');
                this.rotate(currTime);
            } else {
                console.log('......... TRANSLATE ..........');
                console.log('translate');
                this.translate(currTime);
                this.needsToRotate = this.equals(this.currentPosition, this.currentCP);
            }
        }

        this.initialTime = currTime;
    }

    //var angleBetweenPoints = vec3.angle(this.controlPoints[this.actualControlPoint--], this.controlPoints[this.actualControlPoint]);

    //mat4.rotateY(this.animationMatrix, this.animationMatrix, DEGREE_TO_RAD * 3);
    //mat4.translate(this.animationMatrix, this.animationMatrix, this.controlPoints[this.actualControlPoint] / this.velocity);
};
