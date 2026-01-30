# Chapter 19: Network Device Access Control and Infrastructure Security

이 장에서는 **네트워크 장비 보안** 을 학습합니다. 장비 접근 제어, Control Plane 보호, Management Plane 보안 등 인프라를 보호하는 기술을 다룹니다.

네트워크 장비가 해킹되면 전체 네트워크가 위험해집니다. 라우터 하나가 뚫리면 모든 트래픽을 도청하거나 조작할 수 있습니다. 인프라 보안은 가장 기본적이면서 중요한 보안입니다.

---

## 1. 장비 접근 제어

### 로컬 인증

```bash
! 로컬 사용자 생성
username admin privilege 15 algorithm-type scrypt secret StrongPassword123!
username readonly privilege 1 algorithm-type scrypt secret ViewOnlyPass!

! 비밀번호 암호화
service password-encryption

! Enable Secret
enable algorithm-type scrypt secret EnablePassword!
```

### AAA 인증

```bash
! AAA 활성화
aaa new-model

! TACACS+ 서버 정의
tacacs server ISE-TACACS
 address ipv4 192.168.1.100
 key SecretKey

! 서버 그룹
aaa group server tacacs+ TACACS-GROUP
 server name ISE-TACACS

! 로그인 인증
aaa authentication login default group TACACS-GROUP local
aaa authentication login CONSOLE local

! 명령어 권한
aaa authorization exec default group TACACS-GROUP local
aaa authorization commands 15 default group TACACS-GROUP local

! 계정 관리
aaa accounting exec default start-stop group TACACS-GROUP
aaa accounting commands 15 default start-stop group TACACS-GROUP
```

### VTY 접근 제어

```bash
! SSH 설정
hostname Router1
ip domain-name example.com
crypto key generate rsa modulus 2048

ip ssh version 2
ip ssh time-out 60
ip ssh authentication-retries 3

! VTY 라인 보안
line vty 0 4
 transport input ssh
 login authentication default
 access-class SSH-ACL in
 exec-timeout 5 0
 logging synchronous

! SSH ACL
ip access-list standard SSH-ACL
 permit 10.1.1.0 0.0.0.255
 deny any log
```

### 콘솔 보안

```bash
line console 0
 login authentication CONSOLE
 exec-timeout 5 0
 logging synchronous
 transport output none
```

---

## 2. TACACS+ vs RADIUS

### 비교

| 특성 | TACACS+ | RADIUS |
|------|---------|--------|
| 프로토콜 | TCP 49 | UDP 1812/1813 |
| 암호화 | 전체 패킷 | 비밀번호만 |
| AAA 분리 | O | X |
| 명령어 권한 | 세밀한 제어 | 제한적 |
| 주 용도 | 장비 관리 | 사용자 인증 |

### TACACS+ 명령어 권한 부여

```
ISE에서 Shell Profile 설정:

Privilege Level 1 (Read-Only):
- show 명령만 허용

Privilege Level 15 (Full):
- 모든 명령 허용

명령어별 제어:
- "interface" → Permit
- "debug" → Deny
- "reload" → Deny
```

---

## 3. Control Plane 보호

### Control Plane이란?

```
라우터의 세 가지 Plane:
┌────────────────────────────────┐
│ Management Plane │ SSH, SNMP, Syslog
├────────────────────────────────┤
│ Control Plane    │ OSPF, BGP, HSRP
├────────────────────────────────┤
│ Data Plane       │ 사용자 트래픽
└────────────────────────────────┘
```

### Control Plane Policing (CoPP)

**CoPP** 는 Control Plane으로 향하는 트래픽을 **속도 제한** 합니다.

```bash
! 트래픽 분류
class-map match-any ROUTING
 match access-group name ACL-ROUTING
class-map match-any MANAGEMENT
 match access-group name ACL-MANAGEMENT
class-map match-any ICMP
 match access-group name ACL-ICMP

! ACL 정의
ip access-list extended ACL-ROUTING
 permit ospf any any
 permit eigrp any any
 permit tcp any any eq bgp
ip access-list extended ACL-MANAGEMENT
 permit tcp any any eq 22
 permit udp any any eq snmp
ip access-list extended ACL-ICMP
 permit icmp any any

! 정책 정의
policy-map COPP-POLICY
 class ROUTING
  police rate 5000 pps conform-action transmit exceed-action drop
 class MANAGEMENT
  police rate 500 pps conform-action transmit exceed-action drop
 class ICMP
  police rate 100 pps conform-action transmit exceed-action drop
 class class-default
  police rate 50 pps conform-action transmit exceed-action drop

! Control Plane에 적용
control-plane
 service-policy input COPP-POLICY
```

### Control Plane Protection (CPPr)

**CPPr** 은 CoPP를 더 세분화합니다.

```
Control Plane 하위 인터페이스:
- Host: 라우터 자신 주소로 오는 트래픽
- Transit: 통과 트래픽
- CEF Exception: CEF 처리 불가 트래픽
```

---

## 4. 라우팅 프로토콜 보안

### OSPF 인증

```bash
! 인터페이스에서 MD5 인증
interface GigabitEthernet0/1
 ip ospf authentication message-digest
 ip ospf message-digest-key 1 md5 SecretKey

! 영역 전체에 인증
router ospf 1
 area 0 authentication message-digest
```

### EIGRP 인증

```bash
! 키체인 정의
key chain EIGRP-KEY
 key 1
  key-string SecretPassword
  accept-lifetime 00:00:00 Jan 1 2024 infinite
  send-lifetime 00:00:00 Jan 1 2024 infinite

! 인터페이스에 적용
interface GigabitEthernet0/1
 ip authentication mode eigrp 1 md5
 ip authentication key-chain eigrp 1 EIGRP-KEY
```

### BGP 인증

```bash
router bgp 65001
 neighbor 10.1.1.2 remote-as 65002
 neighbor 10.1.1.2 password SecretKey
```

### HSRP 인증

```bash
interface GigabitEthernet0/1
 standby 1 authentication md5 key-string SecretKey
```

---

## 5. Management Plane 보안

### SNMP 보안

```bash
! SNMPv3 (권장)
snmp-server group ADMIN-GROUP v3 priv
snmp-server user admin ADMIN-GROUP v3 auth sha AuthPass priv aes 128 PrivPass

! SNMP ACL
snmp-server host 192.168.1.100 version 3 priv admin
access-list 10 permit 192.168.1.100
snmp-server community ReadOnly ro 10

! 불필요한 서비스 비활성화
no snmp-server
```

### Syslog 보안

```bash
! Syslog 서버 설정
logging host 192.168.1.100 transport tcp port 514
logging trap informational
logging source-interface Loopback0

! 버퍼 설정
logging buffered 16384 debugging
logging console critical
```

### NTP 보안

```bash
! NTP 인증
ntp authentication-key 1 md5 NTPSecret
ntp trusted-key 1
ntp authenticate
ntp server 192.168.1.1 key 1

! NTP ACL
ntp access-group peer 10
access-list 10 permit 192.168.1.1
```

---

## 6. 불필요한 서비스 비활성화

### 보안 강화 설정

```bash
! HTTP 서버 비활성화
no ip http server
no ip http secure-server

! 불필요한 서비스 비활성화
no service tcp-small-servers
no service udp-small-servers
no service finger
no ip bootp server
no ip source-route
no ip directed-broadcast

! CDP/LLDP 제한
no cdp run
! 또는 특정 인터페이스만
interface GigabitEthernet0/1
 no cdp enable

! 소스 라우팅 비활성화
no ip source-route

! ICMP 리다이렉트 비활성화
interface GigabitEthernet0/1
 no ip redirects
 no ip unreachables
 no ip proxy-arp
```

### Banner 설정

```bash
banner login #
*****************************************
*  Authorized Access Only!               *
*  Unauthorized access is prohibited     *
*  and will be prosecuted.               *
*****************************************
#

banner motd #
This system is for authorized use only.
#
```

---

## 7. Secure Boot 및 이미지 무결성

### Secure Boot

```bash
! Secure Boot 확인
show secure bootset

! 이미지 서명 검증
secure boot-image
secure boot-config
```

### 이미지 무결성 검증

```bash
! MD5 해시 확인
verify /md5 flash:image.bin
```

---

## 8. 로깅 및 모니터링

### 로깅 설정

```bash
! 타임스탬프 설정
service timestamps log datetime msec localtime show-timezone
service timestamps debug datetime msec localtime show-timezone

! 시퀀스 번호
service sequence-numbers

! 로깅 레벨
logging trap informational
logging buffered 32768 debugging

! 아카이브 로깅
archive
 log config
  logging enable
  logging size 500
  notify syslog contenttype plaintext
```

### 설정 변경 추적

```bash
! 설정 변경 로깅
archive
 log config
  logging enable
  hidekeys

! 확인
show archive log config all
```

---

## 9. 인프라 ACL (iACL)

### iACL이란?

**Infrastructure ACL** 은 네트워크 장비로 향하는 트래픽을 필터링합니다.

```bash
! iACL 예시
ip access-list extended INFRASTRUCTURE-ACL
 remark --- Permit OSPF ---
 permit ospf any any

 remark --- Permit BGP from peers ---
 permit tcp host 10.1.1.2 host 10.1.1.1 eq bgp
 permit tcp host 10.1.1.2 eq bgp host 10.1.1.1

 remark --- Permit SSH from management ---
 permit tcp 192.168.1.0 0.0.0.255 any eq 22

 remark --- Permit SNMP from NMS ---
 permit udp host 192.168.1.100 any eq snmp

 remark --- Permit ICMP (limited) ---
 permit icmp any any echo
 permit icmp any any echo-reply
 permit icmp any any unreachable
 permit icmp any any ttl-exceeded

 remark --- Deny all other to infrastructure ---
 deny ip any 10.0.0.0 0.255.255.255 log

 remark --- Permit transit traffic ---
 permit ip any any

! 인터페이스 적용
interface GigabitEthernet0/0
 ip access-group INFRASTRUCTURE-ACL in
```

---

## 10. uRPF (Unicast Reverse Path Forwarding)

### uRPF란?

**uRPF** 는 소스 IP 스푸핑을 방지합니다.

```
uRPF 검사:
패킷 수신 → 소스 IP의 라우팅 확인 → 같은 인터페이스?

일치: 허용
불일치: 차단 (스푸핑 의심)
```

### uRPF 모드

| 모드 | 설명 |
|------|------|
|**Strict**| 같은 인터페이스로 돌아가야 함 |
|**Loose**| 라우팅 테이블에 존재하면 됨 |

### uRPF 설정

```bash
! Strict 모드 (단일 경로 환경)
interface GigabitEthernet0/1
 ip verify unicast source reachable-via rx

! Loose 모드 (다중 경로 환경)
interface GigabitEthernet0/1
 ip verify unicast source reachable-via any
```

---

## 11. 정리

### 보안 체크리스트

| 영역 | 항목 |
|------|------|
|**인증**| AAA, TACACS+, 강력한 비밀번호 |
|**접근 제어**| VTY ACL, SSH 전용 |
|**Control Plane**| CoPP, 라우팅 프로토콜 인증 |
|**Management**| SNMPv3, NTP 인증, Syslog |
|**일반**| 불필요한 서비스 비활성화, iACL |

### 핵심 개념 요약

| 개념 | 설명 |
|------|------|
|**CoPP**| Control Plane 속도 제한 |
|**iACL**| 인프라 보호 ACL |
|**uRPF**| 소스 IP 스푸핑 방지 |
|**TACACS+**| 세밀한 명령어 권한 제어 |

### 시험 포인트

- TACACS+ vs RADIUS 차이
- CoPP의 목적과 설정
- 라우팅 프로토콜 인증 설정
- uRPF Strict vs Loose 모드
- 비활성화해야 할 서비스 목록

---

## 다음 장 예고

**다음 장에서는 Virtualization을 다룹니다.**

서버 가상화, 네트워크 가상화, 컨테이너 기술을 학습합니다.
