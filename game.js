document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');
  let drawing = false;
  let score = 0;
  let path = [];
  let startTime, endTime;
  let penaltyLength = 0; // Longueur totale des segments sous tolérance
  const center = {
    x: canvas.width / 2,
    y: canvas.height / 2
  };
  const tolerance = 4; // Tolérance en pixels
  const toleranceCenter = 20; // Tolérance en pixels

  function getEventPosition(e) {
    if (e.touches) {
      e.preventDefault(); // Empêche le scrolling sur les appareils tactiles
      return {
        x: e.touches[0].clientX - canvas.offsetLeft,
        y: e.touches[0].clientY - canvas.offsetTop
      };
    } else {
      return {
        x: e.clientX - canvas.offsetLeft,
        y: e.clientY - canvas.offsetTop
      };
    }
  }

  function showToast(message) {
    const toastContainer = document.getElementById('toastContainer');
    const toastMessage = document.createElement('div');
    toastMessage.classList.add('toastMessage');
    toastMessage.textContent = message;
    toastContainer.appendChild(toastMessage);

    // Supprimer le toast après 4 secondes
    setTimeout(() => {
        toastMessage.classList.add('fadeOut');
        toastMessage.addEventListener('animationend', () => {
            toastMessage.remove();
        });
    }, 5000);
  }

  function drawCenter() {
    ctx.beginPath();
    ctx.arc(center.x, center.y, 3, 0, 2 * Math.PI, false); // Dessine un petit cercle pour marquer le centre
    ctx.fillStyle = 'black';
    ctx.fill();
  }

  function startDrawing(e) {
    ctx.clearRect(0, 0, canvas.width, canvas.height); // Prêt pour une nouvelle spirale
    drawCenter(); // Assurez-vous que le centre est toujours visible
    const pos = getEventPosition(e);
    const distance = distanceFromCenter(pos);
    if (distance > toleranceCenter) { // Utilisez 'tolerance' ou une autre valeur limite spécifique
        drawing = false; // Empêche de commencer à dessiner si trop loin
        showToast("Veuillez commencer plus près du centre.");
        return; // Sort de la fonction
    }
    drawing = true;
    path = [pos];
    penaltyLength = 0;
    startTime = Date.now();
}

  function draw(e) {
    if (!drawing) return;
    const pos = getEventPosition(e);
    if (!isPointWithinBounds(pos)) return;
    const lastPoint = path[path.length - 1];
    const newDistance = distanceFromCenter(pos);
    const lastDistance = distanceFromCenter(lastPoint);
    if (newDistance < lastDistance - tolerance) {
      drawSegment(lastPoint, pos, 'red');
      penaltyLength += Math.sqrt((pos.x - lastPoint.x) ** 2 + (pos.y - lastPoint.y) ** 2);
    } else {
      drawSegment(lastPoint, pos, 'black');
    }
    path.push(pos);
  }

  function stopDrawing() {
    if (drawing) {
      drawing = false;
      endTime = Date.now();
      let drawingDuration = (endTime - startTime) / 1000; // Durée en secondes
      let pathLength = calculatePathLength(path);
      let tolerancePenalty = Math.round(penaltyLength);
      let timePenalty = Math.max(0, drawingDuration - 2); // Aucune pénalité pour les dessins de moins de 5 secondes
      let timePenaltyPoints = Math.round(timePenalty * 100); // Réduction du score de 10 points par seconde au-delà de 5 secondes
      let finalScore = pathLength - tolerancePenalty - timePenaltyPoints;
      finalScore = Math.round(Math.max(finalScore, 0)); // Assurez-vous que le score final n'est pas négatif

      if (validateNoIntersection(path)) {
        document.getElementById('score').innerText = `Score: ${finalScore} (Tolérance: -${tolerancePenalty}, Temps: -${timePenaltyPoints})`;
        updateHighScores(finalScore);
        displayHighScores();
      } else {
        showToast('Spirale non valide! Des segments se croisent.');
      }

    }
  }

  function distanceFromCenter(point) {
    return Math.sqrt((point.x - center.x) ** 2 + (point.y - center.y) ** 2);
  }

  function isPointWithinBounds(point) {
    return distanceFromCenter(point) <= Math.min(canvas.width, canvas.height) / 2;
  }

  function drawSegment(from, to, color) {
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.strokeStyle = color;
    ctx.stroke();
  }

  function calculatePathLength(path) {
    let length = 0;
    for (let i = 1; i < path.length; i++) {
      let dx = path[i].x - path[i - 1].x;
      let dy = path[i].y - path[i - 1].y;
      length += Math.sqrt(dx * dx + dy * dy);
    }
    return length;
  }


  function segmentsIntersect(p0, p1, p2, p3) {
    function ccw(A, B, C) {
      return (C.y - A.y) * (B.x - A.x) > (B.y - A.y) * (C.x - A.x);
    }
    return ccw(p0, p2, p3) !== ccw(p1, p2, p3) && ccw(p0, p1, p2) !== ccw(p0, p1, p3);
  }

  function validateNoIntersection(path) {
    for (let i = 0; i < path.length - 3; i++) { // -3 pour éviter de vérifier avec le segment directement adjacent
      for (let j = i + 2; j < path.length - 1; j++) {
        if (segmentsIntersect(path[i], path[i + 1], path[j], path[j + 1])) {
          return false;
        }
      }
    }
    return true;
  }

  function displayHighScores() {
    let highScores = JSON.parse(localStorage.getItem('highScores')) || [];
    let highScoresList = document.getElementById('highScoresList');

    // Vérifier si l'élément existe et le nettoyer avant d'ajouter les nouveaux scores
    if (highScoresList) {
      highScoresList.innerHTML = ''; // Nettoyer la liste existante

      // Créer et ajouter un élément de liste pour chaque high score
      highScores.forEach((score, index) => {
        let scoreElement = document.createElement('li');
        scoreElement.innerText = `#${index + 1} - ${score}`;
        highScoresList.appendChild(scoreElement);
      });
    }
  }

  function clearHighScores() {
    // Effacer les high scores de localStorage
    localStorage.removeItem('highScores');

    // Mettre à jour l'affichage pour refléter la suppression
    displayHighScores();
  }



  function updateHighScores(newScore) {
    // Récupérer les high scores existants ou initialiser un tableau vide
    let highScores = JSON.parse(localStorage.getItem('highScores')) || [];

    // Ajouter le nouveau score
    highScores.push(newScore);

    // Trier le tableau pour avoir les meilleurs scores en premier
    highScores.sort((a, b) => b - a);

    // Garder uniquement les 10 meilleurs scores
    highScores = highScores.slice(0, 10);

    // Sauvegarder les high scores mis à jour dans localStorage
    localStorage.setItem('highScores', JSON.stringify(highScores));
  }

  function resizeCanvas() {
    const maxWidth = Math.min(window.innerWidth, 600); // Limite la largeur à 600px ou moins si l'écran est plus petit
    canvas.width = maxWidth;
    canvas.height = maxWidth * (canvas.height / canvas.width); // Conserve les proportions
}

window.addEventListener('load', resizeCanvas);
window.addEventListener('resize', resizeCanvas);


  canvas.addEventListener('mousedown', startDrawing);
  canvas.addEventListener('mousemove', draw);
  canvas.addEventListener('mouseup', stopDrawing);
  canvas.addEventListener('mouseout', stopDrawing);

  canvas.addEventListener('touchstart', startDrawing);
  canvas.addEventListener('touchmove', draw);
  canvas.addEventListener('touchend', stopDrawing);

  document.getElementById('clearHighScoresButton').addEventListener('click', clearHighScores);

  document.getElementById('burgerMenuButton').addEventListener('click', function() {
    var menu = document.getElementById('highScoresMenu');
    if (menu.style.display === 'block') {
      menu.style.display = 'none';
    } else {
      menu.style.display = 'block';
    }
  });
});
