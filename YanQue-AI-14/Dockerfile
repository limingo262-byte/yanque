FROM python:3.11-slim
WORKDIR /app
RUN pip install --no-cache-dir -i https://mirrors.aliyun.com/pypi/simple uv
ENV UV_INDEX_URL=https://mirrors.aliyun.com/pypi/simple
COPY pyproject.toml uv.lock README.md ./
RUN uv sync --no-dev --no-install-project
COPY src ./src
ENV PATH="/app/.venv/bin:$PATH"
ENV PYTHONPATH="/app/src"
ENV PYTHONUNBUFFERED=1
EXPOSE 8002
CMD ["python", "-m", "yanque_ai.main"]
