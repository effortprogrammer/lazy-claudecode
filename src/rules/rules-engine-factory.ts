import { readFileSync } from "node:fs";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { configFromEnvironment } from "./config.ts";
import { createEngine } from "../shared/rules-engine/index.ts";
import { findRuleCandidates } from "../shared/rules-engine/index.ts";
import { findProjectRoot } from "../shared/rules-engine/index.ts";

interface RulesEngineFactoryOptions {
	env?: NodeJS.ProcessEnv;
	platform?: NodeJS.Platform;
}

const componentRoot = dirname(dirname(fileURLToPath(import.meta.url)));

export function createRulesEngine(options: RulesEngineFactoryOptions, config = configFromEnvironment(options.env)) {
	const platform = options.platform ?? process.platform;
	const pluginRoot = options.env?.["PLUGIN_ROOT"] ?? process.env["PLUGIN_ROOT"] ?? componentRoot;

	return createEngine(config, {
		findCandidates: (finderOptions) => findRuleCandidates({ ...finderOptions, platform, pluginRoot }),
		findProjectRoot,
		readFile: (path) => {
			try {
				return readFileSync(path, "utf8");
			} catch {
				return null;
			}
		},
	});
}
