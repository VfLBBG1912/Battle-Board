function row(rank, name, value){
  return `
    <div class="player">
      <strong>#${rank} ${name}</strong><br/>
      <span style="opacity:.85">${value}</span>
    </div>
  `;
}

function topList(players, key, label){
  const sorted = [...players].sort((a,b)=> (b[key]||0)-(a[key]||0) || a.name.localeCompare(b.name));
  return sorted.slice(0, 10).map((p,i)=> row(i+1, p.name, `${label}: ${p[key] ?? 0}`)).join("")
    || `<p>Keine Daten.</p>`;
}

fetch("data.json", { cache: "no-store" })
  .then(r => r.json())
  .then(data => {
    // Hall of Fame Daten: wenn vorhanden, nutze hof.players, sonst fallback auf data.players
    const hofPlayers = (data.hof && data.hof.players) ? data.hof.players : (data.players || []);

    document.getElementById("hof-level").innerHTML = topList(hofPlayers, "maxLevel", "Max Level");
    document.getElementById("hof-stars").innerHTML = topList(hofPlayers, "seasonStars", "Season ⭐");
    document.getElementById("hof-challenges").innerHTML = topList(hofPlayers, "challengeWins", "Challenge Siege");
    document.getElementById("hof-xp").innerHTML = topList(hofPlayers, "maxXP", "Max XP");
  })
  .catch(err => console.error(err));
