let donneesJeu = {};
let affaireEnAttente = null;
let affaireActuelle = null;
let score = 0;
let mailActif = null;
let toutesLesAffaires = [];

function triggerGreenScreen() {
    document.body.classList.remove('hacked');
    document.body.classList.add('correct-answer');
    setTimeout(() => {
        document.body.classList.remove('correct-answer');
    }, 1500);
}

function triggerRedScreen() {
    document.body.classList.remove('correct-answer');
    document.body.classList.add('hacked');
}

function getAudioContext() {
    let AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
        return new AudioContextClass();
    }
    return null;
}

let audioCtx = null;

function playSound(type) {
    try {
        if (!audioCtx) audioCtx = getAudioContext();
        if (audioCtx && audioCtx.state === 'suspended') { audioCtx.resume(); }
        if (!audioCtx) return;

        let osc = audioCtx.createOscillator();
        let gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);

        if (type === 'success') {
            osc.frequency.setValueAtTime(587.33, audioCtx.currentTime);
            osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.1);
            gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.4);
        } else {
            osc.frequency.setValueAtTime(200, audioCtx.currentTime);
            osc.frequency.setValueAtTime(130, audioCtx.currentTime + 0.15);
            gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.5);
        }
    } catch(e) { console.log("Audio non supporté ou bloqué"); }
}

async function chargerDonnees() {
    try {
        let res = await fetch('indices.json');
        let data = await res.json();
        let baseAffaires = data.affaires;

        let ver = localStorage.getItem('cyber_version_cache');
        if (ver !== 'v17_reset') {
            toutesLesAffaires = baseAffaires;
            localStorage.setItem('cyber_toutes_affaires', JSON.stringify(toutesLesAffaires));
            localStorage.setItem('cyber_version_cache', 'v17_reset');
        } else {
            let customAffaires = localStorage.getItem('cyber_toutes_affaires');
            if (customAffaires) {
                toutesLesAffaires = JSON.parse(customAffaires);
            } else {
                toutesLesAffaires = baseAffaires;
                localStorage.setItem('cyber_toutes_affaires', JSON.stringify(toutesLesAffaires));
            }
        }

        afficherSelecteurAffaires();
    } catch (e) { console.error("Erreur chargement JSON", e); }
}

function reinitialiserDonneesParDefaut() {
    if (confirm("Voulez-vous réinitialiser toutes les affaires par défaut pour appliquer les dernières mises à jour ?")) {
        localStorage.removeItem('cyber_toutes_affaires');
        localStorage.removeItem('cyber_version_cache');
        chargerDonnees();
    }
}

chargerDonnees();

function afficherSelecteurAffaires() {
    let container = document.getElementById('levels-container');
    container.innerHTML = "";
    toutesLesAffaires.forEach((aff, index) => {
        let card = document.createElement('div');
        card.className = 'level-card';
        card.innerHTML = `
            <h3 style="color:var(--accent); margin-bottom:8px;">${aff.nom}</h3>
            <p style="color: var(--muted); font-size: 0.85rem; margin-bottom: 12px;">${aff.description}</p>
            <div style="display:flex; gap:10px;">
                <button class="btn" style="margin-top:0; padding:6px 12px; font-size:0.8rem;" onclick="event.stopPropagation(); preparerAffaire('${aff.id}')">🕵️‍♂️ Enquêter</button>
                <button class="btn btn-success" style="margin-top:0; padding:6px 12px; font-size:0.8rem;" onclick="event.stopPropagation(); ouvrirEditeur(${index})">✏️ Modifier</button>
            </div>
        `;
        card.onclick = () => preparerAffaire(aff.id);
        container.appendChild(card);
    });
    document.getElementById('level-select-screen').style.display = 'flex';
}

function preparerAffaire(id) {
    affaireEnAttente = toutesLesAffaires.find(a => a.id === id);
    document.getElementById('briefing-title').innerText = `💡 ${affaireEnAttente.nom}`;
    document.getElementById('briefing-text').innerText = affaireEnAttente.briefing || "Analysez chaque indice avec calme et méthode.";
    document.getElementById('briefing-modal').style.display = 'flex';
}

function lancerMissionApresBriefing() {
    document.getElementById('briefing-modal').style.display = 'none';
    affaireActuelle = affaireEnAttente;
    document.getElementById('level-select-screen').style.display = 'none';
    document.getElementById('current-level-title').innerText = `🖥️ ${affaireActuelle.nom}`;
    initialiserApplication();
}

function ouvrirCreateurNouveau() {
    document.getElementById('edit-aff-index').value = "-1";
    document.getElementById('creator-modal-title').innerText = "⚙️ Créer une Nouvelle Affaire";
    document.getElementById('edit-aff-id').value = "affaire-" + Date.now();
    document.getElementById('edit-aff-nom').value = "";
    document.getElementById('edit-aff-desc').value = "";
    document.getElementById('edit-aff-brief').value = "";
    
    document.getElementById('edit-aff-emails').value = `[
  {
    "id": 1,
    "sujet": "Sujet suspect",
    "expediteur": "alerte@domaine.com",
    "message": "Corps du message...",
    "estPiege": true,
    "explication": "Explication pédagogique..."
  }
]`;

    document.getElementById('edit-aff-social').value = `[
  {
    "titre": "Scénario social",
    "contenu": "Post...",
    "question": "Question?",
    "options": [
      {"texte": "Mauvaise réponse", "correct": false},
      {"texte": "Bonne réponse", "correct": true}
    ],
    "explication": "Explication..."
  }
]`;

    document.getElementById('edit-aff-sites').value = `[
  {
    "url": "https://www.site.fr",
    "nom": "Site Web",
    "estSecurise": true,
    "indices": ["HTTPS"]
  }
]`;

    document.getElementById('edit-aff-chat').value = `[
  {
    "expediteur": "Contact",
    "message": "Message...",
    "estSuspect": true,
    "conseil": "Conseil..."
  }
]`;

    document.getElementById('creator-modal').style.display = 'flex';
}

function ouvrirEditeur(index) {
    let aff = toutesLesAffaires[index];
    document.getElementById('edit-aff-index').value = index;
    document.getElementById('creator-modal-title').innerText = `⚙️ Modifier : ${aff.nom}`;
    document.getElementById('edit-aff-id').value = aff.id;
    document.getElementById('edit-aff-nom').value = aff.nom;
    document.getElementById('edit-aff-desc').value = aff.description;
    document.getElementById('edit-aff-brief').value = aff.briefing || "";
    document.getElementById('edit-aff-emails').value = JSON.stringify(aff.emails || [], null, 2);
    document.getElementById('edit-aff-social').value = JSON.stringify(aff.reseauSocialScenarios || [], null, 2);
    document.getElementById('edit-aff-sites').value = JSON.stringify(aff.sitesWeb || [], null, 2);
    document.getElementById('edit-aff-chat').value = JSON.stringify(aff.chatMessages || [], null, 2);
    document.getElementById('creator-modal').style.display = 'flex';
}

function fermerCreateur() {
    document.getElementById('creator-modal').style.display = 'none';
}

function enregistrerAffaireEditee() {
    let index = parseInt(document.getElementById('edit-aff-index').value);
    try {
        let emailsObj = JSON.parse(document.getElementById('edit-aff-emails').value);
        let socialObj = JSON.parse(document.getElementById('edit-aff-social').value);
        let sitesObj = JSON.parse(document.getElementById('edit-aff-sites').value);
        let chatObj = JSON.parse(document.getElementById('edit-aff-chat').value);

        let affaireModifiee = {
            id: document.getElementById('edit-aff-id').value || "custom-" + Date.now(),
            nom: document.getElementById('edit-aff-nom').value || "Affaire sans nom",
            description: document.getElementById('edit-aff-desc').value || "",
            briefing: document.getElementById('edit-aff-brief').value || "",
            suspect: "Personnalisé",
            emails: emailsObj,
            reseauSocialScenarios: socialObj,
            sitesWeb: sitesObj,
            chatMessages: chatObj
        };

        if (index === -1) {
            toutesLesAffaires.push(affaireModifiee);
        } else {
            toutesLesAffaires[index] = affaireModifiee;
        }

        localStorage.setItem('cyber_toutes_affaires', JSON.stringify(toutesLesAffaires));
        alert("✨ Affaire enregistrée avec succès !");
        fermerCreateur();
        afficherSelecteurAffaires();
    } catch (e) {
        alert("❌ Erreur de syntaxe JSON dans l'un des champs ! Vérifiez vos accolades et guillemets.\n\nDétail : " + e.message);
    }
}

function retourNiveaux() {
    document.querySelectorAll('.window').forEach(w => w.classList.remove('active'));
    document.getElementById('level-select-screen').style.display = 'flex';
}

function openWindow(id) { document.getElementById(id).classList.add('active'); }
function closeWindow(id) { document.getElementById(id).classList.remove('active'); }

function initialiserApplication() {
    let emailContainer = document.getElementById('email-list-container');
    emailContainer.innerHTML = "";
    document.getElementById('email-detail').style.display = 'none';
    
    if (affaireActuelle.emails) {
        affaireActuelle.emails.forEach((mail, idx) => {
            let card = document.createElement('div');
            card.className = 'card';
            card.innerHTML = `<strong>${mail.sujet}</strong><br><span style="font-size:0.8rem; color:var(--muted);">${mail.expediteur}</span>`;
            card.onclick = () => afficherDetailEmail(idx);
            emailContainer.appendChild(card);
        });
    }

    let socialContainer = document.getElementById('social-content-area');
    socialContainer.innerHTML = "";
    if (affaireActuelle.reseauSocialScenarios) {
        affaireActuelle.reseauSocialScenarios.forEach((scen) => {
            let div = document.createElement('div');
            div.className = 'card';
            div.innerHTML = `<h3>${scen.titre}</h3><p style="font-style:italic; margin:10px 0;">"${scen.contenu}"</p><p><strong>${scen.question}</strong></p>`;
            scen.options.forEach((opt) => {
                let btn = document.createElement('button');
                btn.className = 'btn';
                btn.style.display = 'block';
                btn.style.width = '100%';
                btn.style.textAlign = 'left';
                btn.style.marginTop = '8px';
                btn.innerText = opt.texte;
                btn.onclick = () => verifierSocial(opt.correct, scen.explication);
                div.appendChild(btn);
            });
            socialContainer.appendChild(div);
        });
    }

    let browserContainer = document.getElementById('browser-container');
    browserContainer.innerHTML = "";
    if (affaireActuelle.sitesWeb) {
        affaireActuelle.sitesWeb.forEach((site, index) => {
            let div = document.createElement('div');
            div.className = 'card';
            let boutonsHtml = "";
            if (site.estSecurise) {
                boutonsHtml = `<button class="btn btn-success" id="browser-btn-safe-${index}">✅ Noté Sûr</button>`;
            } else {
                boutonsHtml = `
                    <button class="btn btn-danger" id="browser-btn-trap-${index}">🚨 Piège (Phishing)</button>
                    <button class="btn btn-success" style="margin-left: 10px;" id="browser-btn-trust-${index}">🤝 Je fais confiance</button>
                `;
            }
            div.innerHTML = `<strong>${site.nom}</strong><br><code style="color:var(--accent);">${site.url}</code><br><br>` + boutonsHtml;
            browserContainer.appendChild(div);

            setTimeout(() => {
                if (site.estSecurise) {
                    let btnSafe = document.getElementById(`browser-btn-safe-${index}`);
                    if (btnSafe) btnSafe.onclick = () => jugerSite(true);
                } else {
                    let btnTrap = document.getElementById(`browser-btn-trap-${index}`);
                    let btnTrust = document.getElementById(`browser-btn-trust-${index}`);
                    if (btnTrap) btnTrap.onclick = () => jugerSite(false);
                    if (btnTrust) btnTrust.onclick = () => jugerSiteFaisConfiance(false);
                }
            }, 0);
        });
    }

    let chatContainer = document.getElementById('chat-container-area');
    chatContainer.innerHTML = "";
    if (affaireActuelle.chatMessages) {
        affaireActuelle.chatMessages.forEach((msg, index) => {
            let div = document.createElement('div');
            div.className = 'card';
            div.innerHTML = `
                <strong>Message de ${msg.expediteur} :</strong>
                <p style="margin:10px 0; background:rgba(0,0,0,0.2); padding:10px; border-radius:6px;">"${msg.message}"</p>
                <div style="display:flex; gap:10px;">
                    <button class="btn btn-success" id="chat-btn-trust-${index}">🤝 Je fais confiance</button>
                    <button class="btn btn-danger" id="chat-btn-distrust-${index}">⛔ Je ne fais pas confiance</button>
                </div>
            `;
            chatContainer.appendChild(div);

            setTimeout(() => {
                let btnTrust = document.getElementById(`chat-btn-trust-${index}`);
                let btnDistrust = document.getElementById(`chat-btn-distrust-${index}`);

                if (btnTrust) {
                    btnTrust.onclick = function() {
                        jugerChat(false, msg.estSuspect, msg.conseil);
                    };
                }
                if (btnDistrust) {
                    btnDistrust.onclick = function() {
                        jugerChat(true, msg.estSuspect, msg.conseil);
                    };
                }
            }, 0);
        });
    }
}

function afficherDetailEmail(idx) {
    mailActif = affaireActuelle.emails[idx];
    document.getElementById('email-detail').style.display = 'block';
    document.getElementById('mail-sujet').innerText = mailActif.sujet;
    document.getElementById('mail-expediteur').innerText = "De : " + mailActif.expediteur;
    document.getElementById('mail-body').innerText = `"${mailActif.message}"`;
    document.getElementById('mail-feedback').style.display = 'none';
}

function jugerEmail(choixPiege) {
    let fb = document.getElementById('mail-feedback');
    if (choixPiege === mailActif.estPiege) {
        triggerGreenScreen();
        playSound('success');
        fb.className = "feedback success";
        fb.innerHTML = `🎯 <strong>Bonne réponse ! (+15 pts)</strong> ${mailActif.explication}`;
        score += 15;
    } else {
        triggerRedScreen();
        playSound('error');
        fb.className = "feedback error";
        fb.innerHTML = `❌ <strong>Erreur ! Mauvais choix (-10 pts) !</strong>`;
        score = Math.max(0, score - 10);
    }
    document.getElementById('score').innerText = score;
}

function verifierSocial(estCorrect, explications) {
    if (estCorrect) {
        triggerGreenScreen();
        playSound('success');
        alert("🎯 Bonne réponse ! (+15 pts) " + explications);
        score += 15;
    } else {
        triggerRedScreen();
        playSound('error');
        alert("❌ Erreur ! Mauvais choix (-10 pts), attention aux pièges !");
        score = Math.max(0, score - 10);
    }
    document.getElementById('score').innerText = score;
}

function jugerSite(estSecurise) {
    if (estSecurise) {
        triggerGreenScreen();
        playSound('success');
        alert("🎯 Bonne réponse ! (+15 pts) Ce site est parfaitement sécurisé et officiel.");
        score += 15;
    } else {
        triggerGreenScreen();
        playSound('success');
        alert("🎯 Bonne réponse ! (+15 pts) Vous avez bien identifié qu'il s'agissait d'un piège de Phishing.");
        score += 15;
    }
    document.getElementById('score').innerText = score;
}

function jugerSiteFaisConfiance(estSecurise) {
    if (!estSecurise) {
        triggerRedScreen();
        playSound('error');
        alert("❌ Erreur ! (-10 pts) Ce site était un piège de Phishing, il ne fallait pas lui faire confiance !");
        score = Math.max(0, score - 10);
    } else {
        triggerGreenScreen();
        playSound('success');
        alert("🎯 Bonne réponse ! (+15 pts) Ce site est sûr.");
        score += 15;
    }
    document.getElementById('score').innerText = score;
}

function jugerChat(choixMefiance, estSuspect, conseil) {
    let estCorrect = (choixMefiance === estSuspect);
    if (estCorrect) {
        triggerGreenScreen();
        playSound('success');
        alert("🎯 Bonne réponse ! (+15 pts) " + (estSuspect ? "Piège détecté : " + conseil : "Ce contact est sûr et légitime."));
        score += 15;
    } else {
        triggerRedScreen();
        playSound('error');
        alert("❌ Erreur ! (-10 pts) " + (estSuspect ? "Attention, ce message était un piège !" : "Vous avez douté à tort d'un contact sûr."));
        score = Math.max(0, score - 10);
    }
    document.getElementById('score').innerText = score;
}
