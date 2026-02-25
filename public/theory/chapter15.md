# Chapter 15: VXLAN (Virtual Extensible LAN)

이 장에서는 **VXLAN** 을 학습합니다. 기존 VLAN의 4094개 제한을 극복하고, Layer 2 네트워크를 Layer 3 인프라 위에 확장하는 오버레이 기술입니다.

데이터센터에서 10,000개의 테넌트를 분리해야 한다면? VLAN은 4094개 한계가 있습니다. 또한, 물리적으로 떨어진 데이터센터 간에 같은 VLAN을 사용하려면? VXLAN이 해결책입니다.

---

## 1. VXLAN의 필요성

### 기존 VLAN의 한계

**한계 1: VLAN ID 제한**
```
802.1Q VLAN Tag:
┌────────────────────────────────┐
│ TPID │ PRI │ CFI │ VID (12bit) │
└────────────────────────────────┘

VID 12비트 = 4096개 (0, 4095 예약 = 4094개)

대규모 클라우드/멀티테넌트 환경에서 부족!
```

**한계 2: STP 확장성**
```
VLAN 수 증가 → STP 인스턴스 증가 → CPU 부하
수천 개 VLAN의 STP 운영은 비효율적
```

**한계 3: L2 도메인 확장**
```
[DC1] ─── Layer 3 ─── [DC2]

기존 VLAN은 L2 도메인 내에서만 동작
DC 간 L2 확장 어려움
```

### VXLAN의 해결책

```
VXLAN:
- VNI (VXLAN Network Identifier): 24비트 = 16,777,216개!
- L3 위에 L2 오버레이
- MAC-in-UDP 캡슐화
```

---

## 2. VXLAN 기본 개념

### VXLAN 아키텍처

```
                    Underlay Network (Layer 3)
   ┌──────────────────────────────────────────────────────┐
   │                    IP Routing                         │
   │                                                      │
[VTEP A] ═══════════════════════════════════════════ [VTEP B]
   │                                                      │
   │ Overlay Network (Layer 2 over Layer 3)               │
   │                                                      │
[VM1]                                               [VM2]
VLAN 10                                            VLAN 10
   └──────────────── VNI 10010 ───────────────────────┘
```

### 핵심 용어

| 용어 | 설명 |
|------|------|
|**VNI**| VXLAN Network Identifier (24비트) |
|**VTEP**| VXLAN Tunnel Endpoint |
|**NVE**| Network Virtualization Edge |
|**Underlay**| 물리 네트워크 (IP 라우팅) |
|**Overlay**| 가상 네트워크 (VXLAN 터널) |

### VXLAN 캡슐화

```
원본 프레임:
[Dst MAC][Src MAC][EtherType][Payload]

VXLAN 캡슐화 후:
[Outer Dst MAC][Outer Src MAC][Outer IP][UDP 4789][VXLAN Header][원본 프레임]
      │               │            │         │           │
   VTEP MAC      VTEP MAC    VTEP IP    VXLAN Port    VNI 포함
```

### VXLAN 헤더

```
VXLAN Header (8 bytes):
┌──────────────────────────────────────────────────────┐
│ Flags (8b) │ Reserved (24b) │ VNI (24b) │ Reserved  │
└──────────────────────────────────────────────────────┘

Flags: I 플래그가 1이면 VNI 유효
VNI: 24비트 = 약 1600만 개 네트워크 ID
```

---

## 3. VTEP (VXLAN Tunnel Endpoint)

### VTEP 역할

**VTEP** 은 VXLAN 터널의 시작점과 끝점입니다.

```
호스트 → [VTEP] ════ VXLAN Tunnel ════ [VTEP] → 호스트
         캡슐화                        디캡슐화
```

### VTEP 유형

| 유형 | 설명 |
|------|------|
|**Hardware VTEP**| 물리 스위치 (Nexus, Catalyst) |
|**Software VTEP**| 가상 스위치 (vSphere vDS, OVS) |
|**Hybrid**| 물리+가상 혼합 |

### VTEP 동작

```
VM1 (10.1.1.100, VNI 10010) → VM2 (10.1.1.200, VNI 10010)

1. VM1이 프레임 전송
   [Dst: VM2 MAC][Src: VM1 MAC][Data]

2. VTEP A가 목적지 MAC의 원격 VTEP 확인

3. VXLAN 캡슐화
   [Outer IP: VTEP A → VTEP B][UDP 4789][VNI 10010][원본 프레임]

4. IP 네트워크로 전송 (Underlay)

5. VTEP B가 수신, 디캡슐화

6. VM2에게 원본 프레임 전달
```

---

## 4. VXLAN 학습 방식

### Flood and Learn (Data Plane Learning)

```
전통적 방식:
1. 출발지 MAC 학습 (데이터 플레인)
2. 알 수 없는 목적지 MAC → BUM 트래픽 Flood

BUM = Broadcast, Unknown unicast, Multicast
```

**Multicast 기반 BUM 처리:**
```
VTEP들이 멀티캐스트 그룹 가입

VM1 → 브로드캐스트
VTEP A → 멀티캐스트 그룹 (239.1.1.1)으로 전송
모든 VTEP이 수신 후 로컬 네트워크에 브로드캐스트
```

### Control Plane Learning (BGP EVPN)

```
현대적 방식 (권장):
- BGP EVPN으로 MAC/IP 정보 교환
- Flood 없이 직접 전송
- 효율적!

VTEP A ─── BGP EVPN ─── VTEP B
      "MAC: 0011.2233.4455는 VTEP B에 있음"
```

---

## 5. VXLAN with Multicast

### Multicast Underlay

```
멀티캐스트 설정:
- VNI를 멀티캐스트 그룹에 매핑
- PIM 필요

VNI 10010 → 239.1.1.10
VNI 10020 → 239.1.1.20
```

### Multicast 설정

```bash
! PIM 설정
Router(config)# ip multicast-routing
Router(config)# interface Loopback0
Router(config-if)# ip pim sparse-mode
Router(config)# interface Ethernet1/1
Router(config-if)# ip pim sparse-mode

! VXLAN with Multicast
Switch(config)# feature nv overlay
Switch(config)# feature vn-segment-vlan-based

Switch(config)# vlan 10
Switch(config-vlan)# vn-segment 10010

Switch(config)# interface nve1
Switch(config-if-nve)# source-interface loopback0
Switch(config-if-nve)# member vni 10010 mcast-group 239.1.1.10
```

---

## 6. VXLAN with BGP EVPN

### BGP EVPN이란?

**EVPN (Ethernet VPN)** 은 BGP를 사용하여 **MAC/IP 정보를 교환** 하는 Control Plane입니다.

```
EVPN 없이:
알 수 없는 MAC → Flood!

EVPN 사용:
BGP로 MAC/IP 학습 → 직접 전송
```

### EVPN Route Types

| Type | 이름 | 용도 |
|------|------|------|
|**Type 2**| MAC/IP Advertisement | MAC 주소 광고 |
|**Type 3**| Inclusive Multicast Ethernet Tag | BUM 복제 정보 |
|**Type 5**| IP Prefix | 라우팅 정보 |

### BGP EVPN 설정

```bash
! NX-OS 예시
Switch(config)# feature bgp
Switch(config)# feature nv overlay
Switch(config)# nv overlay evpn

! BGP EVPN 설정
Switch(config)# router bgp 65000
Switch(config-router)# neighbor 192.168.1.2 remote-as 65000
Switch(config-router-neighbor)# update-source loopback0
Switch(config-router-neighbor)# address-family l2vpn evpn
Switch(config-router-neighbor-af)# send-community both

! VXLAN EVPN 설정
Switch(config)# evpn
Switch(config-evpn)# vni 10010 l2
Switch(config-evpn-vni)# rd auto
Switch(config-evpn-vni)# route-target import auto
Switch(config-evpn-vni)# route-target export auto
```

---

## 7. VXLAN Routing (L3 VXLAN)

### L2 vs L3 VXLAN

```
L2 VXLAN:
같은 VNI 내 통신 (같은 서브넷)
[VM1: 10.1.1.100] ═══ VNI 10010 ═══ [VM2: 10.1.1.200]

L3 VXLAN:
다른 VNI 간 통신 (다른 서브넷)
[VM1: 10.1.1.100] ═══ VNI 10010 ═╗
                                  ╠═ Routing ═╗
[VM3: 10.2.2.100] ═══ VNI 10020 ═╝           ╚═ [VM4]
```

### Distributed Anycast Gateway

```
모든 VTEP이 같은 Gateway IP/MAC:
VTEP A: 10.1.1.1 / MAC: 0000.0000.0001
VTEP B: 10.1.1.1 / MAC: 0000.0000.0001 (동일!)

VM이 어디에 있든 같은 Gateway로 통신
→ 최적 경로 (로컬 VTEP에서 라우팅)
```

### Symmetric IRB

```
IRB = Integrated Routing and Bridging

Symmetric IRB:
송신 VTEP에서 라우팅 + 캡슐화
수신 VTEP에서 디캡슐화 + 라우팅

L3 VNI 사용:
Tenant 간 라우팅을 위한 별도 VNI
```

### L3 VXLAN 설정

```bash
! L3 VNI 설정 (Tenant VRF)
Switch(config)# vrf context TENANT-A
Switch(config-vrf)# vni 50000
Switch(config-vrf)# rd auto
Switch(config-vrf)# address-family ipv4 unicast
Switch(config-vrf-af-ipv4)# route-target both auto
Switch(config-vrf-af-ipv4)# route-target both auto evpn

! SVI with Anycast Gateway
Switch(config)# interface Vlan10
Switch(config-if)# vrf member TENANT-A
Switch(config-if)# ip address 10.1.1.1/24
Switch(config-if)# fabric forwarding mode anycast-gateway

! Anycast MAC 설정 (모든 VTEP 동일)
Switch(config)# fabric forwarding anycast-gateway-mac 0000.0000.0001
```

---

## 8. VXLAN Flood and Learn vs EVPN 비교

### 비교표

| 특성 | Flood and Learn | BGP EVPN |
|------|-----------------|----------|
| BUM 처리 | Multicast/Ingress Replication | Head-End Replication |
| MAC 학습 | Data Plane | Control Plane |
| 확장성 | 낮음 | 높음 |
| Multicast 필요 | O (또는 Ingress Replication) | X |
| 운영 복잡도 | 낮음 | 높음 |

### 권장 사항

```
소규모 환경: Flood and Learn 가능
대규모/DC 환경: BGP EVPN 권장
Cisco ACI, SD-Access: EVPN 기반
```

---

## 9. VXLAN 확인 및 트러블슈팅

### 확인 명령어

```bash
! NVE 인터페이스 상태
Switch# show nve interface nve1
Switch# show nve peers

! VNI 정보
Switch# show nve vni
Switch# show vxlan interface

! MAC 테이블
Switch# show mac address-table
Switch# show l2route evpn mac all

! BGP EVPN (EVPN 사용 시)
Switch# show bgp l2vpn evpn summary
Switch# show bgp l2vpn evpn
```

### 트러블슈팅 체크리스트

```
1. Underlay 연결 확인
   - VTEP 간 IP 연결 (ping)
   - MTU 확인 (VXLAN 오버헤드 50바이트)

2. NVE 인터페이스 상태
   - show nve interface
   - Source interface 확인

3. VNI 매핑 확인
   - VLAN-to-VNI 매핑
   - show nve vni

4. Peer 상태 확인
   - show nve peers
   - BGP neighbor 상태 (EVPN)
```

### MTU 고려사항

```
VXLAN 오버헤드:
- Outer Ethernet: 14 bytes
- Outer IP: 20 bytes
- UDP: 8 bytes
- VXLAN: 8 bytes
= 50 bytes

원본 1500 + 50 = 1550 bytes
→ Underlay MTU를 1550 이상으로 설정
→ 권장: 9000 (Jumbo Frame)
```

---

## 10. VXLAN in Cisco Architectures

### Cisco ACI

```
ACI = Application Centric Infrastructure

VXLAN을 Data Plane으로 사용
APIC이 Control Plane 관리
IS-IS + MP-BGP EVPN
```

### Cisco SD-Access

```
SD-Access Fabric:
Control Plane: LISP
Data Plane: VXLAN

[Edge Node] ═══ VXLAN ═══ [Edge Node]
                │
         [Control Plane Node]
              (LISP MS/MR)
```

---

## 11. 정리

### 핵심 개념 요약

| 개념 | 설명 |
|------|------|
|**VNI**| 24비트 네트워크 식별자 |
|**VTEP**| VXLAN 터널 종단점 |
|**Underlay**| 물리 IP 네트워크 |
|**Overlay**| 가상 L2 네트워크 |
|**BGP EVPN**| MAC/IP 정보 교환 Control Plane |

### VXLAN 설정 요약

1. NV Overlay 기능 활성화
2. VLAN-to-VNI 매핑
3. NVE 인터페이스 설정
4. Peer 설정 (Multicast 또는 EVPN)
5. (선택) L3 VXLAN: VRF, Anycast Gateway

### 시험 포인트

- VXLAN 캡슐화 구조 (MAC-in-UDP)
- VNI 24비트 = 약 1600만 개
- UDP 포트 4789
- Flood and Learn vs BGP EVPN
- Anycast Gateway 개념
- VXLAN의 MTU 오버헤드

---

## 다음 장 예고

**다음 장에서는 Network Programmability 기초를 다룹니다.**

API, REST, JSON, YANG 등 네트워크 자동화의 기반 개념을 학습합니다.
