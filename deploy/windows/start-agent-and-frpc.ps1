param(
    [string]$RepoRoot = "D:\YanQue-AI",
    [string]$ProxyUrl = "http://127.0.0.1:7890"
)

$ErrorActionPreference = "Stop"
$runtimeRoot = Join-Path $RepoRoot ".runtime"
$agentRuntime = Join-Path $runtimeRoot "agent"
$tokenFile = Join-Path $agentRuntime "agent-token"
$agentExe = Join-Path $RepoRoot "YanQue-AI-14\.venv\Scripts\yanque-agent-node.exe"
$agentWorkdir = Join-Path $RepoRoot "YanQue-AI-14"
$frpcExe = Join-Path $runtimeRoot "frp\frp_0.71.0_windows_amd64\frpc.exe"
$frpcConfig = Join-Path $runtimeRoot "frp\frp_0.71.0_windows_amd64\frpc.toml"

foreach ($requiredFile in @($tokenFile, $agentExe, $frpcExe, $frpcConfig)) {
    if (-not (Test-Path -LiteralPath $requiredFile)) {
        throw "Required file is missing: $requiredFile"
    }
}

New-Item -ItemType Directory -Path $agentRuntime -Force | Out-Null

if (-not (Get-Process frpc -ErrorAction SilentlyContinue)) {
    Start-Process -FilePath $frpcExe -ArgumentList @("-c", $frpcConfig) -WorkingDirectory (Split-Path $frpcExe) -WindowStyle Hidden -RedirectStandardOutput (Join-Path $runtimeRoot "frp\frpc.out.log") -RedirectStandardError (Join-Path $runtimeRoot "frp\frpc.err.log")
}

if (-not (Get-Process yanque-agent-node -ErrorAction SilentlyContinue)) {
    $env:AGENT_NODE_TOKEN = [System.IO.File]::ReadAllText($tokenFile).Trim()
    $env:AGENT_NODE_WORKER_ID = "ZXH"
    $env:AGENT_NODE_WORKDIR = $RepoRoot
    $env:AGENT_NODE_MAX_CONCURRENCY = "1"
    $env:CODEX_TASK_TIMEOUT_SECONDS = "300"
    $env:CODEX_MODEL = "gpt-5.6-sol"
    $env:CODEX_REASONING_EFFORT = "low"
    $env:HTTP_PROXY = $ProxyUrl
    $env:HTTPS_PROXY = $ProxyUrl
    Start-Process -FilePath $agentExe -WorkingDirectory $agentWorkdir -WindowStyle Hidden -RedirectStandardOutput (Join-Path $agentRuntime "agent.out.log") -RedirectStandardError (Join-Path $agentRuntime "agent.err.log")
}