const TAU = Math.PI * 2;

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

function spawnMeteor(width: number, height: number) {
	const direction = Math.random() < 0.75 ? 1 : -1;
	const angle = 0.36 + Math.random() * 0.30;
	const ax = Math.cos(angle) * direction;
	const ay = Math.sin(angle);
	const scale = Math.min(1, width / 820);
	return {
		x: width * (direction > 0 ? 0.06 + Math.random() * 0.45 : 0.64 + Math.random() * 0.30),
		y: height * (0.04 + Math.random() * 0.29),
		ax,
		ay,
		speed: (380 + Math.random() * 190) * (0.46 + 0.54 * scale),
		length: (100 + Math.random() * 110) * (0.46 + 0.54 * scale),
		age: 0,
		duration: 0.95 + Math.random() * 0.55,
	};
}

export function createStarfield(skyCanvas: HTMLCanvasElement, meteorCanvas: HTMLCanvasElement) {
	const sky = skyCanvas.getContext("2d");
	const trail = meteorCanvas.getContext("2d");
	if (!sky || !trail) return;
	let width = 0;
	let height = 0;
	let hue = 250;
	let dark = false;
	let meteorColor = "";
	let countdown = 1.6;
	let meteor: ReturnType<typeof spawnMeteor> | undefined;

	return {
		resize() {
			width = skyCanvas.clientWidth;
			height = skyCanvas.clientHeight;
			const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
			skyCanvas.width = meteorCanvas.width = Math.round(width * dpr);
			skyCanvas.height = meteorCanvas.height = Math.round(height * dpr);
			sky.setTransform(dpr, 0, 0, dpr, 0, 0);
			trail.setTransform(dpr, 0, 0, dpr, 0, 0);
			drawSky(sky, width, height, hue, dark);
		},
		setPalette(nextHue: number, nextDark: boolean) {
			hue = nextHue;
			dark = nextDark;
			meteorColor = `${hue - 30} 85% ${dark ? 86 : 43}%`;
			if (width && height) drawSky(sky, width, height, hue, dark);
		},
		clearMeteors() {
			if (!meteor) return;
			meteor = undefined;
			trail.clearRect(0, 0, width, height);
		},
		renderMeteors(dt: number) {
			countdown -= dt;
			if (countdown <= 0) {
				meteor = spawnMeteor(width, height);
				countdown = 3.1 + Math.random() * 3.4;
			}
			if (!meteor) return;
			trail.clearRect(0, 0, width, height);
			meteor.age += dt;
			if (meteor.age >= meteor.duration) {
				meteor = undefined;
				return;
			}
			const { ax, ay, speed, length, age, duration } = meteor;
			const x = meteor.x + ax * speed * age;
			const y = meteor.y + ay * speed * age;
			const tailX = x - ax * length;
			const tailY = y - ay * length;
			const gradient = trail.createLinearGradient(tailX, tailY, x, y);
			gradient.addColorStop(0, `hsl(${meteorColor} / 0)`);
			gradient.addColorStop(0.68, `hsl(${meteorColor} / 0.22)`);
			gradient.addColorStop(1, `hsl(${meteorColor})`);
			trail.globalAlpha = Math.sin((age / duration) * Math.PI) * (dark ? 0.98 : 0.65);
			trail.lineCap = "round";
			trail.strokeStyle = gradient;
			trail.lineWidth = dark ? 2.1 : 1.5;
			trail.shadowBlur = dark ? 12 : 0;
			trail.shadowColor = `hsl(${meteorColor})`;
			trail.beginPath();
			trail.moveTo(tailX, tailY);
			trail.lineTo(x, y);
			trail.stroke();
			trail.fillStyle = `hsl(${meteorColor})`;
			trail.beginPath();
			trail.arc(x, y, 1.7, 0, TAU);
			trail.fill();
		},
	};
}
