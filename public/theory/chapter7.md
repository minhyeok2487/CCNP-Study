# Chapter 7: EIGRP (Enhanced Interior Gateway Routing Protocol)

본 챕터에서는 Cisco가 개발한 고급 라우팅 프로토콜인 **EIGRP** 를 다룹니다.

EIGRP를 이해하기 전에 먼저 이 프로토콜이 탄생한 배경을 알아야 합니다. Cisco는 1980년대에 IGRP(Interior Gateway Routing Protocol)라는 자체 프로토콜을 개발했습니다. 당시 RIP의 한계(최대 홉 수 15, 느린 수렴 속도)를 극복하기 위해서였습니다. 그러나 IGRP도 시간이 지나면서 한계를 드러냈고, 이를 개선한 것이 바로 EIGRP입니다.

"Enhanced"라는 이름에서 알 수 있듯이, EIGRP는 IGRP의 **강화 버전** 입니다. 오랫동안 Cisco 전용 프로토콜이었으나, 2013년 RFC 7868로 표준화되었습니다. 그러나 실무에서는 여전히 Cisco 장비 환경에서 주로 사용됩니다.

EIGRP의 핵심 특징은 **빠른 수렴 속도 ** 와**효율적인 대역폭 사용** 입니다. 이 두 가지 특징이 왜 중요한지, 그리고 EIGRP가 어떻게 이를 달성하는지 본 챕터에서 상세히 다루겠습니다.

---

## 1. EIGRP의 특징 - Advanced Distance Vector

EIGRP는 **"Advanced Distance Vector"** 또는 **"Hybrid"** 프로토콜로 분류됩니다. 이 분류가 무엇을 의미하는지 이해하려면 먼저 기존 라우팅 프로토콜의 동작 방식을 알아야 합니다.

### Distance Vector vs Link State - 근본적인 차이

라우팅 프로토콜은 크게 두 가지 방식으로 네트워크 정보를 처리합니다.

| 특성 | Distance Vector | Link State |
|------|-----------------|------------|
| 대표 프로토콜 | RIP | OSPF |
| 정보 공유 방식 | 이웃에게 거리/방향 전달 | 전체 토폴로지 공유 |
| 업데이트 방식 | 주기적 (전체 테이블) | 변화 시에만 |
| 수렴 속도 | 느림 | 빠름 |
| CPU/메모리 사용 | 낮음 | 높음 |

**Distance Vector** 방식을 이해하기 위한 비유를 들어보겠습니다. 여러분이 처음 방문한 도시에서 목적지를 찾고 있다고 가정해 보십시오. 지나가는 사람에게 길을 물었더니 "저쪽 방향으로 2km 가면 됩니다"라고 답합니다. 이 정보는 유용하지만, 그 사람이 정확히 알고 있는지, 중간에 공사 구간이 있는지는 알 수 없습니다. 이것이 Distance Vector 방식입니다.**방향(Vector)** 과 **거리(Distance)** 만 알려줍니다.

반면 **Link State** 방식은 완전히 다릅니다. 모든 라우터가 네트워크의 **전체 지도** 를 가지고 있습니다. 각 라우터는 자신에게 연결된 링크 정보를 모든 라우터와 공유하고, 결과적으로 모든 라우터가 동일한 네트워크 지도를 구축합니다. 그 지도를 바탕으로 각자 최적의 경로를 계산합니다.

### EIGRP는 어떻게 두 방식의 장점을 결합했는가

EIGRP가 "Hybrid" 또는 "Advanced Distance Vector"로 불리는 이유는 다음과 같습니다.

**Distance Vector에서 가져온 것:**
- 이웃으로부터 경로 정보를 수신하는 방식
- 전체 네트워크 토폴로지를 알 필요가 없음
- 비교적 적은 CPU/메모리 사용

**Link State에서 가져온 것:**
-**변화가 발생했을 때만** 업데이트를 전송
- 빠른 수렴 속도
- 루프 방지 메커니즘 (DUAL 알고리즘)

RIP과 같은 전통적인 Distance Vector 프로토콜은 30초마다 전체 라우팅 테이블을 이웃에게 전송합니다. 네트워크에 변화가 없어도 말입니다. 이는 대역폭 낭비이자 수렴 속도 저하의 원인이 됩니다.

EIGRP는 이 문제를 해결했습니다. 초기에 이웃과 정보를 교환한 후에는 **변화가 발생했을 때만** 업데이트를 전송합니다. 또한 **DUAL(Diffusing Update Algorithm)** 이라는 알고리즘을 통해 루프 없이 빠르게 수렴할 수 있습니다.

### EIGRP 핵심 특징 정리

| 항목 | 값 | 의미 |
|------|------|------|
| 프로토콜 번호 | IP Protocol 88 | TCP/UDP가 아닌 IP 직접 캡슐화 |
| Multicast 주소 | 224.0.0.10 | EIGRP 라우터들만 수신 |
| AD 값 | Internal: 90, External: 170 | OSPF(110)보다 높은 신뢰도 |
| 수렴 속도 | 매우 빠름 | DUAL 알고리즘 덕분 |
| 부하 분산 | Equal + Unequal Cost 지원 | 다른 프로토콜에서 보기 어려운 기능 |
| 요약 | 모든 라우터에서 가능 | OSPF는 ABR/ASBR에서만 가능 |

AD 값이 90인 이유를 생각해 보십시오. Cisco는 자사 프로토콜인 EIGRP를 OSPF(110)보다 신뢰할 수 있다고 판단했습니다. DUAL 알고리즘의 루프 방지 기능과 빠른 수렴 속도가 그 근거입니다.

---

## 2. EIGRP 패킷 타입 - 5가지 패킷의 역할

EIGRP는 5가지 패킷 타입을 사용합니다. 각 패킷이 왜 필요한지, 어떤 상황에서 사용되는지 이해하는 것이 중요합니다.

### Hello 패킷 - 이웃 발견과 관계 유지의 핵심

Hello 패킷은 EIGRP의 **심장 박동** 과 같습니다. 라우터는 주기적으로 Hello 패킷을 전송하여 "나는 여기 있고, 정상 동작 중입니다"라고 알립니다.

| 링크 타입 | Hello 간격 | Hold Time |
|----------|-----------|-----------|
| 고속 링크 (T1 이상) | 5초 | 15초 |
| 저속 링크 (T1 미만) | 60초 | 180초 |

**Hold Time** 은 중요한 개념입니다. 이 시간 동안 Hello를 수신하지 못하면 해당 이웃이 다운된 것으로 간주합니다. 예를 들어, Hold Time이 15초이면 Hello 패킷을 3번(5초 × 3) 연속으로 놓치면 이웃 관계가 해제됩니다.

왜 저속 링크에서 Hello 간격이 더 긴 걸까요? 저속 링크는 대역폭이 제한되어 있습니다. 5초마다 Hello를 보내면 귀중한 대역폭을 낭비하게 됩니다. 따라서 60초로 늘려 대역폭을 절약합니다.

### Update 패킷 - 라우팅 정보의 전달자

Update 패킷은 실제 라우팅 정보를 담고 있습니다.

**동작 방식:**
- 초기 이웃 형성 시: 전체 라우팅 정보 전송
- 이후:**변화 발생 시에만** 전송

이것이 EIGRP의 효율성 비결입니다. RIP은 30초마다 전체 테이블을 보내지만, EIGRP는 필요할 때만 변경된 정보만 보냅니다.

### Query 패킷 - 도움을 요청하는 패킷

Query 패킷은 특별한 상황에서 사용됩니다. 라우터가 목적지로 가는 경로를 잃었고, 백업 경로도 없을 때 이웃들에게 "혹시 이 목적지로 가는 경로를 알고 있습니까?"라고 질문합니다.

### Reply 패킷 - Query에 대한 응답

Query를 받은 라우터는 Reply로 응답합니다. "예, 저는 그 목적지로 가는 경로가 있습니다" 또는 "아니요, 저도 모릅니다"라고 답합니다.

### ACK (Acknowledgment) 패킷 - 수신 확인

Update, Query, Reply 패킷은 중요한 정보를 담고 있습니다. 이 패킷들이 제대로 전달되었는지 확인이 필요합니다. ACK 패킷이 그 역할을 합니다.

### 신뢰성 있는 전송 vs 신뢰성 없는 전송

| 패킷 타입 | 전송 방식 | ACK 필요 | 이유 |
|----------|----------|---------|------|
| Hello | Unreliable | X | 주기적으로 전송되므로 손실되어도 문제없음 |
| ACK | Unreliable | X | ACK에 대한 ACK는 무한 루프 발생 |
| Update |**Reliable**| O | 라우팅 정보 손실은 심각한 문제 |
| Query |**Reliable**| O | 경로 질의 손실은 수렴 지연 초래 |
| Reply |**Reliable**| O | 응답 손실은 SIA 문제 발생 |

>**참고:**Reliable 패킷은 **RTP(Reliable Transport Protocol)** 를 사용합니다. 이것은 TCP가 아닌 EIGRP 자체 신뢰성 메커니즘입니다. EIGRP가 IP 프로토콜 88을 직접 사용하면서도 신뢰성을 확보하는 방법입니다.

---

## 3. EIGRP의 3가지 테이블 - 정보 저장 구조

EIGRP 라우터는 3가지 테이블을 유지합니다. 각 테이블의 역할과 관계를 이해하면 EIGRP의 동작을 명확하게 파악할 수 있습니다.

### 1) Neighbor Table - 누구와 대화하고 있는가

```
Router# show ip eigrp neighbors

EIGRP-IPv4 Neighbors for AS(100)
H   Address         Interface       Hold Uptime   SRTT   RTO  Q  Seq
                                    (sec)         (ms)       Cnt Num
0   192.168.1.2     Gi0/0             12 00:05:23   10   100  0  15
1   192.168.2.2     Gi0/1             11 00:03:45   15   100  0  12
```

Neighbor Table은 **현재 대화 중인 EIGRP 이웃 목록** 입니다.

| 필드 | 설명 | 중요도 |
|------|------|--------|
| H | 핸들 (이웃 번호) | 내부 관리용 |
| Address | 이웃의 IP 주소 | 통신 대상 |
| Hold | 남은 Hold Time | 이웃 상태 모니터링 |
| SRTT | Smooth Round Trip Time | 응답 시간 측정 |
| Q Cnt | Queue 대기 패킷 수 |**0이 정상, 높으면 문제**|

**Q Cnt(Queue Count)** 가 0이 아니면 문제가 있다는 신호입니다. 이웃에게 보내야 할 패킷이 큐에 쌓여 있다는 의미이기 때문입니다. 링크 문제나 이웃 라우터의 처리 지연을 의심해야 합니다.

### 2) Topology Table - 모든 경로 정보 저장소

```
Router# show ip eigrp topology

EIGRP-IPv4 Topology Table for AS(100)
Codes: P - Passive, A - Active, U - Update, Q - Query, R - Reply

P 10.1.1.0/24, 1 successors, FD is 28160
        via 192.168.1.2 (28160/2816), GigabitEthernet0/0
        via 192.168.2.2 (30720/2816), GigabitEthernet0/1
```

Topology Table은 이웃으로부터 수신한 **모든 경로 정보** 를 저장합니다. 최적 경로뿐만 아니라 백업 경로 후보들도 여기에 있습니다.

출력에서 중요한 부분을 해석해 보겠습니다:
-**P(Passive)**= 정상 상태. 경로가 안정적임
-**A(Active)**= Query를 전송하고 Reply를 기다리는 중. 경로를 찾는 과정임

괄호 안의 숫자 **(28160/2816)** 는 무엇일까요?
- 첫 번째 숫자(28160):**FD(Feasible Distance)**- 자신의 라우터에서 목적지까지의 총 거리
- 두 번째 숫자(2816):**RD(Reported Distance)**- 이웃이 광고한 목적지까지의 거리

이 개념은 DUAL 알고리즘에서 매우 중요하므로 다음 섹션에서 자세히 다루겠습니다.

### 3) Routing Table - 최종 선택된 경로

```
Router# show ip route eigrp

D    10.1.1.0/24 [90/28160] via 192.168.1.2, 00:05:23, GigabitEthernet0/0
D    10.2.2.0/24 [90/30720] via 192.168.1.2, 00:05:23, GigabitEthernet0/0
```

Routing Table에는 Topology Table에서 선택된 **최적 경로(Successor)만** 저장됩니다. 이 경로가 실제로 패킷 전달에 사용됩니다.

### 테이블 간의 관계 - 정보의 흐름

```
이웃 발견 (Hello 교환)
        ↓
Neighbor Table에 등록
        ↓
라우팅 정보 교환 (Update 수신)
        ↓
Topology Table에 저장
        ↓
DUAL 알고리즘 계산
        ↓
최적 경로를 Routing Table에 등록
```

이 흐름을 이해하면 EIGRP 문제 해결이 쉬워집니다. 라우팅 문제가 발생하면 역순으로 추적하면 됩니다. Routing Table에 경로가 없다면 Topology Table을 확인하고, Topology Table에도 없다면 Neighbor Table을 확인합니다.

---

## 4. DUAL 알고리즘 - EIGRP의 두뇌

EIGRP의 핵심은 **DUAL(Diffusing Update Algorithm)** 입니다. 이 알고리즘이 EIGRP를 "Advanced"하게 만드는 비결입니다. 루프 없이 빠른 수렴을 가능하게 합니다.

### 핵심 용어 - 반드시 이해해야 할 개념들

#### Feasible Distance (FD) - 나의 관점에서 본 거리

**FD** 는 자신의 라우터에서 목적지까지의 **총 메트릭** 입니다. 자신이 계산한 "이 목적지까지 가는 데 드는 총 비용"입니다.

#### Reported Distance (RD) / Advertised Distance (AD)

**RD** 는 이웃 라우터가 광고한 목적지까지의 거리입니다. 이웃이 "나는 이 목적지까지 이만큼의 거리에 있어"라고 알려주는 값입니다.

### 예시로 이해하기

```
[Router A] ----10---- [Router B] ----20---- [목적지 10.1.1.0/24]
     ↑                     ↑
  우리가 분석할            이웃
    라우터
```

Router A의 관점에서 분석해 보겠습니다:

1. Router B는 목적지까지 거리가 **20** 이라고 광고합니다
2. Router A와 Router B 사이의 링크 비용은 **10** 입니다
3. Router A가 계산한 총 거리 = 10 + 20 =**30**

| 용어 | 값 | 의미 |
|------|-----|------|
|**RD (Reported Distance)**| 20 | Router B가 광고한 거리 |
|**FD (Feasible Distance)**| 30 | Router A에서 목적지까지 총 거리 |

### Successor - 최적의 다음 홉

**Successor** 는 목적지로 향하는 **최적 경로의 다음 홉 라우터** 입니다. FD가 가장 낮은 경로를 제공하는 이웃이 Successor가 됩니다.

위 예시에서 Router B가 유일한 이웃이라면, Router B가 Successor입니다.

### Feasible Successor (FS) - 준비된 백업

**Feasible Successor** 는 **즉시 사용 가능한 백업 경로** 입니다. Successor가 다운되면 FS가 즉시 Successor로 승격됩니다. Query/Reply 과정 없이 **밀리초 단위** 로 전환됩니다.

그러나 모든 대체 경로가 FS가 될 수 있는 것은 아닙니다.**Feasibility Condition(FC)** 을 충족해야 합니다.

### Feasibility Condition (FC) - 루프 방지의 핵심

>**Feasibility Condition: RD < FD**
>
> 이웃이 광고한 거리(RD)가 현재 최적 경로의 거리(FD)보다 **작아야**Feasible Successor 자격이 부여됩니다.

이 조건이 왜 필요한지, 왜 루프를 방지하는지 상세히 설명하겠습니다.

**RD > FD인 경우 - 위험한 상황:**

```
         30              50
[A] ─────────── [B] ─────────── [목적지]
 |                                 |
 |______________70_________________|

A의 최적 경로: A → B → 목적지 (FD = 80)
B의 RD: 50

만약 A → B 링크가 끊어지면?
A는 직접 경로(70)를 사용하려 할 것입니다.

그런데 B의 RD(50) > A의 FD(80)는 아니지만...
```

더 위험한 예시를 보겠습니다:

```
[A] ────30──── [B] ────20──── [목적지]
 |              |
 |              |
 └────10───────┘

A의 현재 FD = 50 (A→B→목적지: 30+20)
A에서 다른 경로를 찾으려 할 때...

만약 B가 A를 통해 목적지로 가는 경로를 광고한다면?
B의 RD = 60 (B→A→B→목적지: 10+50 = 무한루프!)
```

FC(RD < FD)는 이러한 루프를 방지합니다. 이웃의 RD가 현재 FD보다 작다는 것은 **그 이웃이 나를 거치지 않고 독립적으로 목적지에 도달할 수 있음** 을 보장합니다.

**RD < FD인 경우 - 안전한 백업:**

```
         30              20
[A] ─────────── [B] ─────────── [목적지]
 |                                 |
 └──────────────40────────[C]──10──┘

A의 최적 경로: A → B → 목적지 (FD = 50)
C의 RD: 10

C의 RD(10) < A의 FD(50) → C는 Feasible Successor!
```

C의 RD가 10이라는 것은 C가 A를 거치지 않고 목적지까지 10의 거리로 도달할 수 있다는 의미입니다. 따라서 A가 C를 사용해도 루프가 발생하지 않습니다.

---

## 5. EIGRP 수렴 과정 - 장애 발생 시 대응

### Case 1: Feasible Successor가 존재할 때 - 즉각 전환

```
Successor 장애 발생
      ↓
FS 존재 여부 확인 → 존재함!
      ↓
FS가 즉시 Successor로 승격
      ↓
수렴 완료 (밀리초 단위)
```

이것이 EIGRP가 빠른 이유입니다. 백업 경로가 이미 준비되어 있으므로 계산이 필요 없습니다. 단순히 Topology Table에서 Routing Table로 경로를 복사하면 됩니다.

### Case 2: Feasible Successor가 없을 때 - Query 발생

```
Successor 장애 발생
      ↓
FS 존재 여부 확인 → 없음
      ↓
해당 경로가 Active 상태로 전환
      ↓
모든 이웃에게 Query 전송
"혹시 10.1.1.0/24로 가는 경로 알고 있습니까?"
      ↓
이웃들이 Reply로 응답
"예, 있습니다" 또는 "아니요, 저도 Query 전파합니다"
      ↓
모든 이웃으로부터 Reply 수신
      ↓
새 Successor 선출 (또는 경로 없음 확정)
      ↓
Passive 상태 복귀
```

이 과정은 Query가 네트워크 전체로 퍼질 수 있어 시간이 걸립니다. 이것이 **Feasible Successor를 확보하는 것이 중요한 이유** 입니다.

### Stuck In Active (SIA) 문제 - 응답이 없으면?

```
[Router A] ---Query--→ [Router B] ---Query--→ [Router C]
                                                   |
                                              (응답 없음)
                                                   ↓
                                              3분 경과
                                                   ↓
                                           SIA 발생!
                                        이웃 관계 해제
```

기본 **SIA 타이머는 3분 ** 입니다. 이 시간 내에 Reply를 수신하지 못하면 해당 이웃과의 관계가**강제로 해제** 됩니다. 이는 심각한 네트워크 불안정을 초래할 수 있습니다.

**SIA가 발생하는 원인:**
1. 이웃 라우터의 CPU 과부하
2. 네트워크 구간의 패킷 손실
3. Query가 너무 넓게 퍼지는 대규모 네트워크

>**실무 대응:**SIA 문제가 빈번하면 네트워크 설계를 재검토해야 합니다. Query 범위를 줄이기 위해 ** 요약(Summarization)**이나 **Stub 설정** 을 고려해야 합니다.

---

## 6. EIGRP 메트릭 계산 - 경로 비용 산정

EIGRP는 기본적으로 **대역폭(Bandwidth)** 과 **지연(Delay)** 을 사용하여 메트릭을 계산합니다.

### K 값 (가중치) - 메트릭 요소의 비중

| K 값 | 항목 | 기본값 | 설명 |
|------|------|--------|------|
| K1 | Bandwidth |**1**| 사용됨 |
| K2 | Load | 0 | 사용 안 함 |
| K3 | Delay |**1**| 사용됨 |
| K4 | Reliability | 0 | 사용 안 함 |
| K5 | MTU | 0 | 사용 안 함 |

왜 Load와 Reliability는 기본적으로 사용하지 않을까요? 이 값들은 **동적으로 변하기 ** 때문입니다. 트래픽 상황에 따라 Load가 변하면 메트릭도 변하고, 메트릭이 변하면 경로가 바뀌고, 경로가 바뀌면 다시 Load가 변합니다. 이는**라우팅 불안정** 을 초래합니다.

반면 Bandwidth와 Delay는 인터페이스의 **정적인 속성** 입니다. 관리자가 변경하지 않는 한 일정합니다.

### 메트릭 공식 (기본 K 값 사용 시)

```
Metric = 256 × ( 10^7 / 최소 대역폭(Kbps) + 총 지연 / 10 )
```

-**최소 대역폭**: 경로상 가장 낮은 대역폭 (병목 구간)
-**총 지연**: 경로상 모든 지연의 합 (10μs 단위)

왜 "최소" 대역폭을 사용할까요? 네트워크 경로는 체인과 같습니다. 아무리 다른 링크가 빨라도 가장 느린 링크가 전체 속도를 제한합니다. 고속도로에서 한 구간만 공사 중이면 전체 통행 시간이 늘어나는 것과 같습니다.

### 계산 예시

```
[Router A] ----Gi (1Gbps, 10μs)---- [Router B] ----Fa (100Mbps, 100μs)---- [목적지]
```

**계산 과정:**

1단계: 최소 대역폭 찾기
- GigabitEthernet: 1Gbps = 1,000,000 Kbps
- FastEthernet: 100Mbps = 100,000 Kbps
- 최소 =**100,000 Kbps**

2단계: 총 지연 계산
- Gi 지연: 10 (10μs 단위)
- Fa 지연: 100 (10μs 단위)
- 총 지연 =**110**

3단계: 공식 대입
```
Metric = 256 × ( 10,000,000 / 100,000 + 110 / 10 )
       = 256 × ( 100 + 11 )
       = 256 × 111
       = 28,416
```

### 인터페이스별 기본값

| 인터페이스 | 대역폭 | 지연 |
|-----------|--------|------|
| Ethernet | 10 Mbps | 1,000 μs |
| FastEthernet | 100 Mbps | 100 μs |
| GigabitEthernet | 1 Gbps | 10 μs |
| Serial | 1.544 Mbps | 20,000 μs |

Serial 링크의 지연이 매우 높다는 점에 주목하십시오. 이는 WAN 링크의 특성을 반영한 것입니다. 따라서 EIGRP는 자연스럽게 Serial보다 Ethernet 경로를 선호하게 됩니다.

---

## 7. EIGRP 설정 - 실습

### 기본 설정

```
Router(config)# router eigrp 100
Router(config-router)# network 192.168.1.0
Router(config-router)# network 10.0.0.0
Router(config-router)# no auto-summary
```

각 명령의 의미를 설명하겠습니다.

**router eigrp 100**
- 100은 **AS(Autonomous System) 번호** 입니다
- EIGRP는 **동일한 AS 번호를 가진 라우터 간에만** 정보를 교환합니다
- 다른 AS 번호를 가진 라우터와는 이웃 관계가 형성되지 않습니다

**network 명령**
- 해당 네트워크 범위에 속하는 인터페이스에서 EIGRP를 활성화합니다
- 또한 해당 네트워크를 EIGRP로 광고합니다

**no auto-summary**
- 클래스풀 경계에서의 자동 요약을 비활성화합니다
- 현대 네트워크에서는 거의 항상 이 명령을 사용합니다
- 자동 요약은 서브넷 정보 손실을 초래할 수 있습니다

### 와일드카드 마스크로 정밀하게 설정

```
Router(config-router)# network 192.168.1.0 0.0.0.255
```

와일드카드 마스크를 사용하면 **특정 인터페이스만**EIGRP에 참여시킬 수 있습니다. 이는 보안과 효율성 측면에서 권장됩니다.

### Passive Interface - 불필요한 Hello 차단

```
Router(config-router)# passive-interface GigabitEthernet0/0
```

```
[Router] --- Gi0/0 --- [PC 네트워크]
               ↑
         passive-interface 적용
         (EIGRP 이웃이 없는 네트워크)
```

PC 네트워크에는 EIGRP를 실행하는 라우터가 없습니다. 그러나 network 명령으로 해당 네트워크를 포함시키면 Hello 패킷이 계속 전송됩니다. 이는 불필요한 트래픽입니다.

passive-interface를 설정하면:
- 해당 인터페이스로 Hello 패킷을 **전송하지 않음**
- 그러나 해당 네트워크는 여전히 **EIGRP로 광고됨**

### 수동 요약 (Manual Summarization)

```
Router(config-if)# ip summary-address eigrp 100 192.168.0.0 255.255.252.0
```

| 원래 네트워크 | 요약 후 |
|--------------|---------|
| 192.168.0.0/24 | |
| 192.168.1.0/24 | →**192.168.0.0/22**|
| 192.168.2.0/24 | |
| 192.168.3.0/24 | |

요약의 장점:
1.**라우팅 테이블 축소**: 4개 엔트리가 1개로
2.**Query 범위 제한**: SIA 문제 예방
3.**네트워크 안정성 향상**: 세부 경로 변화가 요약 경로에 영향 없음

>**EIGRP의 장점:**EIGRP는 ** 모든 라우터에서 요약이 가능**합니다. OSPF는 ABR 또는 ASBR에서만 요약할 수 있습니다. 이는 네트워크 설계의 유연성을 높여줍니다.

---

## 8. Unequal Cost Load Balancing - EIGRP만의 특별한 기능

대부분의 라우팅 프로토콜은 **동일 메트릭 경로에서만 ** 부하 분산을 수행합니다. 그러나 EIGRP는**메트릭이 다른 경로에서도** 부하 분산이 가능합니다.

### 일반 라우팅 프로토콜의 부하 분산

```
경로 A: 메트릭 100 → 사용
경로 B: 메트릭 100 → 사용
경로 C: 메트릭 150 → 미사용 (메트릭이 다름)
```

### EIGRP의 Variance 기능

```
Router(config-router)# variance 2
```

**FD의 2배까지** 부하 분산에 포함시킵니다.

### Variance 계산 예시

```
최적 경로 (Successor): FD = 10,000
백업 경로 1: 메트릭 = 15,000
백업 경로 2: 메트릭 = 25,000
```

**variance 2 설정 시:**

허용 범위 = FD × variance = 10,000 × 2 =**20,000**

- 백업 경로 1 (15,000): 20,000 이하 →**부하 분산에 포함**
- 백업 경로 2 (25,000): 20,000 초과 →**제외**

### 필수 조건 - 두 가지 모두 충족해야 함

| 조건 | 설명 |
|------|------|
| FC 충족 |**Feasible Successor** 여야 함 (RD < FD) |
| Variance 범위 | 메트릭이 **FD × variance 이하**|

중요한 점은 variance만 설정한다고 모든 경로가 부하 분산에 참여하는 것이 아닙니다. 먼저 **Feasibility Condition을 충족** 해야 합니다. 루프 가능성이 있는 경로는 variance 설정과 무관하게 사용되지 않습니다.

### 부하 분산 비율

부하 분산에 참여하는 경로들은 메트릭에 **반비례** 하여 트래픽을 처리합니다.

```
경로 A: 메트릭 10,000 → 트래픽 비율 2 (더 많이)
경로 B: 메트릭 20,000 → 트래픽 비율 1 (더 적게)
```

이를 통해 빠른 경로에 더 많은 트래픽을 보내면서도 느린 경로의 대역폭도 활용할 수 있습니다.

---

## 9. EIGRP Named Mode - 현대적인 설정 방식

전통적인 EIGRP 설정 방식(Classic Mode)은 IPv4와 IPv6를 별도로 관리해야 했습니다. Named Mode는 이를 통합합니다.

### Classic Mode

```
router eigrp 100
 network 10.0.0.0
 no auto-summary
```

### Named Mode

```
router eigrp CORP
 address-family ipv4 unicast autonomous-system 100
  network 10.0.0.0
  no auto-summary
 exit-address-family
 address-family ipv6 unicast autonomous-system 100
 exit-address-family
```

**Named Mode의 장점:**

| 장점 | 설명 |
|------|------|
| IPv4/IPv6 통합 관리 | 하나의 프로세스에서 관리 |
| 계층적 구조 | 설정의 논리적 구분 |
| 새로운 기능 지원 | Wide Metrics 등 |

"CORP"는 의미 있는 이름을 사용할 수 있어 설정의 가독성이 높아집니다. 실무에서 여러 EIGRP 프로세스를 운영할 때 유용합니다.

---

## 10. EIGRP 검증 명령어 - 상태 확인 방법

```
! 이웃 확인 - 가장 먼저 확인해야 할 것
Router# show ip eigrp neighbors

! 토폴로지 테이블 - Successor와 FS 확인
Router# show ip eigrp topology

! 모든 경로 보기 - FC 미충족 경로까지 포함
Router# show ip eigrp topology all-links

! EIGRP 학습 경로 - 라우팅 테이블에 설치된 경로
Router# show ip route eigrp

! EIGRP 설정 요약 - K 값, AS 번호 등
Router# show ip protocols

! 인터페이스별 EIGRP 상태
Router# show ip eigrp interfaces
```

문제 해결 시 확인 순서:
1.**show ip eigrp neighbors**: 이웃 관계가 정상인가?
2.**show ip eigrp topology**: 경로 정보를 수신했는가?
3.**show ip route eigrp**: 라우팅 테이블에 설치되었는가?

---

## 정리

| 개념 | 핵심 내용 |
|------|----------|
|**프로토콜 유형**| Advanced Distance Vector (Hybrid) |
|**DUAL 알고리즘**| 루프 없이 빠른 수렴을 보장 |
|**Successor**| 최적 경로의 다음 홉 |
|**Feasible Successor**| 백업 경로 (RD < FD 조건 충족) |
|**Feasibility Condition**| RD < FD - 루프 방지의 핵심 |
|**메트릭**| 기본: Bandwidth + Delay |
|**Variance**| Unequal Cost Load Balancing 허용 |
|**요약**| 모든 라우터에서 가능 (OSPF와 차이점) |
|**패킷**| Hello, Update, Query, Reply, ACK |

EIGRP의 강점은 **빠른 수렴 속도** 와 **유연한 설정** 입니다. Feasible Successor를 미리 확보하면 장애 발생 시 밀리초 단위로 경로를 전환할 수 있습니다. 그러나 이는 Cisco 환경에서 주로 사용된다는 제약이 있습니다.

다음 챕터에서는 **OSPF** 를 다룹니다. OSPF는 EIGRP와 달리 **Link State** 방식으로 동작하며, 멀티벤더 환경에서 표준으로 사용됩니다. 두 프로토콜의 차이점을 비교하면서 학습하면 더욱 효과적입니다.

---

## 연습 문제

이 챕터의 연습 문제를 풀어보세요.

[연습 문제 풀기 →](/quiz?category=EIGRP&examPart=Practice)
