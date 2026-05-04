"""S3 upload service for profile photos and other assets."""
import logging
import os
import uuid
from typing import Optional

from app.core.config import settings

logger = logging.getLogger(__name__)

UPLOAD_DIR = "/app/uploads"


def save_file_locally(content: bytes, key_prefix: str = "misc", content_type: str = "image/jpeg") -> Optional[str]:
    """Save file to local /app/uploads directory. Returns relative URL path."""
    try:
        ext = "jpg"
        if "png" in content_type:
            ext = "png"
        elif "gif" in content_type:
            ext = "gif"
        elif "webp" in content_type:
            ext = "webp"
        elif "jpeg" in content_type or "jpg" in content_type:
            ext = "jpg"

        folder = os.path.join(UPLOAD_DIR, key_prefix)
        os.makedirs(folder, exist_ok=True)
        filename = f"{uuid.uuid4()}.{ext}"
        filepath = os.path.join(folder, filename)
        with open(filepath, "wb") as f:
            f.write(content)
        return f"/uploads/{key_prefix}/{filename}"
    except Exception as e:
        logger.exception("Local file save failed: %s", e)
        return None


def upload_file(content: bytes, key_prefix: str = "profile", content_type: str = "image/jpeg") -> Optional[str]:
    """Upload bytes to S3. Falls back to local storage if S3 not configured. Returns public URL or None."""
    if not settings.s3_enabled:
        return save_file_locally(content, key_prefix, content_type)

    try:
        import boto3
        from botocore.exceptions import ClientError

        ext = "jpg" if "jpeg" in content_type or "jpg" in content_type else "png"
        key = f"{key_prefix}/{uuid.uuid4()}.{ext}"

        key_id = settings.AWS_ACCESS_KEY_ID or settings.AWS_MAIL_ACCESS_KEY_ID
        secret = settings.AWS_SECRET_ACCESS_KEY or settings.AWS_MAIL_SECRET_ACCESS_KEY
        bucket = settings.AWS_BUCKET_NAME

        s3 = boto3.client(
            "s3",
            aws_access_key_id=key_id,
            aws_secret_access_key=secret,
            region_name=settings.AWS_REGION,
        )

        s3.put_object(
            Bucket=bucket,
            Key=key,
            Body=content,
            ContentType=content_type,
            ACL="public-read",
        )

        url = f"https://{bucket}.s3.{settings.AWS_REGION}.amazonaws.com/{key}"
        return url
    except ClientError as e:
        logger.exception("S3 upload failed, falling back to local: %s", e)
        return save_file_locally(content, key_prefix, content_type)
    except Exception as e:
        logger.exception("S3 upload error, falling back to local: %s", e)
        return save_file_locally(content, key_prefix, content_type)
