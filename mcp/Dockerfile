FROM python:3.12-slim

WORKDIR /srv

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY server.py .

ENV DAISY_API_URL=http://api:8000
EXPOSE 8000

CMD ["python", "server.py", "http"]