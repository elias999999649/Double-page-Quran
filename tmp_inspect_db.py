import os, sqlite3
p = os.path.join('pagesoldmushaf','qpc-v1-15-lines.db')
print('exists', os.path.exists(p), p)
conn = sqlite3.connect(p)
cur = conn.cursor()
print('tables', cur.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").fetchall())
print('info', cur.execute('PRAGMA table_info(pages)').fetchall())
print('sample rows:')
for row in cur.execute('SELECT page_number, line_number, line_type, is_centered, first_word_id FROM pages ORDER BY page_number, line_number LIMIT 20').fetchall():
    print(row)
conn.close()
