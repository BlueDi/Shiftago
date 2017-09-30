/**
 * MyGraphLeaf class, representing a leaf in the scene graph.
 * @constructor
 **/
function MyGraphLeaf(graph, xmlelem) {
    var reader = new CGFXMLreader();

    var type = reader.getString(xmlelem, 'type');
    var args = reader.getString(xmlelem, 'args').split(" ");

    this.object = new Cylinder(graph.scene, 1, 1, 1, 1, 1);

    if (type == 'cylinder')
        this.object = new Cylinder(graph.scene, parseFloat(args[0]), parseFloat(args[1]), parseFloat(args[2]), parseFloat(args[3]), parseFloat(args[4]));
    else if (type == 'rectangle')
        this.object = new Rectangle(graph.scene, parseFloat(args[0]), parseFloat(args[1]), parseFloat(args[2]), parseFloat(args[3]));
    else if (type == 'sphere')
        this.object = new Sphere(graph.scene, parseFloat(args[0]), parseFloat(args[1]), parseFloat(args[2]));
    else if (type == 'square')
        this.object = new Square(graph.scene, parseFloat(args[0]), parseFloat(args[1]), parseFloat(args[2]), parseFloat(args[3]));
    else if (type == 'triangle')
        this.object = new Triangle(graph.scene, parseFloat(args[0]), parseFloat(args[1]), parseFloat(args[2]), parseFloat(args[3]),
            parseFloat(args[4]), parseFloat(args[5]), parseFloat(args[6]), parseFloat(args[7]), parseFloat(args[8]));
}
