# Chapter 9: Advanced OSPF (OSPF 심화)

이전 장에서 OSPF의 기본 개념을 학습하였습니다. 본 장에서는 OSPF의 심화 내용을 다루겠습니다.

**Stub Area**,**NSSA**,**Virtual Link** 등의 개념은 처음에는 복잡하게 느껴질 수 있습니다. 그러나 이 기능들이 **왜 필요한지**,** 어떤 문제를 해결하는지**를 이해하면 자연스럽게 따라올 수 있습니다.

본 장의 핵심 질문은 다음과 같습니다:**"어떻게 하면 LSDB 크기를 줄이고 라우터의 부담을 경감할 수 있는가?"**

---

## 1. OSPF Area 타입 - 다양한 Area가 필요한 이유

OSPF에서 Area를 분할하는 목적은 **LSA를 감소시키고 라우터의 처리 부담을 경감** 하기 위함입니다. 그러나 기본 Area(Normal Area)만으로는 부족한 상황이 있습니다.

### 실제 시나리오로 이해하기

회사 본사(Area 0)에 연결된 지사(Area 1)가 있다고 가정합니다. 이 지사에는 내부 네트워크만 존재하며,**외부 인터넷 연결은 본사를 통해서만** 이루어집니다.

```
[인터넷]
    |
 [ASBR] ← BGP로 인터넷 경로 수천 개 수신
    |
[Area 0 - 본사]
    |
  [ABR]
    |
[Area 1 - 지사]
   /  \
 [R1] [R2] ← 작은 라우터들
```

이 상황에서 지사의 R1, R2가 전 세계 인터넷 경로 정보(Type 5 LSA)를 **모두 보유해야 할까요?**

인터넷 라우팅 테이블에는 수십만 개의 경로가 있습니다. 이 모든 정보가 지사의 작은 라우터들에게 전달되면:
1.**메모리 부족**: 작은 라우터는 이 정보를 저장할 수 없음
2.**CPU 과부하**: SPF 계산에 과도한 리소스 소모
3.**불필요한 정보**: 어차피 인터넷으로 나가는 경로는 본사 방향 하나뿐

**해결책 **: 지사 라우터들에게는 "외부로 나가려면 본사 방향으로 가라"는** 기본 경로(0.0.0.0/0)**만 알려주면 됩니다.

이러한 이유로 **Stub Area** 와 같은 특수한 Area 타입이 개발되었습니다.

### Area 타입 비교 - 한눈에 보기

| Area 타입 | Type 3 | Type 5 | Type 7 | ASBR 가능 | 기본 경로 |
|----------|--------|--------|--------|-----------|----------|
|**Normal**| O | O | X | O | 선택적 |
|**Stub**| O |**X**| X |**X**| 자동 주입 |
|**Totally Stubby**|**X**|**X**| X |**X**| 자동 주입 |
|**NSSA**| O |**X**|**O**|**O**| 선택적 |
|**Totally NSSA**|**X**|**X**|**O**|**O**| 자동 주입 |

이 표를 외우려고 하지 마십시오. 각 Area 타입이 **해결하려는 문제** 를 이해하면 자연스럽게 기억됩니다.

>**암기 포인트:**
> -**Stub 계열**= Type 5(외부 경로)를 차단합니다
> -**Totally 계열**= Type 3(다른 Area 경로)도 차단합니다
> -**NSSA**= Type 7을 통해 외부 경로 재배포를 허용합니다

---

## 2. Stub Area - 외부 경로 차단

**Stub Area** 는 **Type 5 LSA(외부 경로)** 를 차단하는 Area입니다.

### Stub Area가 해결하는 문제

앞서 설명한 지사 시나리오를 다시 보겠습니다. 지사 라우터들은 인터넷 경로(Type 5)가 필요 없습니다. 모든 외부 트래픽은 본사 방향으로 보내면 됩니다.

### 동작 방식

```
인터넷 ─── [ASBR] ─── [Area 0] ─── [ABR] ─── [Stub Area]
                                        │
                                   Type 5 차단!
                                   대신 기본 경로 주입
```

**Stub Area에서 일어나는 일:**
1. ABR이 Type 5 LSA를 **차단** 합니다 (Area 내부로 전달하지 않음)
2. ABR이 **기본 경로(0.0.0.0/0)** 를 Type 3 LSA로 **자동 주입** 합니다
3. Stub Area 내부 라우터들은 외부로 나가는 모든 트래픽을 ABR로 보냅니다

### 설정 방법

**ABR과 Stub Area 내 모든 라우터에서 설정해야 합니다:**

```
Router(config-router)# area 1 stub
```

>**중요:**Stub Area 내의 ** 모든 라우터**에서 stub 설정을 해야 합니다. 하나라도 누락되면 Hello 패킷의 옵션 비트가 불일치하여 이웃 관계가 형성되지 않습니다.

### Stub Area의 제약사항과 이유

| 제약 | 이유 |
|------|------|
| ASBR이 될 수 없음 | Type 5를 차단하므로 외부 경로 재배포 불가 |
| Virtual Link 통과 불가 | Stub을 Transit Area로 사용할 수 없음 |
| 모든 라우터 동일 설정 | Hello 옵션 비트 불일치 방지 |

ASBR이 될 수 없다는 제약은 큰 제한처럼 보입니다. Stub Area 내에서 외부 네트워크(예: 파트너사 연결)를 연결해야 한다면 어떻게 해야 할까요? 이 문제를 해결하는 것이 **NSSA** 입니다. 뒤에서 다루겠습니다.

### 설정 예시

```
         [인터넷]
             │
          [ASBR]
             │
        ═══[Area 0]═══
             │
          [ABR] ← area 1 stub
             │
        [Stub Area 1]
          /     \
       [R1]     [R2] ← 둘 다 area 1 stub
```

```
! ABR 설정
Router(config)# router ospf 1
Router(config-router)# area 1 stub

! Stub Area 내부 라우터 설정
Router(config)# router ospf 1
Router(config-router)# area 1 stub
```

---

## 3. Totally Stubby Area - 더 강력한 LSA 차단

Stub Area는 **Type 5만 ** 차단합니다. 그런데**Type 3(다른 Area의 네트워크 정보)** 도 필요 없는 경우가 있습니다.

### Totally Stubby Area가 필요한 상황

지사에는 단순히 본사로 가는 경로만 필요합니다. Area 0의 세부 네트워크 정보(Type 3)도 필요 없습니다. "외부로 나가려면 ABR 방향으로"라는 정보만 있으면 충분합니다.

### 동작 방식

```
[Area 0] ─── [ABR] ─── [Totally Stubby Area]
                 │
            Type 3 차단!
            Type 5 차단!
            오직 기본 경로만!
```

**Totally Stubby Area의 LSDB 내용:**
- Type 1, 2: Area 내부 정보만 존재
- Type 3:**차단**(ABR이 주입한 기본 경로 0.0.0.0/0만 존재)
- Type 5:**차단**(Stub이므로)

### 설정 방법

**ABR에서만 `no-summary` 추가:**

```
Router(config-router)# area 1 stub no-summary
```

>**참고:**ABR에서만 `no-summary`를 추가합니다. Area 내부 라우터는 `stub`만 설정하면 됩니다. ABR이 Type 3를 전달하지 않으면 내부 라우터들은 자연스럽게 받지 못합니다.

### Totally Stubby Area의 효과

**결과:** 외부로 나가는 모든 트래픽은 **기본 경로** 를 사용합니다.

| 항목 | Stub Area | Totally Stubby |
|------|-----------|----------------|
| Type 1, 2 | O | O |
| Type 3 | O |**X**(기본 경로만) |
| Type 5 | X | X |
| 라우팅 테이블 크기 | 작음 |**매우 작음**|

>**참고:**Totally Stubby는 **Cisco 전용** 기능입니다. 표준이 아니므로 멀티벤더 환경에서는 주의가 필요합니다.

---

## 4. NSSA (Not-So-Stubby Area) - Stub인데 ASBR이 필요할 때

### 문제 상황

지사 네트워크에서 외부 인터넷 연결은 본사를 통해서만 처리하고 싶습니다. 따라서 **Stub Area** 로 구성하려고 합니다.

그런데 이 지사에 **파트너 회사 네트워크** 가 직접 연결되어 있습니다. 파트너사 네트워크를 OSPF로 재배포해야 합니다.

```
[인터넷]
    |
[Area 0]
    |
  [ABR]
    |
[지사 Area]
   /  \
 [R1] [파트너사 연결] ← 이 경로를 OSPF로 광고해야 함
```

**딜레마:**
- Stub Area로 설정하면 Type 5를 차단하여 인터넷 경로가 안 들어옴 (좋음)
- 그러나 **Stub Area에서는 ASBR이 될 수 없음**(문제!)

### 해결책: NSSA

이러한 상황에서 사용하는 것이 **NSSA (Not-So-Stubby Area)** 입니다.

"Not-So-Stubby"라는 이름의 의미:**"완전한 Stub은 아님"**- Stub처럼 Type 5를 차단하지만, 자체적으로 외부 경로를 생성할 수 있습니다.

### NSSA의 핵심: Type 7 LSA

NSSA의 비결은 **Type 7 LSA** 입니다.

```
인터넷 ─── [ASBR] ─── [Area 0] ─── [ABR] ─── [NSSA] ─── [파트너사]
                                        │           │
                                   Type 5 차단  Type 7 생성
                                        │           │
                                        └─── Type 7 → Type 5 변환 ───┘
```

**Type 7 LSA의 특징:**

1. NSSA 내부의 ASBR은 외부 경로를 **Type 7** 로 광고합니다 (Type 5 대신)
2. Type 7은 **NSSA 내에서만** 유효합니다
3. ABR이 Type 7을 **Type 5로 변환** 하여 Area 0으로 전달합니다

**왜 Type 7을 사용하는가?**

Type 5는 Stub 계열 Area에서 차단됩니다. 그래서 새로운 LSA 타입(Type 7)을 만들어서 NSSA 내부에서만 사용하는 것입니다. ABR에서 Type 5로 변환되므로 다른 Area에서는 일반적인 외부 경로처럼 보입니다.

### 설정 방법

```
! ABR과 NSSA 내 모든 라우터에서
Router(config-router)# area 1 nssa

! NSSA 내 ASBR에서 외부 경로 재배포
Router(config-router)# redistribute connected subnets
```

### NSSA의 기본 경로 주의점

**NSSA는 Stub과 달리 기본 경로가 자동으로 주입되지 않습니다.**

Stub Area에서는 ABR이 자동으로 0.0.0.0/0을 주입합니다. 그러나 NSSA에서는 **명시적으로 설정** 해야 합니다.

```
Router(config-router)# area 1 nssa default-information-originate
```

왜 이런 차이가 있을까요? NSSA는 자체 ASBR을 가질 수 있으므로, 기본 경로가 항상 필요한 것은 아닙니다. 관리자가 필요에 따라 결정하도록 한 것입니다.

---

## 5. Totally NSSA - NSSA와 Totally Stubby의 결합

NSSA이면서 **Type 3도 차단** 하고 싶다면:

```
Router(config-router)# area 1 nssa no-summary
```

**결과:**

| LSA 타입 | 동작 |
|----------|------|
| Type 3 | 차단 (기본 경로만 허용) |
| Type 5 | 차단 (NSSA이므로) |
| Type 7 | 허용 (내부 ASBR의 외부 경로) |

Totally NSSA는 라우팅 테이블을 최소화하면서도 내부에서 외부 경로 재배포가 필요한 상황에 적합합니다.

>**참고:**Totally NSSA도 **Cisco 전용** 기능입니다.

---

## 6. Virtual Link - Area 0 연결 문제 해결

### OSPF의 절대적 원칙

>**모든 Area는 Area 0과 물리적으로 연결되어야 합니다.**

그러나 현실에서는 이 조건이 항상 충족되지 않을 수 있습니다.

### Virtual Link가 필요한 상황

**시나리오 1: 네트워크 인수합병**

```
기존 네트워크:
[Area 0] ─── [Area 1]

인수한 회사 네트워크:
[Area 2] ← Area 0과 연결되지 않음!

병합 후:
[Area 0] ─── [Area 1] ─── [Area 2]
                              ↑
                    Area 0과 직접 연결 안 됨
```

**시나리오 2: 설계 오류**

네트워크 확장 과정에서 Area 0과 단절된 Area가 생길 수 있습니다.

### Virtual Link란?

Virtual Link는 **논리적인 Area 0 확장** 입니다. 물리적으로 연결되지 않은 Area를 Area 0과 연결된 것처럼 만듭니다.

```
[Area 0] ─── [ABR1] ─── [Area 1] ─── [ABR2] ─── [Area 2]
                              ^
                              │
                    Virtual Link로 연결!
                    ABR2가 Area 0과 연결된 것처럼 동작
```

Virtual Link를 통해 Area 0이 Area 1을 **통과하여**Area 2까지 확장됩니다. 이때 Area 1을 **Transit Area** 라고 부릅니다.

### 설정 방법

**양쪽 ABR에서 설정:**

```
! ABR1 (Area 0과 Area 1에 연결)
Router(config-router)# area 1 virtual-link 2.2.2.2

! ABR2 (Area 1과 Area 2에 연결)
Router(config-router)# area 1 virtual-link 1.1.1.1
```

**설정 분석:**
- `area 1` = Transit Area (Virtual Link가 통과하는 Area)
- IP 주소 = 상대방의 **Router ID**(IP 주소가 아님에 주의)

### Virtual Link 주의사항

| 주의사항 | 설명 |
|----------|------|
| Transit Area는 Stub 불가 | Stub Area는 Type 5를 차단하므로 Transit으로 사용 불가 |
| 임시 해결책 | Virtual Link는 근본적 해결책이 아님, 장기적으로는 재설계 권장 |
| 상태 확인 | `show ip ospf virtual-links`로 상태 확인 |

**왜 Stub Area가 Transit이 될 수 없는가?**

Virtual Link를 통해 Area 0의 정보가 전달되어야 합니다. 여기에는 Type 5 LSA도 포함될 수 있습니다. Stub Area는 Type 5를 차단하므로 Virtual Link의 목적을 달성할 수 없습니다.

---

## 7. OSPF 경로 요약 (Summarization)

라우팅 테이블을 축소하는 또 다른 방법으로 **경로 요약** 이 있습니다.

### Inter-Area 요약 (ABR에서)

ABR에서 다른 Area로 전달하는 경로를 요약합니다.

```
Router(config-router)# area 1 range 192.168.0.0 255.255.252.0
```

**효과:**

| 원래 경로 | 요약 후 |
|----------|---------|
| 192.168.0.0/24 | |
| 192.168.1.0/24 | →**192.168.0.0/22**|
| 192.168.2.0/24 | |
| 192.168.3.0/24 | |

4개의 Type 3 LSA가 1개로 줄어듭니다.

### External 요약 (ASBR에서)

ASBR에서 외부로 재배포되는 경로를 요약합니다.

```
Router(config-router)# summary-address 10.0.0.0 255.0.0.0
```

### 요약의 장점

1.**라우팅 테이블 축소**: 메모리 절약
2.**SPF 계산 감소**: CPU 부담 경감
3.**네트워크 안정성**: 세부 경로 변화가 요약 경로에 영향 없음
4.**Query 범위 제한**: (EIGRP의 경우)

---

## 8. OSPF 경로 타입과 우선순위

### 경로 타입 코드

라우팅 테이블에서 볼 수 있는 OSPF 경로 코드입니다:

```
O       - Intra-Area (같은 Area 내)
O IA    - Inter-Area (다른 Area에서)
O E1    - External Type 1
O E2    - External Type 2 (기본값)
O N1    - NSSA External Type 1
O N2    - NSSA External Type 2
```

### 우선순위

OSPF는 경로 선택 시 다음 순서로 우선순위를 적용합니다:

```
Intra-Area (O) > Inter-Area (O IA) > External Type 1 (E1) > External Type 2 (E2)
```

**Intra-Area가 가장 우선시되는 이유:**

같은 Area 내의 경로는 **직접 확인한 정보** 입니다. Type 1, 2 LSA로 전체 토폴로지를 알고 있으므로 가장 신뢰할 수 있습니다.

Inter-Area 경로는 ABR이 요약한 정보이고, External 경로는 OSPF 외부에서 온 정보이므로 상대적으로 신뢰도가 낮습니다.

### E1 vs E2 차이 - 메트릭 계산 방식

| 구분 | E1 | E2 |
|-----|-----|-----|
| Metric 계산 | 외부 Cost**+** 내부 Cost | 외부 Cost만 (고정) |
| 용도 | 내부 경로도 고려 필요 시 | 간단한 기본값 |
| 설정 | `metric-type 1` | 기본값 |

**예시로 이해하기:**

```
           20       10
[ASBR] ─────── [R1] ─────── [R2]
  │
외부 Cost = 50
```

**E2 경로의 경우 (기본값):**
- R1에서 본 Cost = 50 (외부 Cost만)
- R2에서 본 Cost = 50 (외부 Cost만, 동일!)

**E1 경로의 경우:**
- R1에서 본 Cost = 50 + 20 = 70
- R2에서 본 Cost = 50 + 20 + 10 = 80

**언제 E1을 사용하는가?**

동일한 목적지로 가는 외부 경로가 여러 개 있을 때, OSPF 내부 거리도 고려하여 더 가까운 ASBR을 선택하고 싶을 때 E1을 사용합니다.

---

## 9. OSPF 인증

보안을 위해 OSPF 패킷에 인증을 설정할 수 있습니다. 인증이 없으면 악의적인 라우터가 네트워크에 연결하여 잘못된 라우팅 정보를 주입할 수 있습니다.

### Plain Text 인증 (Type 1) - 사용 금지

```
Router(config-if)# ip ospf authentication
Router(config-if)# ip ospf authentication-key cisco123
```

**절대 사용하지 마십시오.** 패킷을 캡처하면 암호가 **평문으로 노출** 됩니다. 네트워크 분석 도구로 쉽게 확인할 수 있습니다.

### MD5 인증 (Type 2) - 권장

```
Router(config-if)# ip ospf authentication message-digest
Router(config-if)# ip ospf message-digest-key 1 md5 cisco123
```

MD5 해시를 사용합니다.**암호 자체는 전송되지 않고**, 해시값만 전송됩니다. 수신측에서 동일한 해시값을 계산하여 일치 여부를 확인합니다.

### Area 전체에 인증 설정

```
Router(config-router)# area 0 authentication message-digest
```

이렇게 설정하면 해당 Area의 모든 인터페이스에 인증이 적용됩니다. 인터페이스별로 키를 설정해야 합니다.

---

## 10. OSPF 타이머 조정

### 기본 타이머 변경

```
Router(config-if)# ip ospf hello-interval 5     ! Hello 5초 (기본 10초)
Router(config-if)# ip ospf dead-interval 20    ! Dead 20초 (기본 40초)
```

>**주의:** 타이머는 이웃 간에 **반드시 일치** 해야 합니다. 불일치하면 이웃 관계가 형성되지 않습니다.

### 빠른 장애 감지 - BFD

OSPF 기본 타이머(Hello 10초, Dead 40초)로는 장애 감지에 최대 40초가 걸립니다. 이는 VoIP나 금융 시스템과 같이 **빠른 복구가 필요한 환경** 에서는 너무 깁니다.

**BFD(Bidirectional Forwarding Detection)** 를 사용하면 **밀리초 단위** 의 장애 감지가 가능합니다.

```
Router(config-if)# bfd interval 50 min_rx 50 multiplier 3
Router(config-router)# bfd all-interfaces
```

**설정 분석:**
- `interval 50`: 50ms마다 BFD 패킷 전송
- `min_rx 50`: 최소 50ms 간격으로 수신 기대
- `multiplier 3`: 3번 연속 손실 시 다운 판정

**결과:**50ms × 3 =**150ms** 이내에 장애 감지가 가능합니다.

BFD는 OSPF뿐만 아니라 EIGRP, BGP 등 다른 라우팅 프로토콜과도 함께 사용할 수 있습니다.

---

## 정리

| 개념 | 핵심 내용 |
|------|----------|
|**Stub Area**| Type 5 차단, 기본 경로 자동 주입, ASBR 불가 |
|**Totally Stubby**| Type 3+5 차단, Cisco 전용 |
|**NSSA**| Type 5 대신 Type 7 사용, ASBR 가능 |
|**Totally NSSA**| Type 3 차단 + NSSA, Cisco 전용 |
|**Virtual Link**| Area 0 연결 문제 해결 (임시 방편) |
|**요약**| ABR: `area range` / ASBR: `summary-address` |
|**E1 vs E2**| 내부 Cost 반영 여부 |
|**인증**| MD5 사용 권장 (Plain Text 금지) |
|**BFD**| 밀리초 단위 장애 감지 |

OSPF 심화 기능들의 핵심 목적은 **LSDB 크기 최소화 ** 와**네트워크 확장성 확보** 입니다. 각 기능이 어떤 문제를 해결하는지 이해하면 언제 어떤 설정을 적용해야 하는지 판단할 수 있습니다.

다음 장에서는 **OSPFv3 (IPv6용 OSPF)** 에 대해 학습하겠습니다. IPv6 환경에서 OSPF가 어떻게 동작하는지, OSPFv2와 무엇이 다른지 살펴보겠습니다.

---

## 연습 문제

이 챕터의 연습 문제를 풀어보세요.

[연습 문제 풀기 →](/quiz?category=Advanced%20OSPF&examPart=Practice)
