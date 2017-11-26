class CircularAnimation extends Animation {
    constructor(speed, center, radius, startang, rotang) {
        super(speed);

        var DEGREE_TO_RAD = Math.PI / 180;

        this.center = center;
        this.radius = radius;
        this.startang = startang * DEGREE_TO_RAD;
        this.rotang = rotang * DEGREE_TO_RAD;
        this.reparts = this.SCALE / this.velocity;
        this.incang = this.rotang / this.reparts;

        this.currPartition = 0;
        if (this.rotang > 0) {
            this.currRotAng = this.startang + Math.PI;
        } else if (this.rotang < 0) {
            this.currRotAng = this.startang - Math.PI;
        }

        this.curr = vec3.fromValues(0, 0, 0);

        this.state = 'initial';
    }

    translate() {
        if (this.currRotAng > 0) {
            this.curr[0] = this.radius * Math.sin(this.currRotAng);
            this.curr[2] = this.radius * Math.cos(this.currRotAng);
        } else if (this.currRotAng < 0) {
            this.curr[0] = -this.radius * Math.sin(this.currRotAng);
            this.curr[2] = -this.radius * Math.cos(this.currRotAng);
        }

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

                this.rotateY(this.currRotAng);
                this.translate();

                this.currPartition += assertPoint;
            }

            if (this.currPartition >= this.reparts) {
                this.currRotAng = this.rotang + Math.PI;
                this.rotateY(this.currRotAng);
                this.state = 'end';
            }
        }
    }
};
