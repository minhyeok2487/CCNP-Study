# Chapter 16: Foundational Network Programmability Concepts

이 장에서는 **네트워크 프로그래밍의 기초 개념** 을 학습합니다. API, REST, JSON, XML, YANG 모델 등 네트워크 자동화를 위한 핵심 기술들을 다룹니다.

CLI로 100대의 스위치 설정을 바꾸려면 얼마나 걸릴까요? 한 대씩 접속해서 명령어를 입력하면 하루가 걸릴 수도 있습니다. 프로그래밍 방식으로 접근하면 몇 분 만에 가능합니다.

---

## 1. 네트워크 자동화의 필요성

### 전통적 네트워크 관리

```
관리자 작업:
1. SSH로 장비 접속
2. CLI 명령어 입력
3. 출력 확인
4. 다음 장비로 이동
5. 반복...

문제점:
- 시간 소요
- 인적 오류 발생
- 일관성 없음
- 확장 불가
```

### 자동화된 네트워크 관리

```
자동화 스크립트:
1. 장비 목록 읽기
2. 병렬로 모든 장비에 연결
3. 설정 변경
4. 결과 검증
5. 보고서 생성

장점:
- 빠름
- 일관성
- 반복 가능
- 오류 감소
```

### DevOps와 NetDevOps

```
DevOps:
Development + Operations
소프트웨어 개발과 운영의 통합

NetDevOps:
Network + DevOps
네트워크에 DevOps 방식 적용

원칙:
- Infrastructure as Code (IaC)
- Version Control (Git)
- CI/CD Pipeline
- Automated Testing
```

---

## 2. API (Application Programming Interface)

### API란?

**API** 는 프로그램 간 통신을 위한 **표준화된 인터페이스** 입니다.

```
사람 ↔ 장비:
[관리자] ─── CLI ─── [Router]
                     SSH/Telnet

프로그램 ↔ 장비:
[Python Script] ─── API ─── [Router]
                           REST/NETCONF
```

### API의 장점

| CLI | API |
|-----|-----|
| 사람이 읽기 좋음 | 기계가 처리하기 좋음 |
| 출력 파싱 어려움 | 구조화된 데이터 |
| 인터랙티브 | 프로그래매틱 |
| 느림 | 빠름 |

### API 유형

| 유형 | 프로토콜 | 데이터 형식 | 예시 |
|------|---------|-----------|------|
|**REST**| HTTP/HTTPS | JSON/XML | Cisco DNA Center |
|**NETCONF**| SSH | XML | IOS-XE, IOS-XR |
|**RESTCONF**| HTTP/HTTPS | JSON/XML | IOS-XE |
|**gRPC**| HTTP/2 | Protobuf | IOS-XR Telemetry |

---

## 3. REST API

### REST란?

**REST (Representational State Transfer)** 는 웹 기반 API 아키텍처입니다.

### REST 원칙

1.**Stateless**: 각 요청이 독립적
2.**Client-Server**: 클라이언트/서버 분리
3.**Uniform Interface**: 일관된 인터페이스
4.**Resource-Based**: URI로 리소스 식별

### HTTP Methods

| Method | 동작 | CRUD |
|--------|------|------|
|**GET**| 조회 | Read |
|**POST**| 생성 | Create |
|**PUT**| 전체 수정 | Update |
|**PATCH**| 부분 수정 | Update |
|**DELETE**| 삭제 | Delete |

### REST API 예시

```
장비의 인터페이스 정보 조회:

GET https://192.168.1.1/restconf/data/Cisco-IOS-XE-interfaces-oper:interfaces
Authorization: Basic YWRtaW46cGFzc3dvcmQ=
Accept: application/yang-data+json

응답:
{
  "interfaces": {
    "interface": [
      {
        "name": "GigabitEthernet1",
        "ip-address": "192.168.1.1",
        "admin-status": "up"
      }
    ]
  }
}
```

### HTTP 상태 코드

| 코드 | 의미 |
|------|------|
|**200**| OK (성공) |
|**201**| Created (생성됨) |
|**204**| No Content (내용 없음) |
|**400**| Bad Request (잘못된 요청) |
|**401**| Unauthorized (인증 필요) |
|**403**| Forbidden (권한 없음) |
|**404**| Not Found (리소스 없음) |
|**500**| Server Error (서버 오류) |

---

## 4. 데이터 형식

### JSON (JavaScript Object Notation)

```json
{
  "hostname": "Router1",
  "interfaces": [
    {
      "name": "GigabitEthernet0/1",
      "ip": "10.1.1.1",
      "mask": "255.255.255.0",
      "enabled": true
    },
    {
      "name": "GigabitEthernet0/2",
      "ip": "10.2.2.1",
      "mask": "255.255.255.0",
      "enabled": false
    }
  ],
  "version": 16.9
}
```

**JSON 데이터 타입:**
- String: `"text"`
- Number: `123`, `45.67`
- Boolean: `true`, `false`
- Array: `[1, 2, 3]`
- Object: `{"key": "value"}`
- Null: `null`

### XML (eXtensible Markup Language)

```xml
<?xml version="1.0" encoding="UTF-8"?>
<device>
  <hostname>Router1</hostname>
  <interfaces>
    <interface>
      <name>GigabitEthernet0/1</name>
      <ip>10.1.1.1</ip>
      <mask>255.255.255.0</mask>
      <enabled>true</enabled>
    </interface>
  </interfaces>
</device>
```

### JSON vs XML

| 특성 | JSON | XML |
|------|------|-----|
| 가독성 | 높음 | 중간 |
| 크기 | 작음 | 큼 |
| 파싱 속도 | 빠름 | 느림 |
| 스키마 | 없음 | XSD |
| 네임스페이스 | 없음 | 있음 |

---

## 5. YANG 데이터 모델

### YANG이란?

**YANG (Yet Another Next Generation)** 은 네트워크 장비의 **데이터 모델링 언어** 입니다.

```
YANG 모델 = 네트워크 데이터의 "스키마"

어떤 데이터가 있는지
데이터 타입은 무엇인지
어떻게 구조화되어 있는지
정의
```

### YANG 모델 예시

```yang
module simple-interface {
  namespace "http://example.com/simple-interface";
  prefix si;

  container interfaces {
    list interface {
      key "name";

      leaf name {
        type string;
        description "Interface name";
      }

      leaf ip-address {
        type string;
        description "IP address";
      }

      leaf enabled {
        type boolean;
        default true;
        description "Interface status";
      }
    }
  }
}
```

### YANG 데이터 타입

| 타입 | 설명 |
|------|------|
|**string**| 문자열 |
|**int32**| 32비트 정수 |
|**boolean**| true/false |
|**enumeration**| 열거형 |
|**leafref**| 다른 leaf 참조 |
|**container**| 그룹 (자식 노드 포함) |
|**list**| 목록 (키로 구분) |
|**leaf**| 단일 값 |
|**leaf-list**| 값의 목록 |

### YANG 모델 유형

```
표준 YANG 모델:
- IETF: ietf-interfaces, ietf-ip
- OpenConfig: openconfig-interfaces

벤더 YANG 모델:
- Cisco: Cisco-IOS-XE-native
- Juniper: junos-qfx-conf
- Arista: arista-eos
```

---

## 6. NETCONF

### NETCONF란?

**NETCONF (Network Configuration Protocol)** 은 **XML 기반** 네트워크 관리 프로토콜입니다.

```
NETCONF 스택:
┌──────────────────┐
│    Content       │  ← YANG 데이터 모델
├──────────────────┤
│   Operations     │  ← get, get-config, edit-config
├──────────────────┤
│    Messages      │  ← RPC, RPC-Reply
├──────────────────┤
│    Transport     │  ← SSH (포트 830)
└──────────────────┘
```

### NETCONF Operations

| Operation | 설명 |
|-----------|------|
|**get**| 운영 데이터 조회 |
|**get-config**| 설정 데이터 조회 |
|**edit-config**| 설정 변경 |
|**copy-config**| 설정 복사 |
|**delete-config**| 설정 삭제 |
|**lock/unlock**| 설정 잠금 |
|**commit**| 변경 적용 |

### NETCONF 예시

```xml
<!-- get-config 요청 -->
<rpc message-id="101" xmlns="urn:ietf:params:xml:ns:netconf:base:1.0">
  <get-config>
    <source>
      <running/>
    </source>
    <filter type="subtree">
      <interfaces xmlns="urn:ietf:params:xml:ns:yang:ietf-interfaces"/>
    </filter>
  </get-config>
</rpc>

<!-- 응답 -->
<rpc-reply message-id="101" xmlns="urn:ietf:params:xml:ns:netconf:base:1.0">
  <data>
    <interfaces xmlns="urn:ietf:params:xml:ns:yang:ietf-interfaces">
      <interface>
        <name>GigabitEthernet1</name>
        <enabled>true</enabled>
      </interface>
    </interfaces>
  </data>
</rpc-reply>
```

### NETCONF 설정 (IOS-XE)

```bash
! NETCONF 활성화
Router(config)# netconf-yang
Router(config)# netconf-yang feature candidate-datastore

! SSH 설정
Router(config)# ip ssh version 2
```

---

## 7. RESTCONF

### RESTCONF란?

**RESTCONF** 는 REST API 방식으로 YANG 데이터에 접근하는 프로토콜입니다.

```
RESTCONF = REST + YANG

HTTP 메서드로 YANG 데이터 조작
JSON 또는 XML 형식
```

### RESTCONF URL 구조

```
https://{device}/restconf/data/{yang-module}:{container}/{list}={key}

예시:
https://192.168.1.1/restconf/data/Cisco-IOS-XE-native:native/interface/GigabitEthernet=1
```

### RESTCONF 예시

```bash
# 인터페이스 조회 (GET)
curl -X GET \
  https://192.168.1.1/restconf/data/ietf-interfaces:interfaces \
  -H "Accept: application/yang-data+json" \
  -u admin:password

# 응답
{
  "ietf-interfaces:interfaces": {
    "interface": [
      {
        "name": "GigabitEthernet1",
        "type": "iana-if-type:ethernetCsmacd",
        "enabled": true
      }
    ]
  }
}
```

### RESTCONF 설정 (IOS-XE)

```bash
! RESTCONF 활성화
Router(config)# restconf

! HTTP 서버 활성화
Router(config)# ip http server
Router(config)# ip http secure-server
Router(config)# ip http authentication local
```

---

## 8. Python을 이용한 네트워크 자동화

### Python 기초

```python
# 변수와 데이터 타입
hostname = "Router1"          # 문자열
port = 22                     # 정수
enabled = True                # 불리언
interfaces = ["Gi1", "Gi2"]   # 리스트
config = {"ip": "10.1.1.1"}   # 딕셔너리

# 조건문
if enabled:
    print(f"{hostname} is active")

# 반복문
for intf in interfaces:
    print(f"Interface: {intf}")

# 함수
def get_hostname(device):
    return device["hostname"]
```

### Requests 라이브러리 (REST API)

```python
import requests
import json

# GET 요청
url = "https://192.168.1.1/restconf/data/ietf-interfaces:interfaces"
headers = {"Accept": "application/yang-data+json"}
response = requests.get(url, headers=headers, auth=("admin", "password"), verify=False)

# 응답 처리
if response.status_code == 200:
    data = response.json()
    for interface in data["ietf-interfaces:interfaces"]["interface"]:
        print(f"Interface: {interface['name']}")

# POST 요청 (설정 추가)
new_config = {
    "interface": {
        "name": "Loopback100",
        "type": "iana-if-type:softwareLoopback"
    }
}
response = requests.post(url, headers=headers, json=new_config, auth=("admin", "password"))
```

### ncclient 라이브러리 (NETCONF)

```python
from ncclient import manager

# NETCONF 연결
with manager.connect(
    host="192.168.1.1",
    port=830,
    username="admin",
    password="password",
    hostkey_verify=False
) as m:
    # 설정 조회
    filter = """
    <interfaces xmlns="urn:ietf:params:xml:ns:yang:ietf-interfaces"/>
    """
    response = m.get_config(source="running", filter=("subtree", filter))
    print(response)

    # 설정 변경
    config = """
    <config>
      <interfaces xmlns="urn:ietf:params:xml:ns:yang:ietf-interfaces">
        <interface>
          <name>GigabitEthernet1</name>
          <description>Configured via NETCONF</description>
        </interface>
      </interfaces>
    </config>
    """
    m.edit_config(target="running", config=config)
```

---

## 9. 정리

### 핵심 개념 요약

| 개념 | 설명 |
|------|------|
|**API**| 프로그램 간 통신 인터페이스 |
|**REST**| HTTP 기반 웹 API |
|**JSON**| 경량 데이터 교환 형식 |
|**YANG**| 네트워크 데이터 모델링 언어 |
|**NETCONF**| XML 기반 네트워크 관리 프로토콜 |
|**RESTCONF**| REST + YANG |

### 프로토콜 비교

| 특성 | NETCONF | RESTCONF |
|------|---------|----------|
| 전송 | SSH | HTTPS |
| 데이터 | XML | JSON/XML |
| 포트 | 830 | 443 |
| 트랜잭션 | 지원 | 미지원 |
| 사용성 | 복잡 | 간단 |

### 시험 포인트

- REST API HTTP 메서드 (GET, POST, PUT, PATCH, DELETE)
- HTTP 상태 코드
- JSON vs XML 차이
- YANG 데이터 타입 (container, list, leaf)
- NETCONF operations
- RESTCONF URL 구조

---

## 다음 장 예고

**다음 장에서는 자동화 도구를 다룹니다.**

Ansible, Puppet, Chef, Terraform 등 네트워크 자동화 도구의 개념과 사용법을 학습합니다.
