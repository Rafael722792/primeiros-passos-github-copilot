document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API and refresh the view
  async function fetchActivities() {
    try {
      // Mostrar indicador de carregamento
      activitiesList.innerHTML = "<p>Carregando atividades...</p>";
      
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message and reset select options
      activitiesList.innerHTML = "";
      // Manter apenas a opção padrão e limpar as demais
      activitySelect.innerHTML = '<option value="">-- Selecione uma atividade --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        // Participantes formatados como lista
        let participantsSection = "";
        if (details.participants.length > 0) {
          participantsSection = `
            <div class="participants-section">
              <strong>Participantes:</strong>
              <ul class="participants-list">
                ${details.participants.map(email => `
                  <li>
                    ${email}
                    <button class="delete-participant" data-activity="${name}" data-email="${email}">×</button>
                  </li>`).join("")}
              </ul>
            </div>
          `;
        } else {
          participantsSection = `
            <div class="participants-section">
              <strong>Participantes:</strong>
              <span class="no-participants">Nenhum inscrito ainda.</span>
            </div>
          `;
        }

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Agenda:</strong> ${details.schedule}</p>
          <p><strong>Disponibilidade:</strong> ${spotsLeft} vagas disponíveis</p>
          ${participantsSection}
        `;

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Falha ao carregar atividades. Por favor, tente novamente mais tarde.</p>";
      console.error("Erro ao buscar atividades:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;
    
    // Mostrar mensagem de carregamento
    messageDiv.textContent = "Processando inscrição...";
    messageDiv.className = "message info";
    messageDiv.classList.remove("hidden");
    
    // Desabilitar o botão de submit durante o processamento
    const submitButton = signupForm.querySelector("button[type='submit']");
    submitButton.disabled = true;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "message success";
        signupForm.reset();
        // Refresh the activities list after a successful signup
        // Pequeno atraso para garantir que o servidor processou a requisição completamente
        setTimeout(() => {
          fetchActivities();
        }, 300);
      } else {
        messageDiv.textContent = result.detail || "Ocorreu um erro";
        messageDiv.className = "message error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
      
      // Reativar o botão
      submitButton.disabled = false;
    } catch (error) {
      messageDiv.textContent = "Falha na inscrição. Por favor, tente novamente.";
      messageDiv.className = "message error";
      messageDiv.classList.remove("hidden");
      console.error("Erro na inscrição:", error);
      
      // Reativar o botão em caso de erro
      submitButton.disabled = false;
    }
  });

  // Handle delete participant button clicks
  activitiesList.addEventListener("click", async (event) => {
    if (event.target.classList.contains("delete-participant")) {
      const email = event.target.dataset.email;
      const activity = event.target.dataset.activity;
      const deleteButton = event.target;
      
      if (confirm(`Tem certeza que deseja remover ${email} da atividade "${activity}"?`)) {
        // Desabilitar o botão durante o processamento
        deleteButton.disabled = true;
        
        // Mostrar mensagem de carregamento
        messageDiv.textContent = "Removendo participante...";
        messageDiv.className = "message info";
        messageDiv.classList.remove("hidden");
        
        try {
          const response = await fetch(
            `/activities/${encodeURIComponent(activity)}/participant/${encodeURIComponent(email)}`,
            {
              method: "DELETE",
            }
          );

          const result = await response.json();

          if (response.ok) {
            messageDiv.textContent = result.message;
            messageDiv.className = "message success";
            // Refresh the activities list with a small delay
            setTimeout(() => {
              fetchActivities();
            }, 300);
          } else {
            messageDiv.textContent = result.detail || "Ocorreu um erro";
            messageDiv.className = "message error";
          }

          messageDiv.classList.remove("hidden");

          // Hide message after 5 seconds
          setTimeout(() => {
            messageDiv.classList.add("hidden");
          }, 5000);
          
          // Reativar o botão se a operação falhar (não é necessário se for bem-sucedida, pois o elemento será removido)
          if (!response.ok) {
            deleteButton.disabled = false;
          }
        } catch (error) {
          messageDiv.textContent = "Falha ao remover participante. Por favor, tente novamente.";
          messageDiv.className = "message error";
          messageDiv.classList.remove("hidden");
          console.error("Erro ao remover participante:", error);
          
          // Reativar o botão em caso de erro
          deleteButton.disabled = false;
        }
      }
    }
  });

  // Initialize app
  fetchActivities();
});
