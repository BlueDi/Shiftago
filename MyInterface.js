/**
 * MyInterface class, creating a GUI interface.
 * @constructor
 */
function MyInterface() {
    //call CGFinterface constructor
    CGFinterface.call(this);
}

MyInterface.prototype = Object.create(CGFinterface.prototype);
MyInterface.prototype.constructor = MyInterface;

/**
 * Initializes the interface.
 * @param {CGFapplication} application
 */
MyInterface.prototype.init = function(application) {
    // call CGFinterface init
    CGFinterface.prototype.init.call(this, application);

    // init GUI. For more information on the methods, check:
    //  http://workshop.chromeexperiments.com/examples/gui

    this.gui = new dat.GUI();

    // add a group of controls (and open/expand by defult)

    this.scene.selFolder = this.gui.addFolder("Selectables");
    return true;
};

/**
 * Adds a folder containing the IDs of the lights passed as parameter.
 */
MyInterface.prototype.addLightsGroup = function(lights) {
    var group = this.gui.addFolder("Lights");
    group.open();

    // add two check boxes to the group. The identifiers must be members variables of the scene initialized in scene.init as boolean
    // e.g. this.option1=true; this.option2=false;

    for (var key in lights) {
        if (lights.hasOwnProperty(key)) {
            this.scene.lightValues[key] = lights[key][0];
            group.add(this.scene.lightValues, key).listen();
        }
    }
};

/**
 * Adds folders for the game customization.
 */
MyInterface.prototype.addScenesGroup = function(shiftago) {
    var customization = this.gui.addFolder("Customization");
    customization.open();
    customization.add(shiftago, 'environment', ['Simple', 'Fur', 'Midnight Desert', 'Polka Dot', 'In a Ship']).name('Environment')
        .onChange(function() {
            shiftago.updateEnvironment();
        });
    customization.add(shiftago, 'camera', ['default', 'topdown']).name('Camera')
        .onChange(function() {
            shiftago.updateCamera();
        });
    customization.add(shiftago, 'animationSpeed', 5, 30).name('Animation Speed');
    var game = this.gui.addFolder("Game");
    game.open();
    game.add(shiftago, 'restart').name('Restart');
    game.add(shiftago, 'undo').name('Undo');
    game.add(shiftago, 'gameMode', ['Human vs Human', 'Human vs Computer', 'Computer vs Computer']).name('Game Mode')
        .onChange(function() {
            shiftago.selectGameLight();
        });
    game.add(shiftago, 'numberOfPlayers', [2, 3, 4]).name('Number of Players')
        .onChange(function() {
            shiftago.selectPlayerLights();
        });
    game.add(shiftago, 'difficulty', ['easy', 'hard']).name('Difficulty')
        .onChange(function() {
            shiftago.alternateDifficultyLight();
        });
};
