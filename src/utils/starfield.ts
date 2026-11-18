const TAU = Math.PI * 2;
// Canvas coordinates have positive Y downward. Cycle through both signs on
// each axis so a run of meteors never all falls the same way.
const METEOR_HEADINGS = [Math.PI - 0.5, -Math.PI / 2, 0.55, -2.48, 1.37, -0.46];

function seededRandom(seed: number) {
	return () => {
		seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
		return seed / 0x100000000;
	};
}

function bandCenter(x: number) {
	return 0.88 - 0.66 * x + 0.06 * Math.sin(x * 5.6);
}

function drawSky(ctx: CanvasRenderingContext2D, width: number, height: number, hue: number, dark: boolean) {
	const random = seededRandom(392751);
	const scale = Math.min(width, height);
	const tilt = -Math.atan2(height * 0.66, width);
	ctx.clearRect(0, 0, width, height);

	// Paint the cloud layer only on resize or palette changes, never in the animation loop.
	for (let i = 0; i < 100; i++) {
		const along = i / 100;
		const fold = i % 3 === 0 ? 0.09 * Math.sin(along * 6.0) : 0;
		const across = (random() + random() - 1) * (0.21 + 0.06 * Math.sin(along * 9));
		const radius = scale * (0.022 + random() ** 1.65 * 0.25);
		const cloudHue = hue + (i % 4 === 0 ? 52 : -25) + random() * 28;
		const alpha = (dark ? 0.14 : 0.085) * (0.38 + random() * 0.62);
		const color = `${cloudHue} 73% ${dark ? 55 : 63}%`;
		ctx.save();
		ctx.translate(along * width, (bandCenter(along) + across + fold) * height);
		ctx.rotate(tilt + (random() - 0.5) * 0.42);
		ctx.scale(1.45, 0.52);
		const cloud = ctx.createRadialGradient(0, 0, 0, 0, 0, radius);
		cloud.addColorStop(0, `hsl(${color} / ${alpha})`);
		cloud.addColorStop(0.46, `hsl(${color} / ${alpha * 0.46})`);
		cloud.addColorStop(1, `hsl(${color} / 0)`);
		ctx.fillStyle = cloud;
		ctx.fillRect(-radius, -radius, radius * 2, radius * 2);
		ctx.restore();
	}

	const count = Math.min(1150, Math.round(230 + (width * height) / 1850));
	for (let i = 0; i < count; i++) {
		const along = random();
		const x = along * width;
		const y = height * (i % 4 === 0 ? random() : bandCenter(along) + (random() + random() - 1) * 0.25);
		const radius = 0.26 + random() ** 4 * 1.05;
		const color = `${hue + (random() - 0.4) * 95} 80% ${dark ? 86 : 43}%`;
		const alpha = (dark ? 0.77 : 0.44) * (0.16 + random() * 0.84);
		if (i % 49 === 0 && radius > 0.46) {
			const glow = ctx.createRadialGradient(x, y, 0, x, y, radius * 7);
			glow.addColorStop(0, `hsl(${color} / ${alpha})`);
			glow.addColorStop(1, `hsl(${color} / 0)`);
			ctx.fillStyle = glow;
			ctx.fillRect(x - radius * 7, y - radius * 7, radius * 14, radius * 14);
		}
		ctx.fillStyle = `hsl(${color} / ${alpha})`;
		ctx.beginPath();
		ctx.arc(x, y, radius, 0, TAU);
		ctx.fill();
	}
}

function spawnMeteor(width: number, height: number, heading: number) {
	const angle = heading + (Math.random() - 0.5) * 0.29;
	const ax = Math.cos(angle);
	const ay = Math.sin(angle);
	const scale = 0.46 + 0.54 * Math.min(1, width / 820);
	const x = width * (0.27 + Math.random() * 0.46);
	const y = height * (0.22 + Math.random() * 0.56);
	const duration = 0.95 + Math.random() * 0.55;
	const room = Math.min(Math.min(x, width - x) / Math.abs(ax), Math.min(y, height - y) / Math.abs(ay));
	const speed = Math.min((380 + Math.random() * 190) * scale, (2 * room) / duration);
	const halfTravel = (speed * duration) / 2;
	return {
		x: x - ax * halfTravel,
		y: y - ay * halfTravel,
		ax,
		ay,
		speed,
		length: (100 + Math.random() * 110) * scale,
		age: 0,
		duration,
	};
}

function makeDust(width: number, height: number) {
	const random = seededRandom(41751);
	const count = Math.min(112, Math.round(42 + (width * height) / 19000));
	return Array.from({ length: count }, (_, i) => {
		const u = (i + random()) / count;
		const across = (random() + random() - 1) * 0.18;
		return {
			x: u * width,
			y: (bandCenter(u) + across) * height,
			radius: 1.4 + random() ** 2 * 3.2,
			alpha: 0.28 + random() * 0.46,
			dx: 0,
			dy: 0,
		};
	});
}

function spawnFlare(width: number, height: number) {
	const u = 0.18 + Math.random() * 0.59;
	return {
		x: u * width,
		y: (bandCenter(u) + (Math.random() - 0.5) * 0.10) * height,
		radius: Math.min(46, 22 + Math.min(width, height) / 42),
		angle: Math.random() * TAU,
		duration: 1.7,
		age: 0,
	};
}

export function createStarfield(skyCanvas: HTMLCanvasElement, effectCanvas: HTMLCanvasElement) {
	const sky = skyCanvas.getContext("2d");
	const effectContext = effectCanvas.getContext("2d");
	const dustSprite = document.createElement("canvas");
	dustSprite.width = dustSprite.height = 32;
	const dustContext = dustSprite.getContext("2d");
	if (!sky || !effectContext || !dustContext) return;
	const effects = effectContext;
	let width = 0;
	let height = 0;
	let hue = 250;
	let dark = false;
	let meteorColor = "";
	let meteorCountdown = 1.6;
	let headingIndex = Math.floor(Math.random() * METEOR_HEADINGS.length);
	let meteor: ReturnType<typeof spawnMeteor> | undefined;
	let flareCountdown = 6.5 + Math.random() * 2.5;
	let flare: ReturnType<typeof spawnFlare> | undefined;
	let dust: ReturnType<typeof makeDust> = [];
	let pointerX = Number.NaN;
	let pointerY = 0;
	let dustMoving = false;
	let dirty = false;

	function paintDust(dt: number) {
		effects.clearRect(0, 0, width, height);
		const radius = Math.min(180, Math.max(105, width * 0.135));
		const radiusSquared = radius * radius;
		const ease = 1 - Math.exp(-7 * dt);
		dustMoving = false;
		for (const grain of dust) {
			const x = pointerX - grain.x;
			const y = pointerY - grain.y;
			const distanceSquared = x * x + y * y;
			let dx = 0;
			let dy = 0;
			if (distanceSquared < radiusSquared) {
				const pull = 0.68 * (1 - distanceSquared / radiusSquared) ** 2;
				dx = x * pull;
				dy = y * pull;
			}
			const stepX = dx - grain.dx;
			const stepY = dy - grain.dy;
			if (Math.abs(stepX) + Math.abs(stepY) > 0.06) {
				grain.dx += stepX * ease;
				grain.dy += stepY * ease;
				dustMoving = true;
			} else {
				grain.dx = dx;
				grain.dy = dy;
			}
			const r = grain.radius;
			const glow = 1 + Math.min(0.33, (Math.abs(grain.dx) + Math.abs(grain.dy)) / 75);
			effects.globalAlpha = grain.alpha * (dark ? 1 : 0.7) * glow;
			effects.drawImage(dustSprite, grain.x + grain.dx - r, grain.y + grain.dy - r, 2 * r, 2 * r);
		}
	}

	function paintMeteor(active: NonNullable<typeof meteor>) {
		const { ax, ay, speed, length, age, duration } = active;
		const x = active.x + ax * speed * age;
		const y = active.y + ay * speed * age;
		const tailX = x - ax * length;
		const tailY = y - ay * length;
		const gradient = effects.createLinearGradient(tailX, tailY, x, y);
		gradient.addColorStop(0, `hsl(${meteorColor} / 0)`);
		gradient.addColorStop(0.68, `hsl(${meteorColor} / 0.22)`);
		gradient.addColorStop(1, `hsl(${meteorColor})`);
		effects.globalAlpha = Math.sin((age / duration) * Math.PI) * (dark ? 0.98 : 0.65);
		effects.lineCap = "round";
		effects.strokeStyle = gradient;
		effects.lineWidth = dark ? 2.1 : 1.5;
		effects.shadowBlur = dark ? 12 : 0;
		effects.shadowColor = `hsl(${meteorColor})`;
		effects.beginPath();
		effects.moveTo(tailX, tailY);
		effects.lineTo(x, y);
		effects.stroke();
		effects.fillStyle = `hsl(${meteorColor})`;
		effects.beginPath();
		effects.arc(x, y, 1.7, 0, TAU);
		effects.fill();
		effects.shadowBlur = 0;
	}

	function paintFlare(active: NonNullable<typeof flare>) {
		const { x, y, age, duration, radius, angle } = active;
		const progress = age / duration;
		const envelope = Math.sin(Math.PI * progress ** 0.60);
		const wave = radius * (0.12 + 0.88 * progress);
		effects.globalAlpha = envelope * (dark ? 0.22 : 0.15);
		effects.lineWidth = 0.8;
		effects.strokeStyle = `hsl(${meteorColor})`;
		effects.beginPath();
		effects.arc(x, y, wave, 0, TAU);
		effects.stroke();

		const halo = radius * (0.35 + progress * 0.42);
		effects.globalAlpha = envelope * (dark ? 0.44 : 0.30);
		effects.drawImage(dustSprite, x - halo, y - halo, 2 * halo, 2 * halo);
		effects.fillStyle = effects.strokeStyle;
		effects.beginPath();
		for (let i = 0; i < 6; i++) {
			const ray = angle + (i * TAU) / 6 + (i % 2) * 0.15;
			const distance = wave * (0.64 + (i % 3) * 0.12);
			const px = x + Math.cos(ray) * distance;
			const py = y + Math.sin(ray) * distance;
			effects.moveTo(px + 1, py);
			effects.arc(px, py, 1, 0, TAU);
		}
		effects.fill();
	}

	return {
		resize() {
			width = skyCanvas.clientWidth;
			height = skyCanvas.clientHeight;
			const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
			skyCanvas.width = effectCanvas.width = Math.round(width * dpr);
			skyCanvas.height = effectCanvas.height = Math.round(height * dpr);
			sky.setTransform(dpr, 0, 0, dpr, 0, 0);
			effects.setTransform(dpr, 0, 0, dpr, 0, 0);
			dust = makeDust(width, height);
			meteor = undefined;
			flare = undefined;
			drawSky(sky, width, height, hue, dark);
			paintDust(0);
		},
		setPalette(nextHue: number, nextDark: boolean) {
			hue = nextHue;
			dark = nextDark;
			meteorColor = `${hue - 30} 85% ${dark ? 86 : 43}%`;
			const tint = `${hue - 15} 78% ${dark ? 81 : 48}%`;
			const glow = dustContext.createRadialGradient(16, 16, 0, 16, 16, 16);
			glow.addColorStop(0, `hsl(${tint} / 0.95)`);
			glow.addColorStop(0.27, `hsl(${tint} / 0.44)`);
			glow.addColorStop(1, `hsl(${tint} / 0)`);
			dustContext.clearRect(0, 0, 32, 32);
			dustContext.fillStyle = glow;
			dustContext.fillRect(0, 0, 32, 32);
			if (width && height) {
				drawSky(sky, width, height, hue, dark);
				paintDust(0);
				if (meteor) paintMeteor(meteor);
				if (flare) paintFlare(flare);
			}
		},
		setPointer(x: number, y: number) {
			pointerX = x;
			pointerY = y;
			dirty = true;
		},
		releasePointer() {
			if (Number.isNaN(pointerX)) return;
			pointerX = Number.NaN;
			dirty = true;
		},
		resetMotion() {
			pointerX = Number.NaN;
			meteor = undefined;
			flare = undefined;
			for (const grain of dust) {
				grain.dx = 0;
				grain.dy = 0;
			}
			paintDust(0);
		},
		render(dt: number) {
			meteorCountdown -= dt;
			flareCountdown -= dt;
			if (flareCountdown <= 0 && !meteor) {
				flare = spawnFlare(width, height);
				flareCountdown = 17 + Math.random() * 14;
			}
			if (meteorCountdown <= 0 && !flare) {
				meteor = spawnMeteor(width, height, METEOR_HEADINGS[headingIndex]);
				headingIndex = (headingIndex + 1) % METEOR_HEADINGS.length;
				meteorCountdown = 3.1 + Math.random() * 3.4;
			}
			if (!meteor && !flare && !dustMoving && !dirty) return;
			dirty = false;
			paintDust(dt);
			if (meteor) {
				meteor.age += dt;
				if (meteor.age < meteor.duration) paintMeteor(meteor);
				else meteor = undefined;
			}
			if (flare) {
				flare.age += dt;
				if (flare.age < flare.duration) paintFlare(flare);
				else flare = undefined;
			}
		},
	};
}
