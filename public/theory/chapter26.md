# Chapter 26: Authenticating Wireless Clients

이 장에서는 **무선 클라이언트 인증** 을 학습합니다. PSK, 802.1X, EAP 방법, 그리고 ISE와의 통합을 다룹니다.

커피숍 Wi-Fi는 비밀번호 하나로 모든 사람이 접속합니다. 하지만 기업 환경에서는 누가 접속했는지 알아야 하고, 사용자마다 다른 권한을 줘야 합니다. 이를 위해 802.1X 인증이 필요합니다.

---

## 1. 무선 인증 방식

### 인증 방식 비교

| 방식 | 보안 | 관리 | 용도 |
|------|------|------|------|
|**Open**| 없음 | 쉬움 | 공용, 게스트 |
|**PSK**| 중간 | 쉬움 | 소규모 |
|**802.1X**| 높음 | 복잡 | 기업 |

### 인증 흐름 개요

```
Open:
[Client] ─── Open Request ───→ [AP] → 연결 완료

PSK:
[Client] ─── PSK 검증 ───→ [AP] → 연결 완료

802.1X:
[Client] ─── EAP ───→ [AP] ─── RADIUS ───→ [ISE]
                               │
                          인증 결과 전달
```

---

## 2. PSK (Pre-Shared Key)

### PSK 동작

```
모든 사용자가 같은 비밀번호:

설정:
- SSID: Corporate
- Password: MySecretKey123

모든 직원이 "MySecretKey123" 입력
```

### WPA2-Personal vs WPA3-Personal

```
WPA2-Personal (PSK):
- 4-way Handshake
- 오프라인 사전 공격 취약

WPA3-Personal (SAE):
- Simultaneous Authentication of Equals
- 오프라인 공격 방지
- Forward Secrecy
```

### PSK의 한계

```
문제:
1. 비밀번호 공유 → 유출 위험
2. 개별 사용자 식별 불가
3. 비밀번호 변경 시 전체 재설정
4. 세밀한 권한 제어 불가

→ 기업 환경에서는 802.1X 권장
```

---

## 3. 802.1X 인증

### 802.1X 구성 요소

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Supplicant  │ ──→ │ Authenticator│ ──→ │ Auth Server  │
│   (Client)   │     │   (WLC/AP)   │     │   (RADIUS)   │
└──────────────┘     └──────────────┘     └──────────────┘
```

| 구성 요소 | 역할 |
|----------|------|
|**Supplicant**| 인증 요청 (PC, 폰) |
|**Authenticator**| 중개 (WLC) |
|**Auth Server**| 인증 결정 (ISE) |

### 802.1X 프로세스

```
1. Association (연결 요청)
   Client ──→ AP

2. EAP Identity Request
   AP ──→ Client: "누구세요?"

3. EAP Identity Response
   Client ──→ AP: "user@company.com"

4. EAP Method Exchange
   AP ←→ ISE: RADIUS (EAP 캡슐화)

5. EAP Success/Failure
   ISE ──→ AP ──→ Client

6. 4-Way Handshake (암호화 키)
   Client ←→ AP

7. 연결 완료!
```

---

## 4. EAP 방법

### EAP (Extensible Authentication Protocol)

**EAP** 는 인증 프레임워크입니다. 다양한 인증 방법을 지원합니다.

### EAP-TLS

```
인증서 기반 (가장 안전):

[Client]           [ISE]
   │                 │
   │←── Server Cert ─│
   │                 │
   │── Client Cert ──→
   │                 │
   └─── 상호 인증 ───┘

장점: 비밀번호 없음, 가장 안전
단점: 인증서 배포 복잡
```

### PEAP (Protected EAP)

```
서버 인증서 + 사용자 비밀번호:

[Client]                    [ISE]
   │                          │
   │←─── Server Cert ─────────│
   │                          │
   │──── TLS Tunnel ──────────│
   │                          │
   │── Username/Password ───→ │ (터널 내)
   │                          │
   └───── 인증 완료 ──────────┘

장점: 클라이언트 인증서 불필요
단점: 비밀번호 필요
```

### EAP-FAST

```
Cisco 전용 (PAC 사용):

PAC = Protected Access Credential
    = 사전 공유된 토큰

장점: 인증서 없이 빠른 인증
단점: PAC 프로비저닝 필요
```

### EAP 방법 비교

| EAP 방법 | 클라이언트 인증서 | 서버 인증서 | 보안 |
|---------|----------------|-----------|------|
|**EAP-TLS**| O | O | 최상 |
|**PEAP**| X | O | 높음 |
|**EAP-FAST**| X | 선택 | 높음 |
|**EAP-TTLS**| X | O | 높음 |

---

## 5. Cisco ISE 통합

### ISE 역할

```
ISE 기능:
┌─────────────────────────────────────────┐
│ Authentication: 인증 처리              │
│ Authorization: 권한 부여               │
│ Accounting: 세션 기록                  │
│ Profiling: 장치 식별                   │
│ Posture: 보안 상태 확인                │
│ Guest: 게스트 관리                     │
└─────────────────────────────────────────┘
```

### ISE Policy 예시

```
Authentication Policy:
IF wireless AND 802.1X THEN
  Use PEAP (MSCHAPv2)

Authorization Policy:
IF Group=Employees AND Compliant THEN
  Permit, VLAN: Corp, SGT: 10
ELSE IF Group=Guests THEN
  Permit, VLAN: Guest, ACL: GuestACL
ELSE
  Deny
```

### RADIUS 속성

| 속성 | 용도 |
|------|------|
|**Tunnel-Type**| VLAN |
|**Tunnel-Private-Group-ID**| VLAN ID |
|**Filter-ID**| ACL 이름 |
|**Cisco-AVPair**| Cisco 전용 속성 |

---

## 6. 동적 VLAN 할당

### 개념

```
인증 결과에 따라 VLAN 할당:

Employee ─── 인증 ───→ VLAN 10 (Corporate)
Guest    ─── 인증 ───→ VLAN 20 (Guest)
IoT      ─── 인증 ───→ VLAN 30 (IoT)
```

### WLC 설정

```bash
! Interface 생성
config interface create vlan10 10
config interface address vlan10 10.10.10.1 255.255.255.0

! WLAN에서 AAA Override 활성화
config wlan aaa-override enable 1
```

### ISE Authorization Profile

```
Authorization Profile "Employee-Profile":
- VLAN: 10
- ACL: Permit-All
- SGT: 10

RADIUS 속성:
Tunnel-Type = VLAN
Tunnel-Private-Group-ID = 10
```

---

## 7. Guest 인증

### Guest Portal

```
[Guest] ─wifi─ [AP] ─── [WLC] ─── [ISE Guest Portal]
                              │
                         웹 인증 페이지
                              │
                    사용자 등록/로그인
```

### Guest 유형

| 유형 | 설명 |
|------|------|
|**Hotspot**| 약관 동의만 |
|**Self-Registration**| 직접 등록 |
|**Sponsored**| 직원 승인 |
|**Social Login**| SNS 계정 |

### Guest 설정 흐름

```
1. Guest WLAN 생성 (Open + WebAuth)
2. ISE Guest Portal 설정
3. WLC에서 ISE로 리다이렉트 설정
4. Guest 정책 정의
5. 테스트
```

---

## 8. BYOD 인증

### BYOD 흐름

```
1. 사용자가 개인 기기로 연결
2. ISE가 기기 유형 확인 (Profiling)
3. Onboarding Portal로 리다이렉트
4. 인증서 또는 프로파일 설치
5. 기업 네트워크 접근

Dual-SSID 또는 Single-SSID 방식
```

### Native Supplicant Provisioning

```
ISE가 기기에 프로파일 설치:

Windows: 802.1X 설정 프로파일
macOS: .mobileconfig 프로파일
iOS: 동일
Android: Wi-Fi 프로파일
```

---

## 9. FlexConnect 인증

### 로컬 인증

```
FlexConnect에서 WAN 다운 시:

[Client] ─wifi─ [AP] ─── X (WAN Down) ─── [WLC]
                 │
           로컬 RADIUS
           또는 로컬 인증

Standalone 모드로 동작
```

### FlexConnect 인증 설정

```bash
! 로컬 EAP 활성화
config flexconnect group default-flexgroup local-auth enable

! 로컬 RADIUS 서버
config flexconnect group default-flexgroup radius server add 1 192.168.1.100 1812 shared-key
```

---

## 10. 정리

### 인증 방식 요약

| 방식 | 보안 | 용도 |
|------|------|------|
|**Open**| 없음 | 공용 |
|**WPA2-PSK**| 중간 | 가정/소규모 |
|**WPA2-Enterprise**| 높음 | 기업 |
|**WPA3-Personal**| 높음 | 가정 |
|**WPA3-Enterprise**| 최상 | 기업 |

### EAP 방법 요약

| EAP | 인증서 | 비밀번호 |
|-----|--------|---------|
|**EAP-TLS**| 필수 | X |
|**PEAP**| 서버만 | O |
|**EAP-FAST**| 선택 | O (PAC) |

### 시험 포인트

- 802.1X 구성 요소 (Supplicant, Authenticator, Auth Server)
- EAP 방법별 특성
- EAP-TLS vs PEAP 차이
- 동적 VLAN 할당 설정
- ISE Authorization Policy
- FlexConnect 로컬 인증

---

## 다음 장 예고

**다음 장에서는 Wireless Troubleshooting을 다룹니다.**

무선 네트워크 문제 해결 방법과 도구를 학습합니다.
