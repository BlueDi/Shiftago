/**
 * MyGraphLeaf class, representing a leaf in the scene graph.
 * @constructor
 **/

function MyGraphLeaf(graph, xmlelem) {
    this.reader = new CGFXMLreader();
    console.log("?????!!!!! " + Object.keys(graph));

    var type = this.reader.getString(xmlelem, 'type');
    var args = this.reader.getString(xmlelem, 'args').split(" ");

    if(type == 'rectangle')
        var object = new Square(graph.scene, parseFloat(args[0]), parseFloat(args[1]), parseFloat(args[2]), parseFloat(args[3]));
}
