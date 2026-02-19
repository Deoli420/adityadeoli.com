from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Application
    APP_NAME: str = "SentinelAI"
    APP_VERSION: str = "0.1.0"
    DEBUG: bool = False

    # Database
    DB_HOST: str = "localhost"
    DB_PORT: int = 5432
    DB_USER: str = "sentinel"
    DB_PASSWORD: str = "sentinel"
    DB_NAME: str = "sentinel_db"

    # AI / LLM
    OPENAI_API_KEY: str = ""
    OPENAI_MODEL: str = "gpt-4o-mini"
    OPENAI_TIMEOUT_SECONDS: float = 30.0
    AI_ENABLED: bool = True

    # Scheduler
    SCHEDULER_ENABLED: bool = True
    SCHEDULER_MAX_CONCURRENT: int = 5

    # Auth / JWT
    SECRET_KEY: str = "change-me-in-production"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    BCRYPT_ROUNDS: int = 12
    MAX_LOGIN_ATTEMPTS: int = 5
    LOCKOUT_MINUTES: int = 15
    FRONTEND_ORIGIN: str = "https://sentinelai.adityadeoli.com"

    # Alerts / Webhook
    WEBHOOK_ENABLED: bool = True
    WEBHOOK_URL: str = ""
    WEBHOOK_TIMEOUT_SECONDS: float = 10.0
    ALERT_MIN_RISK_LEVEL: str = "MEDIUM"  # LOW | MEDIUM | HIGH | CRITICAL

    @property
    def DATABASE_URL(self) -> str:
        return (
            f"postgresql+asyncpg://{self.DB_USER}:{self.DB_PASSWORD}"
            f"@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"
        )

    @property
    def SYNC_DATABASE_URL(self) -> str:
        """Used by Alembic for migrations."""
        return (
            f"postgresql+psycopg2://{self.DB_USER}:{self.DB_PASSWORD}"
            f"@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"
        )

    @property
    def ai_available(self) -> bool:
        """True when AI is enabled AND an API key is configured."""
        return self.AI_ENABLED and bool(self.OPENAI_API_KEY)

    @property
    def webhook_available(self) -> bool:
        """True when webhooks are enabled AND a URL is configured."""
        return self.WEBHOOK_ENABLED and bool(self.WEBHOOK_URL)

    model_config = {"env_file": ".env", "extra": "ignore"}


settings = Settings()
