# Chapter 12: Advanced BGP (BGP 심화)

이전 장에서 BGP의 기본 개념인 AS, eBGP/iBGP, Path Attribute를 학습했습니다. 이번 장에서는 BGP를 실제 환경에서 운영할 때 반드시 알아야 하는 심화 내용을 다룹니다.

BGP Path Selection 알고리즘, Route Reflector, Confederation, 그리고 다양한 필터링 기법을 학습합니다. 이 내용들은 CCNP 시험에서 출제 빈도가 매우 높으며, 실무에서도 핵심적인 지식입니다.

특히 **Path Selection** 은 BGP의 가장 핵심적인 개념입니다. BGP가 수많은 경로 중에서 어떤 기준으로 최적 경로를 선택하는지 정확히 이해해야 트래픽 엔지니어링을 수행할 수 있습니다.

---

## 1. BGP Path Selection 알고리즘 - BGP의 핵심

### 왜 Path Selection이 중요한가?

BGP는 인터넷 규모의 라우팅 프로토콜입니다. 하나의 목적지 네트워크에 도달하는 경로가 수십 개 이상일 수 있습니다. 예를 들어, 구글의 네트워크에 도달하는 경로가 여러 ISP를 통해 존재할 수 있습니다.

이때 BGP는 어떤 경로를 "Best Path"로 선택할까요? OSPF나 EIGRP처럼 단순히 메트릭 하나로 결정되지 않습니다. BGP는 **여러 기준을 순차적으로 비교** 하여 최적 경로를 결정합니다.

이 순서를 이해하면, 네트워크 관리자가 원하는 경로로 트래픽을 유도할 수 있습니다. 이것이 바로 **Traffic Engineering** 입니다.

### BGP Best Path Selection 순서

BGP는 다음 순서로 경로를 비교합니다.**순서대로 비교하다가 우열이 가려지면 해당 시점에서 즉시 결정** 됩니다. 다음 단계로 넘어가지 않습니다.

```
W → L → L → A → O → M → E → I → R → N → A
↓   ↓   ↓   ↓   ↓   ↓   ↓   ↓   ↓   ↓   ↓
Weight → Local Pref → Locally originated → AS-Path → Origin → MED
→ eBGP over iBGP → IGP metric → Router ID → Neighbor IP → Age
```

시험에서는 일반적으로 **앞의 6-7개** 항목이 주로 출제됩니다. 실무에서도 대부분의 정책은 이 범위 내에서 조정됩니다.

### 암기법

영어 문장으로 외우면 순서를 기억하기 쉽습니다:

>**"We Love Large Apples Or Oranges, Mmm, Even If Rotten"**

```
W - Weight (높을수록 선호)
L - Local Preference (높을수록 선호)
L - Locally originated (자체 생성 경로 선호)
A - AS-Path (짧을수록 선호)
O - Origin (i > e > ?)
M - MED (낮을수록 선호)
E - eBGP over iBGP
I - IGP metric (낮을수록 선호)
R - Router ID (낮을수록 선호)
```

---

## 2. Path Selection 상세 설명

각 속성이 무엇이고, 왜 사용하며, 어떻게 조작하는지 자세히 살펴보겠습니다.

### 1) Weight (높을수록 선호) - 1순위

| 특성 | 설명 |
|------|-----|
| 범위 |**Cisco 전용**(표준이 아님) |
| 영향 범위 |**로컬 라우터만**|
| 기본값 | 0 (로컬 생성 경로는 32768) |
| 전달 | 다른 라우터에게 **전달되지 않음**|

**왜 Weight가 1순위인가?**

Weight는 해당 라우터에서만 적용되는 값입니다. 네트워크 관리자가 특정 라우터에서 특정 경로를 무조건 선호하도록 만들고 싶을 때 사용합니다. 다른 라우터에 영향을 주지 않으면서 로컬에서 완전한 제어가 가능합니다.

**실제 사용 예시:**

라우터에 두 개의 ISP 연결이 있다고 가정합니다. ISP-A의 경로를 무조건 선호하고 싶다면:

```
Router(config-router)# neighbor 10.1.1.1 weight 500    ! ISP-A
Router(config-router)# neighbor 10.2.2.2 weight 100    ! ISP-B
```

ISP-A로 수신한 모든 경로의 Weight가 500이 되어, 동일 목적지라면 항상 ISP-A가 선택됩니다.

**주의:**Weight는 Cisco 전용이므로, 다른 벤더 장비에서는 이 속성이 없습니다. 표준 환경에서는 Local Preference를 사용합니다.

### 2) Local Preference (높을수록 선호) - 2순위

| 특성 | 설명 |
|------|-----|
| 영향 범위 |**AS 내부** 전체 |
| 기본값 | 100 |
| 전달 | iBGP로만 전달 (eBGP로는 전달되지 않음) |
| 용도 | AS에서 외부로 나갈 때 어떤 출구를 사용할지 결정 |

**왜 Local Preference가 필요한가?**

하나의 기업이나 ISP(하나의 AS)가 여러 지점에서 인터넷에 연결되어 있다고 가정합니다. 예를 들어, 서울 사무실은 KT에, 부산 사무실은 SK에 연결되어 있습니다.

이때 AS 내부의 모든 라우터가 "인터넷으로 나갈 때는 서울의 KT 연결을 사용하자"라고 일관된 정책을 가지려면 어떻게 해야 할까요? Local Preference를 사용합니다.

```
! 서울 라우터 (KT 연결)
Router(config-router)# bgp default local-preference 200

! 부산 라우터 (SK 연결)
Router(config-router)# bgp default local-preference 100
```

KT에서 수신한 경로의 Local Preference가 200, SK에서 수신한 경로는 100이 됩니다. 이 값은 iBGP로 AS 내부에 전파되어, 모든 라우터가 KT 경로를 선호하게 됩니다.

**핵심 개념:**
- Local Preference는 **Outbound Traffic**(AS에서 나가는 트래픽)을 제어합니다
- AS 내부에서만 공유되며, eBGP로 외부에 광고되지 않습니다
- "우리 AS에서 나갈 때 어떤 출구를 쓸까?"를 결정합니다

### 3) Locally Originated (자체 생성 경로 선호) - 3순위

다음 방법으로 생성된 경로는 외부에서 학습한 경로보다 우선합니다:

- `network` 명령으로 직접 광고한 경로
- `redistribute` 로 재분배한 경로
- `aggregate-address` 로 생성한 집약 경로

**왜 자체 생성 경로를 선호하나?**

자신이 직접 소유한 네트워크에 대한 경로는 당연히 자신을 통해 도달하는 것이 맞습니다. 외부에서 같은 네트워크에 대한 경로를 받았다면, 그것은 자신의 경로가 외부로 광고되어 돌아온 것이거나 설정 오류일 가능성이 높습니다.

### 4) AS-Path (짧을수록 선호) - 4순위

AS-Path는 목적지까지 경유하는 AS의 목록입니다. AS 수가 적을수록 선호됩니다.

```
경로 A의 AS-Path: 100 200           ← 2개의 AS 경유, 선호됨
경로 B의 AS-Path: 100 200 300 400   ← 4개의 AS 경유, 비선호
```

**왜 짧은 AS-Path를 선호하나?**

일반적으로 경유하는 AS가 적을수록 지연 시간이 짧고, 장애 발생 가능성이 낮습니다. 물론 항상 그런 것은 아니지만, 합리적인 기본 가정입니다.

**AS-Path Prepending - 경로 조작 기법:**

자신의 AS 번호를 의도적으로 반복해서 추가하면, AS-Path가 길어져 해당 경로가 비선호됩니다. 이를 **AS-Path Prepending** 이라고 합니다.

```
route-map PREPEND permit 10
 set as-path prepend 100 100 100    ! 자신의 AS를 3번 추가
!
Router(config-router)# neighbor 10.1.1.1 route-map PREPEND out
```

**언제 사용하나?**

백업 경로로 사용하고 싶은 연결이 있을 때, 해당 연결로 광고하는 경로에 Prepending을 적용합니다. 다른 AS들이 이 경로를 비선호하게 되어, 주 경로에 장애가 발생했을 때만 사용됩니다.

**핵심 개념:**
- AS-Path Prepending은 **Inbound Traffic**(AS로 들어오는 트래픽)을 제어합니다
- "다른 AS들이 우리 AS로 올 때 어떤 경로를 선호하게 할까?"를 결정합니다
- Local Preference가 Outbound, AS-Path Prepending이 Inbound 제어라는 점을 구분해야 합니다

### 5) Origin (IGP > EGP > Incomplete) - 5순위

Origin은 경로가 어떻게 BGP에 유입되었는지를 나타냅니다.

| Origin | 코드 | 의미 | 우선순위 |
|--------|-----|------|---------|
| IGP |**i**| `network` 명령으로 생성 | 1 (최고) |
| EGP |**e**| 구형 EGP 프로토콜로 학습 (현재 거의 사용되지 않음) | 2 |
| Incomplete |**?**| `redistribute`로 생성 | 3 (최저) |

**왜 IGP Origin을 선호하나?**

`network` 명령으로 생성된 경로는 관리자가 의도적으로 BGP에 광고한 것입니다. 반면 `redistribute`로 생성된 경로는 다른 라우팅 프로토콜에서 가져온 것으로, 경로의 출처가 불명확할 수 있습니다.

**확인 방법:**

```
Router# show ip bgp
...
*>  192.168.1.0/24    10.1.1.1    0    100    0    200 i    ← Origin IGP
*>  192.168.2.0/24    10.1.1.1    0    100    0    200 ?    ← Origin Incomplete
```

### 6) MED (낮을수록 선호) - 6순위

| 특성 | 설명 |
|------|-----|
| 이름 | Multi-Exit Discriminator |
| 기본값 | 0 (또는 비어있음) |
| 비교 범위 | **동일한 AS에서 수신한 경로끼리만 비교**|
| 용도 | 외부 AS가 우리 AS로 진입할 때 어떤 입구를 사용할지 **제안**|

**MED와 Local Preference의 차이점:**

이 부분이 많이 혼동됩니다. 명확히 구분하겠습니다.

-**Local Preference**: 우리 AS 내부에서 결정하는 값. "우리가 나갈 때 어디로 나갈지"
-**MED**: 우리 AS가 외부에 ** 제안**하는 값. "너희가 우리에게 올 때 여기로 와라"

**중요한 제한사항:**

MED는 **동일한 이웃 AS에서 수신한 경로끼리만** 비교됩니다. 예를 들어:

```
AS 100에서 온 경로 (MED 100)
AS 200에서 온 경로 (MED 50)
```

이 두 경로는 MED로 비교되지 않습니다. 다른 AS에서 온 경로이기 때문입니다.

왜 이런 제한이 있을까요? MED는 각 AS가 자체적으로 결정하는 값이므로, 서로 다른 AS의 MED를 비교하는 것은 의미가 없습니다. AS 100의 MED 100과 AS 200의 MED 50 중 어떤 것이 더 좋은지 객관적으로 비교할 수 없습니다.

**다른 AS의 MED도 비교하고 싶다면:**

```
Router(config-router)# bgp always-compare-med
```

이 명령을 사용하면 모든 경로의 MED를 비교합니다. 하지만 주의해서 사용해야 합니다.

**설정 예시:**

```
route-map SET-MED permit 10
 set metric 100    ! MED 값 설정
!
Router(config-router)# neighbor 10.1.1.1 route-map SET-MED out
```

### 7) eBGP > iBGP - 7순위

eBGP로 수신한 경로가 iBGP로 수신한 경로보다 선호됩니다.

**왜 eBGP를 선호하나?**

eBGP 경로는 직접 연결된 외부 AS에서 수신한 것입니다. iBGP 경로는 AS 내부의 다른 라우터가 외부에서 수신하여 전달해 준 것입니다. 직접 받은 경로가 더 신뢰할 수 있고, 전달 지연이 없습니다.

### 8) IGP Metric (낮을수록 선호) - 8순위

Next-Hop까지의 **IGP 거리** 가 가까운 경로가 선호됩니다.

이 비교는 주로 **iBGP 경로들 사이** 에서 수행됩니다. 여러 iBGP 이웃에게서 동일 목적지의 경로를 받았다면, Next-Hop이 가까운 경로를 선택합니다.

**왜 IGP Metric을 고려하나?**

BGP의 Next-Hop은 보통 AS 경계에 있는 라우터입니다. 해당 라우터까지의 거리가 가까우면 트래픽 전달 지연이 줄어듭니다. 이를 통해 자연스럽게 가장 가까운 출구를 선택하게 됩니다.

### 9) Router ID (낮을수록 선호) - 9순위

여기까지 와서도 동점이면, 경로를 광고한 이웃의 Router ID가 낮은 것을 선택합니다.

### 10) Neighbor IP / Age - 10, 11순위

Router ID도 같다면 Neighbor IP 주소가 낮은 것, 그것도 같다면 가장 오래된 경로를 선택합니다.

여기까지 오는 경우는 극히 드뭅니다.

---

## 3. Route Reflector - iBGP Full Mesh 해결책

### 문제 상황 복습

이전 장에서 iBGP는 Split Horizon 규칙 때문에 Full Mesh가 필요하다고 배웠습니다. 라우터 5대면 10개의 세션, 100대면 4,950개의 세션이 필요합니다.

대규모 ISP에서 수백 대의 라우터가 있다면, Full Mesh는 현실적으로 불가능합니다. 이 문제를 해결하는 두 가지 방법이 있습니다:
1.**Route Reflector (RR)**- 가장 많이 사용됨
2.**Confederation**- 특수한 경우에 사용

### Route Reflector의 개념

Route Reflector는 iBGP의 Split Horizon 규칙을 **예외적으로 무시** 할 수 있는 특별한 라우터입니다.

일반 iBGP 라우터는 "iBGP로 받은 경로는 다른 iBGP 이웃에게 전달하지 않는다"는 규칙을 따릅니다. 하지만 Route Reflector는 iBGP로 받은 경로를 다른 iBGP 이웃에게 **반사(Reflect)** 할 수 있습니다.

```
일반 iBGP Full Mesh:          Route Reflector 사용:
[R1]────[R2]                       [RR]
 |  \  / |                        / | \
 |   \/  |                       /  |  \
 |   /\  |                    [R1] [R2] [R3]
 |  /  \ |                     (Clients)
[R3]────[R4]
```

### RR 용어 정리

| 용어 | 설명 |
|------|------|
|**Route Reflector (RR)**| 경로를 반사하는 라우터 |
|**Client**| RR에 연결된 일반 라우터, RR이 대신 경로를 전파해 줌 |
|**Non-client**| RR과 iBGP 연결은 있지만 Client가 아닌 라우터 (다른 RR 등) |
|**Cluster**| 하나의 RR과 그 Client들의 그룹 |

### RR의 반사 규칙

RR이 경로를 수신했을 때, 어디로 전달하는지가 중요합니다:

| 경로 출처 | 전달 대상 |
|----------|----------|
|**eBGP Peer**| Client + Non-client 모두에게 |
|**Client**| Client + Non-client 모두에게 |
|**Non-client**|**Client에게만**(Non-client에게는 전달 안 함) |

**왜 이런 규칙인가?**

- eBGP에서 온 경로: 외부에서 온 새로운 정보이므로 모두에게 전파
- Client에서 온 경로: Client들이 서로 Full Mesh가 아니므로 RR이 대신 전파
- Non-client에서 온 경로: Non-client들은 서로 Full Mesh일 것이므로 Client에게만 전파

### RR 설정 방법

RR 설정은 **RR에서만** 수행합니다. Client 측에서는 별도 설정이 필요 없습니다.

```
! RR에서 Client 지정
Router(config-router)# neighbor 1.1.1.1 route-reflector-client
Router(config-router)# neighbor 2.2.2.2 route-reflector-client
Router(config-router)# neighbor 3.3.3.3 route-reflector-client
```

**Client 측에서는 아무 설정도 하지 않습니다.**Client는 자신이 Client인지도 모릅니다. 단순히 RR과 iBGP 세션만 맺으면 됩니다.

### RR의 루프 방지 메커니즘

RR이 경로를 반사하면, 자칫 루프가 발생할 수 있습니다. 이를 방지하기 위해 두 가지 속성이 사용됩니다:

| 속성 | 설명 |
|------|------|
|**Originator-ID**| 경로를 처음 BGP에 주입한 라우터의 Router ID |
|**Cluster-List**| 경로가 지나온 Cluster(RR 그룹)의 목록 |

**루프 방지 동작:**

1.**Originator-ID 확인 **: 수신한 경로의 Originator-ID가 자신의 Router ID와 같으면, 자신이 생성한 경로가 돌아온 것이므로** 무시**
2.**Cluster-List 확인 **: 수신한 경로의 Cluster-List에 자신의 Cluster-ID가 포함되어 있으면, 이미 자신을 거친 경로이므로** 무시**

**Cluster-ID 설정:**

기본적으로 RR의 Cluster-ID는 Router-ID와 같습니다. 이중화를 위해 RR을 여러 대 운영할 때는 같은 Cluster에 속한 RR들에게 동일한 Cluster-ID를 수동 설정합니다.

```
Router(config-router)# bgp cluster-id 1.1.1.1
```

### RR 설계 권장사항

| 권장사항 | 이유 |
|---------|------|
|**RR 이중화 (최소 2개)**| RR 장애 시에도 경로 전파 유지 |
|**RR은 안정적인 라우터로**| RR 장애는 전체 AS에 영향 |
|**물리적으로 분산 배치**| 장애 도메인 분리 |
|**RR 간에는 Full Mesh**| Non-client 간에는 여전히 Full Mesh 필요 |

### 실제 설계 예시

100대의 라우터가 있는 AS를 가정합니다:

**Full Mesh 방식:**
- 100 × 99 / 2 = 4,950개의 iBGP 세션 필요
- 관리 불가능

**RR 방식:**
- 2대의 RR 운영 (이중화)
- 각 일반 라우터는 2개의 iBGP 세션만 필요 (각 RR에 1개씩)
- 총 약 200개의 iBGP 세션
- 훨씬 관리 가능

---

## 4. Confederation - 또 다른 해결책

Confederation은 하나의 AS를 여러 **Sub-AS** 로 분할하는 방식입니다.

### 기본 개념

```
외부에서 보면: AS 100 (하나의 AS로 보임)

내부에서 보면:
┌────────────────────────────────────────────────────┐
│                    AS 100                          │
│  ┌──────────┐   ┌──────────┐   ┌──────────┐       │
│  │Sub-AS    │   │Sub-AS    │   │Sub-AS    │       │
│  │65001     │───│65002     │───│65003     │       │
│  │          │   │          │   │          │       │
│  │[R1][R2]  │   │[R3][R4]  │   │[R5][R6]  │       │
│  │Full Mesh │   │Full Mesh │   │Full Mesh │       │
│  └──────────┘   └──────────┘   └──────────┘       │
└────────────────────────────────────────────────────┘
```

### Confederation의 작동 방식

1.**Sub-AS 내부**: 일반 iBGP처럼 동작하며 Full Mesh 필요 (작은 규모라 가능)
2.**Sub-AS 간**: eBGP처럼 동작 (하지만 일부 iBGP 특성 유지)
3.**외부에서 볼 때**: Sub-AS 번호는 보이지 않고, 원래 AS 번호만 보임

Sub-AS 번호로는 보통 Private AS 번호(64512-65534)를 사용합니다.

### Confederation 설정

```
! Sub-AS 65001에 속한 라우터
Router(config-router)# router bgp 65001
Router(config-router)# bgp confederation identifier 100      ! 실제 AS 번호
Router(config-router)# bgp confederation peers 65002 65003   ! 다른 Sub-AS들
```

### AS-Path 처리

Confederation 내부의 Sub-AS 번호는 **괄호로 표시** 되며, 외부로 나갈 때 제거됩니다.

```
내부에서: AS-Path: (65002 65001) 200
외부에서: AS-Path: 100 200
```

외부 세계에는 Sub-AS가 보이지 않습니다.

### Route Reflector vs Confederation

| 항목 | Route Reflector | Confederation |
|-----|-----------------|---------------|
|**복잡성 **|** 낮음**| 높음 |
|**설정 변경**| RR만 설정 | 모든 라우터 AS 번호 변경 필요 |
|**기존 환경 영향**| 적음 | AS 번호 변경으로 큰 영향 |
|**확장성**| 좋음 | 좋음 |
|**AS-Path 영향**| 없음 | Sub-AS로 인한 경로 선택 변화 가능 |
|**사용 사례 **|** 대부분의 SP**| 특수한 대규모 환경 |

**실무 권장:**

대부분의 경우 **Route Reflector** 를 사용합니다. 이유:
- 기존 AS 구조를 변경하지 않음
- 설정이 간단함 (RR에서만 설정)
- Client는 자신이 Client인지 알 필요도 없음

Confederation은 매우 대규모 환경이거나 이미 Sub-AS 구조가 있는 경우에 고려합니다.

---

## 5. BGP 필터링

BGP에서 경로를 필터링하는 것은 매우 중요합니다. 원하지 않는 경로를 받거나 광고하면 심각한 문제가 발생할 수 있습니다.

### 5.1 Prefix List - 네트워크 기반 필터링

Prefix List는 **네트워크 주소와 서브넷 마스크** 를 기준으로 필터링합니다.

**기본 문법:**

```
ip prefix-list NAME seq SEQUENCE permit/deny PREFIX/LENGTH [ge GE] [le LE]
```

| 옵션 | 의미 |
|------|------|
|**ge**| 이상 (greater than or equal) |
|**le**| 이하 (less than or equal) |

**예시들:**

| 명령 | 매칭되는 경로 |
|------|------|
| `permit 192.168.1.0/24` |**정확히**192.168.1.0/24만 |
| `permit 192.168.0.0/16 ge 24 le 28` | 192.168.x.x 대역의 /24 ~ /28 경로 |
| `permit 0.0.0.0/0 le 32` | 모든 경로 (/0부터 /32까지) |
| `permit 0.0.0.0/0 ge 24 le 24` | 모든 /24 경로 |

**ge/le 이해하기:**

`permit 10.0.0.0/8 ge 16 le 24`를 분석해 봅시다:

1. `10.0.0.0/8`: 10.x.x.x 대역
2. `ge 16`: 프리픽스 길이가 16 이상
3. `le 24`: 프리픽스 길이가 24 이하

결과: 10.0.0.0/16, 10.1.0.0/16, 10.0.0.0/20, 10.0.1.0/24 등이 매칭

**실제 설정:**

```
! 특정 네트워크만 허용
ip prefix-list FILTER seq 5 permit 192.168.1.0/24
ip prefix-list FILTER seq 10 permit 192.168.2.0/24
ip prefix-list FILTER seq 15 deny 0.0.0.0/0 le 32    ! 나머지 거부
!
Router(config-router)# neighbor 10.1.1.1 prefix-list FILTER in
```

**주의:**Prefix List 끝에 명시적인 deny가 없으면 ** 암묵적 deny all**이 적용됩니다.

### 5.2 AS-Path Filter - AS 경로 기반 필터링

AS-Path Filter는 **경로가 지나온 AS 목록** 을 기준으로 필터링합니다. 정규표현식을 사용합니다.

**기본 문법:**

```
ip as-path access-list NUMBER permit/deny REGEX
```

**정규표현식 기호:**

| 표현 | 의미 | 예시 |
|-----|------|------|
| `^` | 문자열 시작 | `^100` = 100으로 시작 |
| `$` | 문자열 끝 | `100$` = 100으로 끝 |
| `_` | 구분자 (공백, 시작, 끝) | `_100_` = 100을 포함 |
| `.` | 임의의 문자 하나 | `1.0` = 100, 110, 120 등 |
| `*` | 앞 문자 0회 이상 반복 | `10*` = 1, 10, 100, 1000 등 |
| `+` | 앞 문자 1회 이상 반복 | `10+` = 10, 100, 1000 등 (1은 제외) |
| `.*` | 임의의 문자열 | `.*` = 모든 것 |

**자주 사용하는 패턴:**

| 패턴 | 의미 | 사용 예 |
|------|------|--------|
| `^$` | AS-Path가 비어있음 (자체 생성 경로) | 로컬 경로만 |
| `^100$` | AS 100에서 **직접** 수신한 경로 | 이웃 AS 경로만 |
| `^100_` | AS 100으로 시작하는 경로 | AS 100 및 그 뒤의 모든 경로 |
| `_100$` | AS 100으로 끝나는 경로 | AS 100에서 생성된 경로 |
| `_100_` | AS 100을 **포함** 하는 경로 | AS 100을 경유하는 모든 경로 |
| `.*` | 모든 경로 | 와일드카드 |

**설정 예시:**

```
! AS 200에서 직접 수신한 경로만 허용
ip as-path access-list 10 permit ^200$
!
! AS 300을 경유하는 모든 경로 거부
ip as-path access-list 20 deny _300_
ip as-path access-list 20 permit .*
!
Router(config-router)# neighbor 10.1.1.1 filter-list 10 in
```

---

## 6. Route Map - 강력한 정책 도구

Route Map은 **조건 (match)** 에 따라 **동작 (set)** 을 수행하는 강력한 도구입니다. 프로그래밍의 if-then 구문과 비슷합니다.

### Route Map 구조

```
route-map NAME permit/deny SEQUENCE
 match [조건]
 set [동작]
```

-**permit**: 조건에 맞으면 set 동작 수행 후 통과
-**deny**: 조건에 맞으면 경로 거부
-**SEQUENCE**: 낮은 번호부터 순차적으로 평가

### 동작 원리

```
route-map POLICY permit 10
 match ip address prefix-list NETWORKS    ← 조건: NETWORKS에 해당하면
 set local-preference 200                 ← 동작: Local Preference를 200으로
!
route-map POLICY permit 20
 match as-path 10                         ← 조건: AS-Path가 ACL 10에 해당하면
 set weight 500                           ← 동작: Weight를 500으로
!
route-map POLICY permit 100
 ! match 없음 = 모든 경로 매칭            ← 나머지는 기본값으로 통과
```

**평가 순서:**
1. Sequence 10 확인: NETWORKS에 해당하면 Local Pref 200 설정 후 종료
2. 해당 안 되면 Sequence 20 확인: AS-Path가 ACL 10에 해당하면 Weight 500 설정 후 종료
3. 해당 안 되면 Sequence 100으로: 조건 없이 그냥 통과

**주의:**Route Map 끝에 아무것도 매칭되지 않으면 ** 암묵적 deny**가 적용됩니다. 마지막에 모든 것을 허용하는 항목을 추가하세요.

### 주요 Match 조건

```
match ip address prefix-list NAME       ! Prefix List로 필터링
match ip address ACL-NUMBER             ! ACL로 필터링
match as-path AS-PATH-ACL               ! AS-Path로 필터링
match community COMMUNITY-LIST          ! Community로 필터링
match local-preference VALUE            ! Local Preference 값으로
match metric VALUE                      ! MED 값으로
```

### 주요 Set 동작

```
set weight VALUE                        ! Weight 설정
set local-preference VALUE              ! Local Preference 설정
set as-path prepend AS-NUMBER           ! AS-Path Prepending
set metric VALUE                        ! MED 설정
set community VALUE                     ! Community 설정
set origin igp|egp|incomplete           ! Origin 설정
set next-hop NEXT-HOP-ADDRESS           ! Next-Hop 변경
```

### Route Map 적용

```
! Inbound (수신 경로에 적용)
Router(config-router)# neighbor 10.1.1.1 route-map POLICY in

! Outbound (송신 경로에 적용)
Router(config-router)# neighbor 10.1.1.1 route-map POLICY out
```

---

## 7. BGP Communities

Community는 경로에 **태그** 를 부여하여 정책을 적용하는 방법입니다. 여러 경로를 그룹으로 묶어 일괄 처리할 때 유용합니다.

### Community란?

Community는 32비트 값으로, 보통 `AS:Value` 형식으로 표시합니다 (예: 100:200).

경로에 Community를 설정하면, 해당 Community를 기준으로 필터링하거나 정책을 적용할 수 있습니다.

**예시:**ISP가 고객에게 여러 서비스를 제공한다고 가정합니다.
- Community 100:10 = 국내 경로만
- Community 100:20 = 해외 경로 포함
- Community 100:30 = 백업 경로

고객은 원하는 Community가 붙은 경로만 받을 수 있습니다.

### Well-known Communities

사전에 정의된 특별한 Community들이 있습니다:

| Community | 값 | 의미 |
|-----------|-----|------|
|**no-export**| 0xFFFFFF01 | eBGP로 광고하지 않음 (AS 경계를 넘지 않음) |
|**no-advertise**| 0xFFFFFF02 | 어떤 Peer에게도 광고하지 않음 |
|**local-as**| 0xFFFFFF03 | Confederation 외부로 광고하지 않음 |
|**internet**| 0x00000000 | 제한 없이 광고 (기본값) |

**no-export 사용 예시:**

멀티홈 환경에서 특정 경로를 다른 AS로 광고하고 싶지 않을 때:

```
route-map SET-COMMUNITY permit 10
 set community no-export
!
Router(config-router)# neighbor 10.1.1.1 route-map SET-COMMUNITY out
Router(config-router)# neighbor 10.1.1.1 send-community    ! 필수!
```

**중요:**Community를 전달하려면 `send-community` 명령이 필수입니다. 기본적으로 Community는 이웃에게 전달되지 않습니다.

### Community 설정 및 매칭

**Community 설정:**

```
route-map SET-COMM permit 10
 set community 100:200                    ! 단일 Community
 set community 100:200 100:300            ! 여러 Community
 set community 100:200 additive           ! 기존 Community에 추가
```

**Community 매칭:**

```
ip community-list standard MYLIST permit 100:200
!
route-map POLICY permit 10
 match community MYLIST
 set local-preference 200
```

---

## 8. 실전 시나리오

### 시나리오 1: ISP 선호도 설정 (Outbound Traffic)

회사가 ISP-A와 ISP-B에 연결되어 있습니다.**ISP-A를 주 경로** 로 사용하고, ISP-B는 백업으로 사용하고 싶습니다.

**Local Preference 사용**(AS 내부 모든 라우터에 영향):

```
! ISP-A에서 수신하는 경로에 높은 Local Preference
route-map FROM-ISP-A permit 10
 set local-preference 200
!
! ISP-B에서 수신하는 경로에 낮은 Local Preference
route-map FROM-ISP-B permit 10
 set local-preference 100
!
Router(config-router)# neighbor 1.1.1.1 route-map FROM-ISP-A in    ! ISP-A
Router(config-router)# neighbor 2.2.2.2 route-map FROM-ISP-B in    ! ISP-B
```

### 시나리오 2: Inbound Traffic 제어

외부 AS들이 우리 회사로 트래픽을 보낼 때,**ISP-A를 통해 들어오게** 만들고 싶습니다.

**AS-Path Prepending 사용:**

```
! ISP-B로 광고할 때 AS-Path를 길게 만듦
route-map TO-ISP-B permit 10
 set as-path prepend 65000 65000 65000    ! 자신의 AS 번호 3번 추가
!
Router(config-router)# neighbor 2.2.2.2 route-map TO-ISP-B out    ! ISP-B
```

ISP-B를 통해 광고되는 경로의 AS-Path가 길어져, 외부 AS들은 ISP-A 경로를 선호하게 됩니다.

### 시나리오 3: 특정 네트워크만 광고

ISP에게 **특정 네트워크만** 광고하고, 내부 네트워크는 숨기고 싶습니다.

```
ip prefix-list ADVERTISE permit 203.0.113.0/24    ! 공인 IP 대역
ip prefix-list ADVERTISE permit 198.51.100.0/24
!
route-map TO-ISP permit 10
 match ip address prefix-list ADVERTISE
! 나머지는 암묵적 deny로 거부됨
!
Router(config-router)# neighbor 1.1.1.1 route-map TO-ISP out
```

### 시나리오 4: 특정 AS 경유 경로 거부

AS 300이 불안정하다고 알려져 있어, AS 300을 경유하는 모든 경로를 거부하고 싶습니다.

```
ip as-path access-list 10 deny _300_       ! AS 300 포함 경로 거부
ip as-path access-list 10 permit .*        ! 나머지 허용
!
Router(config-router)# neighbor 1.1.1.1 filter-list 10 in
```

---

## 9. BGP 검증 명령어 (심화)

### 경로 확인

```
! 기본 BGP 테이블
Router# show ip bgp

! 특정 네트워크 상세 정보
Router# show ip bgp 192.168.1.0/24

! AS-Path 정규표현식으로 검색
Router# show ip bgp regexp ^200$

! Community로 검색
Router# show ip bgp community no-export

! 특정 이웃에게서 받은 경로
Router# show ip bgp neighbors 10.1.1.1 received-routes

! 특정 이웃에게 광고하는 경로
Router# show ip bgp neighbors 10.1.1.1 advertised-routes
```

### 필터 적용 결과 확인

```
! Filter List 적용 결과
Router# show ip bgp filter-list 10

! Prefix List 적용 결과
Router# show ip bgp prefix-list FILTER

! Route Map 적용 결과
Router# show ip bgp route-map POLICY
```

### Route Reflector 정보 확인

```
! RR 상태 확인
Router# show ip bgp neighbors 10.1.1.1 | include route-reflector

! Cluster 정보 확인
Router# show ip bgp 192.168.1.0/24
  ...
  Originator: 1.1.1.1, Cluster list: 2.2.2.2
```

---

## 정리

| 개념 | 핵심 내용 |
|------|----------|
| **Path Selection**| Weight → Local Pref → Locally Orig → AS-Path → Origin → MED → ... |
|**Weight**| Cisco 전용, 로컬만 영향, 높을수록 선호 |
|**Local Preference**| AS 내부 공유, Outbound Traffic 제어, 높을수록 선호 |
|**AS-Path Prepending**| Inbound Traffic 제어, AS-Path를 길게 만들어 비선호 유도 |
|**MED**| 같은 AS에서 온 경로끼리만 비교, 낮을수록 선호 |
|**Route Reflector**| iBGP Full Mesh 대체, Client만 설정, 가장 많이 사용 |
|**Confederation**| AS를 Sub-AS로 분할, 설정 복잡 |
|**Prefix List**| 네트워크 기반 필터링, ge/le로 범위 지정 |
|**AS-Path Filter**| AS 경로 기반 필터링, 정규표현식 사용 |
|**Route Map**| 조건(match) + 동작(set), 가장 강력한 정책 도구 |
|**Community**| 경로 태깅, send-community 필수 |

### BGP Traffic Engineering 요약

| 제어 대상 | 사용 도구 | 설정 위치 |
|----------|----------|----------|
|**Outbound**(나가는 트래픽) | Weight, Local Preference | Inbound Route Map |
|**Inbound**(들어오는 트래픽) | AS-Path Prepending, MED | Outbound Route Map |

---

## Part II 마무리

이상으로 **Part II: IP Routing** 을 마무리합니다.

이 파트에서 학습한 내용을 정리합니다:

| 프로토콜 | 유형 | 핵심 특징 |
|---------|------|----------|
|**EIGRP**| Advanced Distance Vector | DUAL, Feasibility Condition, Variance |
|**OSPF**| Link State | LSDB, LSA Type, Area, DR/BDR |
|**BGP**| Path Vector | AS-Path, Path Attribute, Policy-based |

세 프로토콜의 차이점을 비교하면서 복습하면 효과적입니다:

-**EIGRP**: 빠른 수렴, Cisco 중심, 중소규모 네트워크
-**OSPF**: 표준, 계층적 구조, 대규모 기업 네트워크
-**BGP**: 인터넷 라우팅, 정책 기반, ISP 및 대기업

CCNP ENCOR 시험에서 라우팅은 핵심 주제입니다. 특히 OSPF와 BGP는 출제 빈도가 매우 높습니다.

---

## 연습 문제

이 챕터의 연습 문제를 풀어보세요.

[연습 문제 풀기 →](/quiz?category=Advanced%20BGP&examPart=Practice)
