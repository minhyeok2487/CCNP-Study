# Chapter 20: Virtualization

이 장에서는 **가상화 기술** 을 학습합니다. 서버 가상화, 네트워크 가상화, 컨테이너 기술을 다룹니다.

물리 서버 하나에 OS 하나만 설치하던 시대는 지났습니다. 이제는 하나의 물리 서버에서 수십 개의 가상 머신을 운영합니다. 네트워크도 마찬가지로 가상화되고 있습니다.

---

## 1. 가상화 개요

### 가상화란?

**가상화 ** 는 물리적 리소스를**논리적으로 분할 ** 하거나**추상화** 하는 기술입니다.

```
물리 환경:
[물리 서버 1] [물리 서버 2] [물리 서버 3]
    OS 1          OS 2          OS 3

가상화 환경:
[물리 서버]
    │
[Hypervisor]
    │
┌───┼───┬───┐
VM1 VM2 VM3 VM4
```

### 가상화의 장점

| 장점 | 설명 |
|------|------|
|**효율성**| 리소스 활용률 향상 |
|**비용 절감**| 물리 장비 감소 |
|**유연성**| 빠른 배포/확장 |
|**격리**| 장애 영향 최소화 |
|**이동성**| VM 마이그레이션 |

---

## 2. 서버 가상화

### Hypervisor

**Hypervisor** 는 가상 머신을 생성하고 관리하는 소프트웨어입니다.

```
Type 1 (Bare-Metal):
[Hardware]
    │
[Hypervisor]  ← 직접 설치
    │
[VM] [VM] [VM]

예: VMware ESXi, Microsoft Hyper-V

Type 2 (Hosted):
[Hardware]
    │
[Host OS]
    │
[Hypervisor]  ← OS 위에 설치
    │
[VM] [VM]

예: VMware Workstation, VirtualBox
```

### 주요 Hypervisor

| Hypervisor | 유형 | 벤더 |
|------------|------|------|
|**VMware ESXi**| Type 1 | VMware |
|**Microsoft Hyper-V**| Type 1 | Microsoft |
|**KVM**| Type 1 | 오픈소스 |
|**Xen**| Type 1 | 오픈소스 |

### VMware vSphere

```
vSphere 구성:
┌─────────────────────────────────┐
│          vCenter Server         │  ← 중앙 관리
└─────────────────────────────────┘
            │
    ┌───────┼───────┐
    ▼       ▼       ▼
[ESXi 1] [ESXi 2] [ESXi 3]  ← Hypervisor
   │        │        │
 [VMs]    [VMs]    [VMs]    ← 가상 머신
```

### vMotion

**vMotion** 은 실행 중인 VM을 **다른 호스트로 마이그레이션** 합니다.

```
[ESXi 1]  ════ vMotion ════  [ESXi 2]
   │                            │
 [VM] ─────────────────────→ [VM]
       다운타임 없이 이동!
```

---

## 3. 네트워크 가상화

### 가상 스위치

```
물리 서버 내부:
┌────────────────────────────────────┐
│           [vSwitch]                │
│         ╱    │    ╲               │
│      [VM1] [VM2] [VM3]            │
│                                    │
│         [물리 NIC]                 │
└──────────│─────────────────────────┘
           │
      [물리 스위치]
```

### VMware 가상 네트워크

| 구성 요소 | 설명 |
|----------|------|
|**vSwitch**| 기본 가상 스위치 |
|**vDS**| 분산 가상 스위치 |
|**Port Group**| 네트워크 정책 그룹 |
|**VLAN**| 가상 VLAN 태깅 |

### vDS (vSphere Distributed Switch)

```
         [vCenter]
             │
         [vDS]  ← 중앙 관리
        ╱  │  ╲
    [ESXi 1] [ESXi 2] [ESXi 3]
       │        │        │
     [VMs]    [VMs]    [VMs]

장점:
- 일관된 네트워크 정책
- 중앙 관리
- 고급 기능 (NetFlow, 미러링)
```

---

## 4. 컨테이너

### 컨테이너 vs VM

```
가상 머신:
[App A] [App B]
[Guest OS][Guest OS]
   [Hypervisor]
   [Host OS]
   [Hardware]

컨테이너:
[App A] [App B]
[Container Runtime]
[Host OS]
[Hardware]

컨테이너:
- 경량 (MB vs GB)
- 빠른 시작 (초 vs 분)
- OS 공유
```

### Docker

**Docker** 는 가장 널리 사용되는 컨테이너 플랫폼입니다.

```bash
# Docker 이미지 풀
docker pull nginx

# 컨테이너 실행
docker run -d -p 80:80 nginx

# 컨테이너 목록
docker ps

# 컨테이너 중지
docker stop <container_id>
```

### Kubernetes

**Kubernetes (K8s)** 는 컨테이너 오케스트레이션 플랫폼입니다.

```
Kubernetes 구조:
┌─────────────────────────────────────────┐
│            [Control Plane]              │
│  API Server, Scheduler, Controller      │
└─────────────────────────────────────────┘
                 │
    ┌────────────┼────────────┐
    ▼            ▼            ▼
[Worker Node] [Worker Node] [Worker Node]
    │            │            │
[Pod] [Pod]  [Pod] [Pod]  [Pod] [Pod]
```

### K8s 핵심 개념

| 개념 | 설명 |
|------|------|
|**Pod**| 컨테이너 그룹 (최소 배포 단위) |
|**Service**| 네트워크 엔드포인트 |
|**Deployment**| Pod 배포 관리 |
|**Namespace**| 논리적 분리 |

---

## 5. NFV (Network Functions Virtualization)

### NFV란?

**NFV** 는 네트워크 기능을 **소프트웨어로 가상화** 합니다.

```
기존:
[물리 방화벽] [물리 라우터] [물리 로드밸런서]

NFV:
[가상 방화벽] [가상 라우터] [가상 로드밸런서]
        │
    [NFV 인프라]
        │
    [물리 서버]
```

### NFV 구성 요소

| 구성 요소 | 설명 |
|----------|------|
|**VNF**| Virtual Network Function |
|**NFVI**| NFV Infrastructure |
|**MANO**| Management and Orchestration |

### VNF 예시

- 가상 라우터 (CSR1000v)
- 가상 방화벽 (ASAv, FTDv)
- 가상 로드밸런서
- 가상 WAN 최적화

---

## 6. SDN (Software-Defined Networking)

### SDN 개념

**SDN** 은 네트워크의 **Control Plane과 Data Plane을 분리** 합니다.

```
전통적 네트워크:
[Switch 1]  [Switch 2]  [Switch 3]
Control+Data Control+Data Control+Data

SDN:
        [SDN Controller]
             │
    Control Plane 중앙화
             │
    ┌────────┼────────┐
    ▼        ▼        ▼
[Switch 1][Switch 2][Switch 3]
Data Plane Data Plane Data Plane
```

### SDN 아키텍처

```
┌─────────────────────────────────────┐
│        Application Layer            │
│    네트워크 앱, 분석, 자동화          │
├─────────────────────────────────────┤
│    Northbound API (REST)            │
├─────────────────────────────────────┤
│        Control Layer                │
│     SDN Controller                  │
├─────────────────────────────────────┤
│    Southbound API (OpenFlow)        │
├─────────────────────────────────────┤
│      Infrastructure Layer           │
│    네트워크 장비 (스위치, 라우터)     │
└─────────────────────────────────────┘
```

### Cisco SDN 솔루션

| 솔루션 | 환경 | 설명 |
|--------|------|------|
|**ACI**| 데이터센터 | Application Centric Infrastructure |
|**SD-Access**| 캠퍼스 | Identity-based 접근 제어 |
|**SD-WAN**| WAN | 지능형 WAN 관리 |

---

## 7. VRF (Virtual Routing and Forwarding)

### VRF 복습

**VRF** 는 하나의 라우터에서 **여러 라우팅 테이블** 을 분리합니다.

```
[물리 라우터]
     │
┌────┼────┐
│VRF A│VRF B│
│10.0.0.0│10.0.0.0│  ← 같은 IP 가능
└────┴────┘
```

### VRF-Lite 설정

```bash
! VRF 정의
ip vrf CUSTOMER-A
 rd 100:1

ip vrf CUSTOMER-B
 rd 100:2

! 인터페이스에 VRF 할당
interface GigabitEthernet0/1
 ip vrf forwarding CUSTOMER-A
 ip address 10.1.1.1 255.255.255.0

interface GigabitEthernet0/2
 ip vrf forwarding CUSTOMER-B
 ip address 10.1.1.1 255.255.255.0
```

---

## 8. Overlay/Underlay 네트워크

### 개념

```
Overlay: 가상 네트워크 (터널, 캡슐화)
         │
    ┌────┴────┐
    │ VXLAN   │
    │ GRE     │
    │ IPsec   │
    └────┬────┘
         │
Underlay: 물리 네트워크 (IP 라우팅)
```

### 예시: VXLAN

```
[VM1] ─── [VTEP A] ════ VXLAN Tunnel ════ [VTEP B] ─── [VM2]
              │                               │
              └─────── Underlay (IP) ─────────┘
```

---

## 9. 정리

### 가상화 기술 비교

| 기술 | 수준 | 격리 | 오버헤드 |
|------|------|------|---------|
|**VM**| 하드웨어 | 높음 | 높음 |
|**컨테이너**| OS | 중간 | 낮음 |
|**VRF**| 라우팅 | 중간 | 낮음 |

### 핵심 개념 요약

| 개념 | 설명 |
|------|------|
|**Hypervisor**| VM 관리 소프트웨어 |
|**Container**| 경량 가상화 |
|**NFV**| 네트워크 기능 가상화 |
|**SDN**| 소프트웨어 정의 네트워크 |
|**Overlay**| 가상 네트워크 계층 |

### 시험 포인트

- Type 1 vs Type 2 Hypervisor
- VM vs 컨테이너 차이
- SDN Control/Data Plane 분리
- NFV 구성 요소 (VNF, NFVI, MANO)
- Overlay vs Underlay 개념

---

## 다음 장 예고

**다음 장에서는 SD-Access를 다룹니다.**

Cisco의 캠퍼스 네트워크 자동화 솔루션인 SD-Access를 학습합니다.
