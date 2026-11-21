/**
 * Offline "smart templates" used when no AI model is reachable (no API key, or the static GitHub Pages
 * build where there is no server). Pure functions: the API routes and the browser both call them.
 */

export interface ExperienceInput {
  id?: string;
  company?: string;
  position?: string;
  startDate?: string;
  endDate?: string;
  isCurrent?: boolean;
  rawDescription?: string;
  aiBullets?: string[];
}

export interface EducationInput {
  institution?: string;
  faculty?: string;
  level?: string;
  graduationYear?: number;
}

export function generateFallbackAIContent(
  targetPosition: string,
  age: number | null,
  hasNoExperience: boolean,
  tone: 'formal' | 'dynamic' | 'concise',
  experience: ExperienceInput[],
  education: EducationInput[],
  skills: string[]
) {
  const role = targetPosition || 'Специалист';
  const skillsList = skills.length > 0 ? skills.slice(0, 4).join(', ') : 'ключевыми профессиональными навыками';
  const expCount = experience.length;

  let summary = '';
  let highlights: string[] = [];

  if (hasNoExperience || expCount === 0) {
    const edu = education[0];
    const eduContext = edu ? ` на базе профильного образования в ${edu.institution || 'ведущем вузе'}` : '';

    if (tone === 'formal') {
      summary = `Целеустремленный начинающий специалист в области «${role}»${eduContext}. Обладает фундаментальной теоретической подготовкой, владеет ${skillsList} и ориентирован на эффективное решение поставленных бизнес-задач. Стремится применить академические знания и готов быстро осваивать корпоративные регламенты и стандарты.`;
      highlights = [
        `Профильная подготовка и владение современным стеком (${skillsList})`,
        'Высокая обучаемость и готовность к оперативному погружению в проектные задачи',
        'Внимательность к деталям и соблюдение проектных стандартов качества',
        'Аналитический склад ума и структурированный подход к решению задач',
      ];
    } else if (tone === 'concise') {
      summary = `Начинающий ${role}. Владеет стеком: ${skillsList}. Высокая обучаемость, ориентация на результат, готовность к интенсивной работе над сложными задачами.`;
      highlights = [
        `Техническая база: ${skillsList}`,
        'Быстрое освоение новых инструментов',
        'Ответственность за результат и соблюдение дедлайнов',
      ];
    } else {
      // dynamic
      summary = `Проактивный специалист на позицию «${role}» с сильной базой в ${skillsList}${eduContext}. Быстро погружаюсь в незнакомые технологии, умею доводить задачи до осязаемого результата и открыт к сложным профессиональным вызовам.`;
      highlights = [
        `Уверенное владение ключевыми инструментами: ${skillsList}`,
        'Проактивность и инициативность в решении рабочих вопросов',
        'Умение быстро перенимать лучшие командные практики и адаптироваться к изменениям',
        'Ориентация на бизнес-ценность и качество финального продукта',
      ];
    }
  } else {
    const latestCompany = experience[0]?.company || 'ведущих компаниях';

    if (tone === 'formal') {
      summary = `Квалифицированный специалист в направлении «${role}» с подтвержденным практическим опытом работы в ${latestCompany}. Владеет методологиями управления проектами и современным инструментарием (${skillsList}). Демонстрирует системный подход к оптимизации бизнес-процессов, высокий уровень профессиональной ответственности и умение выстраивать надежное кросс-функциональное взаимодействие.`;
      highlights = [
        `Экспертиза в роли «${role}» и успешный трек-рекорд в компании ${latestCompany}`,
        `Глубокое владение профессиональным стеком: ${skillsList}`,
        'Умение выстраивать эффективную коммуникацию со стейкхолдерами и смежными командами',
        'Оптимизация рабочих процессов и фокус на сокращение времени доставки ценности (Time-to-Market)',
      ];
    } else if (tone === 'concise') {
      summary = `Опытный ${role}. Экспертиза в оптимизации процессов, управлении задачами и внедрении решений на базе ${skillsList}. Фокус на бизнес-эффекте и соблюдении сроков.`;
      highlights = [
        `Ключевая экспертиза: ${role}`,
        `Стек и инструменты: ${skillsList}`,
        'Достижение плановых показателей и соблюдение SLA/дедлайнов',
      ];
    } else {
      // dynamic
      summary = `Результативный «${role}» с опытом успешной реализации проектов в ${latestCompany}. Специализируюсь на создании прозрачных процессов, внедрении лучших практик и масштабировании результатов за счет ${skillsList}. Умею переводить потребности бизнеса в четкие технические и продуктовые решения, драйвить команду к победам.`;
      highlights = [
        `Управление полным циклом delivery в качестве «${role}»`,
        `Практический стек и экспертиза: ${skillsList}`,
        'Внедрение изменений, сокращающих издержки и повышающих скорость работы',
        'Сильные лидерские качества и умение сплотить команду вокруг цели',
      ];
    }
  }

  // No generic skill list here: the client falls back to curated skills for the detected role.
  const suggestedSkills: string[] = [];

  return { summary, highlights, suggestedSkills };
}


export function generateFallbackBullets(
  position: string,
  company: string,
  rawDescription: string,
  tone: 'formal' | 'dynamic' | 'concise' = 'dynamic'
): string[] {
  const lines = rawDescription
    .split(/[\n,;.]+/)
    .map((l) => l.trim())
    .filter((l) => l.length > 3);

  const actionVerbsDynamic = [
    'Оптимизировал и масштабировал',
    'Разработал и успешно внедрил',
    'Организовал эффективные процессы для',
    'Увеличил ключевые показатели эффективности за счет',
    'Успешно реализовал проект по',
  ];

  const actionVerbsFormal = [
    'Осуществлял координацию и управление',
    'Обеспечил соблюдение стандартов качества и сроков при',
    'Разработал регламенты и документацию для',
    'Выполнял мониторинг и анализ',
    'Организовал взаимодействие структурных подразделений по',
  ];

  const actionVerbsConcise = [
    'Разработка и запуск',
    'Оптимизация процессов',
    'Контроль качества и сроков',
    'Внедрение решений для',
    'Управление проектом',
  ];

  const verbs =
    tone === 'formal'
      ? actionVerbsFormal
      : tone === 'concise'
      ? actionVerbsConcise
      : actionVerbsDynamic;

  if (lines.length === 0) {
    return [
      `Успешно выполнял обязанности на позиции «${position || 'Специалист'}» в компании «${company || 'Организация'}».`,
      'Внедрил решения, позволившие оптимизировать текущие рабочие процессы.',
      'Обеспечил своевременное выполнение поставленных KPI и проектных задач.',
    ];
  }

  return lines.slice(0, 5).map((line, idx) => {
    const verb = verbs[idx % verbs.length];
    const cleanedLine = line.charAt(0).toLowerCase() + line.slice(1);
    if (tone === 'concise') {
      return `${verb}: ${cleanedLine}`;
    }
    return `${verb} ${cleanedLine}, обеспечив высокое качество результата.`;
  });
}

