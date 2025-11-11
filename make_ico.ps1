# Build a single-image ICO file by embedding the existing PNG bytes.
# Works without ImageMagick or Python.

$png = 'favicon.png'
$ico = 'favicon.ico'

if (-not (Test-Path $png)) {
    Write-Output "ERROR: Source PNG not found: $png"
    exit 1
}

$pngBytes = [System.IO.File]::ReadAllBytes($png)
# Parse PNG IHDR width/height (big-endian) at byte offset 16 and 20
$widthBytes = $pngBytes[16..19]
[Array]::Reverse($widthBytes)
$w = [System.BitConverter]::ToUInt32($widthBytes, 0)

$heightBytes = $pngBytes[20..23]
[Array]::Reverse($heightBytes)
$h = [System.BitConverter]::ToUInt32($heightBytes, 0)

# Limit width/height to 0-255 for ICO entry (0 means 256)
$bw = if ($w -ge 256) { 0 } else { [byte]$w }
$bh = if ($h -ge 256) { 0 } else { [byte]$h }

$ms = New-Object System.IO.MemoryStream
$bwByte = [byte]$bw
$bhByte = [byte]$bh

# ICONDIR: reserved(2)=0, type(2)=1, count(2)=1
$ms.WriteByte(0); $ms.WriteByte(0)
$ms.WriteByte(1); $ms.WriteByte(0)
$ms.WriteByte(1); $ms.WriteByte(0)

# ICONDIRENTRY (16 bytes): bWidth, bHeight, bColorCount, bReserved, wPlanes(2), wBitCount(2), dwBytesInRes(4), dwImageOffset(4)
$ms.Write([byte[]]($bwByte,$bhByte,0,0),0,4)
# planes + bitcount (we'll set to 0 for PNG)
$ms.WriteByte(0); $ms.WriteByte(0)
$ms.WriteByte(0); $ms.WriteByte(0)

# dwBytesInRes (uint32 little-endian)
$len = $pngBytes.Length
$lenBytes = [System.BitConverter]::GetBytes([uint32]$len)
$ms.Write($lenBytes,0,4)

# dwImageOffset => header(6) + entry(16) = 22
$offsetBytes = [System.BitConverter]::GetBytes([uint32]22)
$ms.Write($offsetBytes,0,4)

# write PNG bytes
$ms.Write($pngBytes,0,$pngBytes.Length)

# save ICO
[System.IO.File]::WriteAllBytes($ico,$ms.ToArray())
Write-Output "ICO_CREATED $ico (embedded PNG: ${w}x${h}, bytes=$len)"
