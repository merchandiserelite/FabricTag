import pdfplumber
import re
from typing import Dict, Any, List

def parse_pdf_mitch_and_son(pdf_path: str) -> Dict[str, Any]:
    items = []
    po_number = ""
    order_date = ""
    delivery_date = ""
    currency = "GBP"
    customer_name = "Picture Book Fashion Ltd"
    brand = "mitch & son"
    
    with pdfplumber.open(pdf_path) as pdf:
        full_text = "\n".join(p.extract_text() or "" for p in pdf.pages)
        
        # Extract PO Number
        m_po = re.search(r'(?:Purchase Order No|Order Number)\s*(\d+)', full_text, re.IGNORECASE)
        if m_po:
            po_number = m_po.group(1).strip()
            
        # Extract Dates
        m_placed = re.search(r'Date Placed\s*([0-9]{1,2}\s+[A-Za-z]+\s+[0-9]{4})', full_text, re.IGNORECASE)
        if m_placed:
            raw_d = m_placed.group(1)
            # convert "17 August 2026" to DD.MM.YYYY
            months = {'january':1, 'february':2, 'march':3, 'april':4, 'may':5, 'june':6, 'july':7, 'august':8, 'september':9, 'october':10, 'november':11, 'december':12}
            parts = raw_d.split()
            if len(parts) == 3 and parts[1].lower() in months:
                order_date = f"{int(parts[0]):02d}.{months[parts[1].lower()]:02d}.{parts[2]}"
                
        m_ex = re.search(r'Ex factory Date\s*([0-9]{1,2}\s+[A-Za-z]+\s+[0-9]{4})', full_text, re.IGNORECASE)
        if m_ex:
            raw_d = m_ex.group(1)
            months = {'january':1, 'february':2, 'march':3, 'april':4, 'may':5, 'june':6, 'july':7, 'august':8, 'september':9, 'october':10, 'november':11, 'december':12}
            parts = raw_d.split()
            if len(parts) == 3 and parts[1].lower() in months:
                delivery_date = f"{int(parts[0]):02d}.{months[parts[1].lower()]:02d}.{parts[2]}"

        # Iterate pages and lines
        for page in pdf.pages:
            words = page.extract_words(x_tolerance=3, y_tolerance=3)
            lines = []
            curr_line = []
            curr_top = None
            for w in words:
                if curr_top is None or abs(w['top'] - curr_top) < 3.5:
                    curr_line.append(w)
                    curr_top = w['top']
                else:
                    lines.append(curr_line)
                    curr_line = [w]
                    curr_top = w['top']
            if curr_line:
                lines.append(curr_line)

            line_texts = [" ".join(w['text'] for w in l).strip() for l in lines]

            i = 0
            while i < len(line_texts):
                lt = line_texts[i]
                
                # Check for Style header line e.g. "MS27302 - DOMINIC Wave panel tracksuit"
                m_style = re.match(r'^(MS\d+)\s*-\s*(.+)$', lt)
                if m_style:
                    style_no = m_style.group(1).strip()
                    desc = m_style.group(2).strip()
                    i += 1
                    
                    # Next line should be sizes line e.g. "12m/8018m/8624m/92 3/98 4/104..."
                    sizes = []
                    if i < len(line_texts):
                        sizes = re.findall(r'(\d+m/\d{2}|\d+/\d{2,3})', line_texts[i], re.IGNORECASE)
                        i += 1
                        
                    # Now we can have 1 or more color + quantity line pairs until "Country of Origin" or next style
                    while i < len(line_texts):
                        c_line = line_texts[i]
                        if c_line.startswith('MS27') or 'Country of Origin' in c_line or 'Sub-total' in c_line or 'Total Goods' in c_line:
                            break
                            
                        # Try to match color and price line: e.g. "6850 Blue Navy £17.00"
                        # Or price could be at end
                        m_col = re.match(r'^(\d{3,5})\s+([A-Za-z\s\-\/\&]+?)(?:\s+[£€$₺]?\s*([\d\.\,]+))?$', c_line)
                        if m_col:
                            color_code = m_col.group(1).strip()
                            color_name = m_col.group(2).strip()
                            raw_price = m_col.group(3)
                            price = 0.0
                            if raw_price:
                                try:
                                    price = float(raw_price.replace(',', '.'))
                                except ValueError:
                                    pass
                            
                            i += 1
                            # Next line is quantities: "8 14 34 42 42 40 42 30 30 18 300"
                            if i < len(line_texts):
                                q_line = line_texts[i]
                                q_tokens = [int(x) for x in re.findall(r'\b\d+\b', q_line)]
                                
                                size_dist = {}
                                total_qty = 0
                                if len(q_tokens) >= len(sizes):
                                    for s_idx, sz in enumerate(sizes):
                                        size_dist[sz] = q_tokens[s_idx]
                                    if len(q_tokens) > len(sizes):
                                        total_qty = q_tokens[len(sizes)]
                                    else:
                                        total_qty = sum(size_dist.values())
                                elif len(q_tokens) > 0:
                                    for s_idx, sz in enumerate(sizes[:len(q_tokens)]):
                                        size_dist[sz] = q_tokens[s_idx]
                                    total_qty = sum(size_dist.values())
                                    
                                items.append({
                                    "po_number": po_number,
                                    "customer_name": customer_name,
                                    "brand": brand,
                                    "season": "SS27",
                                    "style_no": style_no,
                                    "color_code": color_code,
                                    "color_name": color_name,
                                    "description": desc,
                                    "order_date": order_date,
                                    "delivery_date": delivery_date,
                                    "unit_price": price,
                                    "currency": currency,
                                    "total_quantity": total_qty,
                                    "size_distribution": size_dist,
                                    "status": "Planlama aşamasında"
                                })
                                i += 1
                                continue
                        i += 1
                else:
                    i += 1
                    
    return {
        "type": "MITCH_AND_SON_PDF",
        "customer": customer_name,
        "brand": brand,
        "order_no": po_number,
        "count": len(items),
        "data": items
    }

res = parse_pdf_mitch_and_son('data/uploads/20260922_135844_Elite MS ss27.pdf')
print(f"Total parsed items: {res['count']}")
total_all = 0
for idx, it in enumerate(res['data']):
    total_all += it['total_quantity']
    print(f"{idx+1:2d}. {it['style_no']} | {it['color_code']} {it['color_name']:<12} | Qty: {it['total_quantity']:>3} | Price: {it['unit_price']} | Sizes: {it['size_distribution']}")

print(f"Grand Total Qty across all items: {total_all}")
