import {
	BufferAttribute,
	BufferGeometry,
	Color,
	DoubleSide,
	Group,
	Mesh,
	OrthographicCamera,
	Points,
	RingGeometry,
	Scene,
	ShaderMaterial,
	SphereGeometry,
	SRGBColorSpace,
	Vector3,
	WebGLRenderer,
} from "three";

const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));
const RING_INNER = 1.19;
const RING_OUTER = 1.96;
const ATMOSPHERE_RADIUS = 1.022;

const ringBands = /* glsl */ `
	float ringDensity(float r) {
		vec3 gaps = (r - vec3(1.40, 1.68, 1.87)) * vec3(11.0, 16.0, 37.0);
		return dot(vec3(0.8, 0.63, 0.44), exp(-gaps * gaps));
	}
`;

const ringShadow = /* glsl */ `
	uniform vec3 ringNormal, shadowRay;
	${ringBands}
	float ringTransmittance(vec3 surface) {
		float planeDistance = dot(surface, ringNormal);
		if (planeDistance >= 0.0) return 1.0;
		float radius = length(surface - planeDistance * shadowRay);
		return 1.0 - 0.68 * ringDensity(radius);
	}
`;

const positionVertex = /* glsl */ `
	varying vec3 local;
	varying vec3 viewNormal;
	void main() {
		local = position;
		viewNormal = normalMatrix * normal;
		gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
	}
`;

function createSurfaceDots() {
	// Candidate points are jittered, then thinned unevenly by overlapping
	// surface patches. Directions and squared footprints are in globe space.
	const patches = [
		[-0.70, 0.53, 0.47, 0.55],
		[-0.88, 0.13, 0.46, 0.32],
		[0.17, 0.78, 0.60, 0.62],
		[-0.28, -0.53, 0.80, 0.45],
		[0.63, -0.63, 0.45, 0.78],
		[0.83, 0.40, -0.40, 0.43],
		[-0.53, -0.62, -0.57, 0.63],
		[0.06, 0.79, -0.61, 0.38],
		[0.42, -0.12, -0.90, 0.62],
	];
	let seed = 67081;
	function sample() {
		seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
		return seed / 0x100000000;
	}
	const count = 6200;
	const positions = new Float32Array(count * 3);
	let size = 0;
	for (let i = 0; i < count; i++) {
		const latitude = 1 - (2 * (i + 0.5)) / count;
		const y = latitude + (sample() - 0.5) * 0.036 * (1 - latitude * latitude);
		const radius = Math.sqrt(1 - y * y);
		const angle = i * GOLDEN_ANGLE + (sample() - 0.5) * 0.053;
		const x = radius * Math.cos(angle);
		const z = radius * Math.sin(angle);
		let density = 0.21;
		for (const [px, py, pz, spread] of patches) {
			const d2 = (x - px) ** 2 + (y - py) ** 2 + (z - pz) ** 2;
			const falloff = Math.max(0, 1 - d2 / spread);
			density += 0.74 * falloff * falloff;
		}
		if (sample() > density) continue;
		positions[size++] = 1.003 * x;
		positions[size++] = 1.003 * y;
		positions[size++] = 1.003 * z;
	}
	return new BufferGeometry().setAttribute("position", new BufferAttribute(positions.subarray(0, size), 3));
}

function createRingParticles(count: number) {
	const orbits = new Float32Array(count * 4);
	for (let i = 0; i < count; i++) {
		const band = i % 5;
		const radius = (band < 2 ? 1.38 : band < 4 ? 1.66 : 1.86) + (Math.random() - 0.5) * 0.14;
		const phase = i * GOLDEN_ANGLE + Math.random() * 0.12;
		orbits[i * 4] = radius;
		orbits[i * 4 + 1] = phase % (Math.PI * 2);
		orbits[i * 4 + 2] = Math.random();
		orbits[i * 4 + 3] = i % 8 === 0 ? 1 : Math.random() * 0.5;
	}
	const geometry = new BufferGeometry();
	geometry.setDrawRange(0, count);
	geometry.setAttribute("orbit", new BufferAttribute(orbits, 4));
	return geometry;
}

export interface DotPlanet {
	resize(): void;
	setPalette(hue: number, dark: boolean): void;
	render(dt: number): void;
}

export function createDotPlanet(
	canvas: HTMLCanvasElement,
	context: WebGL2RenderingContext,
	particleCount: number,
): DotPlanet {
	const renderer = new WebGLRenderer({ canvas, context, alpha: true });
	const scene = new Scene();
	const camera = new OrthographicCamera(-2.06, 2.06, 1.42, -1.42, 0.1, 10);
	camera.position.z = 4;

	const rings = new Group();
	rings.rotation.set(-1.06, 0, 0.32, "ZYX");
	// The axis-aligned camera shares the scene's axes. Scale the light ray
	// so subtracting signed plane distance lands directly on the ring plane.
	const sunlight = new Vector3(-0.82, 0.10, 0.565).normalize();
	const ringNormal = new Vector3(0, 0, 1).applyQuaternion(rings.quaternion);

	const uniforms = {
		shadowColor: { value: new Color() },
		bodyColor: { value: new Color() },
		iceColor: { value: new Color() },
		dustColor: { value: new Color() },
		airColor: { value: new Color() },
		sunlight: { value: sunlight },
		halfLight: { value: new Vector3(0, 0, 1).add(sunlight).normalize() },
		ringNormal: { value: ringNormal },
		shadowRay: { value: sunlight.clone().divideScalar(sunlight.dot(ringNormal)) },
		dark: { value: 0 },
		pixels: { value: 1 },
		elapsed: { value: 0 },
	};

	const surfaceGeometry = new SphereGeometry(1, 96, 64);
	const sphere = new Mesh(
		surfaceGeometry,
		new ShaderMaterial({
			uniforms,
			transparent: true,
			vertexShader: positionVertex,
			fragmentShader: /* glsl */ `
				uniform vec3 shadowColor, bodyColor, iceColor, sunlight, halfLight;
				uniform float dark;
				varying vec3 viewNormal;
				${ringShadow}
				void main() {
					vec3 n = normalize(viewNormal);
					float daylight = smoothstep(-0.18, 0.94, dot(n, sunlight));
					float shield = ringTransmittance(n);
					float sheen = pow(max(0.0, dot(n, halfLight)), 16.0);
					float rim = pow(1.0 - max(0.0, n.z), 3.2);
					vec3 color = mix(shadowColor, bodyColor, daylight * shield);
					color = mix(color, iceColor, sheen * 0.12 * shield + rim * (0.03 + 0.16 * daylight));
					float opacity = mix(0.28, 0.69, dark) + daylight * mix(0.25, 0.23, dark);
					gl_FragColor = vec4(color, opacity * smoothstep(0.015, 0.1, n.z));
					#include <colorspace_fragment>
				}
			`,
		}),
	);
	sphere.renderOrder = 0; // Write depth first so only the near side of the ring can cross the globe.

	const atmosphere = new Mesh(
		surfaceGeometry,
		new ShaderMaterial({
			uniforms,
			transparent: true,
			depthWrite: false,
			vertexShader: positionVertex,
			fragmentShader: /* glsl */ `
				uniform vec3 iceColor, airColor, sunlight;
				uniform float dark;
				varying vec3 viewNormal;
				void main() {
					vec3 n = normalize(viewNormal);
					float radius = length(n.xy) * ${ATMOSPHERE_RADIUS};
					float limb = smoothstep(0.951, 0.997, radius)
						* (1.0 - smoothstep(1.000, ${ATMOSPHERE_RADIUS}, radius));
					float sunlit = smoothstep(-0.14, 0.81, dot(vec3(n.xy, 0.0), sunlight));
					vec3 color = mix(iceColor, airColor, smoothstep(0.97, 1.016, radius));
					gl_FragColor = vec4(color, limb * sunlit * mix(0.37, 0.79, dark));
					#include <colorspace_fragment>
				}
			`,
		}),
	);
	atmosphere.scale.setScalar(ATMOSPHERE_RADIUS);
	atmosphere.renderOrder = 1;
	scene.add(atmosphere);

	const dots = new Points(
		createSurfaceDots(),
		new ShaderMaterial({
			uniforms,
			transparent: true,
			depthWrite: false,
			vertexShader: /* glsl */ `
				uniform float pixels;
				uniform vec3 sunlight;
				${ringShadow}
				varying float strength;
				void main() {
					vec3 n = mat3(modelViewMatrix) * normalize(position);
					float light = max(dot(n, sunlight), 0.0) * ringTransmittance(n);
					float grain = fract(sin(dot(position, vec3(14.4, 32.7, 55.9))) * 43758.5);
					strength = smoothstep(0.02, 0.18, n.z) * (0.16 + 0.84 * light) * (0.66 + 0.34 * grain);
					gl_PointSize = pixels * (1.25 + 1.45 * light) * (0.78 + 0.46 * grain);
					gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
				}
			`,
			fragmentShader: /* glsl */ `
				uniform vec3 iceColor;
				uniform float dark;
				varying float strength;
				void main() {
					float dotAlpha = 1.0 - smoothstep(0.17, 0.50, length(gl_PointCoord - 0.5));
					gl_FragColor = vec4(iceColor, dotAlpha * strength * mix(0.57, 0.83, dark));
					#include <colorspace_fragment>
				}
			`,
		}),
	);
	dots.renderOrder = 2;
	const globe = new Group();
	globe.rotation.set(0.15, 0.55, 0.32, "ZYX");
	globe.add(sphere, dots);
	scene.add(globe);

	const ring = new Mesh(
		new RingGeometry(RING_INNER, RING_OUTER, 192),
		new ShaderMaterial({
			uniforms,
			side: DoubleSide,
			forceSinglePass: true,
			transparent: true,
			depthWrite: false,
			vertexShader: positionVertex,
			fragmentShader: /* glsl */ `
				uniform vec3 iceColor, dustColor;
				uniform float dark;
				varying vec3 local;
				${ringBands}
				void main() {
					float r = length(local.xy);
					float strands = 0.53 + 0.28 * sin(r * 250.0) + 0.15 * sin(r * 91.0);
					float density = ringDensity(r) * strands;
					float illumination = 0.68 - 0.22 * local.x / r + 0.10 * local.y / r;
					vec3 color = mix(iceColor, dustColor, smoothstep(1.27, 1.91, r));
					gl_FragColor = vec4(color, density * illumination * mix(0.52, 0.75, dark));
					#include <colorspace_fragment>
				}
			`,
		}),
	);
	ring.renderOrder = 3;
	rings.add(ring);

	const count = Math.max(0, Math.min(320, Math.round(particleCount)));
	if (count > 0) {
		const particles = new Points(
			createRingParticles(count),
			new ShaderMaterial({
				uniforms,
				transparent: true,
				depthWrite: false,
				vertexShader: /* glsl */ `
					attribute vec4 orbit;
					uniform float pixels, elapsed;
					varying float brightness, tint;
					void main() {
						float angle = orbit.y + elapsed * 0.18 / orbit.x;
						vec3 point = vec3(orbit.x * cos(angle), orbit.x * sin(angle), 0.0);
						float blink = 0.5 + 0.5 * sin(elapsed * (1.3 + 2.2 * orbit.z) + orbit.y * 7.0);
						brightness = 0.29 + 0.71 * blink * blink;
						tint = orbit.z;
						gl_PointSize = pixels * (3.5 + 9.0 * orbit.w) * (0.8 + 0.35 * brightness);
						gl_Position = projectionMatrix * modelViewMatrix * vec4(point, 1.0);
					}
				`,
				fragmentShader: /* glsl */ `
					uniform vec3 iceColor, dustColor;
					uniform float dark;
					varying float brightness, tint;
					void main() {
						float r = length(gl_PointCoord - 0.5);
						float core = 1.0 - smoothstep(0.06, 0.19, r);
						float halo = exp(-r * 7.0) * (1.0 - smoothstep(0.22, 0.50, r));
						vec3 color = mix(iceColor, dustColor, step(0.65, tint) * 0.56);
						color = mix(color, vec3(1.0), core * dark * 0.7);
						gl_FragColor = vec4(color, (core * 0.67 + halo * 0.55) * brightness);
						#include <colorspace_fragment>
					}
				`,
			}),
		);
		particles.frustumCulled = false; // Orbital positions change in the vertex shader.
		particles.renderOrder = 4;
		rings.add(particles);
	}
	scene.add(rings);

	const moonOrbit = new Group();
	moonOrbit.rotation.set(-0.91, 0, -0.44, "ZYX");
	const moon = new Mesh(
		new SphereGeometry(0.051, 24, 16),
		new ShaderMaterial({
			uniforms,
			transparent: true,
			vertexShader: positionVertex,
			fragmentShader: /* glsl */ `
				uniform vec3 shadowColor, iceColor, dustColor, sunlight;
				uniform float dark;
				varying vec3 viewNormal;
				void main() {
					vec3 n = normalize(viewNormal);
					float light = smoothstep(-0.37, 0.88, dot(n, sunlight));
					vec3 lit = mix(dustColor, iceColor, 0.48);
					lit = mix(lit, vec3(0.86, 0.91, 1.0), 0.62 * dark);
					vec3 color = mix(shadowColor, lit, 0.17 + 0.83 * light);
					gl_FragColor = vec4(color, smoothstep(0.025, 0.19, n.z) * mix(0.74, 0.96, dark));
					#include <colorspace_fragment>
				}
			`,
		}),
	);
	moon.renderOrder = 2;
	moonOrbit.add(moon);
	scene.add(moonOrbit);

	return {
		resize() {
			const width = canvas.clientWidth;
			const height = canvas.clientHeight;
			if (!width || !height) return;
			const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
			renderer.setDrawingBufferSize(width, height, dpr);
			camera.top = (2.06 * height) / width;
			camera.bottom = -camera.top;
			camera.updateProjectionMatrix();
			uniforms.pixels.value = dpr * Math.min(1.1, 0.63 + width / 2300);
		},
		setPalette(hue: number, dark: boolean) {
			const h = hue / 360;
			uniforms.shadowColor.value.setHSL(h + 0.10, 0.40, dark ? 0.075 : 0.50, SRGBColorSpace);
			uniforms.bodyColor.value.setHSL(h + 0.025, 0.53, dark ? 0.38 : 0.70, SRGBColorSpace);
			uniforms.iceColor.value.setHSL(h - 0.07, 0.84, dark ? 0.76 : 0.42, SRGBColorSpace);
			uniforms.dustColor.value.setHSL(h + 0.16, 0.67, dark ? 0.70 : 0.53, SRGBColorSpace);
			uniforms.airColor.value.setHSL(h - 0.15, 0.91, dark ? 0.68 : 0.53, SRGBColorSpace);
			uniforms.dark.value = Number(dark);
		},
		render(dt: number) {
			uniforms.elapsed.value += dt;
			globe.rotation.y += dt * 0.13;
			// Ring particles advance with positive phase; the moon travels the other way.
			const phase = 2.35 - uniforms.elapsed.value * 0.31;
			moon.position.set(1.54 * Math.cos(phase), 1.54 * Math.sin(phase), 0);
			renderer.render(scene, camera);
		},
	};
}
