import { config } from "dotenv";
config({ path: ".env.local" });
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq } from "drizzle-orm";
import { questions, topics } from "../src/lib/db/schema";

const connectionString = process.env.DATABASE_URL!;
const sql = postgres(connectionString, { prepare: false });
const db = drizzle(sql);

interface QuestionSeed {
  topicCode: string;
  questionEn: string;
  questionKo: string;
  optionsEn: string[];
  optionsKo: string[];
  correctAnswers: number[];
  explanationEn: string;
  explanationKo: string;
  difficulty: number;
}

const QUESTIONS: QuestionSeed[] = [
  // Domain 1 - Architecture
  {
    topicCode: "1.1.a",
    questionEn: "Which network design model uses a collapsed core and distribution layer?",
    questionKo: "코어와 디스트리뷰션 레이어가 통합된 네트워크 설계 모델은?",
    optionsEn: ["3-Tier", "2-Tier (Collapsed Core)", "Spine-Leaf", "Full Mesh"],
    optionsKo: ["3계층", "2계층 (통합 코어)", "스파인-리프", "풀 메시"],
    correctAnswers: [1],
    explanationEn: "The 2-Tier (Collapsed Core) design combines the core and distribution layers into a single layer, suitable for smaller networks.",
    explanationKo: "2계층(통합 코어) 설계는 코어와 디스트리뷰션 레이어를 하나로 결합하며, 소규모 네트워크에 적합합니다.",
    difficulty: 1,
  },
  {
    topicCode: "1.1.b",
    questionEn: "Which FHRP protocol is Cisco proprietary and supports active/standby?",
    questionKo: "시스코 전용이며 Active/Standby를 지원하는 FHRP 프로토콜은?",
    optionsEn: ["VRRP", "HSRP", "GLBP", "CARP"],
    optionsKo: ["VRRP", "HSRP", "GLBP", "CARP"],
    correctAnswers: [1],
    explanationEn: "HSRP (Hot Standby Router Protocol) is Cisco proprietary and uses active/standby model. VRRP is an open standard, and GLBP supports load balancing.",
    explanationKo: "HSRP는 시스코 전용 프로토콜로 Active/Standby 모델을 사용합니다. VRRP는 표준, GLBP는 로드밸런싱을 지원합니다.",
    difficulty: 1,
  },
  {
    topicCode: "1.4.a",
    questionEn: "In Cisco SD-WAN, which component is responsible for orchestration and management?",
    questionKo: "Cisco SD-WAN에서 오케스트레이션과 관리를 담당하는 구성 요소는?",
    optionsEn: ["vBond", "vManage", "vSmart", "vEdge"],
    optionsKo: ["vBond", "vManage", "vSmart", "vEdge"],
    correctAnswers: [1],
    explanationEn: "vManage provides the centralized management and orchestration dashboard. vBond handles authentication, vSmart handles routing policy, and vEdge is the data plane.",
    explanationKo: "vManage는 중앙 집중 관리 및 오케스트레이션 대시보드를 제공합니다. vBond는 인증, vSmart는 라우팅 정책, vEdge는 데이터 플레인을 담당합니다.",
    difficulty: 2,
  },
  // Domain 2 - Virtualization
  {
    topicCode: "2.1.a",
    questionEn: "What is the main difference between Type 1 and Type 2 hypervisors?",
    questionKo: "Type 1과 Type 2 하이퍼바이저의 주요 차이점은?",
    optionsEn: [
      "Type 1 runs on a host OS, Type 2 runs on bare metal",
      "Type 1 runs on bare metal, Type 2 runs on a host OS",
      "Type 1 is software-only, Type 2 uses hardware",
      "There is no difference",
    ],
    optionsKo: [
      "Type 1은 호스트 OS 위에서, Type 2는 베어메탈에서 동작",
      "Type 1은 베어메탈에서, Type 2는 호스트 OS 위에서 동작",
      "Type 1은 소프트웨어 전용, Type 2는 하드웨어 사용",
      "차이가 없음",
    ],
    correctAnswers: [1],
    explanationEn: "Type 1 (bare-metal) hypervisors run directly on hardware (e.g., ESXi). Type 2 runs on top of a host OS (e.g., VirtualBox).",
    explanationKo: "Type 1(베어메탈) 하이퍼바이저는 하드웨어에 직접 실행됩니다(예: ESXi). Type 2는 호스트 OS 위에서 실행됩니다(예: VirtualBox).",
    difficulty: 1,
  },
  {
    topicCode: "2.2.a",
    questionEn: "What does VRF stand for in networking?",
    questionKo: "네트워킹에서 VRF는 무엇의 약자인가?",
    optionsEn: [
      "Virtual Routing Function",
      "Virtual Routing and Forwarding",
      "VLAN Routing Framework",
      "Virtual Resource Fabric",
    ],
    optionsKo: [
      "Virtual Routing Function",
      "Virtual Routing and Forwarding",
      "VLAN Routing Framework",
      "Virtual Resource Fabric",
    ],
    correctAnswers: [1],
    explanationEn: "VRF (Virtual Routing and Forwarding) allows multiple instances of a routing table to co-exist on a single router.",
    explanationKo: "VRF(Virtual Routing and Forwarding)는 하나의 라우터에서 여러 라우팅 테이블 인스턴스가 공존할 수 있게 합니다.",
    difficulty: 1,
  },
  // Domain 3 - Infrastructure
  {
    topicCode: "3.1.c",
    questionEn: "Which Spanning Tree Protocol provides faster convergence than STP with port roles of Root, Designated, and Alternate?",
    questionKo: "STP보다 빠른 수렴을 제공하며 Root, Designated, Alternate 포트 역할을 가진 프로토콜은?",
    optionsEn: ["STP (802.1D)", "RSTP (802.1w)", "PVST+", "CST"],
    optionsKo: ["STP (802.1D)", "RSTP (802.1w)", "PVST+", "CST"],
    correctAnswers: [1],
    explanationEn: "RSTP (Rapid Spanning Tree Protocol, 802.1w) provides faster convergence and introduces the Alternate and Backup port roles.",
    explanationKo: "RSTP(802.1w)는 빠른 수렴을 제공하며 Alternate 및 Backup 포트 역할을 도입합니다.",
    difficulty: 2,
  },
  {
    topicCode: "3.2.a",
    questionEn: "Which algorithm does OSPF use to calculate the shortest path?",
    questionKo: "OSPF가 최단 경로 계산에 사용하는 알고리즘은?",
    optionsEn: ["Bellman-Ford", "Dijkstra (SPF)", "DUAL", "Floyd-Warshall"],
    optionsKo: ["벨만-포드", "다익스트라 (SPF)", "DUAL", "플로이드-워셜"],
    correctAnswers: [1],
    explanationEn: "OSPF uses Dijkstra's Shortest Path First (SPF) algorithm. EIGRP uses DUAL, and RIP uses Bellman-Ford.",
    explanationKo: "OSPF는 다익스트라의 SPF 알고리즘을 사용합니다. EIGRP는 DUAL을, RIP은 벨만-포드를 사용합니다.",
    difficulty: 1,
  },
  {
    topicCode: "3.2.c",
    questionEn: "What is the default administrative distance of eBGP?",
    questionKo: "eBGP의 기본 관리 거리(Administrative Distance)는?",
    optionsEn: ["90", "110", "20", "200"],
    optionsKo: ["90", "110", "20", "200"],
    correctAnswers: [2],
    explanationEn: "eBGP has an AD of 20, iBGP has 200, OSPF has 110, and EIGRP has 90.",
    explanationKo: "eBGP의 AD는 20, iBGP는 200, OSPF는 110, EIGRP는 90입니다.",
    difficulty: 2,
  },
  {
    topicCode: "3.4.c",
    questionEn: "Which FHRP allows multiple routers to actively forward traffic for the same virtual IP?",
    questionKo: "같은 가상 IP에 대해 여러 라우터가 동시에 트래픽을 전달할 수 있는 FHRP는?",
    optionsEn: ["HSRP", "VRRP", "GLBP", "CARP"],
    optionsKo: ["HSRP", "VRRP", "GLBP", "CARP"],
    correctAnswers: [2],
    explanationEn: "GLBP (Gateway Load Balancing Protocol) allows multiple routers to simultaneously forward traffic using a single virtual IP.",
    explanationKo: "GLBP는 하나의 가상 IP를 사용하면서 여러 라우터가 동시에 트래픽을 전달할 수 있습니다.",
    difficulty: 2,
  },
  // Domain 4 - Network Assurance
  {
    topicCode: "4.1",
    questionEn: "What syslog severity level represents an Emergency?",
    questionKo: "Emergency를 나타내는 syslog 심각도 수준은?",
    optionsEn: ["0", "1", "3", "7"],
    optionsKo: ["0", "1", "3", "7"],
    correctAnswers: [0],
    explanationEn: "Syslog levels: 0=Emergency, 1=Alert, 2=Critical, 3=Error, 4=Warning, 5=Notice, 6=Info, 7=Debug.",
    explanationKo: "Syslog 수준: 0=긴급, 1=경보, 2=중요, 3=오류, 4=경고, 5=알림, 6=정보, 7=디버그.",
    difficulty: 1,
  },
  {
    topicCode: "4.3",
    questionEn: "Which SPAN variant allows monitoring traffic across different switches using a GRE tunnel?",
    questionKo: "GRE 터널을 사용하여 서로 다른 스위치의 트래픽을 모니터링할 수 있는 SPAN 변형은?",
    optionsEn: ["Local SPAN", "RSPAN", "ERSPAN", "NetFlow"],
    optionsKo: ["로컬 SPAN", "RSPAN", "ERSPAN", "넷플로우"],
    correctAnswers: [2],
    explanationEn: "ERSPAN (Encapsulated Remote SPAN) uses GRE encapsulation to extend SPAN across Layer 3 boundaries.",
    explanationKo: "ERSPAN은 GRE 캡슐화를 사용하여 레이어 3 경계를 넘어 SPAN을 확장합니다.",
    difficulty: 2,
  },
  // Domain 5 - Security
  {
    topicCode: "5.1.b",
    questionEn: "Which AAA protocol uses TCP port 49 and encrypts the entire packet body?",
    questionKo: "TCP 포트 49를 사용하고 전체 패킷 본문을 암호화하는 AAA 프로토콜은?",
    optionsEn: ["RADIUS", "TACACS+", "Kerberos", "LDAP"],
    optionsKo: ["RADIUS", "TACACS+", "Kerberos", "LDAP"],
    correctAnswers: [1],
    explanationEn: "TACACS+ uses TCP 49 and encrypts the entire body. RADIUS uses UDP 1812/1813 and only encrypts the password.",
    explanationKo: "TACACS+는 TCP 49를 사용하며 전체 본문을 암호화합니다. RADIUS는 UDP 1812/1813을 사용하며 비밀번호만 암호화합니다.",
    difficulty: 2,
  },
  {
    topicCode: "5.4.c",
    questionEn: "Which wireless security standard introduced SAE (Simultaneous Authentication of Equals)?",
    questionKo: "SAE(Simultaneous Authentication of Equals)를 도입한 무선 보안 표준은?",
    optionsEn: ["WEP", "WPA", "WPA2", "WPA3"],
    optionsKo: ["WEP", "WPA", "WPA2", "WPA3"],
    correctAnswers: [3],
    explanationEn: "WPA3 introduced SAE to replace PSK, providing better protection against offline dictionary attacks.",
    explanationKo: "WPA3는 PSK를 대체하는 SAE를 도입하여 오프라인 사전 공격에 대한 보호를 강화했습니다.",
    difficulty: 2,
  },
  // Domain 6 - Automation
  {
    topicCode: "6.5",
    questionEn: "Which HTTP status code indicates a successful resource creation?",
    questionKo: "리소스가 성공적으로 생성되었음을 나타내는 HTTP 상태 코드는?",
    optionsEn: ["200", "201", "204", "301"],
    optionsKo: ["200", "201", "204", "301"],
    correctAnswers: [1],
    explanationEn: "201 Created indicates successful resource creation. 200 is OK, 204 is No Content, 301 is Moved Permanently.",
    explanationKo: "201 Created는 리소스가 성공적으로 생성되었음을 나타냅니다. 200은 OK, 204는 No Content, 301은 영구 이동입니다.",
    difficulty: 1,
  },
  {
    topicCode: "6.7",
    questionEn: "Which automation tool is agentless and uses SSH for communication?",
    questionKo: "에이전트리스이며 SSH를 사용하여 통신하는 자동화 도구는?",
    optionsEn: ["Puppet", "Chef", "Ansible", "SaltStack"],
    optionsKo: ["Puppet", "Chef", "Ansible", "SaltStack"],
    correctAnswers: [2],
    explanationEn: "Ansible is agentless and communicates via SSH. Puppet and Chef require agents. SaltStack supports both modes.",
    explanationKo: "Ansible은 에이전트리스이며 SSH로 통신합니다. Puppet과 Chef는 에이전트가 필요합니다. SaltStack은 두 모드 모두 지원합니다.",
    difficulty: 1,
  },
];

async function seed() {
  console.log("🌱 Seeding quiz questions...");

  // Get topic map
  const allTopics = await db.select().from(topics);
  const topicMap = new Map(allTopics.map((t) => [t.code, t.id]));

  let inserted = 0;

  for (const q of QUESTIONS) {
    const topicId = topicMap.get(q.topicCode);
    if (!topicId) {
      console.log(`  ⚠️  Topic ${q.topicCode} not found, skipping`);
      continue;
    }

    await db.insert(questions).values({
      topicId,
      type: "multiple_choice",
      questionEn: q.questionEn,
      questionKo: q.questionKo,
      optionsEn: q.optionsEn,
      optionsKo: q.optionsKo,
      correctAnswers: q.correctAnswers,
      explanationEn: q.explanationEn,
      explanationKo: q.explanationKo,
      difficulty: q.difficulty,
    });

    inserted++;
    console.log(`  ✅ ${q.topicCode}: ${q.questionKo.slice(0, 40)}...`);
  }

  console.log(`\n✅ ${inserted} questions inserted!`);
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seeding failed:", err);
  process.exit(1);
});
