function stars(n, max = 5) {
  const v = Math.max(0, Math.min(Number(n) || 0, max));
  return "★".repeat(v) + "☆".repeat(max - v);
}

function normalize(str){
  return (str || "").toString().trim().toLowerCase();
}

function sortPlayers(players, mode){
  const p = [...players];
  if(mode === "name"){
    return p.sort((a,b)=> a.name.localeCompare(b.name));
  }
  if(mode === "xp"){
    return p.sort((a,b)=> (b.xp||0)-(a.xp||0) || a.name.localeCompare(b.name));
  }
  if(mode === "challenges"){
    return p.sort((a,b)=> (b.challengeWins||0)-(a.challengeWins||0) || (b.xp||0)-(a.xp||0) || a.name.localeCompare(b.name));
  }
  if(mode === "seasonStars"){
    return p.sort((a,b)=> (b.seasonStars||0)-(a.seasonStars||0) || (b.xp||0)-(a.xp||0) || a.name.localeCompare(b.name));
  }
  // default: level from XP (derived) then xp
  return p.sort((a,b)=> (deriveLevel(b.xp||0, window.__levelXP)-deriveLevel(a.xp||0, window.__levelXP)) || (b.xp||0)-(a.xp||0) || a.name.localeCompare(b.name));
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
  const thresholds = Array.isArray(levelXP) && levelXP.length >= 2 ? levelXP : [0, 100];

  let idx = 0;
  for(let i=0; i<thresholds.length; i++){
    if(x >= thresholds[i]) idx = i;
  }

  const level = idx + 1;
  const curStart = thresholds[idx];
  const nextStart = thresholds[idx + 1];

  if(nextStart === undefined){
    return { level, curStart, nextStart: curStart, inLevel: 0, need: 0, pct: 100, maxed: true };
  }

  const span = Math.max(1, nextStart - curStart);
  const inLevel = x - curStart;
  const need = Math.max(0, nextStart - x);
  const pct = Math.max(0, Math.min(100, Math.round((inLevel / span) * 100)));

  return { level, curStart, nextStart, inLevel, need, pct, maxed: false };
}

function teamKey(team){
  const t = (team || "").toLowerCase();
  if(t.includes("alpha")) return "alpha";
  if(t.includes("bravo")) return "bravo";
  return "joker";
}

function teamBadgeClass(team){
  const t = teamKey(team);
  if(t === "alpha") return "team-alpha";
  if(t === "bravo") return "team-bravo";
  return "team-joker";
}

function teamLabel(team){
  return team || "Joker";
}

fetch("data.json", { cache: "no-store" })
  .then(r => r.json())
  .then(data => {
    // store for sort helper
    window.__levelXP = data.levelXP;

    const cycleInfo = document.getElementById("cycle-info");
    if(cycleInfo){
      cycleInfo.textContent = `${data.cycle.name} | ${data.cycle.start} - ${data.cycle.end}`;
    }

    const container = document.getElementById("players-page-container");
    const summary = document.getElementById("players-summary");
    const search = document.getElementById("player-search");
    const sort = document.getElementById("sort");

    // filter chips
    let teamFilter = "all";
    const chips = Array.from(document.querySelectorAll(".chip"));
    chips.forEach(btn => {
      btn.addEventListener("click", () => {
        chips.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        teamFilter = btn.getAttribute("data-team");
        render();
      });
    });

    const players = data.players || [];

    function calcSummary(list){
      const total = list.length;
      const xpSum = list.reduce((s,p)=> s + (Number(p.xp)||0), 0);
      const avgXP = total ? Math.round(xpSum / total) : 0;
      const avgLevel = total ? Math.round(list.reduce((s,p)=> s + deriveLevel(p.xp||0, data.levelXP), 0) / total) : 0;
      return { total, avgXP, avgLevel };
    }

    function groupPlayers(list){
      const groups = { "Alpha Team": [], "Team Bravo": [], "Joker": [] };
      list.forEach(p=>{
        const key = teamKey(p.team);
        if(key === "alpha") groups["Alpha Team"].push(p);
        else if(key === "bravo") groups["Team Bravo"].push(p);
        else groups["Joker"].push(p);
      });
      return groups;
    }

    function render(){
      const term = normalize(search.value);

      // base filter
      let filtered = players.filter(p => normalize(p.name).includes(term));

      // team filter
      if(teamFilter !== "all"){
        filtered = filtered.filter(p => (p.team || "Joker") === teamFilter);
      }

      // summary
      const s = calcSummary(filtered);
      summary.textContent = `${s.total} Spieler · Ø Level ${s.avgLevel} · Ø ${s.avgXP} XP`;

      // sort inside groups
      const sorted = sortPlayers(filtered, sort.value);

      const grouped = groupPlayers(sorted);

      const sections = Object.entries(grouped).map(([teamName, list]) => {
        if(list.length === 0) return "";

        const tKey = teamKey(teamName);
        const niceTeam = teamLabel(teamName);
        const pill = `${list.length} Spieler`;

        const cards = list.map(p => {
          const xp = Number(p.xp) || 0;
          const prog = levelProgress(xp, data.levelXP);
          const lvl = prog.level;
          const span = Math.max(1, prog.nextStart - prog.curStart);

          const skill = p.skills || { DEF:0, ANG:0, AUS:0, INT:0, MEN:0 };
          const badgeClass = teamBadgeClass(p.team);

          return `
            <div class="player-card ${tKey}">
              <div class="player-top">
                <div>
                  <div class="player-name">${p.name}</div>
                  <div class="badges">
                    <span class="badge ${badgeClass}">${p.team || "Joker"}</span>
                    <span class="badge">Level ${lvl}</span>
                    <span class="badge">${xp} XP</span>
                    <span class="badge">Challenge: ${p.challengeWins ?? 0}</span>
                    <span class="badge">Season ⭐: ${p.seasonStars ?? 0}</span>
                  </div>
                </div>
              </div>

              <div class="xpbar"><div class="xpfill" style="width:${prog.pct}%"></div></div>
              <div class="small">
                ${prog.maxed
                  ? `Max Level erreicht ✅`
                  : `Fortschritt: ${prog.pct}% · ${prog.inLevel}/${span} XP · noch ${prog.need} XP bis Level ${lvl + 1}`}
              </div>

              <details>
                <summary>Skills anzeigen</summary>
                <div class="skills">
                  <div class="skill">🧱 DEF <span class="stars">${stars(skill.DEF)}</span></div>
                  <div class="skill">⚡ ANG <span class="stars">${stars(skill.ANG)}</span></div>
                  <div class="skill">🫀 AUS <span class="stars">${stars(skill.AUS)}</span></div>
                  <div class="skill">🧠 INT <span class="stars">${stars(skill.INT)}</span></div>
                  <div class="skill">🔥 MEN <span class="stars">${stars(skill.MEN)}</span></div>
                </div>
              </details>
            </div>
          `;
        }).join("");

        return `
          <div class="group">
            <div class="group-head">
              <h3>${niceTeam}</h3>
              <span class="group-pill">${pill}</span>
            </div>
            <div class="player-grid">
              ${cards}
            </div>
          </div>
        `;
      }).join("");

      container.innerHTML = sections || `<p class="muted">Keine Spieler gefunden.</p>`;
    }

    search.addEventListener("input", render);
    sort.addEventListener("change", render);

    render();
  })
  .catch(err => console.error(err));
