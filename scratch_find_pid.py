import subprocess, json

res = subprocess.run(["powershell", "-NoProfile", "-Command", "Get-Process python | Select-Object Id, ProcessName | ConvertTo-Json"], capture_output=True, text=True)
print(res.stdout)

res2 = subprocess.run(["netstat", "-ano"], capture_output=True, text=True)
for l in res2.stdout.splitlines():
    if ":8050" in l:
        print("NETSTAT:", l)
