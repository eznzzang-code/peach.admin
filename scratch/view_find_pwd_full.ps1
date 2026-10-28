Get-Content "c:\Workspace\com.bhsoft.nselfhelp\src\main\webapp\WEB-INF\jsp\findPwd.jsp" | ForEach-Object {
    Write-Output $_
}
