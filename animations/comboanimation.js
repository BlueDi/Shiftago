class ComboAnimation extends Animation {
    constructor(animationsList) {
        super(0);

        this.animationsList = animationsList;
        for (var i = 0; i < this.animationsList.length; i++) {
            this.animationsList[i].stop = false;
        }

        this.state = 'initial';
    }

    /**
        Atualizar o estado da animacao
    */
    update(currTime) {
        this.animTranslateMatrix = mat4.create();
        this.animRotationMatrix = mat4.create();
        for (var i = 0; i < this.animationsList.length; i++) {
            this.actualAnimation = this.animationsList[i];

            if (this.actualAnimation.state != 'end') {
                this.actualAnimation.update(currTime);

                mat4.multiply(this.animTranslateMatrix, this.animTranslateMatrix, this.actualAnimation.animTranslateMatrix);
                mat4.multiply(this.animRotationMatrix, this.animRotationMatrix, this.actualAnimation.animRotationMatrix);
            }
        }
    }
};
