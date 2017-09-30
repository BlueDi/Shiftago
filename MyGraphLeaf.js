/**
 * MyGraphLeaf class, representing a leaf in the scene graph.
 * @constructor
 **/
function MyGraphLeaf(graph, xmlelem) {
    var reader = new CGFXMLreader();

    var type = reader.getString(xmlelem, 'type');
    var args = reader.getString(xmlelem, 'args').split(" ");

    if(type == 'rectangle')
        var object = new Square(graph.scene, parseFloat(args[0]), parseFloat(args[1]), parseFloat(args[2]), parseFloat(args[3]));
}
