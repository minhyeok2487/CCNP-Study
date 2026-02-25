# Chapter 28: QoS (Quality of Service)

이 장에서는 **QoS (Quality of Service)** 를 학습합니다. 네트워크 트래픽에 우선순위를 부여하여 중요한 애플리케이션의 품질을 보장하는 기술입니다.

화상 회의 중에 누군가 대용량 파일을 다운로드하면 통화가 끊기나요? QoS가 없으면 모든 트래픽이 동등하게 경쟁합니다. QoS를 적용하면 음성/화상은 항상 우선 처리되어 품질이 유지됩니다.

---

## 1. QoS 개요

### QoS가 필요한 이유

```
대역폭 경쟁:
[Voice] ─┬─ 100Mbps 링크 ─── [목적지]
[Video] ─┤
[Data]  ─┤
[Backup]─┘

QoS 없이:
모든 트래픽 동등 → Voice/Video 품질 저하

QoS 적용:
Voice/Video 우선 처리 → 품질 보장
```

### QoS의 목표

| 목표 | 설명 |
|------|------|
|**지연 (Latency)**| 패킷 전달 시간 최소화 |
|**지터 (Jitter)**| 지연 변동 최소화 |
|**손실 (Loss)**| 패킷 손실 최소화 |
|**대역폭**| 최소 대역폭 보장 |

### 트래픽 유형별 요구사항

| 트래픽 | 지연 | 지터 | 손실 | 대역폭 |
|--------|------|------|------|--------|
|**Voice**| < 150ms | < 30ms | < 1% | 낮음 |
|**Video**| < 300ms | < 50ms | < 1% | 높음 |
|**Interactive**| < 300ms | 관대 | 관대 | 중간 |
|**Bulk Data**| 관대 | 관대 | 낮음 | 높음 |

---

## 2. QoS 구성 요소

### QoS 모델

```
1. Classification: 트래픽 분류
2. Marking: 패킷에 표시
3. Queuing: 대기열 관리
4. Scheduling: 전송 순서 결정
5. Policing/Shaping: 속도 제어
```

### QoS 동작 순서

```
패킷 수신
    │
    ▼
[Classification] ─ 어떤 트래픽인가?
    │
    ▼
[Marking] ─ DSCP/CoS 표시
    │
    ▼
[Queuing] ─ 대기열에 배치
    │
    ▼
[Scheduling] ─ 전송 순서 결정
    │
    ▼
[Policing/Shaping] ─ 속도 제어
    │
    ▼
패킷 전송
```

---

## 3. Classification & Marking

### Classification (분류)

트래픽을 카테고리로 **분류** 합니다.

```
분류 기준:
- IP 주소 / 포트
- DSCP 값
- Application (NBAR)
- Interface
```

### DSCP (Differentiated Services Code Point)

```
IP 헤더 ToS 필드:
┌────────────────────────────────────┐
│ DSCP (6 bits) │ ECN (2 bits)      │
└────────────────────────────────────┘

DSCP 값 범위: 0-63
```

### 주요 DSCP 값

| DSCP | PHB | 용도 |
|------|-----|------|
|**46 (EF)**| Expedited Forwarding | Voice |
|**34 (AF41)**| Assured Forwarding | Video |
|**26 (AF31)**| Assured Forwarding | Signaling |
|**0 (BE)**| Best Effort | 기본 |

### CoS (Class of Service)

```
Layer 2 (802.1Q 태그):
┌────────────────────────────────┐
│ TPID │ PRI (3b) │ CFI │ VID   │
└────────────────────────────────┘
        CoS (0-7)

CoS 값:
7, 6: 네트워크 제어
5: Voice
4: Video
3: Voice Signaling
0-2: 데이터
```

### Marking 설정

```bash
! Class-map으로 분류
class-map match-any VOICE
 match dscp ef
 match protocol sip
class-map match-any VIDEO
 match dscp af41
 match protocol h323

! Policy-map으로 마킹
policy-map MARK-TRAFFIC
 class VOICE
  set dscp ef
 class VIDEO
  set dscp af41
 class class-default
  set dscp 0
```

---

## 4. Queuing

### 대기열 (Queue)

```
트래픽이 대기열에서 전송 대기:

          [Voice Queue] ─┐
          [Video Queue] ─┼─→ [Interface]
          [Data Queue]  ─┤
          [Default]     ─┘
```

### LLQ (Low Latency Queuing)

```
LLQ: Voice를 위한 우선순위 대기열

특징:
- 다른 대기열보다 항상 우선
- 지연에 민감한 트래픽용
- 대역폭 제한 가능 (Policing)

[Priority Queue] ─→ 먼저 처리!
[CBWFQ]         ─→ 나머지 분배
```

### CBWFQ (Class-Based Weighted Fair Queuing)

```
CBWFQ: 클래스별 대역폭 보장

예시:
Video: 30% 보장
Data: 20% 보장
Default: 나머지

bandwidth percent 30
bandwidth percent 20
bandwidth remaining
```

### 대기열 설정

```bash
policy-map QOS-POLICY
 class VOICE
  priority percent 10        ! LLQ
 class VIDEO
  bandwidth percent 30       ! CBWFQ
 class BUSINESS
  bandwidth percent 20
 class class-default
  bandwidth percent 40       ! 나머지
  fair-queue                 ! WFQ
```

---

## 5. Congestion Avoidance

### WRED (Weighted Random Early Detection)

```
혼잡 시 패킷 선제적 폐기:

대기열 임계값:
┌───────────────────────────────────┐
│ 최소 임계값 │ 최대 임계값 │ 전체 │
└───────────────────────────────────┘
      │              │
      │   무작위 폐기  │   전체 폐기
    폐기 안 함

낮은 우선순위 트래픽을 먼저 폐기
→ TCP 흐름 제어 유도
→ 혼잡 완화
```

### WRED 설정

```bash
policy-map QOS-POLICY
 class BUSINESS
  bandwidth percent 20
  random-detect dscp-based
  random-detect dscp 10 20 40 10
  ! DSCP 10: 최소 20, 최대 40, 확률 1/10
```

---

## 6. Policing & Shaping

### Policing (단속)

```
Policing: 속도 초과 시 즉시 폐기

트래픽 흐름:
───────────────────────────────────
              │
              │ 초과분 폐기/마킹
              ↓
─────────────────── 제한 속도

용도: 수신 방향, SLA 강제
```

### Shaping (정형)

```
Shaping: 속도 초과 시 버퍼링

트래픽 흐름:
───────────────────────────────────
       │  버퍼링   │
       │   ↓      │
─────────────────── 일정한 속도

용도: 송신 방향, 부드러운 트래픽
```

### Policing vs Shaping

| 특성 | Policing | Shaping |
|------|----------|---------|
| 초과 처리 | 폐기/마킹 | 버퍼링 |
| 지연 | 없음 | 추가됨 |
| 방향 | In/Out | Out만 |
| 용도 | 강제 | 조절 |

### Policing 설정

```bash
policy-map POLICE-TRAFFIC
 class GUEST
  police cir 10000000 bc 312500    ! 10Mbps
   conform-action transmit
   exceed-action drop
```

### Shaping 설정

```bash
policy-map SHAPE-TRAFFIC
 class ALL
  shape average 50000000           ! 50Mbps
```

---

## 7. MQC (Modular QoS CLI)

### MQC 구조

```
MQC 3단계:

1. Class-map: 분류
   class-map match-any VOICE
    match dscp ef

2. Policy-map: 정책
   policy-map QOS-POLICY
    class VOICE
     priority percent 10

3. Service-policy: 적용
   interface GigabitEthernet0/1
    service-policy output QOS-POLICY
```

### 완전한 QoS 설정 예시

```bash
! 1. Class-map 정의
class-map match-any VOICE
 match dscp ef
class-map match-any VIDEO
 match dscp af41
class-map match-any SIGNALING
 match dscp cs3

! 2. Policy-map 정의
policy-map QOS-OUT
 class VOICE
  priority percent 10
 class VIDEO
  bandwidth percent 30
 class SIGNALING
  bandwidth percent 5
 class class-default
  bandwidth percent 55
  random-detect

! 3. 인터페이스 적용
interface GigabitEthernet0/1
 service-policy output QOS-OUT
```

---

## 8. QoS 신뢰 경계

### Trust Boundary

```
신뢰 경계:
어디까지 수신 마킹을 신뢰할 것인가?

[PC] ─── [Access SW] ─── [Distribution] ─── [Core]
              │
         Trust Boundary
              │
    이전: 마킹 재설정
    이후: 마킹 신뢰
```

### Trust 설정

```bash
! 포트에서 CoS 신뢰
interface GigabitEthernet0/1
 mls qos trust cos

! 포트에서 DSCP 신뢰
interface GigabitEthernet0/2
 mls qos trust dscp

! 신뢰 안 함 (재마킹)
interface GigabitEthernet0/3
 no mls qos trust
```

---

## 9. Wireless QoS

### WMM (Wi-Fi Multimedia)

```
WMM 우선순위 (802.11e):

AC_VO (Voice): 최우선
AC_VI (Video): 높음
AC_BE (Best Effort): 기본
AC_BK (Background): 낮음
```

### WLC QoS 설정

```
WLAN QoS 프로파일:
- Platinum: Voice
- Gold: Video
- Silver: Best Effort
- Bronze: Background

WLAN별 QoS 레벨 지정
```

---

## 10. 정리

### QoS 구성 요소 요약

| 구성 요소 | 기능 |
|----------|------|
|**Classification**| 트래픽 분류 |
|**Marking**| DSCP/CoS 표시 |
|**Queuing**| 대기열 관리 |
|**Scheduling**| 전송 순서 |
|**Policing**| 속도 제한 (폐기) |
|**Shaping**| 속도 조절 (버퍼링) |

### DSCP 값 요약

| DSCP | PHB | 용도 |
|------|-----|------|
| 46 | EF | Voice |
| 34 | AF41 | Video |
| 26 | AF31 | Signaling |
| 0 | BE | Default |

### 시험 포인트

- DSCP 값과 PHB 매핑
- LLQ vs CBWFQ 차이
- Policing vs Shaping 차이
- MQC 구조 (class-map, policy-map, service-policy)
- Trust Boundary 개념
- WRED 동작 원리

---

## 다음 장 예고

**다음 장에서는 IP Services를 다룹니다.**

DHCP, NAT, NTP, SNMP 등 네트워크 서비스를 학습합니다.
