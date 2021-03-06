var DEGREE_TO_RAD = Math.PI / 180;

// Order of the groups in the XML document.
var INITIALS_INDEX = 0;
var ILLUMINATION_INDEX = 1;
var LIGHTS_INDEX = 2;
var TEXTURES_INDEX = 3;
var MATERIALS_INDEX = 4;
var ANIMATIONS_INDEX = 5;
var NODES_INDEX = 6;

/**
 * MySceneGraph class, representing the scene graph.
 * @constructor
 */
function MySceneGraph(filename, scene) {
    this.loadedOk = null; // so desenhar depois desta variavel estar a true

    // Establish bidirectional references between scene and graph.
    this.scene = scene;
    scene.graph = this;

    this.nodes = [];

    this.idRoot = null; // The id of the root element.

    this.axisCoords = [];
    this.axisCoords['x'] = [1, 0, 0];
    this.axisCoords['y'] = [0, 1, 0];
    this.axisCoords['z'] = [0, 0, 1];

    this.selectableShader = new CGFshader(this.scene.gl, "shaders/selectable.vert", "shaders/selectable.frag");

    // File reading
    this.reader = new CGFXMLreader();

    /*
     * Read the contents of the xml file, and refer to this class for loading and error handlers.
     * After the file is read, the reader calls onXMLReady on this object.
     * If any error occurs, the reader calls onXMLError on this object, with an error message
     */
    this.reader.open('scenes/' + filename, this);
}

/*
 * Callback to be executed after successful reading
 */
MySceneGraph.prototype.onXMLReady = function() {
    console.log("XML Loading finished.");
    var rootElement = this.reader.xmlDoc.documentElement;

    // Here should go the calls for different functions to parse the various blocks
    var error = this.parseLSXFile(rootElement);

    if (error != null) {
        this.onXMLError(error);
        return;
    }

    this.loadedOk = true;

    // As the graph loaded ok, signal the scene so that any additional initialization depending on the graph can take place
    this.scene.onGraphLoaded();
};

/**
 * Parses the LSX file, processing each block.
 */
MySceneGraph.prototype.parseLSXFile = function(rootElement) {
    if (rootElement.nodeName != "SCENE")
        return "root tag <SCENE> missing";

    var nodes = rootElement.children;

    // Reads the names of the nodes to an auxiliary buffer.
    var nodeNames = [];

    for (var i = 0; i < nodes.length; i++) {
        nodeNames.push(nodes[i].nodeName);
    }

    var error;

    // Processes each node, verifying errors.

    // <INITIALS>
    var index;
    if ((index = nodeNames.indexOf("INITIALS")) == -1)
        return "tag <INITIALS> missing";
    else {
        if (index != INITIALS_INDEX)
            this.onXMLMinorError("tag <INITIALS> out of order");

        if ((error = this.parseInitials(nodes[index])) != null)
            return error;
    }

    // <ILLUMINATION>
    if ((index = nodeNames.indexOf("ILLUMINATION")) == -1)
        return "tag <ILLUMINATION> missing";
    else {
        if (index != ILLUMINATION_INDEX)
            this.onXMLMinorError("tag <ILLUMINATION> out of order");

        if ((error = this.parseIllumination(nodes[index])) != null)
            return error;
    }

    // <LIGHTS>
    if ((index = nodeNames.indexOf("LIGHTS")) == -1)
        return "tag <LIGHTS> missing";
    else {
        if (index != LIGHTS_INDEX)
            this.onXMLMinorError("tag <LIGHTS> out of order");

        if ((error = this.parseLights(nodes[index])) != null)
            return error;
    }

    // <TEXTURES>
    if ((index = nodeNames.indexOf("TEXTURES")) == -1)
        return "tag <TEXTURES> missing";
    else {
        if (index != TEXTURES_INDEX)
            this.onXMLMinorError("tag <TEXTURES> out of order");

        if ((error = this.parseTextures(nodes[index])) != null)
            return error;
    }

    // <MATERIALS>
    if ((index = nodeNames.indexOf("MATERIALS")) == -1)
        return "tag <MATERIALS> missing";
    else {
        if (index != MATERIALS_INDEX)
            this.onXMLMinorError("tag <MATERIALS> out of order");

        if ((error = this.parseMaterials(nodes[index])) != null)
            return error;
    }

    //ANIMATIONS
    if ((index = nodeNames.indexOf("ANIMATIONS")) == -1)
        return "tag <ANIMATIONS> missing";
    else {
        if (index != ANIMATIONS_INDEX)
            this.onXMLMinorError("tag <ANIMATIONS> out of order");
        if ((error = this.parseAnimations(nodes[index])) != null)
            return error;
    }

    // <NODES>
    if ((index = nodeNames.indexOf("NODES")) == -1)
        return "tag <NODES> missing";
    else {
        if (index != NODES_INDEX)
            this.onXMLMinorError("tag <NODES> out of order");

        if ((error = this.parseNodes(nodes[index])) != null)
            return error;
    }
};

/**
 * Parses the <INITIALS> block.
 */
MySceneGraph.prototype.parseInitials = function(initialsNode) {
    var children = initialsNode.children;

    var nodeNames = [];

    for (var i = 0; i < children.length; i++)
        nodeNames.push(children[i].nodeName);

    // Frustum planes.
    this.near = 0.1;
    this.far = 500;
    var indexFrustum = nodeNames.indexOf("frustum");
    if (indexFrustum == -1) {
        this.onXMLMinorError("frustum planes missing; assuming 'near = 0.1' and 'far = 500'");
    } else {
        this.near = this.reader.getFloat(children[indexFrustum], 'near');
        this.far = this.reader.getFloat(children[indexFrustum], 'far');

        if (this.near == null) {
            this.near = 0.1;
            this.onXMLMinorError("unable to parse value for near plane; assuming 'near = 0.1'");
        } else if (this.far == null) {
            this.far = 500;
            this.onXMLMinorError("unable to parse value for far plane; assuming 'far = 500'");
        } else if (isNaN(this.near)) {
            this.near = 0.1;
            this.onXMLMinorError("non-numeric value found for near plane; assuming 'near = 0.1'");
        } else if (isNaN(this.far)) {
            this.far = 500;
            this.onXMLMinorError("non-numeric value found for far plane; assuming 'far = 500'");
        } else if (this.near <= 0) {
            this.near = 0.1;
            this.onXMLMinorError("'near' must be positive; assuming 'near = 0.1'");
        }

        if (this.near >= this.far)
            return "'near' must be smaller than 'far'";
    }

    // Checks if at most one translation, three rotations, and one scaling are defined.
    if (initialsNode.getElementsByTagName('translation').length > 1)
        return "no more than one initial translation may be defined";

    if (initialsNode.getElementsByTagName('rotation').length > 3)
        return "no more than three initial rotations may be defined";

    if (initialsNode.getElementsByTagName('scale').length > 1)
        return "no more than one scaling may be defined";

    // Initial transforms.
    this.initialTranslate = [];
    this.initialScaling = [];
    this.initialRotations = [];

    // Gets indices of each element.
    var translationIndex = nodeNames.indexOf("translation");
    var thirdRotationIndex = nodeNames.indexOf("rotation");
    var secondRotationIndex = nodeNames.indexOf("rotation", thirdRotationIndex + 1);
    var firstRotationIndex = nodeNames.lastIndexOf("rotation");
    var scalingIndex = nodeNames.indexOf("scale");

    // Checks if the indices are valid and in the expected order.
    // Translation.
    this.initialTransforms = mat4.create();
    mat4.identity(this.initialTransforms);
    if (translationIndex == -1)
        this.onXMLMinorError("initial translation undefined; assuming T = (0, 0, 0)");
    else {
        var tx = this.reader.getFloat(children[translationIndex], 'x');
        var ty = this.reader.getFloat(children[translationIndex], 'y');
        var tz = this.reader.getFloat(children[translationIndex], 'z');

        if (tx == null) {
            tx = 0;
            this.onXMLMinorError("failed to parse x-coordinate of initial translation; assuming tx = 0");
        } else if (isNaN(tx)) {
            tx = 0;
            this.onXMLMinorError("found non-numeric value for x-coordinate of initial translation; assuming tx = 0");
        }

        if (ty == null) {
            ty = 0;
            this.onXMLMinorError("failed to parse y-coordinate of initial translation; assuming ty = 0");
        } else if (isNaN(ty)) {
            ty = 0;
            this.onXMLMinorError("found non-numeric value for y-coordinate of initial translation; assuming ty = 0");
        }

        if (tz == null) {
            tz = 0;
            this.onXMLMinorError("failed to parse z-coordinate of initial translation; assuming tz = 0");
        } else if (isNaN(tz)) {
            tz = 0;
            this.onXMLMinorError("found non-numeric value for z-coordinate of initial translation; assuming tz = 0");
        }

        if (translationIndex > thirdRotationIndex || translationIndex > scalingIndex)
            this.onXMLMinorError("initial translation out of order; result may not be as expected");

        mat4.translate(this.initialTransforms, this.initialTransforms, [tx, ty, tz]);
    }

    // Rotations.
    var initialRotations = [];
    initialRotations['x'] = 0;
    initialRotations['y'] = 0;
    initialRotations['z'] = 0;

    var rotationDefined = [];
    rotationDefined['x'] = false;
    rotationDefined['y'] = false;
    rotationDefined['z'] = false;

    var axis;
    var rotationOrder = [];

    // Third rotation (first rotation defined).
    if (thirdRotationIndex != -1) {
        axis = this.reader.getItem(children[thirdRotationIndex], 'axis', ['x', 'y', 'z']);
        if (axis != null) {
            var angle = this.reader.getFloat(children[thirdRotationIndex], 'angle');
            if (angle != null && !isNaN(angle)) {
                initialRotations[axis] += angle;
                if (!rotationDefined[axis])
                    rotationOrder.push(axis);
                rotationDefined[axis] = true;
            } else this.onXMLMinorError("failed to parse third initial rotation 'angle'");
        }
    }

    // Second rotation.
    if (secondRotationIndex != -1) {
        axis = this.reader.getItem(children[secondRotationIndex], 'axis', ['x', 'y', 'z']);
        if (axis != null) {
            var angle = this.reader.getFloat(children[secondRotationIndex], 'angle');
            if (angle != null && !isNaN(angle)) {
                initialRotations[axis] += angle;
                if (!rotationDefined[axis])
                    rotationOrder.push(axis);
                rotationDefined[axis] = true;
            } else this.onXMLMinorError("failed to parse second initial rotation 'angle'");
        }
    }

    // First rotation.
    if (firstRotationIndex != -1) {
        axis = this.reader.getItem(children[firstRotationIndex], 'axis', ['x', 'y', 'z']);
        if (axis != null) {
            var angle = this.reader.getFloat(children[firstRotationIndex], 'angle');
            if (angle != null && !isNaN(angle)) {
                initialRotations[axis] += angle;
                if (!rotationDefined[axis])
                    rotationOrder.push(axis);
                rotationDefined[axis] = true;
            } else this.onXMLMinorError("failed to parse first initial rotation 'angle'");
        }
    }

    // Checks for undefined rotations.
    if (!rotationDefined['x'])
        this.onXMLMinorError("rotation along the Ox axis undefined; assuming Rx = 0");
    else if (!rotationDefined['y'])
        this.onXMLMinorError("rotation along the Oy axis undefined; assuming Ry = 0");
    else if (!rotationDefined['z'])
        this.onXMLMinorError("rotation along the Oz axis undefined; assuming Rz = 0");

    // Updates transform matrix.
    for (var i = 0; i < rotationOrder.length; i++)
        mat4.rotate(this.initialTransforms, this.initialTransforms, DEGREE_TO_RAD * initialRotations[rotationOrder[i]], this.axisCoords[rotationOrder[i]]);

    // Scaling.
    if (scalingIndex == -1)
        this.onXMLMinorError("initial scaling undefined; assuming S = (1, 1, 1)");
    else {
        var sx = this.reader.getFloat(children[scalingIndex], 'sx');
        var sy = this.reader.getFloat(children[scalingIndex], 'sy');
        var sz = this.reader.getFloat(children[scalingIndex], 'sz');

        if (sx == null) {
            sx = 1;
            this.onXMLMinorError("failed to parse x parameter of initial scaling; assuming sx = 1");
        } else if (isNaN(sx)) {
            sx = 1;
            this.onXMLMinorError("found non-numeric value for x parameter of initial scaling; assuming sx = 1");
        }

        if (sy == null) {
            sy = 1;
            this.onXMLMinorError("failed to parse y parameter of initial scaling; assuming sy = 1");
        } else if (isNaN(sy)) {
            sy = 1;
            this.onXMLMinorError("found non-numeric value for y parameter of initial scaling; assuming sy = 1");
        }

        if (sz == null) {
            sz = 1;
            this.onXMLMinorError("failed to parse z parameter of initial scaling; assuming sz = 1");
        } else if (isNaN(sz)) {
            sz = 1;
            this.onXMLMinorError("found non-numeric value for z parameter of initial scaling; assuming sz = 1");
        }

        if (scalingIndex < firstRotationIndex)
            this.onXMLMinorError("initial scaling out of order; result may not be as expected");

        mat4.scale(this.initialTransforms, this.initialTransforms, [sx, sy, sz]);
    }

    // ----------
    // Reference length.
    this.referenceLength = 1;

    var indexReference = nodeNames.indexOf("reference");
    if (indexReference == -1)
        this.onXMLMinorError("reference length undefined; assuming 'length = 1'");
    else {
        // Reads the reference length.
        var length = this.reader.getFloat(children[indexReference], 'length');

        if (length != null) {
            if (isNaN(length))
                this.onXMLMinorError("found non-numeric value for reference length; assuming 'length = 1'");
            else if (length <= 0)
                this.onXMLMinorError("reference length must be a positive value; assuming 'length = 1'");
            else
                this.referenceLength = length;
        } else
            this.onXMLMinorError("unable to parse reference length; assuming 'length = 1'");
    }

    console.log("Parsed initials");

    return null;
};

/**
 * Parses the <ILLUMINATION> block.
 */
MySceneGraph.prototype.parseIllumination = function(illuminationNode) {
    // Reads the ambient and background values.
    var children = illuminationNode.children;
    var nodeNames = [];
    for (var i = 0; i < children.length; i++)
        nodeNames.push(children[i].nodeName);

    // Retrieves the global ambient illumination.
    this.ambientIllumination = [0, 0, 0, 1];
    var ambientIndex = nodeNames.indexOf("ambient");
    if (ambientIndex != -1) {
        // R.
        var r = this.reader.getFloat(children[ambientIndex], 'r');
        if (r != null) {
            if (isNaN(r))
                return "ambient 'r' is a non numeric value on the ILLUMINATION block";
            else if (r < 0 || r > 1)
                return "ambient 'r' must be a value between 0 and 1 on the ILLUMINATION block"
            else
                this.ambientIllumination[0] = r;
        } else
            this.onXMLMinorError("unable to parse R component of the ambient illumination; assuming R = 0");

        // G.
        var g = this.reader.getFloat(children[ambientIndex], 'g');
        if (g != null) {
            if (isNaN(g))
                return "ambient 'g' is a non numeric value on the ILLUMINATION block";
            else if (g < 0 || g > 1)
                return "ambient 'g' must be a value between 0 and 1 on the ILLUMINATION block"
            else
                this.ambientIllumination[1] = g;
        } else
            this.onXMLMinorError("unable to parse G component of the ambient illumination; assuming G = 0");

        // B.
        var b = this.reader.getFloat(children[ambientIndex], 'b');
        if (b != null) {
            if (isNaN(b))
                return "ambient 'b' is a non numeric value on the ILLUMINATION block";
            else if (b < 0 || b > 1)
                return "ambient 'b' must be a value between 0 and 1 on the ILLUMINATION block"
            else
                this.ambientIllumination[2] = b;
        } else
            this.onXMLMinorError("unable to parse B component of the ambient illumination; assuming B = 0");

        // A.
        var a = this.reader.getFloat(children[ambientIndex], 'a');
        if (a != null) {
            if (isNaN(a))
                return "ambient 'a' is a non numeric value on the ILLUMINATION block";
            else if (a < 0 || a > 1)
                return "ambient 'a' must be a value between 0 and 1 on the ILLUMINATION block"
            else
                this.ambientIllumination[3] = a;
        } else
            this.onXMLMinorError("unable to parse A component of the ambient illumination; assuming A = 1");
    } else
        this.onXMLMinorError("global ambient illumination undefined; assuming Ia = (0, 0, 0, 1)");

    // Retrieves the background clear color.
    this.background = [0, 0, 0, 1];
    var backgroundIndex = nodeNames.indexOf("background");
    if (backgroundIndex != -1) {
        // R.
        var r = this.reader.getFloat(children[backgroundIndex], 'r');
        if (r != null) {
            if (isNaN(r))
                return "background 'r' is a non numeric value on the ILLUMINATION block";
            else if (r < 0 || r > 1)
                return "background 'r' must be a value between 0 and 1 on the ILLUMINATION block"
            else
                this.background[0] = r;
        } else
            this.onXMLMinorError("unable to parse R component of the background colour; assuming R = 0");

        // G.
        var g = this.reader.getFloat(children[backgroundIndex], 'g');
        if (g != null) {
            if (isNaN(g))
                return "background 'g' is a non numeric value on the ILLUMINATION block";
            else if (g < 0 || g > 1)
                return "background 'g' must be a value between 0 and 1 on the ILLUMINATION block"
            else
                this.background[1] = g;
        } else
            this.onXMLMinorError("unable to parse G component of the background colour; assuming G = 0");

        // B.
        var b = this.reader.getFloat(children[backgroundIndex], 'b');
        if (b != null) {
            if (isNaN(b))
                return "background 'b' is a non numeric value on the ILLUMINATION block";
            else if (b < 0 || b > 1)
                return "background 'b' must be a value between 0 and 1 on the ILLUMINATION block"
            else
                this.background[2] = b;
        } else
            this.onXMLMinorError("unable to parse B component of the background colour; assuming B = 0");

        // A.
        var a = this.reader.getFloat(children[backgroundIndex], 'a');
        if (a != null) {
            if (isNaN(a))
                return "background 'a' is a non numeric value on the ILLUMINATION block";
            else if (a < 0 || a > 1)
                return "background 'a' must be a value between 0 and 1 on the ILLUMINATION block"
            else
                this.background[3] = a;
        } else
            this.onXMLMinorError("unable to parse A component of the background colour; assuming A = 1");
    } else
        this.onXMLMinorError("background clear colour undefined; assuming (R, G, B, A) = (0, 0, 0, 1)");

    console.log("Parsed illumination");

    return null;
};

/**
 * Parses the <LIGHTS> node.
 */
MySceneGraph.prototype.parseLights = function(lightsNode) {
    var children = lightsNode.children;

    this.lights = [];
    var numLights = 0;

    var grandChildren = [];
    var nodeNames = [];

    // Any number of lights.
    for (var i = 0; i < children.length; i++) {
        if (children[i].nodeName != "LIGHT") {
            this.onXMLMinorError("unknown tag <" + children[i].nodeName + ">");
            continue;
        }

        // Get id of the current light.
        var lightId = this.reader.getString(children[i], 'id');
        if (lightId == null)
            return "no ID defined for light";

        // Checks for repeated IDs.
        if (this.lights[lightId] != null)
            return "ID must be unique for each light (conflict: ID = " + lightId + ")";

        grandChildren = children[i].children;
        // Specifications for the current light.

        nodeNames = [];
        for (var j = 0; j < grandChildren.length; j++) {
            nodeNames.push(grandChildren[j].nodeName);
        }

        // Gets indices of each element.
        var enableIndex = nodeNames.indexOf("enable");
        var positionIndex = nodeNames.indexOf("position");
        var ambientIndex = nodeNames.indexOf("ambient");
        var diffuseIndex = nodeNames.indexOf("diffuse");
        var specularIndex = nodeNames.indexOf("specular");

        // Light enable/disable
        var enableLight = true;
        if (enableIndex == -1) {
            this.onXMLMinorError("enable value missing for ID = " + lightId + "; assuming 'value = 1'");
        } else {
            var aux = this.reader.getFloat(grandChildren[enableIndex], 'value');
            if (aux == null) {
                this.onXMLMinorError("unable to parse value component of the 'enable light' field for ID = " + lightId + "; assuming 'value = 1'");
            } else if (isNaN(aux))
                return "'enable value' is a non numeric value on the LIGHTS block";
            else if (aux != 0 && aux != 1)
                return "'enable value' must be 0 or 1 on the LIGHTS block"
            else
                enableLight = aux == 0 ? false : true;
        }

        // Retrieves the light position.
        var positionLight = [];
        if (positionIndex != -1) {
            // x
            var x = this.reader.getFloat(grandChildren[positionIndex], 'x');
            if (x != null) {
                if (isNaN(x))
                    return "'x' is a non numeric value on the LIGHTS block";
                else
                    positionLight.push(x);
            } else
                return "unable to parse x-coordinate of the light position for ID = " + lightId;

            // y
            var y = this.reader.getFloat(grandChildren[positionIndex], 'y');
            if (y != null) {
                if (isNaN(y))
                    return "'y' is a non numeric value on the LIGHTS block";
                else
                    positionLight.push(y);
            } else
                return "unable to parse y-coordinate of the light position for ID = " + lightId;

            // z
            var z = this.reader.getFloat(grandChildren[positionIndex], 'z');
            if (z != null) {
                if (isNaN(z))
                    return "'z' is a non numeric value on the LIGHTS block";
                else
                    positionLight.push(z);
            } else
                return "unable to parse z-coordinate of the light position for ID = " + lightId;

            // w
            var w = this.reader.getFloat(grandChildren[positionIndex], 'w');
            if (w != null) {
                if (isNaN(w))
                    return "'w' is a non numeric value on the LIGHTS block";
                else if (w < 0 || w > 1)
                    return "'w' must be a value between 0 and 1 on the LIGHTS block"
                else
                    positionLight.push(w);
            } else
                return "unable to parse w-coordinate of the light position for ID = " + lightId;
        } else
            return "light position undefined for ID = " + lightId;

        // Retrieves the ambient component.
        var ambientIllumination = [];
        if (ambientIndex != -1) {
            // R
            var r = this.reader.getFloat(grandChildren[ambientIndex], 'r');
            if (r != null) {
                if (isNaN(r))
                    return "ambient 'r' is a non numeric value on the LIGHTS block";
                else if (r < 0 || r > 1)
                    return "ambient 'r' must be a value between 0 and 1 on the LIGHTS block"
                else
                    ambientIllumination.push(r);
            } else
                return "unable to parse R component of the ambient illumination for ID = " + lightId;

            // G
            var g = this.reader.getFloat(grandChildren[ambientIndex], 'g');
            if (g != null) {
                if (isNaN(g))
                    return "ambient 'g' is a non numeric value on the LIGHTS block";
                else if (g < 0 || g > 1)
                    return "ambient 'g' must be a value between 0 and 1 on the LIGHTS block"
                else
                    ambientIllumination.push(g);
            } else
                return "unable to parse G component of the ambient illumination for ID = " + lightId;

            // B
            var b = this.reader.getFloat(grandChildren[ambientIndex], 'b');
            if (b != null) {
                if (isNaN(b))
                    return "ambient 'b' is a non numeric value on the LIGHTS block";
                else if (b < 0 || b > 1)
                    return "ambient 'b' must be a value between 0 and 1 on the LIGHTS block"
                else
                    ambientIllumination.push(b);
            } else
                return "unable to parse B component of the ambient illumination for ID = " + lightId;

            // A
            var a = this.reader.getFloat(grandChildren[ambientIndex], 'a');
            if (a != null) {
                if (isNaN(a))
                    return "ambient 'a' is a non numeric value on the LIGHTS block";
                else if (a < 0 || a > 1)
                    return "ambient 'a' must be a value between 0 and 1 on the LIGHTS block"
                ambientIllumination.push(a);
            } else
                return "unable to parse A component of the ambient illumination for ID = " + lightId;
        } else
            return "ambient component undefined for ID = " + lightId;

        // Retrieves the diffuse component
        var diffuseIllumination = [];
        if (diffuseIndex != -1) {
            // R
            var r = this.reader.getFloat(grandChildren[diffuseIndex], 'r');
            if (r != null) {
                if (isNaN(r))
                    return "diffuse 'r' is a non numeric value on the LIGHTS block";
                else if (r < 0 || r > 1)
                    return "diffuse 'r' must be a value between 0 and 1 on the LIGHTS block"
                else
                    diffuseIllumination.push(r);
            } else
                return "unable to parse R component of the diffuse illumination for ID = " + lightId;

            // G
            var g = this.reader.getFloat(grandChildren[diffuseIndex], 'g');
            if (g != null) {
                if (isNaN(g))
                    return "diffuse 'g' is a non numeric value on the LIGHTS block";
                else if (g < 0 || g > 1)
                    return "diffuse 'g' must be a value between 0 and 1 on the LIGHTS block"
                else
                    diffuseIllumination.push(g);
            } else
                return "unable to parse G component of the diffuse illumination for ID = " + lightId;

            // B
            var b = this.reader.getFloat(grandChildren[diffuseIndex], 'b');
            if (b != null) {
                if (isNaN(b))
                    return "diffuse 'b' is a non numeric value on the LIGHTS block";
                else if (b < 0 || b > 1)
                    return "diffuse 'b' must be a value between 0 and 1 on the LIGHTS block"
                else
                    diffuseIllumination.push(b);
            } else
                return "unable to parse B component of the diffuse illumination for ID = " + lightId;

            // A
            var a = this.reader.getFloat(grandChildren[diffuseIndex], 'a');
            if (a != null) {
                if (isNaN(a))
                    return "diffuse 'a' is a non numeric value on the LIGHTS block";
                else if (a < 0 || a > 1)
                    return "diffuse 'a' must be a value between 0 and 1 on the LIGHTS block"
                else
                    diffuseIllumination.push(a);
            } else
                return "unable to parse A component of the diffuse illumination for ID = " + lightId;
        } else
            return "diffuse component undefined for ID = " + lightId;

        // Retrieves the specular component
        var specularIllumination = [];
        if (specularIndex != -1) {
            // R
            var r = this.reader.getFloat(grandChildren[specularIndex], 'r');
            if (r != null) {
                if (isNaN(r))
                    return "specular 'r' is a non numeric value on the LIGHTS block";
                else if (r < 0 || r > 1)
                    return "specular 'r' must be a value between 0 and 1 on the LIGHTS block"
                else
                    specularIllumination.push(r);
            } else
                return "unable to parse R component of the specular illumination for ID = " + lightId;

            // G
            var g = this.reader.getFloat(grandChildren[specularIndex], 'g');
            if (g != null) {
                if (isNaN(g))
                    return "specular 'g' is a non numeric value on the LIGHTS block";
                else if (g < 0 || g > 1)
                    return "specular 'g' must be a value between 0 and 1 on the LIGHTS block"
                else
                    specularIllumination.push(g);
            } else
                return "unable to parse G component of the specular illumination for ID = " + lightId;

            // B
            var b = this.reader.getFloat(grandChildren[specularIndex], 'b');
            if (b != null) {
                if (isNaN(b))
                    return "specular 'b' is a non numeric value on the LIGHTS block";
                else if (b < 0 || b > 1)
                    return "specular 'b' must be a value between 0 and 1 on the LIGHTS block"
                else
                    specularIllumination.push(b);
            } else
                return "unable to parse B component of the specular illumination for ID = " + lightId;

            // A
            var a = this.reader.getFloat(grandChildren[specularIndex], 'a');
            if (a != null) {
                if (isNaN(a))
                    return "specular 'a' is a non numeric value on the LIGHTS block";
                else if (a < 0 || a > 1)
                    return "specular 'a' must be a value between 0 and 1 on the LIGHTS block"
                else
                    specularIllumination.push(a);
            } else
                return "unable to parse A component of the specular illumination for ID = " + lightId;
        } else
            return "specular component undefined for ID = " + lightId;

        // Light global information.
        this.lights[lightId] = [enableLight, positionLight, ambientIllumination, diffuseIllumination, specularIllumination];
        numLights++;
    }

    if (numLights == 0)
        return "at least one light must be defined";
    else if (numLights > 8)
        this.onXMLMinorError("too many lights defined; WebGL imposes a limit of 8 lights");

    console.log("Parsed lights");

    return null;
};

/**
 * Parses the <TEXTURES> block.
 * Texturas devem estar normalizadas
 * Associa onde calha a textura no objeto
 * amplif_factor é a transformação de coordenada da textura para o objeto real.
 * d = tamanho do objeto real
 * s = é o tamanho que a textura cobre num objeto 3d
 * 1 -> af
 * s <- af_s
 * Não é para a textura ser esticada para cobrir, é para repetir a textura.
 */
MySceneGraph.prototype.parseTextures = function(texturesNode) {
    this.textures = [];

    var eachTexture = texturesNode.children;
    // Each texture.

    var oneTextureDefined = false;

    for (var i = 0; i < eachTexture.length; i++) {
        var nodeName = eachTexture[i].nodeName;
        if (nodeName == "TEXTURE") {
            // Retrieves texture ID.
            var textureID = this.reader.getString(eachTexture[i], 'id');
            if (textureID == null)
                return "failed to parse texture ID";
            // Checks if ID is valid.
            if (this.textures[textureID] != null)
                return "texture ID must unique (conflict with ID = " + textureID + ")";

            var texSpecs = eachTexture[i].children;
            var filepath = null;
            var amplifFactorS = null;
            var amplifFactorT = null;
            // Retrieves texture specifications.
            for (var j = 0; j < texSpecs.length; j++) {
                var name = texSpecs[j].nodeName;
                if (name == "file") {
                    if (filepath != null)
                        return "duplicate file paths in texture with ID = " + textureID;

                    filepath = this.reader.getString(texSpecs[j], 'path');
                    if (filepath == null)
                        return "unable to parse texture file path for ID = " + textureID;
                } else if (name == "amplif_factor") {
                    if (amplifFactorS != null || amplifFactorT != null)
                        return "duplicate amplification factors in texture with ID = " + textureID;

                    amplifFactorS = this.reader.getFloat(texSpecs[j], 's');
                    amplifFactorT = this.reader.getFloat(texSpecs[j], 't');

                    if (amplifFactorS == null || amplifFactorT == null)
                        return "unable to parse texture amplification factors for ID = " + textureID;
                    else if (isNaN(amplifFactorS))
                        return "'amplifFactorS' is a non numeric value";
                    else if (isNaN(amplifFactorT))
                        return "'amplifFactorT' is a non numeric value";
                    else if (amplifFactorS <= 0 || amplifFactorT <= 0)
                        return "value for amplifFactor must be positive";
                } else
                    this.onXMLMinorError("unknown tag name <" + name + ">");
            }

            if (filepath == null)
                return "file path undefined for texture with ID = " + textureID;
            else if (amplifFactorS == null)
                return "s amplification factor undefined for texture with ID = " + textureID;
            else if (amplifFactorT == null)
                return "t amplification factor undefined for texture with ID = " + textureID;

            var texture = new CGFtexture(this.scene, "./scenes/" + filepath);

            this.textures[textureID] = [texture, amplifFactorS, amplifFactorT];
            oneTextureDefined = true;
        } else
            this.onXMLMinorError("unknown tag name <" + nodeName + ">");
    }

    if (!oneTextureDefined)
        return "at least one texture must be defined in the TEXTURES block";

    console.log("Parsed textures");
};

/**
 * Parses the <MATERIALS> node.
 * I = KaIa + KdIp cos(O) + KsIp (cos(a))^n
 * shininess = n
 * Emissao serve para objetos fluorescentes, nao serve para eliminar objetos, nao elimina os outros objetos
 */
MySceneGraph.prototype.parseMaterials = function(materialsNode) {
    var children = materialsNode.children;
    // Each material.

    this.materials = [];

    var oneMaterialDefined = false;

    for (var i = 0; i < children.length; i++) {
        if (children[i].nodeName != "MATERIAL") {
            this.onXMLMinorError("unknown tag name <" + children[i].nodeName + ">");
            continue;
        }

        var materialID = this.reader.getString(children[i], 'id');
        if (materialID == null)
            return "no ID defined for material";

        if (this.materials[materialID] != null)
            return "ID must be unique for each material (conflict: ID = " + materialID + ")";

        var materialSpecs = children[i].children;

        var nodeNames = [];

        for (var j = 0; j < materialSpecs.length; j++)
            nodeNames.push(materialSpecs[j].nodeName);

        // Determines the values for each field.
        // Shininess.
        var shininessIndex = nodeNames.indexOf("shininess");
        if (shininessIndex == -1)
            return "no shininess value defined for material with ID = " + materialID;
        var shininess = this.reader.getFloat(materialSpecs[shininessIndex], 'value');
        if (shininess == null)
            return "unable to parse shininess value for material with ID = " + materialID;
        else if (isNaN(shininess))
            return "'shininess' is a non numeric value";
        else if (shininess <= 0)
            return "'shininess' must be positive";

        // Specular component.
        var specularIndex = nodeNames.indexOf("specular");
        if (specularIndex == -1)
            return "no specular component defined for material with ID = " + materialID;
        var specularComponent = [];
        // R.
        var r = this.reader.getFloat(materialSpecs[specularIndex], 'r');
        if (r == null)
            return "unable to parse R component of specular reflection for material with ID = " + materialID;
        else if (isNaN(r))
            return "specular 'r' is a non numeric value on the MATERIALS block";
        else if (r < 0 || r > 1)
            return "specular 'r' must be a value between 0 and 1 on the MATERIALS block"
        specularComponent.push(r);
        // G.
        var g = this.reader.getFloat(materialSpecs[specularIndex], 'g');
        if (g == null)
            return "unable to parse G component of specular reflection for material with ID = " + materialID;
        else if (isNaN(g))
            return "specular 'g' is a non numeric value on the MATERIALS block";
        else if (g < 0 || g > 1)
            return "specular 'g' must be a value between 0 and 1 on the MATERIALS block";
        specularComponent.push(g);
        // B.
        var b = this.reader.getFloat(materialSpecs[specularIndex], 'b');
        if (b == null)
            return "unable to parse B component of specular reflection for material with ID = " + materialID;
        else if (isNaN(b))
            return "specular 'b' is a non numeric value on the MATERIALS block";
        else if (b < 0 || b > 1)
            return "specular 'b' must be a value between 0 and 1 on the MATERIALS block";
        specularComponent.push(b);
        // A.
        var a = this.reader.getFloat(materialSpecs[specularIndex], 'a');
        if (a == null)
            return "unable to parse A component of specular reflection for material with ID = " + materialID;
        else if (isNaN(a))
            return "specular 'a' is a non numeric value on the MATERIALS block";
        else if (a < 0 || a > 1)
            return "specular 'a' must be a value between 0 and 1 on the MATERIALS block";
        specularComponent.push(a);

        // Diffuse component.
        var diffuseIndex = nodeNames.indexOf("diffuse");
        if (diffuseIndex == -1)
            return "no diffuse component defined for material with ID = " + materialID;
        var diffuseComponent = [];
        // R.
        r = this.reader.getFloat(materialSpecs[diffuseIndex], 'r');
        if (r == null)
            return "unable to parse R component of diffuse reflection for material with ID = " + materialID;
        else if (isNaN(r))
            return "diffuse 'r' is a non numeric value on the MATERIALS block";
        else if (r < 0 || r > 1)
            return "diffuse 'r' must be a value between 0 and 1 on the MATERIALS block";
        diffuseComponent.push(r);
        // G.
        g = this.reader.getFloat(materialSpecs[diffuseIndex], 'g');
        if (g == null)
            return "unable to parse G component of diffuse reflection for material with ID = " + materialID;
        else if (isNaN(g))
            return "diffuse 'g' is a non numeric value on the MATERIALS block";
        else if (g < 0 || g > 1)
            return "diffuse 'g' must be a value between 0 and 1 on the MATERIALS block";
        diffuseComponent.push(g);
        // B.
        b = this.reader.getFloat(materialSpecs[diffuseIndex], 'b');
        if (b == null)
            return "unable to parse B component of diffuse reflection for material with ID = " + materialID;
        else if (isNaN(b))
            return "diffuse 'b' is a non numeric value on the MATERIALS block";
        else if (b < 0 || b > 1)
            return "diffuse 'b' must be a value between 0 and 1 on the MATERIALS block";
        diffuseComponent.push(b);
        // A.
        a = this.reader.getFloat(materialSpecs[diffuseIndex], 'a');
        if (a == null)
            return "unable to parse A component of diffuse reflection for material with ID = " + materialID;
        else if (isNaN(a))
            return "diffuse 'a' is a non numeric value on the MATERIALS block";
        else if (a < 0 || a > 1)
            return "diffuse 'a' must be a value between 0 and 1 on the MATERIALS block";
        diffuseComponent.push(a);

        // Ambient component.
        var ambientIndex = nodeNames.indexOf("ambient");
        if (ambientIndex == -1)
            return "no ambient component defined for material with ID = " + materialID;
        var ambientComponent = [];
        // R.
        r = this.reader.getFloat(materialSpecs[ambientIndex], 'r');
        if (r == null)
            return "unable to parse R component of ambient reflection for material with ID = " + materialID;
        else if (isNaN(r))
            return "ambient 'r' is a non numeric value on the MATERIALS block";
        else if (r < 0 || r > 1)
            return "ambient 'r' must be a value between 0 and 1 on the MATERIALS block";
        ambientComponent.push(r);
        // G.
        g = this.reader.getFloat(materialSpecs[ambientIndex], 'g');
        if (g == null)
            return "unable to parse G component of ambient reflection for material with ID = " + materialID;
        else if (isNaN(g))
            return "ambient 'g' is a non numeric value on the MATERIALS block";
        else if (g < 0 || g > 1)
            return "ambient 'g' must be a value between 0 and 1 on the MATERIALS block";
        ambientComponent.push(g);
        // B.
        b = this.reader.getFloat(materialSpecs[ambientIndex], 'b');
        if (b == null)
            return "unable to parse B component of ambient reflection for material with ID = " + materialID;
        else if (isNaN(b))
            return "ambient 'b' is a non numeric value on the MATERIALS block";
        else if (b < 0 || b > 1)
            return "ambient 'b' must be a value between 0 and 1 on the MATERIALS block";
        ambientComponent.push(b);
        // A.
        a = this.reader.getFloat(materialSpecs[ambientIndex], 'a');
        if (a == null)
            return "unable to parse A component of ambient reflection for material with ID = " + materialID;
        else if (isNaN(a))
            return "ambient 'a' is a non numeric value on the MATERIALS block";
        else if (a < 0 || a > 1)
            return "ambient 'a' must be a value between 0 and 1 on the MATERIALS block";
        ambientComponent.push(a);

        // Emission component.
        var emissionIndex = nodeNames.indexOf("emission");
        if (emissionIndex == -1)
            return "no emission component defined for material with ID = " + materialID;
        var emissionComponent = [];
        // R.
        r = this.reader.getFloat(materialSpecs[emissionIndex], 'r');
        if (r == null)
            return "unable to parse R component of emission for material with ID = " + materialID;
        else if (isNaN(r))
            return "emisson 'r' is a non numeric value on the MATERIALS block";
        else if (r < 0 || r > 1)
            return "emisson 'r' must be a value between 0 and 1 on the MATERIALS block";
        emissionComponent.push(r);
        // G.
        g = this.reader.getFloat(materialSpecs[emissionIndex], 'g');
        if (g == null)
            return "unable to parse G component of emission for material with ID = " + materialID;
        if (isNaN(g))
            return "emisson 'g' is a non numeric value on the MATERIALS block";
        else if (g < 0 || g > 1)
            return "emisson 'g' must be a value between 0 and 1 on the MATERIALS block";
        emissionComponent.push(g);
        // B.
        b = this.reader.getFloat(materialSpecs[emissionIndex], 'b');
        if (b == null)
            return "unable to parse B component of emission for material with ID = " + materialID;
        else if (isNaN(b))
            return "emisson 'b' is a non numeric value on the MATERIALS block";
        else if (b < 0 || b > 1)
            return "emisson 'b' must be a value between 0 and 1 on the MATERIALS block";
        emissionComponent.push(b);
        // A.
        a = this.reader.getFloat(materialSpecs[emissionIndex], 'a');
        if (a == null)
            return "unable to parse A component of emission for material with ID = " + materialID;
        else if (isNaN(a))
            return "emisson 'a' is a non numeric value on the MATERIALS block";
        else if (a < 0 || a > 1)
            return "emisson 'a' must be a value between 0 and 1 on the MATERIALS block";
        emissionComponent.push(a);

        // Creates material with the specified characteristics.
        var newMaterial = new CGFappearance(this.scene);
        newMaterial.setShininess(shininess);
        newMaterial.setAmbient(ambientComponent[0], ambientComponent[1], ambientComponent[2], ambientComponent[3]);
        newMaterial.setDiffuse(diffuseComponent[0], diffuseComponent[1], diffuseComponent[2], diffuseComponent[3]);
        newMaterial.setSpecular(specularComponent[0], specularComponent[1], specularComponent[2], specularComponent[3]);
        newMaterial.setEmission(emissionComponent[0], emissionComponent[1], emissionComponent[2], emissionComponent[3]);
        this.materials[materialID] = newMaterial;
        oneMaterialDefined = true;
    }

    if (!oneMaterialDefined)
        return "at least one material must be defined on the MATERIALS block";

    // Generates a default material.
    this.generateDefaultMaterial();

    console.log("Parsed materials");
};

/**
 * Parses the <ANIMATIONS> block
 */
MySceneGraph.prototype.parseAnimations = function(animationsNode) {
    var children = animationsNode.children;

    this.animations = [];

    for (var i = 0; i < children.length; i++) {
        if (children[i].nodeName != "ANIMATION") {
            this.onXMLMinorError("unknown tag name <" + children[i].nodeName + ">");
            continue;
        }

        var animationID = this.reader.getString(children[i], 'id');
        if (animationID == null)
            return "no ID defined for animation";

        if (this.animations[animationID] != null)
            return "ID must be unique for each animation (conflict: ID = " + animationID + ")";

        var animationType = this.reader.getString(children[i], 'type');
        var animationSpecs = children[i].children;

        if (animationSpecs.length < 0) {
            return "this animation has no specs";
        }

        var nodeNames = [];
        switch (animationType) {
            case "linear":
            case "bezier":
                var animationSpeed = this.reader.getFloat(children[i], 'speed');
                var controlPoints = [];

                if (animationType == "bezier" && animationSpecs.length < 4) {
                    return "a bezier animation needs at least 4 control points";
                } else if (animationSpecs.length < 2) {
                    return "a linear animation needs at least 2 control points";
                }

                for (var j = 0; j < animationSpecs.length; j++) {
                    if (animationSpecs[j].nodeName != "controlpoint") {
                        return "invalid Specs for linear animation";
                    }

                    var xx = this.reader.getFloat(animationSpecs[j], 'xx');
                    if (xx == null) {
                        this.onXMLMinorError("unable to parse xx-coordinate for the " + j + "º control point of the linear animation");
                        break;
                    } else if (isNaN(xx))
                        return "non-numeric value for xx-coordinate of the" + j + "º control point of the linear animation";

                    var yy = this.reader.getFloat(animationSpecs[j], 'yy');
                    if (yy == null) {
                        this.onXMLMinorError("unable to parse yy-coordinate for the " + j + "º control point of the linear animation");
                        break;
                    } else if (isNaN(yy))
                        return "non-numeric value for yy-coordinate of the" + j + "º control point of the linear animation";

                    var zz = this.reader.getFloat(animationSpecs[j], 'zz');
                    if (zz == null) {
                        this.onXMLMinorError("unable to parse zz-coordinate for the " + j + "º control point of the linear animation");
                        break;
                    } else if (isNaN(zz))
                        return "non-numeric value for zz-coordinate of the" + j + "º control point of the linear animation";
                    controlPoints.push([xx, yy, zz]);
                }

                if (animationType == "linear") {
                    this.animations[animationID] = new LinearAnimation(animationSpeed, controlPoints);
                } else if (animationType == "bezier") {
                    this.animations[animationID] = new BezierAnimation(animationSpeed, controlPoints);
                }
                break;

            case "circular":
                var animationSpeed = this.reader.getFloat(children[i], 'speed');
                var centerx = this.reader.getFloat(children[i], 'centerx');
                if (centerx == null) {
                    this.onXMLMinorError("unable to parse centerx for the circular animation");
                    break;
                } else if (isNaN(centerx))
                    return "non-numeric value for the parse centerx for the circular animation";

                var centery = this.reader.getFloat(children[i], 'centery');
                if (centerx == null) {
                    this.onXMLMinorError("unable to parse centery for the circular animation");
                    break;
                } else if (isNaN(centery))
                    return "non-numeric value for the parse centery for the circular animation";

                var centerz = this.reader.getFloat(children[i], 'centerz');
                if (centerz == null) {
                    this.onXMLMinorError("unable to parse centerz for the circular animation");
                    break;
                } else if (isNaN(centerz))
                    return "non-numeric value for the parse centerz for the circular animation";

                var radius = this.reader.getFloat(children[i], 'radius');
                if (radius < 0) {
                    return "invalid radius value: negative value";
                }
                if (radius == null) {
                    this.onXMLMinorError("unable to parse radius for the circular animation");
                    break;
                } else if (isNaN(radius))
                    return "non-numeric value for the parse radius for the circular animation";

                var startang = this.reader.getFloat(children[i], 'startang');
                if (startang == null) {
                    this.onXMLMinorError("unable to parse startang for the circular animation");
                    break;
                } else if (isNaN(startang))
                    return "non-numeric value for the parse startang for the circular animation";

                var rotang = this.reader.getFloat(children[i], 'rotang');
                if (rotang == null) {
                    this.onXMLMinorError("unable to parse rotang for the circular animation");
                    break;
                } else if (isNaN(rotang))
                    return "non-numeric value for the parse rotang for the circular animation";

                var center = vec3.fromValues(centerx, centery, centerz);
                this.animations[animationID] = new CircularAnimation(animationSpeed, center, radius, startang, rotang);
                break;

            case "combo":
                var animationList = [];
                for (var j = 0; j < animationSpecs.length; j++) {
                    if (animationSpecs[j].nodeName != "SPANREF") {
                        return "invalid Specs for combo animation";
                    }

                    var spanID = this.reader.getString(animationSpecs[j], 'id');
                    if (spanID == null) {
                        this.onXMLMinorError("unable to parse id of the " + j + " span ref of the combo animation");
                        break;
                    } else if (this.animations[spanID] instanceof ComboAnimation) {
                        return "a combo animation cannot reference another combo animation";
                    }

                    animationList.push(this.animations[spanID]);
                }

                this.animations[animationID] = new ComboAnimation(animationList);
                break;
        }
    }
    console.log("Parsed animations");
}
/**
 * Parses the <NODES> block.
 */
MySceneGraph.prototype.parseNodes = function(nodesNode) {
    // Traverses nodes.
    var children = nodesNode.children;

    for (var i = 0; i < children.length; i++) {
        var nodeName;
        if ((nodeName = children[i].nodeName) == "ROOT") {
            // Retrieves root node.
            if (this.idRoot != null)
                return "there can only be one root node";
            else {
                var root = this.reader.getString(children[i], 'id');
                if (root == null)
                    return "failed to retrieve root node ID";
                this.idRoot = root;
            }
        } else if (nodeName == "NODE") {
            // Retrieves node ID.
            var nodeID = this.reader.getString(children[i], 'id');
            if (nodeID == null)
                return "failed to retrieve node ID";
            // Checks if ID is valid.
            if (this.nodes[nodeID] != null)
                return "node ID must be unique (conflict: ID = " + nodeID + ")";

            //Checks if node is selectable
            var selectableNode = false;
            if (this.reader.hasAttribute(children[i], 'selectable')) {
                selectableNode = this.reader.getBoolean(children[i], 'selectable');
            }

            this.log("Processing node " + nodeID);

            // Creates node.
            if (nodeID == 'shiftago') {
                var dimension = this.reader.getFloat(children[i], 'dimension');
                this.nodes[nodeID] = new Shiftago(this, nodeID, selectableNode, dimension);
            } else {
                this.nodes[nodeID] = new MyGraphNode(this, nodeID, selectableNode);
            }

            if (selectableNode)
                this.scene.selFolder.add(this.nodes[nodeID], 'selectable').name(nodeID);

            // Gathers child nodes.
            var nodeSpecs = children[i].children;
            var specsNames = [];
            var possibleValues = ["MATERIAL", "TEXTURE", "TRANSLATION", "ROTATION", "SCALE", "ANIMATIONREFS", "DESCENDANTS"];
            for (var j = 0; j < nodeSpecs.length; j++) {
                var name = nodeSpecs[j].nodeName;
                specsNames.push(nodeSpecs[j].nodeName);

                // Warns against possible invalid tag names.
                if (possibleValues.indexOf(name) == -1)
                    this.onXMLMinorError("unknown tag <" + name + ">");
            }

            // Retrieves material ID.
            var materialIndex = specsNames.indexOf("MATERIAL");
            if (materialIndex == -1)
                return "material must be defined (node ID = " + nodeID + ")";
            var materialID = this.reader.getString(nodeSpecs[materialIndex], 'id');
            if (materialID == null)
                return "unable to parse material ID (node ID = " + nodeID + ")";
            if (materialID != "null" && this.materials[materialID] == null)
                return "ID does not correspond to a valid material (node ID = " + nodeID + ")";

            this.nodes[nodeID].materialID = materialID;

            // Retrieves texture ID.
            var textureIndex = specsNames.indexOf("TEXTURE");
            if (textureIndex == -1)
                return "texture must be defined (node ID = " + nodeID + ")";
            var textureID = this.reader.getString(nodeSpecs[textureIndex], 'id');
            if (textureID == null)
                return "unable to parse texture ID (node ID = " + nodeID + ")";
            if (textureID != "null" && textureID != "clear" && this.textures[textureID] == null)
                return "ID does not correspond to a valid texture (node ID = " + nodeID + ")";

            this.nodes[nodeID].textureID = textureID;

            // Retrieves possible transformations.
            for (var j = 0; j < nodeSpecs.length; j++) {
                switch (nodeSpecs[j].nodeName) {
                    case "TRANSLATION":
                        // Retrieves translation parameters.
                        var x = this.reader.getFloat(nodeSpecs[j], 'x');
                        if (x == null) {
                            this.onXMLMinorError("unable to parse x-coordinate of translation; discarding transform");
                            break;
                        } else if (isNaN(x))
                            return "non-numeric value for x-coordinate of translation (node ID = " + nodeID + ")";

                        var y = this.reader.getFloat(nodeSpecs[j], 'y');
                        if (y == null) {
                            this.onXMLMinorError("unable to parse y-coordinate of translation; discarding transform");
                            break;
                        } else if (isNaN(y))
                            return "non-numeric value for y-coordinate of translation (node ID = " + nodeID + ")";

                        var z = this.reader.getFloat(nodeSpecs[j], 'z');
                        if (z == null) {
                            this.onXMLMinorError("unable to parse z-coordinate of translation; discarding transform");
                            break;
                        } else if (isNaN(z))
                            return "non-numeric value for z-coordinate of translation (node ID = " + nodeID + ")";

                        mat4.translate(this.nodes[nodeID].transformMatrix, this.nodes[nodeID].transformMatrix, [x, y, z]);
                        break;
                    case "ROTATION":
                        // Retrieves rotation parameters.
                        var axis = this.reader.getItem(nodeSpecs[j], 'axis', ['x', 'y', 'z']);
                        if (axis == null) {
                            this.onXMLMinorError("unable to parse rotation axis; discarding transform");
                            break;
                        }
                        var angle = this.reader.getFloat(nodeSpecs[j], 'angle');
                        if (angle == null) {
                            this.onXMLMinorError("unable to parse rotation angle; discarding transform");
                            break;
                        } else if (isNaN(angle))
                            return "non-numeric value for rotation angle (node ID = " + nodeID + ")";

                        mat4.rotate(this.nodes[nodeID].transformMatrix, this.nodes[nodeID].transformMatrix, angle * DEGREE_TO_RAD, this.axisCoords[axis]);
                        break;
                    case "SCALE":
                        // Retrieves scale parameters.
                        var sx = this.reader.getFloat(nodeSpecs[j], 'sx');
                        if (sx == null) {
                            this.onXMLMinorError("unable to parse x component of scaling; discarding transform");
                            break;
                        } else if (isNaN(sx))
                            return "non-numeric value for x component of scaling (node ID = " + nodeID + ")";

                        var sy = this.reader.getFloat(nodeSpecs[j], 'sy');
                        if (sy == null) {
                            this.onXMLMinorError("unable to parse y component of scaling; discarding transform");
                            break;
                        } else if (isNaN(sy))
                            return "non-numeric value for y component of scaling (node ID = " + nodeID + ")";

                        var sz = this.reader.getFloat(nodeSpecs[j], 'sz');
                        if (sz == null) {
                            this.onXMLMinorError("unable to parse z component of scaling; discarding transform");
                            break;
                        } else if (isNaN(sz))
                            return "non-numeric value for z component of scaling (node ID = " + nodeID + ")";

                        mat4.scale(this.nodes[nodeID].transformMatrix, this.nodes[nodeID].transformMatrix, [sx, sy, sz]);
                        break;
                    default:
                        break;
                }
            }

            // Retrieves possible animations.
            var animationIndex = specsNames.indexOf("ANIMATIONREFS");
            if (animationIndex != -1) {
                var animationsDescendants = nodeSpecs[animationIndex].children;
                for (var j = 0; j < animationsDescendants.length; j++) {
                    if (animationsDescendants[j].nodeName == "ANIMATIONREF") {
                        var animationID = this.reader.getString(animationsDescendants[j], 'id');
                        this.log("   AnimationRef: " + animationID);
                        if (animationID == null)
                            return "unable to parse animation id";
                        if (this.animations[animationID] == null)
                            return "ID does not correspond to a valid animation";
                        this.nodes[nodeID].animationID.push(animationID);
                    }
                }
                this.nodes[nodeID].actualAnimation = 0;
                this.animations[this.nodes[nodeID].animationID[0]].stop = false;
            }

            // Retrieves information about children.
            var descendantsIndex = specsNames.indexOf("DESCENDANTS");
            if (descendantsIndex == -1)
                return "an intermediate node must have descendants";

            var descendants = nodeSpecs[descendantsIndex].children;

            var sizeChildren = 0;
            for (var j = 0; j < descendants.length; j++) {
                if (descendants[j].nodeName == "NODEREF") {
                    var curId = this.reader.getString(descendants[j], 'id');

                    this.log("   Descendant: " + curId);

                    if (curId == null)
                        this.onXMLMinorError("unable to parse descendant id");
                    else if (curId == nodeID)
                        return "a node may not be a child of its own";
                    else {
                        this.nodes[nodeID].addChild(curId);
                        sizeChildren++;
                    }
                } else if (descendants[j].nodeName == "LEAF") {
                    var type = this.reader.getItem(descendants[j], 'type', ['rectangle', 'cylinder', 'sphere', 'triangle', 'patch']);

                    if (type != null) {
                        this.log("   Leaf: " + type);
                        this.nodes[nodeID].addLeaf(new MyGraphLeaf(this, descendants[j]));

                        sizeChildren++;
                    } else
                        this.warn("Error in leaf");
                } else
                    this.onXMLMinorError("unknown tag <" + descendants[j].nodeName + ">");

            }
            if (sizeChildren == 0)
                return "at least one descendant must be defined for each intermediate node";
        } else
            this.onXMLMinorError("unknown tag name <" + nodeName + ">");
    }

    console.log("Parsed nodes");
    return null;
};

/*
 * Callback to be executed on any read error
 */
MySceneGraph.prototype.onXMLError = function(message) {
    console.error("XML Loading Error: " + message);
    this.loadedOk = false;
};

/**
 * Callback to be executed on any minor error, showing a warning on the console.
 */
MySceneGraph.prototype.onXMLMinorError = function(message) {
    console.warn("Warning: " + message);
};

MySceneGraph.prototype.log = function(message) {
    console.log("   " + message);
};

/**
 * Generates a default material, with a random name.
 * This material will be passed onto the root node, which may override it.
 */
MySceneGraph.prototype.generateDefaultMaterial = function() {
    var materialDefault = new CGFappearance(this.scene);
    materialDefault.setShininess(1);
    materialDefault.setSpecular(0, 0, 0, 1);
    materialDefault.setDiffuse(0.5, 0.5, 0.5, 1);
    materialDefault.setAmbient(0, 0, 0, 1);
    materialDefault.setEmission(0, 0, 0, 1);

    // Generates random material ID not currently in use.
    this.defaultMaterialID = null;
    do this.defaultMaterialID = MySceneGraph.generateRandomString(5);
    while (this.materials[this.defaultMaterialID] != null);

    this.materials[this.defaultMaterialID] = materialDefault;
};

/**
 * Generates a random string of the specified length.
 */
MySceneGraph.generateRandomString = function(length) {
    // Generates an array of random integer ASCII codes of the specified length
    // and returns a string of the specified length.
    var numbers = [];
    for (var i = 0; i < length; i++)
        numbers.push(Math.floor(Math.random() * 256)); // Random ASCII code.

    return String.fromCharCode.apply(null, numbers);
};

/**
 * Displays the scene, processing each node, starting in the root node.
 */
MySceneGraph.prototype.displayScene = function() {
    this.transformationStack = [];
    this.animationStack = [];
    this.materialStack = [];
    this.textureStack = [];
    this.pickerStack = [];

    var temptrans = mat4.create();
    var tempanim = mat4.create();
    mat4.identity(temptrans);
    mat4.identity(tempanim);
    this.transformationStack.push(temptrans);
    this.animationStack.push(tempanim);
    this.pickerStack.push('none');

    this.displayNode(this.idRoot);

    if (!this.scene.glow) {
        this.isMarking = false;
        this.scene.setActiveShader(this.scene.defaultShader);
    } else {
        this.isMarking = true;
        this.scene.setActiveShader(this.selectableShader);
    }

};

/**
 * Displays a node.
 * @param nodeID id of the node to be displayed
 */
MySceneGraph.prototype.displayNode = function(nodeID) {
    var transformation = this.transformationStack[this.transformationStack.length - 1];
    var node = this.nodes[nodeID];
    var nodeTransformation = node.transformMatrix;
    var animation = node.animationID;
    var actualAnimationID = node.actualAnimation;
    var material = node.materialID;
    var texture = node.textureID;
    var children = node.children;
    var leaves = node.leaves;

    var matrixtrans = mat4.create();
    mat4.multiply(matrixtrans, transformation, nodeTransformation);
    if (actualAnimationID != -1 && this.animations[animation[actualAnimationID]].state == 'end') {
        if (actualAnimationID < animation.length - 1) {
            actualAnimationID += 1;
            node.actualAnimation = actualAnimationID;
            this.animations[animation[actualAnimationID]].stop = false;
        } else {
            actualAnimationID = animation.length - 1;
            var animationID = animation[actualAnimationID];
            mat4.multiply(node.transformMatrix, node.transformMatrix, this.animations[animationID].animTranslateMatrix);
            actualAnimationID = -1;
            this.nodes[nodeID].actualAnimation = -1;
        }
    }
    if (actualAnimationID != -1) {
        var animationID = animation[actualAnimationID];
        mat4.multiply(matrixtrans, matrixtrans, this.animations[animationID].animTranslateMatrix);
        mat4.multiply(matrixtrans, matrixtrans, this.animations[animationID].animRotationMatrix);
    }
    this.transformationStack.push(matrixtrans);

    var isMarker = false;
    if (this.isMarking == false && node.selectable == true) {
        this.isMarking = true;
        isMarker = true;
        this.scene.setActiveShader(this.selectableShader);
    }

    if (material != 'null')
        this.materialStack.push(material);
    if (texture != 'null')
        this.textureStack.push(texture);

    var idForPick = 'null';
    if (typeof children != 'undefined' && children.length > 0) {
        if (nodeID.substring(0, 8) == 'position') {
            idForPick = parseInt(nodeID.substring(8, 10));
            this.pickerStack.push(idForPick);
        }
        for (child of children) {
            this.displayNode(child);
        }
    }

    if (typeof leaves != 'undefined' && leaves.length > 0) {
        if (nodeID.substring(0, 8) == 'position') {
            idForPick = parseInt(nodeID.substring(8, 10));
            this.pickerStack.push(idForPick);
        }
        for (leaf of leaves) {
            this.displayLeaf(leaf);
        }
    }

    this.transformationStack.pop();
    if (animation != 'null')
        this.animationStack.pop();
    if (material != 'null')
        this.materialStack.pop();
    if (texture != 'null')
        this.textureStack.pop();
    if (idForPick != 'null')
        this.pickerStack.pop();
};

/**
 * Displays a leaf.
 * @param leaf object leaf to be displayed
 */
MySceneGraph.prototype.displayLeaf = function(leaf) {
    this.scene.pushMatrix();
    var transformation = this.transformationStack[this.transformationStack.length - 1];
    this.scene.multMatrix(transformation);

    var material = this.materialStack[this.materialStack.length - 1];
    var materialToApply = this.materials[material];

    var texture = 'clear';
    if (this.textureStack.length > 0) {
        texture = this.textureStack[this.textureStack.length - 1];
    }

    if (texture != 'clear' && texture != 'null') {
        var textureToApply = this.textures[texture];
        materialToApply.setTexture(textureToApply[0]);

        if (leaf.type == 'rectangle' || leaf.type == 'triangle') {
            leaf.object.updateTextureCoords(textureToApply[1], textureToApply[2]);
        }
    } else {
        materialToApply.setTexture(null);
    }

    materialToApply.apply();

    var idForPick = this.pickerStack[this.pickerStack.length - 1];
    if (idForPick != 'null') {
        this.scene.registerForPick(idForPick, leaf.object);
    }

    leaf.object.display();

    this.scene.popMatrix();
};
