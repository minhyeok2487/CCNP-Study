# Chapter 5: VLAN Trunks and EtherChannel Bundles

이 장에서는 **VLAN Trunk** 와 **EtherChannel** 을 학습합니다. 여러 VLAN 트래픽을 하나의 링크로 전송하는 트렁킹과, 여러 물리 링크를 하나의 논리 링크로 묶는 EtherChannel을 다룹니다.

스위치 2대를 연결할 때 VLAN마다 케이블을 따로 연결할 수는 없습니다. 트렁크는 이 문제를 해결합니다. 또한, 대역폭이 부족하면 케이블을 더 연결하고 싶은데, STP가 하나를 차단해버립니다. EtherChannel은 이 문제를 해결합니다.

---

## 1. VLAN Trunk 개요

### Trunk란?

**Trunk** 는 여러 VLAN의 트래픽을 **하나의 링크** 로 전송하는 연결입니다.

```
Access Port:           Trunk Port:
VLAN 10만 전송         VLAN 10, 20, 30 모두 전송

[PC] ── [SW] ══════════ [SW] ── [PC]
 │       │    Trunk       │      │
VLAN 10  │                │   VLAN 10
         │                │
      Access            Access
```

### 왜 Trunk가 필요한가?

```
Trunk 없이:
[SW1] ─── VLAN 10 ─── [SW2]
[SW1] ─── VLAN 20 ─── [SW2]
[SW1] ─── VLAN 30 ─── [SW2]

VLAN마다 별도 케이블 필요! 비효율적!

Trunk 사용:
[SW1] ══════════════ [SW2]
       모든 VLAN
       하나의 케이블로!
```

### VLAN 태깅

Trunk에서 프레임이 어느 VLAN인지 구분하려면 **태그** 가 필요합니다.

```
원본 프레임:
[Dst MAC][Src MAC][Type][Data][FCS]

태깅된 프레임 (Trunk):
[Dst MAC][Src MAC][802.1Q Tag][Type][Data][FCS]
                      │
                   VLAN 정보 포함
```

---

## 2. 802.1Q 트렁킹

### 802.1Q 표준

**802.1Q** 는 IEEE 표준 트렁킹 프로토콜입니다. 현재 거의 모든 환경에서 사용됩니다.

### 802.1Q 태그 구조

```
802.1Q Tag (4 bytes):
┌─────────────────────────────────────────┐
│ TPID (2B) │ PRI (3b) │ CFI │ VID (12b) │
└─────────────────────────────────────────┘

TPID: 0x8100 (802.1Q 식별)
PRI: Priority (CoS, 0-7)
CFI: Canonical Format Indicator
VID: VLAN ID (0-4095)
```

**VID 12비트** 이므로 4096개의 VLAN을 표현할 수 있습니다 (0과 4095는 예약됨).

### Native VLAN

**Native VLAN** 은 **태그 없이** 전송되는 VLAN입니다.

```
Trunk 링크에서:
- VLAN 10 프레임 → 802.1Q 태그 추가
- VLAN 20 프레임 → 802.1Q 태그 추가
- Native VLAN (기본 1) 프레임 → 태그 없음!
```

**주의**: 양쪽 스위치의 Native VLAN이 일치해야 합니다!

```
불일치 시 문제:
[SW1: Native=1] ══════ [SW2: Native=10]
                Trunk

SW1이 VLAN 1 (태그 없음) 전송
→ SW2는 이것을 VLAN 10으로 처리!
→ VLAN 불일치 발생
```

### 802.1Q 설정

```bash
! Trunk 설정
Switch(config)# interface GigabitEthernet0/1
Switch(config-if)# switchport mode trunk
Switch(config-if)# switchport trunk encapsulation dot1q

! Native VLAN 변경
Switch(config-if)# switchport trunk native vlan 99

! 허용 VLAN 지정
Switch(config-if)# switchport trunk allowed vlan 10,20,30
Switch(config-if)# switchport trunk allowed vlan add 40
Switch(config-if)# switchport trunk allowed vlan remove 20
```

---

## 3. ISL (Inter-Switch Link)

### ISL 개요

**ISL** 은 Cisco 전용 트렁킹 프로토콜입니다. 현재는 거의 사용되지 않습니다.

```
ISL 캡슐화:
[ISL Header 26B][원본 프레임][ISL FCS 4B]

전체 프레임을 캡슐화!
```

### 802.1Q vs ISL

| 특성 | 802.1Q | ISL |
|------|--------|-----|
| 표준 | IEEE | Cisco 전용 |
| 태깅 방식 | 삽입 | 캡슐화 |
| 오버헤드 | 4 bytes | 30 bytes |
| Native VLAN | 지원 | 미지원 |
| 현재 상태 | 표준 사용 | 거의 사용 안 함 |

---

## 4. DTP (Dynamic Trunking Protocol)

### DTP란?

**DTP** 는 Cisco 스위치 간에 **자동으로 Trunk를 협상** 하는 프로토콜입니다.

### DTP 모드

| 모드 | 설명 | DTP 전송 |
|------|------|----------|
|**access**| Access 포트로 고정 | 안 함 |
|**trunk**| Trunk로 고정 | 함 |
|**dynamic desirable**| 적극적으로 Trunk 협상 | 함 |
|**dynamic auto**| 수동적으로 Trunk 협상 | 함 |
|**nonegotiate**| DTP 비활성화 | 안 함 |

### DTP 협상 결과

```
              | trunk | desirable | auto  | access |
--------------+-------+-----------+-------+--------+
trunk         | Trunk | Trunk     | Trunk | X 제한 |
desirable     | Trunk | Trunk     | Trunk | Access |
auto          | Trunk | Trunk     | Access| Access |
access        | X 제한 | Access   | Access| Access |
```

**dynamic auto + dynamic auto = Access**(둘 다 수동적이라 Trunk 안 됨!)

### DTP 설정

```bash
! Trunk 고정
Switch(config-if)# switchport mode trunk

! Access 고정
Switch(config-if)# switchport mode access

! Dynamic Desirable
Switch(config-if)# switchport mode dynamic desirable

! Dynamic Auto (기본값)
Switch(config-if)# switchport mode dynamic auto

! DTP 비활성화 (보안 권장)
Switch(config-if)# switchport mode trunk
Switch(config-if)# switchport nonegotiate
```

### DTP 보안 고려사항

DTP를 활성화하면 공격자가 Trunk를 협상하여 모든 VLAN에 접근할 수 있습니다.

```
보안 권장 설정:
- Access 포트: switchport mode access
- Trunk 포트: switchport mode trunk + switchport nonegotiate
- DTP 비활성화!
```

---

## 5. VLAN Pruning

### VTP Pruning

**VTP Pruning** 은 불필요한 VLAN 트래픽을 Trunk에서 제거합니다.

```
Pruning 없이:
[SW1] ══════════ [SW2] ══════════ [SW3]
      Trunk           Trunk
VLAN 10,20         VLAN 10,20      VLAN 10만 있음

VLAN 20 브로드캐스트가 SW3까지 전송됨 (낭비!)

Pruning 적용:
[SW1] ══════════ [SW2] ══════════ [SW3]
      VLAN 10,20       VLAN 10만
                       (20은 Pruned)

VLAN 20 트래픽이 SW3로 안 감!
```

### Manual Pruning

```bash
! 수동으로 허용 VLAN 제한
Switch(config-if)# switchport trunk allowed vlan 10,20,30

! 이 Trunk로는 VLAN 10,20,30만 전송됨
```

---

## 6. EtherChannel 개요

### EtherChannel이란?

**EtherChannel** 은 여러 물리 링크를 **하나의 논리 링크** 로 묶는 기술입니다.

```
EtherChannel 없이:
[SW1] ═══════ [SW2]    ← 1Gbps
      ═══════          ← STP가 Blocking!

총 대역폭: 1Gbps (하나가 차단됨)

EtherChannel 사용:
[SW1] ═══════ [SW2]
      ═══════          ← 둘 다 활성!
      ═══════

총 대역폭: 3Gbps (논리적으로 하나)
```

### EtherChannel 장점

1.**대역폭 증가**: 링크를 묶어서 대역폭 증가
2.**STP 우회**: 하나의 논리 링크로 보여서 STP 차단 없음
3.**부하 분산**: 트래픽이 여러 링크에 분산
4.**고가용성**: 일부 링크 장애 시에도 동작

### EtherChannel 제한

- 최대 **8개** 물리 포트를 하나로 묶을 수 있음
- 같은 **속도/Duplex** 의 포트만 묶을 수 있음
- 같은 **VLAN 설정** 이어야 함 (Access 또는 Trunk)

---

## 7. LACP (Link Aggregation Control Protocol)

### LACP 개요

**LACP** 는 **IEEE 802.3ad** 표준 프로토콜입니다. 동적으로 EtherChannel을 협상합니다.

### LACP 모드

| 모드 | 설명 | LACP 전송 |
|------|------|-----------|
|**on**| 강제 (협상 없음) | 안 함 |
|**active**| 적극적 협상 | 함 |
|**passive**| 수동적 협상 | 받으면 응답 |

### LACP 협상 결과

```
         | on      | active  | passive |
---------+---------+---------+---------+
on       | Channel | X 실패  | X 실패  |
active   | X 실패  | Channel | Channel |
passive  | X 실패  | Channel | X 실패  |
```

**passive + passive = 실패**(둘 다 수동적이라 협상 안 됨)
**on + active/passive = 실패**(on은 LACP 안 보내서 호환 안 됨)

### LACP 설정

```bash
! Port-Channel 인터페이스 생성 (자동으로 생성되기도 함)
Switch(config)# interface port-channel 1

! 물리 포트를 LACP로 묶기
Switch(config)# interface range GigabitEthernet0/1-2
Switch(config-if-range)# channel-group 1 mode active

! 상대방은 active 또는 passive
Switch(config)# interface range GigabitEthernet0/1-2
Switch(config-if-range)# channel-group 1 mode passive
```

### LACP 시스템 우선순위

LACP는 **System Priority** 를 사용하여 어느 스위치가 결정권을 가질지 정합니다.

```bash
! 시스템 우선순위 설정 (낮을수록 우선)
Switch(config)# lacp system-priority 100
```

### LACP 포트 우선순위

8개 이상의 포트를 묶으려 할 때, 어떤 포트를 활성화할지 결정합니다.

```bash
! 포트 우선순위 (낮을수록 우선)
Switch(config-if)# lacp port-priority 100
```

---

## 8. PAgP (Port Aggregation Protocol)

### PAgP 개요

**PAgP** 는 **Cisco 전용**EtherChannel 프로토콜입니다.

### PAgP 모드

| 모드 | 설명 | PAgP 전송 |
|------|------|-----------|
|**on**| 강제 (협상 없음) | 안 함 |
|**desirable**| 적극적 협상 | 함 |
|**auto**| 수동적 협상 | 받으면 응답 |

### PAgP 협상 결과

```
            | on      | desirable | auto    |
------------+---------+-----------+---------+
on          | Channel | X 실패    | X 실패  |
desirable   | X 실패  | Channel   | Channel |
auto        | X 실패  | Channel   | X 실패  |
```

DTP와 비슷한 패턴입니다.**auto + auto = 실패** 입니다.

### PAgP 설정

```bash
! PAgP Desirable 모드
Switch(config)# interface range GigabitEthernet0/1-2
Switch(config-if-range)# channel-group 1 mode desirable

! PAgP Auto 모드
Switch(config-if-range)# channel-group 1 mode auto
```

### LACP vs PAgP

| 특성 | LACP | PAgP |
|------|------|------|
| 표준 | IEEE 802.3ad | Cisco 전용 |
| 적극적 모드 | active | desirable |
| 수동적 모드 | passive | auto |
| 멀티벤더 | 지원 | 미지원 |
| 권장 | O | 레거시 |

**권장**: LACP 사용 (표준, 호환성)

---

## 9. EtherChannel 부하 분산

### 부하 분산 방식

EtherChannel은 해시를 사용하여 트래픽을 분산합니다.

| 방식 | 설명 |
|------|------|
|**src-mac**| 출발지 MAC 주소 기반 |
|**dst-mac**| 목적지 MAC 주소 기반 |
|**src-dst-mac**| 출발지+목적지 MAC |
|**src-ip**| 출발지 IP 주소 기반 |
|**dst-ip**| 목적지 IP 주소 기반 |
|**src-dst-ip**| 출발지+목적지 IP |
|**src-port**| 출발지 L4 포트 |
|**dst-port**| 목적지 L4 포트 |
|**src-dst-port**| 출발지+목적지 L4 포트 |

### 부하 분산 설정

```bash
! 부하 분산 방식 확인
Switch# show etherchannel load-balance

! 부하 분산 방식 변경
Switch(config)# port-channel load-balance src-dst-ip
```

### 부하 분산 고려사항

```
시나리오 1: 라우터 뒤에 많은 호스트
[Router] ═══════ [SW]
          EC      │
                 ├─ Host1
                 ├─ Host2
                 └─ Host3

라우터의 MAC은 하나 → src-mac 사용 시 분산 안 됨!
→ dst-mac 또는 IP 기반 권장

시나리오 2: 서버 앞에 많은 클라이언트
[Clients] ─── [SW] ═══════ [Server]
                     EC

서버 IP/MAC은 하나 → dst 기반 분산 안 됨!
→ src 기반 또는 src-dst 권장
```

---

## 10. EtherChannel 구성 확인

### 상태 확인 명령어

```bash
! EtherChannel 요약
Switch# show etherchannel summary
Group  Port-channel  Protocol    Ports
------+-------------+-----------+------------------
1      Po1(SU)       LACP        Gi0/1(P) Gi0/2(P)

플래그:
S = Layer 2
U = 사용 중 (Up)
P = Port-channel에 번들됨
I = 개별 (Individual, 번들 안 됨)

! 상세 정보
Switch# show etherchannel detail
Switch# show etherchannel port-channel

! LACP 정보
Switch# show lacp neighbor
Switch# show lacp internal

! PAgP 정보
Switch# show pagp neighbor
```

### 트러블슈팅

**증상: EtherChannel이 형성되지 않음**

```bash
! 포트 설정 확인
Switch# show running-config interface Gi0/1
Switch# show running-config interface Gi0/2

! 양쪽 포트의 설정이 동일해야 함:
- Speed/Duplex
- Trunk/Access 모드
- Native VLAN
- Allowed VLAN
```

**일반적인 문제:**
1. 모드 불일치 (on + active)
2. 속도/Duplex 불일치
3. VLAN 설정 불일치
4. STP 포트 상태 불일치

---

## 11. Layer 3 EtherChannel

### L3 EtherChannel

스위치 간 **라우팅** 을 위한 EtherChannel입니다.

```
Layer 2 EtherChannel:
[SW1] ═══════ [SW2]
    VLAN 트렁크

Layer 3 EtherChannel:
[L3 SW1] ═══════ [L3 SW2]
    IP 라우팅 (10.0.0.1/30 ←→ 10.0.0.2/30)
```

### L3 EtherChannel 설정

```bash
! 물리 포트를 L3로 변경
Switch(config)# interface range GigabitEthernet0/1-2
Switch(config-if-range)# no switchport
Switch(config-if-range)# channel-group 1 mode active

! Port-Channel에 IP 설정
Switch(config)# interface port-channel 1
Switch(config-if)# no switchport
Switch(config-if)# ip address 10.0.0.1 255.255.255.252
```

---

## 12. EtherChannel Guard

### EtherChannel Misconfiguration Guard

한쪽만 EtherChannel로 설정되면 STP 문제가 발생합니다.**EtherChannel Guard** 가 이를 감지합니다.

```
[SW1]           [SW2]
Po1 ═══════════ Gi0/1 (개별 포트)
    ═══════════ Gi0/2 (개별 포트)

SW1은 하나의 논리 포트로 인식
SW2는 두 개의 개별 포트로 인식
→ STP 루프 발생 가능!
```

### 설정

```bash
! EtherChannel Guard 활성화 (기본값)
Switch(config)# spanning-tree etherchannel guard misconfig
```

감지 시 포트가 **err-disabled** 상태가 됩니다.

---

## 13. 정리

### Trunk 요약

| 항목 | 설명 |
|------|------|
|**802.1Q**| IEEE 표준, 4바이트 태그 삽입 |
|**Native VLAN**| 태그 없이 전송되는 VLAN |
|**DTP**| 동적 Trunk 협상 (보안상 비활성화 권장) |
|**Allowed VLAN**| Trunk에서 허용할 VLAN 지정 |

### EtherChannel 요약

| 프로토콜 | 표준 | 적극적 | 수동적 |
|----------|------|--------|--------|
|**LACP**| IEEE 802.3ad | active | passive |
|**PAgP**| Cisco | desirable | auto |
|**Static**| - | on | on |

### 설정 체크리스트

**Trunk 설정:**
1. `switchport mode trunk`
2. `switchport trunk encapsulation dot1q`
3. `switchport trunk native vlan X`
4. `switchport trunk allowed vlan X,Y,Z`
5. `switchport nonegotiate` (보안)

**EtherChannel 설정:**
1. 모든 멤버 포트의 설정 동일 확인
2. `channel-group X mode active/passive` (LACP)
3. Port-Channel 인터페이스에서 Trunk/L3 설정

### 시험 포인트

- 802.1Q 태그 구조 (4바이트, VLAN ID 12비트)
- Native VLAN 불일치 문제
- DTP 모드별 협상 결과
- LACP vs PAgP 차이
- EtherChannel 부하 분산 방식
- on 모드의 호환성 문제

---

## 다음 장 예고

**다음 장에서는 EIGRP를 다룹니다.**

Cisco 전용 라우팅 프로토콜인 EIGRP의 동작 원리, 메트릭 계산, 그리고 고급 설정을 학습합니다.
