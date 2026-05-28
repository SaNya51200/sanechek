"""Check real GigaChat credentials from .env."""

from gigachat_client import GigaChatClient


if __name__ == "__main__":
    client = GigaChatClient()
    answer = client.chat("Ответь одним предложением: соединение с GigaChat работает.")
    print(answer)

