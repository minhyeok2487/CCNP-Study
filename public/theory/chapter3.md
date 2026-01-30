# Chapter 3: Advanced STP Tuning (STP 고급 튜닝)

이 장에서는 STP의 **최적화 및 보안 기능** 을 학습합니다. PortFast, BPDU Guard, Root Guard, Loop Guard 등 실무에서 반드시 적용해야 하는 기능들을 다룹니다.

기본 STP만으로는 부족합니다. 사용자 PC가 연결된 포트에서 30초를 기다리게 할 수는 없고, 잘못된 스위치가 Root가 되는 것을 방지해야 합니다. 이러한 문제들을 해결하는 것이 STP 튜닝입니다.

---

## 1. PortFast

### 문제 상황

사용자가 PC를 연결하면 STP 때문에 **30-50초를 기다려야** 합니다.

```
PC 연결 → Blocking(20초) → Listening(15초) → Learning(15초) → Forwarding
                                총 50초
```

DHCP 타임아웃, 로그인 지연 등의 문제가 발생합니다.

### PortFast 동작

**PortFast** 는 Access 포트에서 STP 상태 전이를 건너뛰고 **즉시 Forwarding** 상태가 됩니다.

```
PC 연결 → 즉시 Forwarding!
```

### 설정

```bash
! 개별 포트에 설정
Switch(config)# interface GigabitEthernet0/1
Switch(config-if)# spanning-tree portfast

! 모든 Access 포트에 기본 적용
Switch(config)# spanning-tree portfast default
```

### 주의사항

PortFast 포트에 **스위치를 연결하면 루프가 발생 ** 할 수 있습니다. 반드시**End Device(PC, 서버 등)** 만 연결해야 합니다.

---

## 2. BPDU Guard

### 문제 상황

PortFast 포트에 스위치가 연결되면 루프가 발생합니다. 또한, 공격자가 악의적인 BPDU를 전송할 수 있습니다.

### BPDU Guard 동작

**BPDU Guard** 는 PortFast 포트에서 BPDU를 수신하면 **포트를 err-disabled** 상태로 만듭니다.

```
BPDU 수신 → 포트 Shutdown (err-disabled)
```

### 설정

```bash
! 개별 포트에 설정
Switch(config)# interface GigabitEthernet0/1
Switch(config-if)# spanning-tree bpduguard enable

! PortFast 포트에 자동 적용
Switch(config)# spanning-tree portfast bpduguard default
```

### err-disabled 복구

```bash
! 수동 복구
Switch(config)# interface GigabitEthernet0/1
Switch(config-if)# shutdown
Switch(config-if)# no shutdown

! 자동 복구 설정
Switch(config)# errdisable recovery cause bpduguard
Switch(config)# errdisable recovery interval 300    ! 300초 후 자동 복구
```

---

## 3. Root Guard

### 문제 상황

잘못된 스위치가 Root Bridge가 되면 **트래픽 경로가 비효율** 적이 됩니다. 또는 공격자가 낮은 Priority의 BPDU를 전송하여 Root를 탈취할 수 있습니다.

```
설계: [Core SW]가 Root
        │
      [Dist SW]
        │
      [Access SW]

문제: Access SW에 연결된 장비가 더 낮은 BID로 Root 되버림!
```

### Root Guard 동작

**Root Guard** 는 해당 포트에서 **Superior BPDU를 수신하면 포트를 Root-Inconsistent** 상태로 만듭니다.

```
Superior BPDU 수신 → Root-Inconsistent (Blocking과 유사)
Superior BPDU 중단 → 정상 복구
```

### 설정

```bash
Switch(config)# interface GigabitEthernet0/1
Switch(config-if)# spanning-tree guard root
```

### Root Guard 적용 위치

**Designated Port** 에 설정합니다. 해당 포트 너머에서 Root가 나타나면 안 되는 곳입니다.

```
        [Root: Core SW]
       /              \
    [Dist1]         [Dist2]
       │                │
    [Access1]       [Access2]
       │                │
    ↓Root Guard      ↓Root Guard
   (사용자 포트)     (사용자 포트)
```

---

## 4. Loop Guard

### 문제 상황

**단방향 링크 장애** 로 BPDU를 수신하지 못하면, Blocking 포트가 Forwarding으로 전환되어 루프가 발생합니다.

```
정상 상태:
[SW1] ──BPDU──→ [SW2]
      ←─BPDU──

단방향 장애:
[SW1] ──BPDU──→ [SW2]
      ←─X────      ← 수신 불가

SW2의 포트가 Max Age 만료 후 Forwarding으로 전환 → 루프!
```

### Loop Guard 동작

**Loop Guard** 는 BPDU를 수신하지 못하면 **Loop-Inconsistent** 상태로 만들어 Forwarding을 방지합니다.

```
BPDU 수신 중단 → Loop-Inconsistent (Blocking 유지)
BPDU 수신 재개 → 정상 복구
```

### 설정

```bash
! 개별 포트
Switch(config)# interface GigabitEthernet0/1
Switch(config-if)# spanning-tree guard loop

! 전역 설정
Switch(config)# spanning-tree loopguard default
```

### Loop Guard vs Root Guard

| 기능 | 목적 | 적용 포트 |
|------|------|----------|
|**Root Guard**| 잘못된 Root 방지 | Designated Port |
|**Loop Guard**| 단방향 장애로 인한 루프 방지 | Root/Alternate Port |

**동시 사용 불가**: 같은 포트에 둘 다 설정할 수 없습니다.

---

## 5. BPDU Filter

### 동작

**BPDU Filter** 는 BPDU를 **송신/수신하지 않습니다**. 해당 포트에서 STP가 완전히 비활성화됩니다.

### 두 가지 모드

**1. 전역 설정 (권장)**
```bash
Switch(config)# spanning-tree portfast bpdufilter default
```
- PortFast 포트에만 적용
- BPDU 수신 시 PortFast/BPDU Filter 비활성화되고 정상 STP 동작

**2. 인터페이스 설정 (위험)**
```bash
Switch(config-if)# spanning-tree bpdufilter enable
```
- 무조건 BPDU 무시
- 루프 발생 가능성 있음

### 주의사항

BPDU Filter를 잘못 사용하면 **STP 보호 없이 루프가 발생** 할 수 있습니다. 신중하게 사용해야 합니다.

---

## 6. UDLD (Unidirectional Link Detection)

### 문제 상황

광케이블에서 송신 또는 수신 한쪽만 장애가 발생할 수 있습니다.

```
TX 정상, RX 장애:
[SW1] ──TX──→ [SW2]
      ←─X───
```

### UDLD 동작

**UDLD** 는 양방향 연결을 확인하는 프로토콜입니다. 자신이 보낸 UDLD 패킷이 되돌아오는지 확인합니다.

```
[SW1] ──UDLD──→ [SW2]
      ←─UDLD──
      "내가 보낸 것을 받았다는 응답이 왔는가?"
```

### 모드

| 모드 | 동작 |
|------|------|
|**Normal**| 단방향 감지 시 경고만 (포트 유지) |
|**Aggressive**| 단방향 감지 시 포트 err-disabled |

### 설정

```bash
! 전역 설정
Switch(config)# udld enable                 ! Normal 모드
Switch(config)# udld aggressive             ! Aggressive 모드

! 인터페이스 설정
Switch(config-if)# udld port aggressive
```

---

## 7. Dispute Mechanism (RSTP)

### 문제 상황

단방향 장애로 스위치가 상대방의 BPDU를 받지 못하면, 잘못된 포트 역할을 할당받을 수 있습니다.

### RSTP Dispute

RSTP에서는 **Designated Port가 Designated BPDU를 받으면**Dispute를 감지하고 포트를 Discarding으로 만듭니다.

"나도 Designated인데 상대도 Designated라고? 뭔가 잘못됐다!"

---

## 8. STP 타이머 튜닝

### 기본 타이머

| 타이머 | 기본값 | 범위 |
|--------|-------|------|
| Hello | 2초 | 1-10초 |
| Max Age | 20초 | 6-40초 |
| Forward Delay | 15초 | 4-30초 |

### 타이머 변경

```bash
! Root Bridge에서만 설정 (다른 스위치로 전파됨)
Switch(config)# spanning-tree vlan 1 hello-time 1
Switch(config)# spanning-tree vlan 1 max-age 10
Switch(config)# spanning-tree vlan 1 forward-time 10
```

**권장 **: 직접 변경보다는**RSTP 사용** 이 더 효과적입니다.

### Diameter와 타이머 관계

네트워크 직경(Root에서 가장 먼 스위치까지의 홉 수)이 클수록 타이머가 길어야 합니다.

```bash
Switch(config)# spanning-tree vlan 1 root primary diameter 4
```

---

## 9. PVST+, Rapid-PVST+

### PVST+ (Per-VLAN Spanning Tree Plus)

Cisco 전용으로,**VLAN마다 별도의 STP 인스턴스** 가 동작합니다.

```
VLAN 10: SW1 = Root
VLAN 20: SW2 = Root
```

**장점**: VLAN별 부하 분산 가능
**단점**: VLAN 수만큼 STP 인스턴스 → CPU 부하

### Rapid-PVST+

PVST+에 RSTP를 적용한 버전입니다.**권장 설정** 입니다.

```bash
Switch(config)# spanning-tree mode rapid-pvst
```

---

## 10. STP 보안 종합 설정

### Access 포트 권장 설정

```bash
interface range GigabitEthernet0/1-24
 switchport mode access
 switchport access vlan 10
 spanning-tree portfast
 spanning-tree bpduguard enable
```

### Trunk/Uplink 포트 권장 설정

```bash
! Distribution 방향 포트
interface GigabitEthernet0/48
 switchport mode trunk
 spanning-tree guard root        ! Access 스위치에서

! Access 방향 포트 (Distribution에서)
interface GigabitEthernet0/1
 switchport mode trunk
 spanning-tree guard loop
```

---

## 11. 정리

### 기능 요약

| 기능 | 목적 | 적용 대상 |
|------|------|----------|
|**PortFast**| 즉시 Forwarding | Access 포트 |
|**BPDU Guard**| BPDU 수신 시 차단 | PortFast 포트 |
|**Root Guard**| 잘못된 Root 방지 | Designated 포트 |
|**Loop Guard**| 단방향 장애 루프 방지 | Root/Alternate 포트 |
|**BPDU Filter**| BPDU 송수신 차단 | 특수 상황 |
|**UDLD**| 단방향 링크 감지 | 광케이블 |

### 설계 지침

1. Access 포트: PortFast + BPDU Guard
2. Uplink 포트: Root Guard 또는 Loop Guard
3. RSTP(Rapid-PVST+) 사용
4. Root Bridge 위치 계획적 설정

### 시험 포인트

- 각 Guard 기능의 목적과 동작
- PortFast + BPDU Guard 조합
- err-disabled 복구 방법
- Loop Guard vs Root Guard 차이

---

## 다음 장 예고

**다음 장에서는 MST (Multiple Spanning Tree)를 다룹니다.**

여러 VLAN을 하나의 STP 인스턴스로 그룹화하여 효율성을 높이는 방법을 학습합니다.
