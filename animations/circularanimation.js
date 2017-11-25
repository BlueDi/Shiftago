class CircularAnimation extends Animation {
    constructor(speed, center, radius, startang, rotang) {
        super(speed);

        var DEGREE_TO_RAD = Math.PI / 180;

        this.center = center;
        this.radius = radius;
        this.startang = startang * DEGREE_TO_RAD;
        this.rotang = rotang * DEGREE_TO_RAD;
        this.reparts = 60 * 10000 / Math.pow(this.velocity, 2);
        this.incang = this.rotang / this.reparts;

        this.currPartition = 0;
        this.currRotAng = this.startang + Math.PI;

        this.curr = vec3.fromValues(0, 0, 0);

        this.state = 'initial';
    }

    rotate() {
        var axisvec = vec3.fromValues(0, 1, 0);
        this.animRotationMatrix = mat4.create();
        this.animRotationMatrix = mat4.rotate(this.animRotationMatrix, this.animRotationMatrix, this.currRotAng, axisvec);
    }

    translate() {
        this.curr[0] = this.radius * Math.sin(this.currRotAng);
        this.curr[2] = this.radius * Math.cos(this.currRotAng);

        var transform = vec3.create();
        vec3.add(transform, this.curr, this.center);
        this.animTranslateMatrix = mat4.create();
        mat4.translate(this.animTranslateMatrix, this.animTranslateMatrix, transform);
    }

    update(currTime) {
        if (this.stop == false) {
            if (this.state == 'initial') {
                this.initialTime = currTime;
                this.state = 'updating';
            }

            if (this.state != 'end') {
                var deltat = currTime - this.initialTime;
                this.initialTime = currTime;

                var assertPoint = Math.round(deltat);
                this.currRotAng += this.incang * assertPoint;

                this.rotate();
                this.translate();

                this.currPartition += assertPoint;
            }

            if (this.currPartition >= this.reparts) {
                this.state = 'end';
            }
        }
    }
};
