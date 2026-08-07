from jose import jwt
from datetime import datetime, timedelta

SECRET_KEY = "placement_platform_super_secret_key"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7

expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
to_encode = {"sub": "1", "exp": expire}

encoded = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
print("Encoded:", encoded)

try:
    decoded = jwt.decode(encoded, SECRET_KEY, algorithms=[ALGORITHM])
    print("Decoded:", decoded)
except Exception as e:
    print("Error:", e)
