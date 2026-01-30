# Chapter 13: VRF, GRE, and IPsec

이 장에서는 **VRF**,**GRE**,**IPsec** 을 학습합니다. 하나의 라우터에서 여러 라우팅 테이블을 분리하는 VRF, 터널링 기술인 GRE, 그리고 암호화를 제공하는 IPsec VPN을 다룹니다.

고객사 A와 B가 같은 IP 대역(10.0.0.0/8)을 사용한다면, 하나의 라우터에서 어떻게 처리할까요? VRF가 해결책입니다. 그리고 본사와 지사를 안전하게 연결하려면? GRE와 IPsec이 필요합니다.

---

## 1. VRF (Virtual Routing and Forwarding)

### VRF란?

**VRF** 는 하나의 물리 라우터에서 **여러 개의 독립적인 라우팅 테이블** 을 운영하는 기술입니다.

```
물리적 라우터 하나:
┌─────────────────────────────────────────┐
│              [Router]                   │
│  ┌─────────────┐  ┌─────────────┐      │
│  │ VRF: CustomerA │  │ VRF: CustomerB │      │
│  │ 10.0.0.0/8    │  │ 10.0.0.0/8    │      │
│  │ 라우팅 테이블 A │  │ 라우팅 테이블 B │      │
│  └─────────────┘  └─────────────┘      │
│                                         │
│  같은 IP 대역이지만 완전히 분리!        │
└─────────────────────────────────────────┘
```

### VRF의 필요성

**문제 상황:**
```
[고객A] ─── 10.1.1.0/24 ───┐
                           │
                        [ISP Router]  ← 라우팅 충돌!
                           │
[고객B] ─── 10.1.1.0/24 ───┘
```

**VRF 해결책:**
```
[고객A] ─── 10.1.1.0/24 ── VRF_A ──┐
                                    │
                                 [ISP Router]  ← 각각 분리!
                                    │
[고객B] ─── 10.1.1.0/24 ── VRF_B ──┘
```

### VRF 구성 요소

| 구성 요소 | 설명 |
|----------|------|
|**VRF Instance**| 독립적인 라우팅 도메인 |
|**RD (Route Distinguisher)**| BGP에서 경로 구분자 |
|**RT (Route Target)**| VRF 간 경로 공유 제어 |

### VRF-Lite 설정

**VRF-Lite** 는 MPLS 없이 VRF만 사용하는 간단한 구성입니다.

```bash
! VRF 정의
Router(config)# ip vrf CUSTOMER_A
Router(config-vrf)# description Customer A Network

Router(config)# ip vrf CUSTOMER_B
Router(config-vrf)# description Customer B Network

! 인터페이스에 VRF 할당
Router(config)# interface GigabitEthernet0/0
Router(config-if)# ip vrf forwarding CUSTOMER_A
Router(config-if)# ip address 10.1.1.1 255.255.255.0

Router(config)# interface GigabitEthernet0/1
Router(config-if)# ip vrf forwarding CUSTOMER_B
Router(config-if)# ip address 10.1.1.1 255.255.255.0
```

**주의**: VRF를 할당하면 기존 IP 주소가 제거됩니다!

### VRF 확인

```bash
! VRF 목록
Router# show ip vrf

! VRF별 라우팅 테이블
Router# show ip route vrf CUSTOMER_A
Router# show ip route vrf CUSTOMER_B

! VRF에서 Ping
Router# ping vrf CUSTOMER_A 10.1.1.100
```

### VRF와 라우팅 프로토콜

```bash
! OSPF with VRF
Router(config)# router ospf 100 vrf CUSTOMER_A
Router(config-router)# network 10.1.1.0 0.0.0.255 area 0

! EIGRP with VRF
Router(config)# router eigrp 1
Router(config-router)# address-family ipv4 vrf CUSTOMER_B
Router(config-router-af)# network 10.0.0.0
```

---

## 2. GRE (Generic Routing Encapsulation)

### GRE란?

**GRE** 는 패킷을 다른 패킷 안에 **캡슐화** 하는 터널링 프로토콜입니다.

```
원본 패킷:
[IP Header][Payload]

GRE 캡슐화 후:
[New IP Header][GRE Header][Original IP Header][Payload]
      │             │
   Tunnel      프로토콜 ID
   Endpoint
```

### GRE의 용도

1.**멀티캐스트/브로드캐스트 전송**: IPsec만으로는 불가능
2.**비IP 프로토콜 전송**: IPX, AppleTalk 등
3.**라우팅 프로토콜 전송**: OSPF, EIGRP over Internet

```
GRE 없이:
[본사] ─── Internet ─── [지사]
OSPF 전송 불가! (Internet은 OSPF 모름)

GRE 사용:
[본사] ════ GRE Tunnel ════ [지사]
         │  over Internet  │
      OSPF in GRE로 전송 가능!
```

### GRE 헤더

```
GRE Header (4-16 bytes):
┌────────────────────────────────────────┐
│ C │ R │ K │ S │ s │ Recur │ Flags │ Ver │
├────────────────────────────────────────┤
│           Protocol Type                 │
├────────────────────────────────────────┤
│         [Checksum] [Offset]            │
├────────────────────────────────────────┤
│              [Key]                     │
├────────────────────────────────────────┤
│         [Sequence Number]              │
└────────────────────────────────────────┘
```

### GRE 설정

```bash
! 본사 라우터
Router-HQ(config)# interface Tunnel0
Router-HQ(config-if)# ip address 192.168.100.1 255.255.255.0
Router-HQ(config-if)# tunnel source GigabitEthernet0/0
Router-HQ(config-if)# tunnel destination 203.0.113.2
Router-HQ(config-if)# tunnel mode gre ip

! 지사 라우터
Router-Branch(config)# interface Tunnel0
Router-Branch(config-if)# ip address 192.168.100.2 255.255.255.0
Router-Branch(config-if)# tunnel source GigabitEthernet0/0
Router-Branch(config-if)# tunnel destination 198.51.100.1
Router-Branch(config-if)# tunnel mode gre ip
```

### GRE 터널 경로

```
[본사]                                    [지사]
10.1.1.0/24                              10.2.2.0/24
    │                                        │
[R1: 198.51.100.1] ════ Tunnel0 ════ [R2: 203.0.113.2]
    │             192.168.100.0/24           │
    └──────────── Internet ──────────────────┘
```

라우팅 설정:
```bash
! 본사
Router-HQ(config)# ip route 10.2.2.0 255.255.255.0 Tunnel0

! 지사
Router-Branch(config)# ip route 10.1.1.0 255.255.255.0 Tunnel0
```

### GRE over IPsec

GRE만으로는 **암호화가 없습니다**. IPsec을 추가합니다.

```
[원본] → [GRE 캡슐화] → [IPsec 암호화] → 전송
                            │
                       AH/ESP 추가
```

---

## 3. IPsec (Internet Protocol Security)

### IPsec이란?

**IPsec** 은 IP 계층에서 **인증, 무결성, 암호화** 를 제공하는 프로토콜 모음입니다.

### IPsec 구성 요소

| 구성 요소 | 설명 |
|----------|------|
|**IKE**| 키 교환 프로토콜 (Phase 1, 2) |
|**ESP**| 암호화 + 인증 (권장) |
|**AH**| 인증만 (NAT 문제) |

### IPsec 모드

```
Transport Mode:
[IP Header][ESP Header][Payload][ESP Trailer]
     │
  원본 유지

Tunnel Mode:
[New IP][ESP Header][Original IP][Payload][ESP Trailer]
    │
  새 헤더 추가 (Site-to-Site VPN에 사용)
```

### IKE Phase 1 (ISAKMP SA)

두 피어 간에 **보안 채널** 을 수립합니다.

```
IKE Phase 1 협상:
- 암호화 알고리즘 (AES, 3DES)
- 해시 알고리즘 (SHA, MD5)
- 인증 방법 (Pre-shared Key, Certificate)
- DH 그룹 (키 교환)
- SA Lifetime
```

### IKE Phase 2 (IPsec SA)

실제 **데이터 암호화** 를 위한 SA를 수립합니다.

```
IKE Phase 2 협상:
- ESP/AH 선택
- 암호화/해시 알고리즘
- SA Lifetime
- PFS (Perfect Forward Secrecy)
```

### IPsec 설정 (Site-to-Site VPN)

```bash
! === Phase 1: ISAKMP Policy ===
Router(config)# crypto isakmp policy 10
Router(config-isakmp)# encryption aes 256
Router(config-isakmp)# hash sha256
Router(config-isakmp)# authentication pre-share
Router(config-isakmp)# group 14
Router(config-isakmp)# lifetime 86400

! Pre-shared Key 설정
Router(config)# crypto isakmp key MySecretKey address 203.0.113.2

! === Phase 2: Transform Set ===
Router(config)# crypto ipsec transform-set MY-TRANSFORM esp-aes 256 esp-sha256-hmac
Router(cfg-crypto-trans)# mode tunnel

! === 트래픽 정의 (ACL) ===
Router(config)# access-list 100 permit ip 10.1.1.0 0.0.0.255 10.2.2.0 0.0.0.255

! === Crypto Map ===
Router(config)# crypto map MY-VPN 10 ipsec-isakmp
Router(config-crypto-map)# set peer 203.0.113.2
Router(config-crypto-map)# set transform-set MY-TRANSFORM
Router(config-crypto-map)# match address 100

! === 인터페이스 적용 ===
Router(config)# interface GigabitEthernet0/0
Router(config-if)# crypto map MY-VPN
```

### IPsec 확인

```bash
! IKE SA 확인
Router# show crypto isakmp sa
Router# show crypto isakmp policy

! IPsec SA 확인
Router# show crypto ipsec sa
Router# show crypto ipsec transform-set

! 통계
Router# show crypto engine connections active
```

---

## 4. GRE over IPsec 설정

### 왜 GRE over IPsec인가?

| 기능 | GRE만 | IPsec만 | GRE over IPsec |
|------|-------|---------|----------------|
| 멀티캐스트 | O | X | O |
| 라우팅 프로토콜 | O | X | O |
| 암호화 | X | O | O |
| 비IP 프로토콜 | O | X | O |

### 설정 예시

```bash
! === IPsec 설정 ===
crypto isakmp policy 10
 encryption aes 256
 hash sha256
 authentication pre-share
 group 14

crypto isakmp key VPNKey address 203.0.113.2

crypto ipsec transform-set GRE-TRANSFORM esp-aes 256 esp-sha256-hmac
 mode transport    ! GRE over IPsec에서는 Transport 모드 사용

! GRE 트래픽만 암호화
access-list 100 permit gre host 198.51.100.1 host 203.0.113.2

crypto map GRE-VPN 10 ipsec-isakmp
 set peer 203.0.113.2
 set transform-set GRE-TRANSFORM
 match address 100

! === GRE 터널 설정 ===
interface Tunnel0
 ip address 192.168.100.1 255.255.255.0
 tunnel source GigabitEthernet0/0
 tunnel destination 203.0.113.2
 tunnel mode gre ip

! === 외부 인터페이스에 Crypto Map 적용 ===
interface GigabitEthernet0/0
 ip address 198.51.100.1 255.255.255.252
 crypto map GRE-VPN
```

### 패킷 흐름

```
1. 원본 패킷 생성
   [10.1.1.100 → 10.2.2.100][Data]

2. GRE 캡슐화
   [198.51.100.1 → 203.0.113.2][GRE][10.1.1.100 → 10.2.2.100][Data]

3. IPsec 암호화
   [198.51.100.1 → 203.0.113.2][ESP][암호화된 GRE 패킷][ESP Auth]

4. 인터넷 전송

5. 수신 측에서 역순 처리
```

---

## 5. DMVPN (Dynamic Multipoint VPN)

### DMVPN이란?

**DMVPN** 은 Hub-and-Spoke 환경에서 **Spoke 간 직접 통신** 을 가능하게 합니다.

```
전통적 Hub-and-Spoke:
[Spoke1] ─── [Hub] ─── [Spoke2]
              │
Spoke1↔Spoke2 통신은 항상 Hub 경유

DMVPN:
[Spoke1] ─── [Hub] ─── [Spoke2]
    └──────────────────────┘
         직접 터널 생성!
```

### DMVPN 구성 요소

| 구성 요소 | 설명 |
|----------|------|
|**mGRE**| Multipoint GRE, 여러 목적지 지원 |
|**NHRP**| Next Hop Resolution Protocol |
|**IPsec**| 암호화 |

### DMVPN 설정 (Hub)

```bash
interface Tunnel0
 ip address 172.16.0.1 255.255.255.0
 ip nhrp network-id 1
 ip nhrp map multicast dynamic    ! Spoke의 멀티캐스트 허용
 tunnel source GigabitEthernet0/0
 tunnel mode gre multipoint       ! mGRE
 tunnel protection ipsec profile DMVPN-PROFILE
```

### DMVPN 설정 (Spoke)

```bash
interface Tunnel0
 ip address 172.16.0.2 255.255.255.0
 ip nhrp network-id 1
 ip nhrp nhs 172.16.0.1            ! Hub의 Tunnel IP
 ip nhrp map 172.16.0.1 198.51.100.1   ! Hub의 Public IP
 ip nhrp map multicast 198.51.100.1
 tunnel source GigabitEthernet0/0
 tunnel mode gre multipoint
 tunnel protection ipsec profile DMVPN-PROFILE
```

---

## 6. VRF-Aware IPsec

### VRF-Aware IPsec이란?

IPsec 터널을 **특정 VRF** 에 연결합니다.

```
[VRF: CustomerA] ─── IPsec ─── [원격 CustomerA]
[VRF: CustomerB] ─── IPsec ─── [원격 CustomerB]

하나의 라우터에서 고객별 VPN!
```

### 설정 예시

```bash
! VRF 정의
ip vrf CUSTOMER_A
 rd 100:1

! 터널 인터페이스에 VRF 적용
interface Tunnel0
 ip vrf forwarding CUSTOMER_A
 ip address 192.168.100.1 255.255.255.0
 tunnel source GigabitEthernet0/0
 tunnel destination 203.0.113.2
 tunnel mode ipsec ipv4
 tunnel protection ipsec profile MY-PROFILE

! ISAKMP에서 VRF 지정
crypto isakmp key VPNKey address 203.0.113.2 vrf CUSTOMER_A
```

---

## 7. 정리

### VRF 요약

| 항목 | 설명 |
|------|------|
|**VRF**| 가상 라우팅 테이블 분리 |
|**VRF-Lite**| MPLS 없이 VRF만 사용 |
|**RD**| 경로 구분자 (BGP) |
|**RT**| 경로 공유 제어 |

### GRE 요약

| 항목 | 설명 |
|------|------|
|**GRE**| 패킷 캡슐화 터널 |
|**mGRE**| 다중 목적지 GRE |
|**Protocol 47**| GRE 프로토콜 번호 |
|**암호화**| 없음 (IPsec 필요) |

### IPsec 요약

| 항목 | 설명 |
|------|------|
|**IKE Phase 1**| 보안 채널 수립 |
|**IKE Phase 2**| 데이터 암호화 SA |
|**ESP**| 암호화 + 인증 |
|**AH**| 인증만 (NAT 문제) |

### 시험 포인트

- VRF가 필요한 상황
- GRE의 장점 (멀티캐스트, 라우팅 프로토콜)
- IPsec Phase 1 vs Phase 2
- GRE over IPsec에서 Transport 모드 사용 이유
- DMVPN의 NHRP 역할

---

## 다음 장 예고

**다음 장에서는 LISP를 다룹니다.**

Locator/ID Separation Protocol의 개념과 동작 원리를 학습합니다.
