class Animation {
    constructor(speed) {
        this.velocity = speed;
        this.initialTime = 0;
        this.animationMatrix = mat4.create();
        mat4.identity(this.animationMatrix);
    }

    /**
        Atualizar o estado da animacao
    */
    update(currTime) {}
};