class LinearAnimation extends Animation {
    constructor(speed, controlPoints) {
        super(speed);

        this.controlPoints = controlPoints;
        this.numberofreparts = this.controlPoints.length - 1;
        this.setLength();

        this.currContrtrolPoint = 0;

        this.kinc;

        this.reparts = this.FPS * this.velocity;
        this.currPartition = 0;
        this.Time;

        this.repartPoint;
        this.currPartitionPoint = 0;

        this.rotAng = 0;

        this.dv = vec3.create();
        this.olddv = vec3.create();
        this.animTranslateMatrix = mat4.create();
        this.animRotationMatrix = mat4.create();

        this.state = "initial";
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

    initialize() {
        this.currentPosition = this.controlPoints[this.currContrtrolPoint];
        this.nextPosition = this.controlPoints[this.currContrtrolPoint + 1];

        this.currX = this.currentPosition[0];
        this.currY = this.currentPosition[1];
        this.currZ = this.currentPosition[2];

        vec3.subtract(this.olddv, this.dv, this.olddv);
        vec3.subtract(this.dv, this.nextPosition, this.currentPosition);
    }

    rotate() {
        var veclengthXZ = Math.sqrt(this.dv[0] * this.dv[0] + this.dv[2] * this.dv[2]);

        if (veclengthXZ != 0) {
            this.rotAng = Math.acos(this.dv[0] / veclengthXZ);

            if (this.dv[0] < 0) {
                this.rotAng = -this.rotAng;
            }
            if (this.dv[2] > 0 && this.olddv[2] >= 0) {
                this.rotAng = -this.rotAng;
            }

            var axisvec = vec3.fromValues(0, 1, 0);
            this.animRotationMatrix = mat4.create();
            mat4.rotate(this.animRotationMatrix, this.animRotationMatrix, this.rotAng, axisvec);
        }
    }

    translateInitial() {
        var veclength = Math.sqrt(Math.pow(this.dv[0], 2) + Math.pow(this.dv[2], 2));
        this.translate(veclength);
    }

    translateUpdate() {
        var veclength = Math.sqrt(Math.pow(this.dv[0], 2) + Math.pow(this.dv[2], 2));
        this.translate(veclength);
    }

    translate(veclength) {
        this.repartPoint = 60 * (this.reparts * veclength) / (this.totallength * this.velocity);
        this.kinc = (veclength / this.repartPoint) / veclength;

        var xnovo = this.currentPosition[0] + this.kinc * this.dv[0];
        var ynovo = this.currentPosition[1] + this.kinc * this.dv[1];
        var znovo = this.currentPosition[2] + this.kinc * this.dv[2];

        this.xinc = xnovo - this.currentPosition[0];
        this.yinc = ynovo - this.currentPosition[1];
        this.zinc = znovo - this.currentPosition[2];

        var transvec = vec3.fromValues(this.currX, this.currY, this.currZ);
        this.animTranslateMatrix = mat4.create();
        mat4.translate(this.animTranslateMatrix, this.animTranslateMatrix, transvec);
    }

    /**
        Atualizar o estado da animacao.
        Se for a primeira vez inicia thisTime.
        Se for a primeira vez do control point roda para a posicao e calcula a matriz de translacao.
        Se ainda nao tiver chegado ao fim, desloca se em direcao ao control point.
        Se fez todas as particoes, chegou ao fim
    */
    update(currTime) {
        if (this.state == 'initial') {
            this.Time = currTime;
            this.initialize();
            this.translateInitial();
            this.state = 'updating';
        }

        if (this.state == 'updating' && this.currPartitionPoint == 0) {
            this.initialize();
            this.rotate();
            this.translateUpdate();

            this.currPartition++;
            this.currPartitionPoint++;
        }

        if (this.state != 'end') {
            var deltat = currTime - this.Time;

            this.Time = currTime;

            var assertPoint = Math.round((deltat * this.FPS) / 100);

            for (var i = 0; i < assertPoint; i++) {
                this.currX += this.xinc;
                this.currY += this.yinc;
                this.currZ += this.zinc;
            }

            var transvec = vec3.fromValues(this.currX, this.currY, this.currZ);
            this.animTranslateMatrix = mat4.create();
            mat4.translate(this.animTranslateMatrix, this.animTranslateMatrix, transvec);

            this.currPartition += assertPoint;
            this.currPartitionPoint += assertPoint;
        }

        if (this.currPartitionPoint >= this.repartPoint) {
            this.currPartitionPoint = 0;
            this.currContrtrolPoint++;
        }

        if (this.currPartition >= this.repart || this.currContrtrolPoint >= this.numberofreparts) {
            this.state = 'end';
        }
    }
};
