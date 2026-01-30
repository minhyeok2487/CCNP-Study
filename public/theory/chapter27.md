# Chapter 27: Troubleshooting Wireless Connectivity

이 장에서는 **무선 네트워크 트러블슈팅** 을 학습합니다. 연결 문제, 성능 문제, 로밍 문제를 진단하고 해결하는 방법을 다룹니다.

"Wi-Fi가 안 돼요"라는 문의는 네트워크 관리자가 가장 많이 받는 요청 중 하나입니다. 문제가 클라이언트인지, AP인지, WLC인지, 아니면 백엔드 네트워크인지 빠르게 파악하는 것이 중요합니다.

---

## 1. 트러블슈팅 방법론

### 계층별 접근

```
문제 발생 시 확인 순서:

Layer 1: RF (신호, 간섭)
    ↓
Layer 2: 연결 (Association, 인증)
    ↓
Layer 3: IP (DHCP, 라우팅)
    ↓
Application: 서비스 (DNS, 앱)
```

### OSI 모델 기반

```
7. Application: 앱 동작 확인
6. Presentation
5. Session
4. Transport: TCP/UDP 연결
3. Network: IP, DHCP, DNS
2. Data Link: Association, 인증
1. Physical: RF 신호, 간섭
```

---

## 2. RF 문제 (Layer 1)

### 신호 약함

```
증상:
- 연결 불안정
- 속도 느림
- 자주 끊김

확인:
- RSSI: -70 dBm 이하면 약함
- SNR: 25 dB 이하면 불량

해결:
- AP 추가 또는 재배치
- 전송 전력 증가
- 안테나 조정
```

### 간섭 (Interference)

```
Co-channel 간섭:
같은 채널 사용하는 AP 간 간섭

해결: 채널 계획 (1, 6, 11 분리)

Non-Wi-Fi 간섭:
- 전자레인지 (2.4GHz)
- Bluetooth
- 무선 전화기
- 무선 카메라

확인: CleanAir, 스펙트럼 분석
해결: 간섭원 제거, 채널 변경, 5GHz 사용
```

### 멀티패스

```
증상:
- 불안정한 연결
- 속도 변동

원인:
- 신호 반사로 여러 경로
- 신호 간 간섭

해결:
- AP 위치 조정
- 반사체 제거
- 802.11n/ac/ax 사용 (MIMO)
```

---

## 3. 연결 문제 (Layer 2)

### Association 실패

```
확인 순서:
1. SSID 브로드캐스트 확인
2. 보안 설정 일치 확인
3. 클라이언트 지원 확인 (802.11 버전)

WLC 로그:
show client detail <MAC>
```

### 인증 실패

```
PSK 실패:
- 비밀번호 확인
- 대소문자 확인
- 특수문자 확인

802.1X 실패:
- 사용자 자격 증명 확인
- ISE 정책 확인
- 인증서 유효성 확인
- RADIUS 연결 확인

WLC 디버그:
debug client <MAC>
debug aaa all enable
```

### 자주 연결 끊김

```
원인:
- 신호 약함
- 간섭
- 로밍 문제
- 클라이언트 문제

확인:
show client summary
show client detail <MAC>
```

---

## 4. IP 문제 (Layer 3)

### DHCP 실패

```
증상:
- 연결은 되지만 IP 없음
- 169.254.x.x 주소 (APIPA)

확인:
1. DHCP 서버 동작 확인
2. DHCP Scope 확인 (주소 부족?)
3. VLAN 설정 확인
4. WLC DHCP Relay 확인

WLC 확인:
show client detail <MAC>
show dhcp lease
```

### VLAN 문제

```
원인:
- 잘못된 VLAN 할당
- 트렁크 설정 오류
- AAA Override 문제

확인:
show wlan <id>
show interface summary
show client detail <MAC>
```

---

## 5. 성능 문제

### 속도 느림

```
확인 항목:
1. 연결 속도 (PHY Rate)
2. 간섭 레벨
3. 클라이언트 수
4. 채널 utilization
5. 백엔드 네트워크

WLC 확인:
show client detail <MAC>
show 802.11a/b cleanair device ap <AP>
show advanced 802.11a channel
```

### 채널 Utilization

```
높은 utilization:
- 80% 이상이면 성능 저하

원인:
- 너무 많은 클라이언트
- 높은 트래픽
- 간섭

해결:
- AP 추가
- 부하 분산
- 대역폭 제어 (QoS)
```

### 클라이언트 부하 분산

```
문제: 한 AP에 너무 많은 클라이언트

해결:
- 로드 밸런싱 활성화
- 802.11v로 클라이언트 분산 권고
- 최대 클라이언트 수 제한
```

---

## 6. 로밍 문제

### 로밍 지연

```
증상:
- 이동 시 끊김
- 음성 통화 품질 저하

확인:
- 802.11r 활성화 여부
- 802.11k 활성화 여부
- 모빌리티 설정

해결:
- Fast Roaming 활성화
- 셀 오버랩 조정 (15-20%)
- 전력 레벨 균일화
```

### Sticky Client

```
문제: 클라이언트가 약한 신호에도 로밍 안 함

원인:
- 클라이언트 드라이버 문제
- 로밍 임계값 설정

해결:
- 802.11v 활성화
- 최소 RSSI 설정 (약한 클라이언트 강제 해제)
- 클라이언트 드라이버 업데이트
```

---

## 7. WLC 트러블슈팅 명령어

### 클라이언트 확인

```bash
# 클라이언트 목록
show client summary

# 클라이언트 상세
show client detail <MAC>

# 클라이언트 통계
show client ap-stats <MAC>
```

### AP 확인

```bash
# AP 목록
show ap summary

# AP 상세
show ap config general <AP-Name>

# AP 조인 상태
show ap join stats summary all
```

### WLAN 확인

```bash
# WLAN 목록
show wlan summary

# WLAN 상세
show wlan <WLAN-ID>
```

### 디버그

```bash
# 클라이언트 디버그
debug client <MAC>

# AAA 디버그
debug aaa all enable

# DHCP 디버그
debug dhcp message enable

# 디버그 중지
debug disable-all
```

---

## 8. DNA Center Assurance

### Wireless Assurance

```
DNA Center 대시보드:
┌─────────────────────────────────────────┐
│ Client Health Score                     │
│ - 연결 성공률                           │
│ - 인증 성공률                           │
│ - DHCP 성공률                           │
│                                         │
│ Issue Detection                         │
│ - 자동 문제 탐지                        │
│ - 근본 원인 분석                        │
│ - 해결 권고                             │
└─────────────────────────────────────────┘
```

### Client 360

```
특정 클라이언트의 전체 이력:

[Client 360]
├── 연결 이력
├── 인증 상태
├── DHCP/IP 정보
├── 로밍 이력
├── 성능 지표
└── 이슈 타임라인
```

---

## 9. 일반적인 문제와 해결

### 문제별 체크리스트

| 문제 | 확인 항목 | 해결 |
|------|----------|------|
| 연결 안 됨 | SSID, 보안 설정 | 설정 일치 확인 |
| 인증 실패 | 자격 증명, ISE | 계정, 정책 확인 |
| IP 없음 | DHCP, VLAN | DHCP 서버, 트렁크 |
| 속도 느림 | 신호, 간섭 | AP 추가, 채널 조정 |
| 끊김 | RF, 로밍 | 커버리지, 로밍 설정 |

### 트러블슈팅 순서

```
1. 문제 정의
   - 어떤 증상?
   - 언제부터?
   - 영향 범위?

2. 정보 수집
   - 클라이언트 정보
   - AP/WLC 로그
   - 네트워크 상태

3. 분석
   - 로그 분석
   - 패턴 파악

4. 가설 및 테스트
   - 원인 추정
   - 검증

5. 해결 및 문서화
   - 조치
   - 기록
```

---

## 10. 정리

### 계층별 문제 요약

| 계층 | 문제 | 도구 |
|------|------|------|
|**RF**| 신호, 간섭 | CleanAir, 스펙트럼 |
|**L2**| 연결, 인증 | show client, debug |
|**L3**| IP, DHCP | show dhcp, debug dhcp |
|**App**| 서비스 | ping, traceroute |

### 핵심 명령어

| 명령어 | 용도 |
|--------|------|
| `show client summary` | 클라이언트 목록 |
| `show client detail` | 클라이언트 상세 |
| `show ap summary` | AP 목록 |
| `debug client` | 클라이언트 디버그 |

### 시험 포인트

- 계층별 트러블슈팅 접근
- RSSI, SNR 해석
- 인증 실패 원인 분석
- DHCP 문제 해결
- WLC 트러블슈팅 명령어
- DNA Center Assurance 기능

---

## 다음 장 예고

**다음 장에서는 QoS를 다룹니다.**

Quality of Service를 통한 트래픽 우선순위 제어를 학습합니다.
