# -*- mode: python ; coding: utf-8 -*-

import os
import sys
from PyInstaller.utils.hooks import collect_all

block_cipher = None

datas = [
    ('static', 'static'),
    ('icon.ico', '.'),
    ('texflow_logo.png', '.')
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
    'openpyxl',
    'openpyxl.styles',
    'openpyxl.utils',
    'openpyxl.drawing.image',
    'openpyxl.drawing.spreadsheet_drawing',
    'openpyxl.drawing.xdr',
    'openpyxl.utils.units',
    'PIL',
    'PIL.Image',
    'PIL.ImageDraw',
    'PIL.ImageFont',
    'sqlite3',
    'hashlib',
    'multiprocessing',
    'pypdf',
    'pdfplumber',
    'jinja2'
]

for pkg in ['openpyxl', 'uvicorn', 'fastapi', 'PIL', 'pydantic', 'pdfplumber', 'pypdf']:
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
    name='TexFlow',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    console=True,
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
    name='TexFlow',
)
