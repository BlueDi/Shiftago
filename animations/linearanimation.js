class LinearAnimation extends Animation {
    constructor(speed, controlPoints) {
        super(speed);

        this.controlPoints = controlPoints;
        this.numberofreparts = this.controlPoints.length - 1;
        this.setLength();

        this.currContrtrolPoint = 0;

        this.kinc;

        this.reparts = this.RPS;
        this.currPartition = 0;
        this.Time;

        this.repartPoint;
        this.currPartitionPoint = 0;

        this.rotAng = 0;

        this.animationMatrix = mat4.create();
        this.animRotMatrix = mat4.create();

        this.state = "waiting";
    }

    /**
     * Calculates the total lentgh of the animation by calculating
     * all trajectories lentgh first
     */
    setLength() {
        this.totallength = 0;

        for (var i = 0; i < this.controlPoints.length - 1; i++) {
            var dv = vec3.create();
            vec3.subtract(dv, this.controlPoints[i], this.controlPoints[i + 1]);
            this.totallength += Math.sqrt(Math.pow(dv[0], 2) + Math.pow(dv[1], 2) + Math.pow(dv[2], 2));
        }
    };

    initial() {
        this.currentPosition = this.controlPoints[this.currContrtrolPoint];
        this.nextPosition = this.controlPoints[this.currContrtrolPoint + 1];

        this.currX = this.currentPosition[0];
        this.currY = this.currentPosition[1];
        this.currZ = this.currentPosition[2];

        this.dv = vec3.create();
        vec3.subtract(this.dv, this.nextPosition, this.currentPosition);
    }

    rotate(currTime) {
        var veclengthXY = Math.sqrt(Math.pow(this.dv[0], 2) + Math.pow(this.dv[2], 2));

        if (veclengthXY > 0) {
            this.rotAng = Math.acos((this.dv[0] * 0 + this.dv[2] * 1) / veclengthXY);

            if (this.dv[0] > 0) {
                this.rotAng = -this.rotAng;
            }

            var axisvec = vec3.fromValues(0, 1, 0);

            this.rotMatrix = mat4.create();
            this.rotMatrix = mat4.rotate(this.animRotMatrix, this.animRotMatrix, this.rotAng, axisvec);
        }
    }

    translate(currTime) {
        var veclength = Math.sqrt(Math.pow(this.dv[0], 2) + Math.pow(this.dv[2], 2));

        this.repartPoint = (this.reparts * veclength) / this.totallength;
        this.kinc = (veclength / this.repartPoint) / veclength;

        var xnovo = this.currentPosition[0] + this.kinc * this.dv[0];
        var ynovo = this.currentPosition[1] + this.kinc * this.dv[1];
        var znovo = this.currentPosition[2] + this.kinc * this.dv[2];

        this.xinc = xnovo - this.currentPosition[0];
        this.yinc = ynovo - this.currentPosition[1];
        this.zinc = znovo - this.currentPosition[2];

        var transvec = vec3.fromValues(this.currX, this.currY, this.currZ);
        this.animationMatrix = mat4.create();

        mat4.translate(this.animationMatrix, this.animationMatrix, transvec);
    }

    /**
        Atualizar o estado da animacao
    */
    update(currTime) {
        if (this.currPartition == 0) {
            this.Time = currTime;
        }

        if (this.state != "end" && this.currPartitionPoint == 0) {
            this.initial();
            this.rotate(currTime);
            this.translate(currTime);

            this.currPartition++;
            this.currPartitionPoint++;
        }

        if (this.state != "end") {
            var deltat = currTime - this.Time;

            this.Time = currTime;

            var n_part_asserts = (deltat * this.RPS) / 1000;
            var assertPoint = Math.round(n_part_asserts);

            for (var i = 0; i < assertPoint; i++) {
                this.currX += this.xinc;
                this.currY += this.yinc;
                this.currZ += this.zinc;
            }

            var transvec = vec3.fromValues(this.currX, this.currY, this.currZ);
            this.animationMatrix = mat4.create();

            mat4.translate(this.animationMatrix, this.animationMatrix, transvec);

            this.currPartition += assertPoint;
            this.currPartitionPoint += assertPoint;
        }

        if (this.currPartitionPoint >= this.repartPoint) {
            this.currPartitionPoint = 0;
            this.currContrtrolPoint++;
        }

        if (this.currPartition >= this.repart || this.currContrtrolPoint >= this.numberofreparts) {
            this.state = "end";
        }
    }
};
