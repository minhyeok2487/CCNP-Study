# Chapter 1: Packet Forwarding (패킷 포워딩)

이 장에서는 라우터와 스위치가 패킷을 어떻게 전달하는지, 그 내부 메커니즘을 학습합니다. **CEF(Cisco Express Forwarding)**, 하드웨어/소프트웨어 스위칭의 차이, 그리고 패킷 포워딩의 최적화 방법을 다룹니다.

네트워크 엔지니어로서 "패킷이 어떻게 전달되는지" 이해하는 것은 필수입니다. 트러블슈팅할 때 "왜 이 패킷이 여기로 갔지?", "왜 이렇게 느리지?"라는 질문에 답하려면 패킷 포워딩의 동작 원리를 정확히 알아야 합니다.

---

## 1. 패킷 포워딩의 기본 개념

### 스위칭 vs 라우팅

먼저 용어를 정리하겠습니다. 네트워크에서 "스위칭"이라는 단어는 두 가지 의미로 사용됩니다:

**1. Layer 2 Switching (일반적 의미)**
- MAC 주소 기반 프레임 전달
- 같은 VLAN/브로드캐스트 도메인 내

**2. Packet Switching (포워딩 관점)**
- 라우터/L3 스위치 내부에서 패킷을 처리하는 방식
- Process Switching, Fast Switching, CEF 등

이 장에서는 두 번째 의미, 즉 **패킷을 처리하고 전달하는 내부 메커니즘** 을 다룹니다.

### 패킷 포워딩 과정

라우터가 패킷을 수신하면 다음 과정을 거칩니다:

```
패킷 수신 → L2 헤더 검사 → L3 헤더 검사 → 라우팅 테이블 조회
    → Next-Hop 결정 → L2 헤더 재작성 → 패킷 전송
```

이 과정에서 가장 시간이 많이 걸리는 부분은 **라우팅 테이블 조회** 입니다. 테이블에 수십만 개의 경로가 있을 수 있고, 각 패킷마다 이를 검색해야 합니다.

---

## 2. 패킷 스위칭 방식의 발전

### Process Switching (프로세스 스위칭)

**가장 오래된 방식** 입니다. 모든 패킷을 CPU가 직접 처리합니다.

```
[패킷 도착]
     │
     ▼
[CPU 인터럽트]
     │
     ▼
[라우팅 테이블 검색]
     │
     ▼
[ARP 테이블 검색]
     │
     ▼
[L2 헤더 생성]
     │
     ▼
[패킷 전송]
```

**문제점:**
- 매우 느림 (초당 수천 패킷 수준)
- CPU 부하 높음
- 현대 네트워크에서는 사용 불가

**언제 사용되나?**

아직도 일부 특수한 경우에 사용됩니다:
- 디버깅 (`debug ip packet`)
- 암호화가 필요한 트래픽 (일부)
- Policy Routing의 일부 케이스

### Fast Switching (패스트 스위칭)

**캐시 기반 방식** 입니다. 첫 패킷만 CPU가 처리하고, 결과를 캐시에 저장합니다.

```
첫 번째 패킷:
[패킷 도착] → [CPU 처리] → [결과 캐시에 저장] → [전송]

두 번째 이후 패킷:
[패킷 도착] → [캐시 조회] → [전송]
```

**캐시 구조:**
```
목적지 IP | Next-Hop | 출구 인터페이스 | L2 헤더 정보
192.168.1.0/24 | 10.1.1.2 | Gi0/0 | 0011.2233.4455
```

**문제점:**
- 캐시 미스 시 여전히 CPU 처리 필요
- 캐시 일관성 유지 어려움
- 부하 분산 비효율 (같은 목적지는 항상 같은 경로)

### CEF (Cisco Express Forwarding)

**현대 Cisco 장비의 기본 포워딩 방식** 입니다. 라우팅 테이블 변경 시 미리 포워딩 정보를 계산해 둡니다.

```
[라우팅 프로토콜] → [라우팅 테이블(RIB)] → [FIB 생성]
       │                                      │
       │                                      ▼
[ARP/인접 정보] ─────────────────────────→ [Adjacency Table]

패킷 도착 → FIB 조회 → Adjacency 조회 → 전송
           (하드웨어)     (하드웨어)
```

**CEF의 핵심 개념:**

| 구성 요소 | 설명 |
|----------|------|
|**FIB (Forwarding Information Base)**| 라우팅 테이블의 최적화된 버전, 포워딩 전용 |
|**Adjacency Table**| Next-Hop의 L2 정보 (MAC 주소 등) 저장 |

---

## 3. CEF 상세 분석

### FIB (Forwarding Information Base)

**FIB** 는 라우팅 테이블(RIB)을 기반으로 생성되는 **포워딩 전용 테이블** 입니다.

**RIB vs FIB 차이:**

| 특성 | RIB (Routing Table) | FIB |
|------|---------------------|-----|
| 목적 | 경로 선택 | 패킷 포워딩 |
| 내용 | 모든 경로 정보 | 최적 경로만 |
| 재귀 조회 | 필요할 수 있음 | 미리 해결됨 |
| 업데이트 | 라우팅 프로토콜에 의해 | RIB 변경 시 자동 |

**재귀 조회 해결:**

```
RIB:
  10.1.1.0/24 via 192.168.1.2
  192.168.1.0/24 via Gi0/0

FIB (재귀 해결됨):
  10.1.1.0/24 → Gi0/0, next-hop 192.168.1.2
```

RIB에서는 10.1.1.0/24로 가려면 먼저 192.168.1.2를 찾고, 다시 192.168.1.0/24를 찾아야 합니다. FIB에서는 이미 최종 결과가 계산되어 있습니다.

**FIB 확인:**

```bash
Router# show ip cef
Prefix               Next Hop             Interface
0.0.0.0/0            192.168.1.1          GigabitEthernet0/0
10.1.1.0/24          192.168.1.2          GigabitEthernet0/0
192.168.1.0/24       attached             GigabitEthernet0/0
```

### Adjacency Table

**Adjacency Table** 은 Next-Hop까지의 **Layer 2 정보** 를 저장합니다.

```bash
Router# show adjacency detail
Protocol Interface                 Address
IP       GigabitEthernet0/0        192.168.1.2(7)
                                   0 packets, 0 bytes
                                   epoch 0
                                   sourced in sev-epoch 0
                                   Encap length 14
                                   0011223344550066778899AABB0800
                                   └─────────────────────────────┘
                                     L2 헤더 (Dst MAC, Src MAC, Type)
```

**Adjacency 상태:**

| 상태 | 설명 |
|------|------|
|**Complete**| L2 정보 있음, 정상 |
|**Incomplete**| ARP 대기 중 |
|**Glean**| 직접 연결된 호스트, ARP 필요 |
|**Null**| Null 라우팅 (패킷 폐기) |
|**Drop**| 폐기 |
|**Punt**| CPU로 전달 |

### CEF 동작 방식

패킷이 도착하면:

```
1. [패킷 수신]
       │
       ▼
2. [FIB Lookup] ─────────────────────→ 목적지 IP로 검색
       │
       ▼
3. [Adjacency 참조] ──────────────────→ Next-Hop의 L2 정보
       │
       ▼
4. [L2 헤더 재작성] ──────────────────→ 새 MAC 주소로 교체
       │
       ▼
5. [출구 인터페이스로 전송]
```

모든 과정이 **하드웨어(ASIC/TCAM)** 에서 처리되어 매우 빠릅니다.

---

## 4. 하드웨어 vs 소프트웨어 스위칭

### 소프트웨어 스위칭

**CPU가 패킷을 처리** 합니다.

```
[인터페이스] → [CPU 메모리] → [CPU 처리] → [CPU 메모리] → [인터페이스]
```

**특징:**
- 유연함 (복잡한 처리 가능)
- 느림 (CPU 속도에 의존)
- 모든 기능 지원

### 하드웨어 스위칭

**전용 칩(ASIC, TCAM)이 패킷을 처리** 합니다.

```
[인터페이스] → [ASIC] → [인터페이스]
              ↓
           [TCAM]
           (테이블 검색)
```

**특징:**
- 매우 빠름 (라인 레이트)
- 기능 제한 (칩에 구현된 것만)
- 테이블 크기 제한 (TCAM 용량)

### TCAM (Ternary Content-Addressable Memory)

**TCAM** 은 동시에 모든 엔트리를 검색할 수 있는 특수 메모리입니다.

**일반 메모리 vs TCAM:**

| 특성 | 일반 메모리 | TCAM |
|------|-----------|------|
| 검색 방식 | 순차적 | 병렬 (동시) |
| 검색 시간 | O(n) | O(1) |
| 비용 | 저렴 | 비쌈 |
| 용도 | 데이터 저장 | 고속 검색 |

**TCAM의 Ternary (3진법):**

| 값 | 의미 |
|---|------|
| 0 | 정확히 0 |
| 1 | 정확히 1 |
| X | Don't Care (0 또는 1) |

이 특성 덕분에 TCAM은 **와일드카드 매칭** 이 가능합니다. ACL, 라우팅 테이블 검색에 이상적입니다.

### 스위치 아키텍처

**Memory 기반 (Shared Memory):**
```
[Port 1] ─┐
[Port 2] ─┼─→ [Shared Memory] ─→ [Switching Logic]
[Port 3] ─┘
```

**Crossbar 기반:**
```
[Port 1] ─────╋─────╋─────╋───→ [Port A]
[Port 2] ─────╋─────╋─────╋───→ [Port B]
[Port 3] ─────╋─────╋─────╋───→ [Port C]
```

**Crossbar** 는 여러 포트 간 동시 통신이 가능하여 더 높은 성능을 제공합니다.

---

## 5. CEF 부하 분산

### Per-Destination Load Balancing

**기본 방식** 입니다. 같은 목적지로 가는 패킷은 항상 같은 경로를 사용합니다.

```
목적지 A → 경로 1
목적지 B → 경로 2
목적지 A → 경로 1 (동일)
```

**장점:**
- 패킷 순서 보장
- TCP 세션 안정

**단점:**
- 트래픽이 특정 경로에 집중될 수 있음

### Per-Packet Load Balancing

각 패킷을 라운드로빈으로 분산합니다.

```
패킷 1 → 경로 1
패킷 2 → 경로 2
패킷 3 → 경로 1
패킷 4 → 경로 2
```

**장점:**
- 균등한 부하 분산

**단점:**
- 패킷 순서 뒤바뀜 가능 (TCP 성능 저하)
- 권장하지 않음

### 설정

```bash
! Per-destination (기본값)
Router(config-if)# ip load-sharing per-destination

! Per-packet (권장하지 않음)
Router(config-if)# ip load-sharing per-packet
```

### Polarization 문제

**Polarization** 은 여러 홉에서 같은 해시 알고리즘을 사용할 때 발생합니다.

```
[Router A] ──┬── [Router B] ──┬── [Router C]
             │                │
             └── [Router B'] ─┴── [Router C']

모든 라우터가 같은 해시 사용 → 항상 같은 경로만 선택
```

**해결:**
- 라우터마다 다른 해시 시드 사용
- `ip cef load-sharing algorithm universal <id>` 설정

---

## 6. CEF 트러블슈팅

### CEF 상태 확인

```bash
! CEF 활성화 확인
Router# show ip cef
Router# show ip cef summary

! 특정 목적지 확인
Router# show ip cef 10.1.1.0/24 detail

! Adjacency 확인
Router# show adjacency
Router# show adjacency detail

! CEF 불일치 확인
Router# show ip cef inconsistency
```

### 일반적인 문제

**1. CEF가 비활성화됨**

```bash
Router# show ip cef
%CEF not running

! 해결
Router(config)# ip cef
```

**2. Adjacency Incomplete**

Next-Hop에 대한 ARP가 실패했습니다.

```bash
Router# show adjacency 192.168.1.2
IP       GigabitEthernet0/0     192.168.1.2(incomplete)
```

**확인 사항:**
- Next-Hop이 도달 가능한가?
- ARP가 정상 동작하는가?

**3. Punt**

패킷이 소프트웨어로 전달됩니다.

```bash
Router# show cef interface GigabitEthernet0/0
  ...
  Packets punted to next process: 12345
```

**원인:**
- CEF 미지원 기능
- TTL 만료
- 옵션이 있는 IP 패킷
- 목적지가 라우터 자신

### CEF와 RIB 불일치

간혹 라우팅 테이블(RIB)과 FIB가 일치하지 않을 수 있습니다.

```bash
Router# show ip cef inconsistency
CEF-RIB inconsistency checking is enabled
show ip cef inconsistency check report:

Number of table inconsistencies: 0
```

불일치 발견 시:
```bash
Router# clear ip cef inconsistency
```

---

## 7. SDM (Switching Database Manager) 템플릿

### SDM이란?

**SDM** 은 스위치의 **TCAM 리소스를 어떻게 분배할지** 결정하는 템플릿입니다.

TCAM 용량은 제한되어 있으므로, 사용 패턴에 맞게 할당해야 합니다.

### SDM 템플릿 종류

| 템플릿 | 특징 |
|--------|------|
|**default**| 균형 잡힌 기본 설정 |
|**lanbase-routing**| 기본 라우팅 지원 |
|**dual-ipv4-and-ipv6**| IPv4/IPv6 균형 |
|**qos**| QoS 항목 최대화 |
|**routing**| 유니캐스트 라우팅 최대화 |

### SDM 설정

```bash
! 현재 템플릿 확인
Switch# show sdm prefer

! 템플릿 변경
Switch(config)# sdm prefer routing
Switch(config)# end
Switch# reload   ! 재부팅 필요
```

---

## 8. Centralized vs Distributed 포워딩

### Centralized Forwarding

**하나의 중앙 스위칭 엔진** 이 모든 포워딩을 처리합니다.

```
         [Supervisor Engine]
         (FIB, Adjacency, 스위칭)
                  │
    ┌─────────────┼─────────────┐
    │             │             │
[Line Card]  [Line Card]  [Line Card]
```

라인 카드는 단순히 패킷을 주고받기만 합니다.

### Distributed Forwarding

**각 라인 카드가 자체 포워딩 엔진** 을 가집니다.

```
         [Supervisor Engine]
         (컨트롤 플레인만)
                  │
                  │ FIB/Adj 동기화
    ┌─────────────┼─────────────┐
    │             │             │
[Line Card]  [Line Card]  [Line Card]
(자체 FIB)   (자체 FIB)   (자체 FIB)
```

**장점:**
- 확장성 (라인 카드 추가로 성능 향상)
- 복원력 (Supervisor 장애 시에도 일시적 포워딩 가능)

**대규모 라우터/스위치**(Catalyst 6500, Nexus 7000 등)에서 사용됩니다.

---

## 9. 정리

### 핵심 개념 요약

| 개념 | 설명 |
|------|------|
|**Process Switching**| CPU가 모든 패킷 처리, 가장 느림 |
|**Fast Switching**| 첫 패킷 CPU, 이후 캐시 사용 |
|**CEF**| 미리 계산된 FIB/Adjacency, 하드웨어 처리 |
|**FIB**| 포워딩 전용 테이블, 재귀 해결됨 |
|**Adjacency Table**| Next-Hop의 L2 정보 |
|**TCAM**| 고속 병렬 검색 메모리 |

### 스위칭 방식 비교

| 방식 | 속도 | CPU 부하 | 특징 |
|------|------|---------|------|
| Process | 느림 | 높음 | 모든 기능 지원 |
| Fast | 중간 | 중간 | 캐시 기반 |
| CEF | 빠름 | 낮음 | 현대 표준 |

### 시험 포인트

- CEF의 구성 요소 (FIB, Adjacency Table)
- 소프트웨어 vs 하드웨어 스위칭 차이
- Per-destination vs Per-packet 부하 분산
- TCAM의 역할
- SDM 템플릿의 용도

---

## 다음 장 예고

**다음 장에서는 Spanning Tree Protocol (STP)을 다룹니다.**

Layer 2 네트워크에서 루프를 방지하는 STP의 동작 원리, Root Bridge 선출, 포트 상태, 그리고 RSTP/MST 등 발전된 버전을 학습합니다.
