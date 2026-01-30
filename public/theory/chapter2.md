# Chapter 2: Spanning Tree Protocol (스패닝 트리 프로토콜)

이 장에서는 **STP(Spanning Tree Protocol)** 를 학습합니다. Layer 2 네트워크에서 **루프를 방지** 하는 핵심 프로토콜입니다. STP의 동작 원리, Root Bridge 선출, 포트 상태 전이, 그리고 RSTP까지 다룹니다.

"스위치 2대 연결했는데 네트워크가 마비됐어요"라는 상황을 경험해 보셨나요? 이는 대부분 STP 문제입니다. Layer 2 루프는 네트워크를 순식간에 마비시킬 수 있으므로, STP를 정확히 이해하는 것이 중요합니다.

---

## 1. Layer 2 루프의 문제

### 왜 루프가 발생하는가?

이중화를 위해 스위치 간에 여러 링크를 연결하면 루프가 만들어집니다.

```
      [SW1] ══════════ [SW2]
        ║                ║
        ║                ║
        ╚════════════════╝
```

### 루프의 영향

**1. 브로드캐스트 스톰**

```
PC가 ARP 브로드캐스트 전송
       │
       ▼
[SW1] → [SW2] → [SW1] → [SW2] → ... (무한 반복)
```

브로드캐스트 프레임이 루프를 따라 무한히 순환합니다. Ethernet에는 TTL이 없어서 프레임이 영원히 돌아다닙니다.

**2. MAC 테이블 불안정**

```
SW1이 PC의 MAC을 포트 1에서 학습
       ↓
같은 프레임이 포트 2로 돌아옴
       ↓
SW1이 MAC을 포트 2로 업데이트
       ↓
반복... (MAC Flapping)
```

**3. 다중 프레임 수신**

목적지 호스트가 동일한 프레임을 여러 번 받습니다.

### STP의 해결책

STP는 **논리적으로 루프를 차단** 합니다. 물리적으로는 여러 경로가 있지만, 하나의 경로만 활성화하고 나머지는 차단(Blocking)합니다.

```
      [SW1] ══════════ [SW2]
        ║      활성      ║
        ║                ║
        ╚═══ 차단 ═══════╝
```

---

## 2. STP 기본 동작

### STP 동작 순서

1.**Root Bridge 선출**: 네트워크에서 기준이 될 스위치 선택
2.**Root Port 선출**: 각 Non-Root 스위치에서 Root로 가는 최적 포트
3.**Designated Port 선출**: 각 세그먼트에서 Root로 가는 지정 포트
4.**Non-Designated Port 차단**: 나머지 포트는 Blocking

### Bridge ID

```
Bridge ID = Priority (16 bits) + MAC Address (48 bits)
          = 32768 (기본값) + 0011.2233.4455

Extended System ID 사용 시:
Bridge ID = Priority (4 bits) + VLAN ID (12 bits) + MAC Address
          = 32768 + VLAN 1 + 0011.2233.4455
```

**Bridge ID가 낮을수록**Root Bridge가 될 가능성이 높습니다.

### Root Bridge 선출

모든 스위치가 자신을 Root라고 주장하며 BPDU를 전송합니다. 더 낮은 Bridge ID를 가진 BPDU를 받으면 자신의 주장을 포기합니다.

```
초기 상태:
[SW1: BID 32768.0011.1111] "나는 Root"
[SW2: BID 32768.0022.2222] "나는 Root"
[SW3: BID 32768.0033.3333] "나는 Root"

BPDU 교환 후:
SW1의 BID가 가장 낮음 (MAC 주소 비교)
→ SW1이 Root Bridge
→ SW2, SW3는 Root가 아님
```

### BPDU (Bridge Protocol Data Unit)

```
BPDU 주요 필드:
- Root Bridge ID: 현재 알려진 Root의 BID
- Root Path Cost: Root까지의 비용
- Sender Bridge ID: 이 BPDU를 보낸 스위치의 BID
- Port ID: 이 BPDU를 보낸 포트
```

**Root Bridge만 BPDU를 생성** 하고, 다른 스위치들은 이를 받아서 수정 후 전달합니다.

---

## 3. 포트 역할 (Port Roles)

### Root Port (RP)

**Root Bridge로 가는 최적 경로** 의 포트입니다. Non-Root 스위치마다 하나씩만 있습니다.

**Root Port 선출 기준**(순서대로 비교):
1. 가장 낮은 Root Path Cost
2. 가장 낮은 Sender Bridge ID
3. 가장 낮은 Sender Port ID
4. 가장 낮은 로컬 Port ID

### Designated Port (DP)

각 **세그먼트(링크)에서 Root로 가는 지정 포트** 입니다. 해당 세그먼트로 BPDU를 전달합니다.

**Designated Port 선출 기준:**
1. 가장 낮은 Root Path Cost를 가진 스위치의 포트
2. 동점이면 가장 낮은 Bridge ID를 가진 스위치의 포트

### Non-Designated Port

Root Port도 Designated Port도 아닌 포트입니다.**Blocking 상태** 가 됩니다.

### 예시

```
        [SW1: Root Bridge]
       DP              DP
        │               │
        │   Cost 4      │   Cost 4
        │               │
       RP              RP
    [SW2]─────────────[SW3]
      DP              Blocking
```

SW2-SW3 구간:
- SW2 입장: Root까지 Cost 4
- SW3 입장: Root까지 Cost 4
- 동점이므로 Bridge ID 비교 → SW2가 낮음
- SW2 포트가 Designated, SW3 포트가 Blocking

---

## 4. Path Cost

**Path Cost** 는 Root까지의 비용입니다. 링크 대역폭에 따라 결정됩니다.

### 기본 Port Cost 값

| 대역폭 | STP Cost (802.1D-1998) | RSTP Cost (802.1D-2004) |
|--------|----------------------|------------------------|
| 10 Mbps | 100 | 2,000,000 |
| 100 Mbps | 19 | 200,000 |
| 1 Gbps | 4 | 20,000 |
| 10 Gbps | 2 | 2,000 |

### Path Cost 계산

```
        [Root: SW1]
            │
            │ Cost 4
            │
          [SW2] ─────── [SW3]
            │   Cost 4    │
            │             │
          [SW4]         [SW5]

SW4의 Root Path Cost:
- SW1 → SW2 → SW4: 4 + 4 = 8
```

### Cost 수동 설정

```bash
Switch(config)# interface GigabitEthernet0/1
Switch(config-if)# spanning-tree cost 10
```

---

## 5. 포트 상태 (Port States)

### STP 포트 상태 전이

```
[Disabled] → [Blocking] → [Listening] → [Learning] → [Forwarding]
                  │              │            │
                  └── 30-50초 ───┴──── 30초 ──┘
```

| 상태 | BPDU 수신 | MAC 학습 | 데이터 전송 | 지속 시간 |
|------|----------|---------|-----------|----------|
|**Blocking**| O | X | X | Max Age (20초) |
|**Listening**| O | X | X | Forward Delay (15초) |
|**Learning**| O | O | X | Forward Delay (15초) |
|**Forwarding**| O | O | O | 안정 상태 |
|**Disabled**| X | X | X | 관리자 비활성화 |

### STP 타이머

| 타이머 | 기본값 | 설명 |
|--------|-------|------|
|**Hello**| 2초 | Root가 BPDU 전송 간격 |
|**Max Age**| 20초 | BPDU 유효 시간 |
|**Forward Delay**| 15초 | Listening/Learning 상태 유지 시간 |

**수렴 시간:**
- Blocking → Forwarding: 약 30-50초
- 이 긴 수렴 시간이 STP의 단점입니다.

---

## 6. STP 토폴로지 변경

### TCN (Topology Change Notification)

토폴로지가 변경되면 (링크 다운, 포트 상태 변경 등) TCN BPDU가 Root까지 전달됩니다.

```
[토폴로지 변경 감지]
        │
        ▼
[TCN BPDU를 Root 방향으로 전송]
        │
        ▼
[Root가 TCA로 응답]
        │
        ▼
[Root가 TC 플래그 설정된 BPDU 전송]
        │
        ▼
[모든 스위치가 MAC 테이블 빠르게 노화 (15초)]
```

### TC (Topology Change)

Root가 TC 플래그를 설정하면, 모든 스위치가 MAC 테이블 노화 시간을 Forward Delay(15초)로 줄입니다. 빠르게 새로운 토폴로지에 적응하기 위함입니다.

---

## 7. RSTP (Rapid Spanning Tree Protocol)

### RSTP의 등장 배경

기존 STP의 30-50초 수렴 시간은 현대 네트워크에서 너무 깁니다.**RSTP (802.1w)** 는 수초 내에 수렴합니다.

### RSTP vs STP 비교

| 특성 | STP (802.1D) | RSTP (802.1w) |
|------|-------------|---------------|
| 수렴 시간 | 30-50초 | 수초 이내 |
| 포트 상태 | 5개 | 3개 |
| BPDU 처리 | Root만 생성 | 모든 스위치 생성 |
| 장애 감지 | Max Age (20초) | Hello 3회 (6초) |
| 호환성 | - | STP와 호환 |

### RSTP 포트 상태

| STP | RSTP | 동작 |
|-----|------|------|
| Disabled | Discarding | 데이터 전송 안 함 |
| Blocking | Discarding | 데이터 전송 안 함 |
| Listening | Discarding | 데이터 전송 안 함 |
| Learning | Learning | MAC 학습 |
| Forwarding | Forwarding | 데이터 전송 |

### RSTP 포트 역할

| 역할 | 설명 |
|------|------|
|**Root Port**| Root로 가는 최적 포트 |
|**Designated Port**| 세그먼트의 지정 포트 |
|**Alternate Port**| Root Port의 백업 (Blocking) |
|**Backup Port**| Designated Port의 백업 (Blocking) |

### Alternate Port의 빠른 수렴

```
        [Root]
       /      \
      /        \
   [SW2]───────[SW3]
    RP          Alt (Blocking)
```

SW3의 Alternate Port는 **Root Port의 즉시 대체** 가 가능합니다.

SW2 쪽 링크가 다운되면:
- 기존 STP: Blocking → Listening → Learning → Forwarding (30초)
- RSTP: Alternate Port가 즉시 Root Port로 전환 (수초)

### RSTP 동기화 (Proposal/Agreement)

```
[Designated Port]  ←─ Proposal ─→  [Root Port]
                   ←─ Agreement ─
```

Proposal/Agreement 메커니즘으로 포트를 빠르게 Forwarding으로 전환합니다.

---

## 8. STP 설정

### Root Bridge 설정

```bash
! Priority 직접 설정
Switch(config)# spanning-tree vlan 1 priority 4096

! Root Primary (자동으로 낮은 Priority 설정)
Switch(config)# spanning-tree vlan 1 root primary

! Root Secondary (Primary보다 조금 높게)
Switch(config)# spanning-tree vlan 1 root secondary
```

### STP 모드 변경

```bash
! PVST+ (기본값, Cisco)
Switch(config)# spanning-tree mode pvst

! Rapid PVST+
Switch(config)# spanning-tree mode rapid-pvst

! MST
Switch(config)# spanning-tree mode mst
```

### STP 확인 명령어

```bash
! STP 상태 확인
Switch# show spanning-tree
Switch# show spanning-tree vlan 1
Switch# show spanning-tree summary

! Root 정보
Switch# show spanning-tree root

! 특정 인터페이스
Switch# show spanning-tree interface GigabitEthernet0/1 detail
```

---

## 9. 정리

### 핵심 개념 요약

| 개념 | 설명 |
|------|------|
|**Root Bridge**| STP의 기준점, 가장 낮은 Bridge ID |
|**Root Port**| Root로 가는 최적 포트 |
|**Designated Port**| 세그먼트의 지정 포트 |
|**Path Cost**| Root까지의 비용 |
|**BPDU**| STP 정보 교환 프레임 |
|**TCN**| 토폴로지 변경 알림 |

### STP vs RSTP

| 항목 | STP | RSTP |
|------|-----|------|
| 수렴 시간 | 30-50초 | 수초 |
| 포트 역할 | RP, DP | RP, DP, Alt, Backup |
| 권장 | 레거시 | 현대 네트워크 |

### 시험 포인트

- Root Bridge 선출 기준
- 포트 역할 결정 순서
- STP 포트 상태 전이 및 타이머
- RSTP의 개선점
- Alternate/Backup Port의 역할

---

## 다음 장 예고

**다음 장에서는 Advanced STP Tuning을 다룹니다.**

PortFast, BPDU Guard, Root Guard 등 STP 최적화 및 보안 기능을 학습합니다.
