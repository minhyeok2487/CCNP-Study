# Chapter 4: Multiple Spanning Tree Protocol (MST)

이 장에서는 **MST (Multiple Spanning Tree Protocol, 802.1s)** 를 학습합니다. 여러 VLAN을 **하나의 STP 인스턴스로 그룹화** 하여 효율성을 높이는 프로토콜입니다.

PVST+에서 VLAN이 100개면 STP 인스턴스도 100개입니다. CPU 부하가 높아지고 관리가 복잡해집니다. MST는 이 문제를 해결합니다.

---

## 1. MST의 필요성

### PVST+의 문제

```
PVST+:
VLAN 1   → STP Instance 1
VLAN 2   → STP Instance 2
VLAN 3   → STP Instance 3
...
VLAN 100 → STP Instance 100

100개의 BPDU, 100개의 STP 계산!
```

**문제점:**
- CPU 부하 증가
- BPDU 트래픽 증가
- 관리 복잡성

### CST (Common Spanning Tree)의 문제

802.1Q 표준의 CST는 **모든 VLAN에 하나의 STP** 만 사용합니다.

```
CST:
VLAN 1-100 → STP Instance 1 (단 하나)
```

**문제점:**
- VLAN별 부하 분산 불가
- 모든 VLAN이 같은 경로 사용

### MST의 해결책

MST는 **여러 VLAN을 그룹화** 하여 적절한 수의 인스턴스를 사용합니다.

```
MST:
VLAN 1-50   → MST Instance 1
VLAN 51-100 → MST Instance 2

2개의 인스턴스로 부하 분산 가능!
```

---

## 2. MST 기본 개념

### MST Region

**MST Region** 은 같은 MST 설정을 공유하는 스위치들의 그룹입니다.

**Region 동일 조건:**
- 같은 **Configuration Name**
- 같은 **Revision Number**
- 같은 **VLAN-to-Instance 매핑**

```
[Region A]                    [Region B]
┌─────────────────────┐      ┌─────────────────────┐
│ Name: REGION-A      │      │ Name: REGION-B      │
│ Revision: 1         │      │ Revision: 1         │
│ VLAN 1-50 → IST 1   │      │ VLAN 1-100 → IST 1  │
│ VLAN 51-100 → IST 2 │      │                     │
│                     │      │                     │
│ [SW1]  [SW2]  [SW3] │ ──── │ [SW4]  [SW5]        │
└─────────────────────┘      └─────────────────────┘
```

### IST (Internal Spanning Tree)

**IST (Instance 0)** 는 MST Region 내의 기본 인스턴스입니다.

- Region 외부와의 통신을 담당
- 모든 MST Region에 자동으로 존재
- MSTI(MST Instance)를 위한 토폴로지 제공

### MSTI (MST Instance)

**MSTI** 는 사용자가 정의하는 추가 인스턴스입니다 (1-4094).

```
IST (Instance 0): 기본, Region 간 통신
MSTI 1: VLAN 1-50
MSTI 2: VLAN 51-100
```

---

## 3. MST Region 간 통신

### CST (Common Spanning Tree)

MST Region들은 외부에서 보면 **하나의 가상 브리지** 처럼 동작합니다.

```
외부 관점:
[Region A] ──── [Region B] ──── [PVST+ 스위치]
   │                │                │
하나의 브리지    하나의 브리지    일반 스위치
```

### Boundary Port

**Boundary Port** 는 다른 Region이나 다른 STP 모드(PVST+, CST)와 연결되는 포트입니다.

IST가 Boundary Port의 역할을 결정합니다.

### CIST (Common and Internal Spanning Tree)

**CIST = IST + CST**

전체 네트워크의 루프 방지를 담당합니다.

---

## 4. MST 설정

### 기본 설정

```bash
Switch(config)# spanning-tree mode mst

Switch(config)# spanning-tree mst configuration
Switch(config-mst)# name REGION-1
Switch(config-mst)# revision 1
Switch(config-mst)# instance 1 vlan 1-50
Switch(config-mst)# instance 2 vlan 51-100
Switch(config-mst)# exit
```

### 설정 확인

```bash
Switch# show spanning-tree mst configuration
Name      [REGION-1]
Revision  1     Instances configured 3

Instance  Vlans mapped
--------  -------------
0         101-4094
1         1-50
2         51-100

Switch# show spanning-tree mst
```

### Root Bridge 설정

```bash
! Instance 1의 Root
Switch(config)# spanning-tree mst 1 priority 4096

! Instance 2의 Root
Switch(config)# spanning-tree mst 2 priority 4096
```

### 부하 분산 예시

```
[SW1: Root for MSTI 1]          [SW2: Root for MSTI 2]
       │                               │
       │ VLAN 1-50                     │ VLAN 51-100
       │                               │
       └───────────[SW3]───────────────┘
```

SW1을 MSTI 1의 Root, SW2를 MSTI 2의 Root로 설정하면 트래픽이 분산됩니다.

---

## 5. MST와 PVST+ 상호 운용

### PVST Simulation

MST Region이 PVST+ 스위치와 연결되면 **PVST Simulation** 이 동작합니다.

```
[MST Region] ──Boundary Port── [PVST+ 스위치]
```

MST는 각 VLAN에 대해 별도의 BPDU를 생성하여 PVST+와 호환성을 유지합니다.

### PVST Simulation 실패

PVST+ 스위치가 특정 VLAN에서 Root가 되면 문제가 발생할 수 있습니다.

```bash
%SPANTREE-2-PVSTSIM_FAIL: PVST Simulation failed for port Gi0/1
```

이 경우 해당 포트가 Blocking됩니다.

---

## 6. MST 튜닝

### Port Cost 설정

```bash
Switch(config)# interface GigabitEthernet0/1
Switch(config-if)# spanning-tree mst 1 cost 10
Switch(config-if)# spanning-tree mst 2 cost 20
```

### Port Priority 설정

```bash
Switch(config-if)# spanning-tree mst 1 port-priority 64
```

### Hello Time (IST만)

```bash
Switch(config)# spanning-tree mst hello-time 1
```

### Max Hop Count

MST에서는 Max Age 대신 **Hop Count** 를 사용합니다.

```bash
Switch(config)# spanning-tree mst max-hops 10    ! 기본값 20
```

---

## 7. MST 설계 고려사항

### Region 설계

**1. 단순하게 유지**

가능하면 전체 네트워크를 하나의 Region으로 설계합니다.

**2. Instance 수 최소화**

필요한 만큼만 Instance를 생성합니다. 보통 2-4개면 충분합니다.

**3. 일관된 설정**

Region 내 모든 스위치의 MST 설정이 동일해야 합니다.

### VLAN 매핑 설계

```
예시:
Instance 0 (IST): 관리 VLAN, 미할당 VLAN
Instance 1: 사용자 VLAN (1-100)
Instance 2: 서버 VLAN (101-200)
```

### Root Bridge 배치

```
[Core SW1]              [Core SW2]
MSTI 1 Root             MSTI 2 Root
    │                       │
    └───────[Distribution]──┘
                  │
              [Access]
```

---

## 8. MST 트러블슈팅

### Region 불일치

**증상:** 스위치가 같은 Region에 있어야 하는데 Boundary Port로 인식

**확인:**
```bash
Switch# show spanning-tree mst configuration
! Name, Revision, VLAN 매핑이 모든 스위치에서 동일한지 확인
```

### Root 불일치

**증상:** 예상치 못한 스위치가 Root

**확인:**
```bash
Switch# show spanning-tree mst 1
! Root ID 확인
```

### PVST Simulation 실패

**원인:**PVST+ 측에서 Root가 되려고 함

**해결:**
- MST 측 Priority를 낮게 설정
- 또는 PVST+ 스위치도 MST로 변경

---

## 9. MST vs PVST+ vs CST 비교

| 특성 | PVST+ | MST | CST |
|------|-------|-----|-----|
| 인스턴스 수 | VLAN 수만큼 | 사용자 정의 | 1개 |
| VLAN별 부하분산 | O | O | X |
| CPU 부하 | 높음 | 낮음 | 낮음 |
| 표준 | Cisco 전용 | IEEE 802.1s | IEEE 802.1Q |
| 복잡성 | 낮음 | 중간 | 낮음 |

---

## 10. 정리

### 핵심 개념 요약

| 개념 | 설명 |
|------|------|
|**MST Region**| 같은 MST 설정을 공유하는 스위치 그룹 |
|**IST (Instance 0)**| 기본 인스턴스, Region 간 통신 |
|**MSTI**| 사용자 정의 인스턴스 (1-4094) |
|**CIST**| IST + CST, 전체 루프 방지 |
|**Boundary Port**| 다른 Region/STP 모드와 연결 |

### 설정 체크리스트

1. `spanning-tree mode mst` 설정
2. MST Configuration 모드에서:
   - Name 설정
   - Revision 설정
   - VLAN-to-Instance 매핑
3. Root Bridge 설정
4. 모든 스위치에서 동일한 설정 확인

### 시험 포인트

- MST Region 동일 조건 (Name, Revision, Mapping)
- IST vs MSTI 차이
- MST와 PVST+ 상호 운용
- Instance 0의 역할

---

## 다음 장 예고

**다음 장에서는 VLAN Trunks and EtherChannel Bundles를 다룹니다.**

802.1Q 트렁킹, DTP, 그리고 LACP/PAgP를 이용한 EtherChannel 구성을 학습합니다.
