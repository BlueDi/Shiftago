class Animation {
    constructor(speed) {
        this.FPS = 60;

        this.velocity = speed;
        this.initialTime = 0;
        this.animationMatrix = mat4.create();
        this.animRotMatrix = mat4.create();
    }

    /**
        Atualizar o estado da animacao
    */
    update(currTime) {}
};
