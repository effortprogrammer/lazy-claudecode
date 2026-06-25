export const SCAFFOLD = `{
  // Shared lazy-claudecode settings. Harness override blocks below are additive.
  "codegraph": {
    // "enabled": true,
    // "auto_provision": true,
    // "telemetry": false,
    // "install_dir": "~/.lazy-claudecode/codegraph"
  },

  "[claude-code]": {
    "codegraph": {
      // "enabled": true,
      // "auto_provision": true,
      // "install_dir": "~/.lazy-claudecode/codegraph",
      // "telemetry": false
    }
  },

  "[opencode]": {
    "codegraph": {
      // "enabled": true,
      // "auto_provision": true,
      // "install_dir": "~/.lazy-claudecode/codegraph",
      // "telemetry": false,
      // "watch_debounce_ms": 250
    }
  }
}
`;
