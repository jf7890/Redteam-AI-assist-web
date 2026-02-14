# Redteam‑AI‑Assist — Student Web UI (Lab)

Web UI (React + Vite + TypeScript) dành cho học viên thao tác theo **session** với **Redteam‑AI‑Assist AI Server**, đồng thời gọi **Local Agent API** (chạy trên client, localhost) để chạy auto‑recon/ingest history và **đẩy telemetry về AI server**.

> **Lab-only**: UI này **không có auth**. Không triển khai trên Internet public.

---

## 1) Kiến trúc & luồng dữ liệu

Topology:

- **Browser (UI)** → gọi trực tiếp **AI Server API**
- **Browser (UI)** → gọi **Local Agent API** (localhost:8787)  
  Local Agent sẽ tự POST telemetry về AI Server:

```
Client Browser  ->  AI Server (domain / ip)
Client Browser  ->  Local Agent (http://127.0.0.1:8787)  ->  AI Server
```

Luồng chính:

1. UI gọi `POST /v1/sessions` tạo session
2. UI gọi `POST /v1/sessions/{id}/suggest` để lấy hành động tiếp theo
3. UI gọi Local Agent:
   - `POST /auto-recon` để chạy tool (nmap/whatweb/…)
   - `POST /ingest-history` để ingest lịch sử
4. Local Agent tự POST telemetry vào `POST /v1/sessions/{id}/events`
5. UI refresh session / suggest để thấy cập nhật

---

## 2) Tính năng UI

Các tab:

- **Setup**: cấu hình endpoint, defaults, session id (shortcut)
- **Session**: create/load/delete, xem metadata, phase, missing_artifacts, episode_summary
- **Agent**: download agent script, trigger auto-recon / ingest-history
- **Suggest**: gọi suggest theo params (memory_mode, history_window, phase_override, rag_focus)
- **Evidence**: thêm note (POST events), timeline best-effort, lấy report template (`rag_focus=report`)

---

## 3) Yêu cầu môi trường

- AI Server (Redteam‑AI‑Assist) đang chạy và browser truy cập được:
  - mặc định: `http://127.0.0.1:8088`
- Local Agent API chạy trên client (localhost):
  - mặc định: `http://127.0.0.1:8787`
  - **phải bật CORS** cho origin của UI

> Repo này **không chứa Local Agent** (dependency ngoài).

---

## 4) Chạy bằng Docker (khuyến nghị)

### 4.1 Chuẩn bị `.env`

Copy mẫu:

```bash
cp .env.example .env
```

Sửa `.env`:

```env
AI_BASE_URL=http://127.0.0.1:8088
LOCAL_AGENT_URL=http://127.0.0.1:8787
DEFAULT_TARGETS=172.16.100.128,dvwa.local
DEFAULT_POLICY_ID=lab-default
DEFAULT_TENANT_ID=lab
DEFAULT_USER_ID=student
DEFAULT_AGENT_ID=redteam-ai-assist
```

### 4.2 Run

```bash
docker compose up --build
```

Mở UI:

- http://localhost:8080

> Docker runtime sẽ render `/env.js` từ `public/env.template.js` bằng `envsubst`.

---

## 5) Chạy local dev (npm)

### 5.1 Cài dependencies

```bash
npm install
```

### 5.2 Config dev

Vite chỉ expose biến env có prefix `VITE_`.  
Bạn có thể tạo `.env.local`:

```env
VITE_AI_BASE_URL=http://127.0.0.1:8088
VITE_LOCAL_AGENT_URL=http://127.0.0.1:8787
VITE_DEFAULT_TARGETS=172.16.100.128,dvwa.local
VITE_DEFAULT_POLICY_ID=lab-default
VITE_DEFAULT_TENANT_ID=lab
VITE_DEFAULT_USER_ID=student
VITE_DEFAULT_AGENT_ID=redteam-ai-assist
```

### 5.3 Run dev server

```bash
npm run dev
```

Mở:

- http://localhost:5173

---

## 6) Lưu ý quan trọng: CORS / Mixed Content

### 6.1 CORS

UI gọi thẳng Local Agent bằng browser ⇒ Local Agent **phải set CORS** cho origin UI (ví dụ `http://localhost:8080` hoặc `http://localhost:5173`).

### 6.2 Mixed content (HTTPS UI → HTTP localhost)

Nếu UI chạy qua **https** mà agent chạy `http://127.0.0.1:8787`, browser có thể chặn request.  
Cách giảm rủi ro trong lab:

- Chạy UI bằng **http**
- Hoặc cho Local Agent hỗ trợ **https** (self-signed) và cấu hình `LOCAL_AGENT_URL=https://127.0.0.1:8787`

UI có warning banner khi phát hiện tình huống này.

---

## 7) Quick test (Acceptance)

1. Tab **Setup**:
   - chỉnh `AI_BASE_URL`, `LOCAL_AGENT_URL`
   - bấm **Test AI Server** và **Test Local Agent**
2. Tab **Session**:
   - bấm **Create Session**
   - bấm **Load Session** để confirm
3. Tab **Suggest**:
   - bấm **Get Suggest**
4. Tab **Agent**:
   - bấm **Auto Recon (HEAD)** hoặc **Ingest History**
   - bấm **Refresh Session**
5. Tab **Suggest**:
   - bấm **Get Suggest** lại
6. Tab **Evidence**:
   - bấm **Get report template** (rag_focus=report)
7. Tab **Session**:
   - bấm **Delete Session**, sau đó **Load Session** phải báo 404/không tồn tại

---

## 8) Ghi chú về “Timeline events”

Spec UI có timeline command/http/note. Hiện repo này hiển thị:

- `session.events` nếu AI server trả kèm trong `GET /v1/sessions/{id}`
- Notes mà bạn nhập từ UI (local) để không mất thông tin

Nếu muốn timeline đầy đủ, AI server nên expose thêm `GET /v1/sessions/{id}/events`.

---

## 9) Repo structure

```
src/
  api/        # wrappers cho AI Server & Local Agent
  components/ # StatusBanner, JsonPanel, MarkdownPanel...
  pages/      # Setup / Session / Agent / Suggest / Evidence
  state/      # zustand store (persist config + session id)
public/
  env.js          # dev fallback
  env.template.js # docker runtime template
docker/
  nginx.conf
  entrypoint.sh
```

---

## 10) License / Security

- Lab-only, không auth
- Không giữ secrets nhạy cảm
- Local Agent nên bind `127.0.0.1` và giới hạn bề mặt API
