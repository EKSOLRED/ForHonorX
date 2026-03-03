// Данные героя: Warden
window.FH_HERO_DATA = window.FH_HERO_DATA || {};
window.FH_HERO_DATA.warden = {
  meta: {
    id: 'warden',
    name: { ru: 'Страж', en: 'Warden' },
    role: { ru: 'Авангард', en: 'Vanguard' },
    factionKey: 'factions.knights',
    tags: [
      { ru: 'Рыцари', en: 'Knights' },
      { ru: 'Гендер: Мужчина/Женщина', en: 'Gender: Male/Female' }
    ],
    image: 'heroes/warden/img/warden.webp'
  },
  overview: {
    ru: "«Меч — продолжение воли. Держи стойку, дыши ровно — и враг сам откроется.»\n\nСоветы:\n• Разгоняй давление через плечо/баш, но не становись предсказуемым.\n• После парирования думай о позиции: стена часто решает раунд.\n• Меняй темп: иногда лучший микс — это пауза.",
    en: "\"A blade is an extension of will. Hold your stance, breathe steady \u2014 and the enemy will open up.\"\n\nTips:\n\u2022 Use shoulder pressure, but don\u2019t become predictable.\n\u2022 After a parry, think about positioning\u2014walls win rounds.\n\u2022 Change tempo: sometimes the best mixup is a pause."
  },
  quickFacts: [
    { key: { ru: 'Здоровье', en: 'Health' }, value: { ru: '130', en: '130' } },
    { key: { ru: 'Выносливость', en: 'Stamina' }, value: { ru: '120', en: '120' } },
    { key: { ru: 'Скорость бега', en: 'Run speed' }, value: { ru: '6.5 м/с', en: '6.5 m/s' } },
    { key: { ru: 'Скорость ходьбы: Вперёд', en: 'Walk speed: Forward' }, value: { ru: '1.5 м/с', en: '1.5 m/s' } },
    { key: { ru: 'Скорость ходьбы: Назад', en: 'Walk speed: Backward' }, value: { ru: '1 м/с', en: '1.0 m/s' } },
    { key: { ru: 'Скорость ходьбы: В сторону', en: 'Walk speed: Side' }, value: { ru: '0.5 м/с', en: '0.5 m/s' } },
    { key: { ru: 'Восстановление после уворота вперёд', en: 'Forward dodge recovery' }, value: { ru: '300 мс', en: '300 ms' } },
    { key: { ru: 'Тип защиты в увороте', en: 'Dodge guard type' }, value: { ru: 'Нет', en: 'None' } },
    { key: { ru: 'Стандартная стойка защиты', en: 'Default guard stance' }, value: { ru: 'Справа', en: 'Right' } },
    { key: { ru: 'Усиленные атаки вне Об.режима', en: 'Enhanced attacks out of OOL' }, value: { ru: 'Нет', en: 'No' } }
  ],
  moves: {
      sections: [
        {
          id: 'basic',
          open: true,
          title: {
            ru: 'Базовые атаки',
            en: 'Basic attacks'
          },
          cards: [
            {
              title: {
                ru: 'Верхний лёгкий удар в начале серии ',
                en: 'Top Light Opener'
              },
              icon: "assets/ui/icons/moves/SuperiorBlock.webp",
              damage: 12,
              stamina: 9,
              speed: 500,
              fields: {
                ru: {
                  activation: 'Легкая атака сверху',
                  side: 'Верх',
                  stun: 'Легкое',
                  special: 'Надежная защита',
                  superiorblockw: '100-300 мс'
                },
                en: {
                  activation: 'Top Light',
                  side: 'Top',
                  stun: 'Light',
                  special: 'Superior Block',
                  superiorblockw: '100-300 ms'
                }
              },
              note: {
                ru: 'В районе 100-300 мс эта атака имеет превосходный блок, благодаря которому вы можете перебить обычные атаки',
                en: 'In the 100–300 ms range, this attack has superior block properties, allowing you to interrupt regular attacks'
              }
            },
            {
              title: {
                ru: 'Боковой лёгкий удар в начале серии ',
                en: 'Side Light Opener'
              },
              damage: 10,
              stamina: 9,
              speed: 500,
              fields: {
                ru: {
                  icon: "",
                  activation: 'Легкая атака сбоку',
                  side: 'Сбоку',
                  stun: 'Легкое',
                },
                en: {
                  activation: 'Side Light',
                  side: 'Side',
                  stun: 'Light',
                }
              },
              note: {
                ru: `Если вы попали по противнику, а точнее ранили его, то можете дать с той же стороны ещё один легкий удар гарантировано с уроном в 5 единиц.
                Это так же позволит вам дать толчок плечом`,
                en: `On hit (when the opponent is wounded), you can guarantee a second light attack from the same side for 5 damage.
                This also enables a shoulder bash.`
              }
            },
            {
              title: {
                ru: 'Легкий верхний удар в серии',
                en: 'Chain Top Light'
              },
              damage: 13,
              stamina: 9,
              speed: 500,
              fields: {
                ru: {
                  activation: 'Легкая атака',
                  side: 'Верх',
                  stun: 'Легкое',
                },
                en: {
                  activation: 'Light Opener',
                  side: 'Top',
                  stun: 'Light',
                }
              },
            },
            {
              title: {
                ru: 'Легкий боковой удар в серии',
                en: 'Chain Side Light'
              },
              damage: 14,
              stamina: 9,
              speed: 500,
              fields: {
                ru: {
                  activation: 'Легкая атака',
                  side: 'Верх',
                  stun: 'Легкое',
                },
                en: {
                  activation: 'Light',
                  side: 'Side',
                  stun: 'Light',
                }
              },
            },
            {
              title: {
                ru: 'Тяжелый удар сверху в начале серии',
                en: 'Top Heavy Opener'
              },
              damage: 27,
              stamina: 12,
              speed: 900,
              fields: {
                ru: {
                  activation: 'Тяжелый удар сверху',
                  side: 'Сверху',
                  stun: 'Среднее',
                },
                en: {
                  activation: 'Top Heavy',
                  side: 'Top',
                  stun: 'Medium',
                }
              },
            },
            {
              title: {
                ru: 'Верхний тяжелый удар конец серии ',
                en: 'Top Heavy Finisher'
              },
              icon: "assets/ui/icons/moves/Unblockable.webp",
              damage: 32,
              stamina: 12,
              speed: 900,
              fields: {
                ru: {
                  activation: 'Тяжелый удар сверху',
                  windowactive: '100мс',
                  side: 'Верх',
                  stun: 'Тяжелое',
                  special: 'Неблокируемый',
                },
                en: {
                  activation: 'Top Heavy',
                  windowactive: '100ms',
                  side: 'Top',
                  stun: 'Heavy',
                  special: 'Unblockable',
                }
              },
            },
            {
              title: {
                ru: 'Тяжелый удар сбоку в начале серии',
                en: 'Side Heavy Opener'
              },
              damage: 24,
              stamina: 12,
              speed: 800,
              fields: {
                ru: {
                  activation: 'Тяжелый удар сбоку',
                  side: 'Сбоку',
                  stun: 'Среднее',
                },
                en: {
                  activation: 'Side Heavy',
                  side: 'Side',
                  stun: 'Medium',
                }
              },
            },
            {
              title: {
                ru: 'Боковой тяжелый удар конец серии ',
                en: 'Side Heavy Finisher'
              },
              icon: "assets/ui/icons/moves/Unblockable.webp",
              damage: 28,
              stamina: 12,
              speed: 800,
              fields: {
                ru: {
                  activation: 'Тяжелый удар',
                  windowactive: '100мс',
                  side: 'Сбоку',
                  stun: 'Тяжелое',
                  special: 'Неблокируемый',
                },
                en: {
                  activation: 'Heavy',
                  windowactive: '100ms',
                  side: 'Side',
                  stun: 'Heavy',
                  special: 'Unblockable',
                }
              },
            }
          ]
        },
        {
          id: 'running_attacks',
          open: true,
          title: {
            ru: 'Атаки на бегу',
            en: 'Running Attacks'
          },
          cards: [
            {
              title: {
                ru: 'Стремительный удар',
                en: 'Rushing Slash'
              },
              damage: 12,
              stamina: 12,
              speed: 400,
              fields: {
                ru: {
                  activation: 'Тяжелый удар',
                  side: 'Слева',
                  stun: 'Легкое',
                },
                en: {
                  activation: 'Heavy',
                  side: 'Left',
                  stun: 'Light',
                }
              },
              note: {
                ru: 'Может переводится в толчок плечом или тяжелый удар конец серии',
                en: 'Can chain into a shoulder bash or a heavy finisher'
              }
            }
          ]
        },
        {
          id: 'zone_attacks',
          open: true,
          title: {
            ru: 'Атаки по области',
            en: 'Zone attacks'
          },
          cards: [
            {
              title: {
                ru: 'Атака по области',
                en: 'Zone'
              },
              icon: '',
              damage: 13,
              stamina: 30,
              speed: 500,
              fields: {
                ru: {
                  activation: 'Атака по области',
                  side: 'Справа',
                  stun: 'Средний',
                },
                en: {
                  activation: 'Zone',
                  side: 'Right',
                  stun: 'Medium',
                }
              },
              note: {
                ru: 'Может перейти в тяжёлую атаку заканчивающую серию или удар плечом. Имеет короткое восстановление, что позволяет парировать некоторые атаки или уклоняться',
                en: 'It chains into a heavy finisher and a shoulder bash, and it has a short recovery, so you can parry some attacks, or dodge'
              }
            }
          ]
        },
        {
          id: 'confirmed_attacks',
          open: true,
          title: {
            ru: 'Гарантированные атаки',
            en: 'Confirmed Attacks'
          },
          cards: [
            {
              title: {
                ru: 'Двойные боковые легкие атаки',
                en: 'Double Side Light'
              },
              damage: 5,
              stamina: 6,
              speed: 200,
              fields: {
                ru: {
                  activation: 'Легкий удар сбоку + Легкий удар сбоку',
                  windowactive: '100-200мс',
                  side: 'Сбоку',
                  stun: 'Легкое',
                  special: 'Гарантированно',
                },
                en: {
                  activation: 'Side Light + Side light',
                  windowactive: '100-200мс',
                  side: 'Side',
                  stun: 'Light',
                  special: 'Guaranteed',
                }
              },
            }
          ]
        },
        {
          id: 'ripostes',
          open: true,
          title: {
            ru: 'Контрудары',
            en: 'Ripostes'
          },
          cards: [
            {
              title: {
                ru: 'Сокрушительный контрудар',
                en: 'Crushing Counterstrike'
              },
              icon: "assets/ui/icons/moves/SuperiorBlock.webp",
              damage: 20,
              speed: 500,
              fields: {
                ru: {
                  activation: 'Надежная защита',
                  side: 'Сверху',
                  stun: 'Среднее',
                  special: 'Неблокируемый',
                },
                en: {
                  activation: 'Side Light + Side light',
                  windowactive: '100-200мс',
                  side: 'Side',
                  stun: 'Medium',
                  special: 'Guaranteed',
                },
                },
                note: {
                    ru: `Если вы наносите удар во время верхней атаки противника, ваш лёгкий удар становится неблокируемым и наносит повышенный урон.
                    Это также гарантирует второй лёгкий удар с той же стороны (сверху)`,
                    en: `If you strike during an opponent’s top attack, your light becomes unblockable and deals increased damage.
                    It also guarantees a second light attack from the same side (top)`
                  }
            }
          ]
        },
      ]
    },

  


  


  punishes: {
  types: [
  { id: 'gb',                 ru: 'ГБ (Захват)', en: 'GB (Grab)' },

  { id: 'parry_light',        ru: 'Парирование лёгкой атаки', en: 'Light Parry' },
  { id: 'parry_heavy',        ru: 'Парирование тяжёлой атаки', en: 'Heavy Parry' },

  { id: 'oos_parry',          ru: 'Парирование без выносливости', en: 'OOS Parry' },
  { id: 'oos_throw',          ru: 'Бросок без выносливости', en: 'OOS Throw' },
  { id: 'oos_no_lock',        ru: 'Без выносливости + Вне захвата цели', en: 'OOS + No Lock' },

  { id: 'rage_parry',         ru: 'Парирование Яростью', en: 'Revenge Parry' },
  { id: 'counter_strike',     ru: 'Контр удар', en: 'Counter Strike' },

  { id: 'walls',              ru: 'У стены', en: 'Wall' },
  ],

  columns: [
    { id:'type',   ru:'Тип', en:'Type', sortable:false },
    { id:'name',   ru:'Наказание', en:'Punish', sortable:true },
    { id:'dmg',    ru:'Урон', en:'Dmg', sortable:true, numeric:true },
    { id:'stam',   ru:'Выносл.', en:'Stam', sortable:true, numeric:true },
    { id:'note',   ru:'Заметка', en:'Note', sortable:true },
  ],

  rows: [
    {
    type:'parry_light',
    name:{ ru:'Легкий удар сверху (Без стамины)', en:'(OOS) Top Light' },
    dmg:12,
    stam:9,
    note:'...'
    },
    {
    type:'parry_light',
    name:{ ru:'Тяжелый удар сверху', en:'Top Heavy' },
    dmg:27,
    stam:12,
    note:'...'
    },
    {
    type:'parry_heavy',
    name:{ ru:'Толчок плечом вперед + Двойной легкий удар сбоку', en:'Forward Dodge Shoulder Bash + Double Side Lights' },
    dmg:15,
    stam:27,
    note:{
    ru:'',
    en:''
     }
    },
    {
    type:'parry_heavy',
    name:{ ru:'Двойной легкий удар сбоку', en:'Double Side Lights' },
    dmg:15,
    stam:27,
    note:'...'
    },
    {
    type:'parry_heavy',
    name:{ ru:'Удар по области', en:'Zona' },
    dmg:15,
    stam:27,
    note:{
    ru:'Широкий хитбокс',
    en:'Wide hitbox'
     }
    },
    {
    type:'gb',
    name:{ ru:'Тяжелый удар сбоку', en:'Side Heavy' },
    dmg:24,
    stam:12,
    note:'...'
    },
    {
    type:'gb',
    name:{ ru:'Легкий удар сверху (Без выносливости)', en:'(OSS) Top Light' },
    dmg:12,
    stam:9,
    note:'...'
    },
    {
    type:'walls',
    name:{ ru:'Тяжелый удар сверху', en:'Top Heavy' },
    dmg:27,
    stam:12,
    note:'...'
    },
    {
    type:'walls',
    name:{ ru:'Тяжелый удар сверху (Без выносливости)', en:'(OSS) Top Heavy' },
    dmg:27,
    stam:12,
    note:{
    ru:'Требуется достаточный радиус действия',
    en:'Sufficient range is required'
     }
    },
    {
    type:'oos_parry',
    name:{ ru:'Атака по области + Тяжелый удар сверху', en:'Zone + Top Heavy' },
    dmg:45,
    stam:42,
    note:{
    ru:'Небезопасно, добивание',
    en:'Unsafe, executes.'
     }
    },
    {
    type:'oos_parry',
    name:{ ru:'Легкий удар сверху + Тяжелый удар сверху', en:'Top Light + Top Heavy' },
    dmg:44,
    stam:21,
    note:{
    ru:'Тратит меньше выносливости, Небезопасно, можно сделать добивание',
    en:'Costs less stamina, is unsafe, and can be done with an execution.'
     }
    },
    {
    type:'oos_parry',
    name:{ ru:'Легкий удар сверху + Тяжелый удар начинающий серию', en:'Top Light + Neutral Heavy' },
    dmg:39,
    stam:21,
    note:{
    ru:'Можно продолжить неблокируемым тяжелым ударом',
    en:'Can be followed up with an unblockable heavy attack'
     }
    },
    {
    type:'oos_parry',
    name:{ ru:'Атака по области + Тяжелый удар сбоку', en:'Zone + Side Heavy' },
    dmg:39,
    stam:21,
    note:{
    ru:'Достаточно безопасно, можно добивать',
    en:'Safe enough, execution'
     }
    },
    {
    type:'oos_throw',
    name:{ ru:'Атака по области + Тяжелый удар сверху', en:'Zone + Top Heavy' },
    dmg:45,
    stam:42,
    note:'...'
    },
    {
    type:'oos_throw',
    name:{ ru:'Бросок вперед + Легкий удар сверху + Тяжелый удар сверху', en:'Forward Throw + Top Light + Top Heavy' },
    dmg:44,
    stam:21,
    note:{
    ru:'Достаточно безопасно, можно добивать',
    en:'Safe enough, execution'
     }
    },
    {
    type:'oos_throw',
    name:{ ru:'Бросок вперед + Легкий удар сверху + Тяжелый удар начинающий серию', en:'Forward Throw + Top Light + Neutral Heavy' },
    dmg:39,
    stam:21,
    note:{
    ru:'Достаточно безопасно, можно добивать',
    en:'Safe enough, execution'
     }
    },
    {
    type:'rage_parry',
    name:{ ru:'Атака по области + Тяжелый удар сверху', en:'Zone + Top Heavy' },
    dmg:58.5,
    stam:0,
    note:''
    },
    {
    type:'rage_parry',
    name:{ ru:'Легкий удар сверху + Тяжелый удар сверху', en:'Top Light + Top Heavy' },
    dmg:57.2,
    stam:0,
    note:''
    },
    {
    type:'oos_no_lock',
    name:{ ru:'Любой тяжелый удар/Атака по области/Тяжелый удар с уворот вперед + Тяжелый удар сверху', en:'Any Heavy/Zone/Dodge Forward Heavy + Top Heavy' },
    dmg:59,
    stam:24,
    note:''
    },
    {
    type:'oos_no_lock',
    name:{ ru:'Незадержанный толчок плечом + Атака по области + Тяжелый удар сверху', en:'Uncharged Shoulder Bash + Zone + Top Heavy' },
    dmg:45,
    stam:54,
    note:''
    },
    {
    type:'oos_no_lock',
    name:{ ru:'Легкий удар сбоку + Двойной легкий удар сбоку + Незадержанный толчок плечом + Двойной легкий удар сбоку', en:'Side Light + Double Light + Uncharged Shoulder Bash + Double Light' },
    dmg:30,
    stam:42,
    note:''
    },
    {
    type:'oos_no_lock',
    name:{ ru:'Полностью заряженный толчок плечом + Тяжелый удар сверху + Тяжелый удар сверху', en:'Fully Charged Shoulder Bash + Top Heavy + Top Heavy' },
    dmg:59,
    stam:36,
    note:''
    },
    {
    type:'counter_strike',
    name:{ ru:'Супер легкий удар сверху + Легкий удар сверху', en:'Superior Block Top Light -> Top Light' },
    dmg:33,
    stam:9,
    note:''
    },
  ]
  },

  // Добивания героя
  executions: {
    ru: [
      { name: "Береги голову", killTime: '2800ms', useTime: '6300ms', totalTime: '6200m', heal: '+50', ragdoll: 'Нет', notes: '', video: '' },
      { name: "Вихрь казни", killTime: '2000ms', useTime: '3000ms', totalTime: '3500ms', heal: '+20', ragdoll: 'No', notes: '', video: '' },
      { name: "Нокаут", killTime: '6100ms', useTime: '9300ms', totalTime: '10200ms', heal: '+50', ragdoll: 'No', notes: '', video: '' },
      { name: "Уадр эфесом", killTime: '2100ms', useTime: '4600ms', totalTime: '4600ms', heal: '+35', ragdoll: 'No', notes: '', video: '' },
      { name: "Удар с размаха", killTime: '2000ms', useTime: '3500ms', totalTime: '5000ms', heal: '+20', ragdoll: 'No', notes: '', video: '' },
      { name: "Знамя Ларри", killTime: '7600ms', useTime: '11000ms', totalTime: '10900ms', heal: '+50', ragdoll: 'No', notes: '', video: '' },
      { name: "Гнев Алария", killTime: '3000ms', useTime: '8100ms', totalTime: '8000ms', heal: '+50', ragdoll: 'No', notes: '', video: '' },
      { name: "Четвертование", killTime: '2500ms', useTime: '3400ms', totalTime: '5500ms', heal: '+20', ragdoll: 'No', notes: '', video: '' },
      { name: "Очищение", killTime: '1200ms', useTime: '4100ms', totalTime: '4900ms', heal: '+20', ragdoll: 'No', notes: '', video: '' },
      { name: "Минута молчания", killTime: '2600ms', useTime: '7300ms', totalTime: '7500ms', heal: '+50', ragdoll: 'Yes', notes: '', video: '' },
      { name: "Мощь черного камня", killTime: '1800ms', useTime: '5400ms', totalTime: '5500ms', heal: '+50', ragdoll: 'Yes', notes: '', video: '' },
      { name: "Заслуженный конец", killTime: '4800ms', useTime: '7500ms', totalTime: '6600ms', heal: '+50', ragdoll: 'Yes', notes: '', video: '' },
      { name: "Захват плечом", killTime: '4500ms', useTime: '9600ms', totalTime: '10200ms', heal: '+50', ragdoll: 'No', notes: '', video: '' },
      { name: "В мир иной", killTime: '2600ms', useTime: '8900ms', totalTime: '9400ms', heal: '+50', ragdoll: 'No', notes: '', video: '' },
      { name: "Бой на Камлане", killTime: '5000ms', useTime: '10500ms', totalTime: '9400ms', heal: '+50', ragdoll: 'No', notes: '', video: '' },
      { name: "Сломанные ребра", killTime: '3100ms', useTime: '9400ms', totalTime: '9300ms', heal: '+50', ragdoll: 'No', notes: '', video: '' },
      { name: "Почти напополам", killTime: '7800ms', useTime: '10600ms', totalTime: '10500ms', heal: '+50', ragdoll: 'No', notes: '', video: '' },
      { name: "Рука руку режет", killTime: '7100ms', useTime: '9200ms', totalTime: '9500ms', heal: '+50', ragdoll: 'No', notes: '', video: '' },
      { name: "Защита лучника", killTime: '8600ms', useTime: '10100ms', totalTime: '10000ms', heal: '+50', ragdoll: 'No', notes: '', video: '' }
    ],
    en: [
      { name: "Use it or Lose it", killTime: '2800ms', useTime: '6300ms', totalTime: '6200ms', heal: '+50', ragdoll: 'No', notes: '', video: '' },
      { name: "Spinning Decapitation", killTime: '2000ms', useTime: '3000ms', totalTime: '3500ms', heal: '+20', ragdoll: 'No', notes: '', video: '' },
      { name: "Knockout", killTime: '6100ms', useTime: '9300ms', totalTime: '10200ms', heal: '+50', ragdoll: 'No', notes: '', video: '' },
      { name: "Backhand Strike", killTime: '2000ms', useTime: '3500ms', totalTime: '5000ms', heal: '+20', ragdoll: 'No', notes: '', video: '' },
      { name: "Hilt Strike", killTime: '2100ms', useTime: '4600ms', totalTime: '4600ms', heal: '+35', ragdoll: 'No', notes: '', video: '' },
      { name: "Guts Then Chop", killTime: '2500ms', useTime: '3400ms', totalTime: '5500ms', heal: '+20', ragdoll: 'No', notes: '', video: '' },
      { name: "Taking Out The Trash", killTime: '1200ms', useTime: '4100ms', totalTime: '4900ms', heal: '+20', ragdoll: 'No', notes: '', video: '' },
      { name: "A Moment of Silence", killTime: '2600ms', useTime: '7300ms', totalTime: '7500ms', heal: '+50', ragdoll: 'Yes', notes: '', video: '' },
      { name: "Blackstone Bash", killTime: '1800ms', useTime: '5400ms', totalTime: '5500ms', heal: '+50', ragdoll: 'Yes', notes: '', video: '' },
      { name: "End Them Rightly", killTime: '4800ms', useTime: '7500ms', totalTime: '6600ms', heal: '+50', ragdoll: 'Yes', notes: '', video: '' },
      { name: "Shoulder Tackle", killTime: '4500ms', useTime: '9600ms', totalTime: '10200ms', heal: '+50', ragdoll: 'No', notes: '', video: '' },
      { name: "Grave Passing", killTime: '2600ms', useTime: '8900ms', totalTime: '9400ms', heal: '+50', ragdoll: 'No', notes: '', video: '' },
      { name: "Brutality of Camlann", killTime: '5000ms', useTime: '10500ms', totalTime: '9400ms', heal: '+50', ragdoll: 'No', notes: '', video: '' },
      { name: "Fractured Ribcage", killTime: '3100ms', useTime: '9400ms', totalTime: '9300ms', heal: '+50', ragdoll: 'No', notes: '', video: '' },
      { name: "Larry's Banner", killTime: '7600ms', useTime: '11000ms', totalTime: '10900ms', heal: '+50', ragdoll: 'No', notes: '', video: '' },
      { name: "Alarius's Wrath", killTime: '3000ms', useTime: '8100ms', totalTime: '8000ms', heal: '+50', ragdoll: 'No', notes: '', video: '' },
      { name: "Deep Hacking", killTime: '7800ms', useTime: '10600ms', totalTime: '10500ms', heal: '+50', ragdoll: 'No', notes: '', video: '' },
      { name: "Manus Manum Secat", killTime: '7100ms', useTime: '9200ms', totalTime: '9500ms', heal: '+50', ragdoll: 'No', notes: '', video: '' },
      { name: "The Archers Guard", killTime: '8600ms', useTime: '10100ms', totalTime: '10000ms', heal: '+50', ragdoll: 'No', notes: '', video: '' }
    ]
  },

  // Общие добивания
  executionsCommon: { 
  ru: [
      { name: "Береги голову", killTime: '2800ms', useTime: '6300ms', totalTime: '6200m', heal: '+50', ragdoll: 'Нет', notes: '', video: '' },
      { name: "Вихрь казни", killTime: '2000ms', useTime: '3000ms', totalTime: '3500ms', heal: '+20', ragdoll: 'No', notes: '', video: '' }
  ], 
  en: [
      { name: "Use it or Lose it", killTime: '2800ms', useTime: '6300ms', totalTime: '6200ms', heal: '+50', ragdoll: 'No', notes: '', video: '' },
      { name: "Spinning Decapitation", killTime: '2000ms', useTime: '3000ms', totalTime: '3500ms', heal: '+20', ragdoll: 'No', notes: '', video: '' }
  ] },

  // Voice lines
  voiceLines: {
  "battle": [
    {
      "title": {
        "ru": "Тяжёлый удар",
        "en": "Heavy attack"
      },
      "gender": {
        "ru": "муж.",
        "en": "male"
      },
      "lines": [
        {
          "originalLang": {
            "ru": "Латинский",
            "en": "Latin"
          },
          "original": "Miserum!",
          "translation": {
            "ru": "Жалкий!",
            "en": "Pitiful!"
          },
          "audio": "assets/audio/voice/15 тысяч стали.wav"
        },
        {
          "originalLang": {
            "ru": "Латинский",
            "en": "Latin"
          },
          "original": "Sile!",
          "translation": {
            "ru": "Тише!",
            "en": "Silence!"
          },
          "audio": "assets/audio/voice/latin_sile.wav"
        }
      ]
    },
    {
      "title": {
        "ru": "Уворот вперёд",
        "en": "Forward dodge"
      },
      "lines": [
        {
          "originalLang": {
            "ru": "Японский",
            "en": "Japanese"
          },
          "original": "行くぞ！",
          "translation": {
            "ru": "Поехали!",
            "en": "Let's go!"
          },
          "audio": "assets/audio/voice/jp_ikuzo.wav"
        }
      ]
    }
  ],
  "abilities": [
    {
      "title": {
        "ru": "Плечо (баш)",
        "en": "Shoulder bash"
      },
      "lines": [
        {
          "originalLang": {
            "ru": "Китайский",
            "en": "Chinese"
          },
          "original": "别动！",
          "translation": {
            "ru": "Не двигайся!",
            "en": "Don't move!"
          },
          "audio": "assets/audio/voice/cn_biedong.wav"
        }
      ]
    }
  ],
  "dialogs": [
    {
      "title": {
        "ru": "Ответный диалог",
        "en": "Reactive line"
      },
      "gender": {
        "ru": "—",
        "en": "—"
      },
      "lines": [
        {
          "originalLang": {
            "ru": "Латинский",
            "en": "Latin"
          },
          "original": "Miserum!",
          "translation": {
            "ru": "Жалкий",
            "en": "Pitiful"
          },
          "audio": "assets/audio/voice/latin_miserum.wav"
        }
      ]
    }
  ]
},
  perkIds: ["shields_up", "aegis", "devourer", "endurance", "survival_instinct"],
  featIds: ["death_toll", "conqueror", "come_at_me", "enfeeble", "inspire", "thrilling_comeback", "total_recovery", "second_wind", "pugno_mortis", "trebuchet", "stalwart_banner", "morale_booster"],

};
