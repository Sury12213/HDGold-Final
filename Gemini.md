# HDGold - Lộ trình hoàn thiện

## Phase 1: UI Redesign ✅
- [x] Chuyển từ CRA sang Vite + React
- [x] Tách `App.js` (817 dòng) thành components riêng biệt
- [x] Redesign giao diện premium (dark theme, glassmorphism, animations)
- [x] Thay tab buttons bằng sidebar/navbar chuyên nghiệp
- [x] Responsive design chuẩn mobile/desktop
- [x] Thay `alert()` bằng toast notifications
- [x] Dashboard tổng quan với giá vàng realtime
- [x] Loading states & error handling đẹp
- [x] Login ví thì xài thư viện thằng walletconnect/rainbow kit ấy cho kết nối đc nhiều kiểu ví 
- [x] Khi người dùng swap tiến hành ký ví hay gì đó mà chưa add token đó vào thì yêu cầu add token
- [x] Thêm mục faucet token nữa nhé để người ta có dô thì còn có cái test
- [x] Thêm phần giao diện sáng và tối
- [x] Thêm logo lên phần tên project
- [x] Phần Burn:bị lỗi rn failed: Insufficient USDT reserves không swap vè USDT được
- [x] Phần claimreward gọi function sai xem lại abis/HDGoldStaking.json
- [x] Đối với user đã KYC thì phần KYC hiện kiểu "You are verified" và không cho upload ảnh nữa

## Phase 2: Server KYC + Telegram Bot ✅
- [x] Upload ảnh CCCD/Selfie lên Cloudinary (multer + cloudinary)
- [x] Telegram Bot gửi ảnh + nút Approve/Reject cho admin
- [x] Admin approve → mint SBT on-chain, reject → user upload lại
- [x] Lưu pending requests vào file JSON (không DB)
- [x] Frontend: form upload gửi ảnh, hiện trạng thái pending/rejected
- [x] Rate-limiting & chuẩn hóa API response

## Phase 3: Deploy Production ⬜
- [ ] Deploy UI lên Vercel (vercel.json đã config)
- [ ] Deploy Server lên Render (render.yaml đã config)
- [ ] Oracle Price Updater qua GitHub Actions (workflow đã tạo)
- [ ] Cấu hình environment variables trên Vercel/Render
- [ ] Verify sau deploy: KYC flow, gold price, theme toggle

---

**Contracts đã deploy trên BSC Testnet:**
| Contract | Address |
|----------|---------|
| KycSBT | `0x33FEcC1536d8714499340b99545D54784096aE2C` |
| PriceFeeder | `0x570b30768B77709686afA1F8c7d3AE42cb35aa41` |
| HDGoldVault | `0xa7440675ba7CB263dB1Fc2fb54818E8A18FF96c1` |
| HDGoldStaking | `0x61eb33871DC0c963b14FC412C419acE22d156522` |
| USDT (test) | `0x337610d27c682E347C9cD60BD4b3b107C9d34dDd` |
