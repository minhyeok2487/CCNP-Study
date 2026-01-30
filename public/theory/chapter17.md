# Chapter 17: Introduction to Automation Tools

이 장에서는 **네트워크 자동화 도구** 를 학습합니다. Ansible, Puppet, Chef 등 Configuration Management 도구와 Terraform 같은 Infrastructure as Code 도구를 다룹니다.

1000대의 스위치에 동일한 설정을 적용해야 한다면? 하나씩 수동으로 할 수도 있지만, Ansible 플레이북 하나로 몇 분 만에 완료할 수 있습니다.

---

## 1. Configuration Management 도구

### CM 도구의 필요성

```
수동 관리:
- 반복 작업
- 인적 오류
- 문서화 어려움
- 상태 추적 불가

자동화 도구:
- 코드로 정의
- 버전 관리
- 일관성 보장
- 멱등성(Idempotency)
```

### 주요 CM 도구

| 도구 | 언어 | 에이전트 | 아키텍처 |
|------|------|---------|---------|
|**Ansible**| YAML | 없음 | Push |
|**Puppet**| Ruby DSL | 있음 | Pull |
|**Chef**| Ruby | 있음 | Pull |
|**Salt**| YAML | 선택 | Push/Pull |

### Push vs Pull

```
Push (Ansible):
[Control Node] ──→ [Target 1]
               ──→ [Target 2]
               ──→ [Target 3]
컨트롤 노드가 명령 전송

Pull (Puppet, Chef):
[Target 1] ←── [Server]
[Target 2] ←── [Server]
[Target 3] ←── [Server]
타겟이 서버에서 설정 가져옴
```

---

## 2. Ansible

### Ansible 개요

**Ansible** 은 **에이전트리스**,**YAML 기반** 자동화 도구입니다.

```
특징:
- Python 기반
- SSH/NETCONF로 연결
- 에이전트 설치 불필요
- YAML 플레이북
- 멱등성 보장
```

### Ansible 구성 요소

| 구성 요소 | 설명 |
|----------|------|
|**Inventory**| 관리 대상 장비 목록 |
|**Playbook**| 자동화 작업 정의 |
|**Module**| 특정 작업 수행 코드 |
|**Task**| 개별 작업 단위 |
|**Role**| 재사용 가능한 작업 모음 |

### Inventory 파일

```ini
# inventory.ini
[routers]
router1 ansible_host=192.168.1.1
router2 ansible_host=192.168.1.2

[switches]
switch1 ansible_host=192.168.2.1
switch2 ansible_host=192.168.2.2

[all:vars]
ansible_user=admin
ansible_password=cisco123
ansible_network_os=ios
ansible_connection=network_cli
```

### Playbook 예시

```yaml
# configure_interfaces.yml
---
- name: Configure Network Interfaces
  hosts: routers
  gather_facts: no

  tasks:
    - name: Configure interface description
      cisco.ios.ios_interfaces:
        config:
          - name: GigabitEthernet0/1
            description: "Configured by Ansible"
            enabled: true
        state: merged

    - name: Configure IP address
      cisco.ios.ios_l3_interfaces:
        config:
          - name: GigabitEthernet0/1
            ipv4:
              - address: 10.1.1.1/24
        state: merged

    - name: Save configuration
      cisco.ios.ios_config:
        save_when: modified
```

### Ansible 실행

```bash
# 플레이북 실행
ansible-playbook -i inventory.ini configure_interfaces.yml

# 특정 호스트만
ansible-playbook -i inventory.ini configure_interfaces.yml --limit router1

# 드라이런 (실제 적용 안 함)
ansible-playbook -i inventory.ini configure_interfaces.yml --check

# 상세 출력
ansible-playbook -i inventory.ini configure_interfaces.yml -v
```

### Ansible 네트워크 모듈

| 모듈 | 용도 |
|------|------|
|**ios_command**| show 명령 실행 |
|**ios_config**| 설정 변경 |
|**ios_interfaces**| 인터페이스 관리 |
|**ios_vlans**| VLAN 관리 |
|**ios_ospfv2**| OSPF 설정 |

### 조건문과 반복문

```yaml
tasks:
  - name: Configure VLANs
    cisco.ios.ios_vlans:
      config:
        - vlan_id: "{{ item.id }}"
          name: "{{ item.name }}"
      state: merged
    loop:
      - { id: 10, name: "Users" }
      - { id: 20, name: "Servers" }
      - { id: 30, name: "Management" }

  - name: Enable interface only if IP is defined
    cisco.ios.ios_interfaces:
      config:
        - name: GigabitEthernet0/1
          enabled: true
    when: interface_ip is defined
```

---

## 3. Puppet

### Puppet 개요

**Puppet** 은 **에이전트 기반**Configuration Management 도구입니다.

```
아키텍처:
[Puppet Master] ← 카탈로그 요청 ─ [Puppet Agent]
       │                              │
       └─────── 카탈로그 전송 ──────→ │
                                      │
                              설정 적용
```

### Puppet 구성 요소

| 구성 요소 | 설명 |
|----------|------|
|**Manifest**| 리소스 정의 파일 (.pp) |
|**Module**| 재사용 가능한 매니페스트 |
|**Resource**| 관리할 시스템 요소 |
|**Catalog**| 컴파일된 설정 |
|**Facter**| 시스템 정보 수집 |

### Puppet Manifest 예시

```puppet
# site.pp
node 'router1.example.com' {
  cisco_interface { 'GigabitEthernet0/1':
    ensure      => present,
    description => 'Configured by Puppet',
    shutdown    => false,
  }

  cisco_vlan { '10':
    ensure    => present,
    vlan_name => 'Users',
    state     => 'active',
  }
}
```

### Puppet vs Ansible

| 특성 | Puppet | Ansible |
|------|--------|---------|
| 에이전트 | 필요 | 불필요 |
| 언어 | Ruby DSL | YAML |
| 아키텍처 | Pull | Push |
| 학습 곡선 | 높음 | 낮음 |
| 확장성 | 높음 | 중간 |

---

## 4. Chef

### Chef 개요

**Chef** 는 **Ruby 기반**Configuration Management 도구입니다.

```
아키텍처:
[Chef Workstation] ─→ [Chef Server] ←─ [Chef Client]
     레시피 작성         저장소          설정 적용
```

### Chef 구성 요소

| 구성 요소 | 설명 |
|----------|------|
|**Recipe**| 리소스 정의 (Ruby) |
|**Cookbook**| 레시피 모음 |
|**Resource**| 관리할 시스템 요소 |
|**Attribute**| 설정 값 |
|**Role**| 서버 유형별 설정 |

### Chef Recipe 예시

```ruby
# recipes/default.rb
cisco_interface 'GigabitEthernet0/1' do
  action :create
  description 'Configured by Chef'
  shutdown false
end

cisco_vlan '10' do
  action :create
  vlan_name 'Users'
  state 'active'
end
```

---

## 5. Terraform

### Terraform 개요

**Terraform** 은 **Infrastructure as Code (IaC)** 도구입니다.

```
특징:
- HashiCorp 제품
- 선언적 구문 (HCL)
- 다양한 Provider 지원
- 상태 관리 (State)
- Plan → Apply 워크플로우
```

### Terraform vs Ansible

| 특성 | Terraform | Ansible |
|------|-----------|---------|
| 주 용도 | 인프라 프로비저닝 | 설정 관리 |
| 접근 방식 | 선언적 | 절차적/선언적 |
| 상태 관리 | O | X |
| 멱등성 | 내장 | 모듈 의존 |

### Terraform 워크플로우

```
1. Write: 코드 작성 (.tf 파일)
2. Plan: 변경 사항 미리보기 (terraform plan)
3. Apply: 변경 적용 (terraform apply)
4. Destroy: 리소스 삭제 (terraform destroy)
```

### Terraform 예시 (AWS)

```hcl
# main.tf
provider "aws" {
  region = "us-east-1"
}

resource "aws_vpc" "main" {
  cidr_block = "10.0.0.0/16"

  tags = {
    Name = "main-vpc"
  }
}

resource "aws_subnet" "public" {
  vpc_id     = aws_vpc.main.id
  cidr_block = "10.0.1.0/24"

  tags = {
    Name = "public-subnet"
  }
}

resource "aws_instance" "web" {
  ami           = "ami-0c55b159cbfafe1f0"
  instance_type = "t2.micro"
  subnet_id     = aws_subnet.public.id

  tags = {
    Name = "web-server"
  }
}
```

### Terraform for Network

```hcl
# Cisco ACI Provider
provider "aci" {
  username = "admin"
  password = "password"
  url      = "https://apic.example.com"
}

resource "aci_tenant" "production" {
  name        = "production"
  description = "Production Tenant"
}

resource "aci_vrf" "main" {
  tenant_dn = aci_tenant.production.id
  name      = "main-vrf"
}

resource "aci_bridge_domain" "web" {
  tenant_dn = aci_tenant.production.id
  name      = "web-bd"
  vrf_dn    = aci_vrf.main.id
}
```

---

## 6. Version Control (Git)

### Git 기초

```bash
# 저장소 초기화
git init

# 파일 스테이징
git add playbook.yml

# 커밋
git commit -m "Add network configuration playbook"

# 원격 저장소 추가
git remote add origin https://github.com/user/repo.git

# 푸시
git push origin main

# 풀
git pull origin main
```

### Git 브랜치

```bash
# 브랜치 생성
git checkout -b feature/new-vlan

# 변경 후 커밋
git add .
git commit -m "Add VLAN 100 configuration"

# 메인으로 머지
git checkout main
git merge feature/new-vlan
```

### Infrastructure as Code 워크플로우

```
1. 코드 작성 (Local)
2. Git Commit/Push
3. Code Review (Pull Request)
4. CI/CD Pipeline 실행
   - Lint 검사
   - 테스트
   - 드라이런
5. Approve 후 적용
6. 결과 검증
```

---

## 7. CI/CD for Network

### CI/CD란?

```
CI (Continuous Integration):
코드 변경 시 자동으로 빌드/테스트

CD (Continuous Delivery/Deployment):
자동으로 프로덕션에 배포
```

### 네트워크 CI/CD 파이프라인

```
[Git Push] → [Jenkins/GitLab CI]
                    │
              ┌─────┴─────┐
              ▼           ▼
         [Lint 검사]  [구문 검사]
              │           │
              └─────┬─────┘
                    ▼
              [테스트 환경 배포]
                    │
                    ▼
              [검증 테스트]
                    │
                    ▼
              [승인 대기]
                    │
                    ▼
              [프로덕션 배포]
```

### GitLab CI 예시

```yaml
# .gitlab-ci.yml
stages:
  - lint
  - test
  - deploy

lint:
  stage: lint
  script:
    - ansible-lint playbooks/*.yml
    - yamllint playbooks/*.yml

test:
  stage: test
  script:
    - ansible-playbook -i inventory/test.ini playbooks/main.yml --check

deploy:
  stage: deploy
  script:
    - ansible-playbook -i inventory/prod.ini playbooks/main.yml
  when: manual
  only:
    - main
```

---

## 8. 정리

### 도구 비교 요약

| 도구 | 유형 | 에이전트 | 언어 |
|------|------|---------|------|
| **Ansible**| CM | 없음 | YAML |
|**Puppet**| CM | 있음 | Ruby DSL |
|**Chef**| CM | 있음 | Ruby |
|**Terraform**| IaC | 없음 | HCL |

### Ansible 핵심 요약

| 구성 요소 | 설명 |
|----------|------|
|**Inventory**| 관리 대상 정의 |
|**Playbook**| YAML 자동화 스크립트 |
|**Module**| 특정 작업 수행 |
|**Task**| 개별 작업 |
|**Role**| 재사용 가능한 모음 |

### 시험 포인트

- Ansible의 에이전트리스 특성
- Push vs Pull 모델 차이
- Ansible Playbook 구조 (hosts, tasks, modules)
- Terraform의 상태 관리 개념
- CI/CD 파이프라인 단계
- Git 기본 명령어

---

## 다음 장 예고

**다음 장에서는 Secure Network Access Control을 다룹니다.**

802.1X, MAB, WebAuth 등 네트워크 접근 제어 기술을 학습합니다.
