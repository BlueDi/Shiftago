class ComboAnimation extends Animation {
    constructor(animationsList) {
        super(0);

        this.animationsList = animationsList;

        for (var i = 1; i < this.animationsList.length; i++) {
            this.animationsList[i].stop = true;
        }

        this.actualAnimationCounter = 0;
        this.actualAnimation = this.animationsList[this.actualAnimationCounter];
        this.state = 'initial';
    }

    nextAnimation() {
        this.actualAnimationCounter++;
        this.actualAnimation = this.animationsList[this.actualAnimationCounter];
        this.actualAnimation.stop = false;
    }

    /**
        Atualizar o estado da animacao
    */
    update(currTime) {
        if (this.actualAnimation.state != 'end') {
            this.actualAnimation.update(currTime);

            this.animTranslateMatrix = this.actualAnimation.animTranslateMatrix;
            this.animRotationMatrix = this.actualAnimation.animRotationMatrix;
        } else if (this.actualAnimationCounter < this.animationsList.length - 1) {
            this.nextAnimation();
        }
    }
};
