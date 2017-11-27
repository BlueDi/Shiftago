attribute vec3 aVertexPosition;
attribute vec3 aVertexNormal;
attribute vec2 aTextureCoord;

uniform mat4 uMVMatrix;
uniform mat4 uPMatrix;
uniform mat4 uNMatrix;

uniform float normScale;

#define NUMBER_OF_LIGHTS 8

struct lightProperties {
    vec4 position;                  // Default: (0, 0, 1, 0)
    vec4 ambient;                   // Default: (0, 0, 0, 1)
    vec4 diffuse;                   // Default: (0, 0, 0, 1)
    vec4 specular;                  // Default: (0, 0, 0, 1)
    vec4 half_vector;
    vec3 spot_direction;            // Default: (0, 0, -1)
    float spot_exponent;            // Default: 0 (possible values [0, 128]
    float spot_cutoff;              // Default: 180 (possible values [0, 90] or 180)
    float constant_attenuation;     // Default: 1 (value must be >= 0)
    float linear_attenuation;       // Default: 0 (value must be >= 0)
    float quadratic_attenuation;    // Default: 0 (value must be >= 0)
    bool enabled;                   // Deafult: false
};

uniform lightProperties uLight[NUMBER_OF_LIGHTS];

varying vec3 vNormal;
varying vec3 vLightDir;
varying vec3 vEyeVec;

uniform bool uUseTexture;
varying vec2 vTextureCoord;

void main()
{

	vec4 vertex = uMVMatrix * vec4(aVertexPosition + aVertexNormal * normScale, 1.0);

	gl_Position = uPMatrix  * vertex;

    vNormal = vec3(uNMatrix * vec4(aVertexNormal, 1.0));

    vEyeVec = -vec3(vertex.xyz);

	if (uLight[0].enabled)
		if (uLight[0].position.w == 1.0)
			vLightDir = vertex.xyz - uLight[0].position.xyz;

	if (uUseTexture)
        vTextureCoord = aTextureCoord;
}
