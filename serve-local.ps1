param([int]$Port = 8765)

$ErrorActionPreference = "Stop"
$root = [System.IO.Path]::GetFullPath((Split-Path -Parent $MyInvocation.MyCommand.Path))
$rootPrefix = $root.TrimEnd([System.IO.Path]::DirectorySeparatorChar) + [System.IO.Path]::DirectorySeparatorChar
$listener = [System.Net.HttpListener]::new()
$listener.Prefixes.Add("http://127.0.0.1:$Port/")
$listener.Start()

$contentTypes = @{
  ".css" = "text/css; charset=utf-8"
  ".html" = "text/html; charset=utf-8"
  ".js" = "application/javascript; charset=utf-8"
  ".json" = "application/json; charset=utf-8"
  ".wasm" = "application/wasm"
  ".iso" = "application/octet-stream"
  ".001" = "application/octet-stream"
}

Write-Host "Serving $root at http://127.0.0.1:$Port/?source=local"
Write-Host "Press Ctrl+C to stop."

try {
  while ($listener.IsListening) {
    $context = $listener.GetContext()
    $response = $context.Response
    try {
      $relative = [System.Uri]::UnescapeDataString($context.Request.Url.AbsolutePath.TrimStart('/'))
      if ([string]::IsNullOrWhiteSpace($relative)) { $relative = "index.html" }
      $path = [System.IO.Path]::GetFullPath((Join-Path $root $relative))
      if (($path -ne $root) -and (-not $path.StartsWith($rootPrefix, [System.StringComparison]::OrdinalIgnoreCase))) { throw "Blocked path." }
      if (-not [System.IO.File]::Exists($path)) { $response.StatusCode = 404; throw "Not found." }
      $extension = [System.IO.Path]::GetExtension($path).ToLowerInvariant()
      $response.ContentType = if ($contentTypes.ContainsKey($extension)) { $contentTypes[$extension] } else { "application/octet-stream" }
      $response.Headers["Cross-Origin-Opener-Policy"] = "same-origin"
      $response.Headers["Cross-Origin-Embedder-Policy"] = "require-corp"
      $response.Headers["Cross-Origin-Resource-Policy"] = "cross-origin"
      $stream = [System.IO.File]::OpenRead($path)
      try {
        $response.ContentLength64 = $stream.Length
        $stream.CopyTo($response.OutputStream, 1048576)
      } finally { $stream.Dispose() }
    } catch {
      if ($response.StatusCode -eq 200) { $response.StatusCode = 500 }
    } finally { $response.OutputStream.Close() }
  }
} finally {
  $listener.Stop()
  $listener.Close()
}
