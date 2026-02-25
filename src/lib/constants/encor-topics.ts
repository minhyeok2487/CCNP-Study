export interface DomainData {
  number: number;
  titleEn: string;
  titleKo: string;
  weight: number;
  color: string;
  topics: TopicData[];
}

export interface TopicData {
  code: string;
  titleEn: string;
  titleKo: string;
  children?: TopicData[];
  checklist?: string[];
}

export const ENCOR_DOMAINS: DomainData[] = [
  {
    number: 1,
    titleEn: "Architecture",
    titleKo: "아키텍처",
    weight: 15,
    color: "blue",
    topics: [
      {
        code: "1.1",
        titleEn: "Explain the different design principles used in an enterprise network",
        titleKo: "엔터프라이즈 네트워크에 사용되는 설계 원칙 설명",
        children: [
          { code: "1.1.a", titleEn: "Enterprise network design such as Tier 2, Tier 3, and Fabric Capacity planning", titleKo: "2계층, 3계층, 패브릭 용량 계획 등 엔터프라이즈 네트워크 설계" },
          { code: "1.1.b", titleEn: "High availability techniques such as redundancy, FHRP, and SSO", titleKo: "이중화, FHRP, SSO 등 고가용성 기술" },
        ],
        checklist: [
          "2-Tier vs 3-Tier 아키텍처 차이점 이해",
          "Spine-Leaf 패브릭 디자인 개념 학습",
          "FHRP (HSRP, VRRP, GLBP) 동작 원리 숙지",
          "SSO/NSF 개념 이해",
        ],
      },
      {
        code: "1.2",
        titleEn: "Analyze design principles of a WLAN deployment",
        titleKo: "WLAN 배포 설계 원칙 분석",
        children: [
          { code: "1.2.a", titleEn: "Wireless deployment models (centralized, distributed, controller-less, controller-based, cloud, remote branch)", titleKo: "무선 배포 모델 (중앙집중, 분산, 컨트롤러리스, 컨트롤러 기반, 클라우드, 원격 지점)" },
          { code: "1.2.b", titleEn: "Location services in a WLAN design", titleKo: "WLAN 설계의 위치 서비스" },
        ],
        checklist: [
          "FlexConnect vs Local Mode 차이",
          "Autonomous AP vs Lightweight AP 비교",
          "WLC 기반 vs Cloud 기반 아키텍처",
        ],
      },
      {
        code: "1.3",
        titleEn: "Differentiate between on-premises and cloud infrastructure deployments",
        titleKo: "온프레미스와 클라우드 인프라 배포 차이",
        checklist: [
          "IaaS, PaaS, SaaS 구분",
          "하이브리드 클라우드 아키텍처 이해",
        ],
      },
      {
        code: "1.4",
        titleEn: "Explain the working principles of the Cisco SD-WAN solution",
        titleKo: "Cisco SD-WAN 솔루션의 동작 원리 설명",
        children: [
          { code: "1.4.a", titleEn: "SD-WAN control and data planes elements", titleKo: "SD-WAN 제어 및 데이터 플레인 요소" },
          { code: "1.4.b", titleEn: "Traditional WAN and SD-WAN solutions", titleKo: "전통적 WAN과 SD-WAN 솔루션" },
        ],
        checklist: [
          "vManage, vBond, vSmart 역할 구분",
          "OMP 프로토콜 개념",
          "SD-WAN 오버레이/언더레이 이해",
        ],
      },
      {
        code: "1.5",
        titleEn: "Explain the working principles of the Cisco SD-Access solution",
        titleKo: "Cisco SD-Access 솔루션의 동작 원리 설명",
        children: [
          { code: "1.5.a", titleEn: "SD-Access control and data planes elements", titleKo: "SD-Access 제어 및 데이터 플레인 요소" },
          { code: "1.5.b", titleEn: "Traditional campus interoperating with SD-Access", titleKo: "SD-Access와 연동하는 전통적 캠퍼스" },
        ],
        checklist: [
          "LISP, VXLAN, CTS 역할 이해",
          "Fabric Edge, Control Plane, Border Node 구분",
          "DNA Center와 ISE 연동",
        ],
      },
      {
        code: "1.6",
        titleEn: "Describe concepts of wired and wireless QoS",
        titleKo: "유/무선 QoS 개념 설명",
        children: [
          { code: "1.6.a", titleEn: "QoS components", titleKo: "QoS 구성 요소" },
          { code: "1.6.b", titleEn: "QoS policy", titleKo: "QoS 정책" },
        ],
        checklist: [
          "분류(Classification) 및 마킹(Marking) 이해",
          "큐잉(Queuing) 메커니즘 비교",
          "폴리싱(Policing)과 셰이핑(Shaping) 차이",
          "무선 QoS (WMM) 이해",
        ],
      },
    ],
  },
  {
    number: 2,
    titleEn: "Virtualization",
    titleKo: "가상화",
    weight: 10,
    color: "purple",
    topics: [
      {
        code: "2.1",
        titleEn: "Describe device virtualization technologies",
        titleKo: "디바이스 가상화 기술 설명",
        children: [
          { code: "2.1.a", titleEn: "Hypervisor type 1 and 2", titleKo: "하이퍼바이저 타입 1, 2" },
          { code: "2.1.b", titleEn: "Virtual machine", titleKo: "가상 머신" },
          { code: "2.1.c", titleEn: "Virtual switching", titleKo: "가상 스위칭" },
        ],
        checklist: [
          "Type 1 vs Type 2 하이퍼바이저 차이",
          "VM vs 컨테이너 비교",
          "vSwitch 개념 이해",
        ],
      },
      {
        code: "2.2",
        titleEn: "Configure and verify data path virtualization technologies",
        titleKo: "데이터 경로 가상화 기술 구성 및 검증",
        children: [
          { code: "2.2.a", titleEn: "VRF", titleKo: "VRF" },
          { code: "2.2.b", titleEn: "GRE and IPsec tunneling", titleKo: "GRE 및 IPsec 터널링" },
        ],
        checklist: [
          "VRF-Lite 구성 및 검증",
          "GRE 터널 설정",
          "IPsec VPN 개념 및 설정",
        ],
      },
      {
        code: "2.3",
        titleEn: "Describe network virtualization concepts",
        titleKo: "네트워크 가상화 개념 설명",
        children: [
          { code: "2.3.a", titleEn: "LISP", titleKo: "LISP" },
          { code: "2.3.b", titleEn: "VXLAN", titleKo: "VXLAN" },
        ],
        checklist: [
          "LISP 동작 원리 (Map Server, Map Resolver)",
          "VXLAN 헤더 구조 및 VTEP 이해",
        ],
      },
    ],
  },
  {
    number: 3,
    titleEn: "Infrastructure",
    titleKo: "인프라",
    weight: 30,
    color: "emerald",
    topics: [
      {
        code: "3.1",
        titleEn: "Layer 2",
        titleKo: "레이어 2",
        children: [
          { code: "3.1.a", titleEn: "Troubleshoot static and dynamic 802.1q trunking protocols", titleKo: "정적/동적 802.1Q 트렁킹 프로토콜 트러블슈팅" },
          { code: "3.1.b", titleEn: "Troubleshoot static and dynamic EtherChannels", titleKo: "정적/동적 EtherChannel 트러블슈팅" },
          { code: "3.1.c", titleEn: "Configure and verify common Spanning Tree Protocols (RSTP, MST)", titleKo: "STP 프로토콜 구성 및 검증 (RSTP, MST)" },
        ],
        checklist: [
          "DTP 모드 (desirable, auto, trunk, access) 이해",
          "LACP vs PAgP 비교",
          "RSTP 포트 상태 및 역할",
          "MST Region 개념",
        ],
      },
      {
        code: "3.2",
        titleEn: "Layer 3",
        titleKo: "레이어 3",
        children: [
          { code: "3.2.a", titleEn: "Compare routing concepts of EIGRP and OSPF", titleKo: "EIGRP와 OSPF 라우팅 개념 비교" },
          { code: "3.2.b", titleEn: "Configure simple OSPFv2/v3 environments", titleKo: "간단한 OSPFv2/v3 환경 구성" },
          { code: "3.2.c", titleEn: "Configure and verify eBGP between directly connected neighbors", titleKo: "직접 연결된 이웃 간 eBGP 구성 및 검증" },
        ],
        checklist: [
          "EIGRP Metric 계산 및 DUAL 알고리즘",
          "OSPF Area 타입 및 LSA 종류",
          "OSPFv3 (IPv6) 설정",
          "BGP 경로 선택 과정",
          "BGP neighbor 설정 및 검증",
        ],
      },
      {
        code: "3.3",
        titleEn: "Wireless",
        titleKo: "무선",
        children: [
          { code: "3.3.a", titleEn: "Describe Layer 1 concepts such as RF power, RSSI, SNR, interference, noise, bands, channels, and wireless client devices capabilities", titleKo: "RF 전력, RSSI, SNR, 간섭, 노이즈, 대역, 채널 등 레이어 1 개념 설명" },
          { code: "3.3.b", titleEn: "Describe AP modes and antenna types", titleKo: "AP 모드 및 안테나 타입 설명" },
          { code: "3.3.c", titleEn: "Describe access point discovery and join process (discovery algorithms, CAPWAP process)", titleKo: "AP 디스커버리 및 조인 프로세스 설명" },
          { code: "3.3.d", titleEn: "Describe the main principles and use cases for Layer 2 and Layer 3 roaming", titleKo: "레이어 2/3 로밍의 주요 원칙과 사용 사례" },
          { code: "3.3.e", titleEn: "Troubleshoot WLAN configuration and wireless client connectivity issues using GUI only", titleKo: "GUI를 사용한 WLAN 구성 및 무선 클라이언트 연결 문제 트러블슈팅" },
        ],
        checklist: [
          "2.4GHz vs 5GHz 대역 특성",
          "RSSI, SNR 관계 이해",
          "CAPWAP 프로세스 단계",
          "로밍 타입별 차이",
        ],
      },
      {
        code: "3.4",
        titleEn: "IP Services",
        titleKo: "IP 서비스",
        children: [
          { code: "3.4.a", titleEn: "Describe Network Time Protocol (NTP)", titleKo: "NTP 설명" },
          { code: "3.4.b", titleEn: "Configure and verify NAT/PAT", titleKo: "NAT/PAT 구성 및 검증" },
          { code: "3.4.c", titleEn: "Configure first hop redundancy protocols such as HSRP and VRRP", titleKo: "HSRP, VRRP 등 FHRP 구성" },
          { code: "3.4.d", titleEn: "Describe multicast protocols such as PIM and IGMP v2/v3", titleKo: "PIM, IGMPv2/v3 등 멀티캐스트 프로토콜 설명" },
        ],
        checklist: [
          "NTP 계층 구조 및 설정",
          "Static NAT, Dynamic NAT, PAT 구성",
          "HSRP vs VRRP 비교",
          "PIM Sparse/Dense Mode 이해",
        ],
      },
    ],
  },
  {
    number: 4,
    titleEn: "Network Assurance",
    titleKo: "네트워크 어슈어런스",
    weight: 10,
    color: "amber",
    topics: [
      {
        code: "4.1",
        titleEn: "Diagnose network problems using tools such as debugs, conditional debugs, traceroute, ping, SNMP, and syslog",
        titleKo: "디버그, 조건부 디버그, traceroute, ping, SNMP, syslog 등을 사용한 네트워크 문제 진단",
        checklist: [
          "SNMP v2c vs v3 비교",
          "Syslog 심각도 수준 암기",
          "조건부 디버그 활용법",
        ],
      },
      {
        code: "4.2",
        titleEn: "Configure and verify Flexible NetFlow",
        titleKo: "Flexible NetFlow 구성 및 검증",
        checklist: [
          "NetFlow vs Flexible NetFlow 차이",
          "Flow Record, Exporter, Monitor 설정",
        ],
      },
      {
        code: "4.3",
        titleEn: "Configure SPAN/RSPAN/ERSPAN",
        titleKo: "SPAN/RSPAN/ERSPAN 구성",
        checklist: [
          "SPAN vs RSPAN vs ERSPAN 비교",
          "모니터링 세션 설정",
        ],
      },
      {
        code: "4.4",
        titleEn: "Configure and verify IPSLA",
        titleKo: "IP SLA 구성 및 검증",
        checklist: [
          "ICMP Echo, Jitter 프로브 설정",
          "Object Tracking 연동",
        ],
      },
      {
        code: "4.5",
        titleEn: "Describe Cisco DNA Center workflows to apply network configuration, monitoring, and management",
        titleKo: "네트워크 구성, 모니터링, 관리를 위한 Cisco DNA Center 워크플로우",
        checklist: [
          "DNA Center 주요 기능 이해",
          "Assurance 기능 활용",
        ],
      },
      {
        code: "4.6",
        titleEn: "Configure and verify NETCONF and RESTCONF",
        titleKo: "NETCONF 및 RESTCONF 구성 및 검증",
        checklist: [
          "NETCONF vs RESTCONF 비교",
          "YANG 모델 기초",
        ],
      },
    ],
  },
  {
    number: 5,
    titleEn: "Security",
    titleKo: "보안",
    weight: 20,
    color: "red",
    topics: [
      {
        code: "5.1",
        titleEn: "Configure and verify device access control",
        titleKo: "디바이스 접근 제어 구성 및 검증",
        children: [
          { code: "5.1.a", titleEn: "Lines and local user authentication", titleKo: "라인 및 로컬 사용자 인증" },
          { code: "5.1.b", titleEn: "Authentication and authorization using AAA", titleKo: "AAA를 사용한 인증 및 권한 부여" },
        ],
        checklist: [
          "Console, VTY 라인 보안 설정",
          "AAA (TACACS+, RADIUS) 개념",
          "로컬 사용자 데이터베이스 설정",
        ],
      },
      {
        code: "5.2",
        titleEn: "Configure and verify infrastructure security features",
        titleKo: "인프라 보안 기능 구성 및 검증",
        children: [
          { code: "5.2.a", titleEn: "ACLs", titleKo: "ACL" },
          { code: "5.2.b", titleEn: "CoPP", titleKo: "CoPP" },
        ],
        checklist: [
          "Standard vs Extended ACL",
          "Named ACL 설정",
          "CoPP 정책 이해",
        ],
      },
      {
        code: "5.3",
        titleEn: "Describe REST API security",
        titleKo: "REST API 보안 설명",
        checklist: [
          "API 인증 방식 (Token, OAuth)",
          "HTTPS 기반 보안 통신",
        ],
      },
      {
        code: "5.4",
        titleEn: "Configure and verify wireless security features",
        titleKo: "무선 보안 기능 구성 및 검증",
        children: [
          { code: "5.4.a", titleEn: "EAP", titleKo: "EAP" },
          { code: "5.4.b", titleEn: "WebAuth", titleKo: "WebAuth" },
          { code: "5.4.c", titleEn: "PSK", titleKo: "PSK" },
        ],
        checklist: [
          "WPA2/WPA3 비교",
          "EAP 종류 (PEAP, EAP-TLS)",
          "802.1X 인증 플로우",
        ],
      },
      {
        code: "5.5",
        titleEn: "Describe the components of network security design",
        titleKo: "네트워크 보안 설계 구성 요소 설명",
        children: [
          { code: "5.5.a", titleEn: "Threat defense", titleKo: "위협 방어" },
          { code: "5.5.b", titleEn: "Endpoint security", titleKo: "엔드포인트 보안" },
          { code: "5.5.c", titleEn: "Next-generation firewall", titleKo: "차세대 방화벽" },
          { code: "5.5.d", titleEn: "TrustSec and MACsec", titleKo: "TrustSec 및 MACsec" },
          { code: "5.5.e", titleEn: "Network access control with 802.1X, MAB, and WebAuth", titleKo: "802.1X, MAB, WebAuth를 사용한 네트워크 접근 제어" },
        ],
        checklist: [
          "IPS/IDS 차이",
          "NGFW 기능 이해",
          "TrustSec SGT 개념",
          "MAB (MAC Authentication Bypass) 이해",
        ],
      },
    ],
  },
  {
    number: 6,
    titleEn: "Automation",
    titleKo: "자동화",
    weight: 15,
    color: "cyan",
    topics: [
      {
        code: "6.1",
        titleEn: "Interpret basic Python components and scripts",
        titleKo: "기본 Python 구성 요소 및 스크립트 해석",
        checklist: [
          "Python 기본 자료형 (list, dict, tuple)",
          "조건문, 반복문, 함수 이해",
          "JSON/YAML 파싱",
        ],
      },
      {
        code: "6.2",
        titleEn: "Construct valid JSON-encoded file",
        titleKo: "유효한 JSON 인코딩 파일 구성",
        checklist: [
          "JSON 문법 규칙",
          "JSON vs YAML 비교",
        ],
      },
      {
        code: "6.3",
        titleEn: "Describe the high-level principles and benefits of a data modeling language such as YANG",
        titleKo: "YANG 등 데이터 모델링 언어의 상위 원칙 및 이점 설명",
        checklist: [
          "YANG 모듈 구조 이해",
          "YANG 데이터 타입",
        ],
      },
      {
        code: "6.4",
        titleEn: "Describe APIs for Cisco DNA Center and vManage",
        titleKo: "Cisco DNA Center 및 vManage API 설명",
        checklist: [
          "DNA Center API 카테고리",
          "vManage REST API 활용",
        ],
      },
      {
        code: "6.5",
        titleEn: "Interpret REST API response codes and results in payload using Cisco DNA Center and RESTCONF",
        titleKo: "Cisco DNA Center 및 RESTCONF의 REST API 응답 코드와 페이로드 결과 해석",
        checklist: [
          "HTTP 상태 코드 (200, 201, 400, 401, 404, 500)",
          "REST API CRUD 작업 매핑",
        ],
      },
      {
        code: "6.6",
        titleEn: "Construct EEM applet to automate configuration, troubleshooting, or data collection",
        titleKo: "구성, 트러블슈팅, 데이터 수집 자동화를 위한 EEM 애플릿 구성",
        checklist: [
          "EEM 이벤트 디텍터 종류",
          "EEM 애플릿 문법",
        ],
      },
      {
        code: "6.7",
        titleEn: "Compare agent vs. agentless orchestration tools such as Chef, Puppet, Ansible, and SaltStack",
        titleKo: "Chef, Puppet, Ansible, SaltStack 등 에이전트 vs 에이전트리스 오케스트레이션 도구 비교",
        checklist: [
          "Ansible (에이전트리스) vs Puppet (에이전트) 비교",
          "각 도구의 주요 특성",
        ],
      },
    ],
  },
];
