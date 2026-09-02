// Every MCP tool handler in this module returns its payload the same way —
// as a single JSON-stringified text content block. Shared here so
// leads/lead-notes/lead-reminders tool files don't each redefine it.
export function textResult(payload: unknown) {
  return {
    content: [{ type: 'text' as const, text: JSON.stringify(payload) }],
  };
}
