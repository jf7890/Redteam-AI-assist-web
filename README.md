# Redteam‑AI‑Assist · Student Web UI (React + Vite + TypeScript)

Web UI dành cho học viên thao tác theo **session**, gọi trực tiếp API của **Redteam‑AI‑Assist (FastAPI)** và (tuỳ chọn) gọi **Local Agent HTTP API** (localhost) để auto‑recon / auto‑ingest.

> Lab-only: không auth, không multi-tenant dashboard (chỉ student UI), không BFF/proxy server-side.

## 1) Yêu cầu
- Node.js 18+ (dev mode)
- Docker + Docker Compose (production/lab deploy)
- AI server: Redteam-AI-assist chạy ở port `8088` (hoặc port bạn cấu hình)
- (Tuỳ chọn) Local Agent HTTP API chạy ở `127.0.0.1:8787` trên máy học viên

## 2) Chạy nhanh (Docker – recommended cho lab)

```bash
cp .env.example .env
# sửa .env nếu cần
docker compose up --build
```

Mở UI: `http://localhost:8080`

### Runtime ENV (rất quan trọng)
Các biến trong `.env` được inject vào `/env.js` lúc container start.

Ví dụ (mỗi học viên tự chạy cả AI + agent + UI trên máy mình):

```env
AI_BASE_URL=http://127.0.0.1:8088
LOCAL_AGENT_URL=http://127.0.0.1:8787
DEFAULT_TARGETS=172.16.100.128,dvwa.local
DEFAULT_POLICY_ID=lab-default
DEFAULT_TENANT_ID=lab
DEFAULT_USER_ID=student
DEFAULT_AGENT_ID=redteam-ai-assist
```

> Lưu ý: `127.0.0.1` luôn là **máy chạy trình duyệt**. Nếu AI server chạy ở máy khác, hãy đặt `AI_BASE_URL=http://<AI_SERVER_IP>:8088`.

## 3) Chạy dev (Vite)

```bash
npm install
npm run dev
```

Mặc định: `http://localhost:5173`

## 4) CORS (bắt buộc nếu UI và AI khác origin/port)

Browser sẽ chặn request nếu backend FastAPI không bật CORS khi UI chạy ở port khác.

**Patch nhanh (lab-only)** trong `redteam_ai_assist/main.py`:

```py
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:8080",
        "http://127.0.0.1:8080",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_methods=["*"],
    allow_headers=["*"],
)
```

Bạn cũng cần bật CORS tương tự cho **Local Agent HTTP API** (nếu có) để UI gọi được `http://127.0.0.1:8787`.

## 5) Mapping API (đã match với backend bạn gửi)

Backend (Redteam-AI-assist) cung cấp:

- `GET /health`
- `POST /v1/sessions` → trả `SessionRecord { session_id, current_phase, events, ... }`
- `GET /v1/sessions/{session_id}`
- `GET /v1/sessions?tenant_id=&user_id=&limit=`
- `POST /v1/sessions/{session_id}/events`
- `POST /v1/sessions/{session_id}/suggest` → trả `SuggestResponse { phase, actions, missing_artifacts, retrieved_context, ... }`
- `DELETE /v1/sessions/{session_id}` → **204 No Content**
- `GET /v1/agents/kali-telemetry-agent.py` (download CLI agent)

UI trong repo này gọi đúng các endpoint ở trên.

## 6) Local Agent HTTP API (dependency ngoài repo UI)

UI có các nút:
- Auto Recon → `POST /auto-recon`
- Ingest History → `POST /ingest-history`

Đây là **Local Agent** chạy trên máy học viên (localhost), tự chạy tool (nmap/whatweb/...) và tự `POST` telemetry lên AI server:
- `POST <AI_BASE_URL>/v1/sessions/{session_id}/events`

Minimal API đề xuất (để UI dùng được):

- `GET /health`
- `POST /auto-recon` body:
  ```json
  { "session_id":"...", "base_url":"http://...", "targets":["..."], "enable_nmap":true, "full_port":false, "once":true, "verbose":true }
  ```
- `POST /ingest-history` body:
  ```json
  { "session_id":"...", "base_url":"http://...", "history_files":["..."], "once":true, "verbose":true }
  ```

> Nếu bạn chưa có Local Agent HTTP API, UI vẫn dùng được các flow Session/Suggest/Notes. Tab Agent sẽ báo lỗi connection (expected).

## 7) Acceptance flow (manual test)
1. Setup: Test AI Server OK.
2. Session: Create Session → lưu `SESSION_ID`.
3. Suggest: Get Suggest (memory_mode/window) → thấy actions + done criteria.
4. Evidence: Add note → Refresh → note xuất hiện trong events.
5. (Tuỳ chọn) Agent: chạy local agent → Auto Recon/History → Refresh session → events tăng.
6. Suggest: Get Report Template (rag_focus=report) → xem `retrieved_context`.

## 8) Troubleshooting
- **404/422**: check `AI_BASE_URL` đúng host/port, và backend đang chạy.
- **CORS error**: bật CORSMiddleware như mục (4).
- **Local agent down**: đảm bảo agent chạy đúng `LOCAL_AGENT_URL` và bật CORS cho origin UI.
- **HTTPS UI + HTTP localhost**: browser có thể block mixed content → chạy UI bằng HTTP hoặc triển khai agent HTTPS.

---
Lab-only. Không expose Internet.
