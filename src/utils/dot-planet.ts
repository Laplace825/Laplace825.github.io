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
	WebGLRenderer,
} from "three";

const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));
const RING_INNER = 1.19;
const RING_OUTER = 1.96;
const SURFACE_LIGHT = "vec3(-0.54, 0.44, 0.72)";

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
	const count = 3800;
	const positions = new Float32Array(count * 3);
	for (let i = 0; i < count; i++) {
		// Fibonacci sampling avoids the pole clumps of a latitude/longitude grid.
		const y = 1 - (2 * (i + 0.5)) / count;
		const radius = Math.sqrt(1 - y * y);
		positions[i * 3] = 1.003 * radius * Math.cos(i * GOLDEN_ANGLE);
		positions[i * 3 + 1] = 1.003 * y;
		positions[i * 3 + 2] = 1.003 * radius * Math.sin(i * GOLDEN_ANGLE);
	}
	return new BufferGeometry().setAttribute("position", new BufferAttribute(positions, 3));
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

	const uniforms = {
		shadowColor: { value: new Color() },
		bodyColor: { value: new Color() },
		iceColor: { value: new Color() },
		dustColor: { value: new Color() },
		dark: { value: 0 },
		pixels: { value: 1 },
		elapsed: { value: 0 },
	};

	const sphere = new Mesh(
		new SphereGeometry(1, 96, 64),
		new ShaderMaterial({
			uniforms,
			transparent: true,
			vertexShader: positionVertex,
			fragmentShader: /* glsl */ `
				uniform vec3 shadowColor, bodyColor, iceColor, dustColor;
				uniform float dark;
				varying vec3 local;
				varying vec3 viewNormal;
				void main() {
					vec3 n = normalize(viewNormal);
					float daylight = smoothstep(-0.21, 0.95, dot(n, ${SURFACE_LIGHT}));
					float latitude = local.y + 0.09 * sin(local.x * 6.0 + local.z * 5.0)
						+ 0.035 * sin(local.z * 17.0 - local.x * 11.0);
					float bands = sin(33.0 * latitude) * 0.58 + sin(68.0 * latitude) * 0.22;
					float clouds = 0.5 + bands * 0.4;
					float rim = pow(1.0 - max(0.0, n.z), 3.2);
					vec3 lit = mix(bodyColor, dustColor, clouds * 0.48);
					vec3 color = mix(shadowColor, lit, daylight * (0.59 + clouds * 0.41));
					color = mix(color, iceColor, rim * (0.17 + 0.65 * daylight));
					float opacity = mix(0.28, 0.69, dark) + daylight * mix(0.25, 0.23, dark);
					gl_FragColor = vec4(color, opacity * smoothstep(0.015, 0.1, n.z));
					#include <colorspace_fragment>
				}
			`,
		}),
	);
	sphere.renderOrder = 0; // Write depth first so only the near side of the ring can cross the globe.

	const dots = new Points(
		createSurfaceDots(),
		new ShaderMaterial({
			uniforms,
			transparent: true,
			depthWrite: false,
			vertexShader: /* glsl */ `
				uniform float pixels;
				varying float strength;
				void main() {
					vec3 n = mat3(modelViewMatrix) * normalize(position);
					float light = max(dot(n, ${SURFACE_LIGHT}), 0.0);
					float surface = sin(21.0 * position.y + sin(position.x * 8.0 + position.z * 5.0));
					strength = smoothstep(0.02, 0.18, n.z) * (0.16 + 0.84 * light) * (0.66 + 0.34 * surface);
					gl_PointSize = pixels * (1.4 + 1.35 * light);
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
	dots.renderOrder = 1;
	const globe = new Group();
	globe.rotation.set(0.15, 0.55, 0.32, "ZYX");
	globe.add(sphere, dots);
	scene.add(globe);

	const rings = new Group();
	rings.rotation.set(-1.06, 0, 0.32, "ZYX");
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
				void main() {
					float r = length(local.xy);
					vec3 gaps = (r - vec3(1.40, 1.68, 1.87)) * vec3(11.0, 16.0, 37.0);
					vec3 bands = exp(-gaps * gaps);
					float strands = 0.53 + 0.28 * sin(r * 250.0) + 0.15 * sin(r * 91.0);
					float density = dot(vec3(0.8, 0.63, 0.44), bands) * strands;
					float illumination = 0.68 - 0.22 * local.x / r + 0.10 * local.y / r;
					vec3 color = mix(iceColor, dustColor, smoothstep(1.27, 1.91, r));
					gl_FragColor = vec4(color, density * illumination * mix(0.52, 0.75, dark));
					#include <colorspace_fragment>
				}
			`,
		}),
	);
	ring.renderOrder = 2;
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
		particles.renderOrder = 3;
		rings.add(particles);
	}
	scene.add(rings);

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
			uniforms.dark.value = Number(dark);
		},
		render(dt: number) {
			uniforms.elapsed.value += dt;
			globe.rotation.y += dt * 0.13;
			renderer.render(scene, camera);
		},
	};
}
