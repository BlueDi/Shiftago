class BezierAnimation extends Animation {
    constructor(speed, controlPoints) {
        super(speed);

        this.controlPoints = controlPoints;
    }

    /**
        Atualizar o estado da animacao
    */
    update(currTime) {}
};
