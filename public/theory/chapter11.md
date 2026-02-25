# Chapter 11: BGP (Border Gateway Protocol)

본 장에서는 **BGP** 에 대해 학습합니다.

BGP는 지금까지 배운 라우팅 프로토콜과는 **근본적으로 다른 특성 ** 을 가지고 있습니다. OSPF나 EIGRP가 "기업 내부의 우편 시스템"이라면, BGP는**"국제 우편 시스템"** 에 해당합니다.

### 인터넷은 어떻게 동작하는가

잠시 인터넷의 구조를 생각해 보십시오. 전 세계에는 수만 개의 네트워크(ISP, 기업, 대학, 정부기관 등)가 존재합니다. 이 네트워크들이 서로 연결되어 인터넷을 구성합니다.

여러분이 한국에서 미국의 웹사이트에 접속할 때 패킷은 여러 개의 **독립적인 네트워크** 를 거쳐갑니다. KT → 해외 ISP → 미국 ISP → 목적지 데이터센터. 각 네트워크는 서로 다른 조직이 운영합니다.

이러한 대규모 네트워크들이 서로 경로 정보를 교환하는 데 사용하는 프로토콜이 바로 **BGP** 입니다.

>**BGP 없이는 인터넷이 동작하지 않습니다.**

이러한 이유로 BGP를 **"인터넷의 척추"** 또는 **"인터넷의 심장"** 이라고 부릅니다.

---

## 1. BGP의 특징 - 왜 특별한가

### IGP vs EGP - 용어 정리

먼저 관련 용어를 정리하겠습니다.

| 분류 | 설명 | 프로토콜 |
|------|------|---------|
|**IGP**(Interior Gateway Protocol) | AS** 내부**에서 사용 | OSPF, EIGRP, RIP |
|**EGP**(Exterior Gateway Protocol) | AS** 간 **에 사용 |**BGP**|

### AS (Autonomous System)란?

AS는 **하나의 관리 조직 아래 있는 네트워크 집합** 입니다. 단순히 말하면 "하나의 회사나 조직이 운영하는 네트워크 영역"입니다.

**예시:**
- KT: AS 4766
- SKT: AS 9644
- 네이버: AS 23576
- Google: AS 15169

각 AS는 고유한 번호 **(ASN, Autonomous System Number)** 를 가집니다. 이 번호는 전 세계적으로 유일하며, IANA(Internet Assigned Numbers Authority)에서 할당합니다.

### IGP와 BGP의 근본적 차이

OSPF나 EIGRP는 **"최단 경로"** 를 찾습니다. 메트릭이 가장 낮은 경로가 최적입니다.

그러나 BGP는 다릅니다.**"정책(Policy)"** 에 따라 경로를 선택합니다. 최단 경로가 아니라 **비즈니스 관계** 에 따라 경로를 결정할 수 있습니다.

**예시:**
- ISP A와는 유료 계약 관계
- ISP B와는 무료 피어링 관계

이 경우 비용 절감을 위해 ISP B를 통한 경로를 선호하도록 설정할 수 있습니다. 물리적 거리나 대역폭과 무관하게 말입니다.

### BGP의 핵심 특징

| 특징 | 설명 |
|------|------|
|**Path Vector**| AS 경로(AS-Path) 기반 경로 선택 |
|**정책 기반 **| 최단 경로가 아닌** 비즈니스 정책**에 따라 경로 선택 |
|**TCP 포트 179**| 신뢰성 있는 전송 (OSPF는 IP 직접 사용) |
|**수동 Neighbor**| 이웃을 ** 수동으로 설정**(자동 발견 없음) |
|**느린 수렴 **|** 안정성 우선**, 빠른 수렴보다 안정성이 중요 |

**수동 Neighbor 설정의 이유:**

OSPF나 EIGRP는 Hello 패킷으로 이웃을 자동 발견합니다. 그러나 BGP는 이웃을 **수동으로 설정** 해야 합니다. 왜일까요?

BGP는 서로 다른 조직 간의 프로토콜입니다. 아무 라우터나 이웃으로 받아들이면 보안 문제가 발생합니다. 따라서 관리자가 명시적으로 "이 라우터와 BGP 세션을 맺겠다"고 설정해야 합니다.

---

## 2. eBGP vs iBGP - 동일한 BGP의 두 가지 형태

BGP는 사용 위치에 따라 두 가지로 구분됩니다.**동일한 프로토콜** 이지만 동작 방식에 차이가 있습니다.

### eBGP (External BGP)

-**서로 다른 AS** 간의 BGP
- AD (Administrative Distance):**20**
- 일반적으로 **직접 연결** 된 이웃 사용
- TTL 기본값:**1**(직접 연결 가정)

### iBGP (Internal BGP)

-**같은 AS 내** 의 BGP
- AD (Administrative Distance):**200**
- 직접 연결되지 않아도 됨 **(Loopback 사용 권장)**
- TTL 기본값:**255**

### 구성도로 이해하기

```
AS 100                        AS 200                        AS 300
[R1] ────iBGP──── [R2] ────eBGP──── [R3] ────iBGP──── [R4]
                        ^
                  서로 다른 AS = eBGP
```

R1과 R2는 같은 AS 100에 속하므로 **iBGP** 로 통신합니다.
R2와 R3는 다른 AS(100 vs 200)에 속하므로 **eBGP** 로 통신합니다.

### AD 값이 다른 이유

| 타입 | AD | 이유 |
|------|-----|------|
| eBGP |**20**| 외부에서 온 정보는 ** 직접 확인된 정보**|
| iBGP |**200**| 내부에서는 **IGP(OSPF 110)가 더 정확** 할 수 있음 |

**왜 eBGP(20)가 OSPF(110)보다 높은 신뢰도를 가지는가?**

eBGP 경로는 다른 AS에서 "이 네트워크가 나에게 있다"고 직접 광고한 것입니다. 반면 OSPF는 내부 네트워크의 경로입니다. 외부 네트워크에 대한 정보는 eBGP가 더 신뢰할 수 있습니다.

**왜 iBGP(200)가 OSPF(110)보다 낮은 신뢰도를 가지는가?**

iBGP는 같은 AS 내에서 BGP 정보를 전달하는 것입니다. 그러나 내부 라우팅에 대해서는 OSPF가 더 상세한 정보(전체 토폴로지)를 가지고 있습니다. 따라서 내부 경로는 OSPF를 우선합니다.

---

## 3. BGP 메시지 타입

BGP는 **4가지 메시지** 를 사용합니다. OSPF의 5가지와 비교하면 더 단순합니다.

| 메시지 | 설명 |
|-------|------|
|**Open**| 연결 시작, BGP 파라미터 협상 (AS 번호, Hold Time 등) |
|**Update**| 경로 정보 광고/철회 |
|**Keepalive**| 연결 유지 확인 (기본 60초 간격) |
|**Notification**| 오류 알림, 연결 종료 |

### BGP Neighbor 상태 - 연결 과정

```
Idle → Connect → Active → OpenSent → OpenConfirm → Established
```

| 상태 | 설명 |
|------|------|
|**Idle**| 초기 상태, TCP 연결 시작 준비 |
|**Connect**| TCP 연결 시도 중 (포트 179) |
|**Active**| TCP 연결 실패, 재시도 중 **(여기서 정지 시 문제!)**|
|**OpenSent**| Open 메시지 전송 완료, 상대방 Open 대기 |
|**OpenConfirm**| Open 수신 완료, Keepalive 대기 |
|**Established**| 연결 완료, Update 교환 가능 |

**Active 상태에서 정지된다면?**

Active 상태는 **TCP 연결을 시도했지만 실패** 한 상태입니다. 다음을 점검해야 합니다:
- IP 주소 설정 오류
- 라우팅 문제 (상대방 IP로 가는 경로 없음)
- ACL이 포트 179 차단
- 방화벽 문제

>**문제 해결 핵심:**BGP가 **Active 상태** 에서 멈춰있다면 **TCP 연결 문제** 입니다. 네트워크 레벨 연결성을 먼저 확인하십시오.

---

## 4. BGP Path Attributes - 경로 속성

BGP의 핵심은 **Path Attributes(경로 속성)** 입니다. BGP는 이 속성들을 기반으로 최적 경로를 선택합니다. OSPF가 단순히 Cost만 비교하는 것과 달리 BGP는 여러 속성을 **순차적으로** 비교합니다.

### Path Attributes 분류

| 분류 | 설명 |
|-----|------|
|**Well-known Mandatory**| 모든 BGP가 지원 필수, 모든 Update에 포함 필수 |
|**Well-known Discretionary**| 모든 BGP가 지원 필수, 포함 여부는 선택 |
|**Optional Transitive**| 지원 안 해도 됨, 다른 이웃에게 전달 |
|**Optional Non-transitive**| 지원 안 해도 됨, 전달하지 않음 |

### 주요 Path Attributes 상세

#### 1) AS-Path (Well-known Mandatory)

목적지까지 거치는 **AS 목록** 입니다. BGP의 가장 중요한 속성입니다.

```
네트워크: 192.168.1.0/24
AS-Path: 200 300 400
```

이 경로는 AS 200 → AS 300 → AS 400을 거쳐서 해당 네트워크에 도달한다는 의미입니다.

**AS-Path의 두 가지 핵심 역할:**

| 역할 | 설명 |
|------|------|
|**루프 방지 **| 자신의 AS가 포함된 경로는** 무시**|
|**경로 선택 **| AS-Path가** 짧을수록**선호 |

**루프 방지 예시:**

AS 100의 라우터가 AS-Path "100 200 300"인 경로를 수신했습니다. 자신의 AS(100)가 이미 포함되어 있으므로 이 경로를 **무시** 합니다. 이렇게 하면 루프가 방지됩니다.

#### 2) Next-Hop (Well-known Mandatory)

다음에 거쳐야 할 라우터의 IP 주소입니다.

| 상황 | Next-Hop 동작 |
|------|--------------|
| eBGP로 전달 | Next-Hop이 **자신의 IP로 변경**|
| iBGP로 전달 | Next-Hop이 **변경되지 않음**(주의!) |

**iBGP Next-Hop 문제 - 중요!**

```
AS 100                    AS 200
[R1]────[R2]────eBGP────[R3]────[R4]
        10.1.1.1        10.1.1.2

R3가 R2로부터 경로를 수신
→ Next-Hop: 10.1.1.1 (R2의 IP)

R3가 R4에게 iBGP로 전달할 때
→ Next-Hop: 10.1.1.1 (그대로 유지!)

문제: R4는 10.1.1.1로 가는 경로가 없을 수 있음!
```

R4가 10.1.1.1(외부 네트워크)로 가는 경로가 없으면 해당 BGP 경로를 **사용할 수 없습니다**. 경로가 있어도 도달할 수 없기 때문입니다.

**해결책: next-hop-self**

```
R3(config-router)# neighbor 4.4.4.4 next-hop-self
```

이 설정을 하면 R3가 R4에게 경로를 전달할 때 Next-Hop을 **자신의 IP로 변경** 합니다. R4는 R3까지는 도달할 수 있으므로 문제가 해결됩니다.

#### 3) Local Preference (Well-known Discretionary)

**AS 내부** 에서 외부로 나가는 경로 선택에 사용됩니다.

| 특성 | 값 |
|------|-----|
| 기본값 | 100 |
| 선호도 |**높을수록** 선호 |
| 전달 범위 | iBGP로만 전달 (eBGP로는 전달 안 됨) |

**사용 시나리오:**

```
         [인터넷]
          /    \
    [ISP-A]    [ISP-B]
         \      /
          [우리 AS]
```

ISP-A를 통해 인터넷으로 나가고 싶다면:
- ISP-A에서 수신한 경로: Local Preference 200
- ISP-B에서 수신한 경로: Local Preference 100

Local Preference가 높은 ISP-A 경로가 선택됩니다.

#### 4) MED (Multi-Exit Discriminator)

**AS 외부에서** 자신의 AS로 들어오는 경로 선택에 영향을 줍니다.

| 특성 | 값 |
|------|-----|
| 기본값 | 0 |
| 선호도 |**낮을수록** 선호 |
| 비교 범위 |**같은 AS에서 온 경로끼리만** 비교 |

**Local Preference vs MED 비교:**

| 항목 | Local Preference | MED |
|------|-----------------|-----|
| 결정 주체 |**내가 ** 나가는 경로 결정 |**상대방이** 들어오는 경로에 영향 |
| 값이 높으면 | 선호 | 비선호 |
| 전달 범위 | iBGP만 | eBGP로 전달 |

#### 5) Weight (Cisco 전용)

| 특성 | 값 |
|------|-----|
| 영향 범위 |**로컬 라우터만**|
| 선호도 |**높을수록** 선호 |
| 전달 | 다른 라우터에게 **전달 안 됨**|

Weight는 Cisco 전용 속성으로,**해당 라우터에서만** 경로 선택에 영향을 줍니다. 다른 라우터에게 전달되지 않으므로 가장 로컬한 정책입니다.

---

## 5. BGP 기본 설정

### 기본 설정 예시

```
Router(config)# router bgp 100                    ! AS 번호 100
Router(config-router)# bgp router-id 1.1.1.1     ! Router ID 설정
Router(config-router)# neighbor 10.1.1.2 remote-as 200   ! eBGP 이웃
Router(config-router)# neighbor 2.2.2.2 remote-as 100    ! iBGP 이웃
Router(config-router)# network 192.168.1.0 mask 255.255.255.0
```

### network 명령의 의미 - OSPF와 전혀 다름!

| 프로토콜 | network 명령의 의미 |
|---------|-------------------|
| OSPF | "해당 인터페이스에서 OSPF를 **활성화**" |
|**BGP**| "해당 네트워크를 BGP로 ** 광고**" |

**BGP network 명령이 동작하려면:**

1. 해당 네트워크가 **라우팅 테이블에 정확히** 존재해야 함
2.**마스크가 정확히** 일치해야 함

```
! 라우팅 테이블에 192.168.1.0/24가 있어야 함
Router(config-router)# network 192.168.1.0 mask 255.255.255.0
```

라우팅 테이블에 192.168.1.0/24가 없으면 이 network 명령은 **아무 효과가 없습니다**. BGP는 존재하지 않는 네트워크를 광고하지 않습니다.

---

## 6. iBGP의 문제점과 해결책

### Full Mesh 요구사항 - iBGP의 중요한 규칙

iBGP에는 중요한 규칙이 있습니다.

>**iBGP로 받은 경로는 다른 iBGP Peer에게 전달하지 않습니다.**

왜 이런 규칙이 있을까요?**루프 방지** 목적입니다.

eBGP에서는 AS-Path로 루프를 감지합니다. 자신의 AS가 포함된 경로는 무시합니다. 그러나 **같은 AS 내에서는 AS-Path가 변하지 않습니다**. 따라서 iBGP 경로를 다시 iBGP로 전달하면 루프를 감지할 방법이 없습니다.

### Full Mesh의 문제점

이 규칙 때문에 모든 iBGP 라우터는 **서로 직접 연결** 되어야 합니다.

```
        [R1]
       /    \
    iBGP    iBGP
     /        \
  [R2]───iBGP───[R3]
```

라우터가 3대일 경우: 3개 연결
라우터가 10대일 경우:**45개** 연결
라우터가 100대일 경우:**4,950개** 연결

**공식:**n × (n-1) / 2

대규모 네트워크에서 이는 **확장성 문제** 입니다. 라우터를 추가할 때마다 모든 기존 라우터와 새로운 BGP 세션을 맺어야 합니다.

### 해결책

| 해결책 | 설명 |
|--------|------|
|**Route Reflector**| 다음 장에서 상세히 설명 (가장 많이 사용) |
|**Confederation**| AS를 Sub-AS로 분할 |

---

## 7. BGP 검증 명령어

```
! BGP 요약 (이웃 상태) - 가장 먼저 확인
Router# show ip bgp summary

! BGP 테이블 (모든 경로)
Router# show ip bgp

! 이웃 상세 정보
Router# show ip bgp neighbors

! 특정 이웃에게 광고한 경로
Router# show ip bgp neighbors [IP] advertised-routes

! 특정 이웃에게서 받은 경로
Router# show ip bgp neighbors [IP] received-routes

! BGP 학습 경로 (라우팅 테이블에 설치된 것)
Router# show ip route bgp
```

### show ip bgp summary 출력 분석

```
Router# show ip bgp summary
BGP router identifier 1.1.1.1, local AS number 100
BGP table version is 5, main routing table version 5
3 network entries using 432 bytes of memory

Neighbor        V    AS MsgRcvd MsgSent   TblVer  InQ OutQ Up/Down  State/PfxRcd
10.1.1.2        4   200     100     105        5    0    0 01:30:00        2
2.2.2.2         4   100      95     100        5    0    0 01:25:00        1
```

**State/PfxRcd 컬럼 해석:**

-**숫자 **(2, 1) =** 정상 상태**, 괄호 안 숫자는 받은 경로 수
-**문자 **(Active, Idle 등) =** 문제 상태**

State에 숫자가 아닌 **문자** 가 표시되면 BGP 세션에 문제가 있는 것입니다.

---

## 8. BGP 설정 예제

### 시나리오

```
AS 100                              AS 200
[R1]────eBGP────[R2]
Lo0: 1.1.1.1     Lo0: 2.2.2.2
192.168.1.0/24   192.168.2.0/24
```

### R1 설정

```
R1(config)# router bgp 100
R1(config-router)# bgp router-id 1.1.1.1
R1(config-router)# neighbor 10.1.1.2 remote-as 200
R1(config-router)# network 192.168.1.0 mask 255.255.255.0
```

### R2 설정

```
R2(config)# router bgp 200
R2(config-router)# bgp router-id 2.2.2.2
R2(config-router)# neighbor 10.1.1.1 remote-as 100
R2(config-router)# network 192.168.2.0 mask 255.255.255.0
```

### 검증

```
R1# show ip bgp
   Network          Next Hop            Metric LocPrf Weight Path
*> 192.168.1.0/24   0.0.0.0                  0         32768 i
*> 192.168.2.0/24   10.1.1.2                 0             0 200 i
```

**출력 해석:**

-**\*>**= 최적 경로로 선택됨
-**0.0.0.0**= 자신이 생성한 경로 (network 명령)
-**i**= IGP origin (network 명령으로 생성됨)
-**Path: 200**= AS 200을 거쳐온 경로

---

## 정리

| 개념 | 핵심 내용 |
|------|----------|
|**프로토콜 타입**| EGP - AS 간 라우팅 |
|**알고리즘**| Path Vector (AS-Path 기반) |
|**전송 프로토콜**| TCP 포트 179 |
|**AD 값**| eBGP: 20, iBGP: 200 |
|**Neighbor 설정**| 수동 설정 필요 (자동 발견 없음) |
|**주요 속성**| AS-Path, Next-Hop, Local Pref, MED, Weight |
|**iBGP 제약**| Full Mesh 필요 (또는 RR/Confederation) |
|**network 명령**| 라우팅 테이블에 있는 경로를 BGP로 광고 |

BGP는 다른 라우팅 프로토콜과 철학이 다릅니다. OSPF는 "최단 경로"를 찾지만, BGP는 "정책에 맞는 경로"를 찾습니다. 이 차이를 이해하는 것이 BGP 학습의 핵심입니다.

다음 장에서는 **Advanced BGP** 를 다룹니다. Path Selection 알고리즘의 전체 순서, Route Reflector, 필터링, Community 등 심화 내용을 학습하겠습니다.

---

## 연습 문제

이 챕터의 연습 문제를 풀어보세요.

[연습 문제 풀기 →](/quiz?category=BGP&examPart=Practice)
