import type { ExactMatchResult } from '@/types';

// 完整的HPO术语数据（50+常见临床表型）
export const hpoDatabase: ExactMatchResult[] = [
  // 呼吸系统症状
  { hpoId: 'HP:0001945', nameEn: 'Fever', nameCn: '发热', matchScore: 1, description: 'Elevated body temperature above the normal range.' },
  { hpoId: 'HP:0012735', nameEn: 'Cough', nameCn: '咳嗽', matchScore: 1, description: 'Sudden, noisy expulsion of air from the lungs.' },
  { hpoId: 'HP:0001947', nameEn: 'Chest pain', nameCn: '胸痛', matchScore: 1, description: 'Pain in the chest region.' },
  { hpoId: 'HP:0002094', nameEn: 'Dyspnea', nameCn: '呼吸困难', matchScore: 1, description: 'Difficulty breathing or shortness of breath.' },
  { hpoId: 'HP:0002787', nameEn: 'Tachypnea', nameCn: '呼吸急促', matchScore: 1, description: 'Rapid breathing.' },
  { hpoId: 'HP:0012468', nameEn: 'Hypoxemia', nameCn: '低氧血症', matchScore: 1, description: 'Low oxygen level in the blood.' },
  { hpoId: 'HP:0002105', nameEn: 'Hemoptysis', nameCn: '咳血', matchScore: 1, description: 'Coughing up blood.' },
  { hpoId: 'HP:0006542', nameEn: 'Apnea', nameCn: '呼吸暂停', matchScore: 1, description: 'Cessation of breathing.' },

  // 神经系统症状
  { hpoId: 'HP:0002315', nameEn: 'Headache', nameCn: '头痛', matchScore: 1, description: 'Pain in the head region.' },
  { hpoId: 'HP:0001250', nameEn: 'Seizure', nameCn: '癫痫发作', matchScore: 1, description: 'Sudden, abnormal electrical activity in the brain.' },
  { hpoId: 'HP:0002353', nameEn: 'Migraine', nameCn: '偏头痛', matchScore: 1, description: 'Recurrent headache, often with nausea and visual disturbances.' },
  { hpoId: 'HP:0002386', nameEn: 'Dizziness', nameCn: '头晕', matchScore: 1, description: 'Sensation of spinning or losing balance.' },
  { hpoId: 'HP:0001258', nameEn: 'Paresthesia', nameCn: '感觉异常', matchScore: 1, description: 'Abnormal sensation such as tingling or pricking.' },
  { hpoId: 'HP:0001260', nameEn: 'Dysarthria', nameCn: '构音障碍', matchScore: 1, description: 'Difficulty in articulating words.' },
  { hpoId: 'HP:0001263', nameEn: 'Syncope', nameCn: '晕厥', matchScore: 1, description: 'Temporary loss of consciousness.' },
  { hpoId: 'HP:0002355', nameEn: 'Tremor', nameCn: '震颤', matchScore: 1, description: 'Involuntary shaking movement.' },
  { hpoId: 'HP:0001268', nameEn: 'Confusion', nameCn: '意识模糊', matchScore: 1, description: 'Mental state characterized by lack of clarity.' },
  { hpoId: 'HP:0002465', nameEn: 'Poor memory', nameCn: '记忆力差', matchScore: 1, description: 'Difficulty in remembering information.' },
  { hpoId: 'HP:0100543', nameEn: 'Cognitive impairment', nameCn: '认知障碍', matchScore: 1, description: 'Deficits in mental processes.' },

  // 消化系统症状
  { hpoId: 'HP:0002027', nameEn: 'Abdominal pain', nameCn: '腹痛', matchScore: 1, description: 'Pain in the abdominal region.' },
  { hpoId: 'HP:0002014', nameEn: 'Nausea', nameCn: '恶心', matchScore: 1, description: 'Feeling of sickness with urge to vomit.' },
  { hpoId: 'HP:0002013', nameEn: 'Vomiting', nameCn: '呕吐', matchScore: 1, description: 'Forceful expulsion of stomach contents.' },
  { hpoId: 'HP:0000952', nameEn: 'Diarrhea', nameCn: '腹泻', matchScore: 1, description: 'Frequent loose or liquid bowel movements.' },
  { hpoId: 'HP:0002015', nameEn: 'Dysphagia', nameCn: '吞咽困难', matchScore: 1, description: 'Difficulty in swallowing.' },
  { hpoId: 'HP:0000950', nameEn: 'Constipation', nameCn: '便秘', matchScore: 1, description: 'Infrequent or difficult bowel movements.' },
  { hpoId: 'HP:0001733', nameEn: 'Pancreatitis', nameCn: '胰腺炎', matchScore: 1, description: 'Inflammation of the pancreas.' },
  { hpoId: 'HP:0002020', nameEn: 'Gastritis', nameCn: '胃炎', matchScore: 1, description: 'Inflammation of the stomach lining.' },
  { hpoId: 'HP:0002240', nameEn: 'Hepatomegaly', nameCn: '肝肿大', matchScore: 1, description: 'Enlargement of the liver.' },
  { hpoId: 'HP:0002241', nameEn: 'Splenomegaly', nameCn: '脾肿大', matchScore: 1, description: 'Enlargement of the spleen.' },
  { hpoId: 'HP:0001409', nameEn: 'Jaundice', nameCn: '黄疸', matchScore: 1, description: 'Yellowing of skin and eyes due to bilirubin.' },

  // 心血管系统症状
  { hpoId: 'HP:0001680', nameEn: 'Hypertension', nameCn: '高血压', matchScore: 1, description: 'Elevated blood pressure.' },
  { hpoId: 'HP:0004322', nameEn: 'Hypotension', nameCn: '低血压', matchScore: 1, description: 'Abnormally low blood pressure.' },
  { hpoId: 'HP:0001951', nameEn: 'Palpitations', nameCn: '心悸', matchScore: 1, description: 'Awareness of heart beating.' },
  { hpoId: 'HP:0001669', nameEn: 'Tachycardia', nameCn: '心动过速', matchScore: 1, description: 'Fast heart rate.' },
  { hpoId: 'HP:0001962', nameEn: 'Bradycardia', nameCn: '心动过缓', matchScore: 1, description: 'Slow heart rate.' },
  { hpoId: 'HP:0001682', nameEn: 'Edema', nameCn: '水肿', matchScore: 1, description: 'Swelling due to fluid accumulation.' },
  { hpoId: 'HP:0001645', nameEn: 'Cardiac arrhythmia', nameCn: '心律失常', matchScore: 1, description: 'Irregular heart beat.' },
  { hpoId: 'HP:0001639', nameEn: 'Chest tightness', nameCn: '胸闷', matchScore: 1, description: 'Feeling of pressure in the chest.' },

  // 皮肤症状
  { hpoId: 'HP:0000953', nameEn: 'Rash', nameCn: '皮疹', matchScore: 1, description: 'Change in skin appearance.' },
  { hpoId: 'HP:0000964', nameEn: 'Eczema', nameCn: '湿疹', matchScore: 1, description: 'Inflamed, itchy skin.' },
  { hpoId: 'HP:0000989', nameEn: 'Pruritus', nameCn: '瘙痒', matchScore: 1, description: 'Unpleasant sensation that provokes scratching.' },
  { hpoId: 'HP:0001019', nameEn: 'Erythema', nameCn: '红斑', matchScore: 1, description: 'Redness of the skin.' },
  { hpoId: 'HP:0008066', nameEn: 'Abnormal blistering', nameCn: '水疱', matchScore: 1, description: 'Fluid-filled pockets in skin.' },
  { hpoId: 'HP:0000956', nameEn: 'Alopecia', nameCn: '脱发', matchScore: 1, description: 'Hair loss.' },
  { hpoId: 'HP:0000991', nameEn: 'Xerosis', nameCn: '皮肤干燥', matchScore: 1, description: 'Abnormally dry skin.' },
  { hpoId: 'HP:0001000', nameEn: 'Abnormality of skin pigmentation', nameCn: '色素异常', matchScore: 1, description: 'Changes in skin color.' },
  { hpoId: 'HP:0200042', nameEn: 'Skin ulcer', nameCn: '皮肤溃疡', matchScore: 1, description: 'Open sore on the skin.' },

  // 眼部症状
  { hpoId: 'HP:0000486', nameEn: 'Strabismus', nameCn: '斜视', matchScore: 1, description: 'Misalignment of the eyes.' },
  { hpoId: 'HP:0000518', nameEn: 'Cataract', nameCn: '白内障', matchScore: 1, description: 'Clouding of the eye lens.' },
  { hpoId: 'HP:0000488', nameEn: 'Retinopathy', nameCn: '视网膜病变', matchScore: 1, description: 'Damage to the retina.' },
  { hpoId: 'HP:0000554', nameEn: 'Visual impairment', nameCn: '视力障碍', matchScore: 1, description: 'Decreased ability to see.' },
  { hpoId: 'HP:0000504', nameEn: 'Glaucoma', nameCn: '青光眼', matchScore: 1, description: 'Increased pressure in the eye.' },
  { hpoId: 'HP:0000463', nameEn: 'Anteverted nares', nameCn: '鼻孔前倾', matchScore: 1, description: 'Forward-facing nostrils.' },

  // 耳鼻喉症状
  { hpoId: 'HP:0000365', nameEn: 'Hearing impairment', nameCn: '听力障碍', matchScore: 1, description: 'Decreased ability to hear.' },
  { hpoId: 'HP:0000407', nameEn: 'Otitis media', nameCn: '中耳炎', matchScore: 1, description: 'Inflammation of the middle ear.' },
  { hpoId: 'HP:0000389', nameEn: 'Tinnitus', nameCn: '耳鸣', matchScore: 1, description: 'Ringing in the ears.' },
  { hpoId: 'HP:0000204', nameEn: 'Nasal congestion', nameCn: '鼻塞', matchScore: 1, description: 'Blockage of the nasal passages.' },
  { hpoId: 'HP:0000202', nameEn: 'Epistaxis', nameCn: '鼻出血', matchScore: 1, description: 'Nosebleed.' },
  { hpoId: 'HP:0000211', nameEn: 'Tonsillitis', nameCn: '扁桃体炎', matchScore: 1, description: 'Inflammation of the tonsils.' },
  { hpoId: 'HP:0000397', nameEn: 'Hoarse voice', nameCn: '声音嘶哑', matchScore: 1, description: 'Abnormal voice quality.' },
  { hpoId: 'HP:0000193', nameEn: 'Laryngomalacia', nameCn: '喉软骨软化', matchScore: 1, description: 'Softening of laryngeal tissues.' },

  // 泌尿系统症状
  { hpoId: 'HP:0000079', nameEn: 'Dysuria', nameCn: '排尿困难', matchScore: 1, description: 'Painful or difficult urination.' },
  { hpoId: 'HP:0000093', nameEn: 'Proteinuria', nameCn: '蛋白尿', matchScore: 1, description: 'Protein in the urine.' },
  { hpoId: 'HP:0000100', nameEn: 'Hematuria', nameCn: '血尿', matchScore: 1, description: 'Blood in the urine.' },
  { hpoId: 'HP:0000083', nameEn: 'Renal insufficiency', nameCn: '肾功能不全', matchScore: 1, description: 'Decreased kidney function.' },
  { hpoId: 'HP:0000077', nameEn: 'Abnormality of the kidney', nameCn: '肾脏异常', matchScore: 1, description: 'Any abnormality of kidney structure or function.' },
  { hpoId: 'HP:0000097', nameEn: 'Polyuria', nameCn: '多尿', matchScore: 1, description: 'Excessive urine production.' },
  { hpoId: 'HP:0000088', nameEn: 'Renal calculi', nameCn: '肾结石', matchScore: 1, description: 'Kidney stones.' },
  { hpoId: 'HP:0000126', nameEn: 'Hydronephrosis', nameCn: '肾积水', matchScore: 1, description: 'Swelling of kidney due to urine buildup.' },

  // 骨骼肌肉症状
  { hpoId: 'HP:0001369', nameEn: 'Arthritis', nameCn: '关节炎', matchScore: 1, description: 'Inflammation of joints.' },
  { hpoId: 'HP:0002814', nameEn: 'Myopathy', nameCn: '肌病', matchScore: 1, description: 'Disease of muscle tissue.' },
  { hpoId: 'HP:0001252', nameEn: 'Muscle weakness', nameCn: '肌无力', matchScore: 1, description: 'Decreased muscle strength.' },
  { hpoId: 'HP:0003326', nameEn: 'Myalgia', nameCn: '肌痛', matchScore: 1, description: 'Muscle pain.' },
  { hpoId: 'HP:0001388', nameEn: 'Joint laxity', nameCn: '关节松弛', matchScore: 1, description: 'Loose joints.' },
  { hpoId: 'HP:0002650', nameEn: 'Scoliosis', nameCn: '脊柱侧弯', matchScore: 1, description: 'Abnormal curvature of the spine.' },
  { hpoId: 'HP:0002750', nameEn: 'Osteoporosis', nameCn: '骨质疏松', matchScore: 1, description: 'Decreased bone density.' },
  { hpoId: 'HP:0001382', nameEn: 'Joint hypermobility', nameCn: '关节过度活动', matchScore: 1, description: 'Increased range of joint motion.' },
  { hpoId: 'HP:0001155', nameEn: 'Gait abnormality', nameCn: '步态异常', matchScore: 1, description: 'Abnormal walking pattern.' },
  { hpoId: 'HP:0001288', nameEn: 'Gait disturbance', nameCn: '步态障碍', matchScore: 1, description: 'Difficulty in walking.' },

  // 全身症状
  { hpoId: 'HP:0004317', nameEn: 'Fatigue', nameCn: '疲劳', matchScore: 1, description: 'Extreme tiredness.' },
  { hpoId: 'HP:0004322', nameEn: 'Malaise', nameCn: '不适感', matchScore: 1, description: 'General feeling of discomfort.' },
  { hpoId: 'HP:0001518', nameEn: 'Weight loss', nameCn: '体重减轻', matchScore: 1, description: 'Unintentional reduction in body weight.' },
  { hpoId: 'HP:0001513', nameEn: 'Obesity', nameCn: '肥胖', matchScore: 1, description: 'Excess body fat.' },
  { hpoId: 'HP:0004323', nameEn: 'Failure to thrive', nameCn: '发育迟缓', matchScore: 1, description: 'Poor growth in children.' },
  { hpoId: 'HP:0001952', nameEn: 'Night sweats', nameCn: '盗汗', matchScore: 1, description: 'Excessive sweating during sleep.' },
  { hpoId: 'HP:0000988', nameEn: 'Hyperhidrosis', nameCn: '多汗症', matchScore: 1, description: 'Excessive sweating.' },
  { hpoId: 'HP:0003325', nameEn: 'Insomnia', nameCn: '失眠', matchScore: 1, description: 'Difficulty falling or staying asleep.' },
  { hpoId: 'HP:0011451', nameEn: 'Somnolence', nameCn: '嗜睡', matchScore: 1, description: 'Excessive sleepiness.' },
  { hpoId: 'HP:0001944', nameEn: 'Lethargy', nameCn: '嗜睡/精神萎靡', matchScore: 1, description: 'Lack of energy and activity.' },

  // 内分泌/代谢
  { hpoId: 'HP:0000821', nameEn: 'Hypothyroidism', nameCn: '甲状腺功能减退', matchScore: 1, description: 'Underactive thyroid.' },
  { hpoId: 'HP:0000822', nameEn: 'Hyperthyroidism', nameCn: '甲状腺功能亢进', matchScore: 1, description: 'Overactive thyroid.' },
  { hpoId: 'HP:0000842', nameEn: 'Hyperglycemia', nameCn: '高血糖', matchScore: 1, description: 'High blood sugar.' },
  { hpoId: 'HP:0000815', nameEn: 'Hypoglycemia', nameCn: '低血糖', matchScore: 1, description: 'Low blood sugar.' },
  { hpoId: 'HP:0001954', nameEn: 'Diabetes mellitus', nameCn: '糖尿病', matchScore: 1, description: 'High blood sugar due to insulin issues.' },
];

// 关键词映射表（用于智能匹配）
const keywordMap: Record<string, string> = {
  // 发热相关
  '发热': 'Fever', '发烧': 'Fever', '体温升高': 'Fever', '高热': 'Fever',
  // 咳嗽相关
  '咳嗽': 'Cough', '干咳': 'Cough', '咳': 'Cough',
  // 胸痛相关
  '胸痛': 'Chest pain', '胸闷': 'Chest tightness', '胸口痛': 'Chest pain',
  // 呼吸困难相关
  '呼吸困难': 'Dyspnea', '气短': 'Dyspnea', '喘': 'Dyspnea', '呼吸急促': 'Tachypnea',
  // 头痛相关
  '头痛': 'Headache', '头疼': 'Headache', '头晕': 'Dizziness', '眩晕': 'Dizziness',
  // 腹痛相关
  '腹痛': 'Abdominal pain', '肚子痛': 'Abdominal pain', '胃痛': 'Abdominal pain',
  // 恶心呕吐相关
  '恶心': 'Nausea', '呕吐': 'Vomiting', '干呕': 'Nausea',
  // 腹泻便秘相关
  '腹泻': 'Diarrhea', '拉肚子': 'Diarrhea', '便秘': 'Constipation',
  // 高血压相关
  '高血压': 'Hypertension', '血压高': 'Hypertension', '低血压': 'Hypotension',
  // 心悸相关
  '心悸': 'Palpitations', '心跳快': 'Tachycardia', '心跳慢': 'Bradycardia',
  // 水肿相关
  '水肿': 'Edema', '浮肿': 'Edema', '肿胀': 'Edema',
  // 皮疹相关
  '皮疹': 'Rash', '疹子': 'Rash', '瘙痒': 'Pruritus', '痒': 'Pruritus',
  // 黄疸相关
  '黄疸': 'Jaundice', '皮肤黄': 'Jaundice',
  // 关节炎相关
  '关节炎': 'Arthritis', '关节痛': 'Myalgia', '肌肉痛': 'Myalgia',
  // 疲劳相关
  '疲劳': 'Fatigue', '乏力': 'Fatigue', '累': 'Fatigue', '疲倦': 'Fatigue',
  // 其他
  '贫血': 'Anemia', '消瘦': 'Weight loss', '失眠': 'Insomnia', '嗜睡': 'Somnolence',
};

// 通过关键词查找HPO
export function findHPOByKeyword(keyword: string): ExactMatchResult | null {
  const normalizedKeyword = keyword.trim();
  // 首先尝试精确匹配ID
  const exactMatch = hpoDatabase.find(item =>
    item.hpoId.toLowerCase() === normalizedKeyword.toLowerCase()
  );
  if (exactMatch) return exactMatch;

  // 然后尝试匹配英文名称
  const enMatch = hpoDatabase.find(item =>
    item.nameEn.toLowerCase() === normalizedKeyword.toLowerCase()
  );
  if (enMatch) return enMatch;

  // 尝试匹配中文名称
  const cnMatch = hpoDatabase.find(item =>
    item.nameCn === normalizedKeyword
  );
  if (cnMatch) return cnMatch;

  // 尝试通过关键词映射
  const mappedKeyword = keywordMap[normalizedKeyword];
  if (mappedKeyword) {
    const mappedMatch = hpoDatabase.find(item =>
      item.nameEn === mappedKeyword || item.nameCn === normalizedKeyword
    );
    if (mappedMatch) return mappedMatch;
  }

  return null;
}

// 模糊搜索HPO
export function fuzzySearchHPO(query: string): ExactMatchResult[] {
  const normalizedQuery = query.toLowerCase().trim();
  if (!normalizedQuery) return [];

  return hpoDatabase.filter(item => {
    return (
      item.hpoId.toLowerCase().includes(normalizedQuery) ||
      item.nameEn.toLowerCase().includes(normalizedQuery) ||
      item.nameCn.includes(query) ||
      item.description?.toLowerCase().includes(normalizedQuery)
    );
  }).slice(0, 20); // 限制返回20条结果
}

// 获取热门HPO（用于建议）
export function getPopularHPO(): ExactMatchResult[] {
  return [
    hpoDatabase[0],  // Fever
    hpoDatabase[1],  // Cough
    hpoDatabase[2],  // Chest pain
    hpoDatabase[3],  // Dyspnea
    hpoDatabase[9],  // Headache
    hpoDatabase[16], // Abdominal pain
    hpoDatabase[34], // Rash
    hpoDatabase[42], // Fatigue
  ];
}
