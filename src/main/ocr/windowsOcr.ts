import { spawn } from 'node:child_process';
import type { OcrLine, OcrPage, OcrWord } from '../../shared/form/readContent/ocrTypes';

const SCRIPT = `
$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
Add-Type -AssemblyName System.Runtime.WindowsRuntime

function Get-AwaitMethod([string]$typeName) {
  return ([System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object {
    $_.Name -eq 'AsTask' -and $_.GetParameters().Count -eq 1 -and $_.GetParameters()[0].ParameterType.Name -eq $typeName
  } | Select-Object -First 1)
}

$AwaitOp = Get-AwaitMethod 'IAsyncOperation\`1'
$AwaitAction = Get-AwaitMethod 'IAsyncAction'

function Await($operation, $resultType) {
  $task = $AwaitOp.MakeGenericMethod($resultType).Invoke($null, @($operation))
  $task.Wait(-1) | Out-Null
  if ($task.IsFaulted) { throw $task.Exception.GetBaseException() }
  return $task.Result
}

function AwaitAction($action) {
  $task = $AwaitAction.Invoke($null, @($action))
  $task.Wait(-1) | Out-Null
  if ($task.IsFaulted) { throw $task.Exception.GetBaseException() }
}

$null = [Windows.Storage.StorageFile, Windows.Storage, ContentType = WindowsRuntime]
$null = [Windows.Storage.Streams.InMemoryRandomAccessStream, Windows.Storage.Streams, ContentType = WindowsRuntime]
$null = [Windows.Graphics.Imaging.BitmapDecoder, Windows.Graphics.Imaging, ContentType = WindowsRuntime]
$null = [Windows.Graphics.Imaging.BitmapTransform, Windows.Graphics.Imaging, ContentType = WindowsRuntime]
$null = [Windows.Graphics.Imaging.SoftwareBitmap, Windows.Graphics.Imaging, ContentType = WindowsRuntime]
$null = [Windows.Media.Ocr.OcrEngine, Windows.Foundation, ContentType = WindowsRuntime]
$null = [Windows.Data.Pdf.PdfDocument, Windows.Data.Pdf, ContentType = WindowsRuntime]

$engine = [Windows.Media.Ocr.OcrEngine]::TryCreateFromUserProfileLanguages()
if (-not $engine) { throw 'Windows OCR is not available. Add an English language pack in Windows settings.' }

function Convert-Bitmap($bitmap) {
  $format = [Windows.Graphics.Imaging.BitmapPixelFormat]::Bgra8
  $alpha = [Windows.Graphics.Imaging.BitmapAlphaMode]::Premultiplied
  if ($bitmap.BitmapPixelFormat -ne $format -or $bitmap.BitmapAlphaMode -ne $alpha) {
    return [Windows.Graphics.Imaging.SoftwareBitmap]::Convert($bitmap, $format, $alpha)
  }
  return $bitmap
}

function Read-Bitmap($bitmap, $inkBitmap) {
  $prepared = Convert-Bitmap $bitmap
  $result = Await ($engine.RecognizeAsync($prepared)) ([Windows.Media.Ocr.OcrResult])
  $width = [double]$prepared.PixelWidth
  $height = [double]$prepared.PixelHeight
  if ($width -le 0 -or $height -le 0) { throw 'Could not read that image.' }
  $lines = @()
  foreach ($line in $result.Lines) {
    $words = @()
    $minX = [double]::MaxValue; $minY = [double]::MaxValue; $maxX = 0; $maxY = 0
    foreach ($word in $line.Words) {
      $rect = $word.BoundingRect
      $x = [double]$rect.X / $width
      $y = [double]$rect.Y / $height
      $w = [double]$rect.Width / $width
      $h = [double]$rect.Height / $height
      if (($x + $w) -gt $maxX) { $maxX = $x + $w }
      if (($y + $h) -gt $maxY) { $maxY = $y + $h }
      if ($x -lt $minX) { $minX = $x }
      if ($y -lt $minY) { $minY = $y }
      $words += @{ text = [string]$word.Text; x = $x; y = $y; w = $w; h = $h }
    }
    if ($words.Count -eq 0) { continue }
    $lines += @{
      text = [string]$line.Text
      x = $minX; y = $minY; w = [Math]::Max(0, $maxX - $minX); h = [Math]::Max(0, $maxY - $minY)
      words = $words
    }
  }
  $ink = Convert-Bitmap $inkBitmap
  $lines = Add-SummaryMarks $ink $lines ([int]$ink.PixelWidth) ([int]$ink.PixelHeight)
  return @{ lines = $lines }
}

function Add-SummaryMarks($bitmap, $lines, $width, $height) {
  $yes = $null
  $no = $null
  foreach ($line in $lines) {
    foreach ($word in $line.words) {
      $token = ([string]$word.text).Trim().ToLower()
      if ($token -eq 'yes' -and [double]$word.x -lt 0.22) { $yes = $word }
      if ($token -eq 'no' -and [double]$word.x -lt 0.30) { $no = $word }
    }
  }
  if (-not $yes -or -not $no) { return $lines }
  if ([Math]::Abs([double]$yes.y - [double]$no.y) -gt 0.02) { return $lines }
  if ([double]$no.x -le [double]$yes.x) { return $lines }

  $stride = $width * 4
  $length = $stride * $height
  $buffer = New-Object Windows.Storage.Streams.Buffer ([uint32]$length)
  [void]$bitmap.CopyToBuffer($buffer)
  $reader = [Windows.Storage.Streams.DataReader]::FromBuffer($buffer)
  $bytes = New-Object byte[] $length
  [void]$reader.ReadBytes($bytes)
  $paperSum = 0.0
  $paperCount = 0
  for ($y = [int]($height * 0.25); $y -lt [int]($height * 0.75); $y += 28) {
    for ($x = [int]($width * 0.35); $x -lt [int]($width * 0.75); $x += 28) {
      $i = $y * $stride + $x * 4
      if ($i + 2 -ge $bytes.Length) { continue }
      $paperSum += ([int]$bytes[$i] + [int]$bytes[$i + 1] + [int]$bytes[$i + 2]) / 3.0
      $paperCount++
    }
  }
  if ($paperCount -eq 0) { return $lines }
  $cutoff = ($paperSum / $paperCount) * 0.85
  $yesCenter = [int]((([double]$yes.x + [double]$yes.w / 2.0)) * $width)
  $noCenter = [int]((([double]$no.x + [double]$no.w / 2.0)) * $width)

  function Get-DarkRatio([int]$centerX, [int]$centerY) {
    $halfW = [Math]::Max(10, [int]($width * 0.022))
    $halfH = [Math]::Max(8, [int]($height * 0.01))
    $dark = 0
    $seen = 0
    for ($py = $centerY - $halfH; $py -le $centerY + $halfH; $py += 2) {
      if ($py -lt 0 -or $py -ge $height) { continue }
      for ($px = $centerX - $halfW; $px -le $centerX + $halfW; $px += 2) {
        if ($px -lt 0 -or $px -ge $width) { continue }
        $pi = $py * $stride + $px * 4
        $seen++
        $luma = ([int]$bytes[$pi] + [int]$bytes[$pi + 1] + [int]$bytes[$pi + 2]) / 3.0
        if ($luma -lt ($cutoff * 0.72)) { $dark++ }
      }
    }
    if ($seen -eq 0) { return 0 }
    return $dark
  }

  $rows = New-Object System.Collections.Generic.List[object]
  foreach ($line in ($lines | Sort-Object { [double]$_.y })) {
    if ([double]$line.y -lt ([double]$yes.y + 0.012)) { continue }
    if ([double]$line.x -lt ([double]$no.x + 0.03)) { continue }
    if ([double]$line.y -gt ([double]$yes.y + 0.42)) { continue }
    if ([double]$line.x -gt 0.32) { continue }
    if ($rows.Count -gt 0 -and ([double]$line.y - [double]$rows[$rows.Count - 1].bottom) -lt 0.016) {
      $rows[$rows.Count - 1].bottom = [double]$line.y + [double]$line.h
    } else {
      $rows.Add(@{ top = [double]$line.y; bottom = [double]$line.y + [double]$line.h }) | Out-Null
    }
  }

  $inkCutoff = $cutoff * 0.72
  function Get-InkSpan([int]$centerX, [int]$peakY) {
    $span = 0
    $started = $false
    for ($py = $peakY - 36; $py -le $peakY + 36; $py += 3) {
      $n = 0
      for ($px = $centerX - 18; $px -le $centerX + 18; $px += 2) {
        if ($px -lt 0 -or $py -lt 0 -or $px -ge $width -or $py -ge $height) { continue }
        $pi = $py * $stride + $px * 4
        $luma = ([int]$bytes[$pi] + [int]$bytes[$pi + 1] + [int]$bytes[$pi + 2]) / 3.0
          if ($luma -lt $inkCutoff) { $n++ }
      }
      if ($n -ge 2) { $span += 3; $started = $true }
      elseif ($started -and $py -gt $peakY) { break }
    }
    return $span
  }
  $marks = New-Object System.Collections.Generic.List[object]
  for ($index = 0; $index -lt $rows.Count; $index++) {
    $top = [int]($rows[$index].top * $height) + [int]($height * 0.006)
    $limit = if ($index + 1 -lt $rows.Count) { [int]($rows[$index + 1].top * $height) } else { $top + [int]($height * 0.035) }
    if (($limit - $top) -gt [int]($height * 0.06)) { $limit = $top + [int]($height * 0.06) }
    $bestYes = 0.0
    $bestNo = 0.0
    $bestYesY = $top
    $bestNoY = $top
    for ($py = $top; $py -lt $limit; $py += 4) {
      $yesRatio = Get-DarkRatio $yesCenter $py
      $noRatio = Get-DarkRatio $noCenter $py
      if ($yesRatio -gt $bestYes) { $bestYes = $yesRatio; $bestYesY = $py }
      if ($noRatio -gt $bestNo) { $bestNo = $noRatio; $bestNoY = $py }
    }
    $column = $null
    $markX = 0.0
    $markY = 0
    $yesMark = ($bestYes -ge 5 -and $bestYes -gt ($bestNo * 1.6) -and (Get-InkSpan $yesCenter $bestYesY) -ge 12)
    $noMark = ($bestNo -ge 5 -and $bestNo -gt ($bestYes * 1.6) -and (Get-InkSpan $noCenter $bestNoY) -ge 12)
    if ($yesMark) {
      $column = $yesCenter
      $markX = $yesCenter / $width
      $markY = $bestYesY
    } elseif ($noMark) {
      $column = $noCenter
      $markX = $noCenter / $width
      $markY = $bestNoY
    }
    if ($null -eq $column) { continue }
    $ny = [double]$markY / [double]$height
    $marks.Add(@{
      text = '✓'
      x = $markX; y = $ny; w = 0.02; h = 0.012
      words = @(@{ text = '✓'; x = $markX; y = $ny; w = 0.02; h = 0.012 })
    }) | Out-Null
  }
  if ($marks.Count -eq 0) { return ,$lines }
  foreach ($line in $lines) { $line }
  foreach ($mark in $marks) { $mark }
}

function Read-Stream($stream) {
  $stream.Seek(0) | Out-Null
  $decoder = Await ([Windows.Graphics.Imaging.BitmapDecoder]::CreateAsync($stream)) ([Windows.Graphics.Imaging.BitmapDecoder])
  $orientedW = [int]$decoder.OrientedPixelWidth
  $orientedH = [int]$decoder.OrientedPixelHeight
  if ($orientedW -le 0) { $orientedW = [int]$decoder.PixelWidth }
  if ($orientedH -le 0) { $orientedH = [int]$decoder.PixelHeight }
  $long = [Math]::Max($orientedW, $orientedH)
  $scale = 1.0
  if ($long -gt 2400 -or ($long -gt 0 -and $long -lt 1600)) { $scale = 2000.0 / $long }
  $transform = New-Object Windows.Graphics.Imaging.BitmapTransform
  $transform.ScaledWidth = [uint32]([Math]::Max(1, [int]($orientedW * $scale)))
  $transform.ScaledHeight = [uint32]([Math]::Max(1, [int]($orientedH * $scale)))
  $bitmap = Await ($decoder.GetSoftwareBitmapAsync(
    [Windows.Graphics.Imaging.BitmapPixelFormat]::Bgra8,
    [Windows.Graphics.Imaging.BitmapAlphaMode]::Premultiplied,
    $transform,
    [Windows.Graphics.Imaging.ExifOrientationMode]::RespectExifOrientation,
    [Windows.Graphics.Imaging.ColorManagementMode]::DoNotColorManage
  )) ([Windows.Graphics.Imaging.SoftwareBitmap])
  $stream.Seek(0) | Out-Null
  $inkDecoder = Await ([Windows.Graphics.Imaging.BitmapDecoder]::CreateAsync($stream)) ([Windows.Graphics.Imaging.BitmapDecoder])
  $inkLong = [Math]::Max($orientedW, $orientedH)
  $inkScale = 1.0
  if ($inkLong -gt 3400) { $inkScale = 3400.0 / $inkLong }
  $inkTransform = New-Object Windows.Graphics.Imaging.BitmapTransform
  $inkTransform.ScaledWidth = [uint32]([Math]::Max(1, [int]($orientedW * $inkScale)))
  $inkTransform.ScaledHeight = [uint32]([Math]::Max(1, [int]($orientedH * $inkScale)))
  $inkBitmap = Await ($inkDecoder.GetSoftwareBitmapAsync(
    [Windows.Graphics.Imaging.BitmapPixelFormat]::Bgra8,
    [Windows.Graphics.Imaging.BitmapAlphaMode]::Premultiplied,
    $inkTransform,
    [Windows.Graphics.Imaging.ExifOrientationMode]::RespectExifOrientation,
    [Windows.Graphics.Imaging.ColorManagementMode]::DoNotColorManage
  )) ([Windows.Graphics.Imaging.SoftwareBitmap])
  return Read-Bitmap $bitmap $inkBitmap
}

$path = $env:BLAZE_OCR_INPUT
if (-not $path) { throw 'No file was given to read.' }
$file = Await ([Windows.Storage.StorageFile]::GetFileFromPathAsync($path)) ([Windows.Storage.StorageFile])
$ext = [System.IO.Path]::GetExtension($path).ToLowerInvariant()
$pages = @()
if ($ext -eq '.pdf') {
  $pdf = Await ([Windows.Data.Pdf.PdfDocument]::LoadFromFileAsync($file)) ([Windows.Data.Pdf.PdfDocument])
  for ($i = 0; $i -lt $pdf.PageCount; $i++) {
    $pdfPage = $pdf.GetPage($i)
    $stream = New-Object Windows.Storage.Streams.InMemoryRandomAccessStream
    $options = New-Object Windows.Data.Pdf.PdfPageRenderOptions
    $options.DestinationWidth = [uint32]1700
    AwaitAction ($pdfPage.RenderToStreamAsync($stream, $options))
    $pages += Read-Stream $stream
    $pdfPage.Dispose()
    $stream.Dispose()
  }
} else {
  $stream = Await ($file.OpenReadAsync()) ([Windows.Storage.Streams.IRandomAccessStreamWithContentType])
  $pages += Read-Stream $stream
}
$pages | ConvertTo-Json -Compress -Depth 8
`;

type RawWord = { text?: string; x?: number; y?: number; w?: number; h?: number };
type RawLine = { text?: string; x?: number; y?: number; w?: number; h?: number; words?: RawWord[] };
type RawPage = { lines?: RawLine[] };

function asWord(raw: RawWord): OcrWord | null {
  const text = raw.text?.trim() ?? '';
  if (!text) return null;
  return {
    text,
    x: Number(raw.x) || 0,
    y: Number(raw.y) || 0,
    w: Number(raw.w) || 0,
    h: Number(raw.h) || 0,
  };
}

function asPage(raw: RawPage): OcrPage {
  const lines: OcrLine[] = [];
  for (const line of raw.lines ?? []) {
    const words = (line.words ?? []).map(asWord).filter((word): word is OcrWord => word != null);
    const text = (line.text ?? words.map((word) => word.text).join(' ')).trim();
    if (!text) continue;
    lines.push({
      text,
      x: Number(line.x) || 0,
      y: Number(line.y) || 0,
      w: Number(line.w) || 0,
      h: Number(line.h) || 0,
      words,
    });
  }
  return { lines };
}

function runScript(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const encoded = Buffer.from(SCRIPT, 'utf16le').toString('base64');
    const child = spawn(
      'powershell.exe',
      ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-EncodedCommand', encoded],
      { windowsHide: true, env: { ...process.env, BLAZE_OCR_INPUT: filePath } },
    );
    let stdout = '';
    let stderr = '';
    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');
    child.stdout.on('data', (chunk: string) => {
      stdout += chunk;
    });
    child.stderr.on('data', (chunk: string) => {
      stderr += chunk;
    });
    child.on('error', (error) => reject(error));
    child.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(stderr.trim() || stdout.trim() || 'Windows could not read that file.'));
        return;
      }
      const text = stdout.trim();
      if (!text) {
        reject(new Error(stderr.trim() || 'Windows OCR returned no text.'));
        return;
      }
      resolve(text);
    });
  });
}

/** Read one image or every page of a PDF with Windows OCR. */
export async function recognizeDocument(filePath: string): Promise<OcrPage[]> {
  const output = await runScript(filePath);
  const start = output.indexOf('{') === -1 ? output.indexOf('[') : output.indexOf('{');
  if (start < 0) throw new Error(`Windows OCR did not return any text. ${output.slice(0, 500)}`);
  const parsed = JSON.parse(output.slice(start)) as RawPage | RawPage[];
  const pages = Array.isArray(parsed) ? parsed : [parsed];
  return pages.map(asPage);
}
