# Chapter 25: Understanding Wireless Roaming and Location Services

이 장에서는 **무선 로밍 ** 과**위치 서비스** 를 학습합니다. 클라이언트가 AP 간 이동할 때 끊김 없이 연결을 유지하는 로밍과, 무선 신호를 이용한 위치 추적 기술을 다룹니다.

회의실을 이동하면서 화상 회의를 한다면, 로밍이 빨라야 통화가 끊기지 않습니다. 또한, 공장에서 자산의 위치를 추적하거나, 쇼핑몰에서 고객 동선을 분석할 때 위치 서비스가 활용됩니다.

---

## 1. 무선 로밍 개요

### 로밍이란?

**로밍 ** 은 클라이언트가**AP 간 이동** 할 때 연결을 유지하는 것입니다.

```
[AP 1] ────→ [AP 2]
   │           │
   └── 클라이언트 이동 ──┘
      연결 유지!
```

### 로밍이 필요한 상황

```
클라이언트가 이동:
- 신호 약해짐
- 더 좋은 AP 발견
- 로밍 결정

좋은 로밍:
- 빠른 전환 (< 50ms for Voice)
- 세션 유지
- IP 유지
```

---

## 2. Layer 2 로밍

### Intra-Controller 로밍

```
같은 WLC 내 AP 간 로밍:

[AP 1] ─── [WLC] ─── [AP 2]
   │                    │
   └─ 클라이언트 이동 ──┘

특징:
- 가장 빠름
- WLC 내부에서 처리
- 모든 상태 정보 유지
```

### 동작 과정

```
1. 클라이언트가 AP 2에 Reassociation 요청
2. WLC가 세션 정보 이동
3. AP 2로 데이터 전환
4. 완료!

시간: 수 밀리초
```

---

## 3. Layer 3 로밍

### Inter-Controller 로밍

```
다른 WLC 간 로밍:

[WLC 1] ════ Mobility Tunnel ════ [WLC 2]
   │                                  │
 [AP 1]                            [AP 2]
   │                                  │
   └────── 클라이언트 이동 ──────────┘
```

### Symmetric Tunneling

```
클라이언트 IP 유지를 위해 터널 사용:

[Client] ─wifi─ [AP 2] ─── [Foreign WLC]
                               │
                          Mobility Tunnel
                               │
                          [Anchor WLC] ─── [Network]

Anchor: 원래 WLC, IP 유지
Foreign: 현재 연결된 WLC
```

### Mobility Group

```
로밍 가능한 WLC 그룹:

[WLC 1] ─┬─ Mobility Group ─┬─ [WLC 2]
         │                  │
[WLC 3] ─┘                  └─ [WLC 4]

설정:
- 같은 Mobility Group Name
- Mobility Member 등록
```

---

## 4. 빠른 로밍 기술

### 802.11r (FT - Fast Transition)

```
전통적 로밍:
1. 인증 (Authentication)
2. 연결 (Association)
3. 802.1X (4-way handshake)
4. 암호화 키 교환
   = 느림!

802.11r (FT):
1. 사전 인증 (Over-the-Air/DS)
2. 빠른 Association
   = 50ms 이하!
```

### 802.11k (Radio Resource Management)

```
클라이언트에게 이웃 AP 정보 제공:

AP → Client: "주변 AP 목록"
- AP 2: Channel 36, RSSI -60
- AP 3: Channel 44, RSSI -65

클라이언트가 스캔 시간 단축!
```

### 802.11v (BSS Transition Management)

```
AP가 클라이언트에게 로밍 권고:

AP → Client: "AP 2로 이동 권장"

사용 사례:
- 로드 밸런싱
- 유지보수 전 이동
- 최적 AP 안내
```

### CCKM (Cisco Centralized Key Management)

```
Cisco 전용 빠른 로밍:
- 레거시 기기 지원
- WLC가 키 캐시
- 빠른 재인증
```

---

## 5. 로밍 문제 해결

### 로밍 지연 원인

| 원인 | 해결책 |
|------|--------|
| 802.1X 재인증 | PMK Caching, 802.11r |
| 긴 스캔 시간 | 802.11k |
| 약한 로밍 결정 | 802.11v |
| 컨트롤러 간 지연 | Mobility Tunnel 최적화 |

### 로밍 임계값

```
클라이언트 로밍 결정:
- RSSI가 임계값 이하로 떨어지면 로밍

문제: "Sticky Client"
- 신호 약해도 로밍 안 함
- 성능 저하

해결:
- 802.11v로 로밍 권고
- 최소 RSSI 설정으로 강제 연결 해제
```

---

## 6. 위치 서비스 개요

### 위치 서비스란?

무선 신호를 이용하여 **장치/사람의 위치를 파악** 합니다.

```
용도:
- 자산 추적 (Asset Tracking)
- 사람 흐름 분석
- 실내 내비게이션
- 근접 마케팅
```

### 위치 추적 방법

| 방법 | 정확도 | 복잡도 |
|------|--------|--------|
|**Cell ID**| 낮음 (AP 영역) | 낮음 |
|**RSSI 삼각측량**| 중간 (3-5m) | 중간 |
|**AoA (Angle of Arrival)**| 높음 (1-3m) | 높음 |
|**ToF (Time of Flight)**| 높음 (1m) | 높음 |
|**Fingerprinting**| 높음 (1-3m) | 높음 |

---

## 7. RSSI 기반 위치 추적

### 삼각측량 (Trilateration)

```
3개 이상 AP에서 RSSI 측정:

[AP 1] ────── RSSI: -60 ──────
   │                         │
   │        [장치]           │
   │                         │
[AP 2] ────── RSSI: -65 ─────┤
                             │
[AP 3] ────── RSSI: -70 ─────┘

RSSI로 거리 추정 → 위치 계산
```

### 정확도 영향 요소

```
정확도에 영향:
- AP 밀도 (많을수록 좋음)
- 환경 (반사, 장애물)
- 캘리브레이션
- 클라이언트 차이
```

---

## 8. Cisco CMX / DNA Spaces

### CMX (Connected Mobile Experience)

```
CMX 기능:
┌─────────────────────────────────────────┐
│ Detect: 장치 탐지                       │
│ Locate: 위치 추적                       │
│ Connect: 게스트 Wi-Fi                   │
│ Engage: 근접 마케팅                     │
│ Analytics: 방문자 분석                  │
└─────────────────────────────────────────┘
```

### DNA Spaces

```
클라우드 기반 위치 서비스:

[AP] ─── [WLC] ─── [DNA Spaces Cloud]
                         │
                    위치 분석
                    대시보드
                    API
```

### 위치 정확도 향상

```
FastLocate:
- 프로브 요청만으로 위치 추적
- 연결 없이도 탐지
- 익명 방문자 추적

Hyperlocation:
- 특수 안테나 모듈
- AoA 사용
- 1m 정확도
```

---

## 9. BLE (Bluetooth Low Energy) 위치 서비스

### BLE Beacon

```
BLE 비콘을 통한 위치:

[BLE Beacon] ──→ [Phone App]
                     │
              위치 기반 서비스

iBeacon, Eddystone
```

### BLE와 Wi-Fi 통합

```
Cisco AP with BLE:
- Wi-Fi 서비스
- BLE Beacon 송신
- BLE 장치 추적

하나의 AP로 Wi-Fi + BLE!
```

---

## 10. 정리

### 로밍 유형 비교

| 로밍 유형 | 범위 | 속도 |
|----------|------|------|
|**Intra-Controller**| 같은 WLC | 가장 빠름 |
|**Inter-Controller L2**| 같은 VLAN | 빠름 |
|**Inter-Controller L3**| 다른 VLAN | 중간 |

### 빠른 로밍 기술

| 기술 | 목적 |
|------|------|
|**802.11r**| 빠른 재인증 |
|**802.11k**| 이웃 AP 정보 |
|**802.11v**| 로밍 권고 |

### 위치 서비스 요약

| 기술 | 정확도 |
|------|--------|
|**RSSI**| 3-5m |
|**AoA**| 1-3m |
|**BLE**| 1-3m |

### 시험 포인트

- Intra vs Inter Controller 로밍
- 802.11r, k, v 역할
- Anchor/Foreign WLC 개념
- RSSI 기반 위치 추적 원리
- CMX/DNA Spaces 기능

---

## 다음 장 예고

**다음 장에서는 Wireless Client Authentication을 다룹니다.**

802.1X, EAP, PSK 등 무선 클라이언트 인증 방식을 학습합니다.
