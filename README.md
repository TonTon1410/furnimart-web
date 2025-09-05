# 🛋️ FurniMart FE

**FurniMart** là hệ thống thương mại điện tử nội thất đa chi nhánh với trải nghiệm 3D trực quan.  
Đây là phần **Frontend** được xây dựng bằng **React + Vite + TypeScript + TailwindCSS**.  

---

## 🚀 Công nghệ sử dụng
- ⚛️ [React 19](https://react.dev/) + [Vite 7](https://vitejs.dev/)
- 🟦 [TypeScript](https://www.typescriptlang.org/)
- 🎨 [TailwindCSS](https://tailwindcss.com/)
- 🔄 [Redux Toolkit](https://redux-toolkit.js.org/) & [React Redux](https://react-redux.js.org/)
- 🌐 [React Router DOM](https://reactrouter.com/)
- ⚡ [Axios](https://axios-http.com/) cho HTTP client
- 🔔 [Lucide React](https://lucide.dev/) cho icon

---

## 📂 Cấu trúc thư mục

furnimart-fe/
├── public/ # file tĩnh
├── src/
│ ├── assets/ # hình ảnh, icon
│ ├── components/ # component tái sử dụng
│ ├── pages/ # các trang chính (Home, Login, ...)
│ ├── router/ # cấu hình route
│ ├── store/ # redux store & slices
│ ├── utils/ # hàm tiện ích
│ ├── App.tsx # app chính
│ └── main.tsx # entry point
├── package.json
├── tsconfig.json
└── vite.config.ts

---

## ⚙️ Cài đặt & Chạy

### 1. Clone repo
```bash
git clone https://github.com/TonTon1410/furnimart-web.git
cd furnimart-fe

2. Cài dependency
npm install

3. Chạy môi trường dev
npm run dev


Truy cập: http://localhost:5173

4. Build production
npm run build

5. Preview production build
npm run preview