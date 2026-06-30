/**
 * Trusted hook states for plugin installation.
 */

export interface TrustedHookState {
	readonly hookName: string;
	readonly command: string;
	readonly trusted: boolean;
}

export function trustedHookStatesForPlugin(
	pluginRoot: string,
	componentName: string,
): TrustedHookState[] {
	// Returns the list of hooks that should be auto-trusted during install
	return [
		{
			hookName: `lazy-claudecode-${componentName}`,
			command: `node ${pluginRoot}/dist/${componentName}/cli.js`,
			trusted: true,
		},
	];
}
