FROM python:3.13-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY main.py .
EXPOSE 9999
HEALTHCHECK --interval=3s --timeout=3s --retries=5 \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:9999/health')" || exit 1
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "9999"]
