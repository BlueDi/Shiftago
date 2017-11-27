#define NUMBER_OF_LIGHTS 8

#ifdef GL_ES
precision highp float;
#endif


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

struct materialProperties {
    vec4 ambient;                   // Default: (0, 0, 0, 1)
    vec4 diffuse;                   // Default: (0, 0, 0, 1)
    vec4 specular;                  // Default: (0, 0, 0, 1)
    vec4 emission;                  // Default: (0, 0, 0, 1)
    float shininess;                // Default: 0 (possible values [0, 128])
};

uniform mat4 uPMatrix;

uniform vec4 uGlobalAmbient;

uniform lightProperties uLight[NUMBER_OF_LIGHTS];

uniform materialProperties uFrontMaterial;

varying vec3 vNormal;
varying vec3 vLightDir;
varying vec3 vEyeVec;


vec4 calcDirectionalLight(vec3 E, vec3 L, vec3 N) {
    float lambertTerm = dot(N, -L);

    vec4 Ia = (uLight[0].ambient + uGlobalAmbient) * uFrontMaterial.ambient;

    vec4 Id = vec4(0.0, 0.0, 0.0, 0.0);

    vec4 Is = vec4(0.0, 0.0, 0.0, 0.0);

    if (lambertTerm > 0.0) {
        Id = uLight[0].diffuse * uFrontMaterial.diffuse * lambertTerm;

        vec3 R = reflect(L, N);
        float specular = pow( max( dot(R, E) , 0.0 ) , uFrontMaterial.shininess);

        Is = uLight[0].specular * uFrontMaterial.specular * specular;
    }
    return Ia + Id + Is;
}

vec4 calcPointLight(vec3 E, vec3 N) {
    float dist = length(vLightDir);
    vec3 direction = normalize(vLightDir);

    vec4 color = calcDirectionalLight(E, direction, N);
    float att = 1.0 / (uLight[0].constant_attenuation + uLight[0].linear_attenuation * dist + uLight[0].quadratic_attenuation * dist * dist);
    return color * att;
}

vec4 calcSpotLight(vec3 E, vec3 N)
{
    vec3 direction = normalize(vLightDir);
    float spot_factor = dot(direction, uLight[0].spot_direction);

    if (spot_factor > uLight[0].spot_cutoff) {
        vec4 color = calcPointLight(E, N);
        return color * (1.0 - (1.0 - spot_factor) * 1.0/(1.0 - uLight[0].spot_cutoff));
    }
    else {
        return vec4(0,0,0,0);
    }
}

vec4 lighting(vec3 E, vec3 N) {

    vec4 result = vec4(0.0, 0.0, 0.0, 0.0);

    {
        if (uLight[0].enabled) {
            if (uLight[0].position.w == 0.0) {
                // Directional Light
                result += calcDirectionalLight(E, normalize(uLight[0].position.xyz), N);
            } else if (uLight[0].spot_cutoff == 180.0) {
                // Point Light
                result += calcPointLight(E, N);
            } else {
                result += calcSpotLight(E, N);
            }
        }
    }
	result.a = 1.0;
	if (true)
	{
		result.rgb = result.rgb * result.rgb * 0.5 + (clamp(result.rgb*2., 0., 1.)) * pow(clamp(result.rgb*2. - 1., 0., 1.),vec3(2.0))*0.5;
		return log(sqrt(result) * 9. + 1.) * 0.4342944819;
	}
	else return result;
}

uniform sampler2D uSampler;

uniform bool uUseTexture;

varying vec2 vTextureCoord;
uniform float normScale;

void main()
{
	if (uUseTexture)
		gl_FragColor = texture2D(uSampler, vTextureCoord);
	else
		gl_FragColor = vec4(1.0);

	vec3 N = normalize(vNormal);

    vec3 E = normalize(vEyeVec);


    gl_FragColor *= (lighting(E, N) + uFrontMaterial.emission);
	gl_FragColor.rgb *= gl_FragColor.rgb * clamp(1. - normScale,0.00,1.);
	gl_FragColor.r += normScale;
	gl_FragColor.rgb = sqrt(gl_FragColor.rgb);

}
