class Animation {
    constructor(speed) {
        this.SCALE = 60 * 1000;

        this.velocity = speed;
        this.initialTime = 0;
        this.animTranslateMatrix = mat4.create();
        this.animRotationMatrix = mat4.create();

        this.state = 'end';
        this.stop = true;
    }

    rotateY(rototationAngle) {
        var axisvec = vec3.fromValues(0, 1, 0);
        this.animRotationMatrix = mat4.create();
        this.animRotationMatrix = mat4.rotate(this.animRotationMatrix, this.animRotationMatrix, rototationAngle, axisvec);
    }

    /**
        Atualizar o estado da animacao
    */
    update(currTime) {}
};
