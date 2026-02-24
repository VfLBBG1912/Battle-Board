function stars(n, max = 5) {
  const v = Math.max(0, Math.min(Number(n) || 0, max));
  return "★".repeat(v) + "☆".repeat(max - v);
}

function normalize(str){
  return (str || "").toString().trim().toLowerCase();
}

function sortPlayers(players, mode){
  const p = [...players];
  if(mode === "xp"){
    return p.sort((a,b)=> (b.xp||0)-(a.xp||0) || (b.level||0)-(a.level||0) || a.name.localeCompare(b.name));
  }
  if(mode === "challenges"){
    return p.sort((a,b)=> (b.challengeWins||0)-(a.challengeWins||0) || (b.level||0)-(a.level||0) || a.name.localeCompare(b.name));
  }
  if(mode === "seasonStars"){
    return p.sort((a,b)=> (b.seasonStars||0)-(a.seasonStars||0) || (b.level||0)-(a.level||0) || a.name.localeCompare(b.name));
  }
  // default: level
  return p.sort((a,b)=> (b.level||0)-(a.level||0) || (b.xp||0)-(a.xp||0) || a.name.localeCompare(b.name));
}

fetch("data.json", { cache: "no-store" })
  .then(r => r.json())
  .then(data => {
    const cycleInfo = document.getElementById("cycle-info");
    if(cycleInfo){
      cycleInfo.textContent = `${data.cycle.name} | ${data.cycle.start} - ${data.cycle.end}`;
    }

    const container = document.getElementById("players-page-container");
    const search = document.getElementById("player-search");
    const sort = document.getElementById("sort");

    const render = () => {
      const term = normalize(search.value);
      const sorted = sortPlayers(data.players || [], sort.value);

      const filtered = sorted.filter(p => normalize(p.name).includes(term));

      container.innerHTML = filtered.map(p => {
        const s = p.skills || {};
        return `
          <div class="player">
            <div><strong>${p.name}</strong> <span class="badge2">Team ${p.team || "-"}</span></div>
            <div class="badges">
              <span class="badge2">Level ${p.level ?? 0}</span>
              <span class="badge2">${p.xp ?? 0} XP</span>
              <span class="badge2">Challenge Siege: ${p.challengeWins ?? 0}</span>
              <span class="badge2">Season ⭐: ${p.seasonStars ?? 0}</span>
            </div>
            <div class="badges">
              <span class="badge2">🧱 DEF <span class="stars">${stars(s.DEF)}</span></span>
              <span class="badge2">⚡ ANG <span class="stars">${stars(s.ANG)}</span></span>
              <span class="badge2">🫀 AUS <span class="stars">${stars(s.AUS)}</span></span>
              <span class="badge2">🧠 INT <span class="stars">${stars(s.INT)}</span></span>
              <span class="badge2">🔥 MEN <span class="stars">${stars(s.MEN)}</span></span>
            </div>
          </div>
        `;
      }).join("") || `<p>Keine Spieler gefunden.</p>`;
    };

    search.addEventListener("input", render);
    sort.addEventListener("change", render);

    render();
  })
  .catch(err => console.error(err));
