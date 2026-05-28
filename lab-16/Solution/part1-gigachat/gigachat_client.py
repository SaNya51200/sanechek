"""GigaChat API client helper used in lab 16."""

from __future__ import annotations

import json
import os
import re
import uuid
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable

import requests
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")


@dataclass
class SberGigaConfig:
    credentials: str
    scope: str = "GIGACHAT_API_PERS"
    model: str = "GigaChat"
    verify_ssl: bool = False
    auth_url: str = "https://ngw.devices.sberbank.ru:9443/api/v2/oauth"
    chat_url: str = "https://gigachat.devices.sberbank.ru/api/v1/chat/completions"

    @classmethod
    def from_env(cls) -> "SberGigaConfig":
        creds = os.getenv("GIGACHAT_CREDENTIALS", "").strip()
        if not creds:
            raise RuntimeError("GIGACHAT_CREDENTIALS variable is empty. Make sure .env exists.")
        ssl_verify = os.getenv("GIGACHAT_VERIFY_SSL", "false").lower() in {"1", "true", "yes"}
        return cls(
            credentials=creds,
            scope=os.getenv("GIGACHAT_SCOPE", "GIGACHAT_API_PERS"),
            model=os.getenv("GIGACHAT_MODEL", "GigaChat"),
            verify_ssl=ssl_verify,
        )


class SberGigaClient:
    def __init__(self, config: SberGigaConfig | None = None):
        self.config = config or SberGigaConfig.from_env()
        self._token: str | None = None

    def fetch_token(self) -> str:
        if self._token:
            return self._token

        res = requests.post(
            self.config.auth_url,
            headers={
                "Authorization": f"Basic {self.config.credentials}",
                "RqUID": str(uuid.uuid4()),
                "Content-Type": "application/x-www-form-urlencoded",
            },
            data={"scope": self.config.scope},
            timeout=30,
            verify=self.config.verify_ssl,
        )
        res.raise_for_status()
        self._token = res.json()["access_token"]
        return self._token

    def send_chat_prompt(self, user_prompt: str, sys_prompt: str = "You are a helpful software development assistant.") -> str:
        token = self.fetch_token()
        res = requests.post(
            self.config.chat_url,
            headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
            json={
                "model": self.config.model,
                "messages": [
                    {"role": "system", "content": sys_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                "temperature": 0.25,
            },
            timeout=60,
            verify=self.config.verify_ssl,
        )
        res.raise_for_status()
        return res.json()["choices"][0]["message"]["content"]

    @staticmethod
    def extract_code_block(text: str, lang: str | None = None) -> str:
        if lang:
            pattern = rf"```{re.escape(lang)}\s*(.*?)```"
            match = re.search(pattern, text, flags=re.DOTALL | re.IGNORECASE)
            if match:
                return match.group(1).strip()

        lines = text.strip().splitlines()
        if lines and lines[0].startswith("```"):
            lines = lines[1:]
        if lines and lines[-1].strip() == "```":
            lines = lines[:-1]
        return "\n".join(lines).strip()


def write_to_file(path: str | Path, content: str) -> None:
    Path(path).write_text(content, encoding="utf-8")


def execute_generation_tasks(tasks: Iterable[tuple[str, Path]]) -> None:
    client = SberGigaClient()
    for prompt, target_path in tasks:
        response_text = client.send_chat_prompt(prompt)
        lang_filter = "python" if target_path.suffix == ".py" else None
        extracted_content = client.extract_code_block(response_text, lang=lang_filter)
        write_to_file(target_path, extracted_content)


if __name__ == "__main__":
    tasks_list = [
        (
            "Write only one Python code block with three functions and no prose: "
            "is_prime(n: int) -> bool, fibonacci(n: int) -> list[int] returning the first n Fibonacci numbers, "
            "and normalize_phone(phone: str) -> str returning a +7XXXXXXXXXX string. "
            "For normalize_phone, remove all non-digits, drop a leading 7 or 8 when there are 11 digits, "
            "then prefix the remaining 10 digits with +7. Add docstrings and type hints.",
            BASE_DIR / "generated_code.py",
        ),
        (
            "Create a Russian README for a Python project with functions is_prime, fibonacci and normalize_phone.",
            BASE_DIR / "README_generated.md",
        ),
    ]
    execute_generation_tasks(tasks_list)
    print(json.dumps({"generated": [str(p.name) for _, p in tasks_list]}, ensure_ascii=False))
