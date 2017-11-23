class Animation {
    constructor(speed) {
        this.FPS = 60;

        this.velocity = speed;
        this.initialTime = 0;
        this.animTranslateMatrix = mat4.create();
        this.animRotationMatrix = mat4.create();

        this.state = 'end';
        this.stop = false;
    }

    /**
        Atualizar o estado da animacao
    */
    update(currTime) {}
};
