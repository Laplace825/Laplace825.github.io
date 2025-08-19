import type {
	ExpressiveCodeConfig,
	LicenseConfig,
	NavBarConfig,
	ProfileConfig,
	SiteConfig,
} from "./types/config";
import { LinkPreset } from "./types/config";
import { tomlConfig } from "./utils/generated-config";

/**
 * Validates and ensures the TOC depth value is within the allowed range
 * @param value - The depth value to validate
 * @returns A valid depth value (1, 2, or 3)
 */
function validateTocDepth(value: unknown): 1 | 2 | 3 {
	if (
		typeof value === "number" &&
		(value === 1 || value === 2 || value === 3)
	) {
		return value;
	}
	return 2; // Default to 2 if invalid
}

/**
 * Validates and ensures the banner position value is valid
 * @param value - The position value to validate
 * @returns A valid position value
 */
function validateBannerPosition(value: unknown): "top" | "center" | "bottom" {
	if (
		typeof value === "string" &&
		(value === "top" || value === "center" || value === "bottom")
	) {
		return value;
	}
	return "center"; // Default to center if invalid
}

export const siteConfig: SiteConfig = {
	title: tomlConfig.site?.title || "Fuwari",
	subtitle: tomlConfig.site?.subtitle || "Demo Site",
	lang: tomlConfig.site?.lang || "en", // 'en', 'zh_CN', 'zh_TW', 'ja', 'ko', 'es', 'th', 'vi'
	themeColor: {
		hue: tomlConfig.site?.themeColor?.hue || 250, // Default hue for the theme color, from 0 to 360. e.g. red: 0, teal: 200, cyan: 250, pink: 345
		fixed: tomlConfig.site?.themeColor?.fixed ?? false, // Hide the theme color picker for visitors
	},
	banner: {
		enable: tomlConfig.site?.banner?.enable ?? false,
		src: tomlConfig.site?.banner?.src || "assets/images/demo-banner.png", // Relative to the /src directory. Relative to the /public directory if it starts with '/'
		position: validateBannerPosition(tomlConfig.site?.banner?.position), // Equivalent to object-position, only supports 'top', 'center', 'bottom'. 'center' by default
		credit: {
			enable: tomlConfig.site?.banner?.credit?.enable ?? false, // Display the credit text of the banner image
			text: tomlConfig.site?.banner?.credit?.text || "", // Credit text to be displayed
			url: tomlConfig.site?.banner?.credit?.url || "", // (Optional) URL link to the original artwork or artist's page
		},
	},
	toc: {
		enable: tomlConfig.site?.toc?.enable ?? true, // Display the table of contents on the right side of the post
		depth: validateTocDepth(tomlConfig.site?.toc?.depth), // Maximum heading depth to show in the table, from 1 to 3
	},
	favicon:
		tomlConfig.site?.favicon ||
		[
			// Leave this array empty to use the default favicon
			// {
			//   src: '/favicon/icon.png',    // Path of the favicon, relative to the /public directory
			//   theme: 'light',              // (Optional) Either 'light' or 'dark', set only if you have different favicons for light and dark mode
			//   sizes: '32x32',              // (Optional) Size of the favicon, set only if you have favicons of different sizes
			// }
		],
};

export const navBarConfig: NavBarConfig = {
	links: tomlConfig.navBar?.links,
};

export const profileConfig: ProfileConfig = {
	avatar: tomlConfig.profile?.avatar || "@/assets/images/demo-avatar.png", // Relative to the /src directory. Relative to the /public directory if it starts with '/'
	name: tomlConfig.profile?.name || "Lorem Ipsum",
	bio:
		tomlConfig.profile?.bio ||
		"Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
	links: tomlConfig.profile?.links || [
		{
			name: "Twitter",
			icon: "fa6-brands:twitter", // Visit https://icones.js.org/ for icon codes
			// You will need to install the corresponding icon set if it's not already included
			// `pnpm add @iconify-json/<icon-set-name>`
			url: "https://twitter.com",
		},
		{
			name: "Steam",
			icon: "fa6-brands:steam",
			url: "https://store.steampowered.com",
		},
		{
			name: "GitHub",
			icon: "fa6-brands:github",
			url: "https://github.com/saicaca/fuwari",
		},
	],
};

export const licenseConfig: LicenseConfig = {
	enable: tomlConfig.license?.enable ?? true,
	name: tomlConfig.license?.name || "CC BY-NC-SA 4.0",
	url:
		tomlConfig.license?.url ||
		"https://creativecommons.org/licenses/by-nc-sa/4.0/",
};

export const expressiveCodeConfig: ExpressiveCodeConfig = {
	// Note: Some styles (such as background color) are being overridden, see the astro.config.mjs file.
	// Please select a dark theme, as this blog theme currently only supports dark background color
	theme: tomlConfig.expressiveCode?.theme || "github-dark",
};
