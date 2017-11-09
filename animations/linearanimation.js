class LinearAnimation extends Animation {
    constructor(speed, controlPoints) {
        super(speed);

        this.controlPoints = controlPoints;
        this.actualControlPoint = 0;
    }

    /**
        Atualizar o estado da animacao
    */
    update(currTime) {}
};

