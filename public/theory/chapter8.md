# Chapter 8: OSPF (Open Shortest Path First)

본 장에서는 **OSPF** 에 대해 학습합니다.

OSPF는 네트워크 엔지니어가 반드시 숙지해야 하는 프로토콜입니다. 왜 그럴까요? 대규모 기업 네트워크에서 **가장 널리 사용되는 IGP(Interior Gateway Protocol)** 이기 때문입니다. 면접에서 "라우팅 프로토콜을 설명해 주세요"라는 질문을 받으면 OSPF를 먼저 떠올려야 할 정도입니다.

EIGRP와 OSPF의 근본적인 차이를 먼저 이해해야 합니다.

-**EIGRP**: Cisco에서 개발한 프로토콜 (2013년 표준화되었으나 실질적으로 Cisco 환경에서 사용)
-**OSPF**:**IETF 표준**(RFC 2328)

이 차이가 의미하는 바는 무엇일까요? OSPF를 지원하는 장비라면 **제조사와 관계없이** 상호 통신이 가능합니다. Cisco, Juniper, Huawei, Arista 등 어떤 벤더의 장비든 OSPF로 연결할 수 있습니다. 이것이 **멀티벤더 환경** 에서 OSPF가 선호되는 핵심 이유입니다.

실무에서는 다양한 벤더의 장비가 혼재되어 있는 경우가 많습니다. 인수합병으로 다른 회사의 네트워크와 통합해야 할 수도 있고, 비용 절감을 위해 여러 벤더 장비를 도입할 수도 있습니다. 이런 상황에서 OSPF는 **공통 언어** 역할을 합니다.

---

## 1. OSPF의 특징 - Link State 프로토콜

OSPF는 **Link State** 프로토콜입니다. 이전 장에서 배운 EIGRP(Advanced Distance Vector)와는 근본적으로 다른 접근 방식을 사용합니다.

### Distance Vector vs Link State - 정보 공유 철학의 차이

EIGRP가 "목적지까지의 거리"를 알려주는 방식이라면, OSPF는 "자신의 주변에 연결된 링크 정보"를 알려주는 방식입니다.

이 차이를 비유로 설명해 보겠습니다.

| 방식 | 비유 | 예시 |
|------|------|------|
|**Distance Vector**| "거리만 알려줌" | "서울에서 부산까지 400km야" |
|**Link State**| "지도를 공유" | "서울-대전 고속도로, 대전-대구 고속도로, 대구-부산 고속도로가 있어" |

Distance Vector 방식에서는 이웃이 "부산까지 400km"라고 알려주면 그 말을 믿고 경로를 결정합니다. 그러나 Link State 방식에서는 **모든 라우터가 동일한 네트워크 지도를 공유** 합니다. 각 라우터는 자신에게 직접 연결된 링크 정보만 광고하고, 이 정보들이 모여서 전체 네트워크 지도가 완성됩니다.

### Link State 방식의 동작 원리

1.**각 라우터는 자신의 링크 정보를 LSA(Link State Advertisement)로 생성**
2.**LSA를 네트워크 전체에 Flooding**
3.**모든 라우터가 동일한 LSDB(Link State Database) 구축**
4.**SPF(Shortest Path First) 알고리즘으로 최적 경로 계산**

이 과정의 핵심은 **모든 라우터가 동일한 정보를 공유한다** 는 것입니다. 라우터 A가 가진 LSDB와 라우터 B가 가진 LSDB는 (같은 Area 내에서) 완전히 동일합니다. 각 라우터는 이 동일한 지도를 바탕으로 **독립적으로** 최적 경로를 계산합니다.

### Link State 방식의 장점

| 장점 | 설명 |
|------|------|
|**일관성**| 모든 라우터가 동일한 네트워크 뷰를 가짐 |
|**효율성**| 변화가 발생할 때만 업데이트 수행 |
|**정확성**| 직접 계산하므로 잘못된 정보에 의존하지 않음 |
|**빠른 수렴**| 변경 사항이 즉시 전파되고 재계산됨 |
|**안정성**| 루프 발생 가능성이 낮음 |

반면 단점도 있습니다.**CPU와 메모리 사용량이 높습니다.** 전체 네트워크 토폴로지를 저장하고 SPF 알고리즘을 실행해야 하기 때문입니다. 이것이 OSPF에서 **Area** 개념이 도입된 이유이기도 합니다. 네트워크를 분할하여 각 라우터가 처리해야 할 정보량을 줄이는 것입니다.

### OSPF 핵심 특징 요약

| 특징 | 값/설명 |
|------|---------|
| 표준 | RFC 2328 (OSPFv2) |
| 프로토콜 번호 | IP Protocol 89 |
| Multicast 주소 | 224.0.0.5 (AllSPFRouters), 224.0.0.6 (AllDRouters) |
| AD 값 |**110**|
| 메트릭 | Cost (대역폭 기반) |
| 알고리즘 | Dijkstra SPF |

**두 개의 Multicast 주소** 를 사용하는 이유를 설명하겠습니다.

-**224.0.0.5 (AllSPFRouters)**: 모든 OSPF 라우터가 수신
-**224.0.0.6 (AllDRouters)**: DR(Designated Router)과 BDR(Backup DR)만 수신

멀티액세스 네트워크(Ethernet 등)에서는 모든 라우터가 직접 통신하면 비효율적이므로 DR/BDR을 통해 LSA를 교환합니다. 이 내용은 뒤에서 자세히 다루겠습니다.

---

## 2. OSPF 핵심 용어 정리

OSPF 학습에 앞서 주요 용어를 정리합니다. 이 용어들을 정확히 이해해야 나머지 내용이 쉽게 따라옵니다.

| 용어 | 설명 |
|------|------|
|**LSDB**| Link State Database - 네트워크의 "지도", 모든 LSA가 저장됨 |
|**LSA**| Link State Advertisement - 링크 상태 정보를 담은 패킷 |
|**SPF**| Shortest Path First - 최단 경로 계산 알고리즘 (다익스트라) |
|**Area**| OSPF 네트워크를 분할하는 논리적 단위 |
|**Router ID**| OSPF에서 라우터를 식별하는 32비트 주소 |

### LSDB (Link State Database) - 네트워크의 지도

LSDB는 OSPF의 핵심입니다. 각 라우터가 광고한 LSA들이 모여서 LSDB를 구성합니다. 같은 Area 내의 모든 라우터는 **동일한 LSDB** 를 가져야 합니다. 만약 LSDB가 다르다면 각 라우터가 계산한 경로가 달라지고, 이는 라우팅 불일치로 이어집니다.

### Router ID - 라우터의 신분증

Router ID는 OSPF 네트워크에서 라우터를 **고유하게 식별** 하는 32비트 값입니다. IP 주소 형식(예: 1.1.1.1)으로 표현되지만, 실제로 해당 IP가 라우터에 설정되어 있을 필요는 없습니다.

### Router ID 결정 순서

```
1순위: router-id 명령으로 수동 설정한 값
   ↓
2순위: Loopback 인터페이스 중 가장 높은 IP
   ↓
3순위: 물리 인터페이스 중 가장 높은 IP (up 상태)
```

왜 이런 순서가 정해졌을까요?

**Loopback 인터페이스가 선호되는 이유:**
- Loopback은 **항상 up 상태** 입니다 (물리적 연결이 없으므로)
- 물리 인터페이스는 케이블 문제 등으로 다운될 수 있습니다
- Router ID가 변경되면 OSPF 프로세스를 재시작해야 하므로 안정적인 값이 필요합니다

**예시:**

```
인터페이스 상황:
- Gi0/0: 192.168.1.1/24 (up)
- Gi0/1: 10.1.1.1/24 (up)
- Loopback0: 1.1.1.1/32 (up)

Router ID 결정:
→ Loopback0의 1.1.1.1이 Router ID가 됨
(물리 인터페이스의 IP가 더 높아도 Loopback이 우선)
```

>**실무 권장사항:**`router-id`를 ** 수동으로 설정**하는 것이 권장됩니다. 인터페이스 IP를 변경하거나 인터페이스가 다운되어도 Router ID가 변경되지 않아 안정적인 운영이 가능합니다.

```
Router(config-router)# router-id 1.1.1.1
```

---

## 3. OSPF 패킷 타입 - 5가지 유형

OSPF 라우터들은 **5가지 패킷** 을 사용하여 통신합니다. 시험에 자주 출제되는 내용이므로 각 패킷의 역할과 사용 시점을 정확히 이해해야 합니다.

| 타입 | 이름 | 설명 |
|-----|------|------|
| 1 |**Hello**| 이웃 발견 및 관계 유지 |
| 2 |**DBD**(Database Description) | LSDB 요약 정보 교환 |
| 3 |**LSR**(Link State Request) | 필요한 LSA 요청 |
| 4 |**LSU**(Link State Update) | LSA 전송 |
| 5 |**LSAck**(Link State Acknowledgment) | LSA 수신 확인 |

### 패킷 교환 순서 - 이웃 관계 형성 과정

두 라우터가 처음 만나서 정보를 교환하는 과정을 단계별로 살펴보겠습니다.

```
[Router A]                    [Router B]
     |                             |
     |-------- Hello ------------>|  "안녕, 나는 A야"
     |<------- Hello -------------|  "안녕, 나는 B야"
     |                             |
     |-------- DBD -------------->|  "내 LSDB 목록은 이래"
     |<------- DBD ---------------|  "내 LSDB 목록은 이래"
     |                             |
     |-------- LSR -------------->|  "목록에 없는 LSA 보내줘"
     |<------- LSU ---------------|  "여기 요청한 LSA야"
     |-------- LSAck ------------>|  "잘 받았어"
     |                             |
```

**Hello 패킷의 역할:**
- 이웃 발견: "이 네트워크에 OSPF 라우터가 있는가?"
- 이웃 유지: "상대방이 아직 살아있는가?"

**DBD 패킷의 역할:**
- LSDB의 **요약 정보** 를 교환합니다
- 전체 LSA를 보내는 것이 아니라 **헤더 정보만** 보냅니다
- 상대방이 가진 LSA 목록을 파악하기 위함입니다

**LSR/LSU의 역할:**
- DBD 교환 후, 자신에게 없는 LSA가 있으면 **LSR로 요청**
- 상대방은 **LSU로 해당 LSA를 전송**
- 수신측은 **LSAck로 확인**

### Hello 패킷의 주요 정보

Hello 패킷에는 이웃 관계 형성에 필요한 중요한 정보들이 포함되어 있습니다.

| 필드 | 설명 | 일치 필수 |
|------|------|----------|
| Router ID | 라우터 식별자 | X |
|**Area ID**| Area 번호 |**O**|
|**Hello Interval**| Hello 전송 주기 (기본 10초) |**O**|
|**Dead Interval**| 이웃 무응답 판단 시간 (기본 40초) |**O**|
| Network Mask | 인터페이스 서브넷 | X (P2P 제외) |
| DR/BDR 주소 | 현재 DR/BDR | X |
|**Authentication**| 인증 정보 |**O**|
| Neighbors | 인식된 이웃 목록 | X |

>**핵심:** **Hello/Dead Interval**,**Area ID**,** 인증 정보**가 상호 일치해야 이웃 관계가 형성됩니다. 이 값들 중 하나라도 불일치하면 이웃 관계가 성립되지 않습니다.

실무에서 OSPF 이웃이 형성되지 않을 때 가장 먼저 확인해야 할 항목들입니다. 특히 **Hello/Dead Interval 불일치** 는 초보자가 자주 범하는 실수입니다.

---

## 4. OSPF Neighbor 상태 - Down부터 Full까지

두 OSPF 라우터가 처음 만나서 완전한 이웃 관계를 형성하기까지 **7단계** 를 거칩니다. 이 과정을 이해하면 OSPF 문제 해결이 훨씬 쉬워집니다.

```
Down → Init → 2-Way → ExStart → Exchange → Loading → Full
```

### 상태별 상세 설명

| 상태 | 설명 | 의미 |
|------|------|------|
|**Down**| 초기 상태, 패킷 미수신 | 아무것도 받지 못함 |
|**Init**| Hello 수신, 자신의 RID 미포함 | 상대방은 나를 아직 모름 |
|**2-Way**| 상호 인식, Hello에 자신의 RID 포함 | 양방향 인식 완료! |
|**ExStart**| Master/Slave 결정 | DBD 교환 준비 |
|**Exchange**| DBD 교환 | LSDB 요약 정보 교환 |
|**Loading**| LSR/LSU로 정보 동기화 | 누락된 LSA 요청/수신 |
|**Full**| LSDB 완전 동기화 | 이웃 관계 완성! |

각 상태의 의미를 더 자세히 설명하겠습니다.

**Down → Init:**
Router A가 Hello를 전송합니다. Router B가 이 Hello를 수신하면 Init 상태가 됩니다. 그러나 이 시점에서 Router A의 Hello에는 Router B의 Router ID가 포함되어 있지 않습니다. Router A는 아직 Router B의 존재를 모르기 때문입니다.

**Init → 2-Way:**
Router B가 Hello를 응답합니다. 이 Hello에는 "나는 Router A를 인식했다"는 의미로 Router A의 Router ID가 포함됩니다. Router A가 자신의 RID를 확인하면 2-Way 상태가 됩니다.**양방향 통신이 확인된 것입니다.**

**2-Way 상태의 특별한 의미:**
멀티액세스 네트워크(Ethernet 등)에서는 2-Way 단계에서 **DR/BDR 선출** 이 수행됩니다. 모든 라우터가 Full 관계를 맺지 않고, DR/BDR과만 Full 관계를 형성합니다.

```
[DROTHER] ←---- 2-Way ---→ [DROTHER]
     |                          |
     |                          |
    Full                       Full
     |                          |
     ↓                          ↓
   [DR] ←------ Full ------→ [BDR]
```

**ExStart → Exchange:**
DBD 패킷을 교환하기 전에 **Master/Slave 역할을 결정** 합니다. Router ID가 높은 쪽이 Master가 됩니다. Master가 먼저 DBD를 전송하고, Slave가 응답합니다.

**Loading:**
DBD 교환 후 자신에게 없는 LSA를 LSR로 요청하고 LSU로 수신합니다.

**Full:**
LSDB가 완전히 동기화되었습니다. 이제 두 라우터는 **동일한 네트워크 지도** 를 가지고 있습니다.

### 문제 해결 지침 - 어디서 멈췄는가?

| 멈춘 상태 | 가능한 원인 |
|----------|------------|
|**Init**| 단방향 통신 (ACL, 케이블 문제, MTU 불일치) |
|**ExStart / Exchange**|**MTU 불일치**(가장 빈번한 원인) |
|**Loading**| LSA 손상, 메모리 부족 |

>**시험 대비 참고:** **2-Way** 와 **Full** 은 정상적인 안정 상태입니다.**ExStart** 또는 **Exchange** 에서 멈춰있다면 **MTU 불일치** 를 가장 먼저 점검해야 합니다.

**MTU 불일치 문제:**
DBD 패킷은 크기가 클 수 있습니다. 한쪽 인터페이스의 MTU가 작으면 DBD를 정상적으로 수신하지 못합니다. 양쪽 인터페이스의 MTU가 동일한지 확인하십시오.

---

## 5. DR/BDR 선출 - 필요성과 동작 원리

### 문제 상황 - 왜 DR/BDR이 필요한가

Ethernet과 같은 멀티액세스 네트워크에 라우터가 **10대** 있다고 가정합니다. 모든 라우터가 상호 간 Full 관계를 형성하면 필요한 연결 수는 다음과 같습니다.

```
n × (n-1) / 2 = 10 × 9 / 2 = 45개
```

45개의 Full 관계를 유지하려면 엄청난 양의 LSA가 교환되어야 합니다. 라우터가 더 많아지면 상황은 급격히 악화됩니다. 50대라면?**1,225개** 연결이 필요합니다.

이는 **확장성 문제** 입니다. 라우터를 추가할 때마다 필요한 연결 수가 기하급수적으로 증가합니다.

### 해결책: DR과 BDR

이러한 문제를 해결하기 위해 OSPF는 멀티액세스 네트워크에서 **DR(Designated Router)** 과 **BDR(Backup DR)** 을 선출합니다.

```
        [DROTHER]    [DROTHER]
             \          /
              \   Full /
               ↘    ↙
         [DR] ←Full→ [BDR]
               ↗    ↖
              /   Full\
             /          \
        [DROTHER]    [DROTHER]

DROTHER 상호 간에는 2-Way 상태 유지 (Full 아님)
```

**핵심 동작 방식:**

1. 모든 라우터는 **DR/BDR과만 Full** 관계 형성
2. DROTHER(DR도 BDR도 아닌 라우터) 상호 간에는 **2-Way** 상태에서 멈춤
3. LSA는 **DR을 통해서만** 전달

이렇게 하면 10대 라우터 환경에서 필요한 Full 관계는:
- 각 DROTHER → DR: 8개
- 각 DROTHER → BDR: 8개
- DR ↔ BDR: 1개
- 총:**17개**(45개에서 대폭 감소!)

### DR/BDR 선출 기준

```
1순위: Priority가 가장 높은 라우터 (기본값 1, 범위 0-255)
   ↓ (동일할 경우)
2순위: Router ID가 가장 높은 라우터
```

**Priority 변경 방법:**

```
Router(config-if)# ip ospf priority 100
```

**Priority가 0인 경우:**
DR/BDR 선출에 **참여하지 않습니다**. 절대로 DR이나 BDR이 될 수 없습니다. 리소스가 부족한 라우터나 WAN 연결 라우터에 설정하면 유용합니다.

### 선출 예시

```
라우터       Priority    Router ID    결과
─────────────────────────────────────────
Router A       1         1.1.1.1      DROTHER
Router B       1         2.2.2.2      BDR
Router C       1         3.3.3.3      DR
Router D       0         4.4.4.4      DROTHER (선출 미참여)
```

Priority가 모두 1로 동일하므로 Router ID가 결정합니다. 가장 높은 Router ID(3.3.3.3)를 가진 Router C가 DR, 두 번째로 높은(2.2.2.2) Router B가 BDR이 됩니다.

Router D는 Priority가 0이므로 Router ID가 가장 높아도 선출에서 제외됩니다.

### 비선점 (Non-preemptive) - 중요한 규칙

>**핵심:**DR/BDR 선출은 ** 비선점(Non-preemptive)**방식입니다.

이것이 무슨 의미일까요? 이미 DR이 선출된 상태에서 **더 높은 Priority를 가진 라우터가 나타나도 **DR이 변경되지 않습니다. 기존 DR이** 다운되어야만**새로운 선출이 진행됩니다.

```
시간 순서:
1. Router A (Priority 1) 부팅 → DR 선출
2. Router B (Priority 100) 부팅 → Router A가 여전히 DR
3. Router A 다운 → Router B가 DR로 선출
```

**왜 비선점 방식을 사용할까요?**

DR이 변경되면 모든 라우터와의 관계가 재설정되어야 합니다. 이는 네트워크 불안정을 초래합니다. 안정적인 운영을 위해 기존 DR을 유지하는 것입니다.

>**실무 팁:**DR로 사용하고 싶은 라우터가 있다면, 해당 라우터를 ** 먼저 부팅**하거나 다른 라우터들의 OSPF 프로세스를 재시작해야 합니다.

---

## 6. OSPF Area - 네트워크 분할

대규모 네트워크에서 모든 라우터가 동일한 LSDB를 유지한다면 어떤 문제가 발생할까요?

1.**LSA 양 폭증**: 수천 개의 라우터가 있다면 LSDB 크기도 방대해집니다
2.**CPU 부담**: 네트워크 변화 시마다 SPF 계산을 수행해야 합니다
3.**메모리 부담**: 전체 토폴로지를 저장해야 합니다

이를 해결하기 위해 OSPF는 **Area** 라는 개념으로 네트워크를 분할합니다.

### Area 0 (Backbone Area) - 모든 Area의 중심

**Area 0** 은 OSPF에서 가장 중요한 Area입니다.

>**절대적 규칙:** 모든 다른 Area는 **반드시 Area 0과 연결** 되어야 합니다.

```
         [Area 1]
              |
              | (ABR)
              |
   ═══════[Area 0 - Backbone]═══════
         /                    \
        | (ABR)               | (ABR)
        |                      |
    [Area 2]               [Area 3]
```

왜 이런 규칙이 있을까요? OSPF는 Area 간 라우팅을 **Area 0을 통해서만 ** 수행합니다. Area 1에서 Area 2로 가는 트래픽은 반드시 Area 0을 거쳐야 합니다. 이러한**계층적 구조** 가 라우팅 루프를 방지하고 설계를 단순화합니다.

### 라우터 역할별 분류

| 역할 | 설명 |
|------|------|
|**Internal Router**| 하나의 Area에만 속한 라우터 |
|**ABR**(Area Border Router) | 두 개 이상의 Area에 연결된 라우터 |
|**ASBR**(AS Boundary Router) | 외부 네트워크(다른 라우팅 도메인)와 연결된 라우터 |
|**Backbone Router**| Area 0에 인터페이스가 있는 라우터 |

**ABR과 ASBR의 차이:**

```
                    [External Network: BGP, EIGRP 등]
                           |
                        (ASBR) ← 외부 라우팅 도메인과 연결
                           |
    [Area 1] -----(ABR)-----[Area 0]-----(ABR)----- [Area 2]
                    ↑
              Area 간 연결
```

-**ABR**: OSPF**Area 간** 경계
-**ASBR**: OSPF**AS 외부** 와의 경계

하나의 라우터가 ABR이면서 동시에 ASBR일 수도 있습니다.

### Area 분할의 장점

| 장점 | 설명 |
|------|------|
|**LSA 범위 제한**| 대부분의 LSA는 Area 내에서만 전파됨 |
|**SPF 계산 최소화**| Area 내 변화만 재계산 (다른 Area는 영향 없음) |
|**라우팅 테이블 축소**| ABR에서 요약 가능 |
|**장애 격리**| 한 Area의 문제가 다른 Area에 영향 최소화 |

---

## 7. OSPF LSA 타입 - 가장 복잡하지만 중요한 내용

LSA 타입은 OSPF에서 **가장 복잡한** 부분입니다. 그러나 OSPF를 제대로 이해하려면 반드시 알아야 합니다. CCNP 시험에서도 빈출되는 내용입니다.

### LSA 타입 총정리

| 타입 | 이름 | 생성자 | 범위 | 설명 |
|-----|------|--------|------|------|
|**1**| Router LSA | 모든 라우터 | Area 내 | 라우터의 링크 정보 |
|**2**| Network LSA | DR | Area 내 | 멀티액세스 네트워크 정보 |
|**3**| Summary LSA | ABR | Area 간 | 다른 Area의 네트워크 정보 |
|**4**| ASBR Summary | ABR | Area 간 | ASBR 위치 정보 |
|**5**| External LSA | ASBR | 전체 AS | 외부 경로 정보 |
|**7**| NSSA External | ASBR (NSSA 내) | NSSA 내 | NSSA의 외부 경로 |

### Type 1 (Router LSA) - 모든 라우터가 생성

**모든**OSPF 라우터가 생성합니다. 자신에게 직접 연결된 모든 링크 정보를 포함합니다.

```
[Router A]가 생성하는 Type 1 LSA:
- Gi0/0: 192.168.1.0/24에 연결됨
- Gi0/1: 10.1.1.0/24에 연결됨
- Serial0/0: 172.16.1.0/30에 연결됨
- 각 링크의 Cost 정보
```

**범위:**Area 내에서만 전달됩니다. Area 경계(ABR)를 넘어가지 않습니다.

이것이 Area를 분할하는 핵심 이유입니다. Type 1 LSA가 Area 내에서만 존재하므로 다른 Area의 상세 토폴로지를 알 필요가 없습니다.

### Type 2 (Network LSA) - DR만 생성

**DR만** 생성합니다. 멀티액세스 네트워크(Ethernet)에 연결된 모든 라우터 목록을 포함합니다.

```
[DR]이 생성하는 Type 2 LSA:
"이 네트워크 세그먼트에는 Router A, B, C, D가 연결되어 있습니다"
```

Point-to-Point 링크에서는 Type 2 LSA가 생성되지 않습니다. DR이 선출되지 않기 때문입니다.

**범위:**Area 내에서만 전달

### Type 3 (Summary LSA) - ABR이 생성

**ABR이 ** 생성합니다.**다른 Area의 네트워크 정보** 를 요약하여 전달합니다.

```
[ABR]이 Area 1에 전달:
"Area 0에는 10.1.0.0/16, 10.2.0.0/16 네트워크가 있습니다"
```

Type 1, 2는 Area 내부의 상세 정보입니다. 다른 Area에서는 이 상세 정보가 필요 없습니다. ABR이 이를 **요약(Summary)** 하여 Type 3으로 전달합니다.

**중요:**"Summary"라는 이름이지만 반드시 요약(집계)하는 것은 아닙니다. 단순히 다른 Area의 네트워크 정보를 전달하는 것입니다. 실제 요약은 관리자가 설정해야 합니다.

### Type 4 (ASBR Summary LSA) - ABR이 생성

**ABR이 ** 생성합니다. ASBR의**위치 정보** 를 전달합니다.

```
[ABR]이 전달:
"외부 경로 정보를 가진 ASBR(Router ID: 5.5.5.5)은 Area 0에 있습니다"
```

왜 이것이 필요할까요? Type 5 LSA(외부 경로)를 수신한 라우터는 ASBR까지 어떻게 도달하는지 알아야 합니다. Type 4가 ASBR의 위치를 알려줍니다.

### Type 5 (External LSA) - ASBR이 생성

**ASBR이 ** 생성합니다. OSPF**외부** 에서 재배포된 경로 정보입니다.

```
[ASBR]이 생성:
"외부 네트워크 203.0.113.0/24로 가려면 나를 통해 가세요"
```

**범위:** 전체 AS에 전달 (Stub Area 제외)

Type 5는 전체 OSPF 도메인에 Flooding됩니다. 이것이 외부 경로가 많으면 LSDB가 커지는 이유입니다. 다음 장에서 배울 Stub Area는 이 Type 5를 차단하여 LSDB 크기를 줄입니다.

---

## 8. OSPF Cost 계산

OSPF의 메트릭은 **Cost** 입니다. Cost가 낮을수록 좋은 경로입니다.

### Cost 공식

```
Cost = Reference Bandwidth / Interface Bandwidth
```

기본 **Reference Bandwidth = 100 Mbps**(10^8)

### 인터페이스별 기본 Cost

| 인터페이스 | 대역폭 | Cost |
|-----------|--------|------|
| Serial | 1.544 Mbps | 64 |
| Ethernet | 10 Mbps | 10 |
| Fast Ethernet | 100 Mbps |**1**|
| Gigabit Ethernet | 1 Gbps |**1**|
| 10 Gigabit | 10 Gbps |**1**|

### 문제점 발견

표를 보면 이상한 점이 있습니다. FastEthernet(100Mbps), GigabitEthernet(1Gbps), 10GigabitEthernet(10Gbps)의 Cost가 모두 **1** 로 동일합니다.

왜 이런 일이 발생할까요? OSPF가 설계될 당시 **100Mbps가 최고 속도** 였습니다. Cost 계산 공식에서 분자(Reference Bandwidth)가 100Mbps이므로, 100Mbps 이상의 대역폭은 모두 Cost 1이 됩니다.

이는 현대 네트워크에서 심각한 문제입니다. OSPF가 **10GigabitEthernet과 FastEthernet을 동일하게** 취급하게 됩니다.

### 해결책: Reference Bandwidth 변경

```
Router(config-router)# auto-cost reference-bandwidth 10000
```

10Gbps(10000 Mbps) 기준으로 변경하면:

| 인터페이스 | 대역폭 | Cost |
|-----------|--------|------|
| 10 Gigabit | 10 Gbps | 1 |
| Gigabit | 1 Gbps |**10**|
| Fast Ethernet | 100 Mbps |**100**|

이제 대역폭 차이가 Cost에 정확히 반영됩니다.

>**주의:**Reference Bandwidth는 ** 모든 OSPF 라우터에서 동일하게**설정해야 합니다. 그렇지 않으면 라우터마다 경로 계산 결과가 달라집니다.

### 수동 Cost 설정

```
Router(config-if)# ip ospf cost 50
```

인터페이스별로 Cost를 직접 지정할 수도 있습니다. 이 방법은 Reference Bandwidth 설정보다 우선합니다.

---

## 9. OSPF 기본 설정

### 기본 설정 예시

```
Router(config)# router ospf 1
Router(config-router)# router-id 1.1.1.1
Router(config-router)# network 192.168.1.0 0.0.0.255 area 0
Router(config-router)# network 10.0.0.0 0.255.255.255 area 1
Router(config-router)# auto-cost reference-bandwidth 10000
```

**Process ID (router ospf 1):**

`router ospf 1`의 **1** 은 **Process ID** 입니다. 이 번호는 **로컬에서만 의미가 있습니다**. 다른 라우터와 Process ID가 달라도 이웃 관계를 형성할 수 있습니다.

**network 명령의 의미:**

```
network [네트워크 주소] [와일드카드 마스크] area [Area 번호]
```

- 해당 네트워크 범위에 속하는 인터페이스에서 OSPF를 활성화
- 해당 인터페이스를 지정된 Area에 소속

### 인터페이스에서 직접 설정 (권장 방식)

```
Router(config)# interface GigabitEthernet0/0
Router(config-if)# ip ospf 1 area 0
```

이 방식이 더 **명확하고 설정 오류 가능성이 낮습니다**. network 명령은 와일드카드 마스크와 네트워크 주소 계산이 필요하지만, 인터페이스에서 직접 설정하면 그럴 필요가 없습니다.

### Passive Interface

```
Router(config-router)# passive-interface GigabitEthernet0/0
```

해당 인터페이스로는 Hello 패킷을 전송하지 않습니다.

**사용 시나리오:**

```
[Router] --- Gi0/0 --- [서버/PC 네트워크]
               ↑
         passive-interface 설정
         (OSPF 이웃이 없는 네트워크)
```

서버나 PC 네트워크에는 OSPF를 실행하는 라우터가 없습니다. 그러나 해당 네트워크를 OSPF로 광고해야 합니다. passive-interface를 설정하면:
- Hello를 보내지 않음 (불필요한 트래픽 방지)
- 해당 네트워크는 OSPF로 광고됨

---

## 10. OSPF 검증 명령어

```
! 이웃 상태 확인 (가장 중요)
Router# show ip ospf neighbor

! 인터페이스 OSPF 정보
Router# show ip ospf interface brief

! LSDB 확인
Router# show ip ospf database

! OSPF 학습 경로
Router# show ip route ospf

! OSPF 설정 요약
Router# show ip protocols
```

### show ip ospf neighbor 출력 분석

```
Router# show ip ospf neighbor

Neighbor ID     Pri   State           Dead Time   Address         Interface
2.2.2.2           1   FULL/DR         00:00:35    192.168.1.2     Gi0/0
3.3.3.3           1   FULL/BDR        00:00:33    192.168.1.3     Gi0/0
4.4.4.4           1   2WAY/DROTHER    00:00:31    192.168.1.4     Gi0/0
```

**State 해석:**

| State | 의미 |
|-------|------|
| FULL/DR | 정상, 상대가 DR (나는 DROTHER 또는 BDR) |
| FULL/BDR | 정상, 상대가 BDR |
| 2WAY/DROTHER | 정상, 양측 모두 DROTHER (서로 Full 아님) |
| EXSTART/- |**문제 발생**, MTU 불일치 의심 |

**2WAY/DROTHER** 가 정상인 이유를 다시 상기하십시오. DROTHER끼리는 Full 관계를 맺지 않습니다. DR/BDR과만 Full 관계를 형성합니다.

---

## 정리

본 장에서 학습한 OSPF 기본 내용을 정리합니다.

| 개념 | 핵심 내용 |
|------|----------|
|**프로토콜 유형**| Link State (LSDB 공유, SPF 계산) |
|**표준**| RFC 2328 (멀티벤더 호환) |
|**패킷 타입**| Hello, DBD, LSR, LSU, LSAck (5가지) |
|**Neighbor 상태**| Down→Init→2-Way→ExStart→Exchange→Loading→Full |
|**DR/BDR**| 멀티액세스 네트워크에서 LSA 교환 최적화 |
|**Area 0**| Backbone, 모든 Area와 연결 필수 |
|**ABR/ASBR**| Area 경계 / AS 외부 경계 라우터 |
|**LSA 타입**| 1(Router), 2(Network), 3(Summary), 4(ASBR), 5(External) |
|**Cost**| Reference BW / Interface BW |

OSPF의 강점은 **표준 프로토콜 ** 이라는 점과**확장성** 입니다. Area 분할을 통해 대규모 네트워크에서도 효율적으로 동작합니다. 그러나 Link State 방식의 특성상 CPU/메모리 사용량이 높고, 설계가 복잡할 수 있습니다.

다음 장에서는 **Advanced OSPF** 를 학습합니다. Stub Area, NSSA, Virtual Link 등 심화 내용을 다룹니다. 본 장에서 학습한 기본 개념이 확실히 숙지되어야 다음 내용의 이해가 가능하므로, 충분한 복습을 권장합니다.

---

## 연습 문제

이 챕터의 연습 문제를 풀어보세요.

[연습 문제 풀기 →](/quiz?category=OSPF&examPart=Practice)
