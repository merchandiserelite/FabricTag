import sqlite3
from database import DB_PATH

conn = sqlite3.connect(DB_PATH)
c = conn.cursor()

new_cols = [
    ('fabric_ordered_date', 'TEXT'),
    ('pps_sent_date', 'TEXT'),
    ('shipping_sample_sent_date', 'TEXT'),
    ('last_status_updated_by', 'TEXT'),
    ('last_status_updated_at', 'TEXT')
]

existing = [col[1] for col in c.execute('PRAGMA table_info(styles)').fetchall()]
for col_name, col_type in new_cols:
    if col_name not in existing:
        c.execute(f'ALTER TABLE styles ADD COLUMN {col_name} {col_type}')
        print(f'Added column {col_name}')

c.execute("UPDATE styles SET fabric_ordered_date = '25.08.2026' WHERE fabric_ordered = 1 AND (fabric_ordered_date IS NULL OR fabric_ordered_date = '')")
c.execute("UPDATE styles SET pps_sent_date = '26.08.2026' WHERE pps_sent = 1 AND (pps_sent_date IS NULL OR pps_sent_date = '')")
c.execute("UPDATE styles SET shipping_sample_sent_date = '27.08.2026' WHERE shipping_sample_sent = 1 AND (shipping_sample_sent_date IS NULL OR shipping_sample_sent_date = '')")
c.execute("UPDATE styles SET last_status_updated_by = 'Yönetici', last_status_updated_at = '27.08.2026 10:30' WHERE last_status_updated_by IS NULL OR last_status_updated_by = ''")

conn.commit()
conn.close()
print("Migration completed successfully!")
