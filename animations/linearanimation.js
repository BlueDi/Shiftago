class LinearAnimation extends Animation {
    constructor(speed, controlPoints) {
        super(speed);

        this.controlPoints = controlPoints;
        this.actualControlPoint = 0;
        this.currentPosition = vec3.clone(this.controlPoints[0]);
        this.needsToRotate = true;
        this.needs = true;
        this.needs2 = true;

        this.oldPosition = this.currentPosition;
    }

    rotate(currTime) {
        var deltat = currTime - this.initialTime;
        var actualVelocity = this.velocity / deltat;
        var up = vec3.fromValues(0, 1, 0);

        var tempCP = this.actualControlPoint + 1;
        if (tempCP < this.controlPoints.length) {
            if (this.needs) {
                this.tempCP = vec3.clone(this.controlPoints[tempCP]);
                this.tempCP[1] = 0;
                this.rotation = vec3.create();
                this.rotationFinal = mat4.create();
                this.rotateTo(this.rotationFinal, this.currentPosition, this.tempCP, up);
                vec3.subtract(this.rotation, this.tempCP, this.currentPosition);
                var speed = vec3.fromValues(actualVelocity, actualVelocity, actualVelocity);
                vec3.multiply(this.rotation, this.rotation, speed);
                this.needs = false;
            } else {
                vec3.add(this.rotation, this.currentPosition, this.rotation);
                this.rotateTo(this.animationMatrix, this.currentPosition, this.rotation, up);

                if (this.equalsMat4(this.animationMatrix, this.rotationFinal)) {
                    this.needs = true;
                    this.needsToRotate = false;
                    this.actualControlPoint++;
                    this.currentCP = vec3.clone(this.controlPoints[this.actualControlPoint]);
                }
            }
        } else {
            this.actualControlPoint++;
        }
    }

    /**
     * Returns whether or not the matrices have approximately the same elements in the same position.
     *
     * @param {mat4} a The first matrix.
     * @param {mat4} b The second matrix.
     * @returns {Boolean} True if the matrices are equal, false otherwise.
     */
    equalsMat4(a, b) {
        let a0 = a[0],
            a1 = a[1],
            a2 = a[2],
            a3 = a[3];
        let a4 = a[4],
            a5 = a[5],
            a6 = a[6],
            a7 = a[7];
        let a8 = a[8],
            a9 = a[9],
            a10 = a[10],
            a11 = a[11];
        let a12 = a[12],
            a13 = a[13],
            a14 = a[14],
            a15 = a[15];
        let b0 = b[0],
            b1 = b[1],
            b2 = b[2],
            b3 = b[3];
        let b4 = b[4],
            b5 = b[5],
            b6 = b[6],
            b7 = b[7];
        let b8 = b[8],
            b9 = b[9],
            b10 = b[10],
            b11 = b[11];
        let b12 = b[12],
            b13 = b[13],
            b14 = b[14],
            b15 = b[15];
        return (Math.abs(a0 - b0) <= 0.01 * Math.max(1.0, Math.abs(a0), Math.abs(b0)) &&
            Math.abs(a1 - b1) <= 0.01 * Math.max(1.0, Math.abs(a1), Math.abs(b1)) &&
            Math.abs(a2 - b2) <= 0.01 * Math.max(1.0, Math.abs(a2), Math.abs(b2)) &&
            Math.abs(a3 - b3) <= 0.01 * Math.max(1.0, Math.abs(a3), Math.abs(b3)) &&
            Math.abs(a4 - b4) <= 0.01 * Math.max(1.0, Math.abs(a4), Math.abs(b4)) &&
            Math.abs(a5 - b5) <= 0.01 * Math.max(1.0, Math.abs(a5), Math.abs(b5)) &&
            Math.abs(a6 - b6) <= 0.01 * Math.max(1.0, Math.abs(a6), Math.abs(b6)) &&
            Math.abs(a7 - b7) <= 0.01 * Math.max(1.0, Math.abs(a7), Math.abs(b7)) &&
            Math.abs(a8 - b8) <= 0.01 * Math.max(1.0, Math.abs(a8), Math.abs(b8)) &&
            Math.abs(a9 - b9) <= 0.01 * Math.max(1.0, Math.abs(a9), Math.abs(b9)) &&
            Math.abs(a10 - b10) <= 0.01 * Math.max(1.0, Math.abs(a10), Math.abs(b10)) &&
            Math.abs(a11 - b11) <= 0.01 * Math.max(1.0, Math.abs(a11), Math.abs(b11)) &&
            Math.abs(a12 - b12) <= 0.01 * Math.max(1.0, Math.abs(a12), Math.abs(b12)) &&
            Math.abs(a13 - b13) <= 0.01 * Math.max(1.0, Math.abs(a13), Math.abs(b13)) &&
            Math.abs(a14 - b14) <= 0.01 * Math.max(1.0, Math.abs(a14), Math.abs(b14)) &&
            Math.abs(a15 - b15) <= 0.01 * Math.max(1.0, Math.abs(a15), Math.abs(b15)));
    }

    /**
     * Generates a matrix that rotates something to look in a direction.
     *
     * @param {mat4} out mat4 frustum matrix will be written into
     * @param {vec3} eye Position of the viewer
     * @param {vec3} center Point the viewer is looking at
     * @param {vec3} up vec3 pointing up
     * @returns {mat4} out
     */
    rotateTo(out, eye, center, up) {
        let x0, x1, x2, y0, y1, y2, z0, z1, z2, len;
        let eyex = eye[0];
        let eyey = eye[1];
        let eyez = eye[2];
        let upx = up[0];
        let upy = up[1];
        let upz = up[2];
        let centerx = center[0];
        let centery = 0; //center[1];
        let centerz = center[2];
        if (Math.abs(eyex - centerx) < 0.01 &&
            Math.abs(eyey - centery) < 0.01 &&
            Math.abs(eyez - centerz) < 0.01) {
            return mat4.identity(out);
        }
        z0 = eyex - centerx;
        z1 = eyey - centery;
        z2 = eyez - centerz;
        len = 1 / Math.sqrt(z0 * z0 + z1 * z1 + z2 * z2);
        z0 *= len;
        z1 *= len;
        z2 *= len;
        x0 = upy * z2 - upz * z1;
        x1 = upz * z0 - upx * z2;
        x2 = upx * z1 - upy * z0;
        len = Math.sqrt(x0 * x0 + x1 * x1 + x2 * x2);
        if (!len) {
            x0 = 0;
            x1 = 0;
            x2 = 0;
        } else {
            len = 1 / len;
            x0 *= len;
            x1 *= len;
            x2 *= len;
        }
        y0 = z1 * x2 - z2 * x1;
        y1 = z2 * x0 - z0 * x2;
        y2 = z0 * x1 - z1 * x0;
        len = Math.sqrt(y0 * y0 + y1 * y1 + y2 * y2);
        if (!len) {
            y0 = 0;
            y1 = 0;
            y2 = 0;
        } else {
            len = 1 / len;
            y0 *= len;
            y1 *= len;
            y2 *= len;
        }
        out[0] = x0;
        out[1] = y0;
        out[2] = z0;
        out[3] = 0;
        out[4] = x1;
        out[5] = y1;
        out[6] = z1;
        out[7] = 0;
        out[8] = x2;
        out[9] = y2;
        out[10] = z2;
        out[11] = 0;
        out[12] = -(x0 * eyex + x1 * eyey + x2 * eyez);
        out[13] = -(y0 * eyex + y1 * eyey + y2 * eyez);
        out[14] = -(z0 * eyex + z1 * eyey + z2 * eyez);
        out[15] = 1;
        return out;
    };

    translate(currTime) {
        var deltat = currTime - this.initialTime;
        var actualVelocity = this.velocity / deltat;
        var speed = vec3.fromValues(actualVelocity, actualVelocity, actualVelocity);

        if (this.needs2) {
            this.baseIncrement = vec3.create();
            vec3.subtract(this.baseIncrement, this.currentCP, this.oldPosition);
            this.needs2 = false;
        } else {
            this.increment = vec3.create();
            vec3.multiply(this.increment, this.baseIncrement, speed);
            vec3.add(this.currentPosition, this.currentPosition, this.increment);
            mat4.translate(this.animationMatrix, this.animationMatrix, this.increment);

            this.needsToRotate = this.equals(this.currentPosition, this.currentCP);
            if (this.needsToRotate) {
                this.oldPosition = this.currentPosition;
                this.needs2 = true;
            }
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

        if (this.actualControlPoint < this.controlPoints.length) {
            if (this.needsToRotate) {
                this.rotate(currTime);
            } else {
                this.translate(currTime);
            }
        }

        this.initialTime = currTime;
    }
};
