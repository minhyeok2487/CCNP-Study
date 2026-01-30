# Chapter 18: Secure Network Access Control

이 장에서는 **네트워크 접근 제어** 기술을 학습합니다. 802.1X, MAB, WebAuth 등을 통해 네트워크에 연결하는 사용자와 장치를 인증하고 권한을 부여하는 방법을 다룹니다.

아무나 네트워크에 연결할 수 있다면 보안에 큰 위협이 됩니다. "누가 연결했는가?", "연결해도 되는 장치인가?", "어떤 권한을 줄 것인가?"를 제어하는 것이 Network Access Control입니다.

---

## 1. Network Access Control 개요

### NAC란?

**NAC (Network Access Control)** 은 네트워크에 연결하는 **사용자/장치를 인증하고 권한을 부여** 하는 보안 프레임워크입니다.

```
NAC 없이:
[케이블 연결] → [즉시 네트워크 접근]

NAC 적용:
[케이블 연결] → [인증] → [권한 확인] → [네트워크 접근]
                 │
              실패 시 차단 또는 제한
```

### NAC의 목표

1.**인증 (Authentication)**: 누구인가?
2.**권한 부여 (Authorization)**: 무엇을 할 수 있는가?
3.**계정 관리 (Accounting)**: 무엇을 했는가?
4.**상태 평가 (Posture Assessment)**: 장치가 보안 정책을 준수하는가?

### NAC 구성 요소

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Supplicant  │ ──→ │ Authenticator│ ──→ │ Auth Server  │
│  (클라이언트) │     │   (스위치)    │     │  (RADIUS)    │
└──────────────┘     └──────────────┘     └──────────────┘
     PC/장치            네트워크 장비         Cisco ISE
```

---

## 2. 802.1X

### 802.1X란?

**IEEE 802.1X** 는 **포트 기반 네트워크 접근 제어** 표준입니다.

```
동작 과정:
1. 클라이언트가 포트에 연결
2. 스위치가 인증 요청
3. 클라이언트가 자격 증명 제공
4. RADIUS 서버가 인증 결정
5. 스위치가 포트 열기/차단
```

### 802.1X 구성 요소

| 구성 요소 | 역할 | 예시 |
|----------|------|------|
|**Supplicant**| 인증 요청 | PC, 노트북 |
|**Authenticator**| 중개자 | 스위치 |
|**Authentication Server**| 인증 결정 | RADIUS (ISE) |

### EAP (Extensible Authentication Protocol)

**EAP** 는 802.1X에서 사용하는 인증 프레임워크입니다.

```
[Supplicant] ←─ EAP over LAN (EAPOL) ─→ [Authenticator]
                                              │
                                    EAP over RADIUS
                                              │
                                              ▼
                                     [RADIUS Server]
```

### EAP 방법

| EAP 방법 | 설명 | 보안 |
|---------|------|------|
|**EAP-TLS**| 인증서 기반 (양방향) | 높음 |
|**PEAP**| 서버 인증서 + 비밀번호 | 높음 |
|**EAP-FAST**| Cisco 전용, PAC 사용 | 높음 |
|**EAP-MD5**| 비밀번호 해시 | 낮음 |

### 802.1X 설정 (스위치)

```bash
! AAA 설정
aaa new-model
aaa authentication dot1x default group radius
aaa authorization network default group radius

! RADIUS 서버
radius server ISE
 address ipv4 192.168.1.100 auth-port 1812 acct-port 1813
 key SecretKey

! 802.1X 전역 활성화
dot1x system-auth-control

! 포트 설정
interface GigabitEthernet0/1
 switchport mode access
 switchport access vlan 10
 authentication port-control auto
 dot1x pae authenticator
```

### 802.1X 포트 상태

| 상태 | 설명 |
|------|------|
|**Unauthorized**| 인증 전, EAPOL만 허용 |
|**Authorized**| 인증 성공, 트래픽 허용 |

---

## 3. MAB (MAC Authentication Bypass)

### MAB란?

**MAB** 는 802.1X를 지원하지 않는 장치를 위한 **MAC 주소 기반 인증** 입니다.

```
802.1X 미지원 장치:
- 프린터
- IP 카메라
- IoT 장치
- 구형 장비

MAC 주소로 인증!
```

### MAB 동작

```
1. 장치 연결
2. 스위치가 802.1X 시도 (타임아웃 대기)
3. 응답 없으면 MAB로 전환
4. 장치의 MAC 주소를 RADIUS로 전송
5. RADIUS가 MAC 주소 확인 후 인증
```

### MAB 설정

```bash
interface GigabitEthernet0/1
 switchport mode access
 switchport access vlan 10
 authentication port-control auto
 dot1x pae authenticator
 mab                              ! MAB 활성화
 authentication order dot1x mab   ! 순서: 802.1X 먼저, 실패 시 MAB
 authentication priority dot1x mab
```

### MAB 보안 고려사항

```
MAB의 한계:
- MAC 주소는 쉽게 스푸핑 가능
- 보안 수준이 802.1X보다 낮음

보안 강화:
- Profiling으로 장치 유형 확인
- 제한된 VLAN/ACL 적용
- 동적 프로파일링과 결합
```

---

## 4. Web Authentication (WebAuth)

### WebAuth란?

**WebAuth** 는 웹 포털을 통한 인증 방식입니다.

```
사용자가 브라우저 열기
        │
        ▼
   인증 포털로 리다이렉트
        │
        ▼
   사용자명/비밀번호 입력
        │
        ▼
   인증 성공 시 네트워크 접근
```

### WebAuth 유형

| 유형 | 설명 |
|------|------|
|**Local Web Auth (LWA)**| 스위치/WLC 자체 포털 |
|**Central Web Auth (CWA)**| ISE 포털로 리다이렉트 |
|**Guest Portal**| 게스트 사용자용 포털 |

### WebAuth 설정

```bash
! ACL 설정 (인증 전 허용 트래픽)
ip access-list extended ACL-WEBAUTH-REDIRECT
 permit udp any any eq 53
 permit tcp any any eq 53
 permit udp any eq 67 any
 deny ip any any

! 포트 설정
interface GigabitEthernet0/1
 switchport mode access
 switchport access vlan 10
 authentication port-control auto
 authentication fallback WEBAUTH-PROFILE

! Fallback 프로파일
fallback profile WEBAUTH-PROFILE
 ip access-group ACL-WEBAUTH-REDIRECT in
```

---

## 5. Cisco ISE (Identity Services Engine)

### ISE 개요

**Cisco ISE** 는 통합 NAC 솔루션입니다.

```
ISE 기능:
- 인증 (Authentication)
- 권한 부여 (Authorization)
- 계정 관리 (Accounting)
- 프로파일링 (Profiling)
- 포스처 평가 (Posture Assessment)
- 게스트 관리 (Guest Services)
- BYOD
```

### ISE 아키텍처

```
                    [ISE]
                      │
        ┌─────────────┼─────────────┐
        │             │             │
    [스위치]      [WLC]        [VPN]
        │             │             │
    [유선 사용자] [무선 사용자] [원격 사용자]
```

### ISE Policy

```
Authentication Policy:
어떤 방법으로 인증할 것인가?

If (Wired_802.1X) then
    Use EAP-TLS
Else If (Wireless_802.1X) then
    Use PEAP
Else
    Use MAB

Authorization Policy:
인증 후 어떤 권한을 줄 것인가?

If (Employee AND Compliant) then
    Permit Access, VLAN: Corp
Else If (Guest) then
    Permit Access, VLAN: Guest, ACL: Guest-ACL
Else
    Deny Access
```

### Authorization Profile

| 구성 요소 | 설명 |
|----------|------|
|**VLAN**| 동적 VLAN 할당 |
|**dACL**| 다운로드 가능한 ACL |
|**SGT**| Security Group Tag |
|**URL Redirect**| 웹 리다이렉트 |

---

## 6. Dynamic Authorization (CoA)

### CoA란?

**CoA (Change of Authorization)** 는 세션 중간에 **권한을 동적으로 변경** 합니다.

```
시나리오:
1. 사용자가 게스트로 인증
2. 관리자가 권한 승격 결정
3. CoA로 즉시 권한 변경 (재인증 없이)
```

### CoA 유형

| 메시지 | 설명 |
|--------|------|
|**Reauthenticate**| 재인증 요청 |
|**Session Terminate**| 세션 종료 |
|**Port Disable**| 포트 비활성화 |
|**Port Bounce**| 포트 재시작 |

### CoA 설정

```bash
! RADIUS 서버에서 CoA 허용
aaa server radius dynamic-author
 client 192.168.1.100 server-key SecretKey

! 포트에서 CoA 지원
interface GigabitEthernet0/1
 authentication port-control auto
 dot1x pae authenticator
```

---

## 7. Guest Access

### 게스트 네트워크 접근

```
1. 게스트가 네트워크 연결
2. WebAuth 포털로 리다이렉트
3. 자체 등록 또는 스폰서 승인
4. 임시 자격 증명 발급
5. 제한된 네트워크 접근
```

### 게스트 접근 유형

| 유형 | 설명 |
|------|------|
|**Hotspot**| 약관 동의만 |
|**Self-Registration**| 사용자가 직접 등록 |
|**Sponsored Guest**| 직원이 승인 |
|**Social Login**| SNS 계정 사용 |

### 게스트 설정 예시 (ISE)

```
Guest Portal 설정:
- Portal Theme
- 사용 약관
- 등록 양식
- 유효 기간
- 접근 권한 (VLAN, ACL)
```

---

## 8. BYOD (Bring Your Own Device)

### BYOD란?

**BYOD** 는 개인 장치를 업무 네트워크에 연결하는 정책입니다.

```
BYOD 흐름:
1. 직원이 개인 기기로 연결
2. 기기 등록 포털로 리다이렉트
3. 인증서 또는 프로파일 설치
4. 장치 등록 및 정책 적용
5. 네트워크 접근 허용
```

### BYOD와 MDM

```
MDM (Mobile Device Management):
- 기기 설정 관리
- 앱 배포
- 원격 삭제
- 정책 강제

ISE + MDM 통합:
- MDM 상태 확인
- 규정 준수 검사
- 동적 접근 제어
```

---

## 9. Posture Assessment

### Posture란?

**Posture Assessment** 는 **장치의 보안 상태** 를 평가합니다.

```
평가 항목:
- 안티바이러스 설치/업데이트
- 방화벽 활성화
- OS 패치 수준
- 특정 소프트웨어 존재
```

### Posture 동작

```
1. 사용자 인증 성공
2. 제한된 접근 허용 (Posture 평가 네트워크)
3. AnyConnect Posture 모듈 실행
4. 장치 상태 평가
5. Compliant → 전체 접근
   Non-Compliant → 제한 유지 또는 치료 안내
```

### Posture 상태

| 상태 | 설명 |
|------|------|
|**Compliant**| 정책 준수 |
|**Non-Compliant**| 정책 미준수 |
|**Unknown**| 평가 불가 |

---

## 10. TrustSec (Security Group Tags)

### TrustSec이란?

**TrustSec** 은 **SGT (Security Group Tag)** 를 사용한 접근 제어입니다.

```
전통적 ACL:
IP 주소 기반 → 복잡, 관리 어려움

TrustSec SGT:
그룹 태그 기반 → 단순, 확장 가능

예시:
Employee (SGT: 10) ←→ Server (SGT: 20): Permit
Guest (SGT: 30) ←→ Server (SGT: 20): Deny
```

### SGT 할당

```
인증 시 ISE가 SGT 할당:
1. 사용자/장치 인증
2. ISE가 SGT 결정 (Authorization Policy)
3. SGT가 패킷에 태그됨
4. 네트워크 장비가 SGT 기반 정책 적용
```

### SGACL (Security Group ACL)

```bash
! SGACL 정의
cts role-based permissions from 10 to 20
 permit ip

cts role-based permissions from 30 to 20
 deny ip
```

---

## 11. 정리

### 인증 방법 비교

| 방법 | 대상 | 보안 수준 |
|------|------|----------|
|**802.1X**| 관리 장치 | 높음 |
|**MAB**| 비관리 장치 | 낮음 |
|**WebAuth**| 게스트 | 중간 |

### 설정 체크리스트

1. AAA 및 RADIUS 서버 설정
2. dot1x system-auth-control 활성화
3. 포트별 authentication port-control auto
4. dot1x pae authenticator 설정
5. (선택) MAB, WebAuth Fallback 설정

### 시험 포인트

- 802.1X 구성 요소 (Supplicant, Authenticator, Auth Server)
- EAP 방법 (EAP-TLS, PEAP, EAP-FAST)
- MAB vs 802.1X 차이
- CoA의 용도
- TrustSec SGT 개념

---

## 다음 장 예고

**다음 장에서는 Infrastructure Security를 다룹니다.**

장비 접근 제어, Control Plane 보호, Management Plane 보안을 학습합니다.
