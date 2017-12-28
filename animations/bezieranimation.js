/**
    Cubic Bezier Animation
*/
class BezierAnimation extends Animation {
    constructor(speed, controlPoints) {
        super(speed);

        this.controlPoints = controlPoints;

        var p2p1 = vec3.distance(this.controlPoints[0], this.controlPoints[1]);
        var p3p2 = vec3.distance(this.controlPoints[1], this.controlPoints[2]);
        var p4p3 = vec3.distance(this.controlPoints[2], this.controlPoints[3]);
        var distance = p2p1 + p3p2 + p4p3;

        this.timeNeeded = this.SCALE * distance / Math.pow(this.velocity, 2);

        this.lastRot;

        this.state = 'initial';
    }

    /**
        Cubic Bezier curve calculation
        B(t) = (1-t)^3 B0 + 3t(1-t)^2 B1 + 3t^2 (1-t) B2 + t^3 B3
    */
    bezier(t) {
        var B = vec3.create();
        var B0 = vec3.create();
        var B1 = vec3.create();
        var B2 = vec3.create();
        var B3 = vec3.create();

        var n0 = Math.pow(1 - t, 3);
        var n1 = 3 * t * Math.pow(1 - t, 2);
        var n2 = 3 * Math.pow(t, 2) * (1 - t);
        var n3 = Math.pow(t, 3);

        vec3.scale(B0, this.controlPoints[0], n0);
        vec3.scale(B1, this.controlPoints[1], n1);
        vec3.scale(B2, this.controlPoints[2], n2);
        vec3.scale(B3, this.controlPoints[3], n3);
        vec3.add(B, B0, B1);
        vec3.add(B, B, B2);
        vec3.add(B, B, B3);

        return B;
    }

    /**
        Cubic Bezier curve derivative calculation
        dB(t) =  -3(1 - t)^2 B0 + (3(1 - t)^2 - 6t(1 - t)) B1 + (-3t^2 + 6t(1 - t))B2 + 3t^2 B3
    */
    bezierDerivative(t) {
        var dB = vec3.create();
        var dB0 = vec3.create();
        var dB1 = vec3.create();
        var dB2 = vec3.create();
        var dB3 = vec3.create();

        var n0 = -3 * Math.pow(1 - t, 2);
        var n1 = 3 * Math.pow(1 - t, 2) - 6 * t * (1 - t);
        var n2 = -3 * Math.pow(t, 2) + 6 * t * (1 - t);
        var n3 = 3 * Math.pow(t, 2);

        vec3.scale(dB0, this.controlPoints[0], n0);
        vec3.scale(dB1, this.controlPoints[1], n1);
        vec3.scale(dB2, this.controlPoints[2], n2);
        vec3.scale(dB3, this.controlPoints[3], n3);
        vec3.add(dB, dB0, dB1);
        vec3.add(dB, dB, dB2);
        vec3.add(dB, dB, dB3);

        return dB;
    }

    /**
        Atualizar o estado da animacao
    */
    update(currTime) {
        if (this.stop == false && this.state != 'end') {
            if (this.state == 'initial') {
                this.initialTime = currTime;
                this.state = 'updating';
            }

            var deltat = currTime - this.initialTime;
            var t = deltat / this.timeNeeded;

            if (t >= 1) {
                this.state = 'end';
                t = 1;
                this.animTranslateMatrix = mat4.create();
                mat4.translate(this.animTranslateMatrix, this.animTranslateMatrix, this.bezier(t));
            }

            var B = this.bezier(t);
            var dB = this.bezierDerivative(t);

            var alpha = Math.atan(dB[0] / dB[2]);
            if (alpha > 0) {
                alpha -= Math.PI / 2;
            } else if (alpha < 0) {
                alpha += Math.PI / 2;
            }
            if (dB[0] < 0 && dB[2] < 0) {
                alpha += Math.PI;
            } else if (dB[0] < 0 && dB[2] > 0) {
                alpha += Math.PI;
            }
            this.rotateY(alpha);

            this.animTranslateMatrix = mat4.create();
            mat4.translate(this.animTranslateMatrix, this.animTranslateMatrix, B);
        }
    }
};
