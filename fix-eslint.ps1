# PowerShell script to fix common ESLint issues
$files = @(
    "src/Coordinator Pages/CooViewMS.js",
    "src/Coordinator Pages/CooViewPS.js",
    "src/Coordinator Pages/CooViewpage.js"
)

foreach ($file in $files) {
    if (Test-Path $file) {
        $content = Get-Content $file -Raw
        
        # Comment out unused imports and variables
        $content = $content -replace 'import \{ useRef \}', '// import { useRef } // Unused'
        $content = $content -replace 'import Adminicons', '// import Adminicons // Unused'
        $content = $content -replace '  const \[studyCategory, setStudyCategory\]', '  // const [studyCategory, setStudyCategory] // Unused'
        $content = $content -replace '  const \[profileImage, setProfileImage\]', '  // const [profileImage, setProfileImage] // Unused'
        $content = $content -replace '  const \[uploadInfo, setUploadInfo\]', '  // const [uploadInfo, setUploadInfo] // Unused'
        $content = $content -replace '  const \[dob, setDob\]', '  // const [dob, setDob] // Unused'
        $content = $content -replace '  const handleImageUpload =', '  // const handleImageUpload = // Unused'
        $content = $content -replace '  const handleImageRemove =', '  // const handleImageRemove = // Unused'
        $content = $content -replace '  const handleDiscard =', '  // const handleDiscard = // Unused'
        $content = $content -replace '  const closePopup =', '  // const closePopup = // Unused'
        
        Set-Content $file $content -NoNewline
        Write-Host "Fixed $file"
    }
}

Write-Host "ESLint fixes applied!"
