import os, sqlite3, json
p = os.path.join('pagesoldmushaf','qpc-v1-15-lines.db')
conn = sqlite3.connect(p)
cur = conn.cursor()
page_rows = {}
for row in cur.execute('SELECT page_number, line_number, line_type, is_centered, first_word_id, last_word_id, surah_number FROM pages ORDER BY page_number, line_number'):
    page, line, line_type, centered, first_word_id, last_word_id, surah = row
    page_rows.setdefault(str(page), []).append({
        'line': line,
        'type': line_type,
        'centered': bool(centered),
        'first': first_word_id if first_word_id not in ('', None) else '',
        'last': last_word_id if last_word_id not in ('', None) else '',
        'surah': surah or ''
    })
conn.close()
# convert values to JSON-serializable types
serializable = {}
for page, lines in page_rows.items():
    serializable[page] = []
    for line in lines:
        serializable[page].append({
            'line': line['line'],
            'type': line['type'],
            'centered': line['centered'],
            'first': line['first'],
            'last': line['last'],
            'surah': line['surah']
        })
with open('old-mushaf-pages.json', 'w', encoding='utf-8') as f:
    json.dump(serializable, f, ensure_ascii=False, separators=(',', ':'))
print('generated pages', len(serializable), 'pages')
print('page1 count', len(serializable['1']))
print('page1 sample', serializable['1'][:5])
