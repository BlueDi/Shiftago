class CircularAnimation extends Animation {
    constructor(speed, center, radius, startang, rotang) {
        super(speed);

        var DEGREE_TO_RAD = Math.PI / 180;

        this.center = center;
        this.radius = radius;
        this.startang = startang * DEGREE_TO_RAD;
        this.rotang = rotang * DEGREE_TO_RAD;

        this.repart;
        this.currPartition = 0;
        this.Time;

        this.currRotAng = 0;
        this.assertAng = Math.PI / 2;

        this.curr = vec3.fromValues(0, 0, 0);

        this.incang;

        this.FPS = 60;
        this.animTranslateMatrix;
        this.animRotationMatrix;

        this.state = "waiting";

        this.initialize();
    }

    initialize() {
        //intial rotation
        if (this.rotang < 0) {
            this.assertAng = -this.assertAng;
        }

        this.currRotAng += this.startang + Math.PI / 2;

        this.rotate();
        this.translate();

        //calculating total partitions and incremet anglev
        //var totalrot = Math.abs(this.rotang);
        this.repart = this.FPS * 60;
        this.incang = this.rotang / this.repart;
    }

    rotate() {
        var axisvec = vec3.fromValues(0, 1, 0);
        this.animRotationMatrix = mat4.create();
        this.animRotationMatrix = mat4.rotate(this.animRotationMatrix, this.animRotationMatrix, this.currRotAng + this.assertAng, axisvec);
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
        if (this.currPartition == 0) {
            this.Time = currTime;
            this.currPartition++;

            return;
        }

        if (this.state != "end") {
            var Diff = currTime - this.Time;
            this.Time = currTime;

            var n_part_asserts = (Diff * this.FPS) / 100;
            var assertPoint = Math.round(n_part_asserts);

            for (var i = 0; i < assertPoint; i++) {
                console.log(this.currRotAng);
                this.currRotAng += this.incang;
            }

            this.rotate();
            this.translate();

            this.currPartition += assertPoint;
        }

        if (this.currPartition >= this.repart) {
            this.state = "end";
        }
    }
}
