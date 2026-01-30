# AItool_proto  
**Tooltip-based vocabulary support for Korean academic texts (TOPIK 4–5)**

이 저장소는 한국어 학술 텍스트를 읽는 **외국인 학습자(TOPIK 4–5 수준)**를 위해  
어려운 어휘에 **마우스 오버 툴팁**으로 쉬운 표현과 뜻을 제공하는 **웹 기반 프로토타입**입니다.

---

## 🔗 Live Demo (설치 없이 바로 사용)
👉 https://<YOUR_GITHUB_ID>.github.io/AItool_proto/

- 텍스트를 붙여넣고 **[적용]** 버튼 클릭  
- 밑줄이 그어진 단어에 마우스를 올리면 설명이 표시됩니다

---

## ✨ Features
- 어려운 어휘 자동 하이라이트
- 쉬운 표현 + 짧은 뜻풀이 제공
- JSON 기반 단어장 → 누구나 수정/확장 가능
- 설치 없이 웹에서 바로 체험 가능 (GitHub Pages)

---

## 📂 Project Structure

AItool_proto/
├─ demo/ # GitHub Pages demo
│ ├─ index.html
│ ├─ app.js
│ ├─ style.css
│ ├─ glossary.json # tooltip vocabulary
│ └─ sample.txt
└─ README.md
