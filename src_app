import React, { useState, useMemo, useRef } from "react";

// ─────────────────────────────────────────────────────────────
// 妈妈厨房 — Mama's Kitchen
// 清淡 · 养生 · 每天三餐  (Light · Nourishing · 3 meals a day)
// Principles baked in: low oil, low sodium, less rice, more dark
// green vegetables + deep-sea fish, foods that 滋阴养肾.
// ─────────────────────────────────────────────────────────────

const C = {
  bg: "#F3F1E7",        // warm rice paper
  ink: "#23301F",       // deep pine
  jade: "#3F6B4C",      // jade green (brand)
  jadeSoft: "#E3ECDF",
  clay: "#C56B3E",      // warm clay accent
  paper: "#FBFAF4",
  line: "#D9D5C3",
  gold: "#B89542",
};

// ── Recipe library (清淡养生菜谱) ──────────────────────────────
// tags: each dish maps to one of the three daily slots
const DISHES = [
  // ── 早餐 10 ──────────────────────────────────────────────
  {
    n: "小米南瓜粥",
    type: "养胃 · 早餐",
    slot: "早餐",
    ing: ["小米 半杯", "南瓜 1 小块", "水适量"],
    steps: ["小米洗净", "南瓜切小块同煮", "小火熬 30 分钟至软糯"],
    why: "小米养胃，南瓜温和，清淡好消化的早餐。",
  },
  {
    n: "番茄鸡蛋热汤面",
    type: "暖胃 · 早餐",
    slot: "早餐",
    ing: ["番茄 1 个", "鸡蛋 1 个", "荞麦面 少量", "青菜 少许"],
    steps: ["番茄炒出汁加水煮开", "下荞麦面煮软", "打入蛋花和青菜，少许盐"],
    why: "热乎暖胃，荞麦低 GI 控碳水，番茄天然提味少盐。",
  },
  {
    n: "山药枸杞瘦肉粥",
    type: "补肾 · 早餐",
    slot: "早餐",
    ing: ["山药 1 段", "瘦肉 少许", "枸杞 少许", "大米 少量"],
    steps: ["山药去皮切丁", "瘦肉切丝焯水", "同少量米小火熬粥，出锅放枸杞"],
    why: "山药健脾补肾，枸杞滋阴，少米控碳水。",
  },
  {
    n: "黑芝麻黑米糊",
    type: "补肾 · 早餐",
    slot: "早餐",
    ing: ["黑米 半杯", "黑芝麻 1 勺", "热水适量"],
    steps: ["黑米提前泡 2 小时", "同黑芝麻入豆浆机", "选米糊档打成温热米糊"],
    why: "黑米黑芝麻双补肾乌发，温热米糊养胃，无油无糖。",
  },
  {
    n: "蒸蛋羹配菠菜",
    type: "清淡 · 早餐",
    slot: "早餐",
    ing: ["鸡蛋 1 个", "温水 1.5 倍蛋液", "菠菜碎少许"],
    steps: ["蛋液加温水打散过筛", "撒入焯过的菠菜碎", "中火蒸 10 分钟至凝固"],
    why: "嫩滑无油，深绿菠菜补铁，老人小孩都好入口。",
  },
  {
    n: "红薯豆浆",
    type: "粗粮 · 早餐",
    slot: "早餐",
    ing: ["红薯 半个", "黄豆 1 把", "水适量"],
    steps: ["黄豆提前泡一夜", "红薯蒸熟去皮", "同入豆浆机打成豆浆"],
    why: "红薯通便，豆浆补植物蛋白，自然回甜不加糖。",
  },
  {
    n: "瘦肉蒸蛋配馒头",
    type: "蛋白 · 早餐",
    slot: "早餐",
    ing: ["鸡蛋 1 个", "瘦肉末 少许", "全麦馒头 1 个", "少许生抽"],
    steps: ["蛋液加温水和瘦肉末打散", "中火蒸 12 分钟至凝固", "配热馒头，淋少许生抽"],
    why: "蒸蛋嫩滑无油，瘦肉补蛋白，配馒头暖胃好消化。",
  },
  {
    n: "核桃枸杞小米羹",
    type: "补肾 · 早餐",
    slot: "早餐",
    ing: ["小米 半杯", "核桃 2 颗", "枸杞 少许"],
    steps: ["小米熬至软烂", "核桃掰碎放入", "出锅前撒枸杞焖 2 分钟"],
    why: "核桃健脑补肾，枸杞滋阴，温热养胃。",
  },
  {
    n: "豆腐脑配紫菜",
    type: "清淡 · 早餐",
    slot: "早餐",
    ing: ["嫩豆腐 1 盒", "紫菜 少许", "葱花 少许", "少许生抽"],
    steps: ["嫩豆腐隔水蒸热", "紫菜撕碎冲热水", "豆腐入碗，浇紫菜汤，少许生抽"],
    why: "高蛋白低脂，紫菜补碘益肾，几乎不放油。",
  },
  {
    n: "红枣桂圆小米粥",
    type: "暖身 · 早餐",
    slot: "早餐",
    ing: ["小米 半杯", "红枣 3 颗", "桂圆 几颗"],
    steps: ["小米洗净下锅", "加红枣桂圆同煮", "小火熬 30 分钟至软糯"],
    why: "红枣桂圆温补气血，热粥暖身养胃，自然回甜不加糖。",
  },

  // ── 午餐 10 ──────────────────────────────────────────────
  {
    n: "清蒸鳕鱼配姜丝",
    type: "深海鱼 · 滋阴",
    slot: "午餐",
    ing: ["鳕鱼 1 块", "姜 1 小块", "葱 2 根", "少许蒸鱼豉油"],
    steps: ["鳕鱼洗净擦干，铺上姜丝", "水开后蒸 8 分钟", "淋少许蒸鱼豉油，撒葱花"],
    why: "深海鱼富含 Omega-3，清蒸少油少盐，养阴润燥。",
  },
  {
    n: "西兰花虾仁",
    type: "深绿叶菜 · 蛋白",
    slot: "午餐",
    ing: ["西兰花 半棵", "虾仁 8 只", "蒜 2 瓣", "少许橄榄油"],
    steps: ["西兰花掰小朵焯水", "少油炒虾仁至变色", "下西兰花快炒，少许盐"],
    why: "西兰花高纤维抗氧化，虾仁低脂高蛋白。",
  },
  {
    n: "三文鱼海带豆腐汤",
    type: "深海鱼 · 补肾",
    slot: "午餐",
    ing: ["三文鱼 1 小块", "海带 少许", "嫩豆腐 半块", "姜 2 片"],
    steps: ["海带泡发切丝", "姜片煮水，下海带豆腐", "最后下三文鱼煮 3 分钟，少盐"],
    why: "海带补碘益肾，三文鱼养阴，整锅几乎不放油。",
  },
  {
    n: "清蒸秋刀鱼",
    type: "深海鱼 · 滋阴",
    slot: "午餐",
    ing: ["秋刀鱼 1 条", "姜 3 片", "柠檬 2 片"],
    steps: ["鱼身划几刀塞姜片", "蒸 10 分钟", "出锅挤柠檬汁去腥"],
    why: "深海鱼好脂肪，用柠檬代盐提味，更控钠。",
  },
  {
    n: "番茄龙利鱼",
    type: "深海鱼 · 低脂",
    slot: "午餐",
    ing: ["龙利鱼 1 块", "番茄 1 个", "少许橄榄油"],
    steps: ["番茄炒出汁", "下鱼块轻煮 5 分钟", "少许盐收汁"],
    why: "龙利鱼无刺低脂，番茄天然酸甜少放盐。",
  },
  {
    n: "鸡胸肉炒芦笋",
    type: "蛋白 · 深绿菜",
    slot: "午餐",
    ing: ["鸡胸肉 1 块", "芦笋 1 把", "蒜 2 瓣", "少许橄榄油"],
    steps: ["鸡胸切片用少许生抽腌", "少油先炒鸡肉", "下芦笋快炒，少许盐"],
    why: "鸡胸高蛋白零脂，芦笋利水，清爽不腻。",
  },
  {
    n: "豆腐蒸鲈鱼",
    type: "深海鱼 · 补钙",
    slot: "午餐",
    ing: ["鲈鱼 1 块", "嫩豆腐 半块", "姜丝 少许", "少许蒸鱼豉油"],
    steps: ["豆腐铺底，鱼放上", "撒姜丝蒸 10 分钟", "淋少许豉油"],
    why: "鲈鱼补肝肾，豆腐补钙，清蒸最大程度少油。",
  },
  {
    n: "杂菇鸡丝汤面",
    type: "清淡 · 主食",
    slot: "午餐",
    ing: ["荞麦面 少量", "鸡胸丝 少许", "口蘑/香菇 几朵", "青菜 1 把"],
    steps: ["菌菇煮出鲜味", "下鸡丝和荞麦面", "起锅前烫青菜，少盐"],
    why: "荞麦低 GI 代替白面，菌菇提鲜减盐。",
  },
  {
    n: "蒜蓉蒸虾",
    type: "蛋白 · 低脂",
    slot: "午餐",
    ing: ["鲜虾 8 只", "蒜末 1 勺", "粉丝 少许", "少许生抽"],
    steps: ["虾开背摆盘", "铺蒜末和泡软粉丝", "大火蒸 6 分钟"],
    why: "虾低脂高蛋白，清蒸保留鲜味，用蒜提香少盐。",
  },
  {
    n: "冬瓜薏米排骨汤",
    type: "祛湿 · 汤",
    slot: "午餐",
    ing: ["冬瓜 1 段", "薏米 1 把", "排骨 3 块", "姜 2 片"],
    steps: ["排骨焯水", "薏米姜片先炖 40 分钟", "下冬瓜再炖 15 分钟，少盐"],
    why: "薏米健脾祛湿，冬瓜利水消肿，清炖少油。",
  },

  // ── 晚餐 10 ──────────────────────────────────────────────
  {
    n: "蒜蓉炒菠菜",
    type: "深绿叶菜",
    slot: "晚餐",
    ing: ["菠菜 1 把", "蒜 3 瓣", "少许橄榄油", "少许盐"],
    steps: ["菠菜焯水 30 秒去草酸", "热锅少油爆香蒜末", "下菠菜快炒，少许盐出锅"],
    why: "深绿叶菜补铁补叶酸，焯水去草酸更护肾。",
  },
  {
    n: "黑豆排骨汤",
    type: "补肾 · 汤",
    slot: "晚餐",
    ing: ["黑豆 1 把", "排骨 4 块", "姜 2 片", "枸杞少许"],
    steps: ["黑豆提前泡 2 小时", "排骨焯水去血沫", "全部材料小火炖 1 小时，少盐"],
    why: "黑豆入肾经，枸杞滋阴，清炖少油盐。",
  },
  {
    n: "清炒芥蓝",
    type: "深绿叶菜",
    slot: "晚餐",
    ing: ["芥蓝 1 把", "蒜 2 瓣", "少许橄榄油"],
    steps: ["芥蓝洗净切段", "少油爆蒜", "快炒至翠绿，少许盐"],
    why: "芥蓝钙含量高，深绿叶菜清肝明目。",
  },
  {
    n: "白灼菜心",
    type: "深绿叶菜",
    slot: "晚餐",
    ing: ["菜心 1 把", "少许生抽", "姜丝 少许"],
    steps: ["水加几滴油烧开", "菜心烫 1 分钟捞起", "淋少许生抽和姜丝"],
    why: "白灼几乎零油，最大保留维生素，清甜爽口。",
  },
  {
    n: "香菇青江菜",
    type: "深绿叶菜",
    slot: "晚餐",
    ing: ["青江菜 1 把", "香菇 4 朵", "蒜 2 瓣", "少许橄榄油"],
    steps: ["香菇切片炒香", "下青江菜快炒", "少许盐和水焖 1 分钟"],
    why: "香菇提鲜可少放盐，青江菜补钙补纤维。",
  },
  {
    n: "紫菜虾皮豆腐汤",
    type: "补肾 · 汤",
    slot: "晚餐",
    ing: ["紫菜 少许", "虾皮 1 小把", "嫩豆腐 半块", "葱花 少许"],
    steps: ["豆腐切块煮开", "下虾皮提鲜", "关火放紫菜葱花，少许盐"],
    why: "紫菜虾皮补碘益肾，虾皮自带鲜味可少放盐，几乎无油。",
  },
  {
    n: "清蒸茄子",
    type: "清淡 · 蔬菜",
    slot: "晚餐",
    ing: ["茄子 1 根", "蒜末 1 勺", "少许生抽", "葱花 少许"],
    steps: ["茄子切条蒸 10 分钟", "调蒜末生抽汁", "淋上拌匀"],
    why: "蒸茄子不吸油，比红烧大幅减油减盐。",
  },
  {
    n: "番茄豆腐羹",
    type: "清淡 · 汤",
    slot: "晚餐",
    ing: ["番茄 2 个", "嫩豆腐 1 块", "鸡蛋 1 个", "少许盐"],
    steps: ["番茄炒出汁加水", "下豆腐丁煮开", "淋蛋液成羹，少许盐"],
    why: "番茄豆腐低脂高蛋白，天然酸甜少用盐。",
  },
  {
    n: "蒜炒油麦菜",
    type: "深绿叶菜",
    slot: "晚餐",
    ing: ["油麦菜 1 把", "蒜 3 瓣", "少许橄榄油"],
    steps: ["油麦菜洗净切段", "少油爆香蒜末", "大火快炒，少许盐趁热出锅"],
    why: "热炒锁住水分，深绿叶菜补纤维，趁热吃更养胃。",
  },
  {
    n: "丝瓜蛤蜊汤",
    type: "清淡 · 汤",
    slot: "晚餐",
    ing: ["丝瓜 1 根", "蛤蜊 1 把", "姜丝 少许"],
    steps: ["蛤蜊吐沙洗净", "姜丝煮水下蛤蜊", "开口后下丝瓜煮软，无需加盐"],
    why: "蛤蜊本身鲜咸不必加盐，丝瓜清热，极低油脂。",
  },

  // ── 饮品 / 水果 8 (配早餐) ────────────────────────────────
  {
    n: "麦冬枸杞茶",
    type: "生津 · 饮品",
    slot: "饮品",
    ing: ["麦冬 几粒", "枸杞 少许", "热水 1 杯"],
    steps: ["麦冬枸杞放入杯中", "冲入热水", "焖 10 分钟温饮"],
    why: "麦冬生津润燥，枸杞滋阴，温热代茶很适合干燥天。",
  },
  {
    n: "红枣桂圆枸杞茶",
    type: "温补 · 饮品",
    slot: "饮品",
    ing: ["红枣 3 颗", "桂圆 几颗", "枸杞 少许", "热水 1 杯"],
    steps: ["红枣掰开同桂圆枸杞入杯", "冲热水焖 15 分钟", "温热饮用"],
    why: "温补气血暖身，枸杞滋阴，天冷时一杯很舒服。",
  },
  {
    n: "冰糖炖雪梨",
    type: "润肺 · 饮品",
    slot: "饮品",
    ing: ["梨 1 个", "冰糖 几粒", "枸杞 少许"],
    steps: ["梨去核切块", "加少量水和冰糖", "隔水炖 30 分钟，放枸杞"],
    why: "炖梨温润不寒，润肺止咳，滋阴润燥。",
  },
  {
    n: "银耳百合雪梨羹",
    type: "润肺 · 饮品",
    slot: "饮品",
    ing: ["银耳 半朵", "鲜百合 1 把", "梨 1 个", "冰糖 少许"],
    steps: ["银耳泡发炖出胶", "下梨块和百合", "再炖 20 分钟，少许冰糖"],
    why: "百合润肺安神，银耳滋阴，雪梨清润，秋冬润燥首选。",
  },
  {
    n: "银耳玉竹炖梨",
    type: "润肺 · 饮品",
    slot: "饮品",
    ing: ["银耳 半朵", "玉竹 1 小把", "梨 1 个", "冰糖 少许"],
    steps: ["银耳泡发", "同玉竹梨块炖 40 分钟", "炖软后少许冰糖"],
    why: "银耳玉竹合炖，润肺滋阴双倍，温甜润喉。",
  },
  {
    n: "银耳莲子羹",
    type: "滋阴 · 饮品",
    slot: "饮品",
    ing: ["银耳 半朵", "莲子 1 把", "红枣 3 颗", "冰糖 少许"],
    steps: ["银耳泡发撕小朵", "同莲子红枣小火炖 1 小时", "炖出胶质，少许冰糖"],
    why: "银耳滋阴润燥养颜，莲子养心安神，温热好吸收。",
  },
  {
    n: "蒸苹果",
    type: "暖胃 · 水果",
    slot: "饮品",
    ing: ["苹果 1 个", "肉桂粉 少许（可选）"],
    steps: ["苹果去核切块", "上锅蒸 15 分钟至软", "温热食用"],
    why: "蒸苹果暖胃护肠，比生吃更温和，适合脾胃虚寒。",
  },
  {
    n: "猕猴桃",
    type: "维C · 水果",
    slot: "饮品",
    ing: ["猕猴桃 1-2 个"],
    steps: ["猕猴桃去皮切块", "室温下食用，不冰镇"],
    why: "猕猴桃富含维C 助吸收铁质，常温吃不刺激肠胃。",
  },

  // ── 靓汤 2 (配午餐 / 晚餐，含肉) ──────────────────────────
  {
    n: "玉竹麦冬瘦肉汤",
    type: "滋阴 · 靓汤",
    slot: "靓汤",
    ing: ["玉竹 1 小把", "麦冬 1 小把", "瘦肉 少许", "姜 2 片"],
    steps: ["瘦肉焯水", "同玉竹麦冬姜片入锅", "小火炖 1 小时，少许盐"],
    why: "玉竹麦冬养阴润燥生津，清炖少油少盐。",
  },
  {
    n: "无花果苹果煲瘦肉",
    type: "润燥 · 靓汤",
    slot: "靓汤",
    ing: ["无花果干 4 颗", "苹果 1 个", "瘦肉 少许", "姜 1 片"],
    steps: ["瘦肉焯水", "苹果切块同无花果入锅", "小火煲 1 小时，少许盐"],
    why: "无花果润肠通便，苹果温和，煲汤暖身不寒。",
  },
];

const DAYS = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"];
const SLOTS = ["早餐", "午餐", "晚餐"];

function buildWeek() {
  const byslot = (s) => DISHES.filter((d) => d.slot === s);
  const pick = (arr, i) => arr[i % arr.length];
  return DAYS.map((day, i) => {
    const row = { day };
    SLOTS.forEach((s) => { row[s] = pick(byslot(s), i); });
    row.饮品 = pick(byslot("饮品"), i);          // 配早餐
    row.午餐汤 = pick(byslot("靓汤"), i);          // 配午餐
    row.晚餐汤 = pick(byslot("靓汤"), i + 1);      // 配晚餐（错开避免重复）
    return row;
  });
}

export default function App() {
  const [tab, setTab] = useState("today");
  const [week] = useState(buildWeek);

  return (
    <div style={{ background: C.bg, minHeight: "100vh", color: C.ink,
      fontFamily: "'PingFang SC','Microsoft YaHei',sans-serif" }}>
      <style>{`
        * { box-sizing: border-box; }
        button:focus-visible { outline: 3px solid ${C.gold}; outline-offset: 2px; }
        @media (prefers-reduced-motion: reduce){ *{animation:none!important;transition:none!important} }
      `}</style>

      <header style={{ padding: "28px 20px 18px", textAlign: "center",
        borderBottom: `2px solid ${C.line}` }}>
        <div style={{ fontSize: 40, fontWeight: 800, letterSpacing: 2 }}>妈妈厨房</div>
        <div style={{ fontSize: 20, color: C.jade, marginTop: 6 }}>清淡 · 养生 · 每天三餐</div>
      </header>

      <nav style={{ display: "flex", gap: 8, padding: "16px 12px",
        position: "sticky", top: 0, background: C.bg, zIndex: 5,
        borderBottom: `1px solid ${C.line}` }}>
        {[
          ["today", "今天吃什么"],
          ["week", "本周菜单"],
          ["grocery", "买菜清单"],
          ["photo", "有啥做啥"],
        ].map(([k, label]) => (
          <button key={k} onClick={() => setTab(k)}
            style={{
              flex: 1, padding: "16px 8px", fontSize: 19, fontWeight: 700,
              borderRadius: 14, cursor: "pointer", border: "none",
              background: tab === k ? C.jade : C.paper,
              color: tab === k ? "#fff" : C.ink,
              boxShadow: tab === k ? "none" : `inset 0 0 0 1px ${C.line}`,
            }}>
            {label}
          </button>
        ))}
      </nav>

      <main style={{ maxWidth: 760, margin: "0 auto", padding: "20px 16px 60px" }}>
        {tab === "today" && <Today />}
        {tab === "week" && <Week week={week} />}
        {tab === "grocery" && <Grocery week={week} />}
        {tab === "photo" && <Photo />}
      </main>
    </div>
  );
}

// ── 今天吃什么 ────────────────────────────────────────────────
function Today() {
  const [meals, setMeals] = useState(null);
  const spin = () => {
    const r = (s) => {
      const arr = DISHES.filter((d) => d.slot === s);
      return arr[Math.floor(Math.random() * arr.length)];
    };
    const next = {};
    SLOTS.forEach((s) => { next[s] = r(s); });
    next.饮品 = r("饮品");
    next.午餐汤 = r("靓汤");
    next.晚餐汤 = r("靓汤");
    setMeals(next);
  };

  return (
    <div>
      <button onClick={spin} style={bigBtn}>
        {meals ? "再换一组" : "点我看看今天吃什么"}
      </button>
      {meals && (
        <div style={{ marginTop: 22, display: "grid", gap: 16 }}>
          <DishCard slot="早餐" d={meals.早餐} pair={{ label: "饮品", dish: meals.饮品 }} />
          <DishCard slot="午餐" d={meals.午餐} pair={{ label: "靓汤", dish: meals.午餐汤 }} />
          <DishCard slot="晚餐" d={meals.晚餐} pair={{ label: "靓汤", dish: meals.晚餐汤 }} />
        </div>
      )}
      {!meals && (
        <p style={{ textAlign: "center", fontSize: 19, color: C.jade, marginTop: 24 }}>
          按一下，帮您配好三餐 — 早餐配饮品，午晚配靓汤 🍵
        </p>
      )}
    </div>
  );
}

function DishCard({ slot, d, pair }) {
  const [open, setOpen] = useState(false);
  const [pairOpen, setPairOpen] = useState(false);
  return (
    <div style={card}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
        <span style={{ fontSize: 18, fontWeight: 700, color: C.clay,
          background: C.jadeSoft, padding: "4px 12px", borderRadius: 20 }}>{slot}</span>
        <span style={{ fontSize: 26, fontWeight: 800 }}>{d.n}</span>
      </div>
      <div style={{ fontSize: 17, color: C.jade, marginTop: 6 }}>{d.type}</div>
      <button onClick={() => setOpen(!open)} style={linkBtn}>
        {open ? "收起做法 ▲" : "看做法 ▼"}
      </button>
      {open && (
        <div style={{ marginTop: 10 }}>
          <Section title="食材">{d.ing.join("、")}</Section>
          <Section title="步骤">
            <ol style={{ margin: 0, paddingLeft: 22, fontSize: 19, lineHeight: 1.9 }}>
              {d.steps.map((s, i) => <li key={i}>{s}</li>)}
            </ol>
          </Section>
          <div style={{ fontSize: 17, color: C.jade, marginTop: 10,
            background: C.jadeSoft, padding: "10px 14px", borderRadius: 12 }}>
            💚 {d.why}
          </div>
        </div>
      )}

      {pair && pair.dish && (
        <div style={{ marginTop: 14, paddingTop: 12, borderTop: `1px dashed ${C.line}` }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: C.jade }}>
              + {pair.label}
            </span>
            <span style={{ fontSize: 21, fontWeight: 700 }}>{pair.dish.n}</span>
          </div>
          <button onClick={() => setPairOpen(!pairOpen)} style={{ ...linkBtn, fontSize: 16 }}>
            {pairOpen ? "收起做法 ▲" : "看做法 ▼"}
          </button>
          {pairOpen && (
            <div style={{ marginTop: 8 }}>
              <Section title="食材">{pair.dish.ing.join("、")}</Section>
              <Section title="步骤">
                <ol style={{ margin: 0, paddingLeft: 22, fontSize: 18, lineHeight: 1.9 }}>
                  {pair.dish.steps.map((s, i) => <li key={i}>{s}</li>)}
                </ol>
              </Section>
              <div style={{ fontSize: 16, color: C.jade, marginTop: 10,
                background: C.jadeSoft, padding: "10px 14px", borderRadius: 12 }}>
                💚 {pair.dish.why}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── 本周菜单 ──────────────────────────────────────────────────
function Week({ week }) {
  return (
    <div style={{ display: "grid", gap: 14 }}>
      <p style={{ fontSize: 17, color: C.jade, margin: "0 0 2px" }}>
        点任意一道菜，展开看做法 👇
      </p>
      {week.map((row) => (
        <div key={row.day} style={card}>
          <div style={{ fontSize: 24, fontWeight: 800, marginBottom: 6 }}>{row.day}</div>
          <WeekRow label="早餐" d={row.早餐} />
          <WeekRow label="饮品" sub d={row.饮品} />
          <WeekRow label="午餐" d={row.午餐} />
          <WeekRow label="靓汤" sub d={row.午餐汤} />
          <WeekRow label="晚餐" d={row.晚餐} />
          <WeekRow label="靓汤" sub d={row.晚餐汤} />
        </div>
      ))}
    </div>
  );
}

function WeekRow({ label, d, sub }) {
  const [open, setOpen] = useState(false);
  if (!d) return null;
  return (
    <div style={{ borderTop: `1px solid ${C.line}` }}>
      <button onClick={() => setOpen(!open)}
        style={{ width: "100%", display: "flex", alignItems: "center", gap: 10,
          padding: sub ? "5px 0 5px 20px" : "8px 0", background: "none",
          border: "none", cursor: "pointer", textAlign: "left" }}>
        <span style={{ fontWeight: 700, minWidth: 48,
          fontSize: sub ? 16 : 18, color: sub ? C.jade : C.clay }}>
          {sub ? "+ " + label : label}
        </span>
        <span style={{ flex: 1, fontSize: sub ? 18 : 20,
          fontWeight: sub ? 600 : 700, color: sub ? C.jade : C.ink }}>{d.n}</span>
        <span style={{ fontSize: 15, color: C.jade }}>{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div style={{ padding: "0 0 12px", marginLeft: sub ? 20 : 0 }}>
          <Section title="食材">{d.ing.join("、")}</Section>
          <Section title="步骤">
            <ol style={{ margin: 0, paddingLeft: 22, fontSize: 18, lineHeight: 1.9 }}>
              {d.steps.map((s, i) => <li key={i}>{s}</li>)}
            </ol>
          </Section>
          <div style={{ fontSize: 16, color: C.jade, marginTop: 10,
            background: C.jadeSoft, padding: "10px 14px", borderRadius: 12 }}>
            💚 {d.why}
          </div>
        </div>
      )}
    </div>
  );
}

// ── 买菜清单 ──────────────────────────────────────────────────
function Grocery({ week }) {
  const list = useMemo(() => {
    const set = new Map();
    const add = (dish) =>
      dish.ing.forEach((i) => {
        const name = i.replace(/\s*\d+.*$|少许.*$|适量.*$/g, "").trim() || i;
        set.set(name, (set.get(name) || 0) + 1);
      });
    week.forEach((row) => {
      SLOTS.forEach((s) => add(row[s]));
      if (row.饮品) add(row.饮品);
      if (row.午餐汤) add(row.午餐汤);
      if (row.晚餐汤) add(row.晚餐汤);
    });
    return [...set.entries()].sort((a, b) => b[1] - a[1]);
  }, [week]);

  const [done, setDone] = useState({});
  return (
    <div>
      <p style={{ fontSize: 19, color: C.jade, marginBottom: 16 }}>
        按本周菜单整理 · 点一下打勾 ✓
      </p>
      <div style={{ display: "grid", gap: 10 }}>
        {list.map(([name, count]) => (
          <button key={name} onClick={() => setDone({ ...done, [name]: !done[name] })}
            style={{ ...card, display: "flex", justifyContent: "space-between",
              alignItems: "center", cursor: "pointer", textAlign: "left",
              opacity: done[name] ? 0.45 : 1,
              textDecoration: done[name] ? "line-through" : "none" }}>
            <span style={{ fontSize: 22, fontWeight: 700 }}>
              {done[name] ? "✓ " : ""}{name}
            </span>
            <span style={{ fontSize: 17, color: C.clay }}>用 {count} 次</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── 拍照出菜谱 (Claude API) ───────────────────────────────────
function Photo() {
  const [img, setImg] = useState(null);
  const [b64, setB64] = useState(null);
  const [media, setMedia] = useState(null);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [err, setErr] = useState(null);
  const [errDetail, setErrDetail] = useState(null);
  const fileRef = useRef();

  const onFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setMedia(f.type);
    const reader = new FileReader();
    reader.onload = () => {
      setImg(reader.result);
      setB64(reader.result.split(",")[1]);
      setResult(null); setErr(null);
    };
    reader.readAsDataURL(f);
  };

  const canGenerate = (b64 || text.trim()) && !loading;

  const generate = async () => {
    if (!b64 && !text.trim()) return;
    setLoading(true); setErr(null); setErrDetail(null); setResult(null);

    const payload = { text: text.trim() || null };
    if (b64) payload.image = { media_type: media, data: b64 };

    try {
      const res = await fetch("/api/recipe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error + (data.detail ? " · " + data.detail : ""));
      }
      setResult(data);
    } catch (e) {
      setErr("没想出来，请再试一次，或多写几样食材（例如：菠菜、鸡蛋、豆腐）。");
      console.error("generate failed:", e);
      setErrDetail(String(e && e.message ? e.message : e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <p style={{ fontSize: 19, color: C.jade, marginBottom: 16 }}>
        拍一张冰箱照片，或直接写下有什么菜，帮您想今天做什么 🍳
      </p>

      <input ref={fileRef} type="file" accept="image/*" capture="environment"
        onChange={onFile} style={{ display: "none" }} />
      <button onClick={() => fileRef.current.click()} style={bigBtn}>
        {img ? "换一张照片" : "📷 拍照 / 选照片"}
      </button>

      {img && (
        <img src={img} alt="食材" style={{ width: "100%", borderRadius: 16,
          marginTop: 16, border: `2px solid ${C.line}` }} />
      )}

      <div style={{ marginTop: 18 }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: C.clay, marginBottom: 8 }}>
          ✍️ 或者写下家里有的食材（可选）
        </div>
        <textarea
          value={text}
          onChange={(e) => { setText(e.target.value); setResult(null); setErr(null); }}
          placeholder="例如：菠菜、鸡蛋、豆腐、三文鱼…"
          rows={3}
          style={{ width: "100%", fontSize: 19, padding: 14, borderRadius: 14,
            border: `2px solid ${C.line}`, background: C.paper, color: C.ink,
            fontFamily: "inherit", resize: "vertical" }}
        />
      </div>

      <button onClick={generate} disabled={!canGenerate}
        style={{ ...bigBtn, background: canGenerate ? C.clay : C.line, marginTop: 14,
          cursor: canGenerate ? "pointer" : "default" }}>
        {loading ? "正在想菜谱…" : "生成菜谱"}
      </button>

      {err && (
        <div style={{ marginTop: 16 }}>
          <p style={{ fontSize: 19, color: C.clay, margin: 0 }}>{err}</p>
          {errDetail && (
            <p style={{ fontSize: 14, color: C.jade, marginTop: 6, opacity: 0.7 }}>
              （技术信息：{errDetail}）
            </p>
          )}
        </div>
      )}

      {result && (
        <div style={{ marginTop: 20, display: "grid", gap: 16 }}>
          <div style={{ ...card, background: C.jadeSoft }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: C.jade }}>用到的食材</div>
            <div style={{ fontSize: 20, marginTop: 6 }}>{result.ingredients.join("、")}</div>
          </div>
          {result.dishes.map((d, i) => (
            <div key={i} style={card}>
              <div style={{ fontSize: 26, fontWeight: 800 }}>{d.name}</div>
              <Section title="用料">{d.ing.join("、")}</Section>
              <Section title="步骤">
                <ol style={{ margin: 0, paddingLeft: 22, fontSize: 19, lineHeight: 1.9 }}>
                  {d.steps.map((s, j) => <li key={j}>{s}</li>)}
                </ol>
              </Section>
              <div style={{ fontSize: 17, color: C.jade, marginTop: 10,
                background: C.jadeSoft, padding: "10px 14px", borderRadius: 12 }}>
                💚 {d.why}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── shared bits ──────────────────────────────────────────────
function Section({ title, children }) {
  return (
    <div style={{ marginTop: 10 }}>
      <div style={{ fontSize: 17, fontWeight: 700, color: C.clay }}>{title}</div>
      <div style={{ fontSize: 19, lineHeight: 1.8, marginTop: 2 }}>{children}</div>
    </div>
  );
}

const card = {
  background: C.paper, borderRadius: 18, padding: "18px 20px",
  boxShadow: `0 1px 0 ${C.line}, 0 6px 18px rgba(63,107,76,0.06)`,
  border: `1px solid ${C.line}`,
};
const bigBtn = {
  width: "100%", padding: "22px", fontSize: 24, fontWeight: 800,
  color: "#fff", background: C.jade, border: "none", borderRadius: 18,
  cursor: "pointer", boxShadow: "0 6px 16px rgba(63,107,76,0.25)",
};
const linkBtn = {
  marginTop: 12, fontSize: 18, fontWeight: 700, color: C.jade,
  background: "none", border: "none", cursor: "pointer", padding: "4px 0",
};
