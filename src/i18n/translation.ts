import { siteConfig } from "../config";
import type I18nKey from "./i18nKey";
import { en } from "./languages/en";
import { zh_CN } from "./languages/zh_CN";

export type Translation = {
	[K in I18nKey]: string;
};

const defaultTranslation = en;

const map: { [key: string]: Translation } = {
	en: en,
	en_us: en,
	en_gb: en,
	en_au: en,
	zh_cn: zh_CN,
};

export function getTranslation(lang: string): Translation {
	return map[lang.toLowerCase()] || defaultTranslation;
}

export function i18n(key: I18nKey, params?: Record<string, string>): string {
	const lang = siteConfig.lang || "en";
	let translation = getTranslation(lang)[key];

	if (params) {
		Object.keys(params).forEach((param) => {
			translation = translation.replace(`{${param}}`, params[param]);
		});
	}

	return translation;
}
