# Chapter 10: OSPFv3 (IPv6용 OSPF)

**IPv6** 시대가 도래하였습니다.

1990년대부터 예견된 IPv4 주소 고갈이 현실이 되었습니다. 전 세계적으로 IPv6 전환이 진행되고 있으며, 네트워크 엔지니어라면 IPv6를 다룰 수 있어야 합니다. 당연히 라우팅 프로토콜도 IPv6를 지원해야 합니다.

OSPFv2를 IPv6 환경에서 그대로 사용할 수 없는 이유는 무엇일까요? OSPFv2는 IPv4 주소 체계를 **기반으로 설계** 되었습니다. Hello 패킷에 IPv4 주소가 포함되고, LSA에도 IPv4 네트워크 정보가 담깁니다. IPv6는 128비트 주소 체계를 사용하므로 새로운 버전의 개발이 필요했습니다.

이러한 배경에서 등장한 것이 **OSPFv3** 입니다. 그러나 걱정하지 마십시오. OSPFv2의 핵심 원리를 이해하고 있다면 OSPFv3는 **변경된 부분만** 학습하면 됩니다.

---

## 1. OSPFv3 vs OSPFv2 - 무엇이 변경되었는가

### 변경된 사항

| 구분 | OSPFv2 | OSPFv3 |
|-----|--------|--------|
| IP 버전 | IPv4 전용 | IPv6**(+ IPv4 AF 지원)**|
| 주소 전송 | IPv4 Multicast | IPv6 Multicast |
| Neighbor 식별 | IP 주소 |**Router ID**|
| 인증 | OSPF 자체 (MD5) |**IPsec 사용**|
| Network 명령 | router ospf 모드에서 |**인터페이스에서 직접 설정**|
| LSA 타입 | Type 1-5, 7 | Type 1-5, 7**+ 8, 9 추가**|

각 변경 사항이 **왜** 필요했는지 설명하겠습니다.

**Neighbor 식별 방식 변경:**
OSPFv2에서는 이웃을 IP 주소로 식별했습니다. 그러나 IPv6에서는 하나의 인터페이스에 **여러 개의 IPv6 주소 ** 가 할당될 수 있습니다. 어떤 주소로 식별해야 할까요? 복잡함을 피하기 위해 OSPFv3는**Router ID** 로 이웃을 식별합니다.

**인증 방식 변경:**
OSPFv2는 자체 인증 메커니즘(Plain Text, MD5)을 가지고 있었습니다. 그러나 IPv6에서는 **IPsec** 이 표준으로 내장되어 있습니다. 중복된 기능을 구현할 필요 없이 IPsec을 활용하는 것이 효율적입니다.

**Network 명령 제거:**
OSPFv2의 `network` 명령은 와일드카드 마스크를 사용하여 인터페이스를 선택했습니다. 이 방식은 직관적이지 않고 실수 가능성이 높았습니다. OSPFv3는 **인터페이스에서 직접**OSPF를 활성화합니다. 훨씬 명확합니다.

### 변경되지 않은 사항

| 항목 | 설명 |
|------|------|
| 기본 동작 원리 | Link State 방식 동일 |
| SPF 알고리즘 | Dijkstra 알고리즘 동일 |
| Area 개념 | Area 0 필수 등 동일 |
| DR/BDR 선출 | 동일한 방식 |
| LSA Flooding | 메커니즘 동일 |
| 패킷 타입 | Hello, DBD, LSR, LSU, LSAck |

>**핵심:**OSPF의 ** 기본 동작 원리는 동일**합니다. Link State Database 구축, SPF 계산, Area 분할 등 핵심 개념은 그대로입니다. 변경된 부분은 주로 IPv6 주소 체계에 맞게 수정된 항목들입니다.

---

## 2. Link-Local 주소의 중요성

OSPFv3를 이해하려면 먼저 IPv6의 **Link-Local 주소** 를 알아야 합니다.

### Link-Local 주소란?

IPv6에서 Link-Local 주소 **(FE80::/10)** 는 동일한 링크(세그먼트) 내에서만 유효한 주소입니다.**라우터를 통과할 수 없습니다.**

```
[PC A]              [Router]              [PC B]
fe80::1 ◄────────► fe80::100 ◄────────► fe80::2
                    │     │
              서로 다른 링크 = 서로 다른 Link-Local 범위
```

PC A의 fe80::1과 PC B의 fe80::2는 직접 통신할 수 없습니다. 라우터를 넘어가지 못하기 때문입니다.

### OSPFv3가 Link-Local 주소를 사용하는 이유

```
[Router A] ──── fe80::1 ◄────► fe80::2 ──── [Router B]
                       ^
                OSPFv3 Hello 교환
```

**OSPFv3는 Link-Local 주소를 사용하여 이웃 관계를 형성합니다.**

왜 Global 주소 대신 Link-Local 주소를 사용할까요?

| 이유 | 설명 |
|------|------|
|**자동 생성**| 모든 IPv6 인터페이스에 자동으로 생성됨 (별도 설정 불필요) |
|**보안**| 링크 내에서만 유효하므로 외부에서 접근 불가 |
|**안정성**| Global 주소가 변경되어도 이웃 관계가 유지됨 |
|**단순성**| 라우팅과 이웃 관계를 분리 |

**안정성 측면을 더 자세히 설명하겠습니다.**

Global 주소로 이웃 관계를 맺었다고 가정해 보십시오. 네트워크 재설계로 인해 Global 주소가 변경되면 어떻게 될까요? 모든 이웃 관계가 재설정되어야 합니다. 그러나 Link-Local 주소는 인터페이스의 MAC 주소를 기반으로 자동 생성되므로 거의 변경되지 않습니다. 따라서 이웃 관계가 안정적으로 유지됩니다.

---

## 3. OSPFv3의 새로운 LSA 타입

OSPFv3에서는 두 가지 새로운 LSA 타입이 추가되었습니다. 이 변경이 왜 필요했는지 이해하는 것이 중요합니다.

### Type 8: Link LSA

**역할:** 링크의 **Link-Local 주소 정보** 를 전달합니다.

**범위:** 해당 **링크에만**Flood됩니다 (Area를 넘어가지 않음).

왜 필요한가? OSPFv3는 Link-Local 주소로 이웃을 형성합니다. 각 라우터가 이웃의 Link-Local 주소를 알아야 Next-Hop으로 사용할 수 있습니다. Type 8 LSA가 이 정보를 제공합니다.

### Type 9: Intra-Area Prefix LSA

**역할:** 라우터나 네트워크의 **IPv6 프리픽스(네트워크) 정보** 를 전달합니다.

**범위:**Area 내에서만 Flood됩니다.

### 프리픽스 정보를 분리한 이유

OSPFv2에서는 Router LSA(Type 1)에 **링크 정보와 IP 주소 정보가 함께** 포함되어 있었습니다.

```
OSPFv2 Type 1 LSA:
- Gi0/0 링크 정보 + 192.168.1.1/24
- Gi0/1 링크 정보 + 10.1.1.1/24
```

그러나 IPv6에서는 **하나의 인터페이스에 여러 개의 주소** 를 할당할 수 있습니다. Global 주소 여러 개, Link-Local 주소, 멀티캐스트 주소 등이 동시에 존재할 수 있습니다.

이러한 구조에서 링크 정보와 주소 정보를 함께 유지하면 LSA가 복잡해지고 효율성이 떨어집니다. 따라서 OSPFv3는 **토폴로지 정보 ** 와**주소 정보** 를 분리했습니다.

```
OSPFv2:
Router LSA (Type 1) = 링크 정보 + IP 주소

OSPFv3:
Router LSA (Type 1) = 링크 정보만 (토폴로지)
Intra-Area Prefix LSA (Type 9) = IPv6 주소 정보
```

이렇게 분리하면 주소가 변경되어도 토폴로지 LSA는 영향을 받지 않습니다. SPF 재계산을 최소화할 수 있습니다.

---

## 4. Address Family - IPv4와 IPv6 동시 지원

원래 OSPFv3는 **IPv6 전용 ** 으로 설계되었습니다. 그러나 이후**Address Family** 기능이 추가되었습니다.

### Dual-Stack 환경의 문제

많은 네트워크가 IPv4와 IPv6를 **동시에** 운영합니다 (Dual-Stack). 이 환경에서 OSPFv2와 OSPFv3를 별도로 운영해야 한다면:
- 두 개의 라우팅 프로토콜 관리
- 두 배의 설정 작업
- 복잡성 증가

### 해결책: OSPFv3 Address Family

Address Family 기능을 사용하면 **OSPFv3 하나로 IPv4와 IPv6를 동시에** 라우팅할 수 있습니다.

```
Router(config)# router ospfv3 1
Router(config-router)# address-family ipv4 unicast
Router(config-router-af)#  area 0
Router(config-router-af)# exit-address-family
Router(config-router)# address-family ipv6 unicast
Router(config-router-af)#  area 0
```

하나의 OSPFv3 프로세스에서 IPv4와 IPv6를 모두 처리합니다. 관리가 훨씬 간편해집니다.

>**참고:** 이 방식은 **"OSPFv3 with Address Families"** 또는 **"OSPFv3 AF"** 라고 합니다.

---

## 5. OSPFv3 설정 - 인터페이스 중심 방식

OSPFv3 설정의 가장 큰 차이점은 다음과 같습니다.

>**인터페이스에서 직접 OSPF를 활성화합니다.**

`network` 명령이 **존재하지 않습니다**.

### OSPFv2 vs OSPFv3 설정 비교

**OSPFv2:**
```
Router(config)# router ospf 1
Router(config-router)# network 192.168.1.0 0.0.0.255 area 0
```

**OSPFv3:**
```
Router(config)# ipv6 router ospf 1
Router(config-rtr)# router-id 1.1.1.1

Router(config)# interface GigabitEthernet0/0
Router(config-if)# ipv6 ospf 1 area 0    ← 인터페이스에서 직접 활성화
```

network 명령 대신 **인터페이스에서 직접**OSPF를 활성화합니다. 이 방식의 장점:
1.**명확함**: 어떤 인터페이스가 OSPF에 참여하는지 바로 알 수 있음
2.**실수 방지**: 와일드카드 마스크 계산 오류 없음
3.**유연성**: 인터페이스별로 다른 Area에 쉽게 할당

### 전통적인 방식 (OSPFv3 기본)

```
! 1단계: IPv6 라우팅 활성화 (반드시 필요)
Router(config)# ipv6 unicast-routing

! 2단계: OSPFv3 프로세스 생성
Router(config)# ipv6 router ospf 1
Router(config-rtr)# router-id 1.1.1.1

! 3단계: 인터페이스에서 활성화
Router(config)# interface GigabitEthernet0/0
Router(config-if)# ipv6 address 2001:db8:1::1/64
Router(config-if)# ipv6 ospf 1 area 0
```

**ipv6 unicast-routing** 이 반드시 필요합니다. 이 명령 없이는 라우터가 IPv6 패킷을 전달하지 않습니다.

### Address Family 방식

```
Router(config)# router ospfv3 1
Router(config-router)# router-id 1.1.1.1

Router(config)# interface GigabitEthernet0/0
Router(config-if)# ipv6 address 2001:db8:1::1/64
Router(config-if)# ospfv3 1 ipv6 area 0    ← AF 방식 명령
```

AF 방식에서는 `ospfv3` 키워드를 사용합니다.

---

## 6. Router ID - 32비트 형식 유지

OSPFv3에서도 Router ID는 **32비트 IPv4 형식** 을 사용합니다.

"IPv6용 OSPF인데 왜 IPv4 형식을 사용하는가?"라고 의문이 들 수 있습니다.

이유는 간단합니다. OSPF 내부적으로 Router ID를 **32비트로 처리 ** 하도록 설계되어 있기 때문입니다. 128비트 IPv6 주소를 사용하려면 OSPF의 핵심 구조를 대폭 변경해야 합니다. Router ID는 단순히**식별자** 일 뿐이므로 32비트로도 충분합니다.

### Router ID 결정 순서

```
1순위: router-id 명령으로 수동 설정
   ↓
2순위: Loopback 인터페이스의 IPv4 주소 중 가장 높은 값
   ↓
3순위: 물리 인터페이스의 IPv4 주소 중 가장 높은 값
```

### IPv4 주소가 없는 경우

**IPv4 주소가 전혀 없는 순수 IPv6 환경 ** 에서는 Router ID를**반드시 수동으로 설정** 해야 합니다.

```
Router(config-rtr)# router-id 1.1.1.1
```

자동으로 결정할 IPv4 주소가 없기 때문입니다. 설정하지 않으면 OSPFv3가 동작하지 않습니다.

>**실무 권장사항:**IPv6 환경이든 Dual-Stack 환경이든 항상 **router-id를 수동으로 설정** 하는 것이 바람직합니다. 예측 가능한 값을 사용하면 관리가 쉬워집니다.

---

## 7. OSPFv3 Multicast 주소

OSPFv2에서 사용하던 IPv4 Multicast 주소 대신 **IPv6 Multicast** 주소를 사용합니다.

| 용도 | OSPFv2 | OSPFv3 |
|-----|--------|--------|
| All OSPF Routers | 224.0.0.5 |**FF02::5**|
| All DR/BDR | 224.0.0.6 |**FF02::6**|

**FF02::** 는 Link-Local Multicast 주소입니다. 해당 링크 내에서만 유효하며 라우터를 넘어가지 않습니다.

형식만 IPv6로 변경되었을 뿐, 사용 목적은 동일합니다:
-**FF02::5**: 모든 OSPF 라우터에게 전송 (Hello 등)
-**FF02::6**: DR/BDR에게만 전송 (DROTHER의 LSA 전달)

---

## 8. OSPFv3 인증 - IPsec 사용

OSPFv2에서는 Plain Text나 MD5 인증을 **OSPF 자체 ** 에서 처리했습니다. OSPFv3에서는**IPsec** 을 사용합니다.

### 왜 IPsec을 사용하는가?

1.**IPv6에 IPsec 내장**: IPv6 설계 시 IPsec이 필수 요소로 포함됨
2.**중복 제거**: OSPF 자체 인증 기능을 구현할 필요 없음
3.**더 강력한 보안**: AH(Authentication Header) 또는 ESP(Encapsulating Security Payload) 선택 가능

### 인터페이스별 인증

```
Router(config-if)# ipv6 ospf authentication ipsec spi 256 sha1 [key]
```

**SPI(Security Parameter Index)**: 보안 연결을 식별하는 값. 양쪽 라우터에서 동일해야 합니다.

### Area 전체 인증

```
Router(config-rtr)# area 0 authentication ipsec spi 256 sha1 [key]
```

### OSPFv2 MD5 vs OSPFv3 IPsec

| 항목 | OSPFv2 MD5 | OSPFv3 IPsec |
|------|-----------|--------------|
| 암호화 | 해시만 (암호화 없음) | AH(인증) 또는 ESP(암호화+인증) |
| 표준화 | OSPF 자체 | IPsec 표준 |
| 보안 강도 | 중간 | 높음 |
| 설정 복잡도 | 낮음 | 중간 |

---

## 9. OSPFv3 검증 명령어

### 전통적인 방식 (ipv6 명령어)

```
Router# show ipv6 ospf                    ! OSPFv3 프로세스 정보
Router# show ipv6 ospf neighbor           ! 이웃 상태
Router# show ipv6 ospf interface brief    ! 인터페이스 정보
Router# show ipv6 ospf database           ! LSDB
Router# show ipv6 route ospf              ! OSPFv3 학습 경로
```

### Address Family 방식 (ospfv3 명령어)

```
Router# show ospfv3
Router# show ospfv3 neighbor
Router# show ospfv3 database
```

### 출력 해석

```
Router# show ipv6 ospf neighbor

Neighbor ID     Pri   State           Dead Time   Interface ID    Interface
2.2.2.2           1   FULL/DR         00:00:39    3               GigabitEthernet0/0
```

OSPFv2와 거의 동일하지만 **Interface ID** 컬럼이 추가되었습니다. IPv6에서는 인터페이스를 ID로도 식별하기 때문입니다.

```
Router# show ipv6 route ospf

OI  2001:DB8:3::/64 [110/2]
     via FE80::2, GigabitEthernet0/0
```

**OI**= OSPF**Inter-Area** 경로
**via FE80::2**= Next-Hop이 **Link-Local 주소** 임에 주목

---

## 10. OSPFv3 설정 예제

### 시나리오

```
[R1] ──── Area 0 ──── [R2] ──── Area 1 ──── [R3]
```

### R1 설정

```
R1(config)# ipv6 unicast-routing
R1(config)# ipv6 router ospf 1
R1(config-rtr)# router-id 1.1.1.1
R1(config-rtr)# exit

R1(config)# interface GigabitEthernet0/0
R1(config-if)# ipv6 address 2001:db8:12::1/64
R1(config-if)# ipv6 ospf 1 area 0

R1(config)# interface Loopback0
R1(config-if)# ipv6 address 2001:db8:1::1/64
R1(config-if)# ipv6 ospf 1 area 0
```

### R2 설정 (ABR)

```
R2(config)# ipv6 unicast-routing
R2(config)# ipv6 router ospf 1
R2(config-rtr)# router-id 2.2.2.2
R2(config-rtr)# exit

R2(config)# interface GigabitEthernet0/0
R2(config-if)# ipv6 address 2001:db8:12::2/64
R2(config-if)# ipv6 ospf 1 area 0

R2(config)# interface GigabitEthernet0/1
R2(config-if)# ipv6 address 2001:db8:23::2/64
R2(config-if)# ipv6 ospf 1 area 1
```

R2는 Area 0과 Area 1에 연결된 **ABR** 입니다.

### R3 설정

```
R3(config)# ipv6 unicast-routing
R3(config)# ipv6 router ospf 1
R3(config-rtr)# router-id 3.3.3.3
R3(config-rtr)# exit

R3(config)# interface GigabitEthernet0/0
R3(config-if)# ipv6 address 2001:db8:23::3/64
R3(config-if)# ipv6 ospf 1 area 1

R3(config)# interface Loopback0
R3(config-if)# ipv6 address 2001:db8:3::3/64
R3(config-if)# ipv6 ospf 1 area 1
```

### 검증

```
R1# show ipv6 ospf neighbor
Neighbor ID     Pri   State           Dead Time   Interface ID    Interface
2.2.2.2           1   FULL/DR         00:00:39    3               GigabitEthernet0/0

R1# show ipv6 route ospf
OI  2001:DB8:3::/64 [110/2]
     via FE80::2, GigabitEthernet0/0
OI  2001:DB8:23::/64 [110/2]
     via FE80::2, GigabitEthernet0/0
```

**OI (OSPF Inter-Area)** 경로로 Area 1의 네트워크들이 정상적으로 학습되었습니다.

---

## 11. OSPFv2와 OSPFv3 비교 정리

| 항목 | OSPFv2 | OSPFv3 |
|-----|--------|--------|
| IP 버전 | IPv4 | IPv6 (+ IPv4 AF) |
| 프로토콜 번호 | 89 | 89 (동일) |
| Neighbor 형성 | IP 주소 기반 |**Link-Local + Router ID**|
| 활성화 방법 | `network` 명령 |**인터페이스에서 직접**|
| 인증 | MD5/Plain text |**IPsec**|
| Multicast 주소 | 224.0.0.5/6 |**FF02::5/6**|
| Router ID | 자동 선택 가능 |**IPv4 없으면 수동 필수**|
| LSA 타입 | 1-5, 7 | 1-5, 7,**8, 9**|
| 주소/토폴로지 | 함께 저장 |**분리 저장 (Type 9)**|

---

## 정리

| 개념 | 핵심 내용 |
|------|----------|
|**목적**| IPv6용 OSPF (Address Family로 IPv4도 지원) |
|**이웃 형성**| Link-Local 주소 사용 |
|**활성화**| 인터페이스에서 직접 (`ipv6 ospf 1 area 0`) |
|**Router ID**| 32비트, IPv4 없으면 수동 설정 필수 |
|**인증**| IPsec 사용 (MD5 대신) |
|**새 LSA**| Type 8 (Link), Type 9 (Intra-Area Prefix) |
|**Multicast**| FF02::5, FF02::6 |

OSPFv3는 OSPFv2의 **핵심 원리를 그대로 유지** 하면서 IPv6에 맞게 적응한 프로토콜입니다. OSPFv2를 이해하고 있다면 변경된 부분만 학습하면 됩니다.

다음 장에서는 **BGP** 에 대해 학습합니다. BGP는 OSPF나 EIGRP와는 근본적으로 다른 특성을 가진 프로토콜입니다. 인터넷의 백본을 구성하는 핵심 라우팅 프로토콜이므로 네트워크 엔지니어에게 필수적인 지식입니다.

---

## 연습 문제

이 챕터의 연습 문제를 풀어보세요.

[연습 문제 풀기 →](/quiz?category=OSPFv3&examPart=Practice)
