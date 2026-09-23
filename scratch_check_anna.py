import sqlite3

conn = sqlite3.connect('data/texflow.db')
conn.row_factory = sqlite3.Row
c = conn.cursor()
c.execute("""
SELECT s.id, o.customer_name, s.brand, s.style_no, s.color_name, s.channel, s.total_quantity
FROM styles s
JOIN orders o ON s.order_id = o.id
WHERE s.channel IS NOT NULL AND s.channel != ''
LIMIT 10
""")
for r in c.fetchall():
    print(dict(r))
