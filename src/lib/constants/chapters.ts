export interface ChapterData {
  id: number;
  part: string;
  title: string;
  description: string;
  domainNumber: number; // maps to ENCOR_DOMAINS
}

export const CHAPTERS: ChapterData[] = [
  // Part I: Architecture → Domain 1
  { id: 1, part: "Part I: Architecture", title: "Packet Forwarding", description: "CEF, 패킷 포워딩 메커니즘, 하드웨어/소프트웨어 스위칭", domainNumber: 1 },
  { id: 2, part: "Part I: Architecture", title: "Spanning Tree Protocol", description: "STP, RSTP, MST, 루프 방지 메커니즘", domainNumber: 1 },
  { id: 3, part: "Part I: Architecture", title: "Advanced STP Tuning", description: "STP 최적화, PortFast, BPDU Guard, Root Guard", domainNumber: 1 },
  { id: 4, part: "Part I: Architecture", title: "Multiple Spanning Tree Protocol", description: "MST 영역, 인스턴스 매핑, 설정", domainNumber: 1 },
  { id: 5, part: "Part I: Architecture", title: "VLAN Trunks and EtherChannel Bundles", description: "802.1Q, DTP, LACP, PAgP, EtherChannel", domainNumber: 1 },

  // Part II: Virtualization → Domain 3 (Infrastructure - routing protocols)
  { id: 6, part: "Part II: Virtualization", title: "IP Routing Essentials", description: "라우팅 테이블, Administrative Distance, 정적/동적 라우팅", domainNumber: 3 },
  { id: 7, part: "Part II: Virtualization", title: "EIGRP", description: "EIGRP 동작 원리, 메트릭, DUAL 알고리즘", domainNumber: 3 },
  { id: 8, part: "Part II: Virtualization", title: "OSPF", description: "OSPF 동작 원리, LSA 타입, Area 설계", domainNumber: 3 },
  { id: 9, part: "Part II: Virtualization", title: "Advanced OSPF", description: "OSPF 최적화, Stub Area, NSSA, Virtual Link", domainNumber: 3 },
  { id: 10, part: "Part II: Virtualization", title: "OSPFv3", description: "IPv6 OSPF, Address Family, OSPFv3 설정", domainNumber: 3 },
  { id: 11, part: "Part II: Virtualization", title: "BGP", description: "BGP 기본 개념, eBGP, iBGP, AS Path", domainNumber: 3 },
  { id: 12, part: "Part II: Virtualization", title: "Advanced BGP", description: "BGP Path Selection, Route Reflector, Confederation", domainNumber: 3 },

  // Part III: Infrastructure → Domain 3
  { id: 13, part: "Part III: Infrastructure", title: "VRF, GRE, and IPsec", description: "VRF-Lite, GRE 터널, IPsec VPN", domainNumber: 3 },
  { id: 14, part: "Part III: Infrastructure", title: "LISP", description: "LISP 아키텍처, EID, RLOC, Map Server", domainNumber: 3 },
  { id: 15, part: "Part III: Infrastructure", title: "VXLAN", description: "VXLAN 개요, VTEP, VNI, Flood and Learn", domainNumber: 3 },

  // Part IV: Network Assurance → Domain 4
  { id: 16, part: "Part IV: Network Assurance", title: "Foundational Network Programmability Concepts", description: "API, REST, JSON, YAML, 자동화 기초", domainNumber: 4 },
  { id: 17, part: "Part IV: Network Assurance", title: "Introduction to Automation Tools", description: "Python, Ansible, Puppet, Chef 개요", domainNumber: 4 },

  // Part V: Security → Domain 5
  { id: 18, part: "Part V: Security", title: "Secure Network Access Control", description: "AAA, TACACS+, RADIUS, 802.1X", domainNumber: 5 },
  { id: 19, part: "Part V: Security", title: "Network Device Access Control and Infrastructure Security", description: "디바이스 보안, ACL, CoPP, Control Plane 보안", domainNumber: 5 },

  // Part VI: Automation → Domain 6
  { id: 20, part: "Part VI: Automation", title: "Virtualization", description: "서버 가상화, 네트워크 가상화, 컨테이너", domainNumber: 6 },
  { id: 21, part: "Part VI: Automation", title: "SD-Access", description: "Cisco SD-Access, DNA Center, Fabric", domainNumber: 6 },
  { id: 22, part: "Part VI: Automation", title: "SD-WAN", description: "Cisco SD-WAN, vManage, vSmart, vBond, vEdge", domainNumber: 6 },

  // Part VII: Wireless → Domain 1 (Architecture - WLAN)
  { id: 23, part: "Part VII: Wireless", title: "Wireless Signals and Modulation", description: "RF 기초, 변조, 안테나, 전파 특성", domainNumber: 1 },
  { id: 24, part: "Part VII: Wireless", title: "Wireless Infrastructure", description: "AP 모드, WLC, FlexConnect, 로밍", domainNumber: 1 },
  { id: 25, part: "Part VII: Wireless", title: "Understanding Wireless Roaming and Location Services", description: "레이어2/3 로밍, 위치 서비스", domainNumber: 1 },
  { id: 26, part: "Part VII: Wireless", title: "Authenticating Wireless Clients", description: "WPA2, WPA3, EAP, PSK, 802.1X", domainNumber: 1 },
  { id: 27, part: "Part VII: Wireless", title: "Troubleshooting Wireless Connectivity", description: "무선 문제 해결, 디버깅, RF 분석", domainNumber: 1 },

  // Part VIII: Services → Domain 4
  { id: 28, part: "Part VIII: Services", title: "QoS", description: "QoS 개념, Classification, Marking, Queuing, Shaping", domainNumber: 4 },
  { id: 29, part: "Part VIII: Services", title: "IP Services", description: "DHCP, NTP, SNMP, Syslog, NetFlow", domainNumber: 4 },
];

// Part별로 그룹핑
export const PARTS = [
  "Part I: Architecture",
  "Part II: Virtualization",
  "Part III: Infrastructure",
  "Part IV: Network Assurance",
  "Part V: Security",
  "Part VI: Automation",
  "Part VII: Wireless",
  "Part VIII: Services",
] as const;

export function getChaptersByPart(part: string): ChapterData[] {
  return CHAPTERS.filter((ch) => ch.part === part);
}

export function getChapterById(id: number): ChapterData | undefined {
  return CHAPTERS.find((ch) => ch.id === id);
}

// Domain 색상 매핑
export const DOMAIN_COLORS: Record<number, string> = {
  1: "blue",
  2: "purple",
  3: "emerald",
  4: "amber",
  5: "red",
  6: "cyan",
};

export const DOMAIN_NAMES: Record<number, string> = {
  1: "아키텍처",
  2: "가상화",
  3: "인프라",
  4: "네트워크 보증",
  5: "보안",
  6: "자동화",
};
