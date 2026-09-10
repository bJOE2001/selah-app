Add-Type -AssemblyName System.Drawing

$srcForegroundPath = "c:\xampp\htdocs\selah-app\assets\images\backup\android-icon-foreground.png"
$outForegroundPath = "c:\xampp\htdocs\selah-app\assets\images\android-icon-foreground.png"

$srcMonoPath = "c:\xampp\htdocs\selah-app\assets\images\backup\android-icon-monochrome.png"
$outMonoPath = "c:\xampp\htdocs\selah-app\assets\images\android-icon-monochrome.png"

$canvasSize = 1024
$targetSize = 680
$offset = [int](($canvasSize - $targetSize) / 2)

# 1. Padded Android Foreground Icon
$srcFg = [System.Drawing.Image]::FromFile($srcForegroundPath)
$bmpFg = New-Object System.Drawing.Bitmap $canvasSize, $canvasSize
$gFg = [System.Drawing.Graphics]::FromImage($bmpFg)
$gFg.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$gFg.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$gFg.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
$gFg.Clear([System.Drawing.Color]::Transparent)

$destRect = New-Object System.Drawing.Rectangle $offset, $offset, $targetSize, $targetSize
$srcRect = New-Object System.Drawing.Rectangle 0, 0, $srcFg.Width, $srcFg.Height
$gFg.DrawImage($srcFg, $destRect, $srcRect, [System.Drawing.GraphicsUnit]::Pixel)

$srcFg.Dispose()
$gFg.Dispose()
$bmpFg.Save($outForegroundPath, [System.Drawing.Imaging.ImageFormat]::Png)
$bmpFg.Dispose()

# 2. Padded Android Monochrome Icon
$srcMono = [System.Drawing.Image]::FromFile($srcMonoPath)
$bmpMono = New-Object System.Drawing.Bitmap $canvasSize, $canvasSize
$gMono = [System.Drawing.Graphics]::FromImage($bmpMono)
$gMono.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$gMono.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$gMono.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
$gMono.Clear([System.Drawing.Color]::Transparent)

$srcRectMono = New-Object System.Drawing.Rectangle 0, 0, $srcMono.Width, $srcMono.Height
$gMono.DrawImage($srcMono, $destRect, $srcRectMono, [System.Drawing.GraphicsUnit]::Pixel)

$srcMono.Dispose()
$gMono.Dispose()
$bmpMono.Save($outMonoPath, [System.Drawing.Imaging.ImageFormat]::Png)
$bmpMono.Dispose()

Write-Host "Generated both android-icon-foreground.png and android-icon-monochrome.png with Android Safe Zone padding"
