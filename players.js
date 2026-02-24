function normalize(str){ return (str || "").toString().trim().toLowerCase(); }

function teamKey(team){
  const t = normalize(team);
  if(t.includes("alpha")) return "alpha";
  if(t.includes("bravo")) return "bravo";
  return "joker";
}

function stars(n, max=5){
  const v = Math.max(0, Math.min(Number(n)||0, max));
  return "★".repeat(v) + "☆".repeat(max - v);
}

function deriveLevel(xp, levelXP){
  const x = Math.max(0, Number(xp) || 0);
  const t = Array.isArray(levelXP) && levelXP.length >= 2 ? levelXP : [0, 100];
  let idx = 0;
  for(let i=0;i<t.length;i++){
    if(x >= t[i]) idx = i;
  }
  return idx + 1;
}

function levelProgress(xp, levelXP){
  const x = Math.max(0, Number(xp) || 0);
  const t = Array.isArray(levelXP) && levelXP.length >= 2 ? levelXP : [0, 100];

  let idx = 0;
  for(let i=0;i<t.length;i++){
    if(x >= t[i]) idx = i;
  }
  const level = idx + 1;
  const curStart = t[idx];
  const nextStart = t[idx + 1];

  if(nextStart === undefined){
    return { level, pct: 100, inLevel: 0, span: 0, need: 0, maxed: true };
  }
  const span = Math.max(1, nextStart - curStart);
  const inLevel = x - curStart;
  const need = Math.max(0, nextStart - x);
  const pct = Math.max(0, Math.min(100, Math.round((inLevel / span) * 100)));
  return { level, pct, inLevel, span, need, maxed: false };
}

function sortPlayers(players, mode, levelXP){
  const p = [...players];
  if(mode === "name") return p.sort((a,b)=> a.name.localeCompare(b.name));
  if(mode === "xp") return p.sort((a,b)=> (b.xp||0)-(a.xp||0) || a.name.localeCompare(b.name));
  if(mode === "challenges") return p.sort((a,b)=> (b.challengeWins||0)-(a.challengeWins||0) || (b.xp||0)-(a.xp||0) || a.name.localeCompare(b.name));
  // default: derived level then xp
  return p.sort((a,b)=> (deriveLevel(b.xp, levelXP)-deriveLevel(a.xp, levelXP)) || ((b.xp||0)-(a.xp||0)) || a.name.localeCompare(b.name));
}

function groupPlayers(list){
  const groups = { "Alpha Team": [], "Team Bravo": [], "Joker": [] };
  list.forEach(p=>{
    const k = teamKey(p.team);
    if(k==="alpha") groups["Alpha Team"].push(p);
    else if(k==="bravo") groups["Team Bravo"].push(p);
    else groups["Joker"].push(p);
  });
  return groups;
}

const SKILLS = [
  { key:"DEF", label:"Defensivmonster" },
  { key:"TOR", label:"Tormaschine" },
  { key:"MAS", label:"Maschine" },
  { key:"ANF", label:"Anführer" },
  { key:"PLY", label:"Playmaker" }
];

fetch("data.json", { cache:"no-store" })
  .then(r=>r.json())
  .then(data=>{
    document.getElementById("cycle-info").textContent =
      `${data.cycle.name} | ${data.cycle.start} - ${data.cycle.end}`;

    const players = data.players || [];
    const levelXP = data.levelXP || [0,100];

    const container = document.getElementById("players-page-container");
    const summary = document.getElementById("players-summary");
    const search = document.getElementById("player-search");
    const sort = document.getElementById("sort");

    let teamFilter = "all";
    const chips = Array.from(document.querySelectorAll(".chip"));
    chips.forEach(btn=>{
      btn.addEventListener("click", ()=>{
        chips.forEach(b=>b.classList.remove("active"));
        btn.classList.add("active");
        teamFilter = btn.getAttribute("data-team");
        render();
      });
    });

    function calcSummary(list){
      const total = list.length;
      const avgXP = total ? Math.round(list.reduce((s,p)=> s+(Number(p.xp)||0),0)/total) : 0;
      const avgLvl = total ? Math.round(list.reduce((s,p)=> s+deriveLevel(p.xp, levelXP),0)/total) : 0;
      return `${total} Spieler · Ø Level ${avgLvl} · Ø ${avgXP} XP`;
    }

    function render(){
      const term = normalize(search.value);

      let filtered = players.filter(p=> normalize(p.name).includes(term));
      if(teamFilter !== "all"){
        filtered = filtered.filter(p => (p.team || "Joker") === teamFilter);
      }

      summary.textContent = calcSummary(filtered);

      const sorted = sortPlayers(filtered, sort.value, levelXP);
      const grouped = groupPlayers(sorted);

      const html = Object.entries(grouped).map(([teamName, list])=>{
        if(!list.length) return "";
        const key = teamKey(teamName);

        const cards = list.map(p=>{
          const xp = Number(p.xp)||0;
          const prog = levelProgress(xp, levelXP);
          const lvl = prog.level;

          const season = p.seasonSkills || { DEF:0,TOR:0,MAS:0,ANF:0,PLY:0 };
          const alltime = p.allTimeSkills || { DEF:0,TOR:0,MAS:0,ANF:0,PLY:0 };

          const skillRows = SKILLS.map(s=>{
            const ss = Number(season[s.key])||0;
            const at = Number(alltime[s.key])||0;
            return `
              <div class="skill-row">
                <div class="name">${s.label}</div>
                <div class="bars">
                  <div class="skill-chip">Season: <span class="stars">${stars(ss)}</span> <span style="opacity:.8">(${ss}/5)</span></div>
                  <div class="skill-chip">All-Time: <span class="stars">${stars(at)}</span> <span style="opacity:.8">(${at}/5)</span></div>
                </div>
              </div>
            `;
          }).join("");

          return `
            <div class="player-card ${key}">
              <div class="player-top">
                <div class="player-name">${p.name}</div>
                <div class="badge-team ${key}">${p.team || "Joker"}</div>
              </div>

              <div class="big-row">
                <div class="big-kpi">
                  <div class="label">LEVEL</div>
                  <div class="value">${lvl}</div>
                  <div class="sub">${prog.maxed ? "Max Level" : `noch ${prog.need} XP bis Level ${lvl+1}`}</div>
                </div>

                <div class="big-kpi">
                  <div class="label">XP</div>
                  <div class="value">${xp}</div>
                  <div class="sub">${prog.maxed ? "—" : `${prog.inLevel}/${prog.span} im Level`}</div>
                </div>

                <div class="big-kpi">
                  <div class="label">CHALLENGE SIEGE</div>
                  <div class="value">${p.challengeWins ?? 0}</div>
                  <div class="sub">persönliche Statistik</div>
                </div>
              </div>

              <div class="xpbar"><div class="xpfill" style="width:${prog.pct}%"></div></div>
              <div class="small">${prog.maxed ? "Max Level erreicht ✅" : `Level-Fortschritt: ${prog.pct}%`}</div>

              <div class="skill-block">
                <div class="skill-title">⭐ Skills (Season & All-Time)</div>
                <div class="skill-grid">
                  ${skillRows}
                </div>
              </div>
            </div>
          `;
        }).join("");

        return `
          <div class="group">
            <div class="group-head">
              <h3>${teamName}</h3>
              <span class="group-pill">${list.length} Spieler</span>
            </div>
            <div class="player-grid">${cards}</div>
          </div>
        `;
      }).join("");

      container.innerHTML = html || `<div class="muted">Keine Spieler gefunden.</div>`;
    }

    search.addEventListener("input", render);
    sort.addEventListener("change", render);

    render();
  })
  .catch(err => console.error(err));
