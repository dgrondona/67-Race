from sqlalchemy import inspect, text
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()


def apply_sqlite_user_migrations(app):
    uri = app.config.get("SQLALCHEMY_DATABASE_URI") or ""
    if not uri.startswith("sqlite:"):
        return
    insp = inspect(db.engine)
    if not insp.has_table("user"):
        return
    cols = {c["name"] for c in insp.get_columns("user")}
    with db.engine.begin() as conn:
        if "email" in cols:
            conn.execute(
                text(
                    """
                CREATE TABLE user_new (
                    id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
                    username VARCHAR(50) NOT NULL UNIQUE,
                    password_hash VARCHAR(255) NOT NULL
                )
                """
                )
            )
            if "username" in cols:
                conn.execute(
                    text(
                        """
                INSERT INTO user_new (id, username, password_hash)
                SELECT id,
                  COALESCE(
                    NULLIF(TRIM(username), ''),
                    NULLIF(LOWER(TRIM(email)), ''),
                    'user' || CAST(id AS TEXT)
                  ),
                  password_hash
                FROM user
                """
                    )
                )
            else:
                conn.execute(
                    text(
                        """
                INSERT INTO user_new (id, username, password_hash)
                SELECT id,
                  COALESCE(NULLIF(LOWER(TRIM(email)), ''), 'user' || CAST(id AS TEXT)),
                  password_hash
                FROM user
                """
                    )
                )
            conn.execute(text("DROP TABLE user"))
            conn.execute(text("ALTER TABLE user_new RENAME TO user"))
            return
        if "username" not in cols:
            conn.execute(text("ALTER TABLE user ADD COLUMN username VARCHAR(50)"))
            conn.execute(
                text(
                    "UPDATE user SET username = 'u' || CAST(id AS TEXT) WHERE username IS NULL"
                )
            )
