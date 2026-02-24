fetch("data.json")
    .then(response => response.json())
    .then(data => {

        // Cycle Info
        document.getElementById("cycle-info").innerText =
            `${data.cycle.name} | ${data.cycle.start} - ${data.cycle.end}`;

        // Team Stand
        const teamContainer = document.getElementById("team-container");
        const totalPoints = data.teams.reduce((sum, t) => sum + t.points, 0);

        data.teams.forEach(team => {
            const percentage = totalPoints > 0 ? (team.points / totalPoints) * 100 : 0;

            teamContainer.innerHTML += `
                <div class="team">
                    <strong>${team.name}</strong> - ${team.points} Punkte
                    <div class="progress-bar">
                        <div class="progress-fill" style="width:${percentage}%"></div>
                    </div>
                </div>
            `;
        });

        // Spieler Ranking
        const playerContainer = document.getElementById("player-container");

        const sortedPlayers = data.players.sort((a, b) => b.xp - a.xp);

        sortedPlayers.forEach(player => {
            playerContainer.innerHTML += `
                <div class="player">
                    <strong>${player.name}</strong> (Team ${player.team})<br>
                    Level: ${player.level} | XP: ${player.xp}<br>
                    Challenge Siege: ${player.challengeWins}
                </div>
            `;
        });

        // Updates
        const updatesContainer = document.getElementById("updates-container");

        data.recent.forEach(update => {
            updatesContainer.innerHTML += `
                <p><strong>${update.date}</strong>: ${update.text}</p>
            `;
        });

    })
    .catch(error => {
        console.error("Fehler beim Laden der Daten:", error);
    });
