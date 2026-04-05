$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$listener = [System.Net.HttpListener]::new()
$listener.Prefixes.Add("http://127.0.0.1:8000/")
$listener.Start()

$contentTypes = @{
  ".css"  = "text/css"
  ".htm"  = "text/html"
  ".html" = "text/html"
  ".iso"  = "application/octet-stream"
  ".js"   = "application/javascript"
  ".json" = "application/json"
  ".map"  = "application/json"
  ".wasm" = "application/wasm"
}

Write-Host "Serving $root at http://127.0.0.1:8000"
Write-Host "Press Ctrl+C to stop."

try {
  while ($listener.IsListening) {
    $context = $listener.GetContext()
    $request = $context.Request
    $response = $context.Response

    try {
      $relativePath = [System.Uri]::UnescapeDataString($request.Url.AbsolutePath.TrimStart('/'))
      if ([string]::IsNullOrWhiteSpace($relativePath)) {
        $relativePath = "index.html"
      }

      $candidatePath = Join-Path $root $relativePath
      $fullPath = [System.IO.Path]::GetFullPath($candidatePath)
      if (-not $fullPath.StartsWith([System.IO.Path]::GetFullPath($root), [System.StringComparison]::OrdinalIgnoreCase)) {
        throw "Blocked path traversal attempt."
      }

      if (Test-Path $fullPath -PathType Container) {
        $fullPath = Join-Path $fullPath "index.html"
      }

      if (-not (Test-Path $fullPath -PathType Leaf)) {
        $response.StatusCode = 404
        $body = [System.Text.Encoding]::UTF8.GetBytes("Not found")
        $response.OutputStream.Write($body, 0, $body.Length)
        continue
      }

      $extension = [System.IO.Path]::GetExtension($fullPath).ToLowerInvariant()
      $contentType = $contentTypes[$extension]
      if (-not $contentType) {
        $contentType = "application/octet-stream"
      }

      $bytes = [System.IO.File]::ReadAllBytes($fullPath)
      $response.StatusCode = 200
      $response.ContentType = $contentType
      $response.ContentLength64 = $bytes.Length
      $response.Headers["Cross-Origin-Opener-Policy"] = "same-origin"
      $response.Headers["Cross-Origin-Embedder-Policy"] = "require-corp"
      $response.Headers["Cross-Origin-Resource-Policy"] = "same-origin"
      $response.OutputStream.Write($bytes, 0, $bytes.Length)
    } catch {
      if ($response.StatusCode -eq 200) {
        $response.StatusCode = 500
      }
      $body = [System.Text.Encoding]::UTF8.GetBytes($_.Exception.Message)
      $response.OutputStream.Write($body, 0, $body.Length)
    } finally {
      $response.OutputStream.Close()
    }
  }
} finally {
  $listener.Stop()
  $listener.Close()
}
