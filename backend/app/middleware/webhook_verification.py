import hmac
import hashlib
from fastapi import Request, HTTPException
from app.core.config import settings

async def verify_github_signature(request: Request):
    signature = request.headers.get("X-Hub-Signature-256")
    if not signature:
        raise HTTPException(status_code=403, detail="Signature missing")
    
    payload = await request.body()
    secret = settings.GITHUB_WEBHOOK_SECRET.encode()
    
    expected_signature = "sha256=" + hmac.new(
        secret, payload, hashlib.sha256
    ).hexdigest()
    
    if not hmac.compare_digest(signature, expected_signature):
        raise HTTPException(status_code=403, detail="Invalid signature")
