     1|# lazy-claudecode bootstrap SessionStart hook for native Windows (Windows PowerShell 5.1).
     2|# Claude Code runs hooks through %COMSPEC%, so node may be absent from PATH entirely;
     3|# this script provisions it silently: node on PATH -> common install dirs ->
     4|# winget OpenJS.NodeJS.LTS -> portable ZIP pinned by manifests/node.json
     5|# (sha256-verified, extracted under <claudeHome>\runtime\node, USER PATH append).
     6|# Git Bash is prepared best-effort on the provisioning path, then the script
     7|# delegates to the bundled node hook. It always exits 0: provisioning failures
     8|# are logged to $env:PLUGIN_DATA\bootstrap\ps-bootstrap.log, never block a session.
     9|
    10|$ErrorActionPreference = "Continue"
    11|[Net.ServicePointManager]::SecurityProtocol = [Net.ServicePointManager]::SecurityProtocol -bor [Net.SecurityProtocolType]::Tls12
    12|
    13|$script:LogPath = $null
    14|$script:DoctorHint = "npx lazy-claudecode doctor"
    15|$script:NonGitBashLauncherDirSegments = @("\windows\system32\", "\microsoft\windowsapps\")
    16|
    17|function Initialize-BootstrapLog {
    18|	if ([string]::IsNullOrWhiteSpace($env:PLUGIN_DATA)) { return }
    19|	try {
    20|		$logDirectory = Join-Path $env:PLUGIN_DATA "bootstrap"
    21|		if (-not (Test-Path -LiteralPath $logDirectory)) {
    22|			New-Item -ItemType Directory -Path $logDirectory -Force | Out-Null
    23|		}
    24|		$script:LogPath = Join-Path $logDirectory "ps-bootstrap.log"
    25|	} catch {
    26|		$script:LogPath = $null
    27|	}
    28|}
    29|
    30|function Write-BootstrapLog {
    31|	param([string]$Message)
    32|	if ($null -eq $script:LogPath) { return }
    33|	try {
    34|		$stamp = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
    35|		Add-Content -LiteralPath $script:LogPath -Value ($stamp + " " + $Message) -Encoding ASCII
    36|	} catch { }
    37|}
    38|
    39|function Resolve-ClaudeHome {
    40|	if (-not [string]::IsNullOrWhiteSpace($env:CLAUDE_HOME)) { return $env:CLAUDE_HOME.Trim() }
    41|	if (-not [string]::IsNullOrWhiteSpace($env:PLUGIN_ROOT)) {
    42|		$current = $env:PLUGIN_ROOT
    43|		for ($level = 0; $level -lt 6; $level += 1) {
    44|			$parent = Split-Path -Path $current -Parent
    45|			if ([string]::IsNullOrEmpty($parent) -or ($parent -eq $current)) { break }
    46|			$current = $parent
    47|			if (Test-Path -LiteralPath (Join-Path $current "config.toml") -PathType Leaf) { return $current }
    48|		}
    49|	}
    50|	return (Join-Path $env:USERPROFILE ".claude")
    51|}
    52|
    53|function Get-NodeManifest {
    54|	$manifestPath = Join-Path $env:PLUGIN_ROOT "components\bootstrap\manifests\node.json"
    55|	if (-not (Test-Path -LiteralPath $manifestPath -PathType Leaf)) {
    56|		Write-BootstrapLog ("degraded component=node reason=manifest-missing path=" + $manifestPath + " hint=" + $script:DoctorHint)
    57|		return $null
    58|	}
    59|	try {
    60|		return (Get-Content -LiteralPath $manifestPath -Raw | ConvertFrom-Json)
    61|	} catch {
    62|		Write-BootstrapLog ("degraded component=node reason=manifest-unparsable path=" + $manifestPath + " hint=" + $script:DoctorHint)
    63|		return $null
    64|	}
    65|}
    66|
    67|function Get-PortableNodeDirectory {
    68|	param([string]$ClaudeHome, $Manifest)
    69|	$runtimeRoot = Join-Path $ClaudeHome "runtime\node"
    70|	return (Join-Path $runtimeRoot ("node-v" + $Manifest.version + "-win-x64"))
    71|}
    72|
    73|function Resolve-NodeCommand {
    74|	param([string]$ClaudeHome, $Manifest)
    75|	$onPath = Get-Command node -CommandType Application -ErrorAction SilentlyContinue
    76|	if ($null -ne $onPath) {
    77|		return (@($onPath)[0]).Source
    78|	}
    79|	$candidateDirectories = @()
    80|	if (-not [string]::IsNullOrWhiteSpace($env:ProgramFiles)) {
    81|		$candidateDirectories += (Join-Path $env:ProgramFiles "nodejs")
    82|	}
    83|	if (-not [string]::IsNullOrWhiteSpace($env:LOCALAPPDATA)) {
    84|		$candidateDirectories += (Join-Path $env:LOCALAPPDATA "Programs\nodejs")
    85|	}
    86|	if ($null -ne $Manifest) {
    87|		$candidateDirectories += (Get-PortableNodeDirectory -ClaudeHome $ClaudeHome -Manifest $Manifest)
    88|	}
    89|	foreach ($directory in $candidateDirectories) {
    90|		$candidate = Join-Path $directory "node.exe"
    91|		if (Test-Path -LiteralPath $candidate -PathType Leaf) { return $candidate }
    92|	}
    93|	return $null
    94|}
    95|
    96|function Install-NodeWithWinget {
    97|	$winget = Get-Command winget -ErrorAction SilentlyContinue
    98|	if ($null -eq $winget) {
    99|		Write-BootstrapLog "winget unavailable; skipping winget node install"
   100|		return
   101|	}
   102|	Write-BootstrapLog "installing node via: winget install OpenJS.NodeJS.LTS --silent"
   103|	try {
   104|		& winget install OpenJS.NodeJS.LTS --silent --accept-package-agreements --accept-source-agreements | Out-Null
   105|		Write-BootstrapLog ("winget node install finished with exit code " + $LASTEXITCODE)
   106|	} catch {
   107|		Write-BootstrapLog ("winget node install failed: " + $_.Exception.Message)
   108|	}
   109|}
   110|
   111|function Add-UserPathEntry {
   112|	param([string]$Directory)
   113|	$normalizedTarget = $Directory.TrimEnd("\")
   114|	$currentPath = [Environment]::GetEnvironmentVariable("Path", "User")
   115|	if ($null -eq $currentPath) { $currentPath = "" }
   116|	foreach ($entry in $currentPath.Split(";")) {
   117|		if ($entry.Trim().TrimEnd("\") -eq $normalizedTarget) {
   118|			Write-BootstrapLog ("user PATH already contains " + $Directory + "; leaving it unchanged")
   119|			return
   120|		}
   121|	}
   122|	if ($currentPath.Trim().Length -eq 0) {
   123|		$updatedPath = $Directory
   124|	} else {
   125|		$updatedPath = $currentPath.TrimEnd(";") + ";" + $Directory
   126|	}
   127|	[Environment]::SetEnvironmentVariable("Path", $updatedPath, "User")
   128|	Write-BootstrapLog ("appended " + $Directory + " to the USER PATH; restart Claude Code so new sessions can see node")
   129|}
   130|
   131|function Install-PortableNode {
   132|	param([string]$ClaudeHome, $Manifest)
   133|	if ($null -eq $Manifest) { return $null }
   134|	$platformEntry = $Manifest.platforms."win32-x64"
   135|	if ($null -eq $platformEntry) {
   136|		Write-BootstrapLog ("degraded component=node reason=manifest-missing-win32-x64 hint=" + $script:DoctorHint)
   137|		return $null
   138|	}
   139|	$zipPath = Join-Path $env:TEMP ("lazy-claudecode-node-v" + $Manifest.version + "-win-x64.zip")
   140|	Write-BootstrapLog ("downloading portable node from " + $platformEntry.url)
   141|	try {
   142|		Invoke-WebRequest -Uri $platformEntry.url -OutFile $zipPath -UseBasicParsing
   143|	} catch {
   144|		Write-BootstrapLog ("degraded component=node reason=download-failed url=" + $platformEntry.url + " error=" + $_.Exception.Message + " hint=" + $script:DoctorHint)
   145|		return $null
   146|	}
   147|	$expectedHash = ([string]$platformEntry.sha256).ToLowerInvariant()
   148|	$actualHash = (Get-FileHash -LiteralPath $zipPath -Algorithm SHA256).Hash.ToLowerInvariant()
   149|	if ($actualHash -ne $expectedHash) {
   150|		Remove-Item -LiteralPath $zipPath -Force -ErrorAction SilentlyContinue
   151|		Write-BootstrapLog ("degraded component=node reason=sha256-mismatch expected=" + $expectedHash + " actual=" + $actualHash + " hint=" + $script:DoctorHint)
   152|		return $null
   153|	}
   154|	$runtimeRoot = Join-Path $ClaudeHome "runtime\node"
   155|	try {
   156|		if (-not (Test-Path -LiteralPath $runtimeRoot)) {
   157|			New-Item -ItemType Directory -Path $runtimeRoot -Force | Out-Null
   158|		}
   159|		Expand-Archive -LiteralPath $zipPath -DestinationPath $runtimeRoot -Force
   160|	} catch {
   161|		Write-BootstrapLog ("degraded component=node reason=extract-failed error=" + $_.Exception.Message + " hint=" + $script:DoctorHint)
   162|		return $null
   163|	} finally {
   164|		Remove-Item -LiteralPath $zipPath -Force -ErrorAction SilentlyContinue
   165|	}
   166|	$nodeDirectory = Get-PortableNodeDirectory -ClaudeHome $ClaudeHome -Manifest $Manifest
   167|	$nodeExe = Join-Path $nodeDirectory "node.exe"
   168|	if (-not (Test-Path -LiteralPath $nodeExe -PathType Leaf)) {
   169|		Write-BootstrapLog ("degraded component=node reason=extracted-layout-unexpected expected=" + $nodeExe + " hint=" + $script:DoctorHint)
   170|		return $null
   171|	}
   172|	Write-BootstrapLog ("portable node provisioned at " + $nodeExe)
   173|	Add-UserPathEntry -Directory $nodeDirectory
   174|	return $nodeExe
   175|}
   176|
   177|function Test-KnownNonGitBashLauncher {
   178|	param([string]$CandidatePath)
   179|	$normalized = $CandidatePath.Replace("/", "\").ToLowerInvariant()
   180|	foreach ($segment in $script:NonGitBashLauncherDirSegments) {
   181|		if ($normalized.Contains($segment)) { return $true }
   182|	}
   183|	return $false
   184|}
   185|
   186|function Resolve-GitBash {
   187|	if (-not [string]::IsNullOrWhiteSpace($env:LCC_CLAUDE_GIT_BASH_PATH)) {
   188|		$envCandidate = $env:LCC_CLAUDE_GIT_BASH_PATH.Trim()
   189|		if ($envCandidate.ToLowerInvariant().EndsWith("bash.exe") -and (Test-Path -LiteralPath $envCandidate -PathType Leaf)) {
   190|			return @{ Path = $envCandidate; Source = "env" }
   191|		}
   192|		return $null
   193|	}
   194|	$programFilesCandidates = @()
   195|	if (-not [string]::IsNullOrWhiteSpace($env:ProgramFiles)) {
   196|		$programFilesCandidates += (Join-Path $env:ProgramFiles "Git\bin\bash.exe")
   197|	}
   198|	$programFilesX86 = ${env:ProgramFiles(x86)}
   199|	if (-not [string]::IsNullOrWhiteSpace($programFilesX86)) {
   200|		$programFilesCandidates += (Join-Path $programFilesX86 "Git\bin\bash.exe")
   201|	}
   202|	foreach ($candidate in $programFilesCandidates) {
   203|		if (Test-Path -LiteralPath $candidate -PathType Leaf) {
   204|			return @{ Path = $candidate; Source = "program-files" }
   205|		}
   206|	}
   207|	$whereOutput = @()
   208|	try { $whereOutput = & where.exe bash 2>$null } catch { $whereOutput = @() }
   209|	foreach ($rawLine in @($whereOutput)) {
   210|		if ($null -eq $rawLine) { continue }
   211|		$candidate = ([string]$rawLine).Trim()
   212|		if ($candidate.Length -eq 0) { continue }
   213|		if (Test-KnownNonGitBashLauncher -CandidatePath $candidate) { continue }
   214|		if ($candidate.ToLowerInvariant().EndsWith("bash.exe") -and (Test-Path -LiteralPath $candidate -PathType Leaf)) {
   215|			return @{ Path = $candidate; Source = "path" }
   216|		}
   217|	}
   218|	return $null
   219|}
   220|
   221|function Initialize-GitBash {
   222|	$resolution = Resolve-GitBash
   223|	if (($null -eq $resolution) -and ($env:LCC_CLAUDE_SKIP_GIT_BASH_AUTO_INSTALL -ne "1")) {
   224|		$winget = Get-Command winget -ErrorAction SilentlyContinue
   225|		if ($null -ne $winget) {
   226|			Write-BootstrapLog "installing git bash via: winget install --id Git.Git -e --source winget"
   227|			try {
   228|				& winget install --id Git.Git -e --source winget | Out-Null
   229|				Write-BootstrapLog ("winget git install finished with exit code " + $LASTEXITCODE)
   230|			} catch {
   231|				Write-BootstrapLog ("winget git install failed: " + $_.Exception.Message)
   232|			}
   233|			$resolution = Resolve-GitBash
   234|		} else {
   235|			Write-BootstrapLog "winget unavailable; skipping git bash install"
   236|		}
   237|	}
   238|	if ($null -eq $resolution) {
   239|		Write-BootstrapLog ("degraded component=git_bash reason=not-found install=winget install --id Git.Git -e --source winget hint=" + $script:DoctorHint)
   240|		return
   241|	}
   242|	Write-BootstrapLog ("git bash resolved at " + $resolution.Path + " source=" + $resolution.Source)
   243|	if ($resolution.Source -eq "path") {
   244|		$persisted = [Environment]::GetEnvironmentVariable("LCC_CLAUDE_GIT_BASH_PATH", "User")
   245|		if ([string]::IsNullOrWhiteSpace($persisted)) {
   246|			[Environment]::SetEnvironmentVariable("LCC_CLAUDE_GIT_BASH_PATH", $resolution.Path, "User")
   247|			Write-BootstrapLog ("persisted LCC_CLAUDE_GIT_BASH_PATH=" + $resolution.Path + " in the USER environment; restart Claude Code to pick it up")
   248|		}
   249|	}
   250|}
   251|
   252|function Invoke-NodeHookDelegate {
   253|	param([string]$NodeExe)
   254|	$hookCli = Join-Path $env:PLUGIN_ROOT "components\bootstrap\dist\cli.js"
   255|	if (-not (Test-Path -LiteralPath $hookCli -PathType Leaf)) {
   256|		Write-BootstrapLog ("degraded component=bootstrap reason=hook-cli-missing path=" + $hookCli + " hint=" + $script:DoctorHint)
   257|		return
   258|	}
   259|	Write-BootstrapLog ("delegating to node hook: " + $NodeExe + " " + $hookCli + " hook session-start")
   260|	& $NodeExe $hookCli hook session-start
   261|	Write-BootstrapLog ("node hook exited with code " + $LASTEXITCODE)
   262|}
   263|
   264|function Write-ProvisioningIncompleteNotice {
   265|	$notice = "lazy-claudecode bootstrap: Node.js is not available yet. Install Node LTS (winget install OpenJS.NodeJS.LTS), then restart Claude Code. Diagnose with: " + $script:DoctorHint
   266|	$payload = @{
   267|		hookSpecificOutput = @{
   268|			hookEventName = "SessionStart"
   269|			additionalContext = $notice
   270|		}
   271|	}
   272|	Write-Output (ConvertTo-Json -InputObject $payload -Compress -Depth 4)
   273|}
   274|
   275|function Invoke-Bootstrap {
   276|	Initialize-BootstrapLog
   277|	Write-BootstrapLog "bootstrap.ps1 session-start begin"
   278|	if ([string]::IsNullOrWhiteSpace($env:PLUGIN_ROOT)) {
   279|		Write-BootstrapLog "PLUGIN_ROOT missing; skipping bootstrap"
   280|		return
   281|	}
   282|	$claudeHome = Resolve-ClaudeHome
   283|	Write-BootstrapLog ("claude home resolved to " + $claudeHome)
   284|	$manifest = Get-NodeManifest
   285|	$nodeExe = Resolve-NodeCommand -ClaudeHome $claudeHome -Manifest $manifest
   286|	if ($null -ne $nodeExe) {
   287|		Write-BootstrapLog ("node already available at " + $nodeExe)
   288|		Invoke-NodeHookDelegate -NodeExe $nodeExe
   289|		return
   290|	}
   291|	Install-NodeWithWinget
   292|	$nodeExe = Resolve-NodeCommand -ClaudeHome $claudeHome -Manifest $manifest
   293|	if ($null -eq $nodeExe) {
   294|		$nodeExe = Install-PortableNode -ClaudeHome $claudeHome -Manifest $manifest
   295|	}
   296|	Initialize-GitBash
   297|	if ($null -eq $nodeExe) {
   298|		Write-BootstrapLog ("degraded component=node reason=unresolved hint=" + $script:DoctorHint)
   299|		Write-ProvisioningIncompleteNotice
   300|		return
   301|	}
   302|	Invoke-NodeHookDelegate -NodeExe $nodeExe
   303|}
   304|
   305|try {
   306|	Invoke-Bootstrap
   307|} catch {
   308|	try { Write-BootstrapLog ("unhandled bootstrap error: " + $_.Exception.Message) } catch { }
   309|}
   310|exit 0