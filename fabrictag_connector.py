"""
TexFlow - FabricTag Connector
Live integration with FabricTag (fabric-label-system database.db)
"""

import sqlite3
from pathlib import Path
from typing import List, Dict, Any, Optional

import os

_base_dir = Path(__file__).resolve().parent
_ft_local = _base_dir.parent / "fabric-label-system" / "database.db"
if _ft_local.exists():
    FABRICTAG_DB_PATH = _ft_local
else:
    FABRICTAG_DB_PATH = Path(os.environ.get("FABRICTAG_DB_PATH", r"C:\Users\ASLI CELIK\.gemini\antigravity\scratch\fabric-label-system\database.db"))

class FabricTagConnector:

    @staticmethod
    def is_connected() -> bool:
        return FABRICTAG_DB_PATH.exists()

    @staticmethod
    def get_connection():
        if not FABRICTAG_DB_PATH.exists():
            return None
        conn = sqlite3.connect(str(FABRICTAG_DB_PATH))
        conn.row_factory = sqlite3.Row
        return conn

    @classmethod
    def search_fabrics(cls, query: str = "", limit: int = 500) -> List[Dict[str, Any]]:

        """Searches fabrics by company name, quality, design code, internal code or composition."""
        conn = cls.get_connection()
        if not conn:
            return []
        
        c = conn.cursor()
        if not query or query.strip() == "":
            c.execute("SELECT * FROM fabrics ORDER BY id DESC LIMIT ?", (limit,))
        else:
            search = f"%{query.strip()}%"
            c.execute("""
            SELECT * FROM fabrics 
            WHERE internal_code LIKE ? 
               OR company_name LIKE ? 
               OR quality_code LIKE ? 
               OR quality_name LIKE ? 
               OR design_code LIKE ? 
               OR color LIKE ?
               OR composition LIKE ?
               OR barcode_or_qr LIKE ?
            ORDER BY id DESC LIMIT ?
            """, (search, search, search, search, search, search, search, search, limit))
            
        raw_rows = [dict(row) for row in c.fetchall()]
        conn.close()
        
        import json
        parsed_rows = []
        for r in raw_rows:
            b_str = r.get("received_batches_json")
            if b_str:
                try:
                    r["received_batches"] = json.loads(b_str)
                except Exception:
                    r["received_batches"] = []
            else:
                r["received_batches"] = []
            parsed_rows.append(r)
        return parsed_rows

    @classmethod
    def update_received_meters(cls, fabric_id: int, received_meters: str, received_date: Optional[str] = None, batches: Optional[list] = None) -> bool:
        conn = cls.get_connection()
        if not conn:
            return False
        import json
        from datetime import datetime
        
        batches_json = None
        if batches is not None:
            batches_json = json.dumps(batches, ensure_ascii=False)
            total = 0.0
            last_date = ""
            for b in batches:
                try:
                    amt_clean = str(b.get("amount", 0)).replace(",", ".").replace("M", "").replace("m", "").replace("KG", "").replace("kg", "").strip()
                    total += float(amt_clean)
                except ValueError:
                    pass
                if b.get("date"):
                    last_date = b.get("date")
            received_meters = str(round(total, 2)) if total > 0 else (received_meters or "")
            received_date = last_date or (datetime.now().strftime("%d.%m.%Y") if received_meters else "")

        if not received_date and received_meters and received_meters.strip():
            received_date = datetime.now().strftime("%d.%m.%Y")
        elif not received_meters or not received_meters.strip():
            received_date = ""
            received_meters = ""

        c = conn.cursor()
        if batches_json is not None:
            c.execute("""
                UPDATE fabrics 
                SET received_meters = ?, received_date = ?, received_batches_json = ?
                WHERE id = ?
            """, (received_meters, received_date, batches_json, fabric_id))
        else:
            c.execute("""
                UPDATE fabrics 
                SET received_meters = ?, received_date = ?
                WHERE id = ?
            """, (received_meters, received_date, fabric_id))
        conn.commit()
        conn.close()
        return True

    @classmethod
    def add_received_batch(cls, fabric_id: int, amount: str, date_str: Optional[str] = None, note: str = "") -> dict:
        conn = cls.get_connection()
        if not conn:
            return {}
        c = conn.cursor()
        c.execute("SELECT received_batches_json, received_meters FROM fabrics WHERE id = ?", (fabric_id,))
        row = c.fetchone()
        batches = []
        import json
        from datetime import datetime
        if row and row[0]:
            try:
                batches = json.loads(row[0])
            except Exception:
                batches = []
        elif row and row[1] and row[1].strip():
            # if there was an existing simple received_meters, convert to initial batch
            c.execute("SELECT received_date FROM fabrics WHERE id = ?", (fabric_id,))
            dt = c.fetchone()
            batches.append({
                "id": 1,
                "amount": row[1],
                "date": (dt and dt[0]) or datetime.now().strftime("%d.%m.%Y"),
                "note": "1. Giriş"
            })
        conn.close()

        final_date = date_str if date_str and date_str.strip() else datetime.now().strftime("%d.%m.%Y")
        batches.append({
            "id": int(datetime.now().timestamp() * 1000),
            "amount": str(amount).strip(),
            "date": final_date,
            "note": note.strip()
        })
        cls.update_received_meters(fabric_id, "", final_date, batches=batches)
        
        # calculate total
        total = 0.0
        for b in batches:
            try:
                amt_clean = str(b.get("amount", 0)).replace(",", ".").replace("M", "").replace("m", "").replace("KG", "").replace("kg", "").strip()
                total += float(amt_clean)
            except ValueError:
                pass
        return {"batches": batches, "received_meters": str(round(total, 2)), "received_date": final_date}

    @classmethod
    def delete_received_batch(cls, fabric_id: int, batch_id: int) -> dict:
        conn = cls.get_connection()
        if not conn:
            return {}
        c = conn.cursor()
        c.execute("SELECT received_batches_json FROM fabrics WHERE id = ?", (fabric_id,))
        row = c.fetchone()
        batches = []
        import json
        if row and row[0]:
            try:
                batches = json.loads(row[0])
            except Exception:
                batches = []
        conn.close()

        batches = [b for b in batches if b.get("id") != batch_id]
        cls.update_received_meters(fabric_id, "", "", batches=batches)
        total = 0.0
        last_date = ""
        for b in batches:
            try:
                amt_clean = str(b.get("amount", 0)).replace(",", ".").replace("M", "").replace("m", "").replace("KG", "").replace("kg", "").strip()
                total += float(amt_clean)
            except ValueError:
                pass
            if b.get("date"):
                last_date = b.get("date")
        return {"batches": batches, "received_meters": str(round(total, 2)) if total > 0 else "", "received_date": last_date}


    @classmethod
    def find_match_for_order(cls, composition: str = "", fabric_article: str = "", color_name: str = "") -> Optional[Dict[str, Any]]:

        """Smart match for PO fabric requirements against FabricTag repository."""
        conn = cls.get_connection()
        if not conn:
            return None

        c = conn.cursor()
        
        # 1. Exact or partial match on design code / article
        if fabric_article:
            for part in fabric_article.split():
                if len(part) >= 4:
                    c.execute("SELECT * FROM fabrics WHERE design_code LIKE ? OR quality_code LIKE ? LIMIT 1", (f"%{part}%", f"%{part}%"))
                    row = c.fetchone()
                    if row:
                        conn.close()
                        return dict(row)

        # 2. Match on color code/name if provided
        if color_name and len(str(color_name).strip()) >= 2:
            c.execute("SELECT * FROM fabrics WHERE color LIKE ? LIMIT 1", (f"%{str(color_name).strip()}%",))
            row = c.fetchone()
            if row:
                conn.close()
                return dict(row)

        # 3. Match on composition
        if composition and len(composition) >= 4:
            c.execute("SELECT * FROM fabrics WHERE composition LIKE ? LIMIT 1", (f"%{composition[:10]}%",))
            row = c.fetchone()
            if row:
                conn.close()
                return dict(row)

        conn.close()
        return None
