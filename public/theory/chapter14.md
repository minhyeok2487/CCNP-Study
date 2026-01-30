# Chapter 14: LISP (Locator/ID Separation Protocol)

이 장에서는 **LISP** 를 학습합니다. IP 주소의 위치(Locator)와 식별(ID) 기능을 분리하여 네트워크 이동성과 확장성을 향상시키는 프로토콜입니다.

IP 주소는 두 가지 역할을 합니다. "누구인가"(ID)와 "어디에 있는가"(위치)입니다. 이 두 역할을 하나의 주소가 담당하기 때문에, 호스트가 이동하면 IP가 바뀌고, IP가 바뀌면 세션이 끊깁니다. LISP는 이 문제를 해결합니다.

---

## 1. LISP의 필요성

### 기존 IP의 문제

**IP 주소의 이중 역할:**
```
IP 주소 = 식별자(ID) + 위치(Locator)

192.168.1.100:
- 이 호스트가 누구인지 식별 (ID)
- 이 호스트가 어디에 있는지 표시 (위치)
```

**문제 1: 이동성**
```
호스트가 Site A에서 Site B로 이동:

Site A: 192.168.1.100
        ↓ 이동
Site B: 10.0.0.100 (새 IP 필요)

→ 기존 세션 끊김!
→ DNS 업데이트 필요!
```

**문제 2: 라우팅 테이블 폭증**
```
인터넷 라우팅 테이블:
전 세계 모든 네트워크를 알아야 함
→ 테이블 크기 지속 증가
→ 장비 부담 증가
```

### LISP의 해결책

```
기존:
IP = ID + 위치 (결합)

LISP:
EID (Endpoint ID) = 호스트 식별
RLOC (Routing Locator) = 위치 정보

분리!
```

---

## 2. LISP 기본 개념

### 핵심 용어

| 용어 | 설명 |
|------|------|
|**EID**| Endpoint Identifier, 호스트 식별 (내부 IP) |
|**RLOC**| Routing Locator, 위치 정보 (외부 IP) |
|**ITR**| Ingress Tunnel Router, 패킷 송신 측 |
|**ETR**| Egress Tunnel Router, 패킷 수신 측 |
|**xTR**| ITR + ETR 모두 수행 |
|**MS**| Map Server, EID-to-RLOC 매핑 저장 |
|**MR**| Map Resolver, 매핑 요청 처리 |

### LISP 아키텍처

```
                    [Map Server/Resolver]
                           │
            ┌──────────────┴──────────────┐
            │                             │
        EID-RLOC                      EID-RLOC
        매핑 등록                      매핑 조회
            │                             │
    [Site A: xTR]  ══════════════  [Site B: xTR]
    RLOC: 198.51.100.1              RLOC: 203.0.113.1
         │                               │
    [Host A]                        [Host B]
    EID: 10.1.1.100                 EID: 10.2.2.100
```

### EID와 RLOC

```
Site A 내부:
Host A: 10.1.1.100 (EID)
        └─ 이 주소로 호스트 식별

Site A 외부 연결:
xTR: 198.51.100.1 (RLOC)
     └─ 이 주소로 Site A 위치 표시

패킷이 나갈 때:
[내부 패킷: 10.1.1.100 → 10.2.2.100]
         ↓ LISP 캡슐화
[외부 패킷: 198.51.100.1 → 203.0.113.1][LISP Header][내부 패킷]
```

---

## 3. LISP 동작 과정

### 1단계: EID-RLOC 매핑 등록

```
Site A의 xTR이 Map Server에 등록:

"EID 10.1.1.0/24는 RLOC 198.51.100.1에 있습니다"

[xTR A] ──Map-Register──→ [Map Server]
                              │
                         EID-RLOC 매핑 저장
                         10.1.1.0/24 → 198.51.100.1
```

### 2단계: 매핑 조회 (Map Request/Reply)

```
Host A(10.1.1.100)가 Host B(10.2.2.100)에게 패킷 전송:

1. ITR이 10.2.2.100의 RLOC 모름
   [ITR A] ──Map-Request──→ [Map Resolver]

2. Map Resolver가 Map Server에 조회
   [Map Resolver] ──Query──→ [Map Server]

3. ETR B가 응답
   [ETR B] ──Map-Reply──→ [ITR A]
   "10.2.2.0/24 → 203.0.113.1"

4. ITR A가 매핑 캐시에 저장
```

### 3단계: 데이터 전송

```
Host A → Host B 패킷:

원본 패킷:
[Src: 10.1.1.100, Dst: 10.2.2.100][Data]

ITR에서 LISP 캡슐화:
[Src: 198.51.100.1, Dst: 203.0.113.1][LISP][원본 패킷]

인터넷 전송 (RLOC 기반)

ETR에서 LISP 디캡슐화:
[Src: 10.1.1.100, Dst: 10.2.2.100][Data]

Host B에게 전달
```

---

## 4. LISP 메시지 유형

### Map-Register

ETR이 MS에 **EID-RLOC 매핑을 등록** 합니다.

```
Map-Register 내용:
- EID-prefix: 10.1.1.0/24
- RLOC: 198.51.100.1
- TTL
- 인증 정보
```

### Map-Notify

MS가 ETR에게 **등록 확인** 을 응답합니다.

### Map-Request

ITR이 **EID의 RLOC을 조회** 합니다.

```
"10.2.2.100의 RLOC은 무엇입니까?"
```

### Map-Reply

ETR이 **매핑 정보를 응답** 합니다.

```
"10.2.2.0/24는 RLOC 203.0.113.1에 있습니다"
```

### Encapsulated Control Message (ECM)

Map-Request를 캡슐화하여 MS/MR로 전송합니다.

---

## 5. LISP 설정

### Map Server/Resolver 설정

```bash
! MS/MR 역할 활성화
Router(config)# router lisp
Router(config-router-lisp)# site SITE-A
Router(config-router-lisp-site)# authentication-key MySecretKey
Router(config-router-lisp-site)# eid-prefix 10.1.1.0/24
Router(config-router-lisp-site)# exit
Router(config-router-lisp)# site SITE-B
Router(config-router-lisp-site)# authentication-key MySecretKey
Router(config-router-lisp-site)# eid-prefix 10.2.2.0/24
Router(config-router-lisp-site)# exit
Router(config-router-lisp)# ipv4 map-server
Router(config-router-lisp)# ipv4 map-resolver
```

### xTR (ITR/ETR) 설정

```bash
! Site A xTR
Router(config)# router lisp
Router(config-router-lisp)# eid-table default instance-id 0
Router(config-router-lisp-eid-table)# database-mapping 10.1.1.0/24 198.51.100.1 priority 1 weight 100
Router(config-router-lisp-eid-table)# exit
Router(config-router-lisp)# ipv4 itr map-resolver 192.0.2.1
Router(config-router-lisp)# ipv4 itr
Router(config-router-lisp)# ipv4 etr map-server 192.0.2.1 key MySecretKey
Router(config-router-lisp)# ipv4 etr
```

### LISP 확인

```bash
! 매핑 데이터베이스 (로컬 EID)
Router# show lisp site

! 매핑 캐시 (원격 EID → RLOC)
Router# show lisp ipv4 map-cache

! LISP 세션 상태
Router# show lisp session
```

---

## 6. LISP 이동성 (Mobility)

### 호스트 이동 시나리오

```
초기 상태:
Host A(10.1.1.100) ─── Site A (RLOC: 198.51.100.1)

Host A가 Site B로 이동:
Host A(10.1.1.100) ─── Site B (RLOC: 203.0.113.1)

기존 IP 유지하면서 위치만 변경!
```

### 이동성 동작

```
1. Host A가 Site B에 연결
   └─ Site B의 ETR이 새 매핑 등록

2. Map-Register 전송
   [Site B ETR] ──"10.1.1.100 → 203.0.113.1"──→ [MS]

3. 기존 Site A의 매핑은 덮어씀

4. 이후 패킷은 Site B로 전달
```

### 이동성 설정

```bash
! 동적 EID 설정
Router(config)# router lisp
Router(config-router-lisp)# eid-table default instance-id 0
Router(config-router-lisp-eid-table)# dynamic-eid MOBILE-EID
Router(config-router-lisp-eid-table-dyn-eid)# database-mapping 10.1.1.0/24 198.51.100.1

! 인터페이스에 동적 EID 적용
Router(config)# interface GigabitEthernet0/1
Router(config-if)# lisp mobility MOBILE-EID
```

---

## 7. LISP Multisite

### Multisite 개념

여러 사이트에 **동일한 EID-prefix** 가 있을 때, 가장 가까운 사이트로 라우팅합니다.

```
[Site A: US]          [Site B: Europe]
EID: 10.1.1.0/24      EID: 10.1.1.0/24
RLOC: 198.51.100.1    RLOC: 203.0.113.1

US 사용자 → Site A로 연결
EU 사용자 → Site B로 연결
```

### Priority와 Weight

```
database-mapping 10.1.1.0/24 198.51.100.1 priority 1 weight 50
database-mapping 10.1.1.0/24 203.0.113.1 priority 1 weight 50

Priority: 낮을수록 우선 (Active/Standby)
Weight: 같은 Priority 내 부하 분산
```

---

## 8. LISP vs 전통적 라우팅

### 비교

| 특성 | 전통적 IP | LISP |
|------|----------|------|
| 라우팅 테이블 | 모든 네트워크 | RLOC만 |
| 이동성 | IP 변경 필요 | EID 유지 |
| 확장성 | 테이블 증가 | Core 라우팅 단순 |
| Multihoming | 복잡 | 간단 |

### LISP의 장점

1.**이동성**: EID 유지하며 위치 변경
2.**확장성**: Core 라우팅 테이블 감소
3.**Multihoming**: 여러 RLOC으로 중복 연결
4.**Traffic Engineering**: Priority/Weight로 제어

### LISP의 단점

1.**캡슐화 오버헤드**: LISP 헤더 추가
2.**MS/MR 의존성**: 중앙 장애점
3.**초기 지연**: 첫 패킷 시 매핑 조회

---

## 9. LISP in SD-Access

### Cisco SD-Access에서의 LISP

**SD-Access** 는 LISP를 Control Plane으로 사용합니다.

```
SD-Access 구조:
┌─────────────────────────────────────┐
│           Control Plane             │
│          (LISP MS/MR)              │
│      EID-RLOC 매핑 관리              │
└─────────────────────────────────────┘
             │
┌─────────────────────────────────────┐
│           Data Plane               │
│          (VXLAN)                   │
│       패킷 캡슐화/전송               │
└─────────────────────────────────────┘
```

### SD-Access에서 LISP 역할

-**호스트 추적**: MAC/IP 학습 시 LISP 등록
-**위치 확인**: 목적지 호스트의 위치 조회
-**모빌리티**: 호스트 이동 시 매핑 업데이트

---

## 10. 정리

### 핵심 개념 요약

| 개념 | 설명 |
|------|------|
|**EID**| 호스트 식별자 (내부 IP) |
|**RLOC**| 위치 정보 (외부 IP) |
|**ITR**| 패킷 송신 측 캡슐화 |
|**ETR**| 패킷 수신 측 디캡슐화 |
|**MS/MR**| 매핑 서버/리졸버 |

### LISP 동작 요약

1. ETR이 EID-RLOC 매핑을 MS에 등록
2. ITR이 목적지 EID의 RLOC을 MR에 조회
3. ETR이 Map-Reply로 응답
4. ITR이 LISP 캡슐화하여 RLOC으로 전송
5. ETR이 디캡슐화하여 목적지에 전달

### 시험 포인트

- EID vs RLOC 차이
- ITR, ETR, xTR 역할
- Map-Register, Map-Request, Map-Reply 흐름
- LISP의 이동성 지원 방식
- SD-Access에서 LISP의 역할

---

## 다음 장 예고

**다음 장에서는 VXLAN을 다룹니다.**

Virtual Extensible LAN을 통한 Data Center 네트워크 확장 기술을 학습합니다.
