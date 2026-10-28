$pages = @(
    @{ src = "contents-create.html"; dest = "contents-create.asp"; menu = "contents-notice"; group = "contents" },
    @{ src = "contents-edit.html"; dest = "contents-edit.asp"; menu = "contents-notice"; group = "contents" },
    @{ src = "orchard-content.html"; dest = "orchard-content.asp"; menu = "orchard-content"; group = "content-hub" },
    @{ src = "monthly-content-form.html"; dest = "monthly-content-form.asp"; menu = "orchard-content"; group = "content-hub" },
    @{ src = "cultivation-content.html"; dest = "cultivation-content.asp"; menu = "cultivation-content"; group = "content-hub" },
    @{ src = "videos-list.html"; dest = "videos-list.asp"; menu = "videos"; group = "" },
    @{ src = "videos-detail.html"; dest = "videos-detail.asp"; menu = "videos"; group = "" },
    @{ src = "permissions.html"; dest = "permissions.asp"; menu = "permissions"; group = "" },
    @{ src = "permissions-edit.html"; dest = "permissions-edit.asp"; menu = "permissions"; group = "" },
    @{ src = "home-content-preview.html"; dest = "home-content-preview.asp"; menu = "home"; group = "" }
)

$commonScripts = @("mock-data.js", "content-store.js", "resource-store.js", "common.js", "components.js")

foreach ($p in $pages) {
    if (-not (Test-Path $p.src)) {
        Write-Output "Skipping $($p.src)"
        continue
    }

    $html = [System.IO.File]::ReadAllText("$PWD\$($p.src)", [System.Text.Encoding]::UTF8)

    # Title
    $title = ""
    if ($html -match '<title>(.*?)(?:\||<)') {
        $title = $matches[1].Trim()
    }

    # Data page
    $pageId = ""
    if ($html -match 'data-page=["'']([^"'']+)["'']') {
        $pageId = $matches[1].Trim()
    }

    # Find main
    $mainPos = $html.IndexOf("<main")
    if ($mainPos -lt 0) { continue }

    # Find end of main
    $mainEndPos = $html.IndexOf("</main>") + 7
    $mainContent = $html.Substring($mainPos, $mainEndPos - $mainPos)

    # After main: check for modals
    $afterMain = $html.Substring($mainEndPos)
    # Remove closing layout divs
    $afterMain = $afterMain -replace '^\s*</div>\s*</div>', ''
    
    # Extract modals if any before the scripts
    $scriptStart = $afterMain.IndexOf("<script")
    $modals = ""
    $scriptSection = ""
    if ($scriptStart -ge 0) {
        $modals = $afterMain.Substring(0, $scriptStart).Trim()
        $scriptSection = $afterMain.Substring($scriptStart)
    } else {
        $modals = $afterMain.Trim()
    }

    # Extract scripts
    $matches = [regex]::Matches($scriptSection, '<script[^>]*src=["'']([^"'']+)["''][^>]*></script>')
    $extraScripts = @()
    foreach ($m in $matches) {
        $src = $m.Groups[1].Value
        $isCommon = $false
        foreach ($cs in $commonScripts) {
            if ($src -like "*$cs*") { $isCommon = $true; break }
        }
        if (-not $isCommon) {
            $extraScripts += "<script src=""$src""></script>"
        }
    }

    $combinedBody = $mainContent
    if ($modals -ne "") {
        $combinedBody += "`n`n" + $modals
    }

    # Replace .html links with .asp (except peach-web external link)
    $combinedBody = [regex]::Replace($combinedBody, '(href|action)=["'']([^"'']+)["'']', {
        param($m)
        $attr = $m.Groups[1].Value
        $url = $m.Groups[2].Value
        if ($url -like "*peach-web*" -or $url -like "http*") {
            return $m.Value
        }
        $newUrl = [regex]::Replace($url, '([a-zA-Z0-9_-]+)\.html', '$1.asp')
        return "$attr=""$newUrl"""
    })

    $extraScriptAsp = '""'
    if ($extraScripts.Count -gt 0) {
        $quoted = $extraScripts | ForEach-Object { """$($_ -replace '""', '""""')""" }
        $extraScriptAsp = $quoted -join " & vbCrLf & _`n              "
    }

    $aspCode = @"
<%@ Language="VBScript" CodePage="65001" %>
<!--#include file="inc/common.asp"-->
<%
Dim pageTitle, pageId, currentMenu, currentMenuGroup, extraCss, extraScript
pageTitle = "$title"
pageId = "$pageId"
currentMenu = "$($p.menu)"
currentMenuGroup = "$($p.group)"
extraCss = ""
%>
<!--#include file="inc/header.asp"-->
<!--#include file="inc/sidebar.asp"-->

$combinedBody

<%
extraScript = $extraScriptAsp
%>
<!--#include file="inc/footer.asp"-->
"@

    [System.IO.File]::WriteAllText("$PWD\$($p.dest)", $aspCode, [System.Text.Encoding]::UTF8)
    Write-Output "Generated $($p.dest)"
}
