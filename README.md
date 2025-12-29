# PPT Font Surgeon 🩺

![Screenshot](screenshot.png)

PowerPoint 프레젠테이션의 폰트 문제를 해결하는 웹 기반 도구입니다.

## ✨ 주요 기능

- **폰트 분석**: PPTX 파일에 사용된 모든 폰트를 분석
- **임베딩 제거**: 깨진 폰트 임베딩 정보를 완전히 제거
- **폰트 매핑**: 특정 폰트를 다른 폰트로 교체
- **실시간 진행**: WebSocket을 통한 실시간 처리 상태 표시 (이모지 기반 로깅)
- **다국어 지원**: 한국어/영어 UI 지원
- **프리미엄 디자인**: 스플래시 모달 및 세련된 블루 테마 적용

## 🛠️ 기술 스택

- **Backend**: Node.js, Express.js
- **Frontend**: Vanilla JavaScript, CSS3 (Blue-Cyan Gradient Theme)
- **Real-time**: WebSocket (ws)
- **Core Engine**: [pptx-surgeon](https://github.com/rse/pptx-surgeon) by Dr. Ralf S. Engelschall
- **Icons**: Lucide Icons
- **Fonts**: Google Fonts (Inter, JetBrains Mono)

## 📦 설치 방법

```bash
# 저장소 클론
git clone https://github.com/jvisualschool/PPT-Font-Surgeon.git
cd PPT-Font-Surgeon

# 의존성 설치
npm install

# 서버 시작
npm start
```

서버가 `http://localhost:3000`에서 실행됩니다. (프로덕션 포트는 3002 권장)

## 🚀 프로덕션 배포

### PM2를 사용한 배포

PM2는 서버를 24시간 가동시키고 에러 발생 시 자동으로 재시작해주는 프로세스 매니저입니다.

```bash
# PM2 설치
npm install -g pm2

# 앱 시작 (3002 포트 사용)
PORT=3002 pm2 start server.js --name ppt-surgeon

# 자동 시작 설정
pm2 startup
pm2 save
```

### Nginx/Apache 리버스 프록시 설정

Apache 예시 (`/PPTFONT` 경로로 배포 시):
```apache
ProxyPass /PPTFONT/ http://127.0.0.1:3002/
ProxyPassReverse /PPTFONT/ http://127.0.0.1:3002/

# WebSocket 프록시
ProxyPass /PPTFONT/ws ws://127.0.0.1:3002/ws
ProxyPassReverse /PPTFONT/ws ws://127.0.0.1:3002/ws
```

## 📁 프로젝트 구조

```
pptx-surgeon-web/
├── public/                 # 프론트엔드 파일
│   ├── index.html         # 메인 HTML
│   ├── style.css          # 스타일시트 (블루/시안 테마)
│   ├── script.js          # 클라이언트 JavaScript
│   ├── splash.jpg         # 스플래시 이미지
│   └── img/               # 아이콘 이미지 (SVG)
├── uploads/               # 업로드된 파일 (보안 처리를 위해 .gitignore 등록)
├── server.js              # Express 서버 (WebSocket 통합)
├── pptx-surgeon.js        # 메인 PPTX 처리 모듈
├── pptx-surgeon-*.js      # PPTX 처리 하위 모듈
├── package.json           # 의존성 및 스크립트 정의
└── README.md              # 이 파일
```

## 🔒 보안 고려사항

- 업로드된 파일은 처리 후 자동 삭제됩니다.
- 파일 크기 제한 설정 (기본 100MB).
- `.gitignore`를 통해 민감한 임시 파일 및 PPTX 파일의 외부 노출을 차단합니다.

## 📝 사용 방법

1. **파일 선택**: PPTX 파일을 드래그 앤 드롭하거나 선택
2. **폰트 분석**: 자동으로 파일의 폰트 정보 분석
3. **옵션 설정**: 
   - 폰트 임베딩 제거
   - 폰트 매핑 (교체할 폰트 지정)
   - 상세 로그 출력 (상세 수술 과정 확인)
4. **수술 실행**: 처리 시작 및 실시간 이모지 로그 확인
5. **결과 다운로드**: 처리 완료 후 결과 파일 다운로드

## 🎨 디자인 포인트

- **Splash Modal**: 프로젝트 정보와 기술 스택을 보여주는 프리미엄 시작 화면
- **Image Viewer**: 모달 내 이미지를 클릭하여 전체 화면으로 감상 가능
- **Interactive UI**: 로딩 바, 토스트 메시지, 부드러운 애니메이션 적용

## 👨‍💻 개발자

**Jinho Jung**
- Email: [jvisualschool@gmail.com](mailto:jvisualschool@gmail.com)

## 🙏 크레딧

- **Original pptx-surgeon**: [Dr. Ralf S. Engelschall](https://github.com/rse/pptx-surgeon)
- **Icons**: [Lucide](https://lucide.dev/)

## 📄 라이선스

이 프로젝트는 원본 pptx-surgeon의 라이선스를 따릅니다.

---

Made with ❤️ by Jinho Jung | 2026