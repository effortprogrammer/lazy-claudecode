#!/usr/bin/env node

import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { pathToFileURL } from "node:url";

import { addClaudeCodegraphValues, hasOwn, isRecord, recordAt } from "./migrate-lazy-claudecode-sot/editor.mjs";
import { parseJsonc } from "./migrate-lazy-claudecode-sot/jsonc.mjs";
import { SCAFFOLD } from "./migrate-lazy-claudecode-sot/scaffold.mjs";

const CODEGRAPH_KEYS = ["auto_provision", "enabled", "install_dir", "telemetry"];
const ENV_MAPPINGS = [
	["auto_provision", "LAZY_CLAUDECODE_CODEGRAPH_AUTO_PROVISION", "boolean"],
	["auto_provision", "LAZY_CLAUDECODE_CODEGRAPH_AUTO_PROVISION", "boolean"],
	["enabled", "LAZY_CLAUDECODE_CODEGRAPH_ENABLED", "boolean"],
	["enabled", "LAZY_CLAUDECODE_CODEGRAPH_ENABLED", "boolean"],
	["install_dir", "LAZY_CLAUDECODE_CODEGRAPH_INSTALL_DIR", "string"],
	["install_dir", "LAZY_CLAUDECODE_CODEGRAPH_INSTALL_DIR", "string"],
	["telemetry", "LAZY_CLAUDECODE_CODEGRAPH_TELEMETRY", "boolean"],
	["telemetry", "LAZY_CLAUDECODE_CODEGRAPH_TELEMETRY", "boolean"],
];

export async function migrateLazyClaudecodeSotConfig({ env = process.env, seed = false, configPath } = {}) {
	const targetPath = configPath ?? join(resolveHomeDir(env), ".lazy-claudecode", "config.jsonc");
	if (!(await pathExists(targetPath))) {
		if (!seed) return { changed: false, configPath: targetPath, seeded: false, warnings: [] };
		const parsedScaffold = parseJsonc(SCAFFOLD);
		if (!parsedScaffold.ok) throw parsedScaffold.error;
		const additions = collectClaudeAdditions(parsedScaffold.value, env);
		const content = addClaudeCodegraphValues(SCAFFOLD, parsedScaffold.value, additions);
		await mkdir(dirname(targetPath), { recursive: true });
		await writeFile(targetPath, content);
		return { changed: true, configPath: targetPath, seeded: true, warnings: [] };
	}

	const content = await readFile(targetPath, "utf8");
	const parsed = parseJsonc(content);
	if (!parsed.ok) {
		return {
			changed: false,
			configPath: targetPath,
			seeded: false,
			warnings: [`Could not parse ${targetPath}; left existing LAZY_CLAUDECODE SOT untouched: ${parsed.error.message}`],
		};
	}

	const additions = collectClaudeAdditions(parsed.value, env);
	if (Object.keys(additions).length === 0) {
		return { changed: false, configPath: targetPath, seeded: false, warnings: [] };
	}

	const edited = addClaudeCodegraphValues(content, parsed.value, additions);
	if (edited === content) return { changed: false, configPath: targetPath, seeded: false, warnings: [] };
	await writeFile(targetPath, edited);
	return { changed: true, configPath: targetPath, seeded: false, warnings: [] };
}

function resolveHomeDir(env) {
	const candidate = env.HOME ?? env.USERPROFILE;
	return candidate?.trim() ? candidate : homedir();
}

async function pathExists(path) {
	try {
		await access(path);
		return true;
	} catch (error) {
		if (error instanceof Error && "code" in error && error.code === "ENOENT") return false;
		throw error;
	}
}

function collectClaudeAdditions(config, env) {
	const claudeCodegraph = recordAt(recordAt(config, "[claude-code]"), "codegraph");
	const additions = {};
	addSupportedCodegraphValues(additions, recordAt(config, "codegraph"), claudeCodegraph);
	for (const [key, envKey, kind] of ENV_MAPPINGS) {
		const raw = env[envKey];
		if (raw === undefined || hasOwn(claudeCodegraph, key)) continue;
		const parsed = parseEnvValue(raw, kind);
		if (parsed !== null) additions[key] = parsed;
	}
	for (const key of Object.keys(additions)) {
		if (hasOwn(claudeCodegraph, key)) delete additions[key];
	}
	return additions;
}

function addSupportedCodegraphValues(additions, baseCodegraph, claudeCodegraph) {
	if (!isRecord(baseCodegraph)) return;
	for (const key of CODEGRAPH_KEYS) {
		if (hasOwn(claudeCodegraph, key) || !hasOwn(baseCodegraph, key)) continue;
		const value = baseCodegraph[key];
		if (isValidCodegraphValue(key, value)) additions[key] = value;
	}
}

function parseEnvValue(value, kind) {
	if (kind === "string") return value;
	const normalized = value.trim().toLowerCase();
	if (["1", "true", "yes", "on"].includes(normalized)) return true;
	if (["0", "false", "no", "off"].includes(normalized)) return false;
	return null;
}

function isValidCodegraphValue(key, value) {
	if (key === "install_dir") return typeof value === "string";
	return typeof value === "boolean";
}

if (process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href) {
	migrateLazyClaudecodeSotConfig({ seed: process.argv.includes("--seed") })
		.then((result) => {
			for (const warning of result.warnings) process.stderr.write(`${warning}\n`);
		})
		.catch((error) => {
			console.error(error instanceof Error ? error.message : String(error));
			process.exitCode = 1;
		});
}
