import pdfplumber

pdf_path = 'data/uploads/20260922_135844_Elite MS ss27.pdf'

with pdfplumber.open(pdf_path) as pdf:
    for p_idx, page in enumerate(pdf.pages):
        print(f"=== PAGE {p_idx+1} ===")
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

        for l in lines:
            line_str = " ".join(w['text'] for w in l)
            print(f"[{l[0]['top']:<5.1f}] {line_str}")
