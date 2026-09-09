# -*- mode: python ; coding: utf-8 -*-

import os
import sys
from PyInstaller.utils.hooks import collect_all

block_cipher = None

datas = [
    ('static', 'static'),
    ('icon.ico', '.')
]
binaries = []
hidden_imports = [
    'uvicorn',
    'uvicorn.logging',
    'uvicorn.loops',
    'uvicorn.loops.auto',
    'uvicorn.protocols',
    'uvicorn.protocols.http',
    'uvicorn.protocols.http.auto',
    'uvicorn.protocols.websockets',
    'uvicorn.protocols.websockets.auto',
    'uvicorn.lifespan',
    'uvicorn.lifespan.on',
    'fastapi',
    'fastapi.staticfiles',
    'fastapi.responses',
    'fastapi.middleware.cors',
    'pydantic',
    'pyngrok',
    'pyngrok.ngrok',
    'pyngrok.conf',
    'openpyxl',
    'openpyxl.styles',
    'openpyxl.utils',
    'PIL',
    'PIL.Image',
    'sqlite3',
    'hmac',
    'hashlib',
    'uuid',
    'multiprocessing',
    'google',
    'google.genai',
    'google.genai.models',
    'google.genai.types'
]

for pkg in ['google_genai', 'openpyxl', 'uvicorn', 'fastapi', 'pyngrok', 'PIL', 'pydantic']:
    try:
        d, b, h = collect_all(pkg)
        datas += d
        binaries += b
        hidden_imports += h
    except Exception as e:
        print(f"Hook warning for {pkg}: {e}")

a = Analysis(
    ['main_app.py'],
    pathex=[],
    binaries=binaries,
    datas=datas,
    hiddenimports=hidden_imports,
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=['tkinter', 'matplotlib', 'scipy', 'numpy.tests'],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    [],
    exclude_binaries=True,
    name='FabricTag',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    console=False,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
    icon='icon.ico',
)

coll = COLLECT(
    exe,
    a.binaries,
    a.zipfiles,
    a.datas,
    strip=False,
    upx=True,
    upx_exclude=[],
    name='FabricTag',
)
