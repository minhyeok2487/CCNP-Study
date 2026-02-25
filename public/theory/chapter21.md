# Chapter 21: SD-Access

이 장에서는 **Cisco SD-Access** 를 학습합니다. 캠퍼스 네트워크를 자동화하고 정책 기반으로 관리하는 Cisco의 통합 솔루션입니다.

VLAN 기반 네트워크는 수십 년간 잘 작동했지만, 이제는 한계에 도달했습니다. 수천 대의 장비를 일관성 있게 관리하고, 사용자 위치와 관계없이 동일한 정책을 적용하는 것이 SD-Access의 목표입니다.

---

## 1. SD-Access 개요

### SD-Access란?

**SD-Access** 는 Cisco의 **Intent-Based Networking (IBN)** 솔루션입니다.

```
전통적 네트워크:
- VLAN 기반 세분화
- 수동 설정
- 장치 중심

SD-Access:
- 정책 기반 세분화
- 자동화
- 사용자/앱 중심
```

### SD-Access 장점

| 장점 | 설명 |
|------|------|
|**자동화**| DNA Center로 자동 배포 |
|**일관성**| 동일한 정책 전사 적용 |
|**가시성**| 사용자/앱 트래픽 모니터링 |
|**보안**| 마이크로세분화 |
|**이동성**| 위치 독립적 정책 |

---

## 2. SD-Access 아키텍처

### 구성 요소

```
┌─────────────────────────────────────────┐
│           [DNA Center]                   │
│        관리 및 자동화 플랫폼              │
└────────────────┬────────────────────────┘
                 │
┌────────────────┼────────────────────────┐
│           Fabric Domain                  │
│                                          │
│  [Control Plane Node]                    │
│      LISP Map Server/Resolver            │
│                                          │
│  [Border Node]                           │
│      외부 네트워크 연결                   │
│                                          │
│  [Edge Node]  [Edge Node]  [Edge Node]   │
│      사용자/장치 연결                     │
└──────────────────────────────────────────┘
```

### Fabric 역할

| 역할 | 설명 |
|------|------|
|**Control Plane Node**| LISP MS/MR, 호스트 추적 |
|**Border Node**| 외부 연결, 정책 경계 |
|**Edge Node**| 사용자/장치 연결 |
|**Intermediate Node**| 트래픽 전달만 |

---

## 3. SD-Access 기술 스택

### Control Plane: LISP

**LISP** 는 호스트 위치를 추적하고 매핑합니다.

```
호스트가 Edge Node에 연결:
1. Edge Node가 MAC/IP 학습
2. LISP Map-Register로 Control Plane에 등록
3. 다른 Edge Node가 Map-Request로 조회
4. Control Plane이 위치 정보 응답
```

### Data Plane: VXLAN

**VXLAN** 은 패킷을 캡슐화하여 Fabric 내 전송합니다.

```
[호스트 A] → [Edge A] ═══ VXLAN ═══ [Edge B] → [호스트 B]
              VTEP                   VTEP
         VNI로 세그먼트 구분
```

### Policy Plane: TrustSec (SGT)

**SGT (Security Group Tag)** 로 정책을 적용합니다.

```
호스트 인증 시 SGT 할당:
Employee: SGT 10
Guest: SGT 20
IoT: SGT 30

SGACL로 트래픽 제어:
SGT 10 → SGT 10: Permit
SGT 20 → SGT 10: Deny
```

---

## 4. DNA Center

### DNA Center란?

**DNA Center** 는 SD-Access의 **관리 및 자동화 플랫폼** 입니다.

```
DNA Center 기능:
┌─────────────────────────────────────────┐
│ Design: 네트워크 설계, 계층 정의         │
├─────────────────────────────────────────┤
│ Policy: 접근 정책, 세그먼테이션          │
├─────────────────────────────────────────┤
│ Provision: 자동 배포, 설정 푸시          │
├─────────────────────────────────────────┤
│ Assurance: 모니터링, 문제 해결           │
└─────────────────────────────────────────┘
```

### DNA Center 워크플로우

```
1. Design
   - 사이트 계층 정의
   - 네트워크 설정 템플릿
   - IP 주소 풀

2. Policy
   - 가상 네트워크 (VN) 정의
   - 확장 그룹 (SGT) 정의
   - 접근 정책 생성

3. Provision
   - 장비 검색
   - 사이트에 할당
   - Fabric 역할 지정

4. Assurance
   - 상태 모니터링
   - 이슈 탐지
   - 문제 해결 가이드
```

---

## 5. Virtual Network (VN)

### VN이란?

**Virtual Network** 는 SD-Access에서 **논리적으로 분리된 네트워크** 입니다.

```
전통적: VLAN으로 분리
SD-Access: VN으로 분리

VN = VRF + VNI 조합
```

### VN 예시

```
Campus_VN:
- 직원용 네트워크
- VRF: Campus
- VNI: 8192

Guest_VN:
- 게스트용 네트워크
- VRF: Guest
- VNI: 8193

IoT_VN:
- IoT 장치용
- VRF: IoT
- VNI: 8194
```

### Macro-Segmentation vs Micro-Segmentation

```
Macro-Segmentation: VN으로 큰 그룹 분리
└─ Campus VN / Guest VN / IoT VN

Micro-Segmentation: SGT로 세밀한 제어
└─ Campus VN 내에서:
   Employee(SGT 10) → Server(SGT 20): Permit
   Contractor(SGT 15) → Server(SGT 20): Deny
```

---

## 6. Scalable Group

### Scalable Group이란?

**Scalable Group (SG)** 은 **같은 보안 정책** 을 공유하는 그룹입니다.

```
Scalable Group 예시:
┌──────────────────┬─────────────────┐
│ Group Name       │ SGT             │
├──────────────────┼─────────────────┤
│ Employees        │ 10              │
│ Contractors      │ 15              │
│ Guests           │ 20              │
│ Servers          │ 30              │
│ IoT Devices      │ 40              │
└──────────────────┴─────────────────┘
```

### SGT 할당

```
1. 정적 할당
   - IP-to-SGT 매핑
   - VLAN-to-SGT 매핑

2. 동적 할당
   - ISE 인증 시 SGT 부여
   - Authorization Policy 기반
```

### SGACL (Scalable Group ACL)

```
Group-Based Policy:
┌────────────────────────────────────────┐
│ Source SG │ Destination SG │ Action    │
├───────────┼────────────────┼───────────┤
│ Employees │ Servers        │ Permit    │
│ Guests    │ Servers        │ Deny      │
│ Guests    │ Internet       │ Permit    │
│ IoT       │ IoT Controller │ Permit    │
│ IoT       │ Everything     │ Deny      │
└────────────────────────────────────────┘
```

---

## 7. Fabric 확장

### Extended Node

**Extended Node** 는 기존 스위치를 Fabric에 연결합니다.

```
[Fabric Edge] ─── [Extended Node] ─── [호스트]
                       │
              레거시 스위치를
              Fabric에 연결
```

### Fabric in a Box (FiaB)

소규모 사이트를 위한 단일 장비 Fabric입니다.

```
[Fabric in a Box]
- Control Plane
- Border
- Edge
모두 하나의 장비에서!
```

### SD-Access Transit

여러 Fabric Domain을 연결합니다.

```
[Fabric A] ═══ [Transit] ═══ [Fabric B]
               │
         IP Transit 또는
         SD-Access Transit
```

---

## 8. SD-Access 배포 모델

### Greenfield vs Brownfield

```
Greenfield (새 구축):
- 새로운 장비
- 처음부터 SD-Access 설계
- 깔끔한 구현

Brownfield (기존 환경):
- 기존 네트워크 존재
- 점진적 마이그레이션
- 공존 기간 필요
```

### 배포 단계

```
Phase 1: Pilot
- 소규모 영역 테스트
- 기능 검증

Phase 2: Limited Production
- 일부 사이트 확장
- 운영 경험 축적

Phase 3: Full Production
- 전사 확대
- 레거시 마이그레이션 완료
```

---

## 9. SD-Access와 ISE 통합

### ISE 역할

```
ISE in SD-Access:
┌─────────────────────────────────────────┐
│              [ISE]                       │
│                                          │
│  - 802.1X/MAB 인증                       │
│  - SGT 할당                              │
│  - SGACL 정책 배포                       │
│  - Profiling                            │
│  - Guest Portal                         │
└─────────────────────────────────────────┘
            │
            ▼
      [DNA Center]
            │
            ▼
      [Fabric Nodes]
```

### 인증 흐름

```
1. 호스트가 Edge Node에 연결
2. Edge Node가 ISE로 RADIUS 요청
3. ISE가 인증 및 SGT 결정
4. Edge Node가 SGT 적용
5. LISP로 호스트 위치 등록
```

---

## 10. 정리

### SD-Access 기술 요약

| 기능 | 기술 |
|------|------|
|**Control Plane**| LISP |
|**Data Plane**| VXLAN |
|**Policy Plane**| TrustSec (SGT) |
|**관리**| DNA Center |
|**인증**| ISE |

### Fabric 역할 요약

| 역할 | 기능 |
|------|------|
|**Control Plane Node**| LISP MS/MR |
|**Border Node**| 외부 연결 |
|**Edge Node**| 사용자 연결 |

### 시험 포인트

- SD-Access의 세 가지 Plane
- LISP, VXLAN, SGT 역할
- DNA Center 기능 (Design, Policy, Provision, Assurance)
- Virtual Network vs Scalable Group
- Macro vs Micro Segmentation

---

## 다음 장 예고

**다음 장에서는 SD-WAN을 다룹니다.**

Cisco의 Software-Defined WAN 솔루션을 학습합니다.
