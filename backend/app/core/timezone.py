"""
Timezone helper for Bolivia (UTC-4, no DST).
All timestamps in the app use this instead of datetime.utcnow().
"""
from datetime import datetime, timezone, timedelta

# Bolivia is UTC-4 year-round (no daylight saving time)
BOT = timezone(timedelta(hours=-4))


def now_bolivia() -> datetime:
    """Returns current datetime in Bolivia timezone (naive, for DB storage)."""
    return datetime.now(BOT).replace(tzinfo=None)
