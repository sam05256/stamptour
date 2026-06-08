export type MissionType = 'quiz' | 'action' | 'input'

export interface QuizMission {
  type: 'quiz'
  question: string
  options: string[]
  answer: number
}

export interface ActionMission {
  type: 'action'
  description: string
  buttonText: string
}

export interface InputMission {
  type: 'input'
  description: string
  placeholder: string
  buttonText: string
}

export type Mission = QuizMission | ActionMission | InputMission

export interface Location {
  id: string
  name: string
  floor: string
  emoji: string
  description: string
  color: string
  mission: Mission
  qrSecret: string
  hintText?: string
}

export const LOCATIONS: Location[] = [
  {
    id: 'stairs',
    name: '안랩 계단',
    floor: '1층',
    emoji: '🏛️',

    color: '#FF6B6B',
    description:
      '지금 보시는 \'안랩 계단\'은 영화 \'로마의 휴일\'에 등장하는 스페인 계단을 모티브로 한 것입니다. 일반적인 건물 로비는 단순히 출입을 위한 공간에 그치는데 반해, 안랩의 로비는 독특한 계단과 함께 복합적인 기능을 제공하는 열린 문화 공간이라 할 수 있습니다. 계단과 주변 공간을 포함해 약 400여명이 이곳에서 강연, 공연, 세미나 등 간단한 행사 및 이벤트를 경험할 수 있습니다.',
    mission: {
      type: 'quiz',
      question: '안랩 계단은 어떤 영화의 어떤 장소를 모티브로 했나요?',
      options: [
        '로마의 휴일, 스페인 계단',
        '타이타닉, 선실 계단',
        '해리포터, 호그와트 계단',
        '인터스텔라, 우주선 통로',
      ],
      answer: 0,
    },
    qrSecret: 'stairs-secret-2026',
    hintText: "영화 '로마의 휴일'에 등장하는 스페인 계단을 모티브로 한 것입니다",
  },
  {
    id: 'history',
    name: '히스토리관',
    floor: '1층',
    emoji: '🏆',

    color: '#4ECDC4',
    description:
      '히스토리관에는 안랩의 다양한 보안 소프트웨어 및 네트워크 어플라이언스 제품이 전시되어 있습니다. 안티바이러스 제품인 V3에서 시작한 안랩은 현재 보안의 모든 영역을 커버하는 통합보안기업으로서 다양한 제품과 기술을 보유하고 있습니다. 이곳에 전시된 각종 상패가 국제적으로 인정받고 있는 안랩의 기술력의 증거라 할 수 있습니다. 반대편에 있는 벽면에는 안랩의 역사를 한 눈에 볼 수 있는 사진이 전시되어 있습니다. 1995년 창업 당시부터 현재에 이르기까지 매년 전 직원이 함께 기념 사진을 찍고 있습니다.',
    mission: {
      type: 'quiz',
      question: '안랩은 몇 년에 처음 생겼을까요? 🏢 (창업 연도)',
      options: ['1990년', '1995년', '2000년', '2005년'],
      answer: 1,
    },
    qrSecret: 'history-secret-2026',
    hintText: '1995년 창업 당시부터 현재에 이르기까지 매년 전 직원이 함께 기념 사진을 찍고 있습니다',
  },
  {
    id: 'cafe',
    name: '카페',
    floor: '1층',
    emoji: '☕',
  
    color: '#FFE66D',
    description:
      '안랩의 카페 역시 \'소통\'을 컨셉으로 마련되었습니다. 전 직원에게 저렴한 가격으로 다양한 메뉴를 제공하고 있으며, 파티션 없이 넓게 트인 공간에서 직원은 물론 방문객들이 자유롭고 편안한 대화를 나눌 수 있도록 디자인되었습니다. 카페테리아 천정을 보시면 안랩의 비전인 \'안전해서 더욱 자유로운 세상\'을 직원들이 오고가며 눈에 담을 수 있도록 구조물로 전시되어 있습니다.',
    mission: {
      type: 'input',
      description: '부모님에 대해 얼마나 알고 있나요? 🧐\n부모님이 제일 좋아하시는 음료가 뭔지 알아요? 한번 적어봐요!',
      placeholder: '예) 아메리카노, 녹차, 콜라...',
      buttonText: '제출!',
    },
    qrSecret: 'cafe-secret-2026',
  },
  {
    id: 'qa',
    name: 'QA룸',
    floor: '8층',
    emoji: '🔬',

    color: '#A8E6CF',
    description:
      '안랩은 보안SW를 비롯해 다양한 네트워크 보안 장비 또한 활발하게 제공하고 있습니다. 네트워크 QA룸은 네트워크 어플라이언스 제품들이 고객에게 안정적으로 전달될 수 있도록 품질보증(QA) 프로세스를 수행하는 곳입니다. 각각의 제품에 따른 QA 공간을 구축하고 각자의 업무공간에서 원격으로 테스트 할 수 있도록 설계되어 있으며, 완벽한 품질을 위해 모든 테스트 장비들이 최고의 장비들과 시스템으로 운영되고 있습니다.',
    mission: {
      type: 'quiz',
      question: 'QA(Quality Assurance)는 무슨 뜻인가요?',
      options: ['빠른 응답', '품질 보증', '보안 분석', '코드 검토'],
      answer: 1,
    },
    qrSecret: 'qa-secret-2026',
    hintText: '품질보증(QA) 프로세스를 수행하는 곳입니다',
  },
  {
    id: 'soc',
    name: 'SOC (관제센터)',
    floor: '9층',
    emoji: '🛡️',

    color: '#C3A6FF',
    description:
      'SOC(Security Operation Center)는 기업이나 공공기관 등 고객사의 네트워크 환경을 24시간 365일 모니터링으로 관제서비스를 수행하는 곳입니다. 예를 들어 고객사 홈페이지에 DDoS 공격 등 사이버 침해의 움직임을 포착하고 이에 실시간으로 대응하는 업무를 수행합니다. 실제로 지난 2009년 7.7 DDoS, 2011년 3.4 DDoS 공격을 가장 먼저 포착한 곳으로, 민간 사이버 사령부와 같은 공간인 셈입니다.',
    mission: {
      type: 'quiz',
      question: 'SOC가 하는 일은 무엇인가요?',
      options: [
        '직원 교육',
        '24시간 사이버 위협 모니터링',
        '신제품 개발',
        '고객 상담',
      ],
      answer: 1,
    },
    qrSecret: 'soc-secret-2026',
    hintText: '고객사의 네트워크 환경을 24시간 365일 모니터링으로 관제서비스를 수행하는 곳입니다',
  },
  {
    id: 'lounge',
    name: '휴게실',
    floor: '10층',
    emoji: '📚',

    color: '#FFB347',
    description:
      '각 층마다 직원의 편안한 휴식을 위한 휴게실과 다양한 편의시설이 마련되어 있습니다. 모든 휴게실에는 스크린이 구비되어 있는데, 이러한 스크린을 통해 사내 행사나 공지 사항, 최신 이슈 등 다양한 정보를 공유하고 있습니다. 10층 휴게실은 작은 도서관으로 운영되고 있습니다. 매월 신간 도서들이 입고되고 있으며, 자율적으로 도서 대출이 가능한 시스템을 갖추고 있습니다.',
    mission: {
      type: 'action',
      description: '지금 바로 부모님께 "사랑해요!" 라고 말하고 오세요 💛\n직접 말하고 돌아오면 버튼을 눌러요!',
      buttonText: '말하고 왔어요!',
    },
    qrSecret: 'lounge-secret-2026',
  },
  {
    id: 'rooftop',
    name: '옥상정원',
    floor: '10층',
    emoji: '🌿',

    color: '#74C0FC',
    description:
      '안랩의 옥상 또한 공조시설로 채워져 있는 다른 건물들과는 달리, 직원들의 휴게 공간으로 활용되고 있습니다. 벤치에 앉아 시원한 바람 속에서 다양한 대화를 나누는 공간으로, IT에 인간적인 정서가 반영되리라 기대하고 있습니다. 작은 정원처럼 꾸며진 이곳에서 직원들은 복잡한 업무 중 잠시 휴식을 통해 머리를 식히는 등 정서적인 재충전을 할 수 있습니다.',
    mission: {
      type: 'input',
      description: '3일간의 코딩캠프에서 가장 재미있었던 순간은 뭐예요? 🌤️\n잊기 전에 지금 바로 적어봐요!',
      placeholder: '예) 로봇 코딩하기, 친구랑 같이 밥먹기...',
      buttonText: '저장!',
    },
    qrSecret: 'rooftop-secret-2026',
  },
]

export function getLocationById(id: string): Location | undefined {
  return LOCATIONS.find((l) => l.id === id)
}

export function getLocationBySecret(secret: string): Location | undefined {
  return LOCATIONS.find((l) => l.qrSecret === secret)
}
