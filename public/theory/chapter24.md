# Chapter 24: Wireless Infrastructure

이 장에서는 **무선 네트워크 인프라** 를 학습합니다. WLC (Wireless LAN Controller), AP 배포 모드, 그리고 다양한 아키텍처를 다룹니다.

AP를 10대만 관리한다면 개별 설정도 가능합니다. 하지만 1000대라면? 중앙 집중식 관리가 필수입니다. WLC와 AP의 협력으로 대규모 무선 네트워크를 효율적으로 운영할 수 있습니다.

---

## 1. 무선 네트워크 아키텍처

### Autonomous AP (독립형)

```
[AP 1] [AP 2] [AP 3]
  │       │       │
  └───────┴───────┘
     개별 관리

특징:
- 각 AP가 독립적으로 동작
- 개별 설정 필요
- 소규모 환경에 적합
- 확장성 낮음
```

### Controller-Based (중앙 집중형)

```
        [WLC]
      /   │   \
[AP 1] [AP 2] [AP 3]

특징:
- WLC가 모든 AP 제어
- 중앙에서 설정/정책 관리
- 대규모 환경에 적합
- CAPWAP 터널 사용
```

### Cloud-Managed (클라우드 관리)

```
        [Cloud (Meraki)]
             │
      인터넷 연결
             │
[AP 1] [AP 2] [AP 3]

특징:
- 클라우드 대시보드로 관리
- 별도 컨트롤러 불필요
- 어디서든 관리 가능
```

---

## 2. CAPWAP (Control And Provisioning of Wireless Access Points)

### CAPWAP이란?

**CAPWAP** 은 WLC와 AP 간 **제어 및 데이터 터널** 프로토콜입니다.

```
[AP] ════ CAPWAP Control (UDP 5246) ════ [WLC]
     ════ CAPWAP Data (UDP 5247) ════
```

### CAPWAP 터널

| 터널 | 포트 | 용도 | 암호화 |
|------|------|------|--------|
|**Control**| 5246 | AP 관리, 설정 | DTLS (필수) |
|**Data**| 5247 | 사용자 트래픽 | DTLS (선택) |

### Split MAC Architecture

```
MAC 기능 분리:

AP에서 처리 (실시간):
- 비콘 전송
- 프레임 ACK
- 암호화/복호화
- 데이터 전송

WLC에서 처리:
- 연결 관리 (Association)
- 보안 정책
- QoS
- 로밍 관리
```

---

## 3. AP 배포 모드

### Local Mode

```
[Client] ─wifi─ [AP] ═══CAPWAP═══ [WLC] ─── [Network]

특징:
- 가장 일반적인 모드
- 데이터가 WLC 경유
- 중앙 집중식 트래픽 처리
```

### FlexConnect Mode

```
중앙 사무실:
[Client] ─wifi─ [AP] ═══CAPWAP Control═══ [WLC]
                 └──── Local Switch ────→ [Network]

특징:
- Control: WLC 경유
- Data: 로컬 스위칭 가능
- WAN 링크 사용량 감소
- WLC 다운 시에도 동작 (Standalone)
```

### Bridge Mode

```
[Building A] ─wifi─ [AP Bridge] ═══ RF ═══ [AP Bridge] ─wifi─ [Building B]

특징:
- 무선으로 네트워크 연결
- Point-to-Point 또는 Point-to-Multipoint
- 유선 연결이 어려운 곳
```

### Sniffer Mode

```
[AP] ─────→ [WLC] ─────→ [분석 서버 (Wireshark)]
   패킷 캡처

특징:
- RF 트래픽 캡처
- 트러블슈팅용
- 일반 서비스 중단
```

### Monitor Mode

```
특징:
- RF 스캔 전용
- 클라이언트 서비스 없음
- Rogue AP 탐지
- 간섭 분석
```

### SE-Connect (Spectrum Expert)

```
특징:
- 스펙트럼 분석 전용
- RF 간섭 상세 분석
- CleanAir 기능
```

---

## 4. WLC (Wireless LAN Controller)

### WLC 유형

| 유형 | 설명 | AP 수 |
|------|------|-------|
|**물리적 WLC**| 전용 어플라이언스 | 6000+ |
|**가상 WLC**| VM 기반 | 3000 |
|**Mobility Express**| AP 내장 WLC | 100 |
|**EWC**| Catalyst 내장 | 200 |

### WLC 이중화

```
HA (High Availability):
[Active WLC] ════ [Standby WLC]
     │
     └─ SSO (Stateful Switchover)

N+1 Redundancy:
[WLC 1] [WLC 2] [WLC 3] ... [Backup WLC]
```

### WLC 인터페이스

| 인터페이스 | 용도 |
|-----------|------|
|**Management**| WLC 관리 |
|**AP-Manager**| AP와 CAPWAP 터널 |
|**Virtual**| DHCP Relay, Web Auth |
|**Dynamic**| WLAN 트래픽 |

---

## 5. WLAN 설정

### SSID와 WLAN

```
WLAN 설정 요소:
- SSID (Service Set Identifier)
- 보안 설정 (WPA2/WPA3)
- VLAN 매핑
- QoS 정책
- Radio 정책
```

### WLAN 설정 예시 (CLI)

```bash
(WLC)> config wlan create 1 Corporate Corporate
(WLC)> config wlan security wpa akm 802.1x enable 1
(WLC)> config wlan interface 1 vlan10
(WLC)> config wlan enable 1
```

### RF 프로파일

```
RF Profile 설정:
- 채널 목록
- 전송 전력
- RRM 설정
- 채널 폭
```

---

## 6. Cisco DNA Center와 무선

### DNA Center Wireless 관리

```
DNA Center 기능:
┌─────────────────────────────────────────┐
│ Design: 사이트, 건물, 층 정의          │
│ Policy: 무선 프로파일, 정책           │
│ Provision: WLC/AP 자동 배포           │
│ Assurance: 무선 상태 모니터링         │
└─────────────────────────────────────────┘
```

### 3D Wireless Map

```
DNA Center에서:
- 건물 도면 업로드
- AP 위치 배치
- 커버리지 예측
- 열지도 (Heatmap) 표시
```

---

## 7. RF 관리

### RRM (Radio Resource Management)

```
RRM 자동 조정:
- 채널 할당 (DCA)
- 전송 전력 조정 (TPC)
- 커버리지 홀 탐지
- 간섭 최소화

[WLC] ─── 주기적 분석 ─── [모든 AP]
              │
         최적 설정 배포
```

### DCA (Dynamic Channel Assignment)

```
채널 자동 할당:
1. AP들이 이웃 채널 정보 보고
2. WLC가 간섭 분석
3. 최적 채널 할당
4. AP 채널 변경

목표: Co-channel 간섭 최소화
```

### TPC (Transmit Power Control)

```
전송 전력 자동 조정:
- 커버리지 홀: 전력 증가
- 간섭 과다: 전력 감소
- 균일한 셀 크기 유지
```

### CleanAir

```
CleanAir 기능:
- 비 Wi-Fi 간섭 탐지
  (전자레인지, Bluetooth, 무선 전화기)
- 간섭 소스 식별
- 자동 채널 변경
```

---

## 8. Guest Wireless

### Guest WLAN 설계

```
[Guest Client] ─wifi─ [AP] ─── [WLC] ─── [DMZ]
                                │
                          인터넷만 접근
                          내부 네트워크 차단
```

### Guest 인증 방식

| 방식 | 설명 |
|------|------|
|**Open**| 약관 동의만 |
|**PSK**| 공유 비밀번호 |
|**WebAuth**| 웹 포털 인증 |
|**Social Login**| SNS 계정 |
|**Sponsored**| 직원 승인 |

### Guest WLAN 설정

```bash
! Guest WLAN 생성
config wlan create 2 Guest Guest
config wlan security wpa disable 2
config wlan security web-auth enable 2
config wlan interface 2 guest-vlan
config wlan enable 2
```

---

## 9. 무선 보안

### WPA3

```
WPA3 개선점:
- SAE (Simultaneous Authentication of Equals)
  → 오프라인 사전 공격 방지
- 192-bit Security Suite
- OWE (Opportunistic Wireless Encryption)
  → 오픈 네트워크 암호화
```

### 보안 설정 비교

| 보안 | 암호화 | 인증 | 권장 |
|------|--------|------|------|
| Open | 없음 | 없음 | X |
| WEP | RC4 | 공유키 | X |
| WPA2-PSK | AES | PSK | 가정 |
| WPA2-Enterprise | AES | 802.1X | 기업 |
| WPA3-Personal | AES | SAE | 가정 |
| WPA3-Enterprise | AES | 802.1X | 기업 |

---

## 10. 정리

### AP 모드 비교

| 모드 | 데이터 경로 | 용도 |
|------|-----------|------|
|**Local**| WLC 경유 | 일반 |
|**FlexConnect**| 로컬 스위칭 | 지사 |
|**Bridge**| 무선 연결 | 건물 연결 |
|**Monitor**| 스캔만 | 보안 |

### 핵심 개념 요약

| 개념 | 설명 |
|------|------|
|**CAPWAP**| AP-WLC 터널 프로토콜 |
|**Split MAC**| MAC 기능 분리 |
|**RRM**| 자동 RF 관리 |
|**DCA**| 동적 채널 할당 |
|**TPC**| 전송 전력 제어 |

### 시험 포인트

- CAPWAP 포트 (5246 Control, 5247 Data)
- AP 모드별 특성
- Local vs FlexConnect 데이터 경로
- RRM, DCA, TPC 역할
- WPA2 vs WPA3 차이
- Guest WLAN 설계

---

## 다음 장 예고

**다음 장에서는 Wireless Roaming과 Location Services를 다룹니다.**

무선 로밍의 종류와 위치 서비스 기술을 학습합니다.
