# カレントディレクトリ内の .mp4 ファイルを .mp3 にリネーム
Get-ChildItem -Path . -Filter "*.mp4" | ForEach-Object {
    $newName = $_.Name -replace '\.mp4$', '.mp3'
    Rename-Item -Path $_.FullName -NewName $newName
}