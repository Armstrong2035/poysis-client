# Claude Code hook: opens the edited/written file in VS Code automatically.
# Fires after Edit, Write, and MultiEdit tool calls.
# Input: JSON on stdin with shape { tool_input: { file_path: string } }

$raw = [Console]::In.ReadToEnd()

try {
    $data = $raw | ConvertFrom-Json
    $filePath = $data.tool_input.file_path

    if ($filePath -and (Test-Path $filePath)) {
        # --reuse-window: open in the already-running VS Code instance
        # --goto: focuses the file (accepts path:line:col too)
        code --reuse-window --goto $filePath
    }
} catch {
    # Never block Claude on hook errors
}

exit 0
