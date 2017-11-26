class ComboAnimation extends Animation {
    constructor(animationsList) {
        super(0);

        this.animationsList = animationsList;
        for (var i = 0; i < this.animationsList.length; i++) {
            this.animationsList[i].stop = true;
        }

        this.state = 'initial';
    }

    /**
        Atualizar o estado da animacao
    */
    update(currTime) {
        if (this.stop == false && this.state != 'end') {
            if (this.state == 'initial') {
                for (var i = 0; i < this.animationsList.length; i++) {
                    this.animationsList[i].stop = false;
                }
                this.state = 'updating';
            }

            this.animTranslateMatrix = mat4.create();
            this.animRotationMatrix = mat4.create();

            var allEnded = true;
            for (var i = 0; i < this.animationsList.length; i++) {
                var animation = this.animationsList[i];

                if (animation.state != 'end') {
                    allEnded = false;
                    animation.update(currTime);

                    mat4.multiply(this.animTranslateMatrix, this.animTranslateMatrix, animation.animTranslateMatrix);
                    mat4.multiply(this.animRotationMatrix, this.animRotationMatrix, animation.animRotationMatrix);
                }
            }
            if (allEnded) {
                this.state = 'end';
            }
        }
    }
};
