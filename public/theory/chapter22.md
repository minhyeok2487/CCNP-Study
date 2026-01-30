# Chapter 22: SD-WAN

이 장에서는 **Cisco SD-WAN** 을 학습합니다. 기존 WAN의 복잡성과 비용 문제를 해결하고, 애플리케이션 인식 기반의 지능형 라우팅을 제공하는 솔루션입니다.

MPLS WAN은 안정적이지만 비쌉니다. 인터넷은 저렴하지만 불안정합니다. 두 가지를 효율적으로 조합하고, 애플리케이션별로 최적의 경로를 선택하는 것이 SD-WAN입니다.

---

## 1. SD-WAN 개요

### 전통적 WAN의 문제

```
전통적 WAN:
┌──────────────────────────────────────┐
│         [본사 DC]                    │
│            │                        │
│         [MPLS]                      │
│         /    \                      │
│    [지사 A]  [지사 B]               │
│                                      │
│ 문제:                               │
│ - MPLS 비용 높음                    │
│ - 대역폭 증설 느림                  │
│ - 클라우드 접근 비효율              │
│ - 수동 설정                         │
└──────────────────────────────────────┘
```

### SD-WAN의 해결책

```
SD-WAN:
┌──────────────────────────────────────┐
│ [vManage] ← 중앙 관리                │
│     │                                │
│ [vSmart] ← 제어 평면                 │
│     │                                │
│ [지사] ─── MPLS + Internet ─── [지사]│
│     │                                │
│ [클라우드] ← 직접 접근               │
│                                      │
│ 장점:                               │
│ - 회선 비용 절감                    │
│ - 자동화된 배포                     │
│ - 애플리케이션 인식                 │
│ - 보안 통합                         │
└──────────────────────────────────────┘
```

---

## 2. Cisco SD-WAN 구성 요소

### 아키텍처

```
┌─────────────────────────────────────────────────┐
│                 [vManage]                        │
│              관리 및 모니터링                     │
└────────────────────┬────────────────────────────┘
                     │
┌────────────────────┼────────────────────────────┐
│              [vSmart Controller]                 │
│           OMP 라우팅, 정책 배포                   │
└────────────────────┬────────────────────────────┘
                     │
┌────────────────────┼────────────────────────────┐
│               [vBond]                            │
│         초기 인증, Orchestration                 │
└────────────────────┬────────────────────────────┘
                     │
     ┌───────────────┼───────────────┐
     ▼               ▼               ▼
[WAN Edge]      [WAN Edge]      [WAN Edge]
  지사 A          지사 B          본사
```

### 구성 요소 설명

| 구성 요소 | 역할 |
|----------|------|
|**vManage**| 중앙 관리, 모니터링, 정책 |
|**vSmart**| Control Plane, OMP 라우팅 |
|**vBond**| 초기 인증, Orchestration |
|**WAN Edge**| Data Plane, 지사/본사 라우터 |

---

## 3. OMP (Overlay Management Protocol)

### OMP란?

**OMP** 는 SD-WAN의 **Control Plane 프로토콜** 입니다.

```
OMP 역할:
- WAN Edge 간 라우팅 정보 교환
- 서비스 체인 정보 배포
- 정책 전달
- 암호화 키 교환
```

### OMP 동작

```
[WAN Edge A] ──OMP──→ [vSmart] ──OMP──→ [WAN Edge B]
                         │
                   라우팅 정보
                   정책 정보
                   서비스 정보
```

### OMP Routes

| Route 유형 | 설명 |
|-----------|------|
|**OMP Routes**| 네트워크 경로 정보 |
|**TLOC**| Transport Locator (WAN 연결) |
|**Service**| 서비스 체인 정보 |

---

## 4. Transport (WAN 회선)

### 지원되는 Transport

```
SD-WAN Transport:
┌──────────────────────────────────────┐
│  MPLS    │  안정적, 고비용           │
│  Internet│  저렴, 가변 품질          │
│  4G/LTE  │  백업, 이동성             │
│  5G      │  고속 무선                │
│  Starlink│  위성                     │
└──────────────────────────────────────┘
```

### TLOC (Transport Locator)

```
TLOC = System IP + Color + Encap

예시:
- 10.1.1.1 + mpls + ipsec
- 10.1.1.1 + biz-internet + ipsec

Color:
- mpls
- biz-internet
- public-internet
- lte
```

### 암호화

```
모든 트래픽 암호화:
[WAN Edge] ════ IPsec/GRE ════ [WAN Edge]

키 교환:
vSmart를 통한 키 배포 (OMP)
```

---

## 5. 정책 (Policy)

### 정책 유형

| 정책 | 위치 | 용도 |
|------|------|------|
|**Control Policy**| vSmart | 라우팅 제어 |
|**Data Policy**| WAN Edge | 트래픽 처리 |
|**App-Aware Routing**| WAN Edge | 애플리케이션별 경로 |

### Control Policy

```
vSmart에서 라우팅 조작:

예시: 지사 A로 가는 트래픽은 MPLS만 사용
policy
 control-policy PREFER-MPLS
  sequence 10
   match route
    site-id 100
   action accept
    set tloc-list mpls-only
```

### Data Policy

```
WAN Edge에서 트래픽 처리:

예시: Voice는 MPLS, Web은 Internet
policy
 data-policy TRAFFIC-STEERING
  sequence 10
   match
    dscp 46
   action accept
    set local-tloc color mpls
  sequence 20
   match
    app-list web
   action accept
    set local-tloc color biz-internet
```

### Application-Aware Routing (AAR)

```
애플리케이션 성능 기반 경로 선택:

if Voice-app:
  if MPLS.latency < 150ms AND MPLS.loss < 1%:
    use MPLS
  else:
    use Internet

실시간 SLA 모니터링으로 자동 전환!
```

---

## 6. 보안 기능

### 통합 보안

```
SD-WAN 보안 기능:
┌──────────────────────────────────────┐
│ - 방화벽 (Zone-based)               │
│ - IPS/IDS                          │
│ - URL 필터링                        │
│ - DNS Security                      │
│ - AMP (Advanced Malware Protection) │
│ - Umbrella 통합                     │
└──────────────────────────────────────┘
```

### 분산된 보안

```
전통적:
[지사] ──→ [본사 FW] ──→ [인터넷]
            백홀

SD-WAN:
[지사] ──→ [로컬 보안] ──→ [인터넷]
           직접 접근 (DIA)
```

### 클라우드 보안 (Umbrella)

```
[지사 WAN Edge] ──→ [Umbrella (클라우드)] ──→ [SaaS]

DNS 기반 보안
악성 사이트 차단
```

---

## 7. vManage 대시보드

### 모니터링

```
vManage 기능:
┌─────────────────────────────────────────┐
│ Dashboard                               │
│ - WAN Edge 상태                        │
│ - 회선 상태 (MPLS, Internet)           │
│ - 애플리케이션 사용량                   │
│ - 이벤트/알람                          │
│                                         │
│ Configuration                           │
│ - 템플릿 기반 설정                     │
│ - 정책 관리                            │
│ - 이미지 관리                          │
│                                         │
│ Troubleshooting                         │
│ - 실시간 로그                          │
│ - 경로 추적                            │
│ - 패킷 캡처                            │
└─────────────────────────────────────────┘
```

### 템플릿

```
Feature Template:
- 개별 기능 정의 (인터페이스, 라우팅, 보안)

Device Template:
- Feature Template 조합
- 장비 유형별 적용

예시:
Device Template "Branch-Router"
├── System Template
├── VPN 0 (Transport)
├── VPN 1 (Service)
├── Security Template
└── App-Aware Template
```

---

## 8. Zero Touch Provisioning (ZTP)

### ZTP 동작

```
1. WAN Edge 전원 ON
2. DHCP로 IP 획득
3. vBond 주소로 연결
4. 인증서 기반 인증
5. vSmart/vManage 연결
6. 설정 자동 다운로드
7. 운영 시작

사람 개입 최소화!
```

### PnP (Plug and Play)

```
DNA Center PnP와 유사:
1. 장비 목록 사전 등록
2. Serial Number로 식별
3. 자동 온보딩
```

---

## 9. Multi-Cloud 통합

### Cloud onRamp

```
클라우드 직접 연결:
┌──────────────────────────────────────┐
│       [vManage]                      │
│           │                          │
│    [Cloud onRamp]                    │
│    /      │      \                   │
│ [AWS]  [Azure]  [GCP]               │
│                                      │
│ 자동 VPN 연결                        │
│ 최적 경로 선택                       │
└──────────────────────────────────────┘
```

### SaaS 최적화

```
Microsoft 365, Salesforce 등 SaaS:

전통적: 지사 → 본사 → 인터넷 → SaaS (백홀)
SD-WAN: 지사 → 인터넷 → SaaS (DIA)

성능 향상!
```

---

## 10. SD-WAN vs MPLS

### 비교

| 특성 | MPLS | SD-WAN |
|------|------|--------|
| 비용 | 높음 | 낮음 |
| 품질 | 보장 | 가변 (AAR로 보완) |
| 배포 | 느림 | 빠름 (ZTP) |
| 유연성 | 낮음 | 높음 |
| 클라우드 | 백홀 필요 | 직접 연결 |

### 공존 전략

```
Hybrid WAN:
[지사] ── MPLS (Critical) ── [본사]
   │
   └── Internet (일반) ── [클라우드]

MPLS + SD-WAN:
- 중요 트래픽: MPLS
- 일반 트래픽: Internet
- SD-WAN이 지능적 선택
```

---

## 11. 정리

### 구성 요소 요약

| 구성 요소 | 역할 |
|----------|------|
|**vManage**| 중앙 관리 |
|**vSmart**| Control Plane |
|**vBond**| Orchestration |
|**WAN Edge**| Data Plane |
|**OMP**| 라우팅 프로토콜 |

### 핵심 기능 요약

| 기능 | 설명 |
|------|------|
|**AAR**| 애플리케이션 인식 라우팅 |
|**ZTP**| 자동 배포 |
|**DIA**| 직접 인터넷 접근 |
|**Cloud onRamp**| 클라우드 연결 최적화 |

### 시험 포인트

- SD-WAN 4가지 구성 요소 역할
- OMP의 기능
- TLOC 구성 (System IP + Color + Encap)
- Control Policy vs Data Policy
- Application-Aware Routing
- Zero Touch Provisioning

---

## 다음 장 예고

**다음 장에서는 Wireless Fundamentals를 다룹니다.**

RF 기초, 변조, 무선 네트워크의 기본 원리를 학습합니다.
