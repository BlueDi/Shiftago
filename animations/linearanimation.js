class LinearAnimation extends Animation {
    constructor(speed, controlPoints) {
        super(speed);

        this.controlPoints = controlPoints;
        this.numberofreparts = this.controlPoints.length - 1;
        this.setLength();

        this.currContrtrolPoint = 0;

        this.kinc;

        this.reparts = this.SCALE / Math.pow(this.velocity, 2);

        this.currPartition = 0;
        this.repartPoint;
        this.currPartitionPoint = 0;

        this.rotAng = 0;

        this.dv = vec3.create();
        this.olddv = vec3.create();

        this.state = 'initial';
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

        vec3.subtract(this.olddv, this.dv, this.olddv);
        vec3.subtract(this.dv, this.nextPosition, this.currentPosition);
    }

    rotate() {
        var veclengthXZ = Math.sqrt(this.dv[0] * this.dv[0] + this.dv[2] * this.dv[2]);

        if (veclengthXZ != 0) {
            this.rotAng = Math.acos(this.dv[0] / veclengthXZ);
            if (this.olddv[0] > 0) {
                this.rotAng = -this.rotAng;
            }
            if (this.dv[0] <= 0 && this.olddv[0] == 0) {
                this.rotAng = -this.rotAng;
            }

            this.rotateY(this.rotAng);
        }
    }

    translate(veclength) {
        var veclength = Math.sqrt(Math.pow(this.dv[0], 2) + Math.pow(this.dv[1], 2) + Math.pow(this.dv[2], 2));
        this.repartPoint = this.reparts * veclength;
        this.kinc = 1 / this.repartPoint;

        this.inc = vec3.create();
        vec3.scale(this.inc, this.dv, this.kinc);

        this.animTranslateMatrix = mat4.create();
        mat4.translate(this.animTranslateMatrix, this.animTranslateMatrix, this.currentPosition);
    }

    /**
        Atualizar o estado da animacao.
        Se for a primeira vez inicia thisTime.
        Se for a primeira vez do control point roda para a posicao e calcula a matriz de translacao.
        Se ainda nao tiver chegado ao fim, desloca se em direcao ao control point.
        Se fez todas as particoes, chegou ao fim
    */
    update(currTime) {
        if (this.stop == false && this.state != 'end') {
            if (this.state == 'initial') {
                this.initialTime = currTime;
                this.state = 'updating';
            }

            if (this.state == 'updating' && this.currPartitionPoint == 0) {
                this.initialize();
                this.rotate();
                this.translate();

                this.currPartition++;
                this.currPartitionPoint++;
            }

            if (this.state != 'end') {
                var deltat = currTime - this.initialTime;
                this.initialTime = currTime;
                var assertPoint = Math.round(deltat);
                var currInc = vec3.create();
                vec3.scale(currInc, this.inc, assertPoint);
                vec3.add(this.currentPosition, this.currentPosition, currInc);

                this.animTranslateMatrix = mat4.create();
                mat4.translate(this.animTranslateMatrix, this.animTranslateMatrix, this.currentPosition);

                this.currPartition += assertPoint;
                this.currPartitionPoint += assertPoint;
            }

            if (this.currPartitionPoint >= this.repartPoint) {
                this.currPartitionPoint = 0;
                this.currContrtrolPoint++;
            }

            if (this.currContrtrolPoint >= this.numberofreparts) {
                this.state = 'end';
            }
        }
    }
};
