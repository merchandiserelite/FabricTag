import pdfplumber

with pdfplumber.open('data/uploads/20260922_135844_Elite MS ss27.pdf') as pdf:
    for p_idx, page in enumerate(pdf.pages):
        print(f"=== PAGE {p_idx+1} ===")
        words = page.extract_words()
        for w in words:
            if 'MS27' in w['text']:
                print(f"Style: {w['text']} at top={w['top']:.1f}")
            elif w['top'] > 200 and any(c.isdigit() for c in w['text']) and len(w['text']) <= 4:
                # possible quantity
                pass
