import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

import { dirs } from "./config.mjs";

export async function fileExists(filePath) {
	try {
		await fs.access(filePath);
		return true;
	} catch {
		return false;
	}
}

export function isInside(parent, child) {
	const relativePath = path.relative(parent, child);

	return relativePath && !relativePath.startsWith("..") && !path.isAbsolute(relativePath);
}

export async function listFiles(dir, filter, recursive) {
	if (!(await fileExists(dir))) {
		return [];
	}

	const entries = await fs.readdir(dir, { withFileTypes: true });
	const files = [];

	for (const entry of entries) {
		const fullPath = path.join(dir, entry.name);

		if (entry.isDirectory()) {
			if (recursive) {
				files.push(...(await listFiles(fullPath, filter, recursive)));
			}

			continue;
		}

		if (filter(fullPath)) {
			files.push(fullPath);
		}
	}

	return files.sort((a, b) => a.localeCompare(b));
}

export async function readAndJoin(files, separator) {
	const sources = await Promise.all(files.map((file) => fs.readFile(file, "utf8")));

	return sources.join(separator);
}

export function dedupeOutputs(outputs) {
	const outputMap = new Map();

	for (const output of outputs) {
		outputMap.set(toPosix(output.fileName), {
			...output,
			fileName: toPosix(output.fileName),
		});
	}

	return [...outputMap.values()];
}

export function withQueryHash(fileName, source) {
	const hash = crypto.createHash("sha256").update(source).digest("hex").slice(0, 10);

	return `${fileName}?${hash}`;
}

export function isStyleSource(root, filePath) {
	const relativePath = toPosix(path.relative(root, filePath));

	if (relativePath.startsWith(`${dirs.styles}/`)) {
		return isScssFile(filePath) || isCssFile(filePath);
	}

	if (relativePath.startsWith(`${dirs.blocks}/`)) {
		return isScssFile(filePath);
	}

	if (relativePath.startsWith(`${dirs.libs}/`)) {
		return isCssFile(filePath);
	}

	return false;
}

export function shouldCopyAsset(filePath) {
	return !shouldSkipAsset(filePath);
}

export function shouldSkipAsset(filePath) {
	return filePath.split(path.sep).includes("icons");
}

export function isPugFile(filePath) {
	return path.extname(filePath).toLowerCase() === ".pug";
}

export function isSvgFile(filePath) {
	return path.extname(filePath).toLowerCase() === ".svg";
}

export function isJsFile(filePath) {
	return path.extname(filePath).toLowerCase() === ".js";
}

export function isCssFile(filePath) {
	return path.extname(filePath).toLowerCase() === ".css";
}

export function isScssFile(filePath) {
	return path.extname(filePath).toLowerCase() === ".scss";
}

export function isDotFile(filePath) {
	return path.basename(filePath).startsWith(".");
}

export function isPlainCssFile(filePath) {
	return isCssFile(filePath) && path.dirname(filePath).endsWith(`${path.sep}styles`);
}

export function getContentType(filePath) {
	const contentTypes = {
		".css": "text/css; charset=utf-8",
		".js": "text/javascript; charset=utf-8",
		".html": "text/html; charset=utf-8",
		".svg": "image/svg+xml; charset=utf-8",
		".txt": "text/plain; charset=utf-8",
		".json": "application/json; charset=utf-8",
		".map": "application/json; charset=utf-8",
		".png": "image/png",
		".jpg": "image/jpeg",
		".jpeg": "image/jpeg",
		".gif": "image/gif",
		".webp": "image/webp",
		".woff": "font/woff",
		".woff2": "font/woff2",
		".ttf": "font/ttf",
		".otf": "font/otf",
	};

	return contentTypes[path.extname(filePath).toLowerCase()] || "application/octet-stream";
}

export function toPosix(filePath) {
	return filePath.split(path.sep).filter(Boolean).join("/");
}
