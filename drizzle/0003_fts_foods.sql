CREATE VIRTUAL TABLE foods_fts USING fts5(
  name, brand,
  content='foods',
  tokenize = "unicode61 remove_diacritics 2"
);
--> statement-breakpoint
CREATE TRIGGER foods_ai AFTER INSERT ON foods BEGIN
  INSERT INTO foods_fts(rowid, name, brand) VALUES (new.rowid, new.name, new.brand);
END;
--> statement-breakpoint
CREATE TRIGGER foods_ad AFTER DELETE ON foods BEGIN
  INSERT INTO foods_fts(foods_fts, rowid, name, brand) VALUES('delete', old.rowid, old.name, old.brand);
END;
--> statement-breakpoint
CREATE TRIGGER foods_au AFTER UPDATE ON foods BEGIN
  INSERT INTO foods_fts(foods_fts, rowid, name, brand) VALUES('delete', old.rowid, old.name, old.brand);
  INSERT INTO foods_fts(rowid, name, brand) VALUES (new.rowid, new.name, new.brand);
END;
--> statement-breakpoint
INSERT INTO foods_fts(foods_fts) VALUES('rebuild');
--> statement-breakpoint
CREATE TABLE search_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  query TEXT NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);
--> statement-breakpoint
CREATE INDEX search_history_created_at_idx ON search_history(created_at DESC);
