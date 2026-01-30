# Chapter 29: IP Services

이 장에서는 **IP 서비스** 를 학습합니다. DHCP, NAT, NTP, SNMP, Syslog 등 네트워크 운영에 필수적인 서비스들을 다룹니다.

네트워크 장비와 호스트가 제대로 동작하려면 다양한 지원 서비스가 필요합니다. IP 주소 할당(DHCP), 시간 동기화(NTP), 모니터링(SNMP), 로깅(Syslog) 등이 없으면 네트워크 운영이 어렵습니다.

---

## 1. DHCP (Dynamic Host Configuration Protocol)

### DHCP 동작

```
DHCP DORA 프로세스:

[Client]           [DHCP Server]
    │                   │
    │── Discover ─────→ │  (브로드캐스트)
    │                   │
    │←─── Offer ──────  │  (유니캐스트/브로드캐스트)
    │                   │
    │── Request ──────→ │  (브로드캐스트)
    │                   │
    │←── Ack ─────────  │  (유니캐스트/브로드캐스트)
    │                   │
    └── IP 사용 시작 ───┘
```

### DHCP 서버 설정

```bash
! DHCP 풀 설정
ip dhcp pool VLAN10
 network 10.1.1.0 255.255.255.0
 default-router 10.1.1.1
 dns-server 8.8.8.8 8.8.4.4
 domain-name company.com
 lease 7                         ! 임대 기간 (일)

! 제외 주소 (서버, 라우터 등)
ip dhcp excluded-address 10.1.1.1 10.1.1.10

! DHCP 서비스 활성화
service dhcp
```

### DHCP Relay (Helper Address)

```
DHCP 서버가 다른 서브넷에 있을 때:

[Client] ─── [Router] ════════ [DHCP Server]
 VLAN 10       │                192.168.1.100
               │
        브로드캐스트를
        유니캐스트로 변환

설정:
interface Vlan10
 ip address 10.1.1.1 255.255.255.0
 ip helper-address 192.168.1.100
```

### DHCP Snooping

```
불법 DHCP 서버 방지:

ip dhcp snooping
ip dhcp snooping vlan 10

! 합법적 DHCP 서버 포트
interface GigabitEthernet0/24
 ip dhcp snooping trust

! 클라이언트 포트 (Untrust)
interface GigabitEthernet0/1
 ip dhcp snooping limit rate 15
```

---

## 2. NAT (Network Address Translation)

### NAT 유형

| 유형 | 설명 |
|------|------|
|**Static NAT**| 1:1 매핑 (서버용) |
|**Dynamic NAT**| N:N 매핑 (풀 사용) |
|**PAT (NAT Overload)** | N:1 매핑 (포트로 구분) |

### NAT 용어

```
Inside Local: 내부 네트워크의 실제 주소
Inside Global: 외부에서 보이는 내부 주소
Outside Local: 내부에서 보이는 외부 주소
Outside Global: 외부 네트워크의 실제 주소

예시:
PC (10.1.1.100) ─── [NAT Router] ─── 인터넷 (8.8.8.8)
                    203.0.113.1

Inside Local: 10.1.1.100
Inside Global: 203.0.113.1
Outside Local: 8.8.8.8
Outside Global: 8.8.8.8
```

### Static NAT 설정

```bash
! 1:1 매핑
ip nat inside source static 10.1.1.100 203.0.113.100

! 인터페이스 지정
interface GigabitEthernet0/0
 ip nat inside
interface GigabitEthernet0/1
 ip nat outside
```

### Dynamic NAT 설정

```bash
! NAT 풀 정의
ip nat pool PUBLIC-POOL 203.0.113.10 203.0.113.20 netmask 255.255.255.0

! 내부 주소 정의 (ACL)
access-list 1 permit 10.1.1.0 0.0.0.255

! NAT 설정
ip nat inside source list 1 pool PUBLIC-POOL
```

### PAT (NAT Overload) 설정

```bash
! 인터페이스 주소로 PAT
ip nat inside source list 1 interface GigabitEthernet0/1 overload

! 또는 풀로 PAT
ip nat inside source list 1 pool PUBLIC-POOL overload
```

### NAT 확인

```bash
show ip nat translations
show ip nat statistics
clear ip nat translation *
```

---

## 3. NTP (Network Time Protocol)

### NTP의 중요성

```
시간 동기화가 필요한 이유:
- 로그 분석 (이벤트 순서)
- 인증서 유효성
- 스케줄 작업
- 보안 (Kerberos, 802.1X)
```

### NTP 계층 (Stratum)

```
Stratum 0: 원자 시계, GPS
    │
Stratum 1: 직접 연결된 서버
    │
Stratum 2: Stratum 1에 동기화
    │
 ...

Stratum 숫자 낮을수록 정확
```

### NTP 설정

```bash
! NTP 서버 지정
ntp server 192.168.1.100
ntp server 192.168.1.101

! NTP 인증
ntp authentication-key 1 md5 NTPSecret
ntp trusted-key 1
ntp authenticate
ntp server 192.168.1.100 key 1

! NTP 소스 인터페이스
ntp source Loopback0

! 타임존 설정
clock timezone KST 9
```

### NTP 확인

```bash
show ntp status
show ntp associations
show clock detail
```

---

## 4. SNMP (Simple Network Management Protocol)

### SNMP 구성 요소

```
┌──────────────┐     ┌──────────────┐
│  NMS         │ ←─→ │   Agent      │
│ (Manager)    │     │  (장비)      │
└──────────────┘     └──────────────┘

NMS: Network Management System
Agent: 관리 대상 장비
MIB: Management Information Base
OID: Object Identifier
```

### SNMP 버전

| 버전 | 인증 | 암호화 | 보안 |
|------|------|--------|------|
| **v1**| Community | 없음 | 낮음 |
|**v2c**| Community | 없음 | 낮음 |
|**v3**| Username | AES | 높음 |

### SNMPv2c 설정

```bash
! Read-Only Community
snmp-server community ReadOnly ro

! Read-Write Community
snmp-server community ReadWrite rw

! ACL로 접근 제한
snmp-server community ReadOnly ro 10
access-list 10 permit 192.168.1.100

! Trap 목적지
snmp-server host 192.168.1.100 ReadOnly

! Trap 활성화
snmp-server enable traps
```

### SNMPv3 설정

```bash
! 그룹 생성
snmp-server group ADMIN v3 priv

! 사용자 생성
snmp-server user admin ADMIN v3 auth sha AuthPass priv aes 128 PrivPass

! Trap 설정
snmp-server host 192.168.1.100 version 3 priv admin
```

---

## 5. Syslog

### Syslog 레벨

| 레벨 | 이름 | 설명 |
|------|------|------|
| 0 | Emergency | 시스템 사용 불가 |
| 1 | Alert | 즉각 조치 필요 |
| 2 | Critical | 심각한 상태 |
| 3 | Error | 오류 |
| 4 | Warning | 경고 |
| 5 | Notice | 정상이지만 주목할 만함 |
| 6 | Informational | 정보 |
| 7 | Debug | 디버그 |

### Syslog 설정

```bash
! Syslog 서버 설정
logging host 192.168.1.100

! 로깅 레벨
logging trap informational       ! 서버로 전송
logging console warnings         ! 콘솔 출력
logging buffered 16384 debugging ! 버퍼 저장

! 타임스탬프
service timestamps log datetime msec localtime show-timezone

! 소스 인터페이스
logging source-interface Loopback0
```

### Syslog 확인

```bash
show logging
clear logging
```

---

## 6. NetFlow

### NetFlow란?

**NetFlow** 는 트래픽 흐름을 수집하고 분석합니다.

```
Flow 정보:
- 출발지/목적지 IP
- 출발지/목적지 포트
- 프로토콜
- 패킷 수
- 바이트 수
- 시작/종료 시간
```

### NetFlow 설정

```bash
! NetFlow 활성화
interface GigabitEthernet0/1
 ip flow ingress
 ip flow egress

! NetFlow 수출자 설정
ip flow-export destination 192.168.1.100 9996
ip flow-export source Loopback0
ip flow-export version 9
```

### Flexible NetFlow

```bash
! Flow Record 정의
flow record CUSTOM-RECORD
 match ipv4 source address
 match ipv4 destination address
 match transport source-port
 match transport destination-port
 collect counter bytes
 collect counter packets

! Flow Exporter 정의
flow exporter EXPORTER-1
 destination 192.168.1.100
 transport udp 9996

! Flow Monitor 정의
flow monitor MONITOR-1
 record CUSTOM-RECORD
 exporter EXPORTER-1

! 인터페이스 적용
interface GigabitEthernet0/1
 ip flow monitor MONITOR-1 input
```

---

## 7. IP SLA (Service Level Agreement)

### IP SLA란?

**IP SLA** 는 네트워크 성능을 **능동적으로 측정** 합니다.

```
측정 항목:
- RTT (Round Trip Time)
- Jitter
- Packet Loss
- 가용성
```

### ICMP Echo SLA

```bash
! IP SLA 정의
ip sla 1
 icmp-echo 10.1.1.100 source-ip 10.1.1.1
 frequency 60                    ! 60초마다

! 스케줄
ip sla schedule 1 life forever start-time now
```

### IP SLA 기반 라우팅

```bash
! Tracking
track 1 ip sla 1 reachability

! 정적 경로에 적용
ip route 0.0.0.0 0.0.0.0 10.1.1.254 track 1
ip route 0.0.0.0 0.0.0.0 10.2.2.254 10    ! 백업 (AD 높음)
```

### IP SLA 확인

```bash
show ip sla statistics
show ip sla configuration
show track
```

---

## 8. FHRP (First Hop Redundancy Protocol)

### HSRP (Hot Standby Router Protocol)

```
[Active Router]     [Standby Router]
 10.1.1.2           10.1.1.3
       \             /
        \           /
         \         /
       [Virtual IP]
        10.1.1.1

클라이언트는 10.1.1.1을 게이트웨이로 사용
Active 장애 시 Standby가 인계
```

### HSRP 설정

```bash
interface GigabitEthernet0/1
 ip address 10.1.1.2 255.255.255.0
 standby 1 ip 10.1.1.1
 standby 1 priority 110          ! 기본값 100
 standby 1 preempt               ! 우선권 활성화
 standby 1 track GigabitEthernet0/0 20  ! 추적
```

### VRRP (Virtual Router Redundancy Protocol)

```bash
! IEEE 표준
interface GigabitEthernet0/1
 ip address 10.1.1.2 255.255.255.0
 vrrp 1 ip 10.1.1.1
 vrrp 1 priority 110
 vrrp 1 preempt
```

### GLBP (Gateway Load Balancing Protocol)

```bash
! Cisco 전용, 부하 분산
interface GigabitEthernet0/1
 ip address 10.1.1.2 255.255.255.0
 glbp 1 ip 10.1.1.1
 glbp 1 priority 110
 glbp 1 preempt
 glbp 1 load-balancing round-robin
```

### FHRP 비교

| 특성 | HSRP | VRRP | GLBP |
|------|------|------|------|
| 표준 | Cisco | IEEE | Cisco |
| 부하 분산 | X | X | O |
| Virtual MAC | 0000.0c07.acXX | 0000.5e00.01XX | 0007.b400.XXYY |

---

## 9. 정리

### IP 서비스 요약

| 서비스 | 용도 | 포트 |
|--------|------|------|
|**DHCP**| IP 할당 | 67/68 |
|**NAT**| 주소 변환 | - |
|**NTP**| 시간 동기화 | 123 |
|**SNMP**| 네트워크 관리 | 161/162 |
|**Syslog**| 로깅 | 514 |
|**NetFlow**| 트래픽 분석 | 9996 |

### 핵심 명령어

| 서비스 | 확인 명령어 |
|--------|------------|
| DHCP | `show ip dhcp binding` |
| NAT | `show ip nat translations` |
| NTP | `show ntp status` |
| SNMP | `show snmp` |
| Syslog | `show logging` |

### 시험 포인트

- DHCP DORA 프로세스
- NAT Inside/Outside Local/Global
- PAT (NAT Overload) 동작
- SNMPv3 보안 설정
- Syslog 레벨
- IP SLA와 Tracking
- HSRP vs VRRP vs GLBP

---

## 과정 완료!

**축하합니다! CCNP ENCOR 전체 과정을 완료했습니다.**

이제 다음 단계로:
1. 실습 환경에서 직접 설정해보기
2. Practice Exam으로 시험 준비
3. 부족한 부분 복습

화이팅!
