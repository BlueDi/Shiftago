/**
 * MyGraphLeaf class, representing a leaf in the scene graph.
 * @constructor
 **/
function MyGraphLeaf(graph, xmlelem) {
    var reader = new CGFXMLreader();

    this.type = reader.getString(xmlelem, 'type');
    var args = reader.getString(xmlelem, 'args').split(" ");

    this.object = null;

    if (this.type == 'cylinder') {
        this.object = new Cylinder(graph.scene, parseFloat(args[0]), parseFloat(args[1]), parseFloat(args[2]), parseFloat(args[3]), parseFloat(args[4]));
    } else if (this.type == 'patch') {
        // Retrieves information about cplines.
        var cplineSpecs = xmlelem.children;
        var cplines = [];
        for (var i = 0; i < cplineSpecs.length; i++) {
            var cpointSpecs = cplineSpecs[i].children;
            var cpoints = [];
            for (var j = 0; j < cpointSpecs.length; j++) {
                if (cpointSpecs[j].nodeName == "CPOINT") {
                    var xx = reader.getString(cpointSpecs[j], 'xx');
                    var yy = reader.getString(cpointSpecs[j], 'yy');
                    var zz = reader.getString(cpointSpecs[j], 'zz');
                    var ww = reader.getString(cpointSpecs[j], 'ww');
                }
                cpoint = [xx, yy, zz, ww];
                cpoints.push(cpoint);
            }
            cplines.push(cpoints);
        }

        // Check if all cpoints have the same length
        if (cplines.length != 1) {
            for (var i = 0; i < cplines.length - 1; i++) {
                if (cplines[i].length != cplines[i + 1].length) {
                    console.log("           invalid number of cpoints");
                    return;
                }
            }
        }

        var patch = new Patch(graph.scene, parseFloat(args[0]), parseFloat(args[1]), cplines);
        this.object = patch.object;
    } else if (this.type == 'rectangle') {
        this.object = new Rectangle(graph.scene, parseFloat(args[0]), parseFloat(args[1]), parseFloat(args[2]), parseFloat(args[3]));
    } else if (this.type == 'sphere') {
        this.object = new Sphere(graph.scene, parseFloat(args[0]), parseFloat(args[1]), parseFloat(args[2]));
    } else if (this.type == 'triangle') {
        this.object = new Triangle(graph.scene, parseFloat(args[0]), parseFloat(args[1]), parseFloat(args[2]), parseFloat(args[3]),
            parseFloat(args[4]), parseFloat(args[5]), parseFloat(args[6]), parseFloat(args[7]), parseFloat(args[8]));
    }
}
