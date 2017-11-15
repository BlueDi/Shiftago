class CircularAnimation extends Animation {
    constructor(speed, controlPoints) {
        super(speed);

        this.controlPoints = controlPoints;
        this.actualControlPoint = 0;
        this.currentPosition = vec3.clone(this.controlPoints[0]);
        if (this.controlPoints.length > 1) {
            this.currentCP = vec3.clone(this.controlPoints[1]);
        }
        this.rotAng = 0;
        this.oldPosition = this.currentPosition;
        console.log(this.controlPoints);
    }

    rotate(currTime) {
        var deltat = currTime - this.initialTime;
        var actualVelocity = this.velocity / deltat;

        var tempCP = this.actualControlPoint + 1;
        if (tempCP < this.controlPoints.length) {
            if (this.rotAng == 0) {
                this.currentCP = vec3.clone(this.controlPoints[tempCP]);
                this.rotAng = this.angle(this.currentPosition, this.currentCP);
                this.currentAng = this.rotAng;

                if (this.rotAng > 0.01 || this.rotAng < -0.01) {
                    this.needsToRotate = true;
                } else {
                    this.actualControlPoint++;
                    this.needsToRotate = false;
                    this.rotAng = 0;
                    this.currentAng = 0;
                }
            } else {
                if (this.currentAng > 0.01 || this.currentAng < -0.01) {
                    this.currentAng -= this.rotAng * actualVelocity;
                } else {
                    this.rotAng = 0;
                    this.currentAng = 0;
                    this.needsToRotate = false;
                }

                var coiso = mat4.create();
                mat4.translate(coiso, coiso, this.currentAng);
                this.fromYRotation(this.animationMatrix, coiso);
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
        }
        var angle = Math.acos(cosine);
        if (b[0] - a[0] < 0)
            angle = -angle;
        return angle;
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
        var deltat = currTime - this.initialTime;
        var actualVelocity = this.velocity / deltat;
        var speed = vec3.fromValues(actualVelocity, actualVelocity, actualVelocity);

        vec3.subtract(increment, this.currentCP, this.oldPosition);
        vec3.multiply(increment, increment, speed);
        vec3.add(this.currentPosition, this.currentPosition, increment);
        console.log(this.currentPosition);
        console.log(this.oldPosition);
        mat4.translate(this.animationMatrix, this.animationMatrix, increment);

        this.needsToRotate = this.equals(this.currentPosition, this.currentCP);
        if (this.needsToRotate) {
            this.oldPosition = this.currentPosition;
        }
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
            this.initialTime = currTime - 1;

        if (this.actualControlPoint < this.controlPoints.length - 1) {
            if (this.needsToRotate) {
                this.rotate(currTime);
            } else {
                this.translate(currTime);
            }
        }

        this.initialTime = currTime;
    }
};
