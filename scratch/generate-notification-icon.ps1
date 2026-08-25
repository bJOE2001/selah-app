Add-Type -AssemblyName System.Drawing

$size = 192
$bmp = New-Object System.Drawing.Bitmap $size, $size
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
$g.Clear([System.Drawing.Color]::Transparent)

# Solid White Brush for Android Notification Silhouette
$whiteBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 255, 255, 255))

# Left Page Path (Open Book)
# Center spine at X = 93 (leaves a 6px gap from 93 to 99)
$leftPath = New-Object System.Drawing.Drawing2D.GraphicsPath
$leftPath.AddLine(93, 62, 93, 134)
$leftPath.AddBezier(93, 134, 72, 142, 42, 138, 28, 126)
$leftPath.AddLine(28, 126, 28, 54)
$leftPath.AddBezier(28, 54, 42, 66, 72, 70, 93, 62)
$leftPath.CloseFigure()

# Right Page Path (Open Book)
# Center spine at X = 99
$rightPath = New-Object System.Drawing.Drawing2D.GraphicsPath
$rightPath.AddLine(99, 62, 99, 134)
$rightPath.AddBezier(99, 134, 120, 142, 150, 138, 164, 126)
$rightPath.AddLine(164, 126, 164, 54)
$rightPath.AddBezier(164, 54, 150, 66, 120, 70, 99, 62)
$rightPath.CloseFigure()

# Fill the open bible pages
$g.FillPath($whiteBrush, $leftPath)
$g.FillPath($whiteBrush, $rightPath)

# Hanging Silk Ribbon Bookmark in Center Bottom
$ribbonPath = New-Object System.Drawing.Drawing2D.GraphicsPath
$ribbonPath.AddLine(93, 64, 93, 148)
$ribbonPath.AddLine(93, 148, 96, 143)
$ribbonPath.AddLine(96, 143, 99, 148)
$ribbonPath.AddLine(99, 148, 99, 64)
$ribbonPath.CloseFigure()
$g.FillPath($whiteBrush, $ribbonPath)

# Clean up
$leftPath.Dispose()
$rightPath.Dispose()
$ribbonPath.Dispose()
$whiteBrush.Dispose()
$g.Dispose()

$outPath = "c:\xampp\htdocs\selah-app\assets\images\notification-icon.png"
$bmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Dispose()

Write-Host "Generated clean Holy Bible notification silhouette icon at $outPath"
