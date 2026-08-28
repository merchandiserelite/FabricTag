import json

app_js_path = r"C:\Users\ASLI CELIK\.gemini\antigravity\scratch\fabric-label-system\static\app.js"
with open(app_js_path, "r", encoding="utf-8") as f:
    content = f.read()

# Make sure AR, ZH, JA are present
# Let's inspect applyLanguage function
