# Levit Problem Solver — AI Shopping Agent

여러 쇼핑몰의 실제 의류 상품과 구매후기를 함께 살펴보고, 조건에 맞는 후보와 구매 전 확인할 점을 정리하는 AI Shopping Agent MVP입니다.

현재 구현 진행 상황은 [`docs/IMPLEMENTATION_STATUS.md`](docs/IMPLEMENTATION_STATUS.md)에서 확인할 수 있습니다.

## Local development

```bash
npm install
npm run dev
```

- Frontend: `http://localhost:5173`
- Health API: `http://localhost:3000/api/health`

## Production build

```bash
npm run build
npm start
```

Production server는 React build와 API를 같은 포트에서 제공합니다.
