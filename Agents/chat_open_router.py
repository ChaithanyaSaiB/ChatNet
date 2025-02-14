import os
from langchain_community.chat_models import ChatOpenAI

class ChatOpenRouter(ChatOpenAI):
    def __init__(self, model_name: str, openai_api_base: str = None, openai_api_key: str = None, **kwargs):
        openai_api_base = openai_api_base or "https://openrouter.ai/api/v1"
        openai_api_key = openai_api_key or os.getenv('OPENROUTER_API_KEY')
        super().__init__(
            openai_api_base=openai_api_base,
            openai_api_key=openai_api_key,
            model_name=model_name,
            **kwargs,
        )
